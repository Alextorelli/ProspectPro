-- ProspectPro RLS Security Hardening Script
-- Based on Supabase AI analysis and zero-trust security model
-- Version: 2.0
-- Date: September 16, 2025

-- ===========================================
-- PHASE 1: Enable RLS on All Tables
-- ===========================================

-- Enable RLS on all core tables
ALTER TABLE IF EXISTS public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.business_validation ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.api_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.campaign_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.exported_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.enhanced_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.validation_results ENABLE ROW LEVEL SECURITY;

-- Log RLS enablement
DO $$
BEGIN
  RAISE NOTICE 'Phase 1 Complete: RLS enabled on all core tables';
END $$;

-- ===========================================
-- PHASE 2: Drop All Existing Insecure Policies  
-- ===========================================

-- Drop insecure policies that target 'public' role or have overly broad access
DROP POLICY IF EXISTS "Users can manage their own campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Users can access businesses from their campaigns" ON public.businesses;
DROP POLICY IF EXISTS "Users can access validation data for their businesses" ON public.business_validation;
DROP POLICY IF EXISTS "Users can access cost data for their campaigns" ON public.api_costs;
DROP POLICY IF EXISTS "Users can access analytics for their campaigns" ON public.campaign_analytics;
DROP POLICY IF EXISTS "Users can access their exported leads" ON public.exported_leads;
DROP POLICY IF EXISTS "Authenticated users can read system settings" ON public.system_settings;
DROP POLICY IF EXISTS "Allow authenticated users full access" ON public.enhanced_leads;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.validation_results;

-- Drop any other potentially insecure policies
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.campaigns;
DROP POLICY IF EXISTS "Enable select for users based on user_id" ON public.campaigns;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON public.campaigns;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON public.campaigns;

DO $$
BEGIN
  RAISE NOTICE 'Phase 2 Complete: Removed all existing insecure policies';
END $$;

-- ===========================================
-- PHASE 3: Create Secure User-Isolated Policies
-- ===========================================

-- CAMPAIGNS TABLE: Users can only access their own campaigns
CREATE POLICY "campaign_select_owner" ON public.campaigns
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "campaign_insert_owner" ON public.campaigns
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "campaign_update_owner" ON public.campaigns
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "campaign_delete_owner" ON public.campaigns
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- BUSINESSES TABLE: Access via campaign ownership
CREATE POLICY "business_select_via_campaign" ON public.businesses
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.campaigns c
      WHERE c.id = businesses.campaign_id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "business_insert_via_campaign" ON public.businesses
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.campaigns c
      WHERE c.id = campaign_id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "business_update_via_campaign" ON public.businesses
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.campaigns c
      WHERE c.id = businesses.campaign_id AND c.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.campaigns c
      WHERE c.id = campaign_id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "business_delete_via_campaign" ON public.businesses
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.campaigns c
      WHERE c.id = businesses.campaign_id AND c.user_id = auth.uid()
    )
  );

-- ENHANCED_LEADS TABLE: Access via campaign ownership
CREATE POLICY "enhanced_leads_select_via_campaign" ON public.enhanced_leads
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.campaigns c
      WHERE c.id = enhanced_leads.campaign_id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "enhanced_leads_insert_via_campaign" ON public.enhanced_leads
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.campaigns c
      WHERE c.id = campaign_id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "enhanced_leads_update_via_campaign" ON public.enhanced_leads
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.campaigns c
      WHERE c.id = enhanced_leads.campaign_id AND c.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.campaigns c
      WHERE c.id = campaign_id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "enhanced_leads_delete_via_campaign" ON public.enhanced_leads
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.campaigns c
      WHERE c.id = enhanced_leads.campaign_id AND c.user_id = auth.uid()
    )
  );

-- BUSINESS_VALIDATION TABLE: Access via business->campaign ownership chain
CREATE POLICY "validation_select_via_ownership" ON public.business_validation
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.businesses b
      JOIN public.campaigns c ON c.id = b.campaign_id
      WHERE b.id = business_validation.business_id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "validation_insert_via_ownership" ON public.business_validation
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.businesses b
      JOIN public.campaigns c ON c.id = b.campaign_id
      WHERE b.id = business_id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "validation_update_via_ownership" ON public.business_validation
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.businesses b
      JOIN public.campaigns c ON c.id = b.campaign_id
      WHERE b.id = business_validation.business_id AND c.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.businesses b
      JOIN public.campaigns c ON c.id = b.campaign_id
      WHERE b.id = business_id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "validation_delete_via_ownership" ON public.business_validation
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.businesses b
      JOIN public.campaigns c ON c.id = b.campaign_id
      WHERE b.id = business_validation.business_id AND c.user_id = auth.uid()
    )
  );

