-- Schema Validation Test Script
-- Run this in your Supabase SQL Editor to test compatibility

-- ============================================================================
-- TEST 1: Verify Existing Tables Structure
-- ============================================================================

SELECT 'TEST 1: Verifying existing tables...' as test_name;

-- Check if core tables exist with expected columns
SELECT
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name IN ('businesses', 'campaigns', 'api_usage', 'user_settings')
ORDER BY table_name, ordinal_position;

-- ============================================================================
-- TEST 2: Check Foreign Key Relationships
-- ============================================================================

SELECT 'TEST 2: Checking foreign key relationships...' as test_name;

-- Verify foreign key constraints point to correct tables
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS referenced_table,
    ccu.column_name AS referenced_column
FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name IN ('lead_emails', 'lead_social_profiles', 'businesses', 'api_usage')
ORDER BY tc.table_name;

-- ============================================================================
-- TEST 3: Sample Data Validation
-- ============================================================================

SELECT 'TEST 3: Sample data validation...' as test_name;

-- Check if tables have sample data and expected structure
    SELECT
        'businesses' as table_name,
        COUNT(*) as row_count,
        COUNT(DISTINCT campaign_id) as unique_campaigns,
        AVG(confidence_score) as avg_confidence,
        MAX(created_at) as latest_record
    FROM businesses
UNION ALL
    SELECT
        'campaigns' as table_name,
        COUNT(*) as row_count,
        COUNT(DISTINCT user_id) as unique_users,
        AVG(current_cost) as avg_cost,
        MAX(created_at) as latest_record
    FROM campaigns
UNION ALL
    SELECT
        'api_usage' as table_name,
        COUNT(*) as row_count,
        COUNT(DISTINCT service) as unique_services,
        AVG(cost) as avg_cost,
        MAX(created_at) as latest_record
    FROM api_usage;

-- ============================================================================
-- TEST 4: Test Compatible Functions (After schema deployment)
-- ============================================================================

-- This section should only be run AFTER deploying the revised schema

-- Uncomment and run after schema deployment:
/*
SELECT 'TEST 4: Testing compatible functions...' as test_name;

-- Test if new functions work with existing data
SELECT campaign_analytics_current(
  (SELECT id FROM campaigns LIMIT 1)
) as test_campaign_analytics;

-- Test real-time metrics function
SELECT get_dashboard_realtime_metrics_current() as test_realtime_metrics;

-- Test API service breakdown
SELECT * FROM get_api_service_breakdown_current(
  CURRENT_DATE - INTERVAL '7 days',
  CURRENT_DATE
) LIMIT 5;
*/

-- ============================================================================
-- TEST 5: Verify Schema Compatibility (After deployment)
-- ============================================================================

-- Uncomment and run after schema deployment:
/*
SELECT 'TEST 5: Final compatibility verification...' as test_name;

-- Run the comprehensive compatibility check
SELECT verify_schema_compatibility() as compatibility_report;
*/

-- ============================================================================
-- EXPECTED RESULTS GUIDE
-- ============================================================================

/*
EXPECTED TEST RESULTS:

TEST 1: Should show columns for:
- businesses: id, campaign_id, user_id, business_name, address, phone, website, etc.
- campaigns: id, user_id, name, business_type, location, status, etc.
- api_usage: id, user_id, campaign_id, service, cost, success, etc.

TEST 2: Should show foreign keys:
- businesses.campaign_id → campaigns.id
- businesses.user_id → auth.users.id
- api_usage.campaign_id → campaigns.id
- lead_emails.lead_id → businesses.id (after fix)

TEST 3: Should show actual counts of your data:
- businesses: Count of your leads
- campaigns: Count of your campaigns  
- api_usage: Count of your API calls

TEST 4 & 5: Only run after deploying revised schema
- Functions should execute without errors
- Compatibility report should show all tables exist

TROUBLESHOOTING:
- If tables are missing: Your database structure is different than expected
- If foreign keys are wrong: Need to run the schema fixes
- If no sample data: Normal for new installations
- If functions fail: Schema not deployed yet or deployment had errors
*/