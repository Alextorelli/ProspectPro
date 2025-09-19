-- IMMEDIATE FIX: Essential Monitoring Tables
-- Run this in Supabase SQL Editor to fix "campaign_date" column error
-- 1. Create campaign_analytics table (fixes campaign_date error)
CREATE TABLE IF NOT EXISTS campaign_analytics (
    id SERIAL PRIMARY KEY,
    campaign_id TEXT NOT NULL,
    campaign_date DATE NOT NULL DEFAULT CURRENT_DATE,
    user_id UUID,
    businesses_found INTEGER DEFAULT 0,
    qualified_leads INTEGER DEFAULT 0,
    validation_success_rate NUMERIC(5, 2),
    total_cost NUMERIC(10, 4) DEFAULT 0,
    api_calls_count INTEGER DEFAULT 0,
    processing_time_seconds INTEGER,
    quality_score NUMERIC(5, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- 2. Create api_usage_logs table (needed for cost tracking)
CREATE TABLE IF NOT EXISTS api_usage_logs (
    id SERIAL PRIMARY KEY,
    service_name TEXT NOT NULL,
    endpoint TEXT,
    request_count INTEGER DEFAULT 1,
    cost_per_request NUMERIC(10, 6),
    total_cost NUMERIC(10, 4),
    response_status TEXT,
    user_id UUID,
    campaign_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- 3. Create lead_validation_pipeline table (needed for quality metrics)
CREATE TABLE IF NOT EXISTS lead_validation_pipeline (
    id SERIAL PRIMARY KEY,
    lead_id TEXT NOT NULL,
    validation_stage TEXT NOT NULL,
    stage_result JSONB,
    confidence_score NUMERIC(5, 2),
    cost_incurred NUMERIC(10, 4) DEFAULT 0,
    processing_time_ms INTEGER,
    error_details TEXT,
    user_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- 4. Enable Row Level Security
ALTER TABLE campaign_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_validation_pipeline ENABLE ROW LEVEL SECURITY;
-- 5. Create RLS Policies (with null handling)
CREATE POLICY "Users can only see own campaign analytics" ON campaign_analytics FOR ALL USING (
    auth.uid() IS NULL
    OR user_id IS NULL
    OR auth.uid() = user_id
);
CREATE POLICY "Users can only see own api usage" ON api_usage_logs FOR ALL USING (
    auth.uid() IS NULL
    OR user_id IS NULL
    OR auth.uid() = user_id
);
CREATE POLICY "Users can only see own validation data" ON lead_validation_pipeline FOR ALL USING (
    auth.uid() IS NULL
    OR user_id IS NULL
    OR auth.uid() = user_id
);
-- 6. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_campaign_analytics_date ON campaign_analytics(campaign_date);
CREATE INDEX IF NOT EXISTS idx_campaign_analytics_user ON campaign_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_service ON api_usage_logs(service_name);
CREATE INDEX IF NOT EXISTS idx_validation_pipeline_stage ON lead_validation_pipeline(validation_stage);
-- Success message
SELECT 'Essential monitoring tables created successfully!' as status;