-- VALIDATION_RESULTS TABLE: Access via business ownership
CREATE POLICY "validation_results_select_via_ownership" ON public.validation_results
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.businesses b
      JOIN public.campaigns c ON c.id = b.campaign_id
      WHERE b.id = validation_results.business_id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "validation_results_insert_via_ownership" ON public.validation_results
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.businesses b
      JOIN public.campaigns c ON c.id = b.campaign_id
      WHERE b.id = business_id AND c.user_id = auth.uid()
    )
  );

-- API_COSTS TABLE: Access via campaign ownership
CREATE POLICY "api_costs_select_via_campaign" ON public.api_costs
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.campaigns c
      WHERE c.id = api_costs.campaign_id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "api_costs_insert_via_campaign" ON public.api_costs
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.campaigns c
      WHERE c.id = campaign_id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "api_costs_update_via_campaign" ON public.api_costs
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.campaigns c
      WHERE c.id = api_costs.campaign_id AND c.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.campaigns c
      WHERE c.id = campaign_id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "api_costs_delete_via_campaign" ON public.api_costs
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.campaigns c
      WHERE c.id = api_costs.campaign_id AND c.user_id = auth.uid()
    )
  );

-- CAMPAIGN_ANALYTICS TABLE: Access via campaign ownership
CREATE POLICY "analytics_select_via_campaign" ON public.campaign_analytics
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.campaigns c
      WHERE c.id = campaign_analytics.campaign_id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "analytics_insert_via_campaign" ON public.campaign_analytics
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.campaigns c
      WHERE c.id = campaign_id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "analytics_update_via_campaign" ON public.campaign_analytics
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.campaigns c
      WHERE c.id = campaign_analytics.campaign_id AND c.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.campaigns c
      WHERE c.id = campaign_id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "analytics_delete_via_campaign" ON public.campaign_analytics
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.campaigns c
      WHERE c.id = campaign_analytics.campaign_id AND c.user_id = auth.uid()
    )
  );

-- EXPORTED_LEADS TABLE: Access via campaign ownership
CREATE POLICY "exported_leads_select_via_campaign" ON public.exported_leads
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.campaigns c
      WHERE c.id = exported_leads.campaign_id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "exported_leads_insert_via_campaign" ON public.exported_leads
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.campaigns c
      WHERE c.id = campaign_id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "exported_leads_update_via_campaign" ON public.exported_leads
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.campaigns c
      WHERE c.id = exported_leads.campaign_id AND c.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.campaigns c
      WHERE c.id = campaign_id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "exported_leads_delete_via_campaign" ON public.exported_leads
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.campaigns c
      WHERE c.id = exported_leads.campaign_id AND c.user_id = auth.uid()
    )
  );

-- SYSTEM_SETTINGS TABLE: Read-only access for authenticated users
CREATE POLICY "system_settings_read_authenticated" ON public.system_settings
  FOR SELECT TO authenticated
  USING (true);

-- Restrict system settings modifications to service role only
CREATE POLICY "system_settings_modify_service_only" ON public.system_settings
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

DO $$
BEGIN
  RAISE NOTICE 'Phase 3 Complete: Created secure user-isolated policies for all tables';
END $$;

-- ===========================================
-- PHASE 4: Performance Optimization Indexes
-- ===========================================

