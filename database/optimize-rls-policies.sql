-- ProspectPro v4.2 - Optimized RLS Policies
-- Fixes Supabase performance warnings by caching auth.uid() calls
-- Consolidates duplicate permissive policies

-- ==========================================
-- 1. DROP DUPLICATE POLICIES
-- ==========================================

-- Drop old user-based policies (will be consolidated)
DROP POLICY IF EXISTS "Users can view their own campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Users can insert their own campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Users can update their own campaigns" ON public.campaigns;

DROP POLICY IF EXISTS "Users can view their own leads" ON public.leads;
DROP POLICY IF EXISTS "Users can insert their own leads" ON public.leads;

DROP POLICY IF EXISTS "Users can view their own exports" ON public.dashboard_exports;
DROP POLICY IF EXISTS "Users can insert their own exports" ON public.dashboard_exports;

-- Keep new API access policies but rename for clarity
ALTER POLICY "campaigns_new_api_access" ON public.campaigns RENAME TO "campaigns_unified_access";
ALTER POLICY "leads_new_api_access" ON public.leads RENAME TO "leads_unified_access";
ALTER POLICY "exports_new_api_access" ON public.dashboard_exports RENAME TO "exports_unified_access";

-- ==========================================
-- 2. CREATE OPTIMIZED POLICIES WITH CACHED auth.uid()
-- ==========================================

-- Campaigns table - Optimized policies with cached auth.uid()
CREATE POLICY "campaigns_select_optimized" ON public.campaigns
  FOR SELECT
  USING (
    user_id = (SELECT auth.uid()) OR 
    (session_user_id IS NOT NULL AND user_id IS NULL)
  );

CREATE POLICY "campaigns_insert_optimized" ON public.campaigns
  FOR INSERT
  WITH CHECK (
    user_id = (SELECT auth.uid()) OR 
    (session_user_id IS NOT NULL AND user_id IS NULL)
  );

CREATE POLICY "campaigns_update_optimized" ON public.campaigns
  FOR UPDATE
  USING (
    user_id = (SELECT auth.uid()) OR 
    (session_user_id IS NOT NULL AND user_id IS NULL)
  );

-- Leads table - Optimized policies with cached auth.uid()
CREATE POLICY "leads_select_optimized" ON public.leads
  FOR SELECT
  USING (
    user_id = (SELECT auth.uid()) OR 
    (session_user_id IS NOT NULL AND user_id IS NULL)
  );

CREATE POLICY "leads_insert_optimized" ON public.leads
  FOR INSERT
  WITH CHECK (
    user_id = (SELECT auth.uid()) OR 
    (session_user_id IS NOT NULL AND user_id IS NULL)
  );

-- Dashboard exports table - Optimized policies with cached auth.uid()
CREATE POLICY "exports_select_optimized" ON public.dashboard_exports
  FOR SELECT
  USING (
    user_id = (SELECT auth.uid()) OR 
    (session_user_id IS NOT NULL AND user_id IS NULL)
  );

CREATE POLICY "exports_insert_optimized" ON public.dashboard_exports
  FOR INSERT
  WITH CHECK (
    user_id = (SELECT auth.uid()) OR 
    (session_user_id IS NOT NULL AND user_id IS NULL)
  );

-- ==========================================
-- 3. ADD MISSING FOREIGN KEY INDEXES
-- ==========================================

-- Fix unindexed foreign keys for better query performance
CREATE INDEX IF NOT EXISTS idx_leads_campaign_id ON public.leads(campaign_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_exports_campaign_id ON public.dashboard_exports(campaign_id);

-- Composite indexes for user-aware queries
CREATE INDEX IF NOT EXISTS idx_campaigns_user_session ON public.campaigns(user_id, session_user_id);
CREATE INDEX IF NOT EXISTS idx_leads_user_session ON public.leads(user_id, session_user_id);
CREATE INDEX IF NOT EXISTS idx_exports_user_session ON public.dashboard_exports(user_id, session_user_id);

-- ==========================================
-- 4. DROP UNUSED INDEXES (IF TRULY UNUSED)
-- ==========================================

-- Note: Only drop if confirmed unused in production after testing
-- DROP INDEX IF EXISTS idx_campaigns_user_id;
-- DROP INDEX IF EXISTS idx_campaigns_session_user_id;
-- DROP INDEX IF EXISTS idx_leads_user_id;
-- DROP INDEX IF EXISTS idx_leads_session_user_id;
-- DROP INDEX IF EXISTS idx_dashboard_exports_user_id;

-- ==========================================
-- 5. VERIFY POLICY OPTIMIZATION
-- ==========================================

-- Check active policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('campaigns', 'leads', 'dashboard_exports')
ORDER BY tablename, cmd, policyname;

-- Check indexes
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('campaigns', 'leads', 'dashboard_exports')
ORDER BY tablename, indexname;

-- Performance notes:
-- 1. Using (SELECT auth.uid()) caches the user ID for the entire query
-- 2. Consolidated policies reduce policy evaluation overhead
-- 3. Foreign key indexes improve JOIN performance significantly
-- 4. Composite indexes optimize user-aware queries
