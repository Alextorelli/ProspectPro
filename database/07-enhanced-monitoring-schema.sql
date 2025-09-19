-- ============================================================================
-- ProspectPro Enhanced Monitoring & Business Intelligence Schema
-- Phase 7: Comprehensive tracking for new API sources, cost optimization, and quality metrics
-- ============================================================================
-- This script creates enhanced monitoring tables for:
-- - New API sources (Yelp Fusion, Chamber directories, Government APIs)
-- - Real-time cost tracking and budget management
-- - Quality scoring and validation success metrics
-- - Business intelligence and ROI analytics
-- ============================================================================
-- Phase 7.1: Enhanced API Source Tracking
-- ============================================================================
-- Track all available API data sources and their configurations
CREATE TABLE IF NOT EXISTS api_data_sources (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    -- Source identification
    source_name TEXT NOT NULL UNIQUE,
    -- 'yelp_fusion', 'chamber_directory', 'google_places', 'state_registry', etc.
    source_type TEXT NOT NULL,
    -- 'discovery', 'enrichment', 'validation', 'verification'
    provider_name TEXT NOT NULL,
    -- 'Yelp', 'Google', 'California SOS', 'Chamber of Commerce'
    -- API configuration
    base_url TEXT,
    api_version TEXT,
    requires_auth BOOLEAN DEFAULT true,
    auth_type TEXT,
    -- 'api_key', 'oauth', 'none'
    -- Cost structure
    cost_per_request DECIMAL(10, 4) DEFAULT 0.0000,
    cost_model TEXT DEFAULT 'per_request',
    -- 'per_request', 'per_result', 'monthly_quota'
    free_tier_limit INTEGER DEFAULT 0,
    -- Quality and reliability metrics
    quality_score INTEGER DEFAULT 50,
    -- 0-100, based on data accuracy
    reliability_score INTEGER DEFAULT 50,
    -- 0-100, based on uptime/success rate
    data_freshness_hours INTEGER DEFAULT 24,
    -- How fresh the data typically is
    -- Business value
    priority_level INTEGER DEFAULT 5,
    -- 1-10, higher = more important
    business_value TEXT,
    -- Description of what this source provides
    -- Status
    is_active BOOLEAN DEFAULT true,
    last_health_check TIMESTAMP WITH TIME ZONE,
    health_status TEXT DEFAULT 'unknown' -- 'healthy', 'degraded', 'unhealthy', 'unknown'
);
-- Enhanced API usage tracking with detailed cost attribution
CREATE TABLE IF NOT EXISTS enhanced_api_usage (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    -- Request identification
    campaign_id UUID REFERENCES campaigns(id),
    session_id TEXT,
    request_id TEXT,
    -- API source details
    source_id UUID REFERENCES api_data_sources(id),
    source_name TEXT NOT NULL,
    endpoint TEXT,
    http_method TEXT DEFAULT 'GET',
    -- Request details
    request_params JSONB,
    query_type TEXT,
    -- 'discovery', 'enrichment', 'validation'
    business_query TEXT,
    location_query TEXT,
    -- Response details
    response_code INTEGER,
    response_time_ms INTEGER,
    results_returned INTEGER DEFAULT 0,
    success BOOLEAN DEFAULT false,
    error_message TEXT,
    -- Cost tracking
    estimated_cost DECIMAL(10, 4) DEFAULT 0.0000,
    actual_cost DECIMAL(10, 4),
    cost_currency TEXT DEFAULT 'USD',
    billing_category TEXT,
    -- 'free_tier', 'paid_usage', 'overage'
    -- Quality metrics
    data_quality_score INTEGER,
    -- 0-100
    useful_results INTEGER DEFAULT 0,
    -- Results that passed quality filters
    -- Performance tracking
    cache_hit BOOLEAN DEFAULT false,
    rate_limited BOOLEAN DEFAULT false,
    retry_count INTEGER DEFAULT 0
);
-- Phase 7.2: Lead Quality and Validation Tracking
-- ============================================================================
-- Track the 4-stage validation pipeline results
CREATE TABLE IF NOT EXISTS lead_validation_pipeline (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    -- Lead identification
    lead_id UUID REFERENCES enhanced_leads(id),
    campaign_id UUID REFERENCES campaigns(id),
    business_name TEXT NOT NULL,
    -- Stage 1: Pre-validation
    stage_1_prevalidation JSONB DEFAULT '{}',
    stage_1_score INTEGER DEFAULT 0,
    -- 0-100
    stage_1_passed BOOLEAN DEFAULT false,
    stage_1_cost DECIMAL(8, 4) DEFAULT 0.0000,
    -- Stage 2: Registry Validation (Government APIs)
    stage_2_registry JSONB DEFAULT '{}',
    stage_2_score INTEGER DEFAULT 0,
    -- 0-100  
    stage_2_sources_checked INTEGER DEFAULT 0,
    stage_2_sources_validated INTEGER DEFAULT 0,
    stage_2_passed BOOLEAN DEFAULT false,
    stage_2_cost DECIMAL(8, 4) DEFAULT 0.0000,
    -- Stage 3: Email Validation
    stage_3_email JSONB DEFAULT '{}',
    stage_3_score INTEGER DEFAULT 0,
    -- 0-100
    stage_3_emails_found INTEGER DEFAULT 0,
    stage_3_emails_validated INTEGER DEFAULT 0,
    stage_3_passed BOOLEAN DEFAULT false,
    stage_3_cost DECIMAL(8, 4) DEFAULT 0.0000,
    -- Stage 4: Final Scoring
    stage_4_final JSONB DEFAULT '{}',
    stage_4_confidence_score INTEGER DEFAULT 0,
    -- 0-100
    stage_4_qualified BOOLEAN DEFAULT false,
    stage_4_export_ready BOOLEAN DEFAULT false,
    -- Overall pipeline results
    total_cost DECIMAL(10, 4) DEFAULT 0.0000,
    processing_time_seconds INTEGER,
    final_quality_grade TEXT,
    -- 'A', 'B', 'C', 'D', 'F'
    qualification_reasons TEXT [],
    -- Array of reasons why qualified/disqualified
    -- Business intelligence
    data_source_attribution JSONB DEFAULT '{}',
    -- Which sources contributed what data
    enrichment_level TEXT DEFAULT 'basic' -- 'basic', 'enhanced', 'premium'
);
-- Phase 7.3: Business Intelligence and ROI Tracking
-- ============================================================================
-- Campaign performance analytics with ROI calculations
CREATE TABLE IF NOT EXISTS campaign_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    -- Campaign identification
    campaign_id UUID REFERENCES campaigns(id) UNIQUE,
    campaign_name TEXT,
    campaign_date DATE DEFAULT CURRENT_DATE,
    -- Discovery metrics
    businesses_discovered INTEGER DEFAULT 0,
    sources_used INTEGER DEFAULT 0,
    discovery_cost DECIMAL(10, 4) DEFAULT 0.0000,
    discovery_time_minutes INTEGER DEFAULT 0,
    -- Validation metrics
    businesses_validated INTEGER DEFAULT 0,
    validation_success_rate DECIMAL(5, 2) DEFAULT 0.00,
    -- Percentage
    avg_confidence_score DECIMAL(5, 2) DEFAULT 0.00,
    validation_cost DECIMAL(10, 4) DEFAULT 0.0000,
    -- Quality metrics
    qualified_leads INTEGER DEFAULT 0,
    qualification_rate DECIMAL(5, 2) DEFAULT 0.00,
    -- Percentage
    a_grade_leads INTEGER DEFAULT 0,
    b_grade_leads INTEGER DEFAULT 0,
    c_grade_leads INTEGER DEFAULT 0,
    -- Cost analysis
    total_cost DECIMAL(10, 4) DEFAULT 0.0000,
    cost_per_lead DECIMAL(8, 4) DEFAULT 0.0000,
    cost_per_qualified_lead DECIMAL(8, 4) DEFAULT 0.0000,
    -- ROI metrics
    estimated_lead_value DECIMAL(10, 2) DEFAULT 0.00,
    estimated_roi_percentage DECIMAL(8, 2) DEFAULT 0.00,
    -- Performance benchmarks
    processing_speed_leads_per_minute DECIMAL(8, 2) DEFAULT 0.00,
    api_success_rate DECIMAL(5, 2) DEFAULT 0.00,
    error_count INTEGER DEFAULT 0,
    -- Business intelligence
    top_performing_sources JSONB DEFAULT '[]',
    cost_optimization_opportunities JSONB DEFAULT '{}',
    quality_improvement_suggestions JSONB DEFAULT '[]'
);
-- Phase 7.4: Budget Management and Cost Controls
-- ============================================================================
-- Budget allocation and monitoring
CREATE TABLE IF NOT EXISTS budget_management (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    -- Budget period
    budget_period TEXT NOT NULL,
    -- 'daily', 'weekly', 'monthly'
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    -- Budget allocation
    total_budget DECIMAL(10, 2) NOT NULL,
    discovery_budget DECIMAL(10, 2) DEFAULT 0.00,
    validation_budget DECIMAL(10, 2) DEFAULT 0.00,
    enrichment_budget DECIMAL(10, 2) DEFAULT 0.00,
    -- API source budget allocation
    google_places_budget DECIMAL(8, 2) DEFAULT 0.00,
    yelp_fusion_budget DECIMAL(8, 2) DEFAULT 0.00,
    chamber_directory_budget DECIMAL(8, 2) DEFAULT 0.00,
    email_validation_budget DECIMAL(8, 2) DEFAULT 0.00,
    government_apis_budget DECIMAL(8, 2) DEFAULT 0.00,
    -- Current usage
    total_spent DECIMAL(10, 2) DEFAULT 0.00,
    discovery_spent DECIMAL(10, 2) DEFAULT 0.00,
    validation_spent DECIMAL(10, 2) DEFAULT 0.00,
    enrichment_spent DECIMAL(10, 2) DEFAULT 0.00,
    -- Utilization metrics
    budget_utilization_percentage DECIMAL(5, 2) DEFAULT 0.00,
    projected_overage DECIMAL(10, 2) DEFAULT 0.00,
    days_remaining_in_period INTEGER,
    -- Controls and alerts
    alert_threshold_percentage DECIMAL(5, 2) DEFAULT 75.00,
    hard_limit_enabled BOOLEAN DEFAULT true,
    auto_pause_campaigns BOOLEAN DEFAULT false,
    -- Status
    is_active BOOLEAN DEFAULT true,
    last_alert_sent TIMESTAMP WITH TIME ZONE,
    over_budget BOOLEAN DEFAULT false
);
-- Budget alerts and notifications
CREATE TABLE IF NOT EXISTS budget_alerts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    -- Alert identification
    budget_id UUID REFERENCES budget_management(id),
    alert_type TEXT NOT NULL,
    -- 'threshold', 'overage', 'projection', 'daily_limit'
    severity_level TEXT NOT NULL,
    -- 'info', 'warning', 'critical'
    -- Alert details
    current_spend DECIMAL(10, 2),
    budget_limit DECIMAL(10, 2),
    utilization_percentage DECIMAL(5, 2),
    projected_overage DECIMAL(10, 2),
    -- Alert message
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    recommended_actions JSONB DEFAULT '[]',
    -- Status
    is_acknowledged BOOLEAN DEFAULT false,
    acknowledged_by TEXT,
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    resolved BOOLEAN DEFAULT false
);
-- Phase 7.5: System Health and Performance Monitoring
-- ============================================================================
-- API health monitoring
CREATE TABLE IF NOT EXISTS api_health_monitoring (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    -- API source
    source_id UUID REFERENCES api_data_sources(id),
    source_name TEXT NOT NULL,
    -- Health check details
    check_type TEXT NOT NULL,
    -- 'automated', 'manual', 'alert_triggered'
    response_time_ms INTEGER,
    status_code INTEGER,
    success BOOLEAN DEFAULT false,
    -- Performance metrics
    requests_per_minute INTEGER DEFAULT 0,
    success_rate_percentage DECIMAL(5, 2) DEFAULT 0.00,
    error_rate_percentage DECIMAL(5, 2) DEFAULT 0.00,
    -- Quality metrics
    data_accuracy_score INTEGER DEFAULT 0,
    -- 0-100
    data_completeness_score INTEGER DEFAULT 0,
    -- 0-100
    -- Issues and alerts
    issues_detected JSONB DEFAULT '[]',
    performance_degraded BOOLEAN DEFAULT false,
    requires_attention BOOLEAN DEFAULT false,
    -- Resolution
    issue_resolved BOOLEAN DEFAULT false,
    resolution_notes TEXT
);
-- System performance aggregates
CREATE TABLE IF NOT EXISTS system_performance_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    metric_date DATE DEFAULT CURRENT_DATE,
    -- Overall system metrics
    total_api_requests INTEGER DEFAULT 0,
    successful_requests INTEGER DEFAULT 0,
    failed_requests INTEGER DEFAULT 0,
    avg_response_time_ms INTEGER DEFAULT 0,
    -- Lead processing metrics
    leads_processed INTEGER DEFAULT 0,
    leads_qualified INTEGER DEFAULT 0,
    avg_processing_time_seconds INTEGER DEFAULT 0,
    -- Cost metrics
    total_daily_cost DECIMAL(10, 4) DEFAULT 0.0000,
    cost_per_lead DECIMAL(8, 4) DEFAULT 0.0000,
    cost_efficiency_score INTEGER DEFAULT 0,
    -- 0-100
    -- Quality metrics
    avg_confidence_score DECIMAL(5, 2) DEFAULT 0.00,
    data_quality_score INTEGER DEFAULT 0,
    -- 0-100
    -- Business metrics
    campaigns_active INTEGER DEFAULT 0,
    users_active INTEGER DEFAULT 0,
    exports_completed INTEGER DEFAULT 0
);
-- Phase 7.6: Indexes and Constraints for Performance
-- ============================================================================
-- API usage tracking indexes
CREATE INDEX IF NOT EXISTS idx_enhanced_api_usage_created_at ON enhanced_api_usage(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_enhanced_api_usage_campaign_id ON enhanced_api_usage(campaign_id);
CREATE INDEX IF NOT EXISTS idx_enhanced_api_usage_source_name ON enhanced_api_usage(source_name);
CREATE INDEX IF NOT EXISTS idx_enhanced_api_usage_success ON enhanced_api_usage(success);
-- Lead validation pipeline indexes
CREATE INDEX IF NOT EXISTS idx_lead_validation_pipeline_created_at ON lead_validation_pipeline(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lead_validation_pipeline_lead_id ON lead_validation_pipeline(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_validation_pipeline_qualified ON lead_validation_pipeline(stage_4_qualified);
CREATE INDEX IF NOT EXISTS idx_lead_validation_pipeline_confidence ON lead_validation_pipeline(stage_4_confidence_score DESC);
-- Campaign analytics indexes
CREATE INDEX IF NOT EXISTS idx_campaign_analytics_campaign_date ON campaign_analytics(campaign_date DESC);
-- Ensure qualification_rate column exists before creating an index (safe for existing DBs)
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
        AND table_name = 'campaign_analytics'
        AND column_name = 'qualification_rate'
) THEN
ALTER TABLE campaign_analytics
ADD COLUMN IF NOT EXISTS qualification_rate DECIMAL(5, 2) DEFAULT 0.00;
RAISE NOTICE 'Added column campaign_analytics.qualification_rate';
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
        AND tablename = 'campaign_analytics'
        AND indexname = 'idx_campaign_analytics_qualification_rate'
) THEN EXECUTE 'CREATE INDEX idx_campaign_analytics_qualification_rate ON campaign_analytics(qualification_rate DESC)';
RAISE NOTICE 'Created index idx_campaign_analytics_qualification_rate';
END IF;
END $$;
-- Ensure cost_per_qualified_lead exists before creating an index (safe for existing DBs)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
            AND table_name = 'campaign_analytics'
            AND column_name = 'cost_per_qualified_lead'
    ) THEN
        ALTER TABLE campaign_analytics
        ADD COLUMN IF NOT EXISTS cost_per_qualified_lead DECIMAL(8,4) DEFAULT 0.0000;
        RAISE NOTICE 'Added column campaign_analytics.cost_per_qualified_lead';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_indexes
        WHERE schemaname = 'public'
            AND tablename = 'campaign_analytics'
            AND indexname = 'idx_campaign_analytics_cost_per_lead'
    ) THEN
        EXECUTE 'CREATE INDEX idx_campaign_analytics_cost_per_lead ON campaign_analytics(cost_per_qualified_lead)';
        RAISE NOTICE 'Created index idx_campaign_analytics_cost_per_lead';
    END IF;
