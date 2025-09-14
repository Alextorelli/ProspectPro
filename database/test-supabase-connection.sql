-- ============================================================================
-- ProspectPro Database - Simple Connectivity Test
-- Run this first to verify your database connection and structure
-- ============================================================================

-- Test 1: Basic connectivity and current database info
SELECT
    current_database() as database_name,
    current_user
as current_user,
  version
() as postgres_version,
  now
() as current_timestamp;

-- Test 2: Check existing table structure
SELECT
    schemaname,
    tablename,
    tableowner
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Test 3: Count existing data
    SELECT
        'businesses' as table_name,
        COUNT(*) as record_count
    FROM businesses
UNION ALL
    SELECT
        'campaigns' as table_name,
        COUNT(*) as record_count
    FROM campaigns
UNION ALL
    SELECT
        'api_usage' as table_name,
        COUNT(*) as record_count
    FROM api_usage;

-- Test 4: Check for monitoring tables (will show empty if not deployed yet)
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
    AND table_name IN (
    'api_cost_tracking', 
    'lead_qualification_metrics', 
    'service_health_metrics', 
    'dashboard_exports'
  );

-- Test 5: Simple business data sample (if any exists)
SELECT
    id,
    business_name,
    campaign_id,
    is_qualified,
    confidence_score,
    created_at
FROM businesses
LIMIT
5;

-- Test 6: Campaign summary
SELECT
    id,
    name,
    status,
    current_cost,
    results,
    created_at
FROM campaigns
ORDER BY created_at DESC
LIMIT 5;