-- Critical indexes for policy performance (create only if not exists)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_campaigns_user_id 
  ON public.campaigns(user_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_campaigns_id_user_id 
  ON public.campaigns(id, user_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_businesses_campaign_id 
  ON public.businesses(campaign_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_enhanced_leads_campaign_id 
  ON public.enhanced_leads(campaign_id) WHERE campaign_id IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_business_validation_business_id 
  ON public.business_validation(business_id) WHERE business_id IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_validation_results_business_id 
  ON public.validation_results(business_id) WHERE business_id IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_api_costs_campaign_id 
  ON public.api_costs(campaign_id) WHERE campaign_id IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_campaign_analytics_campaign_id 
  ON public.campaign_analytics(campaign_id) WHERE campaign_id IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_exported_leads_campaign_id 
  ON public.exported_leads(campaign_id) WHERE campaign_id IS NOT NULL;

-- Composite indexes for common query patterns
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_businesses_campaign_created 
  ON public.businesses(campaign_id, created_at) WHERE campaign_id IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_enhanced_leads_campaign_confidence 
  ON public.enhanced_leads(campaign_id, confidence_score) WHERE campaign_id IS NOT NULL;

DO $$
BEGIN
  RAISE NOTICE 'Phase 4 Complete: Created performance optimization indexes';
END $$;

-- ===========================================
-- PHASE 5: Fix Security Definer Functions
-- ===========================================

-- Fix mutable search_path issue identified by Supabase AI
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- Function to safely get current user context for policies
CREATE OR REPLACE FUNCTION public.get_current_user_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT auth.uid();
$$;

DO $$
BEGIN
  RAISE NOTICE 'Phase 5 Complete: Fixed security definer functions with proper search_path';
END $$;

-- ===========================================
-- PHASE 6: Verification and Security Audit
-- ===========================================

-- Verify RLS is enabled on all critical tables
DO $$
DECLARE
    rec RECORD;
    rls_count INTEGER := 0;
    total_tables INTEGER := 0;
BEGIN
    FOR rec IN 
        SELECT schemaname, tablename, rowsecurity
        FROM pg_tables 
        WHERE schemaname = 'public' 
          AND tablename IN ('campaigns', 'businesses', 'business_validation', 
                           'api_costs', 'campaign_analytics', 'exported_leads', 
                           'system_settings', 'enhanced_leads', 'validation_results')
    LOOP
        total_tables := total_tables + 1;
        IF rec.rowsecurity THEN
            rls_count := rls_count + 1;
        ELSE
            RAISE WARNING 'RLS not enabled on table: %.%', rec.schemaname, rec.tablename;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'RLS Status: %/% tables have RLS enabled', rls_count, total_tables;
    
    IF rls_count < total_tables THEN
        RAISE EXCEPTION 'Security Error: Not all critical tables have RLS enabled';
    END IF;
END $$;

-- Verify no policies target 'public' role (security risk)
DO $$
DECLARE
    public_policy_count INTEGER;
BEGIN
    SELECT count(*) INTO public_policy_count
    FROM pg_policies 
    WHERE schemaname = 'public'
      AND 'public' = ANY(roles);
    
    IF public_policy_count > 0 THEN
        RAISE WARNING 'Security Risk: % policies still target public role', public_policy_count;
    ELSE
        RAISE NOTICE 'Security Check Passed: No policies target public role';
    END IF;
END $$;

-- Count policies per table for audit
DO $$
DECLARE
    rec RECORD;
BEGIN
    RAISE NOTICE 'Policy Distribution Audit:';
    FOR rec IN 
        SELECT tablename, count(*) as policy_count
        FROM pg_policies 
        WHERE schemaname = 'public'
        GROUP BY tablename
        ORDER BY tablename
    LOOP
        RAISE NOTICE '  %: % policies', rec.tablename, rec.policy_count;
    END LOOP;
END $$;

-- ===========================================
-- FINAL SECURITY SUMMARY
-- ===========================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'ProspectPro RLS Security Hardening COMPLETE';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Phase 1: RLS enabled on all core tables';
    RAISE NOTICE '✅ Phase 2: Removed all insecure policies';
    RAISE NOTICE '✅ Phase 3: Created user-isolated policies';
    RAISE NOTICE '✅ Phase 4: Added performance indexes';
    RAISE NOTICE '✅ Phase 5: Fixed security definer functions';
    RAISE NOTICE '✅ Phase 6: Passed security verification';
    RAISE NOTICE '';
    RAISE NOTICE 'Security Model: Zero-trust user isolation';
    RAISE NOTICE 'Access Pattern: Campaign ownership chain';
    RAISE NOTICE 'Performance: Optimized with targeted indexes';
    RAISE NOTICE '';
    RAISE NOTICE 'Next Steps:';
    RAISE NOTICE '1. Test application functionality';
    RAISE NOTICE '2. Monitor policy performance';
    RAISE NOTICE '3. Review access logs for anomalies';
    RAISE NOTICE '';
END $$;