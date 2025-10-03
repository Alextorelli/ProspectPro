-- Supabase Production Security & Performance Optimization
-- Fixes for SECURITY DEFINER views and function search_path warnings
-- Date: October 2025
-- Status: Production-ready security hardening

-- =============================================================================
-- PART 1: Fix SECURITY DEFINER Views
-- =============================================================================

-- These views were detected with SECURITY DEFINER inheritance issues
-- We'll drop and recreate them without SECURITY DEFINER properties

-- Fix 1: enrichment_cache_analytics view
DROP VIEW IF EXISTS public.enrichment_cache_analytics CASCADE;

CREATE VIEW public.enrichment_cache_analytics
WITH (security_invoker = true) AS
SELECT 
  request_type,
  COUNT(*) as total_entries,
  SUM(hit_count) as total_hits,
  AVG(confidence_score) as avg_confidence,
  SUM(cost) as total_cost_saved,
  ROUND(AVG(hit_count), 2) as avg_hit_count,
  MIN(created_at) as oldest_entry,
  MAX(last_accessed_at) as last_activity,
  COUNT(*) FILTER (WHERE expires_at > NOW()) as active_entries,
  COUNT(*) FILTER (WHERE expires_at <= NOW()) as expired_entries
FROM enrichment_cache
GROUP BY request_type
ORDER BY total_hits DESC;

-- Fix 2: cache_performance_summary view  
DROP VIEW IF EXISTS public.cache_performance_summary CASCADE;

CREATE VIEW public.cache_performance_summary
WITH (security_invoker = true) AS
SELECT 
  date,
  SUM(total_requests) as daily_requests,
  SUM(cache_hits) as daily_hits,
  SUM(cache_misses) as daily_misses,
  ROUND(
    CASE 
      WHEN SUM(total_requests) > 0 
      THEN SUM(cache_hits)::DECIMAL / SUM(total_requests) * 100 
      ELSE 0 
    END, 
    2
  ) as daily_hit_ratio,
  SUM(cost_saved) as daily_cost_saved,
  SUM(total_cost) as daily_total_cost
FROM enrichment_cache_stats
GROUP BY date
ORDER BY date DESC;

-- =============================================================================
-- PART 2: Fix Function Search Path Warnings
-- =============================================================================

-- All functions need explicit search_path to prevent mutable path vulnerabilities
-- This ensures functions use qualified schema references and can't be hijacked

