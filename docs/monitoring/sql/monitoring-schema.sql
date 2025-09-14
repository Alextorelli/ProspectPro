-- ============================================================================
-- ProspectPro Database Schema Deployment for Supabase - SIMPLIFIED VERSION
-- Avoids dollar-quoting issues by using direct SQL statements
-- ============================================================================

-- WARNING: Always backup your database before running schema changes!
-- Run this script in sections, not all at once for safety

-- ============================================================================
-- STEP 1: VERIFY EXISTING DATABASE STRUCTURE
-- ============================================================================

-- Check existing table structure
SELECT 'VERIFICATION: Checking existing tables...' as status;

SELECT
    table_name,
    COUNT(*) as column_count
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name IN ('businesses', 'campaigns', 'api_usage', 'user_settings')
GROUP BY table_name
ORDER BY table_name;

-- ============================================================================
-- STEP 2: ADD MONITORING TABLES (Safe - No conflicts with existing)
-- ============================================================================

SELECT 'DEPLOYMENT: Adding monitoring tables...' as status;

-- API cost tracking for dashboard monitoring
CREATE TABLE
IF NOT EXISTS api_cost_tracking
(
  id UUID DEFAULT gen_random_uuid
() PRIMARY KEY,
  campaign_id UUID REFERENCES campaigns
(id) ON
DELETE CASCADE,
  business_id UUID
REFERENCES businesses
(id) ON
DELETE CASCADE,
  api_service TEXT
NOT NULL,
  endpoint TEXT,
  request_count INTEGER DEFAULT 1,
  cost_per_request DECIMAL
(8,4),
  total_cost DECIMAL
(10,4),
  success_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  avg_response_time_ms INTEGER,
  rate_limit_remaining INTEGER,
  date DATE DEFAULT CURRENT_DATE,
  hour INTEGER DEFAULT EXTRACT
(hour FROM now
()),
  created_at TIMESTAMP
WITH TIME ZONE DEFAULT now
()
);

-- Lead qualification metrics for dashboard
CREATE TABLE
IF NOT EXISTS lead_qualification_metrics
(
  id UUID DEFAULT gen_random_uuid
() PRIMARY KEY,
  campaign_id UUID REFERENCES campaigns
(id) ON
DELETE CASCADE,
  total_leads_discovered INTEGER
DEFAULT 0,
  leads_qualified INTEGER DEFAULT 0,
  qualification_rate DECIMAL
(5,4),
  avg_confidence_score DECIMAL
(5,2),
  total_api_calls INTEGER DEFAULT 0,
  total_api_cost DECIMAL
(10,4) DEFAULT 0,
  cost_per_qualified_lead DECIMAL
(8,4),
  roi_percentage DECIMAL
(8,4),
  date DATE DEFAULT CURRENT_DATE,
  hour INTEGER DEFAULT EXTRACT
(hour FROM now
()),
  created_at TIMESTAMP
WITH TIME ZONE DEFAULT now
()
);

-- Service health metrics for monitoring
CREATE TABLE
IF NOT EXISTS service_health_metrics
(
  id UUID DEFAULT gen_random_uuid
() PRIMARY KEY,
  service_name TEXT NOT NULL,
  status TEXT NOT NULL,
  response_time_ms INTEGER,
  error_rate DECIMAL
(5,4),
  rate_limit_remaining INTEGER,
  cost_budget_remaining DECIMAL
(10,2),
  requests_today INTEGER DEFAULT 0,
  cost_today DECIMAL
(10,2) DEFAULT 0.00,
  last_successful_call TIMESTAMP
WITH TIME ZONE,
  last_error TEXT,
  timestamp TIMESTAMP
WITH TIME ZONE DEFAULT now
()
);

-- Dashboard export logs
CREATE TABLE
IF NOT EXISTS dashboard_exports
(
  id UUID DEFAULT gen_random_uuid
() PRIMARY KEY,
  user_id UUID REFERENCES auth.users
(id) ON
DELETE CASCADE,
  campaign_id UUID
REFERENCES campaigns
(id) ON
DELETE CASCADE,
  export_type TEXT
NOT NULL,
  file_format TEXT NOT NULL,
  start_date DATE,
  end_date DATE,
  campaign_ids UUID[],
  row_count INTEGER,
  file_size_mb DECIMAL
(8,2),
  export_status TEXT DEFAULT 'completed' CHECK
(export_status IN
('pending', 'completed', 'failed')),
  download_url TEXT,
  expires_at TIMESTAMP
WITH TIME ZONE,
  created_at TIMESTAMP
WITH TIME ZONE DEFAULT now
()
);

SELECT 'SUCCESS: Monitoring tables created' as status;

-- ============================================================================
-- STEP 3: CREATE PERFORMANCE INDEXES (Safe - Only improves performance)
-- ============================================================================

SELECT 'DEPLOYMENT: Creating performance indexes...' as status;

