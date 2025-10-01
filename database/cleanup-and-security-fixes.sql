-- ProspectPro Database Cleanup and Security Fixes
-- Date: 2025-10-01
-- Purpose: Address security warnings and clean up unnecessary tables/functions

-- =============================================================================
-- SECURITY FIXES
-- =============================================================================

-- Fix 1: Remove SECURITY DEFINER from campaign_analytics view
-- Error: View `public.campaign_analytics` is defined with the SECURITY DEFINER property
DROP VIEW IF EXISTS public.campaign_analytics;

-- Recreate campaign_analytics view without SECURITY DEFINER
CREATE OR REPLACE VIEW public.campaign_analytics AS
SELECT 
    c.id,
    c.business_type,
    c.location,
    c.verification_level,
    c.target_count,
    c.results_count,
    c.total_cost,
    c.created_at,
    COUNT(l.id) as actual_leads_count,
    AVG(l.confidence_score) as avg_confidence_score,
    COUNT(CASE WHEN l.apollo_verified = true THEN 1 END) as apollo_verified_count,
    COUNT(CASE WHEN l.chamber_verified = true THEN 1 END) as chamber_verified_count,
    COUNT(CASE WHEN l.license_verified = true THEN 1 END) as license_verified_count
FROM campaigns c
LEFT JOIN leads l ON c.id = l.campaign_id
GROUP BY c.id, c.business_type, c.location, c.verification_level, c.target_count, c.results_count, c.total_cost, c.created_at;

-- Fix 2: Set search_path for update_updated_at_column function
-- Warning: Function `public.update_updated_at_column` has a role mutable search_path
DROP FUNCTION IF EXISTS public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

-- =============================================================================
-- CLEANUP UNNECESSARY TABLES
-- =============================================================================

-- Remove webhook tables (using Edge Functions instead)
DROP TABLE IF EXISTS public.lead_processing_webhooks CASCADE;
DROP TABLE IF EXISTS public.cost_monitoring_webhooks CASCADE;
DROP TABLE IF EXISTS public.campaign_webhooks CASCADE;

-- Remove monitoring tables (using Supabase Analytics instead)
DROP TABLE IF EXISTS public.api_usage_logs CASCADE;
DROP TABLE IF EXISTS public.error_logs CASCADE;
DROP TABLE IF EXISTS public.performance_metrics CASCADE;

-- Remove app_secrets table (using Supabase Vault instead)
DROP TABLE IF EXISTS public.app_secrets CASCADE;

-- Remove government integration tables (not currently used)
DROP TABLE IF EXISTS public.government_business_registry CASCADE;
DROP TABLE IF EXISTS public.license_verification_results CASCADE;

-- =============================================================================
-- CLEANUP UNNECESSARY FUNCTIONS
-- =============================================================================

-- Remove webhook functions (using Edge Functions)
DROP FUNCTION IF EXISTS public.trigger_lead_processing_webhook() CASCADE;
DROP FUNCTION IF EXISTS public.trigger_cost_monitoring_webhook() CASCADE;
DROP FUNCTION IF EXISTS public.trigger_campaign_webhook() CASCADE;

-- Remove monitoring functions (using Supabase Analytics)
DROP FUNCTION IF EXISTS public.log_api_usage() CASCADE;
DROP FUNCTION IF EXISTS public.log_error() CASCADE;
DROP FUNCTION IF EXISTS public.calculate_performance_metrics() CASCADE;

-- Remove vault functions (using Supabase Vault directly)
DROP FUNCTION IF EXISTS public.vault_decrypt_secret() CASCADE;
DROP FUNCTION IF EXISTS public.vault_decrypt_multiple_secrets() CASCADE;

-- =============================================================================
-- KEEP ESSENTIAL CORE STRUCTURE
-- =============================================================================

-- Ensure core tables exist with proper structure
CREATE TABLE IF NOT EXISTS public.campaigns (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    business_type TEXT NOT NULL,
    location TEXT NOT NULL,
    verification_level TEXT DEFAULT 'basic',
    target_count INTEGER DEFAULT 10,
    results_count INTEGER DEFAULT 0,
    total_cost DECIMAL(10,4) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.leads (
    id BIGSERIAL PRIMARY KEY,
    campaign_id TEXT REFERENCES campaigns(id) ON DELETE CASCADE,
    business_name TEXT NOT NULL,
    address TEXT,
    phone TEXT,
    website TEXT,
    email TEXT,
    owner_contact TEXT,
    linkedin_profile TEXT,
    confidence_score INTEGER DEFAULT 0,
    verification_status TEXT DEFAULT 'basic',
    data_source TEXT DEFAULT 'google_places',
    apollo_verified BOOLEAN DEFAULT FALSE,
    chamber_verified BOOLEAN DEFAULT FALSE,
    license_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.dashboard_exports (
    id BIGSERIAL PRIMARY KEY,
    campaign_id TEXT REFERENCES campaigns(id) ON DELETE CASCADE,
    export_data JSONB NOT NULL,
    export_format TEXT DEFAULT 'csv',
    file_size INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- UPDATE TRIGGERS (Fixed with secure search_path)
-- =============================================================================

-- Add updated_at triggers to core tables
DROP TRIGGER IF EXISTS update_campaigns_updated_at ON public.campaigns;
DROP TRIGGER IF EXISTS update_leads_updated_at ON public.leads;

CREATE TRIGGER update_campaigns_updated_at
    BEFORE UPDATE ON public.campaigns
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_leads_updated_at
    BEFORE UPDATE ON public.leads
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================================================
-- ROW LEVEL SECURITY (Keep existing policies)
-- =============================================================================

-- Enable RLS on core tables
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dashboard_exports ENABLE ROW LEVEL SECURITY;

-- Recreate essential RLS policies
DROP POLICY IF EXISTS "Allow anon access to campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Allow anon access to leads" ON public.leads;
DROP POLICY IF EXISTS "Allow anon access to exports" ON public.dashboard_exports;

CREATE POLICY "Allow anon access to campaigns" ON public.campaigns
    FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow anon access to leads" ON public.leads
    FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow anon access to exports" ON public.dashboard_exports
    FOR ALL TO anon USING (true) WITH CHECK (true);

-- =============================================================================
-- CLEANUP COMPLETE
-- =============================================================================

-- Summary of changes:
-- ✅ Fixed SECURITY DEFINER view (campaign_analytics)
-- ✅ Fixed mutable search_path function (update_updated_at_column)
-- ✅ Removed unnecessary webhook tables and functions
-- ✅ Removed monitoring tables (using Supabase Analytics)
-- ✅ Removed app_secrets table (using Supabase Vault)
-- ✅ Kept essential core tables: campaigns, leads, dashboard_exports
-- ✅ Maintained RLS policies for security
-- ✅ Updated triggers with secure search_path

SELECT 'Database cleanup and security fixes completed successfully!' as status;
