-- SIMPLE FIX: Add missing campaign_date column to existing table
-- Run this in Supabase SQL Editor
-- Add missing columns to existing campaign_analytics table
ALTER TABLE campaign_analytics
ADD COLUMN IF NOT EXISTS campaign_date DATE NOT NULL DEFAULT CURRENT_DATE;
ALTER TABLE campaign_analytics
ADD COLUMN IF NOT EXISTS validation_success_rate NUMERIC(5, 2);
ALTER TABLE campaign_analytics
ADD COLUMN IF NOT EXISTS api_calls_count INTEGER DEFAULT 0;
ALTER TABLE campaign_analytics
ADD COLUMN IF NOT EXISTS processing_time_seconds INTEGER;
ALTER TABLE campaign_analytics
ADD COLUMN IF NOT EXISTS quality_score NUMERIC(5, 2);
-- Create missing tables if they don't exist
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
-- Create performance indexes
CREATE INDEX IF NOT EXISTS idx_campaign_analytics_date ON campaign_analytics(campaign_date);
CREATE INDEX IF NOT EXISTS idx_campaign_analytics_user ON campaign_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_service ON api_usage_logs(service_name);
CREATE INDEX IF NOT EXISTS idx_validation_pipeline_stage ON lead_validation_pipeline(validation_stage);
-- Success confirmation
SELECT 'campaign_date column and monitoring tables fixed!' as status;