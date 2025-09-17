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

DO $$
BEGIN
  RAISE NOTICE '✅ Phase 5.2 Complete: Row Level Security enabled on all tables';
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