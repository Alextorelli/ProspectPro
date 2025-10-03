-- ProspectPro v4.3 - Enrichment Cache Schema
-- 90-day intelligent caching for cost optimization

-- Enrichment Cache Table
CREATE TABLE IF NOT EXISTS enrichment_cache (
  id BIGSERIAL PRIMARY KEY,
  cache_key TEXT NOT NULL UNIQUE, -- SHA-256 hash of request parameters
  request_type TEXT NOT NULL, -- 'business_license', 'company_enrichment', 'email_discovery', etc.
  request_params JSONB NOT NULL, -- Original request parameters
  response_data JSONB NOT NULL, -- Cached response data
  cost DECIMAL(10,4) DEFAULT 0, -- Cost of original request
  confidence_score INTEGER DEFAULT 0, -- Confidence score of cached data
  hit_count INTEGER DEFAULT 1, -- Number of cache hits
  expires_at TIMESTAMPTZ NOT NULL, -- 90-day expiration
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_accessed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_enrichment_cache_key ON enrichment_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_enrichment_cache_type ON enrichment_cache(request_type);
CREATE INDEX IF NOT EXISTS idx_enrichment_cache_expires ON enrichment_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_enrichment_cache_created ON enrichment_cache(created_at);

-- Composite index for cache lookups
CREATE INDEX IF NOT EXISTS idx_enrichment_cache_lookup 
ON enrichment_cache(request_type, cache_key);

-- Cache Statistics Table
CREATE TABLE IF NOT EXISTS enrichment_cache_stats (
  id BIGSERIAL PRIMARY KEY,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  request_type TEXT NOT NULL,
  total_requests INTEGER DEFAULT 0,
  cache_hits INTEGER DEFAULT 0,
  cache_misses INTEGER DEFAULT 0,
  cost_saved DECIMAL(10,4) DEFAULT 0,
  total_cost DECIMAL(10,4) DEFAULT 0,
  hit_ratio DECIMAL(5,2) DEFAULT 0, -- Percentage
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(date, request_type)
);

-- Index for statistics queries
CREATE INDEX IF NOT EXISTS idx_cache_stats_date ON enrichment_cache_stats(date);
CREATE INDEX IF NOT EXISTS idx_cache_stats_type ON enrichment_cache_stats(request_type);

-- Cache Management Functions

-- Function to generate cache key
CREATE OR REPLACE FUNCTION generate_cache_key(
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
$$ LANGUAGE plpgsql;

-- Function to get cached response
CREATE OR REPLACE FUNCTION get_cached_response(
  p_request_type TEXT,
  p_params JSONB
) RETURNS JSONB AS $$
DECLARE
  v_cache_key TEXT;
  v_response JSONB;
BEGIN
  v_cache_key := generate_cache_key(p_request_type, p_params);
  
  -- Get cached response if not expired
  SELECT response_data INTO v_response
  FROM enrichment_cache
  WHERE cache_key = v_cache_key
    AND request_type = p_request_type
    AND expires_at > NOW();
  
  -- Update hit count and last accessed time if found
  IF v_response IS NOT NULL THEN
    UPDATE enrichment_cache
    SET hit_count = hit_count + 1,
        last_accessed_at = NOW(),
        updated_at = NOW()
    WHERE cache_key = v_cache_key;
    
    -- Update cache statistics
    INSERT INTO enrichment_cache_stats (date, request_type, cache_hits)
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
    INSERT INTO enrichment_cache_stats (date, request_type, cache_misses)
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
$$ LANGUAGE plpgsql;

-- Function to store cached response
CREATE OR REPLACE FUNCTION store_cached_response(
  p_request_type TEXT,
  p_params JSONB,
  p_response JSONB,
  p_cost DECIMAL DEFAULT 0,
  p_confidence_score INTEGER DEFAULT 0
) RETURNS TEXT AS $$
DECLARE
  v_cache_key TEXT;
BEGIN
  v_cache_key := generate_cache_key(p_request_type, p_params);
  
  -- Store with 90-day expiration
  INSERT INTO enrichment_cache (
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
  INSERT INTO enrichment_cache_stats (date, request_type, total_cost)
  VALUES (CURRENT_DATE, p_request_type, p_cost)
  ON CONFLICT (date, request_type)
  DO UPDATE SET 
    total_cost = enrichment_cache_stats.total_cost + p_cost,
    updated_at = NOW();
  
  RETURN v_cache_key;
END;
$$ LANGUAGE plpgsql;

-- Function to clean expired cache entries
CREATE OR REPLACE FUNCTION cleanup_expired_cache() RETURNS INTEGER AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  DELETE FROM enrichment_cache WHERE expires_at <= NOW();
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  
  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to clean expired cache (if pg_cron is available)
-- SELECT cron.schedule('cleanup-enrichment-cache', '0 2 * * *', 'SELECT cleanup_expired_cache()');

-- Row Level Security (RLS)
ALTER TABLE enrichment_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrichment_cache_stats ENABLE ROW LEVEL SECURITY;

-- Service role can access all cache data
CREATE POLICY "Service role can manage enrichment cache" ON enrichment_cache
FOR ALL TO service_role USING (true);

CREATE POLICY "Service role can manage cache stats" ON enrichment_cache_stats
FOR ALL TO service_role USING (true);

-- Cache Analytics View
CREATE OR REPLACE VIEW enrichment_cache_analytics AS
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

-- Cache Performance Summary
CREATE OR REPLACE VIEW cache_performance_summary AS
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

COMMENT ON TABLE enrichment_cache IS 'Intelligent 90-day caching for enrichment API responses';
COMMENT ON TABLE enrichment_cache_stats IS 'Daily statistics for cache performance and cost savings';
COMMENT ON FUNCTION generate_cache_key IS 'Generate SHA-256 hash for cache key from request parameters';
COMMENT ON FUNCTION get_cached_response IS 'Retrieve cached response if available and not expired';
COMMENT ON FUNCTION store_cached_response IS 'Store API response in cache with 90-day expiration';
COMMENT ON FUNCTION cleanup_expired_cache IS 'Remove expired cache entries';