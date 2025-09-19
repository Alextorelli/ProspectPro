-- Essential Monitoring Tables - Minimal Setup
-- Run this in Supabase SQL Editor to fix column errors

-- 1. API Data Sources Table
CREATE TABLE IF NOT EXISTS api_data_sources (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    source_name TEXT NOT NULL UNIQUE,
    source_type TEXT NOT NULL,
    provider_name TEXT NOT NULL,
    cost_per_request DECIMAL(10, 4) DEFAULT 0.0000,
    quality_score INTEGER DEFAULT 50,
    reliability_score INTEGER DEFAULT 50,
    priority_level INTEGER DEFAULT 5,
    business_value TEXT,
    is_active BOOLEAN DEFAULT true
);

-- 2. Enhanced API Usage Tracking
CREATE TABLE IF NOT EXISTS enhanced_api_usage (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    campaign_id UUID REFERENCES campaigns(id),
    source_name TEXT NOT NULL,
    response_code INTEGER,
    response_time_ms INTEGER,
    results_returned INTEGER DEFAULT 0,
    success BOOLEAN DEFAULT false,
    estimated_cost DECIMAL(10, 4) DEFAULT 0.0000,
    actual_cost DECIMAL(10, 4)
);

-- 3. Campaign Analytics (fixes the campaign_date error)
CREATE TABLE IF NOT EXISTS campaign_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    campaign_id UUID REFERENCES campaigns(id) UNIQUE,
    campaign_name TEXT,
    campaign_date DATE DEFAULT CURRENT_DATE,
    businesses_discovered INTEGER DEFAULT 0,
    qualified_leads INTEGER DEFAULT 0,
    total_cost DECIMAL(10, 4) DEFAULT 0.0000,
    cost_per_lead DECIMAL(8, 4) DEFAULT 0.0000
);

-- 4. Budget Management
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

-- 5. Lead Validation Pipeline
CREATE TABLE IF NOT EXISTS lead_validation_pipeline (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    lead_id UUID REFERENCES enhanced_leads(id),
    campaign_id UUID REFERENCES campaigns(id),
    business_name TEXT NOT NULL,
    stage_4_confidence_score INTEGER DEFAULT 0,
    stage_4_qualified BOOLEAN DEFAULT false,
    total_cost DECIMAL(10, 4) DEFAULT 0.0000
);

-- Insert essential API sources
INSERT INTO api_data_sources (source_name, source_type, provider_name, cost_per_request, quality_score, is_active)
VALUES 
    ('google_places', 'discovery', 'Google', 0.0320, 85, true),
    ('hunter_io', 'enrichment', 'Hunter.io', 0.0400, 85, true),
    ('neverbounce', 'verification', 'NeverBounce', 0.0080, 95, true),
    ('zerobounce', 'verification', 'ZeroBounce', 0.0080, 95, true)
ON CONFLICT (source_name) DO NOTHING;

-- Create initial budget
INSERT INTO budget_management (
    budget_period, period_start, period_end, total_budget, is_active
) VALUES (
    'monthly', 
    DATE_TRUNC('month', CURRENT_DATE)::DATE,
    (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day')::DATE,
    150.00,
    true
) ON CONFLICT DO NOTHING;