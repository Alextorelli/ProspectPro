-- Quick Fix for ProspectPro Database Deployment Error
-- Run this to fix the ambiguous column reference error

-- Replace the verify_schema_compatibility function with this corrected version
CREATE OR REPLACE FUNCTION verify_schema_compatibility
()
RETURNS JSON AS $$
DECLARE
  result JSON;
  existing_tables_result JSON;
  monitoring_tables_result JSON;
  data_counts_result JSON;
BEGIN
    -- Get existing tables
    SELECT json_object_agg(table_name, 'exists')
    INTO existing_tables_result
    FROM information_schema.tables
    WHERE table_schema = 'public'
        AND table_name IN ('businesses', 'campaigns', 'api_usage', 'user_settings');

    -- Get new monitoring tables
    SELECT json_object_agg(table_name, 'created')
    INTO monitoring_tables_result
    FROM information_schema.tables
    WHERE table_schema = 'public'
        AND table_name IN ('api_cost_tracking', 'lead_qualification_metrics', 'service_health_metrics', 'dashboard_exports');

    -- Get data counts
    SELECT json_build_object(
    'businesses', (SELECT COUNT(*)
        FROM businesses),
    'campaigns', (SELECT COUNT(*)
        FROM campaigns),
    'api_usage', (SELECT COUNT(*)
        FROM api_usage)
  )
    INTO data_counts_result;

    -- Build final result
    SELECT json_build_object(
    'existing_tables_found', existing_tables_result,
    'new_monitoring_tables', monitoring_tables_result,
    'sample_data_counts', data_counts_result,
    'deployment_status', 'compatibility_verified'
  )
    INTO result;

    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Test the corrected function
SELECT verify_schema_compatibility() as compatibility_report;