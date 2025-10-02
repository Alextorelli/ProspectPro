-- Supabase Security Fix: Remove SECURITY DEFINER inheritance
-- Following recommended pattern: Normal view + RLS-protected base tables

-- STEP 1: Drop the problematic view completely
DROP VIEW IF EXISTS public.campaign_analytics CASCADE;

-- STEP 2: Ensure base tables have proper RLS and permissions (not SECURITY DEFINER)
-- Remove any SECURITY DEFINER policies if they exist
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Drop existing policies that might have SECURITY DEFINER behavior
DROP POLICY IF EXISTS "campaign_analytics_campaign_access" ON public.campaigns;
DROP POLICY IF EXISTS "Allow anon access to campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Allow anon access to leads" ON public.leads;

-- Create simple, non-SECURITY DEFINER policies
CREATE POLICY "public_campaigns_access" ON public.campaigns
    FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "public_leads_access" ON public.leads
    FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- STEP 3: Grant explicit permissions (no SECURITY DEFINER)
GRANT SELECT ON public.campaigns TO anon, authenticated;
GRANT SELECT ON public.leads TO anon, authenticated;

-- STEP 4: Create a completely normal view (SECURITY INVOKER by default)
CREATE VIEW public.campaign_analytics 
WITH (security_invoker = true)
AS
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

-- STEP 5: Grant explicit SELECT on the view (no inheritance)
GRANT SELECT ON public.campaign_analytics TO anon, authenticated;