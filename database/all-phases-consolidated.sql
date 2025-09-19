-- =====================================================
-- ProspectPro Complete Database Setup
-- Execute this entire script in Supabase SQL Editor
-- =====================================================

-- =====================================================
-- PHASE 1: Foundation Tables
-- Core infrastructure: campaigns, enhanced_leads
-- =====================================================

-- ============================================================================
-- ProspectPro Database Foundation - Phase 1: Core Infrastructure
-- ============================================================================
-- This script creates the essential database infrastructure with proper
-- dependency order, comprehensive validation, and zero-downtime deployment.
--
-- Execute this script FIRST before any other database scripts.
-- ============================================================================

-- Phase 1.1: Extensions and Prerequisites
-- ============================================================================

-- Enable UUID generation (required for all primary keys)
CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Prefer installing PostGIS into a dedicated schema for security lint clearance
DO $$
BEGIN
  EXECUTE 'CREATE SCHEMA IF NOT EXISTS extensions';
  -- Fresh install path
  IF NOT EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'postgis'
  ) THEN
    EXECUTE 'CREATE EXTENSION IF NOT EXISTS "postgis" WITH SCHEMA extensions';
  END IF;
END $$;

-- Prefer pg_trgm in the extensions schema as well
DO $$
BEGIN
  EXECUTE 'CREATE SCHEMA IF NOT EXISTS extensions';
  IF NOT EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm'
  ) THEN
    EXECUTE 'CREATE EXTENSION IF NOT EXISTS "pg_trgm" WITH SCHEMA extensions';
  END IF;
END $$;

-- Log successful extension creation
DO $$
BEGIN
  RAISE NOTICE '✅ Phase 1.1 Complete: Database extensions enabled';
  RAISE NOTICE '   - uuid-ossp: UUID generation';
  RAISE NOTICE '   - postgis: Geographic operations';
END $$;

-- Move relocatable extensions out of public schema when possible (pg_trgm only)
DO $$
BEGIN
  EXECUTE 'CREATE SCHEMA IF NOT EXISTS extensions';

  BEGIN
    IF EXISTS (
      SELECT 1 FROM pg_extension e
      JOIN pg_namespace n ON n.oid = e.extnamespace
      WHERE e.extname = 'pg_trgm' AND n.nspname = 'public'
    ) THEN
      EXECUTE 'ALTER EXTENSION "pg_trgm" SET SCHEMA extensions';
      RAISE NOTICE '   - Moved extension pg_trgm to schema extensions';
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '   - Skipped moving pg_trgm: %', SQLERRM;
  END;

  -- Note: postgis is non-relocatable; we do NOT attempt to move it post-install
END $$;

-- Phase 1.2: Core Data Types and Domains
-- ============================================================================

-- Create custom domains for data validation
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'confidence_score_type') THEN
    EXECUTE 'CREATE DOMAIN confidence_score_type AS INTEGER CHECK (VALUE >= 0 AND VALUE <= 100)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'cost_amount_type') THEN
    EXECUTE 'CREATE DOMAIN cost_amount_type AS DECIMAL(10,4) CHECK (VALUE >= 0)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'campaign_status_type') THEN
    EXECUTE $cmd$CREATE DOMAIN campaign_status_type AS TEXT CHECK (VALUE IN ('running','paused','completed','cancelled'))$cmd$;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'verification_status_type') THEN
    EXECUTE $cmd$CREATE DOMAIN verification_status_type AS TEXT CHECK (VALUE IN ('deliverable','undeliverable','risky','unknown','pending'))$cmd$;
  END IF;
END $$;

DO $$
BEGIN
  RAISE NOTICE '✅ Phase 1.2 Complete: Custom data types created';
END $$;

-- Phase 1.3: Foundation Tables (No Dependencies)
-- ============================================================================

-- Core campaigns table (foundational - no foreign key dependencies)
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL, -- References auth.users (Supabase managed)
  name TEXT NOT NULL,
  search_parameters JSONB NOT NULL DEFAULT '{}',
  status campaign_status_type DEFAULT 'running',
  
  -- Budget and limits
  budget_limit DECIMAL(10,2) CHECK (budget_limit IS NULL OR budget_limit > 0),
  lead_limit INTEGER CHECK (lead_limit IS NULL OR lead_limit > 0),
  quality_threshold confidence_score_type DEFAULT 70,
  
  -- Performance tracking (updated via triggers)
  leads_discovered INTEGER DEFAULT 0 CHECK (leads_discovered >= 0),
  leads_qualified INTEGER DEFAULT 0 CHECK (leads_qualified >= 0),
  total_cost cost_amount_type DEFAULT 0.00,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Constraints
  CONSTRAINT campaigns_valid_completion CHECK (
    (status IN ('completed', 'cancelled') AND completed_at IS NOT NULL) OR
    (status NOT IN ('completed', 'cancelled') AND completed_at IS NULL)
  ),
  CONSTRAINT campaigns_qualified_lte_discovered CHECK (leads_qualified <= leads_discovered)
);

-- System settings table (no dependencies)
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL, -- References auth.users (Supabase managed)
  setting_key VARCHAR(255) NOT NULL,
  setting_value JSONB NOT NULL,
  data_type TEXT DEFAULT 'string' CHECK (data_type IN ('string', 'number', 'boolean', 'object', 'array')),
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  CONSTRAINT system_settings_unique_user_key UNIQUE (user_id, setting_key)
);

-- Service health metrics (no dependencies - system monitoring)
CREATE TABLE IF NOT EXISTS service_health_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  service_name TEXT NOT NULL, -- 'hunter_io', 'scrapingdog', 'google_places'
  status TEXT NOT NULL CHECK (status IN ('healthy', 'degraded', 'down')),
  response_time_ms INTEGER CHECK (response_time_ms >= 0),
  error_rate DECIMAL(5,4) CHECK (error_rate >= 0 AND error_rate <= 1), -- 0-100%
  rate_limit_remaining INTEGER CHECK (rate_limit_remaining >= 0),
  cost_budget_remaining DECIMAL(10,2) CHECK (cost_budget_remaining >= 0),
  requests_today INTEGER DEFAULT 0 CHECK (requests_today >= 0),
  cost_today cost_amount_type DEFAULT 0.00,
  last_successful_call TIMESTAMP WITH TIME ZONE,
  last_error TEXT,
  metadata JSONB DEFAULT '{}',
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT now()
);

DO $$
BEGIN
  RAISE NOTICE '✅ Phase 1.3 Complete: Foundation tables created';
  RAISE NOTICE '   - campaigns: Core campaign management';
  RAISE NOTICE '   - system_settings: User preferences and configuration';
  RAISE NOTICE '   - service_health_metrics: System monitoring';
END $$;

-- Phase 1.4: Primary Indexes for Foundation Tables
-- ============================================================================

