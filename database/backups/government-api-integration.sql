-- ============================================================================
-- ProspectPro Database Enhancement - Government API Integration
-- ============================================================================
-- This script extends the existing database schema to support government API
-- data sources for enhanced lead discovery and validation.
--
-- PREREQUISITES: Execute existing database foundation scripts first
-- ============================================================================

-- Phase G.1: Government API Data Types and Domains
-- ============================================================================

DO $$
BEGIN
  -- government_data_source_type
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'government_data_source_type'
  ) THEN
    EXECUTE $cmd$CREATE DOMAIN government_data_source_type AS TEXT CHECK (VALUE IN ('ca_sos','sec_edgar','propublica_nonprofit','foursquare_places','ny_sos','companies_house_uk','opencorporates'))$cmd$;
    RAISE NOTICE 'Created domain: government_data_source_type';
  ELSE
    RAISE NOTICE 'Domain already exists: government_data_source_type';
  END IF;

  -- business_entity_status_type
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'business_entity_status_type'
  ) THEN
    EXECUTE $cmd$CREATE DOMAIN business_entity_status_type AS TEXT CHECK (VALUE IN ('active','inactive','dissolved','suspended','terminated','unknown'))$cmd$;
    RAISE NOTICE 'Created domain: business_entity_status_type';
  END IF;

  -- nonprofit_classification_type
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'nonprofit_classification_type'
  ) THEN
    EXECUTE $cmd$CREATE DOMAIN nonprofit_classification_type AS TEXT CHECK (VALUE IN ('public_benefit','religious','educational','charitable','scientific','literary','social_welfare','other'))$cmd$;
    RAISE NOTICE 'Created domain: nonprofit_classification_type';
  END IF;
END $$;

DO $$
BEGIN
  RAISE NOTICE '✅ Phase G.1 Complete: Government API data types created';
END $$;

-- Phase G.2: Government Business Registry Tables
-- ============================================================================

-- California Secretary of State business entities
CREATE TABLE IF NOT EXISTS ca_sos_business_entities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_number TEXT NOT NULL UNIQUE,
  entity_name TEXT NOT NULL,
  entity_type TEXT,
  status business_entity_status_type DEFAULT 'unknown',
  status_description TEXT,

  -- Location information
  jurisdiction TEXT DEFAULT 'California',
  principal_address TEXT,
  mailing_address TEXT,

  -- Agent information
  agent_name TEXT,
  agent_type TEXT,

  -- Business details
  purpose TEXT,
  ceo_name TEXT,
  cfo_name TEXT,
  secretary_name TEXT,

  -- Dates
  registration_date DATE,
  last_updated TIMESTAMP WITH TIME ZONE,
  dissolution_date DATE,

  -- Metadata
  source government_data_source_type DEFAULT 'ca_sos',
  data_quality TEXT DEFAULT 'official_government_record',
  last_verified TIMESTAMP WITH TIME ZONE DEFAULT now(),
  raw_data JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),

  -- Constraints
  CONSTRAINT ca_sos_valid_dates CHECK (
    (dissolution_date IS NULL) OR
    (registration_date IS NOT NULL AND dissolution_date >= registration_date)
  )
);

-- SEC EDGAR company filings
CREATE TABLE IF NOT EXISTS sec_edgar_companies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cik TEXT NOT NULL UNIQUE, -- Central Index Key
  company_name TEXT NOT NULL,
  ticker_symbol TEXT,
  exchange TEXT,

  -- Company details
  industry_classification TEXT,
  business_description TEXT,
  fiscal_year_end TEXT,

  -- Location information
  business_address TEXT,
  mailing_address TEXT,
  incorporation_state TEXT,

  -- Financial summary
  total_assets DECIMAL(20,2),
  total_liabilities DECIMAL(20,2),
  total_revenue DECIMAL(20,2),
  net_income DECIMAL(20,2),
  employee_count INTEGER,

  -- Filing information
  latest_filing_date DATE,
  latest_filing_type TEXT,
  filing_count INTEGER DEFAULT 0,

  -- Metadata
  source government_data_source_type DEFAULT 'sec_edgar',
  data_quality TEXT DEFAULT 'official_sec_filing',
  last_verified TIMESTAMP WITH TIME ZONE DEFAULT now(),
  raw_data JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ProPublica Nonprofit Explorer organizations