-- Fix 1: generate_cache_key function
CREATE OR REPLACE FUNCTION public.generate_cache_key(
  p_request_type TEXT,
  p_params JSONB
) RETURNS TEXT 
SET search_path = public
AS $$
BEGIN
  RETURN encode(
    digest(
      p_request_type || '::' || p_params::text,
      'sha256'
    ),
    'hex'
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE SECURITY DEFINER;

-- Fix 2: get_cached_response function
CREATE OR REPLACE FUNCTION public.get_cached_response(
  p_request_type TEXT,
  p_params JSONB
) RETURNS JSONB 
SET search_path = public
AS $$
DECLARE
  v_cache_key TEXT;
  v_response JSONB;
BEGIN
  v_cache_key := public.generate_cache_key(p_request_type, p_params);
  
  SELECT 
    response_data 
  INTO v_response
  FROM public.enrichment_cache 
  WHERE 
    cache_key = v_cache_key 
    AND expires_at > NOW()
    AND request_type = p_request_type;
  
  -- Update hit count and last accessed
  IF v_response IS NOT NULL THEN
    UPDATE public.enrichment_cache 
    SET 
      hit_count = hit_count + 1,
      last_accessed_at = NOW()
    WHERE cache_key = v_cache_key;
  END IF;
  
  RETURN v_response;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix 3: store_cached_response function
CREATE OR REPLACE FUNCTION public.store_cached_response(
  p_request_type TEXT,
  p_params JSONB,
  p_response JSONB,
  p_cost DECIMAL DEFAULT 0,
  p_confidence_score INTEGER DEFAULT 0
) RETURNS TEXT 
SET search_path = public
AS $$
DECLARE
  v_cache_key TEXT;
BEGIN
  v_cache_key := public.generate_cache_key(p_request_type, p_params);
  
  -- Store with 90-day expiration
  INSERT INTO public.enrichment_cache (
    cache_key,
    request_type,
    request_params,
    response_data,
    cost,
    confidence_score,
    expires_at
  ) VALUES (
    v_cache_key,
    p_request_type,
    p_params,
    p_response,
    p_cost,
    p_confidence_score,
    NOW() + INTERVAL '90 days'
  ) ON CONFLICT (cache_key) 
  DO UPDATE SET
    response_data = EXCLUDED.response_data,
    cost = EXCLUDED.cost,
    confidence_score = EXCLUDED.confidence_score,
    expires_at = EXCLUDED.expires_at,
    updated_at = NOW();
  
  RETURN v_cache_key;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix 4: cleanup_expired_cache function
CREATE OR REPLACE FUNCTION public.cleanup_expired_cache() 
RETURNS INTEGER 
SET search_path = public
AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  DELETE FROM public.enrichment_cache 
  WHERE expires_at <= NOW();
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  
  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- PART 3: Authentication & User Management Setup for Production
-- =============================================================================

-- User profiles table (extends auth.users for additional user data)
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  company_name TEXT,
  industry TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscription tiers for SaaS functionality
CREATE TABLE IF NOT EXISTS public.subscription_tiers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  price_monthly DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  price_yearly DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  max_searches INTEGER DEFAULT 10,
  max_exports INTEGER DEFAULT 2,
  features JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User subscriptions to track limits and usage
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tier_id INTEGER REFERENCES subscription_tiers(id),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired')),
  current_period_start TIMESTAMPTZ DEFAULT NOW(),
  current_period_end TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
  searches_used INTEGER DEFAULT 0,
  exports_used INTEGER DEFAULT 0,
  stripe_subscription_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Usage tracking for analytics and billing
CREATE TABLE IF NOT EXISTS public.usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type VARCHAR(20) NOT NULL CHECK (action_type IN ('search', 'export')),
  campaign_id TEXT,
  cost DECIMAL(10,4) DEFAULT 0,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- PART 4: Row Level Security (RLS) Policies
-- =============================================================================

-- Enable RLS on all user tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_tiers ENABLE ROW LEVEL SECURITY;

-- Update existing tables to include user ownership
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- User profiles policies
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Subscription policies
CREATE POLICY "Users can view own subscription" ON public.user_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription" ON public.user_subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

-- Usage logs policies
CREATE POLICY "Users can view own usage" ON public.usage_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert usage logs" ON public.usage_logs
  FOR INSERT WITH CHECK (true);

-- Subscription tiers (public read)
CREATE POLICY "Anyone can view active subscription tiers" ON public.subscription_tiers
  FOR SELECT USING (is_active = true);

-- Update campaigns policies for user ownership
DROP POLICY IF EXISTS "Public read campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Public insert campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Public update campaigns" ON public.campaigns;

CREATE POLICY "Users can view own campaigns" ON public.campaigns
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can create campaigns" ON public.campaigns
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own campaigns" ON public.campaigns
  FOR UPDATE USING (auth.uid() = user_id);

-- Update leads policies for user-owned campaigns
DROP POLICY IF EXISTS "Public read leads" ON public.leads;
DROP POLICY IF EXISTS "Public insert leads" ON public.leads;
DROP POLICY IF EXISTS "Public update leads" ON public.leads;

CREATE POLICY "Users can view leads from own campaigns" ON public.leads
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.campaigns 
      WHERE campaigns.id = leads.campaign_id 
      AND (campaigns.user_id = auth.uid() OR campaigns.user_id IS NULL)
    )
  );