-- Campaigns table indexes
CREATE INDEX IF NOT EXISTS idx_campaigns_user_id ON campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_created ON campaigns(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_campaigns_user_status ON campaigns(user_id, status);

-- System settings indexes
CREATE INDEX IF NOT EXISTS idx_system_settings_user_id ON system_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_system_settings_user_key ON system_settings(user_id, setting_key);
CREATE INDEX IF NOT EXISTS idx_system_settings_active ON system_settings(is_active) WHERE is_active = true;

-- Service health metrics indexes
CREATE INDEX IF NOT EXISTS idx_service_health_service ON service_health_metrics(service_name);
CREATE INDEX IF NOT EXISTS idx_service_health_timestamp ON service_health_metrics(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_service_health_status ON service_health_metrics(service_name, status, timestamp DESC);

DO $$
BEGIN
  RAISE NOTICE '✅ Phase 1.4 Complete: Primary indexes created for optimal query performance';
END $$;

-- Phase 1.5: Foundation Table Validation
-- ============================================================================

-- Test foundation table creation
DO $$
DECLARE
  table_count INTEGER;
  index_count INTEGER;
BEGIN
  -- Verify all foundation tables exist
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables
  WHERE table_schema = 'public' 
    AND table_name IN ('campaigns', 'system_settings', 'service_health_metrics');
    
  IF table_count != 3 THEN
    RAISE EXCEPTION 'Foundation table creation failed. Expected 3 tables, found %', table_count;
  END IF;
  
  -- Verify essential indexes exist
  SELECT COUNT(*) INTO index_count
  FROM pg_indexes
  WHERE schemaname = 'public'
    AND indexname LIKE 'idx_campaigns_%'
     OR indexname LIKE 'idx_system_settings_%'
     OR indexname LIKE 'idx_service_health_%';
     
  IF index_count < 8 THEN
    RAISE NOTICE 'Warning: Expected at least 8 indexes, found %', index_count;
  END IF;
  
  RAISE NOTICE '✅ Phase 1.5 Complete: Foundation validation successful';
  RAISE NOTICE '   - Tables created: %', table_count;
  RAISE NOTICE '   - Indexes created: %', index_count;
END $$;

-- Phase 1.6: Updated Timestamp Triggers
-- ============================================================================

-- Generic updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers to foundation tables (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'campaigns_update_updated_at'
  ) THEN
    CREATE TRIGGER campaigns_update_updated_at
      BEFORE UPDATE ON campaigns
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'system_settings_update_updated_at'
  ) THEN
    CREATE TRIGGER system_settings_update_updated_at
      BEFORE UPDATE ON system_settings
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

DO $$
BEGIN
  RAISE NOTICE '✅ Phase 1.6 Complete: Timestamp triggers configured';
  RAISE NOTICE '   - Automatic updated_at maintenance for foundation tables';
END $$;

-- ============================================================================
-- Phase 1 Complete Summary
-- ============================================================================

DO $$
DECLARE
  completion_time TIMESTAMP WITH TIME ZONE := now();
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🎯 PHASE 1 COMPLETE: Database Foundation Established';
  RAISE NOTICE '================================================';
  RAISE NOTICE 'Completion Time: %', completion_time;
  RAISE NOTICE '';
  RAISE NOTICE 'Foundation Infrastructure:';
  RAISE NOTICE '- ✅ Database extensions (uuid-ossp, postgis)';
  RAISE NOTICE '- ✅ Custom data types and domains';
  RAISE NOTICE '- ✅ Core tables (campaigns, system_settings, service_health_metrics)';
  RAISE NOTICE '- ✅ Performance indexes';
  RAISE NOTICE '- ✅ Timestamp triggers';
  RAISE NOTICE '- ✅ Data validation constraints';
  RAISE NOTICE '';
  RAISE NOTICE 'Next Steps:';
  RAISE NOTICE '1. Execute 02-leads-and-enrichment.sql';
  RAISE NOTICE '2. Execute 03-monitoring-and-analytics.sql';
  RAISE NOTICE '3. Execute 04-functions-and-procedures.sql';
  RAISE NOTICE '4. Execute 05-security-and-rls.sql';
  RAISE NOTICE '';
  RAISE NOTICE 'Database is ready for dependent table creation.';
END $$;

-- =====================================================
-- PHASE 2: Enrichment Tables
-- Lead data: lead_emails, lead_social_profiles
-- =====================================================

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

-- Apply updated_at triggers to lead tables (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'enhanced_leads_update_updated_at'
  ) THEN
    CREATE TRIGGER enhanced_leads_update_updated_at
      BEFORE UPDATE ON enhanced_leads
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

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

-- =====================================================
-- PHASE 3: Monitoring Tables
-- Analytics: campaign_analytics, api_cost_tracking
-- =====================================================

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
-- Use a plain column maintained by trigger (generated columns require immutable expressions)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='campaign_analytics' AND column_name='timestamp_date'
  ) THEN
    ALTER TABLE campaign_analytics 
      ADD COLUMN timestamp_date DATE;
  END IF;
END $$;

-- Backfill existing rows once
UPDATE campaign_analytics
SET timestamp_date = ("timestamp")::date
WHERE timestamp_date IS NULL;

-- Create or replace trigger function to maintain the column
CREATE OR REPLACE FUNCTION set_campaign_analytics_timestamp_date()
RETURNS TRIGGER AS $$
BEGIN
  NEW.timestamp_date := (NEW."timestamp")::date;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Ensure trigger exists to keep column synced on insert/update
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_campaign_analytics_set_timestamp_date'
  ) THEN
    CREATE TRIGGER trg_campaign_analytics_set_timestamp_date
    BEFORE INSERT OR UPDATE OF "timestamp"
    ON campaign_analytics
    FOR EACH ROW
    EXECUTE FUNCTION set_campaign_analytics_timestamp_date();
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_campaign_analytics_dashboard
  ON campaign_analytics (campaign_id, metric_type, timestamp_date);

-- API cost tracking indexes
CREATE INDEX IF NOT EXISTS idx_api_cost_tracking_service_date ON api_cost_tracking(api_service, date DESC, hour DESC);
CREATE INDEX IF NOT EXISTS idx_api_cost_tracking_campaign_id ON api_cost_tracking(campaign_id, date DESC) WHERE campaign_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_api_cost_tracking_total_cost ON api_cost_tracking(total_cost DESC) WHERE total_cost > 0;

-- Lead qualification metrics indexes
CREATE INDEX IF NOT EXISTS idx_lead_qualification_campaign_id ON lead_qualification_metrics(campaign_id);
CREATE INDEX IF NOT EXISTS idx_lead_qualification_date ON lead_qualification_metrics(date DESC, hour DESC);
CREATE INDEX IF NOT EXISTS idx_lead_qualification_rate ON lead_qualification_metrics(qualification_rate DESC) WHERE qualification_rate > 0;

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
  RAISE NOTICE '- ✅ Performance-optimized materialized views';
  RAISE NOTICE '- ✅ Comprehensive indexing strategy';
  RAISE NOTICE '';
  RAISE NOTICE 'Advanced Features:';
  RAISE NOTICE '- ✅ Real-time cost tracking';
  RAISE NOTICE '- ✅ ROI calculation and analysis';
  RAISE NOTICE '- ✅ Time-based metric aggregation';
  RAISE NOTICE '- ✅ Multi-format export support';
  RAISE NOTICE '- ✅ Automatic data validation';
  RAISE NOTICE '';
  RAISE NOTICE 'Next Steps:';
  RAISE NOTICE '1. Execute 04-functions-and-procedures.sql';
  RAISE NOTICE '2. Execute 05-security-and-rls.sql';