CREATE TABLE IF NOT EXISTS propublica_nonprofits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ein TEXT NOT NULL UNIQUE, -- Employer Identification Number
  organization_name TEXT NOT NULL,

  -- Location information
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,

  -- Classification
  ntee_code TEXT,
  ntee_description TEXT,
  subsection TEXT,
  classification nonprofit_classification_type,

  -- Financial data
  total_revenue DECIMAL(15,2),
  total_expenses DECIMAL(15,2),
  net_assets DECIMAL(15,2),
  tax_period TEXT,

  -- Program details
  mission_statement TEXT,
  program_services TEXT,
  activities TEXT,

  -- Status and compliance
  is_active BOOLEAN DEFAULT true,
  ruling_date DATE,
  deductibility_code TEXT,

  -- Metadata
  source government_data_source_type DEFAULT 'propublica_nonprofit',
  data_quality TEXT DEFAULT 'government_tax_record',
  last_verified TIMESTAMP WITH TIME ZONE DEFAULT now(),
  raw_data JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Foursquare Places of Interest
CREATE TABLE IF NOT EXISTS foursquare_places (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  fsq_id TEXT NOT NULL UNIQUE, -- Foursquare ID
  place_name TEXT NOT NULL,

  -- Location information
  address TEXT,
  city TEXT,
  region TEXT,
  postal_code TEXT,
  country TEXT,
  formatted_address TEXT,

  -- Geographic coordinates
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  location_coordinates geography(Point,4326),

  -- Categories and classification
  categories JSONB DEFAULT '[]',
  primary_category TEXT,
  business_type TEXT,

  -- Contact information
  telephone TEXT,
  website TEXT,

  -- Additional attributes
  price_range TEXT,
  rating DECIMAL(3,1) CHECK (rating IS NULL OR (rating >= 0 AND rating <= 10)),
  hours JSONB DEFAULT '{}',
  photos JSONB DEFAULT '[]',

  -- Metadata
  source government_data_source_type DEFAULT 'foursquare_places',
  data_quality TEXT DEFAULT 'crowdsourced_location_data',
  last_verified TIMESTAMP WITH TIME ZONE DEFAULT now(),
  raw_data JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),

  -- Constraints
  CONSTRAINT foursquare_valid_coordinates CHECK (
    (latitude IS NULL AND longitude IS NULL) OR
    (latitude IS NOT NULL AND longitude IS NOT NULL AND
     latitude >= -90 AND latitude <= 90 AND
     longitude >= -180 AND longitude <= 180)
  )
);

DO $$
BEGIN
  RAISE NOTICE '✅ Phase G.2 Complete: Government business registry tables created';
  RAISE NOTICE '   - ca_sos_business_entities: California business registry';
  RAISE NOTICE '   - sec_edgar_companies: SEC company filings';
  RAISE NOTICE '   - propublica_nonprofits: Nonprofit organization data';
  RAISE NOTICE '   - foursquare_places: Points of interest data';
END $$;

-- Phase G.3: Government Data Validation and Cross-Reference Tables
-- ============================================================================

-- Government data validation results
CREATE TABLE IF NOT EXISTS government_data_validations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES enhanced_leads(id) ON DELETE CASCADE,

  -- Validation details
  data_source government_data_source_type NOT NULL,
  validation_type TEXT NOT NULL, -- 'business_registration', 'nonprofit_status', 'location_verification'
  external_id TEXT, -- EIN, Entity Number, FSQ ID, etc.

  -- Validation results
  is_valid BOOLEAN DEFAULT false,
  confidence_score confidence_score_type DEFAULT 0,
  validation_details JSONB DEFAULT '{}',

  -- Match quality
  name_match_score confidence_score_type,
  address_match_score confidence_score_type,
  overall_match_score confidence_score_type,

  -- Cost tracking
  validation_cost cost_amount_type DEFAULT 0.00,

  -- Metadata
  raw_response JSONB DEFAULT '{}',
  error_message TEXT,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),

  -- Constraints
  UNIQUE(lead_id, data_source, validation_type)
);

