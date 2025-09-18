-- ProspectPro Post-Setup Validation Suite (Run in Supabase SQL Editor)

-- 1) Extensions
SELECT extname
FROM pg_extension
WHERE extname IN ('pgcrypto','uuid-ossp','postgis','pg_trgm')
ORDER BY extname;

-- 2) Domains
SELECT t.typname AS domain_name
FROM pg_type t
WHERE t.typtype='d' AND t.typname IN (
  'confidence_score_type','cost_amount_type','campaign_status_type','verification_status_type'
)
ORDER BY t.typname;

-- 3) Core tables
SELECT table_name
FROM information_schema.tables
WHERE table_schema='public' AND table_name IN (
  'campaigns','system_settings','service_health_metrics','enhanced_leads','lead_emails','lead_social_profiles'
)
ORDER BY table_name;

-- 4) Analytics tables
SELECT table_name
FROM information_schema.tables
WHERE table_schema='public' AND table_name IN (
  'campaign_analytics','api_cost_tracking','lead_qualification_metrics','dashboard_exports'
)
ORDER BY table_name;

-- 5) Geography column
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema='public' AND table_name='enhanced_leads' AND column_name='location_coordinates';

-- 6) Trigger-maintained date and index
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema='public' AND table_name='campaign_analytics' AND column_name IN ('timestamp','timestamp_date');

SELECT indexname, indexdef
FROM pg_indexes
WHERE schemaname='public' AND tablename='campaign_analytics' AND indexname='idx_campaign_analytics_dashboard';

-- 7) Functions
SELECT p.proname, p.oid::regprocedure AS signature, pg_get_function_result(p.oid) AS returns
FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname='public' AND p.proname IN (
  'calculate_lead_quality_score','update_lead_confidence_scores','get_campaign_analytics',
  'get_realtime_dashboard_metrics','leads_within_radius','search_leads_by_name',
  'update_campaign_statistics','refresh_analytics_views','archive_old_data'
)
ORDER BY p.proname;

-- 8) RLS enabled tables
SELECT c.relname AS table_name, c.relrowsecurity AS rls_enabled
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname='public' AND c.relname IN (
  'campaigns','enhanced_leads','lead_emails','lead_social_profiles','api_usage_log','system_settings',
  'service_health_metrics','campaign_analytics','api_cost_tracking','lead_qualification_metrics','dashboard_exports'
)
ORDER BY table_name;

-- 9) Policies
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies
WHERE schemaname='public'
ORDER BY tablename, policyname;

-- 10) Materialized view
SELECT matviewname
FROM pg_matviews
WHERE schemaname='public' AND matviewname='lead_analytics_summary';

-- 11) Functional smoke tests (replace placeholders)
-- Refresh MV (should return true)
SELECT refresh_analytics_views();

-- Geospatial search (positional args)
SELECT *
FROM leads_within_radius(37.7749, -122.4194, 10.0)
LIMIT
5;

-- Fuzzy search (cast NULL to UUID)
SELECT *
FROM search_leads_by_name('pizza', NULL
::uuid, 5);

-- Campaign analytics (provide a real campaign id)
-- SELECT get_campaign_analytics('<campaign_id>'::uuid);

-- 12) RLS simulation helpers (replace user ids)
-- SELECT set_config('request.jwt.claims', json_build_object('sub','<user_uuid>')::text, true);
-- SELECT set_config('request.jwt.claim.role','authenticated', true);
