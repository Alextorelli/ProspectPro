-- ============================================================================
-- ProspectPro Database Foundation - Phase 3: Monitoring and Analytics
-- ============================================================================
-- This script creates monitoring, analytics, and reporting tables for
-- comprehensive campaign performance tracking and system monitoring.
--
-- PREREQUISITES: Execute 01-database-foundation.sql and 02-leads-and-enrichment.sql FIRST
-- ============================================================================

-- Phase 3.1: Verify Lead Management Prerequisites
-- ============================================================================

DO $$
DECLARE
  required_tables TEXT[] := ARRAY['campaigns', 'enhanced_leads', 'lead_emails', 'api_usage_log'];
  missing_table TEXT;
  table_exists BOOLEAN;
BEGIN
  RAISE NOTICE '🔍 Phase 3.1: Verifying lead management prerequisites...';
  
  FOREACH missing_table IN ARRAY required_tables LOOP
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = missing_table
    ) INTO table_exists;
    
    IF NOT table_exists THEN
      RAISE EXCEPTION 'Missing required table: %. Execute previous phases first.', missing_table;
    END IF;
    
    RAISE NOTICE '   ✅ Required table % exists', missing_table;
  END LOOP;
  
  RAISE NOTICE '✅ Phase 3.1 Complete: All lead management prerequisites verified';
END $$;

-- Phase 3.2: Campaign Analytics and Performance Tracking
-- ============================================================================

-- Railway webhook event logs for deployment monitoring and debugging
CREATE TABLE IF NOT EXISTS railway_webhook_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Webhook event details
  event_type TEXT NOT NULL,
  deployment_id TEXT,
  project_id TEXT,
  environment_id TEXT,
  service_id TEXT,
  
  -- Event payload and metadata  
  event_data JSONB NOT NULL,
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  processing_duration_ms INTEGER,
  
  -- Status tracking
  processing_status TEXT DEFAULT 'processed' CHECK (processing_status IN ('processed', 'failed', 'retry')),
  error_message TEXT,
  
  -- Validation constraints
  CONSTRAINT valid_webhook_event_type CHECK (
    event_type IN (
      'deployment.success',
      'deployment.failed', 
      'deployment.crashed',
      'deployment.building',
      'deployment.queued',
      'deployment.deploying',
      'service.connected',
      'service.disconnected'
    )
  )
);

-- Deployment metrics and performance analytics
CREATE TABLE IF NOT EXISTS deployment_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Deployment identification
  deployment_id TEXT NOT NULL,
  project_id TEXT,
  environment_id TEXT,
  
  -- Deployment details
  status TEXT NOT NULL CHECK (status IN ('success', 'failure', 'crash', 'timeout')),
  branch TEXT DEFAULT 'main',
  commit_sha TEXT,
  
  -- Performance metrics
  build_time_ms INTEGER,
  queue_time_ms INTEGER,
  deploy_time_ms INTEGER,
  total_time_ms INTEGER,
  
  -- Build and deployment timestamps
  queued_at TIMESTAMP WITH TIME ZONE,
  build_started_at TIMESTAMP WITH TIME ZONE,
  build_finished_at TIMESTAMP WITH TIME ZONE,
  deployed_at TIMESTAMP WITH TIME ZONE,
  
  -- Error tracking
  error_category TEXT,
  error_summary TEXT,
  failure_count INTEGER DEFAULT 0,
  
  -- Health validation results
  health_check_passed BOOLEAN,
  health_check_duration_ms INTEGER,
  validation_errors JSONB,
  
  -- Resource usage estimates
  build_cost_estimate DECIMAL(10,6),
  deployment_size_mb DECIMAL(10,2),
  
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Deployment failure analysis for debugging assistance
CREATE TABLE IF NOT EXISTS deployment_failures (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Failure identification
  deployment_id TEXT NOT NULL,
  failure_timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Failure classification
  failure_type TEXT NOT NULL CHECK (failure_type IN (
    'build_failure', 'deployment_failure', 'runtime_crash', 
    'health_check_failure', 'timeout', 'resource_limit'
  )),
  failure_category TEXT, -- 'dependency', 'syntax', 'memory', 'network', etc.
  
  -- Failure details
  error_message TEXT,
  build_logs TEXT,
  stack_trace TEXT,
  
  -- Context and debugging info
  branch TEXT DEFAULT 'main',
  commit_sha TEXT,
  environment_variables JSONB,
  
  -- Resolution tracking
  resolved BOOLEAN DEFAULT false,
  resolution_notes TEXT,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by TEXT,
  
  -- Auto-generated debugging assistance
  debugging_recommendations TEXT[],
  recovery_steps TEXT[],
  
  -- Related deployments for pattern analysis
  previous_successful_deployment_id TEXT,
  next_successful_deployment_id TEXT
);

