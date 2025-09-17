-- ProspectPro Essential Database Setup
-- Copy and paste this ENTIRE script into Supabase SQL Editor and click RUN

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Create campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'running' CHECK (status IN ('running', 'paused', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  leads_discovered INTEGER DEFAULT 0,
  leads_qualified INTEGER DEFAULT 0,
  quality_threshold INTEGER DEFAULT 80,
  budget_limit DECIMAL(10,2) DEFAULT 100.00,
  total_cost DECIMAL(10,4) DEFAULT 0.0000,
  search_criteria JSONB DEFAULT '{}',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create enhanced_leads table
CREATE TABLE IF NOT EXISTS enhanced_leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  business_name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  website TEXT,
  confidence_score INTEGER DEFAULT 0 CHECK (confidence_score >= 0 AND confidence_score <= 100),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
  discovery_cost DECIMAL(10,4) DEFAULT 0.00,
  enrichment_cost DECIMAL(10,4) DEFAULT 0.00,
  total_cost DECIMAL(10,4) GENERATED ALWAYS AS (discovery_cost + enrichment_cost) STORED,
  business_type TEXT[],
  owner_name TEXT,
  employee_count INTEGER,
  discovery_source TEXT,
  enrichment_sources JSONB DEFAULT '{}',
  validation_sources JSONB DEFAULT '{}',
  data_completeness_score INTEGER DEFAULT 0,
  email_verified BOOLEAN DEFAULT false,
  website_status INTEGER,
  export_status TEXT DEFAULT 'pending' CHECK (export_status IN ('pending', 'exported', 'excluded')),
  exported_at TIMESTAMP WITH TIME ZONE,
  search_query TEXT,
  location_coordinates POINT,
  search_radius_km INTEGER
);

-- Create lead_emails table
CREATE TABLE IF NOT EXISTS lead_emails (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES enhanced_leads(id) ON DELETE CASCADE,
  email_address TEXT NOT NULL,
  email_type TEXT DEFAULT 'business' CHECK (email_type IN ('business', 'personal', 'info', 'contact', 'sales')),
  verification_status TEXT DEFAULT 'unknown' CHECK (verification_status IN ('deliverable', 'undeliverable', 'risky', 'unknown', 'pending')),
  verification_confidence DECIMAL(5,2) DEFAULT 0.00,
  source TEXT,
  discovered_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  verified_at TIMESTAMP WITH TIME ZONE,
  verification_details JSONB DEFAULT '{}',
  is_primary BOOLEAN DEFAULT false,
  UNIQUE(lead_id, email_address)
);

-- Create lead_social_profiles table
CREATE TABLE IF NOT EXISTS lead_social_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES enhanced_leads(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('linkedin', 'twitter', 'facebook', 'instagram', 'youtube', 'tiktok', 'other')),
  profile_url TEXT NOT NULL,
  profile_handle TEXT,
  follower_count INTEGER,
  verification_status TEXT DEFAULT 'unverified' CHECK (verification_status IN ('verified', 'unverified', 'suspended', 'not_found')),
  discovered_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT now(),
  profile_data JSONB DEFAULT '{}',
  UNIQUE(lead_id, platform, profile_url)
);

-- Create api_usage_log table
CREATE TABLE IF NOT EXISTS api_usage_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
  provider TEXT NOT NULL,
  endpoint TEXT,
  request_method TEXT DEFAULT 'GET',
  request_cost DECIMAL(10,4) DEFAULT 0.0000,
  response_status INTEGER,
  execution_time_ms INTEGER,
  request_size_bytes INTEGER,
  response_size_bytes INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  request_metadata JSONB DEFAULT '{}',
  response_metadata JSONB DEFAULT '{}'
);

-- Create system_settings table
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  setting_name TEXT NOT NULL,
  setting_value JSONB DEFAULT '{}',
  setting_type TEXT DEFAULT 'user' CHECK (setting_type IN ('user', 'system', 'campaign')),
  is_active BOOLEAN DEFAULT true,
  is_encrypted BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, setting_name)
);