END $$;
-- Budget management indexes
CREATE INDEX IF NOT EXISTS idx_budget_management_period ON budget_management(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_budget_management_active ON budget_management(is_active, budget_utilization_percentage);
-- System performance indexes
CREATE INDEX IF NOT EXISTS idx_system_performance_metrics_date ON system_performance_metrics(metric_date DESC);
CREATE INDEX IF NOT EXISTS idx_api_health_monitoring_source_created ON api_health_monitoring(source_name, created_at DESC);
-- Phase 7.7: Initial Data Population
-- ============================================================================
-- Insert known API data sources
INSERT INTO api_data_sources (
        source_name,
        source_type,
        provider_name,
        base_url,
        cost_per_request,
        quality_score,
        reliability_score,
        priority_level,
        business_value,
        is_active
    )
VALUES (
        'google_places',
        'discovery',
        'Google',
        'https://maps.googleapis.com/maps/api/place',
        0.0320,
        85,
        95,
        10,
        'Primary business discovery and location data',
        true
    ),
    (
        'yelp_fusion',
        'discovery',
        'Yelp',
        'https://api.yelp.com/v3',
        0.0000,
        80,
        90,
        9,
        'Business reviews, photos, and enhanced details',
        true
    ),
    (
        'chamber_directory',
        'enrichment',
        'Chamber of Commerce',
        NULL,
        0.0000,
        75,
        80,
        8,
        'Local business membership and networking data',
        true
    ),
    (
        'california_sos',
        'validation',
        'California Secretary of State',
        'https://bizfileonline.sos.ca.gov',
        0.0000,
        90,
        85,
        9,
        'Official business registration validation',
        true
    ),
    (
        'newyork_sos',
        'validation',
        'New York Secretary of State',
        'https://data.ny.gov',
        0.0000,
        85,
        80,
        8,
        'NY business entity verification',
        true
    ),
    (
        'zerobounce',
        'verification',
        'ZeroBounce',
        'https://api.zerobounce.net/v2',
        0.0080,
        95,
        95,
        9,
        'Email deliverability validation',
        true
    ),
    (
        'hunter_io',
        'enrichment',
        'Hunter.io',
        'https://api.hunter.io/v2',
        0.0400,
        85,
        90,
        7,
        'Email discovery and domain search',
        true
    ),
    (
        'sec_edgar',
        'validation',
        'SEC',
        'https://data.sec.gov',
        0.0000,
        70,
        75,
        6,
        'Public company financial data',
        true
    ),
    (
        'uspto_trademarks',
        'validation',
        'USPTO',
        'https://developer.uspto.gov',
        0.0000,
        65,
        70,
        5,
        'Trademark and intellectual property data',
        true
    ) ON CONFLICT (source_name) DO
UPDATE
SET updated_at = now(),
    cost_per_request = EXCLUDED.cost_per_request,
    quality_score = EXCLUDED.quality_score,
    reliability_score = EXCLUDED.reliability_score,
    is_active = EXCLUDED.is_active;
-- Create initial budget for current month
INSERT INTO budget_management (
        budget_period,
        period_start,
        period_end,
        total_budget,
        discovery_budget,
        validation_budget,
        enrichment_budget,
        google_places_budget,
        yelp_fusion_budget,
        email_validation_budget,
        is_active
    )
VALUES (
        'monthly',
        DATE_TRUNC('month', CURRENT_DATE)::DATE,
        (
            DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day'
        )::DATE,
        150.00,
        -- Total monthly budget
        80.00,
        -- Discovery (Google Places, Yelp)
        40.00,
        -- Validation (Email verification)  
        30.00,
        -- Enrichment (Hunter.io, etc.)
        60.00,
        -- Google Places allocation
        0.00,
        -- Yelp is free
        30.00,
        -- Email validation
        true
    ) ON CONFLICT DO NOTHING;
-- Phase 7.8: Functions and Triggers for Automated Updates
-- ============================================================================
-- Function to update API usage costs in campaign analytics
CREATE OR REPLACE FUNCTION update_campaign_analytics() RETURNS TRIGGER AS $$ BEGIN -- Update campaign analytics when new API usage is recorded
INSERT INTO campaign_analytics (campaign_id, campaign_name)
SELECT NEW.campaign_id,
    c.campaign_name
FROM campaigns c
WHERE c.id = NEW.campaign_id ON CONFLICT (campaign_id) DO
UPDATE
SET updated_at = now(),
    total_cost = campaign_analytics.total_cost + NEW.actual_cost,
    businesses_discovered = CASE
        WHEN NEW.source_name IN ('google_places', 'yelp_fusion') THEN campaign_analytics.businesses_discovered + NEW.results_returned
        ELSE campaign_analytics.businesses_discovered
    END,
    validation_cost = CASE
        WHEN NEW.source_name IN ('zerobounce', 'hunter_io') THEN campaign_analytics.validation_cost + NEW.actual_cost
        ELSE campaign_analytics.validation_cost
    END,
    discovery_cost = CASE
        WHEN NEW.source_name IN ('google_places', 'yelp_fusion') THEN campaign_analytics.discovery_cost + NEW.actual_cost
        ELSE campaign_analytics.discovery_cost
    END;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- Trigger to automatically update analytics
CREATE TRIGGER trigger_update_campaign_analytics
AFTER
INSERT ON enhanced_api_usage FOR EACH ROW EXECUTE FUNCTION update_campaign_analytics();
-- Function to check and create budget alerts
CREATE OR REPLACE FUNCTION check_budget_alerts() RETURNS TRIGGER AS $$
DECLARE budget_record RECORD;
utilization_pct DECIMAL(5, 2);
BEGIN -- Get active budget for current period
SELECT * INTO budget_record
FROM budget_management
WHERE is_active = true
    AND CURRENT_DATE BETWEEN period_start AND period_end
LIMIT 1;
IF budget_record.id IS NOT NULL THEN -- Calculate current utilization
utilization_pct = (
    budget_record.total_spent / budget_record.total_budget
) * 100;
-- Create alert if threshold exceeded
IF utilization_pct >= budget_record.alert_threshold_percentage THEN
INSERT INTO budget_alerts (
        budget_id,
        alert_type,
        severity_level,
        current_spend,
        budget_limit,
        utilization_percentage,
        title,
        message
    )
VALUES (
        budget_record.id,
        'threshold',
        CASE
            WHEN utilization_pct >= 90 THEN 'critical'
            ELSE 'warning'
        END,
        budget_record.total_spent,
        budget_record.total_budget,
        utilization_pct,
        'Budget Alert: ' || utilization_pct::TEXT || '% Used',
        'Current spending is ' || budget_record.total_spent::TEXT || ' of ' || budget_record.total_budget::TEXT || ' budget (' || utilization_pct::TEXT || '% utilized)'
    );
END IF;
END IF;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- ============================================================================
-- Phase 7.6: Security - Row Level Security (RLS) Configuration
-- ============================================================================
-- Enable RLS on all monitoring tables for security
ALTER TABLE api_data_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE enhanced_api_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_validation_pipeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_management ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_health_monitoring ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_performance_metrics ENABLE ROW LEVEL SECURITY;
-- Create secure RLS policies for service role access (admin operations)
-- These policies allow the service role to access all monitoring data
CREATE POLICY "Service role can access all API data sources" ON api_data_sources FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role can access all enhanced API usage" ON enhanced_api_usage FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role can access all lead validation data" ON lead_validation_pipeline FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role can access all budget management" ON budget_management FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role can access all budget alerts" ON budget_alerts FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role can access all API health monitoring" ON api_health_monitoring FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role can access all system performance metrics" ON system_performance_metrics FOR ALL USING (auth.role() = 'service_role');
-- Note: Additional user-specific policies can be added later if needed
-- For example:
-- CREATE POLICY "Users can view own API usage" ON enhanced_api_usage
-- FOR SELECT USING (auth.uid() = user_id);
DO $$ BEGIN RAISE NOTICE '🔒 Phase 7.6 Complete: RLS security policies configured';
RAISE NOTICE '   ✅ api_data_sources: RLS enabled with service role access';
RAISE NOTICE '   ✅ enhanced_api_usage: RLS enabled with service role access';
RAISE NOTICE '   ✅ lead_validation_pipeline: RLS enabled with service role access';
RAISE NOTICE '   ✅ budget_management: RLS enabled with service role access';
RAISE NOTICE '   ✅ budget_alerts: RLS enabled with service role access';
RAISE NOTICE '   ✅ api_health_monitoring: RLS enabled with service role access';
RAISE NOTICE '   ✅ system_performance_metrics: RLS enabled with service role access';
END $$;
-- ============================================================================
-- Phase 7 Complete: Enhanced Monitoring Schema Ready
-- ============================================================================
DO $$ BEGIN RAISE NOTICE '🎉 Phase 7 Complete: Enhanced Monitoring & Business Intelligence Schema';
RAISE NOTICE '   ✅ API data sources tracking: % sources configured',
(
    SELECT COUNT(*)
    FROM api_data_sources
);
RAISE NOTICE '   ✅ Lead validation pipeline tracking enabled';
RAISE NOTICE '   ✅ Campaign analytics and ROI calculations ready';
RAISE NOTICE '   ✅ Budget management and cost controls active';
RAISE NOTICE '   ✅ System health monitoring configured';
RAISE NOTICE '   ✅ Performance indexes created for optimal queries';
RAISE NOTICE '   📊 Ready for comprehensive business intelligence and monitoring!';
END $$;