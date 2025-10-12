-- ProspectPro v4.2 - Optimized RLS Policies (Updated October 2025)
-- Removes duplicate permissive policies and standardizes auth.uid() usage

BEGIN;

-- ==========================================
-- 1. DROP LEGACY/PERMISSIVE POLICIES
-- ==========================================

-- Campaigns
DROP POLICY IF EXISTS "campaigns_select_optimized" ON public.campaigns;
DROP POLICY IF EXISTS "campaigns_insert_optimized" ON public.campaigns;
DROP POLICY IF EXISTS "campaigns_update_optimized" ON public.campaigns;
DROP POLICY IF EXISTS "campaigns_unified_access" ON public.campaigns;
DROP POLICY IF EXISTS "campaigns_new_api_access" ON public.campaigns;
DROP POLICY IF EXISTS "campaigns_anon_access" ON public.campaigns;
DROP POLICY IF EXISTS "campaigns_anon_create" ON public.campaigns;
DROP POLICY IF EXISTS "Users can view own campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Users can create campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Users can update own campaigns" ON public.campaigns;

-- Leads
DROP POLICY IF EXISTS "leads_select_optimized" ON public.leads;
DROP POLICY IF EXISTS "leads_insert_optimized" ON public.leads;
DROP POLICY IF EXISTS "leads_unified_access" ON public.leads;
DROP POLICY IF EXISTS "leads_new_api_access" ON public.leads;
DROP POLICY IF EXISTS "leads_anon_access" ON public.leads;
DROP POLICY IF EXISTS "leads_user_access" ON public.leads;
DROP POLICY IF EXISTS "Users can view leads from own campaigns" ON public.leads;

-- Dashboard exports
DROP POLICY IF EXISTS "exports_select_optimized" ON public.dashboard_exports;
DROP POLICY IF EXISTS "exports_insert_optimized" ON public.dashboard_exports;
DROP POLICY IF EXISTS "exports_unified_access" ON public.dashboard_exports;
DROP POLICY IF EXISTS "exports_new_api_access" ON public.dashboard_exports;
DROP POLICY IF EXISTS "exports_anon_access" ON public.dashboard_exports;
DROP POLICY IF EXISTS "exports_user_access" ON public.dashboard_exports;

-- Canonical policies (will be recreated with optimized definitions)
DROP POLICY IF EXISTS "campaigns_user_access" ON public.campaigns;
DROP POLICY IF EXISTS "Users can view their own campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Users can insert their own campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Users can update their own campaigns" ON public.campaigns;

DROP POLICY IF EXISTS "Users can view their own leads" ON public.leads;
DROP POLICY IF EXISTS "Users can insert their own leads" ON public.leads;

DROP POLICY IF EXISTS "Users can view their own exports" ON public.dashboard_exports;
DROP POLICY IF EXISTS "Users can insert their own exports" ON public.dashboard_exports;
DROP POLICY IF EXISTS "dashboard_exports_user_access" ON public.dashboard_exports;

-- ==========================================
-- 2. REBUILD CANONICAL POLICIES
-- ==========================================

-- Campaigns (user owned)
CREATE POLICY "campaigns_user_access" ON public.campaigns
  FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can view their own campaigns" ON public.campaigns
  FOR SELECT TO authenticated
  USING (
    user_id = (SELECT auth.uid()) OR
    (auth.uid() IS NULL AND session_user_id IS NOT NULL)
  );

CREATE POLICY "Users can insert their own campaigns" ON public.campaigns
  FOR INSERT TO authenticated
  WITH CHECK (
    ((SELECT auth.uid()) IS NOT NULL AND user_id = (SELECT auth.uid())) OR
    (auth.uid() IS NULL AND session_user_id IS NOT NULL)
  );

CREATE POLICY "Users can update their own campaigns" ON public.campaigns
  FOR UPDATE TO authenticated
  USING (
    user_id = (SELECT auth.uid()) OR
    (auth.uid() IS NULL AND session_user_id IS NOT NULL)
  )
  WITH CHECK (
    user_id = (SELECT auth.uid()) OR
    (auth.uid() IS NULL AND session_user_id IS NOT NULL)
  );

-- Leads (campaign-linked)
CREATE POLICY "Users can view their own leads" ON public.leads
  FOR SELECT TO authenticated
  USING (
    user_id = (SELECT auth.uid()) OR
    (auth.uid() IS NULL AND session_user_id IS NOT NULL) OR
    campaign_id IN (
      SELECT id
      FROM public.campaigns
      WHERE user_id = (SELECT auth.uid()) OR
            (auth.uid() IS NULL AND session_user_id IS NOT NULL)
    )
  );

CREATE POLICY "Users can insert their own leads" ON public.leads
  FOR INSERT TO authenticated
  WITH CHECK (
    ((SELECT auth.uid()) IS NOT NULL AND user_id = (SELECT auth.uid())) OR
    (auth.uid() IS NULL AND session_user_id IS NOT NULL) OR
    campaign_id IN (
      SELECT id
      FROM public.campaigns
      WHERE user_id = (SELECT auth.uid()) OR
            (auth.uid() IS NULL AND session_user_id IS NOT NULL)
    )
  );

-- Dashboard exports (user owned)
CREATE POLICY "dashboard_exports_user_access" ON public.dashboard_exports
  FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can view their own exports" ON public.dashboard_exports
  FOR SELECT TO authenticated
  USING (
    user_id = (SELECT auth.uid()) OR
    (auth.uid() IS NULL AND session_user_id IS NOT NULL) OR
    campaign_id IN (
      SELECT id
      FROM public.campaigns
      WHERE user_id = (SELECT auth.uid()) OR
            (auth.uid() IS NULL AND session_user_id IS NOT NULL)
    )
  );

CREATE POLICY "Users can insert their own exports" ON public.dashboard_exports
  FOR INSERT TO authenticated
  WITH CHECK (
    ((SELECT auth.uid()) IS NOT NULL AND user_id = (SELECT auth.uid())) OR
    (auth.uid() IS NULL AND session_user_id IS NOT NULL)
  );

COMMIT;

-- ==========================================
-- 3. INDEX OPTIMIZATIONS (UNCHANGED)
-- ==========================================

-- Fix unindexed foreign keys for better query performance
CREATE INDEX IF NOT EXISTS idx_leads_campaign_id ON public.leads(campaign_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_exports_campaign_id ON public.dashboard_exports(campaign_id);

-- Composite indexes for user-aware queries
CREATE INDEX IF NOT EXISTS idx_campaigns_user_session ON public.campaigns(user_id, session_user_id);
CREATE INDEX IF NOT EXISTS idx_leads_user_session ON public.leads(user_id, session_user_id);
CREATE INDEX IF NOT EXISTS idx_exports_user_session ON public.dashboard_exports(user_id, session_user_id);

-- ==========================================
-- 4. VERIFICATION QUERIES
-- ==========================================

SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('campaigns', 'leads', 'dashboard_exports')
ORDER BY tablename, cmd, policyname;
