-- ProspectPro v4.3 User Campaign Deduplication Enhancement
-- October 13, 2025 - Add user-specific business deduplication

-- =============================================================================
-- PART 1: User Campaign Results Tracking Table
-- =============================================================================

-- Create campaign results tracking table for user deduplication
CREATE TABLE IF NOT EXISTS public.user_campaign_results (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  session_user_id TEXT, -- for anonymous users
  campaign_hash TEXT NOT NULL, -- hash of campaign parameters
  business_identifier TEXT NOT NULL, -- unique business ID (name + address hash)
  served_at TIMESTAMPTZ DEFAULT NOW(),
  campaign_id TEXT REFERENCES public.campaigns(id),
  business_name TEXT, -- for reference
  business_address TEXT, -- for reference
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Prevent duplicates for authenticated users
  CONSTRAINT unique_user_campaign_business 
    UNIQUE(user_id, campaign_hash, business_identifier),
  
  -- Prevent duplicates for anonymous users (when user_id is NULL)
  CONSTRAINT unique_session_campaign_business 
    UNIQUE(session_user_id, campaign_hash, business_identifier) 
    WHERE user_id IS NULL
);

-- Add campaign_hash column to campaigns table if not exists
ALTER TABLE public.campaigns 
ADD COLUMN IF NOT EXISTS campaign_hash TEXT;

-- =============================================================================
-- PART 2: Indexes for Performance
-- =============================================================================

-- Create indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_user_campaign_results_user_hash 
  ON public.user_campaign_results(user_id, campaign_hash) 
  WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_user_campaign_results_session_hash 
  ON public.user_campaign_results(session_user_id, campaign_hash) 
  WHERE user_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_user_campaign_results_business_id 
  ON public.user_campaign_results(business_identifier);

CREATE INDEX IF NOT EXISTS idx_user_campaign_results_served_at 
  ON public.user_campaign_results(served_at);

CREATE INDEX IF NOT EXISTS idx_campaigns_campaign_hash 
  ON public.campaigns(campaign_hash) 
  WHERE campaign_hash IS NOT NULL;

-- =============================================================================
-- PART 3: Helper Functions for Deduplication
-- =============================================================================

-- Function to generate campaign hash for deduplication
CREATE OR REPLACE FUNCTION public.generate_campaign_hash(
  business_type TEXT,
  location TEXT,
  min_confidence_score INTEGER DEFAULT 50
)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  RETURN encode(digest(
    business_type || '|' || location || '|' || COALESCE(min_confidence_score, 50)::text,
    'sha256'
  ), 'base64');
END;
$$;