-- Campaign analytics for dashboard monitoring (depends on campaigns)
CREATE TABLE IF NOT EXISTS campaign_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  metric_name TEXT NOT NULL CHECK (LENGTH(metric_name) > 0),
  metric_value DECIMAL(12,4) NOT NULL,
  metric_type TEXT NOT NULL CHECK (metric_type IN ('cost', 'usage', 'performance', 'quality', 'conversion')),
  api_service TEXT, -- 'hunter_io', 'scrapingdog', 'google_places', etc.
  aggregation_period TEXT DEFAULT 'hourly' CHECK (aggregation_period IN ('hourly', 'daily', 'weekly', 'monthly')),
  metadata JSONB DEFAULT '{}',
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Ensure meaningful data
  CONSTRAINT campaign_analytics_positive_value CHECK (metric_value >= 0)
);

-- API cost tracking for budget management (depends on campaigns)
CREATE TABLE IF NOT EXISTS api_cost_tracking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE, -- Optional for system-wide tracking
  api_service TEXT NOT NULL CHECK (LENGTH(api_service) > 0),
  endpoint TEXT,
  request_count INTEGER DEFAULT 1 CHECK (request_count > 0),
  cost_per_request cost_amount_type NOT NULL,
  total_cost cost_amount_type NOT NULL,
  success_count INTEGER DEFAULT 0 CHECK (success_count >= 0),
  error_count INTEGER DEFAULT 0 CHECK (error_count >= 0),
  avg_response_time_ms INTEGER CHECK (avg_response_time_ms IS NULL OR avg_response_time_ms >= 0),
  rate_limit_remaining INTEGER CHECK (rate_limit_remaining IS NULL OR rate_limit_remaining >= 0),
  
  -- Time-based aggregation
  date DATE DEFAULT CURRENT_DATE,
  hour INTEGER DEFAULT EXTRACT(hour FROM now()) CHECK (hour >= 0 AND hour <= 23),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Data consistency constraints
  CONSTRAINT api_cost_tracking_request_counts CHECK (success_count + error_count <= request_count),
  CONSTRAINT api_cost_tracking_cost_calculation CHECK (total_cost = cost_per_request * request_count)
);

-- Lead qualification metrics for quality analysis (depends on campaigns)
CREATE TABLE IF NOT EXISTS lead_qualification_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  total_leads_discovered INTEGER DEFAULT 0 CHECK (total_leads_discovered >= 0),
  leads_qualified INTEGER DEFAULT 0 CHECK (leads_qualified >= 0),
  qualification_rate DECIMAL(5,4) GENERATED ALWAYS AS (
    CASE 
      WHEN total_leads_discovered > 0 THEN leads_qualified::DECIMAL / total_leads_discovered
      ELSE 0 
    END
  ) STORED,
  avg_confidence_score DECIMAL(5,2) CHECK (avg_confidence_score IS NULL OR (avg_confidence_score >= 0 AND avg_confidence_score <= 100)),
  total_api_calls INTEGER DEFAULT 0 CHECK (total_api_calls >= 0),
  total_api_cost cost_amount_type DEFAULT 0.00,
  cost_per_qualified_lead cost_amount_type GENERATED ALWAYS AS (
    CASE 
      WHEN leads_qualified > 0 THEN total_api_cost / leads_qualified
      ELSE 0 
    END
  ) STORED,
  roi_percentage DECIMAL(8,4), -- Calculated separately based on business value
  
  -- Time-based aggregation
  date DATE DEFAULT CURRENT_DATE,
  hour INTEGER DEFAULT EXTRACT(hour FROM now()) CHECK (hour >= 0 AND hour <= 23),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Data consistency constraints
  CONSTRAINT lead_qualification_metrics_qualified_lte_discovered CHECK (leads_qualified <= total_leads_discovered)
);

DO $$
BEGIN
  RAISE NOTICE '✅ Phase 3.2 Complete: Campaign analytics and performance tracking tables created';
  RAISE NOTICE '   - campaign_analytics: Detailed metric tracking';
  RAISE NOTICE '   - api_cost_tracking: Budget management and cost analysis';
  RAISE NOTICE '   - lead_qualification_metrics: Quality analysis and ROI tracking';
