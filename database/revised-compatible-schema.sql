-- Revised ProspectPro Database Schema - Compatible with Existing Structure
-- This schema adds monitoring capabilities to the existing database without conflicts

-- Enable required extensions (only if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- MONITORING TABLES - ADD TO EXISTING DATABASE  
-- ============================================================================

-- API cost tracking for dashboard monitoring (enhanced version of existing api_usage)
CREATE TABLE IF NOT EXISTS api_cost_tracking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  api_service TEXT NOT NULL,
  endpoint TEXT,
  request_count INTEGER DEFAULT 1,
  cost_per_request DECIMAL(8,4),
  total_cost DECIMAL(10,4),
  success_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  avg_response_time_ms INTEGER,
  rate_limit_remaining INTEGER,
  date DATE DEFAULT CURRENT_DATE,
  hour INTEGER DEFAULT EXTRACT(hour FROM now()),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Lead qualification metrics for dashboard
CREATE TABLE IF NOT EXISTS lead_qualification_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  total_leads_discovered INTEGER DEFAULT 0,
  leads_qualified INTEGER DEFAULT 0,
  qualification_rate DECIMAL(5,4), -- Calculated: qualified/total
  avg_confidence_score DECIMAL(5,2),
  total_api_calls INTEGER DEFAULT 0,
  total_api_cost DECIMAL(10,4) DEFAULT 0,
  cost_per_qualified_lead DECIMAL(8,4),
  roi_percentage DECIMAL(8,4),
  date DATE DEFAULT CURRENT_DATE,
  hour INTEGER DEFAULT EXTRACT(hour FROM now()),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Real-time service health for dashboard monitoring
CREATE TABLE IF NOT EXISTS service_health_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  service_name TEXT NOT NULL, -- 'hunter_io', 'scrapingdog', 'google_places'
  status TEXT NOT NULL, -- 'healthy', 'degraded', 'down'
  response_time_ms INTEGER,
  error_rate DECIMAL(5,4), -- Percentage
  rate_limit_remaining INTEGER,
  cost_budget_remaining DECIMAL(10,2),
  requests_today INTEGER DEFAULT 0,
  cost_today DECIMAL(10,2) DEFAULT 0.00,
  last_successful_call TIMESTAMP WITH TIME ZONE,
  last_error TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Dashboard export logs (enhanced version of existing export_history)
CREATE TABLE IF NOT EXISTS dashboard_exports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  export_type TEXT NOT NULL, -- 'cost_analysis', 'campaign_performance', 'roi_report'
  file_format TEXT NOT NULL, -- 'csv', 'excel', 'json'
  start_date DATE,
  end_date DATE,
  campaign_ids UUID[],
  row_count INTEGER,
  file_size_mb DECIMAL(8,2),
  export_status TEXT DEFAULT 'completed' CHECK (export_status IN ('pending', 'completed', 'failed')),
  download_url TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================================================================
-- FIX EXISTING TABLE REFERENCES
-- ============================================================================

-- Fix lead_emails table to reference businesses instead of enhanced_leads
DO $$ 
BEGIN
    -- Check if the foreign key constraint exists and points to wrong table
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'lead_emails_lead_id_fkey' 
        AND table_name = 'lead_emails'
    ) THEN
        -- Drop the incorrect foreign key
        ALTER TABLE lead_emails DROP CONSTRAINT IF EXISTS lead_emails_lead_id_fkey;
    END IF;
    
    -- Add correct foreign key to businesses table
    ALTER TABLE lead_emails ADD CONSTRAINT lead_emails_business_id_fkey 
        FOREIGN KEY (lead_id) REFERENCES businesses(id) ON DELETE CASCADE;
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'Foreign key constraint adjustment failed: %', SQLERRM;
END $$;

-- Fix lead_social_profiles table to reference businesses instead of enhanced_leads  
DO $$ 
BEGIN
    -- Check if the foreign key constraint exists and points to wrong table
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'lead_social_profiles_lead_id_fkey' 
        AND table_name = 'lead_social_profiles'
    ) THEN
        -- Drop the incorrect foreign key
        ALTER TABLE lead_social_profiles DROP CONSTRAINT IF EXISTS lead_social_profiles_lead_id_fkey;
    END IF;
    
    -- Add correct foreign key to businesses table
    ALTER TABLE lead_social_profiles ADD CONSTRAINT lead_social_profiles_business_id_fkey 
        FOREIGN KEY (lead_id) REFERENCES businesses(id) ON DELETE CASCADE;
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'Foreign key constraint adjustment failed: %', SQLERRM;
END $$;

-- ============================================================================
-- ENHANCE EXISTING CAMPAIGN_ANALYTICS TABLE
-- ============================================================================