-- Indexes for new monitoring tables
CREATE INDEX
IF NOT EXISTS idx_api_cost_tracking_service_date ON api_cost_tracking
(api_service, date, hour);
CREATE INDEX
IF NOT EXISTS idx_api_cost_tracking_campaign ON api_cost_tracking
(campaign_id, date DESC);
CREATE INDEX
IF NOT EXISTS idx_lead_qualification_date ON lead_qualification_metrics
(date DESC, hour DESC);
CREATE INDEX
IF NOT EXISTS idx_lead_qualification_campaign ON lead_qualification_metrics
(campaign_id, date DESC);
CREATE INDEX
IF NOT EXISTS idx_service_health_service_timestamp ON service_health_metrics
(service_name, timestamp DESC);
CREATE INDEX
IF NOT EXISTS idx_dashboard_exports_user_created ON dashboard_exports
(user_id, created_at DESC);

-- Enhanced indexes for existing tables
CREATE INDEX
IF NOT EXISTS idx_businesses_campaign_confidence ON businesses
(campaign_id, confidence_score DESC);
CREATE INDEX
IF NOT EXISTS idx_businesses_qualified ON businesses
(is_qualified, confidence_score DESC);
CREATE INDEX
IF NOT EXISTS idx_businesses_cost ON businesses
(total_cost);
CREATE INDEX
IF NOT EXISTS idx_api_usage_service_created ON api_usage
(service, created_at DESC);
CREATE INDEX
IF NOT EXISTS idx_campaigns_status_created ON campaigns
(status, created_at DESC);

SELECT 'SUCCESS: Performance indexes created' as status;

-- ============================================================================
-- STEP 4: CONFIGURE ROW LEVEL SECURITY (Safe - Only adds security)
-- ============================================================================

SELECT 'DEPLOYMENT: Configuring Row Level Security...' as status;

-- Enable RLS on new monitoring tables
ALTER TABLE api_cost_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_qualification_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_health_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_exports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for monitoring tables
CREATE POLICY "Users can view API cost tracking from their campaigns" ON api_cost_tracking
  FOR
SELECT USING (
    campaign_id IN (
      SELECT id
    FROM campaigns
    WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert API cost tracking" ON api_cost_tracking
  FOR
INSERT WITH CHECK
    (
    campaign_
d 
N (
    SELECT id
FROM campaigns
WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Users can view lead qualification metrics from their campaigns" ON lead_qualification_metrics
  FOR
SELECT USING (
    campaign_id IN (
      SELECT id
    FROM campaigns
    WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert lead qualification metrics" ON lead_qualification_metrics
  FOR
INSERT WITH CHECK
    (
    campaign_
d 
N (
    SELECT id
FROM campaigns
WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Users can view service health metrics" ON service_health_metrics
  FOR
SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "System can insert service health metrics" ON service_health_metrics
  FOR
INSERT WITH CHECK (auth.role() = 'authenticated')
;

CREATE POLICY "Users can view their own dashboard exports" ON dashboard_exports
  FOR
SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own dashboard exports" ON dashboard_exports
  FOR
INSERT WITH CHECK
    (user_id =
auth.uid()

);

SELECT 'SUCCESS: Row Level Security configured' as status;

-- ============================================================================
-- STEP 5: INITIALIZE SAMPLE MONITORING DATA (Safe - Just adds sample data)
-- ============================================================================

SELECT 'DEPLOYMENT: Initializing sample monitoring data...' as status;

-- Insert sample service health data
INSERT INTO service_health_metrics
    (service_name, status, response_time_ms, error_rate)
VALUES
    ('google_places', 'healthy', 150, 0.01),
    ('hunter_io', 'healthy', 200, 0.02),
    ('scrapingdog', 'healthy', 300, 0.01),
    ('neverbounce', 'healthy', 250, 0.00)
ON CONFLICT DO NOTHING;

SELECT 'SUCCESS: Sample monitoring data initialized' as status;

-- ============================================================================
-- STEP 6: FINAL VERIFICATION (Using the simple approach that worked)
-- ============================================================================

SELECT 'VERIFICATION: Running final compatibility check...' as status;

-- Simple verification query (same one that worked for you)
SELECT
    'deployment_complete' as test_type,
    json_build_object(
    'existing_tables', (
      SELECT json_object_agg(table_name, 'exists')
    FROM information_schema.tables
    WHERE table_schema = 'public'
        AND table_name IN ('businesses', 'campaigns', 'api_usage', 'user_settings')
    ),
    'monitoring_tables', (
      SELECT json_object_agg(table_name, 'created')
    FROM information_schema.tables
    WHERE table_schema = 'public'
        AND table_name IN ('api_cost_tracking', 'lead_qualification_metrics', 'service_health_metrics', 'dashboard_exports')
    ),
    'data_counts', (
      SELECT json_build_object(
        'businesses', (SELECT COUNT(*)
        FROM businesses),
        'campaigns', (SELECT COUNT(*)
        FROM campaigns),
        'api_usage', (SELECT COUNT(*)
        FROM api_usage)
      )
    ),
    'indexes_created', (
      SELECT COUNT(*)
    FROM pg_indexes
    WHERE schemaname = 'public'
        AND indexname LIKE 'idx_%'
    )
  ) as deployment_status;

SELECT 'SUCCESS: ProspectPro database enhanced with monitoring capabilities!' as final_status;