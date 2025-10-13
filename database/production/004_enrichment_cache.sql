-- ProspectPro Production Schema - Enrichment Cache & Analytics

CREATE TABLE IF NOT EXISTS public.enrichment_cache (
  id BIGSERIAL PRIMARY KEY,
  cache_key TEXT NOT NULL UNIQUE,
  request_type TEXT NOT NULL,
  request_params JSONB NOT NULL,
  response_data JSONB NOT NULL,
  cost DECIMAL(10,4) DEFAULT 0,
  confidence_score INTEGER DEFAULT 0,
  hit_count INTEGER DEFAULT 1,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_accessed_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

ALTER TABLE public.enrichment_cache
  ADD COLUMN IF NOT EXISTS cache_key TEXT,
  ADD COLUMN IF NOT EXISTS request_type TEXT,
  ADD COLUMN IF NOT EXISTS request_params JSONB,
  ADD COLUMN IF NOT EXISTS response_data JSONB,
  ADD COLUMN IF NOT EXISTS cost DECIMAL(10,4) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS confidence_score INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS hit_count INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS last_accessed_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

ALTER TABLE public.enrichment_cache
  ALTER COLUMN cache_key SET NOT NULL,
  ALTER COLUMN request_type SET NOT NULL,
  ALTER COLUMN request_params SET NOT NULL,
  ALTER COLUMN response_data SET NOT NULL,
  ALTER COLUMN expires_at SET NOT NULL;

CREATE TABLE IF NOT EXISTS public.enrichment_cache_stats (
  id BIGSERIAL PRIMARY KEY,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  request_type TEXT NOT NULL,
  total_requests INTEGER DEFAULT 0,
  cache_hits INTEGER DEFAULT 0,
  cache_misses INTEGER DEFAULT 0,
  cost_saved DECIMAL(10,4) DEFAULT 0,
  total_cost DECIMAL(10,4) DEFAULT 0,
  hit_ratio DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(date, request_type)
);

ALTER TABLE public.enrichment_cache_stats
  ADD COLUMN IF NOT EXISTS date DATE DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS request_type TEXT,
  ADD COLUMN IF NOT EXISTS total_requests INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cache_hits INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cache_misses INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cost_saved DECIMAL(10,4) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_cost DECIMAL(10,4) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS hit_ratio DECIMAL(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE public.enrichment_cache_stats
  ALTER COLUMN date SET NOT NULL,
  ALTER COLUMN request_type SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_enrichment_cache_key ON public.enrichment_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_enrichment_cache_type ON public.enrichment_cache(request_type);
CREATE INDEX IF NOT EXISTS idx_enrichment_cache_expires ON public.enrichment_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_enrichment_cache_active ON public.enrichment_cache(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_enrichment_cache_created ON public.enrichment_cache(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_cache_stats_date ON public.enrichment_cache_stats(date);
CREATE INDEX IF NOT EXISTS idx_cache_stats_type ON public.enrichment_cache_stats(request_type);

ALTER TABLE public.enrichment_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrichment_cache_stats ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role can manage enrichment cache" ON public.enrichment_cache;
DROP POLICY IF EXISTS "Service role can manage cache stats" ON public.enrichment_cache_stats;

CREATE POLICY "enrichment_cache_service_access" ON public.enrichment_cache
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "enrichment_cache_stats_service_access" ON public.enrichment_cache_stats
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.generate_cache_key(
  p_request_type TEXT,
  p_params JSONB
)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN encode(
    digest(COALESCE(p_request_type, '') || '::' || COALESCE(p_params::TEXT, '{}'), 'sha256'),
    'hex'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_cached_response(
  p_request_type TEXT,
  p_params JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cache_key TEXT;
  v_response JSONB;
BEGIN
  v_cache_key := public.generate_cache_key(p_request_type, p_params);

  SELECT response_data INTO v_response
  FROM public.enrichment_cache
  WHERE cache_key = v_cache_key
    AND expires_at > NOW()
    AND is_active = true;

  IF v_response IS NOT NULL THEN
    UPDATE public.enrichment_cache
    SET hit_count = COALESCE(hit_count, 0) + 1,
        last_accessed_at = NOW(),
        updated_at = NOW()
    WHERE cache_key = v_cache_key;

    INSERT INTO public.enrichment_cache_stats (date, request_type, cache_hits, total_requests)
    VALUES (CURRENT_DATE, p_request_type, 1, 1)
    ON CONFLICT (date, request_type)
    DO UPDATE SET
      cache_hits = public.enrichment_cache_stats.cache_hits + 1,
      total_requests = public.enrichment_cache_stats.total_requests + 1,
      hit_ratio = ROUND(
        (public.enrichment_cache_stats.cache_hits + 1.0) /
        (public.enrichment_cache_stats.total_requests + 1.0) * 100,
        2
      ),
      updated_at = NOW();
  ELSE
    INSERT INTO public.enrichment_cache_stats (date, request_type, cache_misses, total_requests)
    VALUES (CURRENT_DATE, p_request_type, 1, 1)
    ON CONFLICT (date, request_type)
    DO UPDATE SET
      cache_misses = public.enrichment_cache_stats.cache_misses + 1,
      total_requests = public.enrichment_cache_stats.total_requests + 1,
      hit_ratio = ROUND(
        public.enrichment_cache_stats.cache_hits /
        (public.enrichment_cache_stats.total_requests + 1.0) * 100,
        2
      ),
      updated_at = NOW();
  END IF;

  RETURN v_response;
END;
$$;

CREATE OR REPLACE FUNCTION public.store_cached_response(
  p_request_type TEXT,
  p_params JSONB,
  p_response JSONB,
  p_cost DECIMAL DEFAULT 0,
  p_confidence_score INTEGER DEFAULT 0,
  p_ttl INTERVAL DEFAULT INTERVAL '90 days'
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cache_key TEXT;
BEGIN
  v_cache_key := public.generate_cache_key(p_request_type, p_params);

  INSERT INTO public.enrichment_cache (
    cache_key,
    request_type,
    request_params,
    response_data,
    cost,
    confidence_score,
    expires_at,
    updated_at,
    last_accessed_at,
    is_active
  ) VALUES (
    v_cache_key,
    p_request_type,
    p_params,
    p_response,
    p_cost,
    p_confidence_score,
    NOW() + p_ttl,
    NOW(),
    NOW(),
    true
  )
  ON CONFLICT (cache_key) DO UPDATE SET
    response_data = EXCLUDED.response_data,
    cost = EXCLUDED.cost,
    confidence_score = EXCLUDED.confidence_score,
    expires_at = EXCLUDED.expires_at,
    updated_at = NOW(),
    last_accessed_at = NOW(),
    is_active = true;

  INSERT INTO public.enrichment_cache_stats (date, request_type, total_cost)
  VALUES (CURRENT_DATE, p_request_type, p_cost)
  ON CONFLICT (date, request_type)
  DO UPDATE SET
    total_cost = public.enrichment_cache_stats.total_cost + p_cost,
    updated_at = NOW();

  RETURN v_cache_key;
END;
$$;

CREATE OR REPLACE FUNCTION public.cleanup_expired_cache()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.enrichment_cache
  WHERE expires_at <= NOW() OR is_active = false;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

CREATE OR REPLACE VIEW public.enrichment_cache_analytics
WITH (security_invoker = true) AS
SELECT
  request_type,
  COUNT(*) AS total_entries,
  SUM(COALESCE(hit_count, 0)) AS total_hits,
  AVG(COALESCE(confidence_score, 0)) AS avg_confidence,
  SUM(COALESCE(cost, 0)) AS total_cost_saved,
  ROUND(AVG(COALESCE(hit_count, 0)), 2) AS avg_hit_count,
  MIN(created_at) AS oldest_entry,
  MAX(last_accessed_at) AS last_activity,
  COUNT(*) FILTER (WHERE expires_at > NOW()) AS active_entries,
  COUNT(*) FILTER (WHERE expires_at <= NOW()) AS expired_entries
FROM public.enrichment_cache
WHERE request_type IS NOT NULL
GROUP BY request_type
ORDER BY total_hits DESC;

CREATE OR REPLACE VIEW public.cache_performance_summary
WITH (security_invoker = true) AS
SELECT
  date,
  SUM(COALESCE(total_requests, 0)) AS daily_requests,
  SUM(COALESCE(cache_hits, 0)) AS daily_hits,
  SUM(COALESCE(cache_misses, 0)) AS daily_misses,
  ROUND(
    CASE WHEN SUM(COALESCE(total_requests, 0)) > 0
      THEN SUM(COALESCE(cache_hits, 0))::DECIMAL / SUM(COALESCE(total_requests, 0)) * 100
      ELSE 0
    END,
    2
  ) AS daily_hit_ratio,
  SUM(COALESCE(cost_saved, 0)) AS daily_cost_saved,
  SUM(COALESCE(total_cost, 0)) AS daily_total_cost
FROM public.enrichment_cache_stats
WHERE date IS NOT NULL
GROUP BY date
ORDER BY date DESC;

GRANT ALL ON public.enrichment_cache TO postgres, service_role;
GRANT ALL ON public.enrichment_cache_stats TO postgres, service_role;
GRANT SELECT ON public.enrichment_cache_analytics TO authenticated, service_role;
GRANT SELECT ON public.cache_performance_summary TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.generate_cache_key(TEXT, JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_cached_response(TEXT, JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION public.store_cached_response(TEXT, JSONB, JSONB, DECIMAL, INTEGER, INTERVAL) TO service_role;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_cache() TO service_role;
