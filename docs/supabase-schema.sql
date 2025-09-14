-- ProspectPro Database Schema for Supabase
-- Run this SQL in your Supabase SQL Editor (https://app.supabase.com)

-- Enable necessary extensions
CREATE EXTENSION
IF NOT EXISTS "uuid-ossp";

-- =============================================
-- 1. CAMPAIGNS TABLE
-- =============================================
CREATE TABLE
IF NOT EXISTS campaigns
(
  id UUID DEFAULT gen_random_uuid
() PRIMARY KEY,
  user_id UUID REFERENCES auth.users
(id) ON
DELETE CASCADE,
  name TEXT
NOT NULL,
  business_type TEXT NOT NULL,
  location TEXT NOT NULL,
  target_count INTEGER DEFAULT 100,
  status TEXT DEFAULT 'active' CHECK
(status IN
('active', 'paused', 'completed', 'failed')),
  budget_limit DECIMAL
(10,2) DEFAULT 50.00,
  current_cost DECIMAL
(10,4) DEFAULT 0.00,
  progress_percentage INTEGER DEFAULT 0,
  
  -- Campaign settings
  settings JSONB DEFAULT '{
    "enable_website_scraping": true,
    "enable_email_discovery": true,
    "enable_email_verification": true,
    "min_confidence_score": 80,
    "max_cost_per_lead": 1.00
  }',
  
  -- Results summary
  results JSONB DEFAULT '{
    "discovered": 0,
    "enriched": 0,
    "validated": 0,
    "qualified": 0,
    "exported": 0
  }',
  
  created_at TIMESTAMP
WITH TIME ZONE DEFAULT NOW
(),
  updated_at TIMESTAMP
WITH TIME ZONE DEFAULT NOW
(),
  completed_at TIMESTAMP
WITH TIME ZONE
);

-- =============================================
-- 2. BUSINESSES TABLE (Discovered Leads)
-- =============================================
CREATE TABLE
IF NOT EXISTS businesses
(
  id UUID DEFAULT gen_random_uuid
() PRIMARY KEY,
  campaign_id UUID REFERENCES campaigns
(id) ON
DELETE CASCADE,
  user_id UUID
REFERENCES auth.users
(id) ON
DELETE CASCADE,
  
  -- Core Business Information
  business_name TEXT
NOT NULL,
  address TEXT,
  phone TEXT,
  website TEXT,
  email TEXT,
  
  -- Location Data
  latitude DECIMAL
(10, 7),
  longitude DECIMAL
(10, 7),
  place_id TEXT, -- Google Places ID
  formatted_address TEXT,
  
  -- Enrichment Data (from website scraping)
  enrichment_data JSONB DEFAULT '{}',
  -- Structure: {
  --   "contact_names": ["John Smith", "Jane Doe"],
  --   "social_links": {"facebook": "url", "linkedin": "url"},
  --   "business_description": "text",
  --   "business_hours": {...},
  --   "additional_emails": [...],
  --   "additional_phones": [...]
  -- }
  
  -- Data Sources Tracking
  discovery_source TEXT DEFAULT 'google_places', -- 'google_places', 'yellow_pages', 'manual'
  enrichment_sources JSONB DEFAULT '[]', -- Array: ["website_scraping", "hunter_io", "manual"]
  
  -- Validation Results
  validation_status JSONB DEFAULT '{}',
  -- Structure: {
  --   "business_name": {"is_valid": true, "confidence": 95, "reason": ""},
  --   "address": {"is_valid": true, "confidence": 90, "reason": ""},
  --   "phone": {"is_valid": true, "confidence": 100, "reason": ""},
  --   "website": {"is_valid": true, "confidence": 95, "accessible": true, "status_code": 200},
  --   "email": {"is_valid": true, "confidence": 85, "deliverable": true, "verification_service": "neverbounce"}
  -- }
  
  confidence_score INTEGER DEFAULT 0 CHECK
(confidence_score >= 0 AND confidence_score <= 100),
  is_qualified BOOLEAN DEFAULT FALSE,
  qualification_reason TEXT,
  
  -- API Cost Tracking (precise to 4 decimal places)
  discovery_cost DECIMAL
(10,4) DEFAULT 0.0000,
  enrichment_cost DECIMAL
(10,4) DEFAULT 0.0000,
  validation_cost DECIMAL
(10,4) DEFAULT 0.0000,
  total_cost DECIMAL
(10,4) GENERATED ALWAYS AS
(discovery_cost + enrichment_cost + validation_cost) STORED,
  
  -- Processing Status
  processing_stage TEXT DEFAULT 'discovered' CHECK
(processing_stage IN
(
    'discovered', 'enriching', 'enriched', 'validating', 'validated', 'qualified', 'failed'
  )),
  processing_error TEXT,
  
  -- Timestamps
  created_at TIMESTAMP
WITH TIME ZONE DEFAULT NOW
(),
  updated_at TIMESTAMP
WITH TIME ZONE DEFAULT NOW
(),
  exported_at TIMESTAMP
WITH TIME ZONE
);