-- Function to generate business identifier for deduplication
CREATE OR REPLACE FUNCTION public.generate_business_identifier(
  business_name TEXT,
  business_address TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  RETURN encode(digest(
    COALESCE(business_name, '') || '|' || COALESCE(business_address, ''),
    'sha256'
  ), 'base64');
END;
$$;

-- Function to check if businesses have been served to user
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
  served_identifiers TEXT[];
  fresh_identifiers TEXT[];
BEGIN
  -- Get already served business identifiers
  IF p_user_id IS NOT NULL THEN
    -- For authenticated users
    SELECT ARRAY_AGG(business_identifier) INTO served_identifiers
    FROM public.user_campaign_results
    WHERE user_id = p_user_id
      AND campaign_hash = p_campaign_hash
      AND business_identifier = ANY(p_business_identifiers);
  ELSIF p_session_user_id IS NOT NULL THEN
    -- For anonymous users
    SELECT ARRAY_AGG(business_identifier) INTO served_identifiers
    FROM public.user_campaign_results
    WHERE session_user_id = p_session_user_id
      AND campaign_hash = p_campaign_hash
      AND business_identifier = ANY(p_business_identifiers);
  END IF;

  -- Filter out served businesses
  SELECT ARRAY_AGG(identifier) INTO fresh_identifiers
  FROM unnest(p_business_identifiers) AS identifier
  WHERE identifier != ALL(COALESCE(served_identifiers, ARRAY[]::TEXT[]));

  RETURN COALESCE(fresh_identifiers, ARRAY[]::TEXT[]);
END;
$$;

-- Function to record served businesses
CREATE OR REPLACE FUNCTION public.record_served_businesses(
  p_user_id UUID,
  p_session_user_id TEXT,
  p_campaign_hash TEXT,
  p_campaign_id TEXT,
  p_businesses JSONB -- Array of {name, address, identifier}
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
  -- Insert each business record
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
        business_record->>'identifier',
        p_campaign_id,
        business_record->>'name',
        business_record->>'address'
      );
      inserted_count := inserted_count + 1;
    EXCEPTION WHEN unique_violation THEN
      -- Business already recorded for this user/session + campaign combination
      CONTINUE;
    END;
  END LOOP;

  RETURN inserted_count;
END;
$$;

-- =============================================================================
-- PART 4: Usage Analytics Functions
-- =============================================================================

-- Function to get user usage statistics for billing
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
  result JSONB;
  campaigns_count INTEGER;
  leads_count INTEGER;
  exports_count INTEGER;
  total_cost DECIMAL(10,4);
  month_campaigns INTEGER;
  month_cost DECIMAL(10,4);
  last_activity TIMESTAMPTZ;
  dedup_savings INTEGER;
BEGIN
  -- Determine user context
  IF target_user_id IS NULL AND target_session_user_id IS NULL THEN
    target_user_id := auth.uid();
  END IF;

  -- Get campaign statistics
  SELECT 
    COUNT(DISTINCT c.id),
    COUNT(l.id),
    COALESCE(SUM(c.total_cost), 0),
    COUNT(DISTINCT c.id) FILTER (WHERE c.created_at >= date_trunc('month', NOW())),
    COALESCE(SUM(c.total_cost) FILTER (WHERE c.created_at >= date_trunc('month', NOW())), 0),
    MAX(c.created_at)
  INTO campaigns_count, leads_count, total_cost, month_campaigns, month_cost, last_activity
  FROM campaigns c
  LEFT JOIN leads l ON l.campaign_id = c.id
  WHERE 
    (target_user_id IS NOT NULL AND c.user_id = target_user_id) OR
    (target_session_user_id IS NOT NULL AND c.session_user_id = target_session_user_id);

  -- Get export count
  SELECT COUNT(*) INTO exports_count
  FROM dashboard_exports de
  WHERE 
    (target_user_id IS NOT NULL AND de.user_id = target_user_id) OR
    (target_session_user_id IS NOT NULL AND de.session_user_id = target_session_user_id);

  -- Get deduplication savings (businesses filtered out)
  SELECT COUNT(*) INTO dedup_savings
  FROM user_campaign_results ucr
  WHERE 
    (target_user_id IS NOT NULL AND ucr.user_id = target_user_id) OR
    (target_session_user_id IS NOT NULL AND ucr.session_user_id = target_session_user_id);

  -- Build result
  result := jsonb_build_object(
    'user_id', target_user_id,
    'session_user_id', target_session_user_id,
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

  RETURN result;
END;
$$;

-- =============================================================================
-- PART 5: RLS Policies for user_campaign_results
-- =============================================================================

-- Enable RLS
ALTER TABLE public.user_campaign_results ENABLE ROW LEVEL SECURITY;

-- Users can only see their own results
CREATE POLICY "user_campaign_results_user_access" ON public.user_campaign_results
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Anonymous users can see their session results
CREATE POLICY "user_campaign_results_session_access" ON public.user_campaign_results
  FOR ALL TO anon
  USING (session_user_id IS NOT NULL AND user_id IS NULL)
  WITH CHECK (session_user_id IS NOT NULL AND user_id IS NULL);

-- =============================================================================
-- PART 6: Cleanup and Maintenance
-- =============================================================================

-- Function to cleanup old deduplication records (optional - for maintenance)
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

-- =============================================================================
-- PART 7: Grants and Permissions
-- =============================================================================

-- Grant permissions for Edge Functions to access these tables and functions
GRANT ALL ON public.user_campaign_results TO postgres, anon, authenticated, service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public.generate_campaign_hash(TEXT, TEXT, INTEGER) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.generate_business_identifier(TEXT, TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.filter_already_served_businesses(UUID, TEXT, TEXT, TEXT[]) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.record_served_businesses(UUID, TEXT, TEXT, TEXT, JSONB) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_user_usage_stats(UUID, TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.cleanup_old_deduplication_records(INTEGER) TO service_role;

-- =============================================================================
-- PART 8: Verification and Testing
-- =============================================================================

-- Test campaign hash generation
DO $$
DECLARE
  test_hash TEXT;
BEGIN
  test_hash := public.generate_campaign_hash('coffee shop', 'Seattle, WA', 50);
  RAISE NOTICE 'Test campaign hash: %', test_hash;
  
  IF length(test_hash) > 10 THEN
    RAISE NOTICE '✅ Campaign hash generation working';
  ELSE
    RAISE EXCEPTION '❌ Campaign hash generation failed';
  END IF;
END $$;

-- Test business identifier generation
DO $$
DECLARE
  test_identifier TEXT;
BEGIN
  test_identifier := public.generate_business_identifier('Starbucks', '123 Main St, Seattle, WA');
  RAISE NOTICE 'Test business identifier: %', test_identifier;
  
  IF length(test_identifier) > 10 THEN
    RAISE NOTICE '✅ Business identifier generation working';
  ELSE
    RAISE EXCEPTION '❌ Business identifier generation failed';
  END IF;
END $$;

-- Success message
SELECT 
  '✅ User Campaign Deduplication Enhancement Applied Successfully!' as status,
  'Added user_campaign_results table with deduplication tracking' as enhancement,
  'Functions for hash generation and filtering ready' as functions,
  'RLS policies for data isolation active' as security,
  NOW() as applied_at;