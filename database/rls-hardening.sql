-- ProspectPro RLS Hardening Script (apply manually in Supabase SQL editor)
-- Non-destructive: enables RLS where required and adjusts policies to authenticated role.
-- REVIEW BEFORE APPLYING in production.

-- 1. Ensure RLS enabled on all core tables (idempotent)
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_validation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exported_leads ENABLE ROW LEVEL SECURITY;

-- 2. Drop overly permissive public policies (examples; adjust names if different)
DROP POLICY IF EXISTS "Users can manage their own campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Authenticated users can read system settings" ON public.system_settings;

-- 3. Re-create scoped policies (example user-based model)
-- NOTE: Replace user_id with actual FK column if present; if not, adapt to campaign ownership model.

-- System settings: read-only to authenticated users
CREATE POLICY "system_settings_select" ON public.system_settings
  FOR SELECT TO authenticated USING ((SELECT auth.uid()) IS NOT NULL);

-- Campaigns: owner-only full access (assumes a user_id column exists; if not, skip WITH CHECK until added)
-- IF campaigns lacks user_id, you must first add it or implement tenant scoping.
-- CREATE POLICY "campaigns_owner_all" ON public.campaigns FOR ALL TO authenticated
--   USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Businesses: link through campaign ownership (example; requires campaigns.user_id)
-- CREATE POLICY "businesses_owner_select" ON public.businesses FOR SELECT TO authenticated
--   USING (EXISTS (SELECT 1 FROM public.campaigns c WHERE c.id = campaign_id AND c.user_id = auth.uid()));

-- Validation data: read only if owning campaign (example)
-- CREATE POLICY "business_validation_owner_select" ON public.business_validation FOR SELECT TO authenticated
--   USING (EXISTS (SELECT 1 FROM public.businesses b JOIN public.campaigns c ON c.id = b.campaign_id AND b.id = business_id WHERE c.user_id = auth.uid()));

-- 4. (Optional) Deny everything else implicitly (RLS defaults). Insert/update policies can be added later.

-- 5. Harden SECURITY DEFINER functions (example placeholders)
-- ALTER FUNCTION public.set_updated_at() SECURITY DEFINER SET search_path = '';  -- Provide explicit search_path
-- REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM anon;  -- Limit exposure

-- 6. Verification queries
-- List policies
--   SELECT tablename, policyname, permissive, roles, cmd FROM pg_policies WHERE schemaname='public';
-- Check RLS enabled
--   SELECT relname, relrowsecurity FROM pg_class WHERE relnamespace = 'public'::regnamespace;

-- 7. Rollback (manual) example:
--   DROP POLICY IF EXISTS system_settings_select ON public.system_settings;