-- =============================================
-- 3. API USAGE TRACKING TABLE
-- =============================================
CREATE TABLE
IF NOT EXISTS api_usage
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
  business_id UUID
REFERENCES businesses
(id) ON
DELETE CASCADE,
  
  -- API Call Details
  service TEXT
NOT NULL, -- 'google_places', 'hunter_io', 'neverbounce', 'scrapingdog'
  endpoint TEXT NOT NULL, -- 'text_search', 'place_details', 'domain_search', 'verify_email', 'scrape'
  method TEXT DEFAULT 'GET',
  
  -- Cost and Performance
  cost DECIMAL
(10,4) NOT NULL,
  success BOOLEAN NOT NULL,
  response_time INTEGER, -- milliseconds
  
  -- Request/Response Data (for debugging)
  request_params JSONB,
  response_data JSONB,
  error_message TEXT,
  http_status_code INTEGER,
  
  -- Rate Limiting Info
  rate_limit_remaining INTEGER,
  rate_limit_reset TIMESTAMP
WITH TIME ZONE,
  
  created_at TIMESTAMP
WITH TIME ZONE DEFAULT NOW
()
);

-- =============================================
-- 4. USER SETTINGS & LIMITS TABLE
-- =============================================
CREATE TABLE
IF NOT EXISTS user_settings
(
  user_id UUID PRIMARY KEY REFERENCES auth.users
(id) ON
DELETE CASCADE,
  
  -- Budget Controls
  daily_budget_limit DECIMAL(10,2)
DEFAULT 20.00,
  monthly_budget_limit DECIMAL
(10,2) DEFAULT 100.00,
  per_lead_cost_limit DECIMAL
(10,2) DEFAULT 2.00,
  
  -- API Keys (encrypted in application layer)
  api_keys JSONB DEFAULT '{}',
  -- Structure: {
  --   "google_places": "encrypted_key",
  --   "hunter_io": "encrypted_key",
  --   "neverbounce": "encrypted_key",
  --   "scrapingdog": "encrypted_key"
  -- }
  
  -- Processing Preferences
  preferences JSONB DEFAULT '{
    "enable_website_scraping": true,
    "enable_email_discovery": true,
    "enable_email_verification": true,
    "enable_yellow_pages_fallback": true,
    "min_confidence_threshold": 80,
    "max_concurrent_requests": 5,
    "request_delay_ms": 1000
  }',
  
  -- Notification Settings
  notification_settings JSONB DEFAULT '{
    "email_campaign_complete": true,
    "email_budget_alerts": true,
    "email_error_notifications": true,
    "budget_alert_threshold": 80
  }',
  
  -- Usage Statistics
  total_campaigns INTEGER DEFAULT 0,
  total_leads_generated INTEGER DEFAULT 0,
  total_cost_spent DECIMAL
(10,2) DEFAULT 0.00,
  
  created_at TIMESTAMP
WITH TIME ZONE DEFAULT NOW
(),
  updated_at TIMESTAMP
WITH TIME ZONE DEFAULT NOW
()
);