CREATE POLICY "System can insert leads" ON public.leads
  FOR INSERT WITH CHECK (true);

-- =============================================================================
-- PART 5: User Management Functions
-- =============================================================================

-- Function to create user profile and default subscription on signup
CREATE OR REPLACE FUNCTION public.create_user_profile_and_subscription()
RETURNS TRIGGER 
SET search_path = public
AS $$
BEGIN
  -- Create user profile
  INSERT INTO public.user_profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  
  -- Create free subscription (assuming Free tier exists with id=1)
  INSERT INTO public.user_subscriptions (user_id, tier_id)
  VALUES (NEW.id, (SELECT id FROM public.subscription_tiers WHERE name = 'Free' LIMIT 1));
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create profile and subscription
DROP TRIGGER IF EXISTS create_user_profile_and_subscription_trigger ON auth.users;
CREATE TRIGGER create_user_profile_and_subscription_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.create_user_profile_and_subscription();

-- Function to check usage limits before actions
CREATE OR REPLACE FUNCTION public.check_usage_limit(user_uuid UUID, action_type TEXT)
RETURNS JSONB 
SET search_path = public
AS $$
DECLARE
  subscription_record RECORD;
  current_usage INTEGER;
  max_allowed INTEGER;
  can_proceed BOOLEAN;
