-- 2025-10-01: Resolve Supabase security lint errors
-- - Removes SECURITY DEFINER exposure on campaign_analytics view
-- - Pins search_path for update_updated_at_column trigger function
-- - Recreates triggers using the hardened function

BEGIN;

-- Drop and recreate campaign_analytics without SECURITY DEFINER behaviour
DROP VIEW IF EXISTS public.campaign_analytics;

CREATE VIEW public.campaign_analytics AS
SELECT
  c.id,
  c.business_type,
  c.location,
  c.verification_level,
  c.target_count,
  c.results_count,
  c.total_cost,
  c.created_at,
  COUNT(l.id) AS actual_leads,
  COALESCE(AVG(l.confidence_score), 0)::numeric(10,2) AS avg_confidence,
  COUNT(*) FILTER (WHERE l.apollo_verified IS TRUE) AS apollo_verified_count,
  COUNT(*) FILTER (WHERE l.chamber_verified IS TRUE) AS chamber_verified_count,
  COUNT(*) FILTER (WHERE l.license_verified IS TRUE) AS license_verified_count
FROM public.campaigns c
LEFT JOIN public.leads l ON l.campaign_id = c.id
GROUP BY
  c.id,
  c.business_type,
  c.location,
  c.verification_level,
  c.target_count,
  c.results_count,
  c.total_cost,
  c.created_at;

-- Replace the timestamp trigger helper with a stable search_path
DROP FUNCTION IF EXISTS public.update_updated_at_column();

CREATE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Recreate triggers to ensure they bind to the refreshed function
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

COMMIT;
