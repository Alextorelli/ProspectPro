-- ============================================================================
-- ProspectPro Database Foundation - Phase 2: Leads and Enrichment
-- ============================================================================
-- This script creates lead management and enrichment tables with proper
-- foreign key relationships to foundation tables from Phase 1.
--
-- PREREQUISITES: Execute 01-database-foundation.sql FIRST
-- ============================================================================

-- Phase 2.1: Verify Foundation Prerequisites
-- ============================================================================

DO $$
DECLARE
  foundation_tables TEXT[] := ARRAY['campaigns', 'system_settings', 'service_health_metrics'];
  missing_table TEXT;
  table_exists BOOLEAN;
BEGIN
  RAISE NOTICE '🔍 Phase 2.1: Verifying foundation prerequisites...';
  
  FOREACH missing_table IN ARRAY foundation_tables LOOP
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = missing_table
    ) INTO table_exists;
    
    IF NOT table_exists THEN
      RAISE EXCEPTION 'Missing foundation table: %. Execute 01-database-foundation.sql first.', missing_table;
    END IF;
    
    RAISE NOTICE '   ✅ Foundation table % exists', missing_table;
  END LOOP;
  
  RAISE NOTICE '✅ Phase 2.1 Complete: All foundation prerequisites verified';
END $$;

-- Phase 2.2: Lead Management Tables
-- ============================================================================

-- Enhanced leads table (depends on campaigns)
CREATE TABLE IF NOT EXISTS enhanced_leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  
  -- Basic business data
  business_name TEXT NOT NULL CHECK (LENGTH(business_name) > 0),
  address TEXT,
  phone TEXT,
  website TEXT,
  
  -- Enhanced intelligence fields
  confidence_score confidence_score_type DEFAULT 0,
  business_type TEXT[] DEFAULT '{}',
  owner_name TEXT,
  employee_count INTEGER CHECK (employee_count IS NULL OR employee_count > 0),
  
  -- API source attribution
  discovery_source TEXT, -- 'google_places', 'scrapingdog_maps', etc.
  enrichment_sources JSONB DEFAULT '{}',
  validation_sources JSONB DEFAULT '{}',
  
  -- Cost tracking
  discovery_cost cost_amount_type DEFAULT 0.00,
  enrichment_cost cost_amount_type DEFAULT 0.00,
  total_cost cost_amount_type GENERATED ALWAYS AS (discovery_cost + enrichment_cost) STORED,
  
  -- Quality metrics
  data_completeness_score confidence_score_type DEFAULT 0,
  email_verified BOOLEAN DEFAULT false,
  website_status INTEGER CHECK (website_status IS NULL OR (website_status >= 100 AND website_status <= 599)), -- HTTP status codes
  social_verified BOOLEAN DEFAULT false,
  
  -- Export tracking
  export_status TEXT DEFAULT 'pending' CHECK (export_status IN ('pending', 'exported', 'excluded')),
  exported_at TIMESTAMP WITH TIME ZONE,
  
  -- Location and search context
  search_query TEXT,
  -- Use PostGIS geography for accurate earth distance calculations
  location_coordinates geography(Point,4326),
  search_radius_km INTEGER CHECK (search_radius_km IS NULL OR search_radius_km > 0),
  
  -- Rich metadata
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Constraints
  CONSTRAINT enhanced_leads_valid_export CHECK (
    (export_status = 'exported' AND exported_at IS NOT NULL) OR
    (export_status != 'exported' AND exported_at IS NULL)
  )
);

-- Email tracking table (depends on enhanced_leads)
CREATE TABLE IF NOT EXISTS lead_emails (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES enhanced_leads(id) ON DELETE CASCADE,
  email TEXT NOT NULL CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  source TEXT CHECK (source IN ('hunter_io', 'scraped', 'pattern_generated', 'manual')),
  verification_status verification_status_type DEFAULT 'pending',
  verification_score confidence_score_type,
  discovery_cost cost_amount_type DEFAULT 0.00,
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Constraints
  UNIQUE(lead_id, email),
  CONSTRAINT lead_emails_verified_score CHECK (
    (verification_status = 'deliverable' AND verification_score >= 80) OR
    (verification_status != 'deliverable')
  )
);