BEGIN
  -- Get user subscription with tier info
  SELECT us.*, st.max_searches, st.max_exports, st.name as tier_name
  INTO subscription_record
  FROM public.user_subscriptions us
  JOIN public.subscription_tiers st ON us.tier_id = st.id
  WHERE us.user_id = user_uuid AND us.status = 'active';
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'can_proceed', false,
      'usage', 0,
      'limit', 0,
      'error', 'No active subscription found'
    );
  END IF;
  
  -- Reset monthly usage if period has ended
  IF subscription_record.current_period_end < NOW() THEN
    UPDATE public.user_subscriptions 
    SET 
      current_period_start = NOW(),
      current_period_end = NOW() + INTERVAL '30 days',
      searches_used = 0,
      exports_used = 0
    WHERE user_id = user_uuid;
    
    -- Refresh the record
    SELECT us.*, st.max_searches, st.max_exports, st.name as tier_name
    INTO subscription_record
    FROM public.user_subscriptions us
    JOIN public.subscription_tiers st ON us.tier_id = st.id
    WHERE us.user_id = user_uuid AND us.status = 'active';
  END IF;
  
  -- Check limits based on action type
  IF action_type = 'search' THEN
    current_usage := subscription_record.searches_used;
    max_allowed := subscription_record.max_searches;
  ELSIF action_type = 'export' THEN
    current_usage := subscription_record.exports_used;
    max_allowed := subscription_record.max_exports;
  ELSE
    RETURN json_build_object(
      'can_proceed', false,
      'usage', 0,
      'limit', 0,
      'error', 'Invalid action type'
    );
  END IF;
  
  -- Check if can proceed (-1 means unlimited)
  can_proceed := (max_allowed = -1) OR (current_usage < max_allowed);
  
  RETURN json_build_object(
    'can_proceed', can_proceed,
    'usage', current_usage,
    'limit', max_allowed,
    'tier', subscription_record.tier_name,
    'period_end', subscription_record.current_period_end
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment usage after successful actions
CREATE OR REPLACE FUNCTION public.increment_usage(
  user_uuid UUID, 
  action_type TEXT, 
  campaign_id_param TEXT DEFAULT NULL, 
  cost_param DECIMAL DEFAULT 0
)
RETURNS BOOLEAN 
SET search_path = public
AS $$
BEGIN
  -- Log the usage
  INSERT INTO public.usage_logs (user_id, action_type, campaign_id, cost)
  VALUES (user_uuid, action_type, campaign_id_param, cost_param);
  
  -- Increment the appropriate counter
  IF action_type = 'search' THEN
    UPDATE public.user_subscriptions 
    SET searches_used = searches_used + 1
    WHERE user_id = user_uuid;
  ELSIF action_type = 'export' THEN
    UPDATE public.user_subscriptions 
    SET exports_used = exports_used + 1
    WHERE user_id = user_uuid;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- PART 6: Initial Data & Performance Optimization
-- =============================================================================

-- Insert default subscription tiers
INSERT INTO public.subscription_tiers (name, price_monthly, price_yearly, max_searches, max_exports, features) VALUES
('Free', 0.00, 0.00, 10, 2, '{"api_access": false, "priority_support": false, "data_export": "csv"}'),
('Pro', 29.00, 290.00, 500, 50, '{"api_access": true, "priority_support": false, "data_export": "csv,json", "advanced_filters": true}'),
('Enterprise', 99.00, 990.00, -1, -1, '{"api_access": true, "priority_support": true, "data_export": "csv,json,xml", "advanced_filters": true, "custom_integrations": true}')
ON CONFLICT (name) DO NOTHING;

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON public.user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON public.user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_usage_logs_user_id ON public.usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_timestamp ON public.usage_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_campaigns_user_id ON public.campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_enrichment_cache_request_type ON public.enrichment_cache(request_type);
CREATE INDEX IF NOT EXISTS idx_enrichment_cache_expires_at ON public.enrichment_cache(expires_at);

-- =============================================================================
-- PART 7: Production Security Comments & Documentation
-- =============================================================================

COMMENT ON VIEW public.enrichment_cache_analytics IS 'Cache analytics view with security_invoker for production safety';
COMMENT ON VIEW public.cache_performance_summary IS 'Cache performance summary with security_invoker for production safety';

COMMENT ON FUNCTION public.generate_cache_key(TEXT, JSONB) IS 'Generate SHA-256 cache key with explicit search_path for security';
COMMENT ON FUNCTION public.get_cached_response(TEXT, JSONB) IS 'Retrieve cached response with qualified schema references';
COMMENT ON FUNCTION public.store_cached_response(TEXT, JSONB, JSONB, DECIMAL, INTEGER) IS 'Store cached response with security-hardened function';
COMMENT ON FUNCTION public.cleanup_expired_cache() IS 'Cleanup expired cache entries with production security settings';

COMMENT ON FUNCTION public.check_usage_limit(UUID, TEXT) IS 'Check user subscription limits before API actions';
COMMENT ON FUNCTION public.increment_usage(UUID, TEXT, TEXT, DECIMAL) IS 'Increment usage counters after successful API actions';

COMMENT ON TABLE public.user_profiles IS 'Extended user profile data with RLS enabled';
COMMENT ON TABLE public.subscription_tiers IS 'SaaS subscription tier definitions';
COMMENT ON TABLE public.user_subscriptions IS 'User subscription status and usage tracking';
COMMENT ON TABLE public.usage_logs IS 'Detailed usage logs for analytics and billing';

-- =============================================================================
-- VERIFICATION QUERIES (Run after deployment to confirm fixes)
-- =============================================================================

/*
-- Verify views are fixed (should return no SECURITY DEFINER references)
SELECT 
  schemaname, 
  viewname, 
  definition 
FROM pg_views 
WHERE viewname IN ('enrichment_cache_analytics', 'cache_performance_summary')
AND definition LIKE '%SECURITY DEFINER%';

-- Verify functions have proper search_path (should return all functions with search_path set)
SELECT 
  routine_name,
  routine_type,
  routine_definition
FROM information_schema.routines 
WHERE routine_name IN ('generate_cache_key', 'get_cached_response', 'store_cached_response', 'cleanup_expired_cache')
AND routine_schema = 'public';

-- Verify RLS policies are active
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual 
FROM pg_policies 
WHERE tablename IN ('user_profiles', 'user_subscriptions', 'usage_logs', 'campaigns', 'leads');

-- Test user subscription system (after authentication is enabled)
SELECT * FROM public.subscription_tiers WHERE is_active = true;
*/