-- Add monitoring columns to existing campaign_analytics table if they don't exist
DO $$
BEGIN
    -- Add metric_type column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'campaign_analytics' AND column_name = 'metric_type') THEN
        ALTER TABLE campaign_analytics ADD COLUMN metric_type TEXT;
    END IF;
    
    -- Add api_service column if it doesn't exist  
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'campaign_analytics' AND column_name = 'api_service') THEN
        ALTER TABLE campaign_analytics ADD COLUMN api_service TEXT;
    END IF;
    
    -- Add metadata column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'campaign_analytics' AND column_name = 'metadata') THEN
        ALTER TABLE campaign_analytics ADD COLUMN metadata JSONB DEFAULT '{}';
    END IF;
    
    -- Add timestamp column if it doesn't exist (different from created_at)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'campaign_analytics' AND column_name = 'timestamp') THEN
        ALTER TABLE campaign_analytics ADD COLUMN timestamp TIMESTAMP WITH TIME ZONE DEFAULT now();
    END IF;
END $$;

-- ============================================================================
-- INDEXES FOR MONITORING PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_api_cost_tracking_service_date ON api_cost_tracking(api_service, date, hour);
CREATE INDEX IF NOT EXISTS idx_api_cost_tracking_campaign ON api_cost_tracking(campaign_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_lead_qualification_date ON lead_qualification_metrics(date DESC, hour DESC);
CREATE INDEX IF NOT EXISTS idx_lead_qualification_campaign ON lead_qualification_metrics(campaign_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_service_health_service_timestamp ON service_health_metrics(service_name, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_dashboard_exports_user_created ON dashboard_exports(user_id, created_at DESC);

-- Enhanced indexes for existing tables
CREATE INDEX IF NOT EXISTS idx_businesses_campaign_confidence ON businesses(campaign_id, confidence_score DESC);
CREATE INDEX IF NOT EXISTS idx_businesses_qualified ON businesses(is_qualified, confidence_score DESC);
CREATE INDEX IF NOT EXISTS idx_businesses_cost ON businesses(total_cost);
CREATE INDEX IF NOT EXISTS idx_api_usage_service_created ON api_usage(service, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_campaigns_status_created ON campaigns(status, created_at DESC);

-- ============================================================================
-- MONITORING FUNCTIONS - ADAPTED FOR EXISTING STRUCTURE
-- ============================================================================

-- Calculate cost per qualified lead using existing businesses table
CREATE OR REPLACE FUNCTION calculate_cost_per_qualified_lead_current(
  campaign_id_param UUID DEFAULT NULL,
  start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
  end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  campaign_id UUID,
  campaign_name TEXT,
  total_api_cost DECIMAL(10,4),
  total_qualified_leads INTEGER,
  cost_per_qualified_lead DECIMAL(8,4),
  roi_percentage DECIMAL(8,4),
  efficiency_score INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id as campaign_id,
    c.name as campaign_name,
    COALESCE(c.current_cost, 0) as total_api_cost,
    (c.results->>'qualified')::INTEGER as total_qualified_leads,
    CASE 
      WHEN (c.results->>'qualified')::INTEGER > 0 
      THEN ROUND(COALESCE(c.current_cost, 0) / (c.results->>'qualified')::INTEGER, 4)
      ELSE 0 
    END as cost_per_qualified_lead,
    CASE 
      WHEN COALESCE(c.current_cost, 0) > 0 
      THEN ROUND(((c.results->>'qualified')::INTEGER * 10.0) / COALESCE(c.current_cost, 0) * 100, 2)
      ELSE 0 
    END as roi_percentage,
    -- Efficiency score (0-100) based on cost per lead and qualification rate
    LEAST(100, GREATEST(0, 
      100 - (CASE 
        WHEN (c.results->>'qualified')::INTEGER > 0 
        THEN (COALESCE(c.current_cost, 0) / (c.results->>'qualified')::INTEGER * 20)::INTEGER
        ELSE 100 
      END)
    )) as efficiency_score
  FROM campaigns c
  WHERE (campaign_id_param IS NULL OR c.id = campaign_id_param)
    AND c.status IN ('active', 'completed')
    AND c.created_at >= start_date
    AND c.created_at <= end_date + INTERVAL '1 day'
  ORDER BY cost_per_qualified_lead ASC;
END;
$$ LANGUAGE plpgsql;

-- Real-time dashboard metrics using existing tables
CREATE OR REPLACE FUNCTION get_dashboard_realtime_metrics_current()
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'overview', (
      SELECT json_build_object(
        'active_campaigns', COUNT(*) FILTER (WHERE status = 'active'),
        'total_campaigns', COUNT(*),
        'total_leads_discovered', COALESCE(SUM((results->>'discovered')::INTEGER), 0),
        'total_qualified_leads', COALESCE(SUM((results->>'qualified')::INTEGER), 0),
        'total_cost_today', COALESCE(SUM(current_cost), 0),
        'avg_qualification_rate', CASE 
          WHEN SUM((results->>'discovered')::INTEGER) > 0 
          THEN ROUND(SUM((results->>'qualified')::INTEGER)::numeric / SUM((results->>'discovered')::INTEGER) * 100, 2)
          ELSE 0 
        END
      )
      FROM campaigns
      WHERE created_at >= CURRENT_DATE
    ),
    'service_health', (
      SELECT json_object_agg(
        service_name,
        json_build_object(
          'status', status,
          'response_time_ms', response_time_ms,
          'error_rate', error_rate,
          'requests_today', requests_today,
          'cost_today', cost_today,
          'last_check', timestamp
        )
      )
      FROM (
        SELECT DISTINCT ON (service_name) 
          service_name, status, response_time_ms, error_rate, 
          requests_today, cost_today, timestamp
        FROM service_health_metrics 
        ORDER BY service_name, timestamp DESC
      ) latest_health
    ),
    'hourly_performance', (
      SELECT json_agg(
        json_build_object(
          'hour', hour,
          'leads_discovered', total_leads_discovered,
          'leads_qualified', leads_qualified,
          'total_cost', total_api_cost,
          'qualification_rate', qualification_rate
        )
      )
      FROM lead_qualification_metrics
      WHERE date = CURRENT_DATE
      ORDER BY hour DESC
      LIMIT 24
    ),
    'top_performing_campaigns', (
      SELECT json_agg(
        json_build_object(
          'campaign_id', id,
          'campaign_name', name,
          'qualified_leads', (results->>'qualified')::INTEGER,
          'cost_efficiency', CASE 
            WHEN current_cost > 0 AND (results->>'qualified')::INTEGER > 0
            THEN ROUND(current_cost / (results->>'qualified')::INTEGER, 2)
            ELSE 0 
          END
        )
      )
      FROM campaigns
      WHERE status IN ('active', 'completed')
        AND (results->>'qualified')::INTEGER > 0
      ORDER BY (results->>'qualified')::INTEGER DESC, current_cost / (results->>'qualified')::INTEGER ASC
      LIMIT 10
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- API service breakdown using existing api_usage table
CREATE OR REPLACE FUNCTION get_api_service_breakdown_current(
  start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
  end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  api_service TEXT,
  total_requests INTEGER,
  total_cost DECIMAL(10,4),
  success_rate DECIMAL(5,2),
  avg_response_time_ms INTEGER,
  cost_per_request DECIMAL(8,4)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    au.service as api_service,
    COUNT(*)::INTEGER as total_requests,
    SUM(au.cost) as total_cost,
    ROUND(
      (COUNT(*) FILTER (WHERE au.success = true))::numeric / COUNT(*) * 100, 2
    ) as success_rate,
    ROUND(AVG(au.response_time))::INTEGER as avg_response_time_ms,
    ROUND(
      SUM(au.cost) / COUNT(*), 4
    ) as cost_per_request
  FROM api_usage au
  WHERE au.created_at::DATE BETWEEN start_date AND end_date
  GROUP BY au.service
  ORDER BY total_cost DESC;
END;
$$ LANGUAGE plpgsql;

-- Campaign analytics using existing businesses table
CREATE OR REPLACE FUNCTION campaign_analytics_current(campaign_id_param UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'campaign_id', c.id,
    'campaign_name', c.name,
    'status', c.status,
    'created_at', c.created_at,
    'total_leads', COUNT(b.id),
    'qualified_leads', COUNT(b.id) FILTER (WHERE b.is_qualified = true),
    'total_cost', COALESCE(SUM(b.total_cost), 0),
    'average_confidence', COALESCE(ROUND(AVG(b.confidence_score)), 0),
    'cost_per_lead', CASE 
      WHEN COUNT(b.id) > 0 THEN ROUND(COALESCE(SUM(b.total_cost), 0) / COUNT(b.id), 4)
      ELSE 0 
    END,
    'cost_per_qualified_lead', CASE 
      WHEN COUNT(b.id) FILTER (WHERE b.is_qualified = true) > 0 
      THEN ROUND(COALESCE(SUM(b.total_cost), 0) / COUNT(b.id) FILTER (WHERE b.is_qualified = true), 4)
      ELSE 0 
    END,
    'quality_distribution', (
      SELECT json_build_object(
        'a_grade', COUNT(*) FILTER (WHERE confidence_score >= 90),
        'b_grade', COUNT(*) FILTER (WHERE confidence_score >= 80 AND confidence_score < 90),
        'c_grade', COUNT(*) FILTER (WHERE confidence_score >= 70 AND confidence_score < 80),
        'd_grade', COUNT(*) FILTER (WHERE confidence_score >= 60 AND confidence_score < 70),
        'f_grade', COUNT(*) FILTER (WHERE confidence_score < 60)
      )
      FROM businesses WHERE campaign_id = campaign_id_param
    ),
    'processing_stages', (
      SELECT json_object_agg(processing_stage, stage_count)
      FROM (
        SELECT processing_stage, COUNT(*) as stage_count
        FROM businesses 
        WHERE campaign_id = campaign_id_param
        GROUP BY processing_stage
      ) stage_stats
    )
  ) INTO result
  FROM campaigns c
  LEFT JOIN businesses b ON c.id = b.campaign_id
  WHERE c.id = campaign_id_param
  GROUP BY c.id, c.name, c.status, c.created_at;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- ROW LEVEL SECURITY FOR NEW TABLES
-- ============================================================================

-- Enable RLS on new monitoring tables
ALTER TABLE api_cost_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_qualification_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_health_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_exports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for monitoring tables
CREATE POLICY "Users can view API cost tracking from their campaigns" ON api_cost_tracking
  FOR SELECT USING (
    campaign_id IN (
      SELECT id FROM campaigns WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert API cost tracking" ON api_cost_tracking
  FOR INSERT WITH CHECK (
    campaign_id IN (
      SELECT id FROM campaigns WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view lead qualification metrics from their campaigns" ON lead_qualification_metrics
  FOR SELECT USING (
    campaign_id IN (
      SELECT id FROM campaigns WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert lead qualification metrics" ON lead_qualification_metrics
  FOR INSERT WITH CHECK (
    campaign_id IN (
      SELECT id FROM campaigns WHERE user_id = auth.uid()
    )
  );

-- Service health metrics can be viewed by all authenticated users
CREATE POLICY "Users can view service health metrics" ON service_health_metrics
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "System can insert service health metrics" ON service_health_metrics
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Dashboard exports for user's own exports
CREATE POLICY "Users can view their own dashboard exports" ON dashboard_exports
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own dashboard exports" ON dashboard_exports
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- DATA MIGRATION AND CLEANUP (Optional)
-- ============================================================================

-- Function to migrate data from existing export_history to dashboard_exports
CREATE OR REPLACE FUNCTION migrate_export_history_to_dashboard_exports()
RETURNS INTEGER AS $$
DECLARE
  migrated_count INTEGER := 0;
BEGIN
  INSERT INTO dashboard_exports (
    user_id, campaign_id, export_type, file_format, 
    row_count, file_size_mb, download_url, expires_at, created_at
  )
  SELECT 
    eh.user_id,
    eh.campaign_id,
    COALESCE(eh.format, 'csv') as export_type,
    eh.format,
    eh.leads_count,
    ROUND(eh.file_size_bytes / 1048576.0, 2), -- Convert bytes to MB
    eh.download_url,
    eh.expires_at,
    eh.created_at
  FROM export_history eh
  WHERE NOT EXISTS (
    SELECT 1 FROM dashboard_exports de 
    WHERE de.user_id = eh.user_id 
      AND de.created_at = eh.created_at
      AND de.row_count = eh.leads_count
  );
  
  GET DIAGNOSTICS migrated_count = ROW_COUNT;
  RETURN migrated_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify schema compatibility
CREATE OR REPLACE FUNCTION verify_schema_compatibility()
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'existing_tables_found', (
      SELECT json_object_agg(table_name, 'exists')
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name IN ('businesses', 'campaigns', 'api_usage', 'user_settings')
    ),
    'new_monitoring_tables', (
      SELECT json_object_agg(table_name, 'created')
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name IN ('api_cost_tracking', 'lead_qualification_metrics', 'service_health_metrics', 'dashboard_exports')
    ),
    'foreign_key_constraints', (
      SELECT json_object_agg(constraint_name, referenced_table_name)
      FROM information_schema.referential_constraints rc
      JOIN information_schema.key_column_usage kcu 
        ON rc.constraint_name = kcu.constraint_name
      WHERE kcu.table_name IN ('lead_emails', 'lead_social_profiles')
    ),
    'sample_data_counts', (
      SELECT json_build_object(
        'businesses', (SELECT COUNT(*) FROM businesses),
        'campaigns', (SELECT COUNT(*) FROM campaigns),
        'api_usage', (SELECT COUNT(*) FROM api_usage)
      )
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Test query to verify everything works
SELECT verify_schema_compatibility();