-- Social media profiles table (depends on enhanced_leads)
CREATE TABLE IF NOT EXISTS lead_social_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES enhanced_leads(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('linkedin', 'facebook', 'twitter', 'instagram', 'tiktok', 'youtube')),
  profile_url TEXT CHECK (profile_url IS NULL OR profile_url ~* '^https?://'),
  username TEXT,
  followers_count INTEGER CHECK (followers_count IS NULL OR followers_count >= 0),
  verification_status verification_status_type DEFAULT 'pending',
  scraped_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  UNIQUE(lead_id, platform)
);

DO $$
BEGIN
  RAISE NOTICE '✅ Phase 2.2 Complete: Lead management tables created';
  RAISE NOTICE '   - enhanced_leads: Primary lead storage with quality scoring';
  RAISE NOTICE '   - lead_emails: Email discovery and verification tracking';
  RAISE NOTICE '   - lead_social_profiles: Social media presence tracking';
END $$;

-- Phase 2.3: API Usage and Cost Tracking
-- ============================================================================

-- API usage log (depends on campaigns)
CREATE TABLE IF NOT EXISTS api_usage_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
  api_service TEXT NOT NULL CHECK (LENGTH(api_service) > 0),
  endpoint TEXT,
  request_cost cost_amount_type DEFAULT 0.00,
  response_status INTEGER CHECK (response_status >= 100 AND response_status <= 599),
  credits_used INTEGER DEFAULT 1 CHECK (credits_used > 0),
  processing_time_ms INTEGER CHECK (processing_time_ms IS NULL OR processing_time_ms >= 0),
  request_data JSONB DEFAULT '{}',
  response_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

DO $$
BEGIN
  RAISE NOTICE '✅ Phase 2.3 Complete: API usage tracking table created';
  RAISE NOTICE '   - api_usage_log: Comprehensive API call tracking with cost attribution';
END $$;

-- Phase 2.4: Performance Indexes for Lead Tables
-- ============================================================================

-- Enhanced leads table indexes
CREATE INDEX IF NOT EXISTS idx_enhanced_leads_campaign_id ON enhanced_leads(campaign_id);
CREATE INDEX IF NOT EXISTS idx_enhanced_leads_confidence ON enhanced_leads(confidence_score DESC);
CREATE INDEX IF NOT EXISTS idx_enhanced_leads_export_status ON enhanced_leads(export_status);
CREATE INDEX IF NOT EXISTS idx_enhanced_leads_created ON enhanced_leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_enhanced_leads_business_name ON enhanced_leads USING GIN(to_tsvector('english', business_name));
CREATE INDEX IF NOT EXISTS idx_enhanced_leads_location ON enhanced_leads USING GIST((location_coordinates)) WHERE location_coordinates IS NOT NULL;

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_enhanced_leads_campaign_confidence ON enhanced_leads(campaign_id, confidence_score DESC);
CREATE INDEX IF NOT EXISTS idx_enhanced_leads_campaign_status ON enhanced_leads(campaign_id, export_status);