END $$;

-- Phase 3.3: Dashboard and Export Management
-- ============================================================================

-- Dashboard export logs for download tracking
CREATE TABLE IF NOT EXISTS dashboard_exports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL, -- References auth.users (Supabase managed)
  campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL, -- Optional: specific campaign export
  export_type TEXT NOT NULL CHECK (export_type IN ('cost_analysis', 'campaign_performance', 'roi_report', 'lead_export', 'full_report')),
  file_format TEXT NOT NULL CHECK (file_format IN ('csv', 'excel', 'json', 'pdf')),
  
  -- Export parameters
  start_date DATE,
  end_date DATE,
  campaign_ids UUID[], -- Array of campaign IDs for multi-campaign exports
  filters JSONB DEFAULT '{}',
  
  -- Export results
  row_count INTEGER CHECK (row_count IS NULL OR row_count >= 0),
  file_size_mb DECIMAL(8,2) CHECK (file_size_mb IS NULL OR file_size_mb >= 0),
  export_status TEXT DEFAULT 'pending' CHECK (export_status IN ('pending', 'processing', 'completed', 'failed')),
  download_url TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Constraints
  CONSTRAINT dashboard_exports_valid_completion CHECK (
    (export_status IN ('completed', 'failed') AND completed_at IS NOT NULL) OR
    (export_status NOT IN ('completed', 'failed') AND completed_at IS NULL)
  ),
  CONSTRAINT dashboard_exports_valid_date_range CHECK (
    start_date IS NULL OR end_date IS NULL OR start_date <= end_date
  )
);

DO $$
BEGIN
  RAISE NOTICE '✅ Phase 3.3 Complete: Dashboard and export management table created';
  RAISE NOTICE '   - dashboard_exports: Download tracking and file management';
END $$;

-- Phase 3.4: Performance Indexes for Analytics Tables
-- ============================================================================

