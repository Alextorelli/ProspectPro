-- ProspectPro Production Schema - User Helpers & Security Validators

-- Helper to provide a consistent session identifier for policies and functions
CREATE OR REPLACE FUNCTION public.current_session_identifier()
RETURNS TEXT
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
BEGIN
  RETURN COALESCE(auth.jwt() ->> 'session_id', auth.uid()::text);
END;
$$;

-- Retrieve campaigns for a target user or the current invoker
DROP FUNCTION IF EXISTS public.get_user_campaigns();
DROP FUNCTION IF EXISTS public.get_user_campaigns(uuid);
DROP FUNCTION IF EXISTS public.get_user_campaigns(uuid, text);
CREATE OR REPLACE FUNCTION public.get_user_campaigns(
  target_user_id UUID DEFAULT NULL,
  target_session_user_id TEXT DEFAULT NULL
)
RETURNS TABLE (
  id TEXT,
  business_type TEXT,
  location TEXT,
  target_count INTEGER,
  results_count INTEGER,
  status TEXT,
  total_cost DECIMAL(10,4),
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  effective_user_id UUID;
  effective_session_id TEXT;
BEGIN
  IF target_user_id IS NOT NULL THEN
    effective_user_id := target_user_id;
  ELSE
    effective_user_id := auth.uid();
  END IF;

  IF target_session_user_id IS NOT NULL THEN
    effective_session_id := target_session_user_id;
  ELSE
    effective_session_id := public.current_session_identifier();
  END IF;

  RETURN QUERY
  SELECT
    c.id,
    c.business_type,
    c.location,
    c.target_count,
    c.results_count,
    c.status,
    c.total_cost,
    c.created_at
  FROM public.campaigns c
  WHERE (
    effective_user_id IS NOT NULL AND c.user_id = effective_user_id
  ) OR (
    effective_user_id IS NULL AND effective_session_id IS NOT NULL AND c.session_user_id = effective_session_id
  )
  ORDER BY c.created_at DESC;
END;
$$;

-- Link historical anonymous campaigns to an authenticated account
DROP FUNCTION IF EXISTS public.link_anonymous_campaigns_to_user(text, uuid);
CREATE OR REPLACE FUNCTION public.link_anonymous_campaigns_to_user(
  target_session_user_id TEXT,
  authenticated_user_id UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  linked_total INTEGER := 0;
BEGIN
  UPDATE public.campaigns
  SET user_id = authenticated_user_id
  WHERE user_id IS NULL
    AND session_user_id = target_session_user_id;

  GET DIAGNOSTICS linked_total = ROW_COUNT;

  UPDATE public.leads
  SET user_id = authenticated_user_id
  WHERE user_id IS NULL
    AND session_user_id = target_session_user_id;

  UPDATE public.dashboard_exports
  SET user_id = authenticated_user_id
  WHERE user_id IS NULL
    AND session_user_id = target_session_user_id;

  RETURN linked_total;
END;
$$;

-- Validate Supabase key formats (publishable + secret)
CREATE OR REPLACE FUNCTION public.validate_api_key_format(api_key TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
BEGIN
  IF api_key LIKE 'sb_publishable_%' THEN
    RETURN true;
  END IF;

  IF api_key LIKE 'sb_secret_%' THEN
    RETURN true;
  END IF;

  IF api_key LIKE 'eyJ%' AND length(api_key) > 100 THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$;

-- Comprehensive security validation helper
CREATE OR REPLACE FUNCTION public.validate_security_configuration()
RETURNS JSONB
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  rls_count INTEGER;
  policy_count INTEGER;
  secure_function_count INTEGER;
  result JSONB;
BEGIN
  SELECT COUNT(*) INTO rls_count
  FROM pg_tables t
  JOIN pg_class c ON c.relname = t.tablename
  WHERE t.schemaname = 'public'
    AND c.relrowsecurity = true
    AND t.tablename IN ('campaigns', 'leads', 'dashboard_exports', 'user_campaign_results');

  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename IN ('campaigns', 'leads', 'dashboard_exports', 'user_campaign_results');

  SELECT COUNT(*) INTO secure_function_count
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.proname IN (
      'current_session_identifier',
      'get_user_campaigns',
      'link_anonymous_campaigns_to_user',
      'generate_campaign_hash',
      'generate_business_identifier',
      'filter_already_served_businesses',
      'record_served_businesses',
      'get_user_usage_stats',
      'generate_cache_key',
      'get_cached_response',
      'store_cached_response',
      'cleanup_expired_cache'
    );

  result := jsonb_build_object(
    'timestamp', NOW(),
    'rls_enabled_tables', rls_count,
    'policy_count', policy_count,
    'secure_function_count', secure_function_count,
    'session_support', true,
    'user_campaign_linking', true,
    'cache_enabled', true,
    'deduplication_enabled', true
  );

  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.current_session_identifier() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_user_campaigns(uuid, text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.link_anonymous_campaigns_to_user(text, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.validate_api_key_format(TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.validate_security_configuration() TO authenticated, service_role;
