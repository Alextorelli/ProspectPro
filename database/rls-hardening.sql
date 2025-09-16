-- ProspectPro RLS Hardening Script
-- SAFE: Review before executing in production.
-- Focus: Remove overly-permissive public policies, enable RLS where missing,
-- and scope access to authenticated role only.

-- 1. system_settings: ensure RLS enabled & proper select policy
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can read system settings" ON public.system_settings;
CREATE POLICY "Authenticated users can read system settings" ON public.system_settings
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL);

-- 2. Campaigns: restrict to owner (assumes a user_id column may be added; fallback deny)
-- If campaigns table lacks user_id, this policy is skipped intentionally.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='campaigns' AND column_name='user_id'
  ) THEN
    ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Users manage own campaigns" ON public.campaigns;
    CREATE POLICY "Users manage own campaigns" ON public.campaigns
      FOR ALL TO authenticated
      USING ((SELECT auth.uid()) = user_id)
      WITH CHECK ((SELECT auth.uid()) = user_id);
  END IF;
END$$;

-- 3. Read-only public metadata (IF intentionally public) example (commented out)
-- CREATE POLICY "Public read campaign names" ON public.campaigns
--   FOR SELECT TO anon USING (true);

-- 4. Businesses / validation chain: restrict to campaigns user owns (if campaign linkage exists)
-- NOTE: This assumes a chain via campaign_id -> campaigns(user_id)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='businesses' AND column_name='campaign_id'
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='campaigns' AND column_name='user_id')
  ) THEN
    ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Access businesses via campaign ownership" ON public.businesses;
    CREATE POLICY "Access businesses via campaign ownership" ON public.businesses
      FOR SELECT TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.campaigns c
          WHERE c.id = businesses.campaign_id AND (SELECT auth.uid()) = c.user_id
        )
      );
  END IF;
END$$;

-- 5. Helper policies for analytics tables (restrict by campaign ownership)
-- Repeat pattern as needed; adjust once user ownership model finalized.

-- 6. (Optional) Disable all policies granted TO public unintentionally
-- Lists current public policies (for operator inspection):
-- SELECT schemaname, tablename, policyname, roles FROM pg_policies WHERE roles @> ARRAY['public'];

-- 7. SECURITY DEFINER function hardening (replace search_path)
-- Example template (uncomment and adapt actual function bodies):
-- CREATE OR REPLACE FUNCTION public.set_updated_at()
-- RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
-- AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- 8. REVOKE execute from anon on sensitive functions (if any):
-- REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM anon;

-- 9. Index recommendations (create as needed):
-- CREATE INDEX IF NOT EXISTS idx_campaigns_user_id ON public.campaigns(user_id);
-- CREATE INDEX IF NOT EXISTS idx_businesses_campaign_id ON public.businesses(campaign_id);

-- End of hardening script
