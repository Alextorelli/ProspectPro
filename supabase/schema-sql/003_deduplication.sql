-- ProspectPro Production Schema - User Campaign Deduplication

CREATE TABLE IF NOT EXISTS public.user_campaign_results (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  session_user_id TEXT,
  campaign_hash TEXT NOT NULL,
  business_identifier TEXT NOT NULL,
  served_at TIMESTAMPTZ DEFAULT NOW(),
  campaign_id TEXT REFERENCES public.campaigns(id),
  business_name TEXT,
  business_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_campaign_results
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS session_user_id TEXT,
  ADD COLUMN IF NOT EXISTS campaign_hash TEXT,
  ADD COLUMN IF NOT EXISTS business_identifier TEXT,
  ADD COLUMN IF NOT EXISTS served_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS campaign_id TEXT REFERENCES public.campaigns(id),
  ADD COLUMN IF NOT EXISTS business_name TEXT,
  ADD COLUMN IF NOT EXISTS business_address TEXT,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE public.user_campaign_results
  ALTER COLUMN campaign_hash SET NOT NULL,
  ALTER COLUMN business_identifier SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uniq_user_campaign_results_user_hash
  ON public.user_campaign_results(user_id, campaign_hash, business_identifier)
  WHERE user_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uniq_user_campaign_results_session_hash
  ON public.user_campaign_results(session_user_id, campaign_hash, business_identifier)
  WHERE user_id IS NULL AND session_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_user_campaign_results_user_hash
  ON public.user_campaign_results(user_id, campaign_hash)
  WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_user_campaign_results_session_hash
  ON public.user_campaign_results(session_user_id, campaign_hash)
  WHERE user_id IS NULL AND session_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_user_campaign_results_business_id
  ON public.user_campaign_results(business_identifier);
CREATE INDEX IF NOT EXISTS idx_user_campaign_results_served_at
  ON public.user_campaign_results(served_at);

ALTER TABLE public.user_campaign_results ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "user_campaign_results_user_access" ON public.user_campaign_results;
DROP POLICY IF EXISTS "user_campaign_results_session_access" ON public.user_campaign_results;

CREATE POLICY "user_campaign_results_user_access" ON public.user_campaign_results
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_campaign_results_session_access" ON public.user_campaign_results
  FOR ALL TO anon USING (
    user_id IS NULL AND session_user_id IS NOT NULL AND session_user_id = auth.jwt() ->> 'session_id'
  ) WITH CHECK (
    user_id IS NULL AND session_user_id IS NOT NULL AND session_user_id = auth.jwt() ->> 'session_id'
  );

CREATE OR REPLACE FUNCTION public.generate_campaign_hash(
  business_type TEXT,
  location TEXT,
  min_confidence_score INTEGER DEFAULT 50
)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
BEGIN
  RETURN encode(digest(
    COALESCE(business_type, '') || '|' || COALESCE(location, '') || '|' || COALESCE(min_confidence_score, 50)::TEXT,
    'sha256'
  ), 'base64');
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_business_identifier(
  business_name TEXT,
  business_address TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
BEGIN
  RETURN encode(digest(
    COALESCE(business_name, '') || '|' || COALESCE(business_address, ''),
    'sha256'
  ), 'base64');
END;
$$;

CREATE OR REPLACE FUNCTION public.filter_already_served_businesses(
  p_user_id UUID,
  p_session_user_id TEXT,
  p_campaign_hash TEXT,
  p_business_identifiers TEXT[]
)
RETURNS TEXT[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  served_identifiers TEXT[] := ARRAY[]::TEXT[];
BEGIN
  IF p_user_id IS NOT NULL THEN
    SELECT ARRAY_AGG(business_identifier)
      INTO served_identifiers
    FROM public.user_campaign_results
    WHERE user_id = p_user_id
      AND campaign_hash = p_campaign_hash
      AND business_identifier = ANY(p_business_identifiers);
  ELSIF p_session_user_id IS NOT NULL THEN
    SELECT ARRAY_AGG(business_identifier)
      INTO served_identifiers
    FROM public.user_campaign_results
    WHERE session_user_id = p_session_user_id
      AND campaign_hash = p_campaign_hash
      AND business_identifier = ANY(p_business_identifiers);
  ELSE
    RETURN p_business_identifiers;
  END IF;

  RETURN (
    SELECT COALESCE(ARRAY_AGG(identifier), ARRAY[]::TEXT[])
    FROM unnest(p_business_identifiers) AS identifier
    WHERE identifier != ALL(COALESCE(served_identifiers, ARRAY[]::TEXT[]))
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.record_served_businesses(
  p_user_id UUID,
  p_session_user_id TEXT,
  p_campaign_hash TEXT,
  p_campaign_id TEXT,
  p_businesses JSONB
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  business_record JSONB;
  inserted_count INTEGER := 0;
BEGIN
  FOR business_record IN SELECT * FROM jsonb_array_elements(p_businesses)
  LOOP
    BEGIN
      INSERT INTO public.user_campaign_results (
        user_id,
        session_user_id,
        campaign_hash,
        business_identifier,
        campaign_id,
        business_name,
        business_address
      ) VALUES (
        p_user_id,
        p_session_user_id,
        p_campaign_hash,
        business_record ->> 'identifier',
        p_campaign_id,
        business_record ->> 'name',
        business_record ->> 'address'
      );
      inserted_count := inserted_count + 1;
    EXCEPTION WHEN unique_violation THEN
      CONTINUE;
    END;
  END LOOP;

  RETURN inserted_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_usage_stats(
  target_user_id UUID DEFAULT NULL,
  target_session_user_id TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  effective_user_id UUID := target_user_id;
  effective_session_id TEXT := target_session_user_id;
  campaigns_count INTEGER := 0;
  leads_count INTEGER := 0;
  exports_count INTEGER := 0;
  total_cost DECIMAL(10,4) := 0;
  month_campaigns INTEGER := 0;
  month_cost DECIMAL(10,4) := 0;
  last_activity TIMESTAMPTZ;
  dedup_savings INTEGER := 0;
BEGIN
  IF effective_user_id IS NULL THEN
    effective_user_id := auth.uid();
  END IF;

  IF effective_session_id IS NULL THEN
    effective_session_id := public.current_session_identifier();
  END IF;

  SELECT
    COUNT(DISTINCT c.id),
    COUNT(l.id),
    COALESCE(SUM(c.total_cost), 0),
    COUNT(DISTINCT c.id) FILTER (WHERE c.created_at >= date_trunc('month', NOW())),
    COALESCE(SUM(c.total_cost) FILTER (WHERE c.created_at >= date_trunc('month', NOW())), 0),
    MAX(c.created_at)
  INTO campaigns_count, leads_count, total_cost, month_campaigns, month_cost, last_activity
  FROM public.campaigns c
  LEFT JOIN public.leads l ON l.campaign_id = c.id
  WHERE (
    effective_user_id IS NOT NULL AND c.user_id = effective_user_id
  ) OR (
    effective_user_id IS NULL AND effective_session_id IS NOT NULL AND c.session_user_id = effective_session_id
  );

  SELECT COUNT(*) INTO exports_count
  FROM public.dashboard_exports de
  WHERE (
    effective_user_id IS NOT NULL AND de.user_id = effective_user_id
  ) OR (
    effective_user_id IS NULL AND effective_session_id IS NOT NULL AND de.session_user_id = effective_session_id
  );

  SELECT COUNT(*) INTO dedup_savings
  FROM public.user_campaign_results ucr
  WHERE (
    effective_user_id IS NOT NULL AND ucr.user_id = effective_user_id
  ) OR (
    effective_user_id IS NULL AND effective_session_id IS NOT NULL AND ucr.session_user_id = effective_session_id
  );

  RETURN jsonb_build_object(
    'user_id', effective_user_id,
    'session_user_id', effective_session_id,
    'total_campaigns', campaigns_count,
    'total_leads_generated', leads_count,
    'total_exports', exports_count,
    'total_cost', total_cost,
    'current_month_campaigns', month_campaigns,
    'current_month_cost', month_cost,
    'last_activity', last_activity,
    'deduplication_saves', dedup_savings,
    'fresh_results_guaranteed', true,
    'timestamp', NOW()
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.cleanup_old_deduplication_records(
  days_to_keep INTEGER DEFAULT 90
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.user_campaign_results
  WHERE served_at < NOW() - (days_to_keep || ' days')::INTERVAL;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

GRANT ALL ON public.user_campaign_results TO postgres, authenticated, service_role;
GRANT SELECT, INSERT ON public.user_campaign_results TO anon;
GRANT EXECUTE ON FUNCTION public.generate_campaign_hash(TEXT, TEXT, INTEGER) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.generate_business_identifier(TEXT, TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.filter_already_served_businesses(UUID, TEXT, TEXT, TEXT[]) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.record_served_businesses(UUID, TEXT, TEXT, TEXT, JSONB) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_user_usage_stats(UUID, TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.cleanup_old_deduplication_records(INTEGER) TO service_role;
