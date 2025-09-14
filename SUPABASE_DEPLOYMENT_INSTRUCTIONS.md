# Supabase Deployment Guide - ProspectPro Monitoring Enhancement

## Overview
This guide walks you through deploying the revised monitoring enhancement schema to your existing Supabase database. The schema is designed to work with your current `businesses`, `campaigns`, and `api_usage` tables without breaking changes.

## Pre-Deployment Checklist

### ✅ Safety First
1. **Backup Your Database**: Always backup before schema changes
2. **Test Environment**: Run on staging/test instance first if possible
3. **Low Traffic Window**: Deploy during low usage periods
4. **Have Rollback Plan**: Keep backup restoration steps ready

### ✅ Verify Current Database
Your database should contain these existing tables:
- `businesses` (main leads table)
- `campaigns` (campaign management)
- `api_usage` (API call tracking)
- `user_settings` (user preferences)

## Deployment Steps

### Step 1: Login to Supabase Dashboard
1. Go to [supabase.com](https://supabase.com)
2. Login and select your ProspectPro project
3. Navigate to **SQL Editor** (left sidebar)

### Step 2: Create New Query
1. Click **+ New Query**
2. Name it: "ProspectPro Monitoring Enhancement"

### Step 3: Run Deployment Script
Copy and paste the contents of `database/supabase-deployment-script.sql` into the query editor and run it section by section (not all at once).

**IMPORTANT**: Run each step separately and verify success before proceeding.

## Step-by-Step Execution

### Phase 1: Backup (Required)
Run the backup section first:
```sql
-- Create backup with timestamp
DO $$
DECLARE
    backup_schema_name TEXT := 'backup_' || TO_CHAR(NOW(), 'YYYY_MM_DD_HH24_MI');
BEGIN
    EXECUTE format('CREATE SCHEMA IF NOT EXISTS %I', backup_schema_name);
    -- Backup existing tables
    EXECUTE format('CREATE TABLE %I.businesses AS SELECT * FROM businesses', backup_schema_name);
    EXECUTE format('CREATE TABLE %I.campaigns AS SELECT * FROM campaigns', backup_schema_name);  
    EXECUTE format('CREATE TABLE %I.api_usage AS SELECT * FROM api_usage', backup_schema_name);
    RAISE NOTICE 'Backup created in schema: %', backup_schema_name;
END $$;
```

### Phase 2: Verify Database Structure
```sql
-- Check existing tables
SELECT 
  table_name,
  COUNT(*) as column_count
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name IN ('businesses', 'campaigns', 'api_usage', 'user_settings')
GROUP BY table_name
ORDER BY table_name;
```

### Phase 3: Add Monitoring Tables
Run the CREATE TABLE statements for:
- `api_cost_tracking`
- `lead_qualification_metrics`
- `service_health_metrics`
- `dashboard_exports`

### Phase 4: Fix Foreign Keys
Run the foreign key fix sections to update any broken references from `enhanced_leads` to `businesses`.

### Phase 5: Create Functions
Run each function creation statement separately:
- `calculate_cost_per_qualified_lead_current()`
- `get_dashboard_realtime_metrics_current()`
- `get_api_service_breakdown_current()`
- `campaign_analytics_current()`
- `verify_schema_compatibility()`

### Phase 6: Add Indexes
Run all the CREATE INDEX statements for performance optimization.

### Phase 7: Enable Security
Run the Row Level Security (RLS) configuration.

### Phase 8: Initialize Sample Data
Add sample service health data.

### Phase 9: Final Verification
Run the final compatibility check:
```sql
SELECT verify_schema_compatibility() as compatibility_report;
```

## Expected Results

After successful deployment, you should see:
- ✅ 4 new monitoring tables created
- ✅ 5 new functions added
- ✅ 11 performance indexes created
- ✅ 8 RLS policies configured
- ✅ All existing data preserved
- ✅ Foreign keys properly referenced

## Post-Deployment Testing

### Test 1: Verify Tables
```sql
-- Should return 4 new monitoring tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('api_cost_tracking', 'lead_qualification_metrics', 'service_health_metrics', 'dashboard_exports');
```

### Test 2: Test Functions
```sql
-- Should return real-time metrics
SELECT get_dashboard_realtime_metrics_current();
```

### Test 3: Check Data Integrity
```sql
-- Verify existing data is intact
SELECT 
  (SELECT COUNT(*) FROM businesses) as business_count,
  (SELECT COUNT(*) FROM campaigns) as campaign_count,
  (SELECT COUNT(*) FROM api_usage) as api_usage_count;
```

## Troubleshooting

### Common Issues

**Foreign Key Errors**: 
- Check if `lead_emails` or `lead_social_profiles` tables exist
- If not, skip the foreign key fix sections

**Permission Errors**:
- Ensure you're logged in as database owner
- Check if RLS policies are conflicting

**Function Creation Errors**:
- Run functions individually
- Check for naming conflicts with existing functions

### Rollback Procedure
If deployment fails:
```sql
-- Drop new tables
DROP TABLE IF EXISTS api_cost_tracking CASCADE;
DROP TABLE IF EXISTS lead_qualification_metrics CASCADE;
DROP TABLE IF EXISTS service_health_metrics CASCADE;
DROP TABLE IF EXISTS dashboard_exports CASCADE;

-- Drop new functions
DROP FUNCTION IF EXISTS calculate_cost_per_qualified_lead_current CASCADE;
DROP FUNCTION IF EXISTS get_dashboard_realtime_metrics_current CASCADE;
DROP FUNCTION IF EXISTS get_api_service_breakdown_current CASCADE;
DROP FUNCTION IF EXISTS campaign_analytics_current CASCADE;
DROP FUNCTION IF EXISTS verify_schema_compatibility CASCADE;

-- Restore from backup (replace with actual backup schema name)
-- DROP SCHEMA public CASCADE;
-- ALTER SCHEMA backup_2024_01_15_10_30 RENAME TO public;
```

## Next Steps After Deployment

1. **Configure Grafana**: Use the updated deployment guide
2. **Test API Endpoints**: Verify Railway app connects properly
3. **Monitor Performance**: Check query execution times
4. **Update Application**: Deploy updated frontend with monitoring controls

## Support

If you encounter issues:
1. Check Supabase logs in the Dashboard
2. Review error messages carefully
3. Test individual components separately
4. Use the rollback procedure if needed

The enhanced monitoring system will provide real-time insights into your lead generation campaigns while maintaining all existing functionality.