-- Lead emails table indexes
CREATE INDEX IF NOT EXISTS idx_lead_emails_lead_id ON lead_emails(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_emails_verification_status ON lead_emails(verification_status);
CREATE INDEX IF NOT EXISTS idx_lead_emails_verification_score ON lead_emails(verification_score DESC) WHERE verification_score IS NOT NULL;

-- Lead social profiles indexes
CREATE INDEX IF NOT EXISTS idx_lead_social_profiles_lead_id ON lead_social_profiles(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_social_profiles_platform ON lead_social_profiles(platform);
CREATE INDEX IF NOT EXISTS idx_lead_social_profiles_verification ON lead_social_profiles(verification_status);

-- API usage log indexes
CREATE INDEX IF NOT EXISTS idx_api_usage_campaign_id ON api_usage_log(campaign_id) WHERE campaign_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_api_usage_service ON api_usage_log(api_service);
CREATE INDEX IF NOT EXISTS idx_api_usage_created ON api_usage_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_usage_cost ON api_usage_log(request_cost DESC) WHERE request_cost > 0;

DO $$
BEGIN
  RAISE NOTICE '✅ Phase 2.4 Complete: Performance indexes created for lead management';
END $$;

-- Phase 2.5: Updated Timestamp Triggers for Lead Tables
-- ============================================================================

-- Apply updated_at triggers to lead tables
CREATE TRIGGER enhanced_leads_update_updated_at
  BEFORE UPDATE ON enhanced_leads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DO $$
BEGIN
  RAISE NOTICE '✅ Phase 2.5 Complete: Timestamp triggers configured for lead tables';
END $$;

-- Phase 2.6: Lead Management Table Validation
-- ============================================================================

DO $$
DECLARE
  table_count INTEGER;
  fk_count INTEGER;
  index_count INTEGER;
BEGIN
  -- Verify all lead tables exist
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables
  WHERE table_schema = 'public' 
    AND table_name IN ('enhanced_leads', 'lead_emails', 'lead_social_profiles', 'api_usage_log');
    
  IF table_count != 4 THEN
    RAISE EXCEPTION 'Lead table creation failed. Expected 4 tables, found %', table_count;
  END IF;
  
  -- Verify foreign key relationships
  SELECT COUNT(*) INTO fk_count
  FROM information_schema.table_constraints
  WHERE table_schema = 'public'
    AND constraint_type = 'FOREIGN KEY'
    AND table_name IN ('enhanced_leads', 'lead_emails', 'lead_social_profiles', 'api_usage_log');
    
  IF fk_count < 4 THEN
    RAISE NOTICE 'Warning: Expected at least 4 foreign keys, found %', fk_count;
  END IF;
  
  -- Verify performance indexes
  SELECT COUNT(*) INTO index_count
  FROM pg_indexes
  WHERE schemaname = 'public'
    AND (indexname LIKE 'idx_enhanced_leads_%'
      OR indexname LIKE 'idx_lead_emails_%'
      OR indexname LIKE 'idx_lead_social_profiles_%'
      OR indexname LIKE 'idx_api_usage_%');
     
  RAISE NOTICE '✅ Phase 2.6 Complete: Lead management validation successful';
  RAISE NOTICE '   - Lead tables created: %', table_count;
  RAISE NOTICE '   - Foreign key constraints: %', fk_count;
  RAISE NOTICE '   - Performance indexes: %', index_count;
END $$;

-- ============================================================================
-- Phase 2 Complete Summary
-- ============================================================================

DO $$
DECLARE
  completion_time TIMESTAMP WITH TIME ZONE := now();
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🎯 PHASE 2 COMPLETE: Leads and Enrichment Infrastructure';
  RAISE NOTICE '=====================================================';
  RAISE NOTICE 'Completion Time: %', completion_time;
  RAISE NOTICE '';
  RAISE NOTICE 'Lead Management Infrastructure:';
  RAISE NOTICE '- ✅ Enhanced leads with quality scoring and cost tracking';
  RAISE NOTICE '- ✅ Email discovery and verification system';
  RAISE NOTICE '- ✅ Social media profile tracking';
  RAISE NOTICE '- ✅ Comprehensive API usage logging';
  RAISE NOTICE '- ✅ Performance-optimized indexes';
  RAISE NOTICE '- ✅ Data integrity constraints';
  RAISE NOTICE '- ✅ Automatic timestamp maintenance';
  RAISE NOTICE '';
  RAISE NOTICE 'Foreign Key Relationships Established:';
  RAISE NOTICE '- enhanced_leads → campaigns';
  RAISE NOTICE '- lead_emails → enhanced_leads';
  RAISE NOTICE '- lead_social_profiles → enhanced_leads';
  RAISE NOTICE '- api_usage_log → campaigns (optional)';
  RAISE NOTICE '';
  RAISE NOTICE 'Next Steps:';
  RAISE NOTICE '1. Execute 03-monitoring-and-analytics.sql';
  RAISE NOTICE '2. Execute 04-functions-and-procedures.sql';
  RAISE NOTICE '3. Execute 05-security-and-rls.sql';
END $$;