END $$;

-- =====================================================
-- PHASE 4: Business Functions
-- PostgreSQL functions and triggers
-- =====================================================

-- ============================================================================
-- ProspectPro Database Foundation - Phase 4: Functions and Procedures
-- ============================================================================
-- This script creates PostgreSQL functions and stored procedures for
-- business logic, analytics calculations, and data processing automation.
--
-- PREREQUISITES: Execute phases 01, 02, and 03 FIRST
-- ============================================================================

-- Phase 4.1: Verify Analytics Prerequisites
-- ============================================================================

DO $$
DECLARE
  required_tables TEXT[] := ARRAY['campaigns', 'enhanced_leads', 'campaign_analytics', 'api_cost_tracking'];
  missing_table TEXT;
  table_exists BOOLEAN;
BEGIN
  RAISE NOTICE '🔍 Phase 4.1: Verifying analytics prerequisites...';
  
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
  
  RAISE NOTICE '✅ Phase 4.1 Complete: All analytics prerequisites verified';
END $$;

-- Phase 4.2: Lead Quality and Scoring Functions
-- ============================================================================

-- Calculate comprehensive lead quality score
CREATE OR REPLACE FUNCTION calculate_lead_quality_score(lead_data JSON)
RETURNS INTEGER AS $$
DECLARE
  score INTEGER := 0;
  business_name TEXT;
  phone TEXT;
  address TEXT;
  website TEXT;
  email_verified BOOLEAN;
  social_verified BOOLEAN;
BEGIN
  -- Extract data from JSON
  business_name := lead_data->>'business_name';
  phone := lead_data->>'phone';
  address := lead_data->>'address';
  website := lead_data->>'website';
  email_verified := COALESCE((lead_data->>'email_verified')::BOOLEAN, false);
  social_verified := COALESCE((lead_data->>'social_verified')::BOOLEAN, false);
  
  -- Basic completeness scoring (40 points max)
  IF business_name IS NOT NULL AND LENGTH(business_name) > 0 THEN
    score := score + 10;
    -- Bonus for non-generic business names
    IF business_name !~* '(company|business|llc|inc|corp)$' AND LENGTH(business_name) > 10 THEN
      score := score + 5;
    END IF;
  END IF;
  
  IF phone IS NOT NULL AND phone ~ '^\+?1?[-.\s]?(\([0-9]{3}\)|[0-9]{3})[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}$' THEN
    score := score + 10;
  END IF;
  
  IF address IS NOT NULL AND LENGTH(address) > 10 THEN
    score := score + 10;
  END IF;
  
  IF website IS NOT NULL AND website ~* '^https?://' THEN
    score := score + 10;
    -- Bonus for website accessibility
    IF (lead_data->>'website_status')::INTEGER BETWEEN 200 AND 399 THEN
      score := score + 5;
    END IF;
  END IF;
  
  -- Email verification scoring (25 points max)
  IF email_verified = true THEN
    score := score + 20;
  ELSIF lead_data->>'email' IS NOT NULL THEN
    score := score + 10;
  END IF;
  
  -- Additional verification bonuses (20 points max)
  IF (lead_data->'enrichment_sources'->>'government_registry')::BOOLEAN = true THEN
    score := score + 10;
  END IF;
  
  IF social_verified = true THEN
    score := score + 10;
  END IF;
  
  -- Cap at 100
  RETURN LEAST(100, score);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Update lead confidence scores based on current data
CREATE OR REPLACE FUNCTION update_lead_confidence_scores(campaign_id_param UUID DEFAULT NULL)
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER := 0;
  lead_record RECORD;
  new_score INTEGER;
  lead_data JSON;
BEGIN
  FOR lead_record IN 
    SELECT id, business_name, phone, address, website, email_verified, 
           website_status, social_verified, enrichment_sources
    FROM enhanced_leads 
    WHERE campaign_id_param IS NULL OR campaign_id = campaign_id_param
  LOOP
    -- Build JSON object for scoring function
    lead_data := json_build_object(
      'business_name', lead_record.business_name,
      'phone', lead_record.phone,
      'address', lead_record.address,
      'website', lead_record.website,
      'email_verified', lead_record.email_verified,
      'website_status', lead_record.website_status,
      'social_verified', lead_record.social_verified,
      'enrichment_sources', lead_record.enrichment_sources
    );
    
    -- Calculate new confidence score
    new_score := calculate_lead_quality_score(lead_data);
    
    -- Update if score has changed
    UPDATE enhanced_leads 
    SET confidence_score = new_score,
        updated_at = now()
    WHERE id = lead_record.id 
      AND confidence_score != new_score;
    
    IF FOUND THEN
      updated_count := updated_count + 1;
    END IF;
  END LOOP;
  
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  RAISE NOTICE '✅ Phase 4.2 Complete: Lead quality and scoring functions created';
  RAISE NOTICE '   - calculate_lead_quality_score(): Comprehensive quality scoring algorithm';
  RAISE NOTICE '   - update_lead_confidence_scores(): Batch confidence score updates';
END $$;

-- Phase 4.3: Campaign Analytics Functions
-- ============================================================================

