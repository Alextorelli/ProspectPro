-- Step-by-step security fixes - Run each block separately in Supabase SQL editor

-- STEP 1: Drop the problematic view
DROP VIEW IF EXISTS public.campaign_analytics;

-- STEP 2: Drop existing triggers first
DROP TRIGGER IF EXISTS update_campaigns_updated_at ON public.campaigns;

-- STEP 3: Drop the other trigger
DROP TRIGGER IF EXISTS update_leads_updated_at ON public.leads;

-- STEP 4: Drop the function (now that triggers are gone)
DROP FUNCTION IF EXISTS public.update_updated_at_column();

-- STEP 5: Create the secure function with fixed search_path
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

-- STEP 6: Recreate campaigns trigger
CREATE TRIGGER update_campaigns_updated_at
BEFORE UPDATE ON public.campaigns
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- STEP 7: Recreate leads trigger
CREATE TRIGGER update_leads_updated_at
BEFORE UPDATE ON public.leads
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- STEP 8: Create the secure view (without SECURITY DEFINER)
CREATE VIEW public.campaign_analytics AS
SELECT
  c.id,
  c.business_type,
  c.location,
  c.target_count,
  c.min_confidence_score,
  c.status,
  c.results_count,
  c.total_cost,
  c.budget_limit,
  c.processing_time_ms,
  c.created_at,
  COUNT(l.id) AS actual_leads,
  COALESCE(AVG(l.confidence_score), 0)::numeric(10,2) AS avg_confidence,
  COALESCE(SUM(l.validation_cost), 0)::numeric(12,4) AS total_validation_cost,
  COUNT(*) FILTER (WHERE l.cost_efficient IS TRUE) AS cost_efficient_leads
FROM public.campaigns c
LEFT JOIN public.leads l ON l.campaign_id = c.id
GROUP BY
  c.id,
  c.business_type,
  c.location,
  c.target_count,
  c.min_confidence_score,
  c.status,
  c.results_count,
  c.total_cost,
  c.budget_limit,
  c.processing_time_ms,
  c.created_at;