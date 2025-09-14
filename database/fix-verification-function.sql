-- Quick Fix for ProspectPro Database Deployment Error
-- Run this to fix the ambiguous column reference error

-- Simple verification without complex functions - Run this instead
SELECT
    'deployment_check' as test_type,
    json_build_object(
    'existing_tables', (
      SELECT json_object_agg(table_name, 'exists')
    FROM information_schema.tables
    WHERE table_schema = 'public'
        AND table_name IN ('businesses', 'campaigns', 'api_usage', 'user_settings')
    ),
    'monitoring_tables', (
      SELECT json_object_agg(table_name, 'created')
    FROM information_schema.tables
    WHERE table_schema = 'public'
        AND table_name IN ('api_cost_tracking', 'lead_qualification_metrics', 'service_health_metrics', 'dashboard_exports')
    ),
    'data_counts', (
      SELECT json_build_object(
        'businesses', (SELECT COUNT(*)
        FROM businesses),
        'campaigns', (SELECT COUNT(*)
        FROM campaigns),
        'api_usage', (SELECT COUNT(*)
        FROM api_usage)
      )
    )
  ) as deployment_status;

-- Alternative: Check tables individually if the above fails
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;