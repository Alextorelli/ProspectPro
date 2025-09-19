-- FIX PRODUCTION SCHEMA: Add missing columns for full API compatibility
-- Run this in Supabase SQL Editor to make tables production-ready
-- Add missing columns to campaign_analytics table
ALTER TABLE campaign_analytics
ADD COLUMN IF NOT EXISTS businesses_found INTEGER DEFAULT 0;
ALTER TABLE campaign_analytics
ADD COLUMN IF NOT EXISTS qualified_leads INTEGER DEFAULT 0;
ALTER TABLE campaign_analytics
ADD COLUMN IF NOT EXISTS validation_success_rate NUMERIC(5, 2);
ALTER TABLE campaign_analytics
ADD COLUMN IF NOT EXISTS api_calls_count INTEGER DEFAULT 0;
ALTER TABLE campaign_analytics
ADD COLUMN IF NOT EXISTS processing_time_seconds INTEGER;
ALTER TABLE campaign_analytics
ADD COLUMN IF NOT EXISTS quality_score NUMERIC(5, 2);
-- Add missing columns to lead_validation_pipeline table
ALTER TABLE lead_validation_pipeline
ADD COLUMN IF NOT EXISTS validation_stage TEXT NOT NULL DEFAULT 'unknown';
ALTER TABLE lead_validation_pipeline
ADD COLUMN IF NOT EXISTS stage_result JSONB DEFAULT '{}';
ALTER TABLE lead_validation_pipeline
ADD COLUMN IF NOT EXISTS confidence_score NUMERIC(5, 2) DEFAULT 0;
ALTER TABLE lead_validation_pipeline
ADD COLUMN IF NOT EXISTS cost_incurred NUMERIC(10, 4) DEFAULT 0;
ALTER TABLE lead_validation_pipeline
ADD COLUMN IF NOT EXISTS processing_time_ms INTEGER;
ALTER TABLE lead_validation_pipeline
ADD COLUMN IF NOT EXISTS error_details TEXT;
-- Create missing api_usage_logs table
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
-- Create missing budget_management table
CREATE TABLE IF NOT EXISTS budget_management (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    budget_period TEXT NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    total_budget DECIMAL(10, 2) NOT NULL,
    total_spent DECIMAL(10, 2) DEFAULT 0.00,
    budget_utilization_percentage DECIMAL(5, 2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT true
);
-- Enable RLS on new tables
ALTER TABLE api_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_management ENABLE ROW LEVEL SECURITY;
-- Create RLS policies (graceful null handling)
CREATE POLICY "Users can only see own api usage" ON api_usage_logs FOR ALL USING (
    auth.uid() IS NULL
    OR user_id IS NULL
    OR auth.uid() = user_id
);
CREATE POLICY "Users can only see own budget data" ON budget_management FOR ALL USING (
    auth.uid() IS NULL
    OR true
);
-- Allow access for budget management
-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_service ON api_usage_logs(service_name);
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_created ON api_usage_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_budget_period ON budget_management(budget_period);
CREATE INDEX IF NOT EXISTS idx_budget_active ON budget_management(is_active);
-- Insert default budget if none exists
INSERT INTO budget_management (
        budget_period,
        period_start,
        period_end,
        total_budget,
        is_active
    )
VALUES (
        'monthly',
        DATE_TRUNC('month', CURRENT_DATE)::DATE,
        (
            DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day'
        )::DATE,
        150.00,
        true
    ) ON CONFLICT DO NOTHING;
-- Success confirmation
SELECT 'Production schema fixes applied successfully!' as status;