-- Create service_health_metrics table
CREATE TABLE IF NOT EXISTS service_health_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  service_name TEXT NOT NULL,
  metric_name TEXT NOT NULL,
  metric_value DECIMAL(15,6),
  metric_unit TEXT DEFAULT 'count',
  status TEXT DEFAULT 'healthy' CHECK (status IN ('healthy', 'warning', 'critical', 'unknown')),
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  additional_data JSONB DEFAULT '{}',
  alert_threshold DECIMAL(15,6),
  INDEX(service_name, metric_name, recorded_at)
);

-- Create campaign_analytics table
CREATE TABLE IF NOT EXISTS campaign_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
  leads_discovered_count INTEGER DEFAULT 0,
  leads_qualified_count INTEGER DEFAULT 0,
  total_api_cost DECIMAL(10,4) DEFAULT 0.0000,
  avg_confidence_score DECIMAL(5,2),
  processing_time_seconds INTEGER,
  success_rate DECIMAL(5,2),
  error_count INTEGER DEFAULT 0,
  analytics_data JSONB DEFAULT '{}',
  INDEX(campaign_id, timestamp)
);

-- Create api_cost_tracking table
CREATE TABLE IF NOT EXISTS api_cost_tracking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
  provider TEXT NOT NULL,
  operation TEXT NOT NULL,
  date DATE DEFAULT CURRENT_DATE,
  request_count INTEGER DEFAULT 0,
  total_cost DECIMAL(10,4) DEFAULT 0.0000,
  avg_response_time_ms DECIMAL(8,2),
  success_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  cost_per_request DECIMAL(10,6),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(campaign_id, provider, operation, date)
);

-- Create lead_qualification_metrics table
CREATE TABLE IF NOT EXISTS lead_qualification_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  date DATE DEFAULT CURRENT_DATE,
  total_leads_discovered INTEGER DEFAULT 0,
  leads_qualified INTEGER DEFAULT 0,
  qualification_rate DECIMAL(5,4),
  avg_confidence_score DECIMAL(5,2),
  total_api_cost DECIMAL(10,4) DEFAULT 0.0000,
  cost_per_qualified_lead DECIMAL(10,4),
  top_discovery_sources JSONB DEFAULT '{}',
  quality_distribution JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(campaign_id, date)
);

-- Create dashboard_exports table
CREATE TABLE IF NOT EXISTS dashboard_exports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  export_type TEXT NOT NULL CHECK (export_type IN ('csv', 'json', 'xlsx', 'pdf')),
  export_format TEXT DEFAULT 'leads',
  campaign_ids UUID[],
  filter_criteria JSONB DEFAULT '{}',
  total_records INTEGER DEFAULT 0,
  file_size_bytes INTEGER,
  download_url TEXT,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + INTERVAL '24 hours'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  downloaded_at TIMESTAMP WITH TIME ZONE,
  download_count INTEGER DEFAULT 0,
  export_status TEXT DEFAULT 'pending' CHECK (export_status IN ('pending', 'processing', 'completed', 'failed', 'expired')),
  export_metadata JSONB DEFAULT '{}'
);

-- Enable Row Level Security on all tables
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE enhanced_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_social_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_health_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_cost_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_qualification_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_exports ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies
CREATE POLICY "campaigns_user_access" ON campaigns FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "enhanced_leads_campaign_access" ON enhanced_leads FOR ALL TO authenticated USING (campaign_id IN (SELECT id FROM campaigns WHERE user_id = auth.uid())) WITH CHECK (campaign_id IN (SELECT id FROM campaigns WHERE user_id = auth.uid()));
CREATE POLICY "system_settings_user_access" ON system_settings FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "dashboard_exports_user_access" ON dashboard_exports FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_campaigns_user_id ON campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_enhanced_leads_campaign_id ON enhanced_leads(campaign_id);
CREATE INDEX IF NOT EXISTS idx_lead_emails_lead_id ON lead_emails(lead_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_log_campaign_id ON api_usage_log(campaign_id);

-- Insert notification of completion
DO $$
BEGIN
  RAISE NOTICE '✅ ProspectPro Database Setup Complete!';
  RAISE NOTICE '📊 Created 11 tables with Row Level Security';
  RAISE NOTICE '🎯 Ready for application connection';
END $$;