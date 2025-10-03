-- Fix Supabase Security Warnings
-- This addresses SECURITY DEFINER views and function search_path issues
-- 
-- FIXED ISSUES:
-- 1. Function signature mismatch for store_cached_response (parameter order)
-- 2. SECURITY DEFINER warnings for views
-- 3. Missing search_path settings for functions
-- 4. Explicit schema references to prevent ambiguity

-- 1. Fix enrichment_cache_analytics view (remove SECURITY DEFINER if present)
DROP VIEW IF EXISTS public.enrichment_cache_analytics CASCADE;

CREATE VIEW public.enrichment_cache_analytics AS
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
FROM public.enrichment_cache
GROUP BY request_type
ORDER BY total_hits DESC;

-- 2. Fix cache_performance_summary view (remove SECURITY DEFINER if present)
DROP VIEW IF EXISTS public.cache_performance_summary CASCADE;

CREATE VIEW public.cache_performance_summary AS
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
FROM public.enrichment_cache_stats
GROUP BY date
ORDER BY date DESC;

-- 3. Fix function search_path issues by adding explicit search_path settings
CREATE OR REPLACE FUNCTION public.generate_cache_key(
  p_request_type TEXT,
  p_params JSONB
) RETURNS TEXT AS $$
BEGIN
  RETURN encode(
    digest(
      p_request_type || '::' || p_params::text,
      'sha256'
    ),
    'hex'
  );
END;
$$ LANGUAGE plpgsql 
SET search_path = public;

CREATE OR REPLACE FUNCTION public.get_cached_response(
  p_request_type TEXT,
  p_params JSONB
) RETURNS JSONB AS $$
DECLARE
  v_cache_key TEXT;
  v_response JSONB;
BEGIN
  v_cache_key := public.generate_cache_key(p_request_type, p_params);
  
  -- Get cached response if not expired
  SELECT response_data INTO v_response
  FROM public.enrichment_cache
  WHERE cache_key = v_cache_key
    AND request_type = p_request_type
    AND expires_at > NOW();
  
  -- Update hit count and last accessed time if found
  IF v_response IS NOT NULL THEN
    UPDATE public.enrichment_cache
    SET hit_count = hit_count + 1,
        last_accessed_at = NOW(),
        updated_at = NOW()
    WHERE cache_key = v_cache_key;
    
    -- Update cache statistics
    INSERT INTO public.enrichment_cache_stats (date, request_type, cache_hits)
    VALUES (CURRENT_DATE, p_request_type, 1)
    ON CONFLICT (date, request_type)
    DO UPDATE SET 
      cache_hits = enrichment_cache_stats.cache_hits + 1,
      total_requests = enrichment_cache_stats.total_requests + 1,
      hit_ratio = ROUND(
        (enrichment_cache_stats.cache_hits + 1.0) / 
        (enrichment_cache_stats.total_requests + 1.0) * 100, 
        2
      ),
      updated_at = NOW();
  ELSE
    -- Update cache miss statistics
    INSERT INTO public.enrichment_cache_stats (date, request_type, cache_misses)
    VALUES (CURRENT_DATE, p_request_type, 1)
    ON CONFLICT (date, request_type)
    DO UPDATE SET 
      cache_misses = enrichment_cache_stats.cache_misses + 1,
      total_requests = enrichment_cache_stats.total_requests + 1,
      hit_ratio = ROUND(
        enrichment_cache_stats.cache_hits / 
        (enrichment_cache_stats.total_requests + 1.0) * 100, 
        2
      ),
      updated_at = NOW();
  END IF;
  
  RETURN v_response;
END;
$$ LANGUAGE plpgsql 
SET search_path = public;

CREATE OR REPLACE FUNCTION public.store_cached_response(
  p_request_type TEXT,
  p_params JSONB,
  p_response JSONB,
  p_cost DECIMAL DEFAULT 0,
  p_confidence_score INTEGER DEFAULT 0
) RETURNS TEXT AS $$
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
  )
  ON CONFLICT (cache_key) 
  DO UPDATE SET
    response_data = EXCLUDED.response_data,
    cost = EXCLUDED.cost,
    confidence_score = EXCLUDED.confidence_score,
    hit_count = enrichment_cache.hit_count + 1,
    expires_at = NOW() + INTERVAL '90 days',
    updated_at = NOW();
  
  -- Update cost statistics
  INSERT INTO public.enrichment_cache_stats (date, request_type, total_cost)
  VALUES (CURRENT_DATE, p_request_type, p_cost)
  ON CONFLICT (date, request_type)
  DO UPDATE SET 
    total_cost = enrichment_cache_stats.total_cost + p_cost,
    updated_at = NOW();
  
  RETURN v_cache_key;
END;
$$ LANGUAGE plpgsql 
SET search_path = public;

CREATE OR REPLACE FUNCTION public.cleanup_expired_cache() RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.enrichment_cache
  WHERE expires_at <= NOW();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql 
SET search_path = public;

-- Fix campaign_analytics view (the main SECURITY DEFINER issue)
DROP VIEW IF EXISTS public.campaign_analytics CASCADE;

CREATE VIEW public.campaign_analytics AS
SELECT
  c.id,
  c.business_type,
  c.location,
  c.target_count,
  c.min_confidence_score,
  c.status,
  c.results_count,
  c.total_cost,
  c.budget_limit,
  c.processing_time_ms,
  c.created_at,
  COUNT(l.id) AS actual_leads,
  COALESCE(AVG(l.confidence_score), 0)::numeric(10,2) AS avg_confidence,
  COALESCE(SUM(l.validation_cost), 0)::numeric(12,4) AS total_validation_cost,
  COUNT(*) FILTER (WHERE l.cost_efficient IS TRUE) AS cost_efficient_leads
FROM public.campaigns c
LEFT JOIN public.leads l ON l.campaign_id = c.id
GROUP BY
  c.id,
  c.business_type,
  c.location,
  c.target_count,
  c.min_confidence_score,
  c.status,
  c.results_count,
  c.total_cost,
  c.budget_limit,
  c.processing_time_ms,
  c.created_at;

-- Comments for clarity
COMMENT ON VIEW public.enrichment_cache_analytics IS 'Cache analytics view without SECURITY DEFINER';
COMMENT ON VIEW public.cache_performance_summary IS 'Cache performance summary view without SECURITY DEFINER';
COMMENT ON VIEW public.campaign_analytics IS 'Campaign analytics view without SECURITY DEFINER';
COMMENT ON FUNCTION public.generate_cache_key IS 'Generate cache key with explicit search_path';
COMMENT ON FUNCTION public.get_cached_response IS 'Get cached response with explicit search_path';
COMMENT ON FUNCTION public.store_cached_response IS 'Store cached response with explicit search_path';
COMMENT ON FUNCTION public.cleanup_expired_cache IS 'Cleanup expired cache with explicit search_path';