-- Business cross-reference table (links leads to government records)
CREATE TABLE IF NOT EXISTS business_cross_references (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES enhanced_leads(id) ON DELETE CASCADE,

  -- Government data source
  data_source government_data_source_type NOT NULL,
  external_id TEXT NOT NULL, -- EIN, Entity Number, etc.
  external_table TEXT NOT NULL, -- 'ca_sos_business_entities', 'propublica_nonprofits', etc.

  -- Match information
  match_type TEXT CHECK (match_type IN ('exact', 'fuzzy', 'partial', 'manual')),
  match_confidence confidence_score_type DEFAULT 0,
  match_details JSONB DEFAULT '{}',

  -- Relationship data
  relationship_type TEXT DEFAULT 'primary', -- 'primary', 'subsidiary', 'branch', etc.
  is_primary_record BOOLEAN DEFAULT true,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),

  -- Constraints
  UNIQUE(lead_id, data_source, external_id)
);

-- Government API usage tracking (extends api_usage_log)
CREATE TABLE IF NOT EXISTS government_api_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,

  -- API details
  api_service government_data_source_type NOT NULL,
  endpoint TEXT,
  request_type TEXT CHECK (request_type IN ('search', 'lookup', 'validation', 'enrichment')),

  -- Cost and performance
  request_cost cost_amount_type DEFAULT 0.00,
  response_status INTEGER CHECK (response_status IS NULL OR (response_status >= 100 AND response_status <= 599)),
  processing_time_ms INTEGER CHECK (processing_time_ms IS NULL OR processing_time_ms >= 0),

  -- Data quality metrics
  records_returned INTEGER DEFAULT 0,
  data_completeness_score confidence_score_type,
  validation_success_rate DECIMAL(5,4) CHECK (validation_success_rate IS NULL OR (validation_success_rate >= 0 AND validation_success_rate <= 1)),

  -- Request/Response data
  request_parameters JSONB DEFAULT '{}',
  response_summary JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

DO $$
BEGIN
  RAISE NOTICE '✅ Phase G.3 Complete: Government data validation tables created';
  RAISE NOTICE '   - government_data_validations: Validation results tracking';
  RAISE NOTICE '   - business_cross_references: Lead to government record mapping';
  RAISE NOTICE '   - government_api_usage: Government API usage tracking';
END $$;

-- Phase G.4: Enhanced Lead Enrichment with Government Data
-- ============================================================================

-- Add government data columns to enhanced_leads table
DO $$
BEGIN
  -- Add government data source tracking
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'enhanced_leads' AND column_name = 'government_sources'
  ) THEN
    ALTER TABLE enhanced_leads ADD COLUMN government_sources JSONB DEFAULT '{}';
    RAISE NOTICE 'Added government_sources column to enhanced_leads';
  END IF;

  -- Add government validation score
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'enhanced_leads' AND column_name = 'government_validation_score'
  ) THEN
    ALTER TABLE enhanced_leads ADD COLUMN government_validation_score confidence_score_type DEFAULT 0;
    RAISE NOTICE 'Added government_validation_score column to enhanced_leads';
  END IF;

  -- Add business registration status
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'enhanced_leads' AND column_name = 'business_registration_status'
  ) THEN
    ALTER TABLE enhanced_leads ADD COLUMN business_registration_status business_entity_status_type DEFAULT 'unknown';
    RAISE NOTICE 'Added business_registration_status column to enhanced_leads';
  END IF;

  -- Add nonprofit status
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'enhanced_leads' AND column_name = 'is_nonprofit'
  ) THEN
    ALTER TABLE enhanced_leads ADD COLUMN is_nonprofit BOOLEAN DEFAULT false;
    RAISE NOTICE 'Added is_nonprofit column to enhanced_leads';
  END IF;

  -- Add Foursquare POI data
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'enhanced_leads' AND column_name = 'foursquare_data'
  ) THEN
    ALTER TABLE enhanced_leads ADD COLUMN foursquare_data JSONB DEFAULT '{}';
    RAISE NOTICE 'Added foursquare_data column to enhanced_leads';
  END IF;
END $$;

DO $$
BEGIN
  RAISE NOTICE '✅ Phase G.4 Complete: Enhanced leads table updated with government data support';
END $$;

-- Phase G.5: Performance Indexes for Government Tables
-- ============================================================================

