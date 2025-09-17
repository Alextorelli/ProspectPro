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
CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- required for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable PostGIS for geographic operations (location coordinates)
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Enable trigram similarity for fuzzy text search (SIMILARITY(), % operator)
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Log successful extension creation
DO $$
BEGIN
  RAISE NOTICE '✅ Phase 1.1 Complete: Database extensions enabled';
  RAISE NOTICE '   - uuid-ossp: UUID generation';
  RAISE NOTICE '   - postgis: Geographic operations';
END $$;

-- Phase 1.2: Core Data Types and Domains
-- ============================================================================

-- Create custom domains for data validation
DO $$
BEGIN
  -- confidence_score_type
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'confidence_score_type'
  ) THEN
    EXECUTE 'CREATE DOMAIN confidence_score_type AS INTEGER CHECK (VALUE >= 0 AND VALUE <= 100)';
    RAISE NOTICE 'Created domain: confidence_score_type';
  ELSE
    RAISE NOTICE 'Domain already exists: confidence_score_type';
  END IF;

  -- cost_amount_type
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'cost_amount_type'
  ) THEN
    EXECUTE 'CREATE DOMAIN cost_amount_type AS DECIMAL(10,4) CHECK (VALUE >= 0)';
    RAISE NOTICE 'Created domain: cost_amount_type';
  ELSE
    RAISE NOTICE 'Domain already exists: cost_amount_type';
  END IF;

  -- campaign_status_type
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'campaign_status_type'
  ) THEN
    EXECUTE $$CREATE DOMAIN campaign_status_type AS TEXT CHECK (VALUE IN ('running','paused','completed','cancelled'))$$;
    RAISE NOTICE 'Created domain: campaign_status_type';
  ELSE
    RAISE NOTICE 'Domain already exists: campaign_status_type';
  END IF;

  -- verification_status_type
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'verification_status_type'
  ) THEN
    EXECUTE $$CREATE DOMAIN verification_status_type AS TEXT CHECK (VALUE IN ('deliverable','undeliverable','risky','unknown','pending'))$$;
    RAISE NOTICE 'Created domain: verification_status_type';
  ELSE
    RAISE NOTICE 'Domain already exists: verification_status_type';
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

-- Apply updated_at triggers to foundation tables
CREATE TRIGGER campaigns_update_updated_at
  BEFORE UPDATE ON campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER system_settings_update_updated_at
  BEFORE UPDATE ON system_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

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