-- Campaign analytics indexes
CREATE INDEX IF NOT EXISTS idx_campaign_analytics_campaign_id ON campaign_analytics(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_analytics_metric_type ON campaign_analytics(metric_type, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_campaign_analytics_timestamp ON campaign_analytics(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_campaign_analytics_service ON campaign_analytics(api_service, timestamp DESC) WHERE api_service IS NOT NULL;

-- Composite index for dashboard queries
CREATE INDEX IF NOT EXISTS idx_campaign_analytics_dashboard ON campaign_analytics(campaign_id, metric_type, DATE(timestamp));

-- API cost tracking indexes
CREATE INDEX IF NOT EXISTS idx_api_cost_tracking_service_date ON api_cost_tracking(api_service, date DESC, hour DESC);
CREATE INDEX IF NOT EXISTS idx_api_cost_tracking_campaign_id ON api_cost_tracking(campaign_id, date DESC) WHERE campaign_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_api_cost_tracking_total_cost ON api_cost_tracking(total_cost DESC) WHERE total_cost > 0;

-- Lead qualification metrics indexes
CREATE INDEX IF NOT EXISTS idx_lead_qualification_campaign_id ON lead_qualification_metrics(campaign_id);
CREATE INDEX IF NOT EXISTS idx_lead_qualification_date ON lead_qualification_metrics(date DESC, hour DESC);
CREATE INDEX IF NOT EXISTS idx_lead_qualification_rate ON lead_qualification_metrics(qualification_rate DESC) WHERE qualification_rate > 0;

-- Railway webhook monitoring indexes for deployment debugging
CREATE INDEX IF NOT EXISTS idx_railway_webhook_logs_event_type ON railway_webhook_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_railway_webhook_logs_deployment ON railway_webhook_logs(deployment_id);
CREATE INDEX IF NOT EXISTS idx_railway_webhook_logs_processed ON railway_webhook_logs(processed_at DESC);
CREATE INDEX IF NOT EXISTS idx_railway_webhook_logs_status ON railway_webhook_logs(processing_status, processed_at DESC);

-- Deployment metrics indexes for performance analysis
CREATE INDEX IF NOT EXISTS idx_deployment_metrics_deployment_id ON deployment_metrics(deployment_id);
CREATE INDEX IF NOT EXISTS idx_deployment_metrics_status ON deployment_metrics(status, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_deployment_metrics_branch ON deployment_metrics(branch, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_deployment_metrics_build_time ON deployment_metrics(build_time_ms DESC) WHERE build_time_ms IS NOT NULL;

-- Deployment failures indexes for debugging analysis
CREATE INDEX IF NOT EXISTS idx_deployment_failures_deployment_id ON deployment_failures(deployment_id);
CREATE INDEX IF NOT EXISTS idx_deployment_failures_type ON deployment_failures(failure_type, failure_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_deployment_failures_resolved ON deployment_failures(resolved, failure_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_deployment_failures_category ON deployment_failures(failure_category, failure_timestamp DESC);

-- Dashboard exports indexes
CREATE INDEX IF NOT EXISTS idx_dashboard_exports_user_id ON dashboard_exports(user_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_exports_user_created ON dashboard_exports(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dashboard_exports_campaign_id ON dashboard_exports(campaign_id) WHERE campaign_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_dashboard_exports_status ON dashboard_exports(export_status, created_at DESC);

DO $$
BEGIN
  RAISE NOTICE '✅ Phase 3.4 Complete: Performance indexes created for analytics tables';
END $$;

-- Phase 3.5: Analytics Table Validation
-- ============================================================================

DO $$
DECLARE
  table_count INTEGER;
  fk_count INTEGER;
  index_count INTEGER;
BEGIN
  -- Verify all analytics tables exist
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables
  WHERE table_schema = 'public' 
    AND table_name IN ('campaign_analytics', 'api_cost_tracking', 'lead_qualification_metrics', 'dashboard_exports');
    
  IF table_count != 4 THEN
    RAISE EXCEPTION 'Analytics table creation failed. Expected 4 tables, found %', table_count;
  END IF;
  
  -- Verify foreign key relationships
  SELECT COUNT(*) INTO fk_count
  FROM information_schema.table_constraints
  WHERE table_schema = 'public'
    AND constraint_type = 'FOREIGN KEY'
    AND table_name IN ('campaign_analytics', 'api_cost_tracking', 'lead_qualification_metrics', 'dashboard_exports');
    
  -- Verify performance indexes
  SELECT COUNT(*) INTO index_count
  FROM pg_indexes
  WHERE schemaname = 'public'
    AND (indexname LIKE 'idx_campaign_analytics_%'
      OR indexname LIKE 'idx_api_cost_tracking_%'
      OR indexname LIKE 'idx_lead_qualification_%'
      OR indexname LIKE 'idx_dashboard_exports_%');
     
  RAISE NOTICE '✅ Phase 3.5 Complete: Analytics infrastructure validation successful';
  RAISE NOTICE '   - Analytics tables created: %', table_count;
  RAISE NOTICE '   - Foreign key constraints: %', fk_count;
  RAISE NOTICE '   - Performance indexes: %', index_count;
END $$;

-- Phase 3.6: Materialized View for Performance
-- ============================================================================

-- Create materialized view for fast dashboard queries
CREATE MATERIALIZED VIEW IF NOT EXISTS lead_analytics_summary AS
SELECT 
  c.id as campaign_id,
  c.name as campaign_name,
  c.user_id,
  c.status as campaign_status,
  COUNT(el.id) as total_leads,
  COUNT(el.id) FILTER (WHERE el.confidence_score >= 70) as qualified_leads,
  ROUND(AVG(el.confidence_score), 1) as avg_confidence_score,
  COALESCE(SUM(el.total_cost), 0) as total_cost,
  COUNT(le.id) as total_emails,
  COUNT(le.id) FILTER (WHERE le.verification_status = 'deliverable') as verified_emails,
  COUNT(lsp.id) as social_profiles,
  c.created_at,
  c.updated_at,
  -- Performance metrics
  CASE 
    WHEN COUNT(el.id) > 0 THEN COALESCE(SUM(el.total_cost), 0) / COUNT(el.id)
    ELSE 0 
  END as cost_per_lead,
  CASE 
    WHEN COUNT(el.id) FILTER (WHERE el.confidence_score >= 70) > 0 
    THEN COALESCE(SUM(el.total_cost), 0) / COUNT(el.id) FILTER (WHERE el.confidence_score >= 70)
    ELSE 0 
  END as cost_per_qualified_lead
FROM campaigns c
LEFT JOIN enhanced_leads el ON c.id = el.campaign_id
LEFT JOIN lead_emails le ON el.id = le.lead_id
LEFT JOIN lead_social_profiles lsp ON el.id = lsp.lead_id
GROUP BY c.id, c.name, c.user_id, c.status, c.created_at, c.updated_at;

-- Create unique index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_lead_analytics_summary_campaign_id 
ON lead_analytics_summary(campaign_id);

-- Additional performance indexes on materialized view
CREATE INDEX IF NOT EXISTS idx_lead_analytics_summary_user_id 
ON lead_analytics_summary(user_id);

CREATE INDEX IF NOT EXISTS idx_lead_analytics_summary_performance 
ON lead_analytics_summary(cost_per_qualified_lead ASC, qualified_leads DESC) 
WHERE qualified_leads > 0;

DO $$
BEGIN
  RAISE NOTICE '✅ Phase 3.6 Complete: Performance materialized view created';
  RAISE NOTICE '   - lead_analytics_summary: Fast dashboard analytics';
END $$;

-- Phase 3.7: Railway Deployment Analytics Views
-- ============================================================================

-- Deployment analytics view for success rate monitoring
CREATE OR REPLACE VIEW deployment_analytics AS
SELECT 
  DATE(processed_at) as deployment_date,
  event_type,
  COUNT(*) as event_count,
  COUNT(*) FILTER (WHERE event_type = 'deployment.success') as successful_deployments,
  COUNT(*) FILTER (WHERE event_type = 'deployment.failed') as failed_deployments,
  COUNT(*) FILTER (WHERE event_type = 'deployment.crashed') as crashed_deployments,
  ROUND(
    COUNT(*) FILTER (WHERE event_type = 'deployment.success')::numeric / 
    NULLIF(COUNT(*) FILTER (WHERE event_type IN ('deployment.success', 'deployment.failed')), 0) * 100, 
    2
  ) as success_rate_percentage,
  AVG(CASE 
    WHEN event_type = 'deployment.success' AND (event_data->'deployment'->>'buildTime')::integer IS NOT NULL 
    THEN (event_data->'deployment'->>'buildTime')::integer 
  END) as avg_build_time_ms
FROM railway_webhook_logs 
WHERE processed_at >= CURRENT_DATE - INTERVAL '30 days'
  AND event_type LIKE 'deployment.%'
GROUP BY DATE(processed_at), event_type
ORDER BY deployment_date DESC;

-- Deployment health summary function for monitoring dashboard
CREATE OR REPLACE FUNCTION get_deployment_health_summary()
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'last_24_hours', (
      SELECT json_build_object(
        'total_deployments', COUNT(*),
        'successful', COUNT(*) FILTER (WHERE event_type = 'deployment.success'),
        'failed', COUNT(*) FILTER (WHERE event_type = 'deployment.failed'),
        'crashed', COUNT(*) FILTER (WHERE event_type = 'deployment.crashed'),
        'success_rate', ROUND(
          COUNT(*) FILTER (WHERE event_type = 'deployment.success')::numeric / 
          NULLIF(COUNT(*), 0) * 100, 1
        )
      )
      FROM railway_webhook_logs 
      WHERE processed_at >= NOW() - INTERVAL '24 hours'
        AND event_type LIKE 'deployment.%'
    ),
    'last_deployment', (
      SELECT json_build_object(
        'event_type', event_type,
        'processed_at', processed_at,
        'deployment_id', deployment_id,
        'success', event_type = 'deployment.success'
      )
      FROM railway_webhook_logs 
      WHERE event_type LIKE 'deployment.%'
      ORDER BY processed_at DESC 
      LIMIT 1
    ),
    'recent_failures', (
      SELECT json_agg(
        json_build_object(
          'deployment_id', deployment_id,
          'failed_at', processed_at,
          'error_details', event_data->'deployment'->>'error',
          'build_time_ms', CASE 
            WHEN (event_data->'deployment'->>'buildTime')::text ~ '^[0-9]+$' 
            THEN (event_data->'deployment'->>'buildTime')::integer 
            ELSE NULL 
          END
        )
      )
      FROM railway_webhook_logs 
      WHERE event_type = 'deployment.failed'
        AND processed_at >= NOW() - INTERVAL '7 days'
      ORDER BY processed_at DESC
      LIMIT 5
    ),
    'build_performance', (
      SELECT json_build_object(
        'avg_build_time_ms', ROUND(AVG(CASE 
          WHEN (event_data->'deployment'->>'buildTime')::text ~ '^[0-9]+$' 
          THEN (event_data->'deployment'->>'buildTime')::integer 
        END)),
        'fastest_build_ms', MIN(CASE 
          WHEN (event_data->'deployment'->>'buildTime')::text ~ '^[0-9]+$' 
          THEN (event_data->'deployment'->>'buildTime')::integer 
        END),
        'slowest_build_ms', MAX(CASE 
          WHEN (event_data->'deployment'->>'buildTime')::text ~ '^[0-9]+$' 
          THEN (event_data->'deployment'->>'buildTime')::integer 
        END),
        'total_successful_builds', COUNT(*)
      )
      FROM railway_webhook_logs 
      WHERE event_type = 'deployment.success'
        AND processed_at >= NOW() - INTERVAL '7 days'
        AND (event_data->'deployment'->>'buildTime')::text ~ '^[0-9]+$'
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to analyze deployment failure patterns
CREATE OR REPLACE FUNCTION analyze_deployment_failures(days_back INTEGER DEFAULT 7)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'failure_categories', (
      SELECT json_object_agg(
        failure_category,
        category_data
      )
      FROM (
        SELECT 
          COALESCE(failure_category, 'uncategorized') as failure_category,
          json_build_object(
            'count', COUNT(*),
            'percentage', ROUND(COUNT(*)::numeric / SUM(COUNT(*)) OVER () * 100, 1),
            'avg_time_to_failure_ms', ROUND(AVG(build_time_ms)),
            'recent_examples', (
              SELECT json_agg(
                json_build_object(
                  'deployment_id', deployment_id,
                  'failed_at', failure_timestamp,
                  'error_summary', LEFT(error_summary, 100)
                )
              )
              FROM deployment_failures df2
              WHERE df2.failure_category = COALESCE(df.failure_category, 'uncategorized')
                AND df2.failure_timestamp >= NOW() - INTERVAL '%s days'
              ORDER BY df2.failure_timestamp DESC
              LIMIT 3
            )
          ) as category_data
        FROM deployment_failures df
        WHERE failure_timestamp >= NOW() - INTERVAL '%s days'
        GROUP BY failure_category
      ) categories
    ),
    'resolution_stats', (
      SELECT json_build_object(
        'total_failures', COUNT(*),
        'resolved_failures', COUNT(*) FILTER (WHERE resolved = true),
        'resolution_rate_percent', ROUND(
          COUNT(*) FILTER (WHERE resolved = true)::numeric / NULLIF(COUNT(*), 0) * 100, 1
        ),
        'avg_resolution_time_hours', ROUND(
          EXTRACT(EPOCH FROM AVG(resolved_at - failure_timestamp)) / 3600, 1
        ) FILTER (WHERE resolved = true AND resolved_at IS NOT NULL)
      )
      FROM deployment_failures
      WHERE failure_timestamp >= NOW() - INTERVAL '%s days'
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  RAISE NOTICE '✅ Phase 3.7 Complete: Railway deployment analytics views and functions';
END $$;

-- ============================================================================
-- Phase 3 Complete Summary
-- ============================================================================

DO $$
DECLARE
  completion_time TIMESTAMP WITH TIME ZONE := now();
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🎯 PHASE 3 COMPLETE: Monitoring and Analytics Infrastructure';
  RAISE NOTICE '========================================================';
  RAISE NOTICE 'Completion Time: %', completion_time;
  RAISE NOTICE '';
  RAISE NOTICE 'Analytics Infrastructure:';
  RAISE NOTICE '- ✅ Campaign performance metrics tracking';
  RAISE NOTICE '- ✅ API cost monitoring and budget management';
  RAISE NOTICE '- ✅ Lead qualification analysis';
  RAISE NOTICE '- ✅ Dashboard export management';
  RAISE NOTICE '- ✅ Railway deployment monitoring and debugging';
  RAISE NOTICE '- ✅ Deployment failure analysis and recovery tracking';
  RAISE NOTICE '- ✅ Performance-optimized materialized views';
  RAISE NOTICE '- ✅ Comprehensive indexing strategy';
  RAISE NOTICE '';
  RAISE NOTICE 'Advanced Features:';
  RAISE NOTICE '- ✅ Real-time cost tracking';
  RAISE NOTICE '- ✅ ROI calculation and analysis';
  RAISE NOTICE '- ✅ Time-based metric aggregation';
  RAISE NOTICE '- ✅ Multi-format export support';
  RAISE NOTICE '- ✅ Railway webhook processing and analytics';
  RAISE NOTICE '- ✅ Automated deployment failure analysis';
  RAISE NOTICE '- ✅ Build performance monitoring';
  RAISE NOTICE '- ✅ Automatic data validation';
  RAISE NOTICE '';
  RAISE NOTICE 'Next Steps:';
  RAISE NOTICE '1. Execute 04-functions-and-procedures.sql';
  RAISE NOTICE '2. Execute 05-security-and-rls.sql';
END $$;