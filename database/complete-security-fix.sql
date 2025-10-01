-- Complete security fix: Remove campaign_analytics VIEW and replace with simple VIEW
-- This fixes the SECURITY DEFINER detection on the existing view

-- STEP 1: Drop campaign_analytics view (this is what has SECURITY DEFINER)
DROP VIEW IF EXISTS public.campaign_analytics CASCADE;

-- STEP 2: Create simple campaign_analytics VIEW (no SECURITY DEFINER)
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