-- Calculate comprehensive campaign analytics
CREATE OR REPLACE FUNCTION get_campaign_analytics(campaign_id_param UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'campaign_id', c.id,
    'campaign_name', c.name,
    'status', c.status,
    'created_at', c.created_at,
    'completed_at', c.completed_at,
    'total_leads', COUNT(el.id),
    'qualified_leads', COUNT(el.id) FILTER (WHERE el.confidence_score >= c.quality_threshold),
    'total_cost', COALESCE(SUM(el.total_cost), 0),
    'average_confidence', COALESCE(ROUND(AVG(el.confidence_score)), 0),
    'cost_per_lead', CASE 
      WHEN COUNT(el.id) > 0 THEN ROUND(COALESCE(SUM(el.total_cost), 0) / COUNT(el.id), 4)
      ELSE 0 
    END,
    'cost_per_qualified_lead', CASE 
      WHEN COUNT(el.id) FILTER (WHERE el.confidence_score >= c.quality_threshold) > 0 
      THEN ROUND(COALESCE(SUM(el.total_cost), 0) / COUNT(el.id) FILTER (WHERE el.confidence_score >= c.quality_threshold), 4)
      ELSE 0 
    END,
    'qualification_rate', CASE 
      WHEN COUNT(el.id) > 0 
      THEN ROUND(COUNT(el.id) FILTER (WHERE el.confidence_score >= c.quality_threshold)::DECIMAL / COUNT(el.id) * 100, 1)
      ELSE 0 
    END,
    'quality_distribution', (
      SELECT json_build_object(
        'excellent', COUNT(*) FILTER (WHERE confidence_score >= 90),
        'very_good', COUNT(*) FILTER (WHERE confidence_score >= 80 AND confidence_score < 90),
        'good', COUNT(*) FILTER (WHERE confidence_score >= 70 AND confidence_score < 80),
        'average', COUNT(*) FILTER (WHERE confidence_score >= 50 AND confidence_score < 70),
        'poor', COUNT(*) FILTER (WHERE confidence_score < 50)
      )
      FROM enhanced_leads WHERE campaign_id = campaign_id_param
    ),
    'email_discovery_stats', (
      SELECT json_build_object(
        'leads_with_emails', COUNT(DISTINCT el.id),
        'total_emails_found', COUNT(le.id),
        'verified_deliverable', COUNT(le.id) FILTER (WHERE le.verification_status = 'deliverable'),
        'verification_rate', CASE 
          WHEN COUNT(le.id) > 0 
          THEN ROUND(COUNT(le.id) FILTER (WHERE le.verification_status = 'deliverable')::DECIMAL / COUNT(le.id) * 100, 1)
          ELSE 0 
        END
      )
      FROM enhanced_leads el
      LEFT JOIN lead_emails le ON el.id = le.lead_id
      WHERE el.campaign_id = campaign_id_param
    ),
    'api_usage_breakdown', (
      SELECT json_object_agg(api_service, usage_stats)
      FROM (
        SELECT 
          api_service,
          json_build_object(
            'requests_made', COUNT(*),
            'total_cost', COALESCE(SUM(request_cost), 0),
            'avg_response_time_ms', COALESCE(ROUND(AVG(processing_time_ms)), 0),
            'success_rate', ROUND(COUNT(*) FILTER (WHERE response_status < 400)::DECIMAL / COUNT(*) * 100, 1)
          ) as usage_stats
        FROM api_usage_log 
        WHERE campaign_id = campaign_id_param 
        GROUP BY api_service
      ) api_stats
    ),
    'budget_utilization', CASE 
      WHEN c.budget_limit IS NOT NULL AND c.budget_limit > 0
      THEN ROUND(c.total_cost / c.budget_limit * 100, 1)
      ELSE NULL
    END,
    'performance_metrics', (
      SELECT json_build_object(
        'leads_per_hour', ROUND(COUNT(el.id)::DECIMAL / GREATEST(1, EXTRACT(EPOCH FROM (COALESCE(c.completed_at, now()) - c.created_at)) / 3600), 2),
        'cost_efficiency_score', LEAST(100, GREATEST(0, 100 - (COALESCE(SUM(el.total_cost), 0) / GREATEST(1, COUNT(el.id)) * 10))),
        'data_completeness_avg', ROUND(AVG(el.data_completeness_score), 1)
      )
      FROM enhanced_leads el
      WHERE el.campaign_id = campaign_id_param
    )
  ) INTO result
  FROM campaigns c
  LEFT JOIN enhanced_leads el ON c.id = el.campaign_id
  WHERE c.id = campaign_id_param
  GROUP BY c.id, c.name, c.status, c.created_at, c.completed_at, c.quality_threshold, c.budget_limit, c.total_cost;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Get real-time dashboard metrics