-- =============================================
-- 5. EXPORT HISTORY TABLE
-- =============================================
CREATE TABLE
IF NOT EXISTS export_history
(
  id UUID DEFAULT gen_random_uuid
() PRIMARY KEY,
  campaign_id UUID REFERENCES campaigns
(id) ON
DELETE CASCADE,
  user_id UUID
REFERENCES auth.users
(id) ON
DELETE CASCADE,
  
  filename TEXT
NOT NULL,
  format TEXT DEFAULT 'csv' CHECK
(format IN
('csv', 'json', 'xlsx')),
  leads_count INTEGER NOT NULL,
  file_size_bytes INTEGER,
  
  -- Export Filters Applied
  filters JSONB DEFAULT '{}',
  -- Structure: {
  --   "min_confidence_score": 80,
  --   "required_fields": ["phone", "email"],
  --   "business_types": ["restaurant"],
  --   "locations": ["Austin, TX"]
  -- }
  
  -- Export Summary
  export_summary JSONB DEFAULT '{}',
  -- Structure: {
  --   "total_cost": 45.67,
  --   "avg_confidence": 87,
  --   "source_breakdown": {"google_places": 80, "website_scraping": 15},
  --   "qualification_rate": 65
  -- }
  
  download_url TEXT, -- Supabase Storage URL if using file storage
  expires_at TIMESTAMP
WITH TIME ZONE,
  
  created_at TIMESTAMP
WITH TIME ZONE DEFAULT NOW
()
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Campaign indexes
CREATE INDEX
IF NOT EXISTS idx_campaigns_user_id ON campaigns
(user_id);
CREATE INDEX
IF NOT EXISTS idx_campaigns_status ON campaigns
(status);
CREATE INDEX
IF NOT EXISTS idx_campaigns_created_at ON campaigns
(created_at DESC);

-- Business indexes
CREATE INDEX
IF NOT EXISTS idx_businesses_campaign_id ON businesses
(campaign_id);
CREATE INDEX
IF NOT EXISTS idx_businesses_user_id ON businesses
(user_id);
CREATE INDEX
IF NOT EXISTS idx_businesses_qualified ON businesses
(is_qualified);
CREATE INDEX
IF NOT EXISTS idx_businesses_confidence ON businesses
(confidence_score DESC);
CREATE INDEX
IF NOT EXISTS idx_businesses_processing_stage ON businesses
(processing_stage);
CREATE INDEX
IF NOT EXISTS idx_businesses_place_id ON businesses
(place_id);

-- API Usage indexes
CREATE INDEX
IF NOT EXISTS idx_api_usage_user_date ON api_usage
(user_id, created_at DESC);
CREATE INDEX
IF NOT EXISTS idx_api_usage_campaign ON api_usage
(campaign_id);
CREATE INDEX
IF NOT EXISTS idx_api_usage_service ON api_usage
(service, created_at DESC);
CREATE INDEX
IF NOT EXISTS idx_api_usage_cost ON api_usage
(cost DESC);

-- Export history indexes
CREATE INDEX
IF NOT EXISTS idx_export_history_user_id ON export_history
(user_id, created_at DESC);
CREATE INDEX
IF NOT EXISTS idx_export_history_campaign ON export_history
(campaign_id);

-- =============================================
-- ROW LEVEL SECURITY (RLS) SETUP
-- =============================================

-- Enable RLS on all tables
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE export_history ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS POLICIES
-- =============================================

-- Campaigns: Users can only access their own campaigns
CREATE POLICY "Users can manage their own campaigns" ON campaigns
  FOR ALL USING
(auth.uid
() = user_id);

-- Businesses: Users can only access businesses from their campaigns
CREATE POLICY "Users can manage their own businesses" ON businesses
  FOR ALL USING
(auth.uid
() = user_id);

-- API Usage: Users can only see their own API usage
CREATE POLICY "Users can view their own API usage" ON api_usage
  FOR ALL USING
(auth.uid
() = user_id);

-- User Settings: Users can only manage their own settings
CREATE POLICY "Users can manage their own settings" ON user_settings
  FOR ALL USING
(auth.uid
() = user_id);

-- Export History: Users can only see their own exports
CREATE POLICY "Users can view their own export history" ON export_history
  FOR ALL USING
(auth.uid
() = user_id);

-- =============================================
-- FUNCTIONS AND TRIGGERS
-- =============================================

-- Function to update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at
()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW
();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at columns
CREATE TRIGGER update_campaigns_updated_at
  BEFORE
UPDATE ON campaigns
  FOR EACH ROW
EXECUTE FUNCTION update_updated_at
();

CREATE TRIGGER update_businesses_updated_at
  BEFORE
UPDATE ON businesses
  FOR EACH ROW
EXECUTE FUNCTION update_updated_at
();

CREATE TRIGGER update_user_settings_updated_at
  BEFORE
UPDATE ON user_settings
  FOR EACH ROW
EXECUTE FUNCTION update_updated_at
();

-- Function to update campaign progress
CREATE OR REPLACE FUNCTION update_campaign_progress
()
RETURNS TRIGGER AS $$
BEGIN
    -- Update campaign results when businesses are modified
    UPDATE campaigns 
  SET 
    results = jsonb_set(
      jsonb_set(
        jsonb_set(
          results,
          '{discovered}',
          (SELECT COUNT(*)
    ::text::jsonb FROM businesses WHERE campaign_id = NEW.campaign_id)
        ),
        '{qualified}',
    (SELECT COUNT(*)
    ::text::jsonb FROM businesses WHERE campaign_id = NEW.campaign_id AND is_qualified = true)
      ),
      '{validated}',
    (SELECT COUNT(*)
    ::text::jsonb FROM businesses WHERE campaign_id = NEW.campaign_id AND processing_stage = 'validated')
    ),
    current_cost =
    (
      SELECT COALESCE(SUM(total_cost), 0.0000)
    FROM businesses
    WHERE campaign_id = NEW.campaign_id
    )
    ,
    progress_percentage = CASE 
      WHEN target_count > 0 THEN 
        LEAST
    (100,
    (
          (SELECT COUNT(*)
    FROM businesses
    WHERE campaign_id = NEW.campaign_id)
    * 100 / target_count
        ))
      ELSE 0
END
,
    updated_at = NOW
()
  WHERE id = NEW.campaign_id;

RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update campaign progress
CREATE TRIGGER update_campaign_progress_trigger
  AFTER
INSERT OR
UPDATE ON businesses
  FOR EACH ROW
EXECUTE FUNCTION update_campaign_progress
();

-- Function to initialize user settings for new users
CREATE OR REPLACE FUNCTION initialize_user_settings
()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_settings
        (user_id)
    VALUES
        (NEW.id)
    ON CONFLICT
    (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create user settings when user signs up
CREATE TRIGGER initialize_user_settings_trigger
  AFTER
INSERT ON
auth.users
FOR EACH ROW
EXECUTE FUNCTION initialize_user_settings
();

-- =============================================
-- SAMPLE DATA (Optional - for testing)
-- =============================================

-- You can uncomment this section to insert sample data for testing
/*
-- Sample user settings (replace with your actual user ID after signup)
INSERT INTO user_settings (user_id, daily_budget_limit, monthly_budget_limit) VALUES 
('your-user-id-here', 25.00, 150.00)
ON CONFLICT (user_id) DO NOTHING;

-- Sample campaign
INSERT INTO campaigns (user_id, name, business_type, location, target_count) VALUES 
('your-user-id-here', 'Austin Restaurants Test', 'restaurants', 'Austin, TX', 50)
ON CONFLICT DO NOTHING;
*/

-- =============================================
-- VERIFICATION QUERIES
-- =============================================

-- Run these queries after creating the schema to verify everything is set up correctly:

-- 1. Check if all tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
    AND table_name IN ('campaigns', 'businesses', 'api_usage', 'user_settings', 'export_history')
ORDER BY table_name;

-- 2. Check RLS is enabled
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
    AND tablename IN ('campaigns', 'businesses', 'api_usage', 'user_settings', 'export_history');

-- 3. Check policies exist
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- =============================================
-- COMPLETION MESSAGE
-- =============================================
DO $$
BEGIN
  RAISE NOTICE '🎉 ProspectPro database schema created successfully!';
  RAISE NOTICE '📋 Next steps:';
  RAISE NOTICE '1. Update your .env file with Supabase credentials';
  RAISE NOTICE '2. Run your Node.js application';
  RAISE NOTICE '3. Test the API endpoints';
  RAISE NOTICE '✅ Database is ready for real business data!';
END
$$;