-- CA SOS business entities indexes
CREATE INDEX IF NOT EXISTS idx_ca_sos_entity_number ON ca_sos_business_entities(entity_number);
CREATE INDEX IF NOT EXISTS idx_ca_sos_entity_name ON ca_sos_business_entities USING GIN(to_tsvector('english', entity_name));
CREATE INDEX IF NOT EXISTS idx_ca_sos_status ON ca_sos_business_entities(status);
CREATE INDEX IF NOT EXISTS idx_ca_sos_agent_name ON ca_sos_business_entities USING GIN(to_tsvector('english', agent_name)) WHERE agent_name IS NOT NULL;

-- SEC EDGAR companies indexes
CREATE INDEX IF NOT EXISTS idx_sec_edgar_cik ON sec_edgar_companies(cik);
CREATE INDEX IF NOT EXISTS idx_sec_edgar_company_name ON sec_edgar_companies USING GIN(to_tsvector('english', company_name));
CREATE INDEX IF NOT EXISTS idx_sec_edgar_ticker ON sec_edgar_companies(ticker_symbol) WHERE ticker_symbol IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_sec_edgar_industry ON sec_edgar_companies(industry_classification) WHERE industry_classification IS NOT NULL;

-- ProPublica nonprofits indexes
CREATE INDEX IF NOT EXISTS idx_propublica_ein ON propublica_nonprofits(ein);
CREATE INDEX IF NOT EXISTS idx_propublica_org_name ON propublica_nonprofits USING GIN(to_tsvector('english', organization_name));
CREATE INDEX IF NOT EXISTS idx_propublica_ntee ON propublica_nonprofits(ntee_code) WHERE ntee_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_propublica_state ON propublica_nonprofits(state) WHERE state IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_propublica_revenue ON propublica_nonprofits(total_revenue DESC) WHERE total_revenue IS NOT NULL;

-- Foursquare places indexes
CREATE INDEX IF NOT EXISTS idx_foursquare_fsq_id ON foursquare_places(fsq_id);
CREATE INDEX IF NOT EXISTS idx_foursquare_place_name ON foursquare_places USING GIN(to_tsvector('english', place_name));
CREATE INDEX IF NOT EXISTS idx_foursquare_location ON foursquare_places USING GIST((location_coordinates)) WHERE location_coordinates IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_foursquare_business_type ON foursquare_places(business_type) WHERE business_type IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_foursquare_categories ON foursquare_places USING GIN(categories) WHERE categories IS NOT NULL;

-- Government data validations indexes
CREATE INDEX IF NOT EXISTS idx_gov_validations_lead_id ON government_data_validations(lead_id);
CREATE INDEX IF NOT EXISTS idx_gov_validations_source ON government_data_validations(data_source);
CREATE INDEX IF NOT EXISTS idx_gov_validations_confidence ON government_data_validations(confidence_score DESC);
CREATE INDEX IF NOT EXISTS idx_gov_validations_external_id ON government_data_validations(external_id) WHERE external_id IS NOT NULL;

-- Business cross-references indexes
CREATE INDEX IF NOT EXISTS idx_business_xref_lead_id ON business_cross_references(lead_id);
CREATE INDEX IF NOT EXISTS idx_business_xref_source ON business_cross_references(data_source);
CREATE INDEX IF NOT EXISTS idx_business_xref_external_id ON business_cross_references(external_id);
CREATE INDEX IF NOT EXISTS idx_business_xref_confidence ON business_cross_references(match_confidence DESC);