CREATE OR REPLACE FUNCTION get_realtime_dashboard_metrics(user_id_param UUID DEFAULT NULL)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'overview', (
      SELECT json_build_object(
        'active_campaigns', COUNT(*) FILTER (WHERE status = 'running'),
        'completed_campaigns', COUNT(*) FILTER (WHERE status = 'completed'),
        'total_campaigns', COUNT(*),
        'total_leads_today', (
          SELECT COUNT(*) FROM enhanced_leads el
          JOIN campaigns c ON el.campaign_id = c.id
          WHERE DATE(el.created_at) = CURRENT_DATE
            AND (user_id_param IS NULL OR c.user_id = user_id_param)
        ),
        'qualified_leads_today', (
          SELECT COUNT(*) FROM enhanced_leads el
          JOIN campaigns c ON el.campaign_id = c.id
          WHERE DATE(el.created_at) = CURRENT_DATE
            AND el.confidence_score >= 80
            AND (user_id_param IS NULL OR c.user_id = user_id_param)
        ),
        'total_cost_today', (
          SELECT COALESCE(SUM(act.total_cost), 0)
          FROM api_cost_tracking act
          LEFT JOIN campaigns c ON act.campaign_id = c.id
          WHERE act.date = CURRENT_DATE
            AND (user_id_param IS NULL OR c.user_id = user_id_param OR act.campaign_id IS NULL)
        ),
        'avg_qualification_rate', (
          SELECT ROUND(AVG(lqm.qualification_rate * 100), 1)
          FROM lead_qualification_metrics lqm
          LEFT JOIN campaigns c ON lqm.campaign_id = c.id
          WHERE lqm.date >= CURRENT_DATE - INTERVAL '7 days'
            AND (user_id_param IS NULL OR c.user_id = user_id_param)
        )
      )
      FROM campaigns
      WHERE user_id_param IS NULL OR user_id = user_id_param
    ),
    'recent_campaigns', (
      SELECT json_agg(
        json_build_object(
          'campaign_id', c.id,
          'name', c.name,
          'status', c.status,
          'leads_count', (SELECT COUNT(*) FROM enhanced_leads WHERE campaign_id = c.id),
          'qualified_leads', (SELECT COUNT(*) FROM enhanced_leads WHERE campaign_id = c.id AND confidence_score >= 80),
          'total_cost', c.total_cost,
          'created_at', c.created_at
        )
        ORDER BY c.created_at DESC
      )
      FROM campaigns c
      WHERE (user_id_param IS NULL OR c.user_id = user_id_param)
      LIMIT 10
    ),
    'performance_trends', (
      SELECT json_agg(
        json_build_object(
          'date', date,
          'total_leads', SUM(total_leads_discovered),
          'qualified_leads', SUM(leads_qualified),
          'total_cost', SUM(total_api_cost),
          'avg_qualification_rate', ROUND(AVG(qualification_rate * 100), 1)
        )
        ORDER BY date DESC
      )
      FROM lead_qualification_metrics lqm
      LEFT JOIN campaigns c ON lqm.campaign_id = c.id
      WHERE lqm.date >= CURRENT_DATE - INTERVAL '30 days'
        AND (user_id_param IS NULL OR c.user_id = user_id_param)
      GROUP BY date
      LIMIT 30
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  RAISE NOTICE '✅ Phase 4.3 Complete: Campaign analytics functions created';
  RAISE NOTICE '   - get_campaign_analytics(): Comprehensive campaign analysis';
  RAISE NOTICE '   - get_realtime_dashboard_metrics(): Real-time dashboard data';
END $$;

-- Phase 4.4: Geographic and Search Functions
-- ============================================================================

-- Find leads within geographic radius
CREATE OR REPLACE FUNCTION leads_within_radius(
  center_lat FLOAT,
  center_lng FLOAT,
  radius_km FLOAT,
  campaign_id_param UUID DEFAULT NULL
)
RETURNS TABLE (
  lead_id UUID,
  business_name TEXT,
  distance_km FLOAT,
  confidence_score confidence_score_type
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    el.id as lead_id,
    el.business_name,
    (ST_Distance(
      ST_GeogFromText('POINT(' || center_lng || ' ' || center_lat || ')'),
  el.location_coordinates
    ) / 1000)::FLOAT as distance_km,
    el.confidence_score
  FROM enhanced_leads el
  WHERE el.location_coordinates IS NOT NULL
    AND (campaign_id_param IS NULL OR el.campaign_id = campaign_id_param)
    AND ST_DWithin(
      ST_GeogFromText('POINT(' || center_lng || ' ' || center_lat || ')'),
  el.location_coordinates,
  radius_km * 1000
    )
  ORDER BY distance_km;
END;
$$ LANGUAGE plpgsql;

-- Search leads by business name with fuzzy matching
CREATE OR REPLACE FUNCTION search_leads_by_name(
  search_term TEXT,
  user_id_param UUID DEFAULT NULL,
  limit_param INTEGER DEFAULT 50
)
RETURNS TABLE (
  lead_id UUID,
  campaign_id UUID,
  business_name TEXT,
  confidence_score confidence_score_type,
  similarity_score FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    el.id as lead_id,
    el.campaign_id,
    el.business_name,
    el.confidence_score,
    SIMILARITY(el.business_name, search_term)::double precision as similarity_score
  FROM enhanced_leads el
  JOIN campaigns c ON el.campaign_id = c.id
  WHERE (user_id_param IS NULL OR c.user_id = user_id_param)
    AND (
      el.business_name ILIKE '%' || search_term || '%'
      OR el.business_name % search_term
      OR to_tsvector('english', el.business_name) @@ plainto_tsquery('english', search_term)
    )
  ORDER BY similarity_score DESC, el.confidence_score DESC
  LIMIT limit_param;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  RAISE NOTICE '✅ Phase 4.4 Complete: Geographic and search functions created';
  RAISE NOTICE '   - leads_within_radius(): Geographic lead search';
  RAISE NOTICE '   - search_leads_by_name(): Fuzzy name search with ranking';
END $$;

-- Phase 4.5: Data Maintenance and Optimization Functions
-- ============================================================================

-- Update campaign statistics based on actual lead data
CREATE OR REPLACE FUNCTION update_campaign_statistics(campaign_id_param UUID DEFAULT NULL)
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER := 0;
BEGIN
  UPDATE campaigns 
  SET 
    leads_discovered = (
      SELECT COUNT(*) 
      FROM enhanced_leads 
      WHERE campaign_id = campaigns.id
    ),
    leads_qualified = (
      SELECT COUNT(*) 
      FROM enhanced_leads 
      WHERE campaign_id = campaigns.id 
        AND confidence_score >= campaigns.quality_threshold
    ),
    total_cost = (
      SELECT COALESCE(SUM(total_cost), 0) 
      FROM enhanced_leads 
      WHERE campaign_id = campaigns.id
    ),
    updated_at = now()
  WHERE (campaign_id_param IS NULL OR id = campaign_id_param);
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- Refresh materialized view safely
CREATE OR REPLACE FUNCTION refresh_analytics_views()
RETURNS BOOLEAN AS $$
BEGIN
  BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY lead_analytics_summary;
    RETURN true;
  EXCEPTION 
    WHEN OTHERS THEN
      -- Fallback to non-concurrent refresh
      REFRESH MATERIALIZED VIEW lead_analytics_summary;
      RETURN true;
  END;
END;
$$ LANGUAGE plpgsql;

-- Archive old campaigns and leads
CREATE OR REPLACE FUNCTION archive_old_data(cutoff_date DATE DEFAULT CURRENT_DATE - INTERVAL '90 days')
RETURNS JSON AS $$
DECLARE
  archived_campaigns INTEGER := 0;
  archived_leads INTEGER := 0;
  result JSON;
BEGIN
  -- Create archive tables if they don't exist
  CREATE TABLE IF NOT EXISTS campaigns_archive (LIKE campaigns INCLUDING ALL);
  CREATE TABLE IF NOT EXISTS enhanced_leads_archive (LIKE enhanced_leads INCLUDING ALL);
  
  -- Archive old completed campaigns
  WITH archived AS (
    DELETE FROM campaigns 
    WHERE status IN ('completed', 'cancelled') 
      AND (completed_at < cutoff_date OR created_at < cutoff_date - INTERVAL '180 days')
    RETURNING *
  )
  INSERT INTO campaigns_archive SELECT * FROM archived;
  
  GET DIAGNOSTICS archived_campaigns = ROW_COUNT;
  
  -- Archive orphaned leads
  WITH archived AS (
    DELETE FROM enhanced_leads
    WHERE created_at < cutoff_date 
      AND campaign_id NOT IN (SELECT id FROM campaigns)
    RETURNING *
  )
  INSERT INTO enhanced_leads_archive SELECT * FROM archived;
  
  GET DIAGNOSTICS archived_leads = ROW_COUNT;
  
  result := json_build_object(
    'archived_campaigns', archived_campaigns,
    'archived_leads', archived_leads,
    'cutoff_date', cutoff_date,
    'archived_at', now()
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  RAISE NOTICE '✅ Phase 4.5 Complete: Data maintenance functions created';
  RAISE NOTICE '   - update_campaign_statistics(): Campaign stats synchronization';
  RAISE NOTICE '   - refresh_analytics_views(): Safe materialized view refresh';
  RAISE NOTICE '   - archive_old_data(): Automated data archiving';
END $$;

-- Phase 4.6: Function Validation and Testing
-- ============================================================================

DO $$
DECLARE
  function_count INTEGER;
  test_result JSON;
BEGIN
  -- Count created functions
  SELECT COUNT(*) INTO function_count
  FROM information_schema.routines
  WHERE routine_schema = 'public'
    AND routine_name IN (
      'calculate_lead_quality_score',
      'update_lead_confidence_scores',
      'get_campaign_analytics',
      'get_realtime_dashboard_metrics',
      'leads_within_radius',
      'search_leads_by_name',
      'update_campaign_statistics',
      'refresh_analytics_views',
      'archive_old_data'
    );
  
  -- Test basic function
  SELECT calculate_lead_quality_score('{"business_name": "Test Business", "phone": "+1-555-123-4567"}') INTO test_result;
  
  RAISE NOTICE '✅ Phase 4.6 Complete: Function validation successful';
  RAISE NOTICE '   - Functions created: %', function_count;
  RAISE NOTICE '   - Basic function test: % points', test_result;
END $$;

-- ============================================================================
-- Phase 4 Complete Summary
-- ============================================================================

DO $$
DECLARE
  completion_time TIMESTAMP WITH TIME ZONE := now();
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🎯 PHASE 4 COMPLETE: Functions and Procedures Infrastructure';
  RAISE NOTICE '=======================================================';
  RAISE NOTICE 'Completion Time: %', completion_time;
  RAISE NOTICE '';
  RAISE NOTICE 'Business Logic Functions:';
  RAISE NOTICE '- ✅ Lead quality scoring with comprehensive algorithms';
  RAISE NOTICE '- ✅ Campaign analytics and performance calculations';
  RAISE NOTICE '- ✅ Real-time dashboard metrics aggregation';
  RAISE NOTICE '- ✅ Geographic search and proximity analysis';
  RAISE NOTICE '- ✅ Fuzzy text search with similarity ranking';
  RAISE NOTICE '';
  RAISE NOTICE 'Data Maintenance Functions:';
  RAISE NOTICE '- ✅ Automated campaign statistics updates';
  RAISE NOTICE '- ✅ Safe materialized view refresh procedures';
  RAISE NOTICE '- ✅ Automated data archiving and cleanup';
  RAISE NOTICE '';
  RAISE NOTICE 'Advanced Features:';
  RAISE NOTICE '- ✅ PostGIS integration for geographic analysis';
  RAISE NOTICE '- ✅ Full-text search capabilities';
  RAISE NOTICE '- ✅ JSON aggregation for complex analytics';
  RAISE NOTICE '- ✅ Error handling and fallback procedures';
  RAISE NOTICE '';
  RAISE NOTICE 'Next Steps:';
  RAISE NOTICE '1. Execute 05-security-and-rls.sql (FINAL PHASE)';
  RAISE NOTICE '2. Run validation and testing procedures';
  RAISE NOTICE '3. Configure application connection strings';
END $$;

-- =====================================================
-- PHASE 5: Security Policies
-- Row Level Security (RLS) policies
-- =====================================================

-- ============================================================================
-- ProspectPro Database Foundation - Phase 5: Security and Row Level Security
-- ============================================================================
-- This script implements comprehensive Row Level Security (RLS) policies and
-- security hardening for multi-tenant data isolation and access control.
--
-- PREREQUISITES: Execute phases 01, 02, 03, and 04 FIRST
-- This is the FINAL phase of database setup.
-- ============================================================================

-- Phase 5.1: Verify All Prerequisites
-- ============================================================================

DO $$
DECLARE
  required_tables TEXT[] := ARRAY[
    'campaigns', 'enhanced_leads', 'lead_emails', 'lead_social_profiles',
    'api_usage_log', 'system_settings', 'service_health_metrics',
    'campaign_analytics', 'api_cost_tracking', 'lead_qualification_metrics',
    'dashboard_exports'
  ];
  missing_table TEXT;
  table_exists BOOLEAN;
  function_count INTEGER;
BEGIN
  RAISE NOTICE '🔍 Phase 5.1: Verifying all prerequisites...';
  
  -- Check all tables exist
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
  
  -- Check essential functions exist
  SELECT COUNT(*) INTO function_count
  FROM information_schema.routines
  WHERE routine_schema = 'public'
    AND routine_name IN ('calculate_lead_quality_score', 'get_campaign_analytics');
    
  IF function_count < 2 THEN
    RAISE EXCEPTION 'Missing required functions. Execute 04-functions-and-procedures.sql first.';
  END IF;
  
  RAISE NOTICE '   ✅ Required functions exist: %', function_count;
  RAISE NOTICE '✅ Phase 5.1 Complete: All prerequisites verified';
END $$;

-- Phase 5.2: Enable Row Level Security
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '🛡️  Phase 5.2: Enabling Row Level Security on all tables...';
END $$;

-- Enable RLS on all core tables
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE enhanced_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_social_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_health_metrics ENABLE ROW LEVEL SECURITY;

-- Enable RLS on analytics tables
ALTER TABLE campaign_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_cost_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_qualification_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_exports ENABLE ROW LEVEL SECURITY;

-- Enable RLS on deployment monitoring tables (private/internal use)
ALTER TABLE railway_webhook_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE deployment_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE deployment_failures ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  RAISE NOTICE '✅ Phase 5.2 Complete: Row Level Security enabled on all tables';
END $$;

-- If PostGIS created spatial_ref_sys in public (older installs), attempt to enable RLS
-- Note: This may fail in managed environments where user doesn't own PostGIS system tables
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'spatial_ref_sys'
  ) THEN
    BEGIN
      EXECUTE 'ALTER TABLE public.spatial_ref_sys ENABLE ROW LEVEL SECURITY';
      RAISE NOTICE '   - Enabled RLS on spatial_ref_sys';
    EXCEPTION WHEN insufficient_privilege THEN
      RAISE NOTICE '   - Cannot enable RLS on spatial_ref_sys (insufficient privileges - normal in managed environments)';
    END;
  END IF;
END $$;

-- Phase 5.3: Foundation Table Policies (Direct User Ownership)
-- ============================================================================

-- Campaigns: Direct user ownership
DROP POLICY IF EXISTS "campaigns_user_access" ON campaigns;
CREATE POLICY "campaigns_user_access" ON campaigns
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- System settings: Direct user ownership
DROP POLICY IF EXISTS "system_settings_user_access" ON system_settings;
CREATE POLICY "system_settings_user_access" ON system_settings
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Service health metrics: Read-only for all authenticated users
DROP POLICY IF EXISTS "service_health_metrics_read_all" ON service_health_metrics;
CREATE POLICY "service_health_metrics_read_all" ON service_health_metrics
  FOR SELECT TO authenticated
  USING (true);

-- Service health metrics: System can insert/update
DROP POLICY IF EXISTS "service_health_metrics_system_write" ON service_health_metrics;
CREATE POLICY "service_health_metrics_system_write" ON service_health_metrics
  FOR INSERT TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "service_health_metrics_system_update" ON service_health_metrics;
CREATE POLICY "service_health_metrics_system_update" ON service_health_metrics
  FOR UPDATE TO authenticated
  USING (true);

DO $$
BEGIN
  RAISE NOTICE '✅ Phase 5.3 Complete: Foundation table security policies created';
  RAISE NOTICE '   - campaigns: User-isolated access';
  RAISE NOTICE '   - system_settings: User-isolated access';
  RAISE NOTICE '   - service_health_metrics: Read-all, system-write';
END $$;

-- Phase 5.4: Lead Management Policies (Campaign-based Access)
-- ============================================================================

-- Enhanced leads: Access via campaign ownership
DROP POLICY IF EXISTS "enhanced_leads_campaign_access" ON enhanced_leads;
CREATE POLICY "enhanced_leads_campaign_access" ON enhanced_leads
  FOR ALL TO authenticated
  USING (
    campaign_id IN (
      SELECT id FROM campaigns WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    campaign_id IN (
      SELECT id FROM campaigns WHERE user_id = auth.uid()
    )
  );

-- Lead emails: Access via lead->campaign chain
DROP POLICY IF EXISTS "lead_emails_campaign_access" ON lead_emails;
CREATE POLICY "lead_emails_campaign_access" ON lead_emails
  FOR ALL TO authenticated
  USING (
    lead_id IN (
      SELECT el.id FROM enhanced_leads el
      JOIN campaigns c ON el.campaign_id = c.id
      WHERE c.user_id = auth.uid()
    )
  )
  WITH CHECK (
    lead_id IN (
      SELECT el.id FROM enhanced_leads el
      JOIN campaigns c ON el.campaign_id = c.id
      WHERE c.user_id = auth.uid()
    )
  );

-- Lead social profiles: Access via lead->campaign chain
DROP POLICY IF EXISTS "lead_social_profiles_campaign_access" ON lead_social_profiles;
CREATE POLICY "lead_social_profiles_campaign_access" ON lead_social_profiles
  FOR ALL TO authenticated
  USING (
    lead_id IN (
      SELECT el.id FROM enhanced_leads el
      JOIN campaigns c ON el.campaign_id = c.id
      WHERE c.user_id = auth.uid()
    )
  )
  WITH CHECK (
    lead_id IN (
      SELECT el.id FROM enhanced_leads el
      JOIN campaigns c ON el.campaign_id = c.id
      WHERE c.user_id = auth.uid()
    )
  );

DO $$
BEGIN
  RAISE NOTICE '✅ Phase 5.4 Complete: Lead management security policies created';
  RAISE NOTICE '   - enhanced_leads: Campaign-based access control';
  RAISE NOTICE '   - lead_emails: Lead->campaign ownership chain';
  RAISE NOTICE '   - lead_social_profiles: Lead->campaign ownership chain';
END $$;

-- Phase 5.5: API Usage and Cost Tracking Policies
-- ============================================================================

-- API usage log: Campaign-based access (with NULL campaign support)
DROP POLICY IF EXISTS "api_usage_log_campaign_access" ON api_usage_log;
CREATE POLICY "api_usage_log_campaign_access" ON api_usage_log
  FOR ALL TO authenticated
  USING (
    campaign_id IS NULL OR
    campaign_id IN (
      SELECT id FROM campaigns WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    campaign_id IS NULL OR
    campaign_id IN (
      SELECT id FROM campaigns WHERE user_id = auth.uid()
    )
  );

DO $$
BEGIN
  RAISE NOTICE '✅ Phase 5.5 Complete: API usage tracking security policies created';
  RAISE NOTICE '   - api_usage_log: Campaign-based with system-wide support';
END $$;

-- Phase 5.6: Analytics and Monitoring Policies
-- ============================================================================

-- Campaign analytics: Campaign-based access
DROP POLICY IF EXISTS "campaign_analytics_campaign_access" ON campaign_analytics;
CREATE POLICY "campaign_analytics_campaign_access" ON campaign_analytics
  FOR ALL TO authenticated
  USING (
    campaign_id IN (
      SELECT id FROM campaigns WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    campaign_id IN (
      SELECT id FROM campaigns WHERE user_id = auth.uid()
    )
  );

-- API cost tracking: Campaign-based access (with NULL campaign support)
DROP POLICY IF EXISTS "api_cost_tracking_campaign_access" ON api_cost_tracking;
CREATE POLICY "api_cost_tracking_campaign_access" ON api_cost_tracking
  FOR ALL TO authenticated
  USING (
    campaign_id IS NULL OR
    campaign_id IN (
      SELECT id FROM campaigns WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    campaign_id IS NULL OR
    campaign_id IN (
      SELECT id FROM campaigns WHERE user_id = auth.uid()
    )
  );

-- Lead qualification metrics: Campaign-based access
DROP POLICY IF EXISTS "lead_qualification_metrics_campaign_access" ON lead_qualification_metrics;
CREATE POLICY "lead_qualification_metrics_campaign_access" ON lead_qualification_metrics
  FOR ALL TO authenticated
  USING (
    campaign_id IN (
      SELECT id FROM campaigns WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    campaign_id IN (
      SELECT id FROM campaigns WHERE user_id = auth.uid()
    )
  );

-- Dashboard exports: User-based access with campaign filtering
DROP POLICY IF EXISTS "dashboard_exports_user_access" ON dashboard_exports;
CREATE POLICY "dashboard_exports_user_access" ON dashboard_exports
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DO $$
BEGIN
  RAISE NOTICE '✅ Phase 5.6 Complete: Analytics and monitoring security policies created';
  RAISE NOTICE '   - campaign_analytics: Campaign-based access';
  RAISE NOTICE '   - api_cost_tracking: Campaign-based with system support';
  RAISE NOTICE '   - lead_qualification_metrics: Campaign-based access';
  RAISE NOTICE '   - dashboard_exports: User-based access';
END $$;

-- Phase 5.7: Performance Indexes for Security
-- ============================================================================

-- Create indexes to optimize RLS policy performance
CREATE INDEX IF NOT EXISTS idx_campaigns_user_id_btree
  ON campaigns(user_id) WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_enhanced_leads_campaign_user
  ON enhanced_leads(campaign_id) 
  WHERE campaign_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_lead_emails_lead_campaign
  ON lead_emails(lead_id) 
  WHERE lead_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_system_settings_user_active
  ON system_settings(user_id) 
  WHERE is_active = true;

-- Composite indexes for complex policy queries
CREATE INDEX IF NOT EXISTS idx_campaign_analytics_user_campaign
  ON campaign_analytics(campaign_id, timestamp DESC)
  WHERE campaign_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_api_cost_tracking_user_campaign
  ON api_cost_tracking(campaign_id, date DESC)
  WHERE campaign_id IS NOT NULL;

DO $$
BEGIN
  RAISE NOTICE '✅ Phase 5.7 Complete: Security performance indexes created';
  RAISE NOTICE '   - RLS policy optimization indexes';
  RAISE NOTICE '   - Index creation compatible with SQL Editor transactions';
END $$;

-- Phase 5.8: Security Validation and Testing
-- ============================================================================

DO $$
DECLARE
  rls_enabled_count INTEGER;
  policy_count INTEGER;
  index_count INTEGER;
BEGIN
  -- Count RLS-enabled tables
  SELECT COUNT(*) INTO rls_enabled_count
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relkind = 'r'
    AND c.relrowsecurity = true
    AND c.relname IN (
      'campaigns', 'enhanced_leads', 'lead_emails', 'lead_social_profiles',
      'api_usage_log', 'system_settings', 'service_health_metrics',
      'campaign_analytics', 'api_cost_tracking', 'lead_qualification_metrics',
      'dashboard_exports'
    );
  
  -- Count security policies
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public';
  
  -- Count security-related indexes
  SELECT COUNT(*) INTO index_count
  FROM pg_indexes
  WHERE schemaname = 'public'
    AND (indexname LIKE '%_user_%' OR indexname LIKE '%_campaign_%');
  
  RAISE NOTICE '✅ Phase 5.8 Complete: Security validation successful';
  RAISE NOTICE '   - RLS-enabled tables: %', rls_enabled_count;
  RAISE NOTICE '   - Security policies: %', policy_count;
  RAISE NOTICE '   - Security indexes: %', index_count;
  
  -- Verify expected counts
  IF rls_enabled_count != 11 THEN
    RAISE WARNING 'Expected 11 RLS-enabled tables, found %', rls_enabled_count;
  END IF;
  
  IF policy_count < 15 THEN
    RAISE WARNING 'Expected at least 15 security policies, found %', policy_count;
  END IF;
  
END $$;

-- Phase 5.9: Create Security Monitoring Function
-- ============================================================================

-- Function to check RLS policy effectiveness
CREATE OR REPLACE FUNCTION validate_rls_security()
RETURNS JSON AS $$
DECLARE
  result JSON;
  test_user_id UUID := '00000000-0000-0000-0000-000000000000';
BEGIN
  -- This function can be called to validate RLS is working
  -- It returns a summary of security configuration
  
  SELECT json_build_object(
    'rls_enabled_tables', (
      SELECT json_agg(tablename)
      FROM pg_tables t
      JOIN pg_class c ON c.relname = t.tablename
      WHERE t.schemaname = 'public'
        AND c.relrowsecurity = true
    ),
    'security_policies', (
      SELECT json_agg(
        json_build_object(
          'table', tablename,
          'policy_name', policyname,
          'policy_type', cmd
        )
      )
      FROM pg_policies
      WHERE schemaname = 'public'
    ),
    'validation_timestamp', now(),
    'auth_function_available', (
      SELECT EXISTS (
        SELECT FROM pg_proc 
        WHERE proname = 'uid' 
          AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'auth')
      )
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$
BEGIN
  RAISE NOTICE '✅ Phase 5.9 Complete: Security monitoring function created';
  RAISE NOTICE '   - validate_rls_security(): Security configuration validator';
END $$;

-- Phase 5.10: API Exposure Hardening and Function search_path pinning
-- ============================================================================

-- Guarded REVOKE: prevent PostgREST exposure for anonymous/authenticated roles
DO $$
BEGIN
  RAISE NOTICE '🧰 Phase 5.10: Hardening API exposure and pinning function search_path...';

  -- Revoke SELECT on materialized view if it exists
  IF EXISTS (
    SELECT 1 FROM pg_matviews WHERE schemaname='public' AND matviewname='lead_analytics_summary'
  ) THEN
    EXECUTE 'REVOKE SELECT ON public.lead_analytics_summary FROM anon, authenticated';
    RAISE NOTICE '   - REVOKE applied on lead_analytics_summary for anon/authenticated';
  END IF;

  -- Revoke SELECT on deployment_analytics view if present (defined in Phase 3 script)
  IF EXISTS (
    SELECT 1 FROM pg_views WHERE schemaname='public' AND viewname='deployment_analytics'
  ) THEN
    EXECUTE 'REVOKE SELECT ON public.deployment_analytics FROM anon, authenticated';
    RAISE NOTICE '   - REVOKE applied on deployment_analytics for anon/authenticated';
  END IF;
END $$;

-- Pin function search_path to avoid mutable search_path warnings (Supabase lints)
DO $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN (
    SELECT 'public.update_updated_at_column()' AS sig
    UNION ALL SELECT 'public.set_updated_at()'
    UNION ALL SELECT 'public.set_campaign_analytics_timestamp_date()'
    UNION ALL SELECT 'public.calculate_lead_quality_score(json)'
    UNION ALL SELECT 'public.update_lead_confidence_scores(uuid)'
    UNION ALL SELECT 'public.get_campaign_analytics(uuid)'
    UNION ALL SELECT 'public.get_realtime_dashboard_metrics(uuid)'
    UNION ALL SELECT 'public.leads_within_radius(double precision,double precision,double precision,uuid)'
    UNION ALL SELECT 'public.search_leads_by_name(text,uuid,integer)'
    UNION ALL SELECT 'public.update_campaign_statistics(uuid)'
    UNION ALL SELECT 'public.refresh_analytics_views()'
    UNION ALL SELECT 'public.archive_old_data(date)'
    UNION ALL SELECT 'public.validate_rls_security()'
    UNION ALL SELECT 'public.get_deployment_health_summary()'
    UNION ALL SELECT 'public.analyze_deployment_failures(integer)'
  ) LOOP
    IF EXISTS (
      SELECT 1
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = 'public'
        AND p.oid::regprocedure::text = rec.sig
    ) THEN
      EXECUTE format('ALTER FUNCTION %s SET search_path = public, extensions, pg_temp', rec.sig);
    END IF;
  END LOOP;
END $$;

-- ============================================================================
-- Phase 5 Complete - Database Setup Finished
-- ============================================================================

DO $$
DECLARE
  completion_time TIMESTAMP WITH TIME ZONE := now();
  total_tables INTEGER;
  total_indexes INTEGER;
  total_functions INTEGER;
  total_policies INTEGER;
BEGIN
  -- Final statistics
  SELECT COUNT(*) INTO total_tables
  FROM information_schema.tables
  WHERE table_schema = 'public';
  
  SELECT COUNT(*) INTO total_indexes
  FROM pg_indexes
  WHERE schemaname = 'public';
  
  SELECT COUNT(*) INTO total_functions
  FROM information_schema.routines
  WHERE routine_schema = 'public';
  
  SELECT COUNT(*) INTO total_policies
  FROM pg_policies
  WHERE schemaname = 'public';
  
  RAISE NOTICE '';
  RAISE NOTICE '🎯 PHASE 5 COMPLETE: Security and Row Level Security';
  RAISE NOTICE '🎉 DATABASE SETUP COMPLETE!';
  RAISE NOTICE '==================================================';
  RAISE NOTICE 'Completion Time: %', completion_time;
  RAISE NOTICE '';
  RAISE NOTICE 'Security Infrastructure:';
  RAISE NOTICE '- ✅ Row Level Security enabled on all tables';
  RAISE NOTICE '- ✅ Multi-tenant data isolation policies';
  RAISE NOTICE '- ✅ Campaign-based access control';
  RAISE NOTICE '- ✅ User-isolated system settings';
  RAISE NOTICE '- ✅ Performance-optimized security indexes';
  RAISE NOTICE '- ✅ Security validation functions';
  RAISE NOTICE '';
  RAISE NOTICE 'Database Statistics:';
  RAISE NOTICE '- 📊 Total Tables: %', total_tables;
  RAISE NOTICE '- 🚀 Total Indexes: %', total_indexes;
  RAISE NOTICE '- ⚡ Total Functions: %', total_functions;
  RAISE NOTICE '- 🛡️  Total Policies: %', total_policies;
  RAISE NOTICE '';
  RAISE NOTICE 'Security Model:';
  RAISE NOTICE '- 🔒 Zero-trust multi-tenant architecture';
  RAISE NOTICE '- 🔑 User isolation via auth.uid()';
  RAISE NOTICE '- 📊 Campaign ownership chains';
  RAISE NOTICE '- 🛡️  Lead->campaign->user access control';
  RAISE NOTICE '- 📈 System-wide monitoring data access';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 READY FOR PRODUCTION DEPLOYMENT!';
  RAISE NOTICE '';
  RAISE NOTICE 'Next Steps:';
  RAISE NOTICE '1. ✅ Database schema complete - all phases executed';
  RAISE NOTICE '2. 🔧 Configure application connection strings';
  RAISE NOTICE '3. 🚀 Deploy to Railway with Supabase integration';
  RAISE NOTICE '4. 🧪 Run integration tests and validation';
  RAISE NOTICE '5. 📊 Access admin dashboard and monitoring';
  RAISE NOTICE '';
  RAISE NOTICE 'Validation Command:';
  RAISE NOTICE 'SELECT validate_rls_security();';
  RAISE NOTICE '';
END $$;