-- Government API usage indexes
CREATE INDEX IF NOT EXISTS idx_gov_api_usage_campaign ON government_api_usage(campaign_id) WHERE campaign_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_gov_api_usage_service ON government_api_usage(api_service);
CREATE INDEX IF NOT EXISTS idx_gov_api_usage_created ON government_api_usage(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gov_api_usage_cost ON government_api_usage(request_cost DESC) WHERE request_cost > 0;

DO $$
BEGIN
  RAISE NOTICE '✅ Phase G.5 Complete: Performance indexes created for government tables';
END $$;

-- Phase G.6: Updated Timestamp Triggers for Government Tables
-- ============================================================================

-- Apply updated_at triggers to government tables
CREATE TRIGGER ca_sos_business_entities_update_updated_at
  BEFORE UPDATE ON ca_sos_business_entities
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER sec_edgar_companies_update_updated_at
  BEFORE UPDATE ON sec_edgar_companies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER propublica_nonprofits_update_updated_at
  BEFORE UPDATE ON propublica_nonprofits
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER foursquare_places_update_updated_at
  BEFORE UPDATE ON foursquare_places
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER government_data_validations_update_updated_at
  BEFORE UPDATE ON government_data_validations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DO $$
BEGIN
  RAISE NOTICE '✅ Phase G.6 Complete: Timestamp triggers configured for government tables';
END $$;

-- Phase G.7: Government Data Integration Validation
-- ============================================================================

DO $$
DECLARE
  table_count INTEGER;
  column_count INTEGER;
  index_count INTEGER;
BEGIN
  -- Verify all government tables exist
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name IN ('ca_sos_business_entities', 'sec_edgar_companies', 'propublica_nonprofits', 'foursquare_places', 'government_data_validations', 'business_cross_references', 'government_api_usage');

  IF table_count != 7 THEN
    RAISE EXCEPTION 'Government table creation failed. Expected 7 tables, found %', table_count;
  END IF;

  -- Verify enhanced_leads has new government columns
  SELECT COUNT(*) INTO column_count
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'enhanced_leads'
    AND column_name IN ('government_sources', 'government_validation_score', 'business_registration_status', 'is_nonprofit', 'foursquare_data');

  IF column_count != 5 THEN
    RAISE NOTICE 'Warning: Expected 5 new government columns in enhanced_leads, found %', column_count;
  END IF;

  -- Verify performance indexes
  SELECT COUNT(*) INTO index_count
  FROM pg_indexes
  WHERE schemaname = 'public'
    AND (indexname LIKE 'idx_ca_sos_%'
      OR indexname LIKE 'idx_sec_edgar_%'
      OR indexname LIKE 'idx_propublica_%'
      OR indexname LIKE 'idx_foursquare_%'
      OR indexname LIKE 'idx_gov_%'
      OR indexname LIKE 'idx_business_xref_%');

  RAISE NOTICE '✅ Phase G.7 Complete: Government data integration validation successful';
  RAISE NOTICE '   - Government tables created: %', table_count;
  RAISE NOTICE '   - Enhanced leads columns added: %', column_count;
  RAISE NOTICE '   - Performance indexes created: %', index_count;
END $$;

-- ============================================================================
-- Government API Integration Complete Summary
-- ============================================================================

DO $$
DECLARE
  completion_time TIMESTAMP WITH TIME ZONE := now();
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🎯 GOVERNMENT API INTEGRATION COMPLETE';
  RAISE NOTICE '=====================================';
  RAISE NOTICE 'Completion Time: %', completion_time;
  RAISE NOTICE '';
  RAISE NOTICE 'Government Data Infrastructure:';
  RAISE NOTICE '- ✅ Custom data types for government sources';
  RAISE NOTICE '- ✅ CA SOS business registry table';
  RAISE NOTICE '- ✅ SEC EDGAR company filings table';
  RAISE NOTICE '- ✅ ProPublica nonprofit data table';
  RAISE NOTICE '- ✅ Foursquare Places POI table';
  RAISE NOTICE '- ✅ Government data validation tracking';
  RAISE NOTICE '- ✅ Business cross-reference system';
  RAISE NOTICE '- ✅ Government API usage monitoring';
  RAISE NOTICE '- ✅ Enhanced leads with government data support';
  RAISE NOTICE '- ✅ Performance-optimized indexes';
  RAISE NOTICE '- ✅ Data integrity constraints';
  RAISE NOTICE '- ✅ Automatic timestamp maintenance';
  RAISE NOTICE '';
  RAISE NOTICE 'Integration Benefits:';
  RAISE NOTICE '- Zero fake data through official government validation';
  RAISE NOTICE '- Cost optimization via early-stage filtering';
  RAISE NOTICE '- Enhanced lead quality and confidence scoring';
  RAISE NOTICE '- Comprehensive business intelligence';
  RAISE NOTICE '- Regulatory compliance and data accuracy';
  RAISE NOTICE '';
  RAISE NOTICE 'Next Steps:';
  RAISE NOTICE '1. Update enhanced lead discovery pipeline to use government APIs';
  RAISE NOTICE '2. Implement government data validation scoring';
  RAISE NOTICE '3. Test combined pipeline performance';
  RAISE NOTICE '4. Monitor API usage and cost optimization';
END $$;