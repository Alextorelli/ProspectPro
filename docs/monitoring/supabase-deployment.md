# Supabase Database Deployment Guide

## Overview  
Deploy the ProspectPro monitoring enhancement to your existing Supabase database. This adds real-time analytics capabilities while preserving all existing data.

## Prerequisites
- ✅ Existing Supabase project with ProspectPro data
- ✅ Database access (postgres user credentials)
- ✅ Backup of current database (recommended)

## Deployment Files
- `sql/monitoring-schema.sql` - Main deployment script
- `sql/fix-verification-function.sql` - Verification queries
- `sql/sample-queries.sql` - Analytics query examples

## Step 1: Database Verification

### 1.1 Check Current Schema
Login to Supabase dashboard → SQL Editor and run:

```sql
-- Verify existing tables
SELECT table_name, COUNT(*) as column_count
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name IN ('businesses', 'campaigns', 'api_usage', 'user_settings')
GROUP BY table_name
ORDER BY table_name;
```

Expected results:
- `api_usage` - Your API call logs
- `businesses` - Your lead data  
- `campaigns` - Your campaign data
- `user_settings` - User configuration

### 1.2 Check Data Integrity
```sql
-- Verify data counts
SELECT 
  'businesses' as table_name, COUNT(*) as records FROM businesses
UNION ALL
SELECT 
  'campaigns' as table_name, COUNT(*) as records FROM campaigns  
UNION ALL
SELECT 
  'api_usage' as table_name, COUNT(*) as records FROM api_usage;
```

## Step 2: Deploy Monitoring Schema

### 2.1 Run Deployment Script
Copy the contents of `sql/monitoring-schema.sql` and run **section by section**:

#### Section 1: Verify Structure ✅
```sql
-- STEP 1: VERIFY EXISTING DATABASE STRUCTURE
SELECT 'VERIFICATION: Checking existing tables...' as status;
-- ... (rest of verification section)
```

#### Section 2: Add Monitoring Tables ✅  
```sql
-- STEP 2: ADD MONITORING TABLES
SELECT 'DEPLOYMENT: Adding monitoring tables...' as status;
-- ... (creates api_cost_tracking, lead_qualification_metrics, etc.)
```

#### Section 3: Create Indexes ✅
```sql
-- STEP 3: CREATE PERFORMANCE INDEXES  
SELECT 'DEPLOYMENT: Creating performance indexes...' as status;
-- ... (adds performance indexes)
```

#### Section 4: Configure Security ✅
```sql
-- STEP 4: CONFIGURE ROW LEVEL SECURITY
SELECT 'DEPLOYMENT: Configuring Row Level Security...' as status;  
-- ... (adds RLS policies)
```

#### Section 5: Sample Data ✅
```sql
-- STEP 5: INITIALIZE SAMPLE MONITORING DATA
SELECT 'DEPLOYMENT: Initializing sample monitoring data...' as status;
-- ... (adds sample service health data)
```

#### Section 6: Final Verification ✅
```sql
-- STEP 6: FINAL VERIFICATION
SELECT 'VERIFICATION: Running final compatibility check...' as status;
-- ... (verification query)
```

## Step 3: Verify Deployment Success

### 3.1 Run Verification Query
Use the query from `sql/fix-verification-function.sql`:

```sql
SELECT 
  'deployment_complete' as test_type,
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
        'businesses', (SELECT COUNT(*) FROM businesses),
        'campaigns', (SELECT COUNT(*) FROM campaigns),
        'api_usage', (SELECT COUNT(*) FROM api_usage)
      )
    )
  ) as deployment_status;
```

### 3.2 Expected Results
```json
{
  "test_type": "deployment_complete",
  "deployment_status": {
    "existing_tables": {
      "businesses": "exists",
      "campaigns": "exists", 
      "api_usage": "exists",
      "user_settings": "exists"
    },
    "monitoring_tables": {
      "api_cost_tracking": "created",
      "lead_qualification_metrics": "created",
      "service_health_metrics": "created", 
      "dashboard_exports": "created"
    },
    "data_counts": {
      "businesses": 156,    // Your actual counts
      "campaigns": 8,       // Will vary
      "api_usage": 2847     // Based on your data
    }
  }
}
```

## Step 4: Test Monitoring Functionality

### 4.1 Test Service Health Tracking
```sql
-- Insert test service health data
INSERT INTO service_health_metrics (service_name, status, response_time_ms, error_rate)
VALUES ('test_service', 'healthy', 150, 0.01);

-- Verify insertion
SELECT * FROM service_health_metrics WHERE service_name = 'test_service';
```

### 4.2 Test Analytics Queries
Run sample queries from `sql/sample-queries.sql` to verify data flows correctly.

## Step 5: Configure Row Level Security

### 5.1 Verify RLS Policies
```sql
-- Check RLS policies were created
SELECT schemaname, tablename, policyname, cmd, roles 
FROM pg_policies 
WHERE tablename IN ('api_cost_tracking', 'lead_qualification_metrics', 'service_health_metrics', 'dashboard_exports');
```

### 5.2 Test User Access
Ensure monitoring tables respect user permissions and only show data for authenticated users.

## Troubleshooting

### Common Issues

#### Issue: "Table already exists"
**Solution**: Some tables might already exist. Add `IF NOT EXISTS` or drop existing tables first.

#### Issue: "Permission denied"  
**Solution**: Ensure you're logged in as database owner in Supabase dashboard.

#### Issue: "Foreign key violation"
**Solution**: Check that referenced tables (campaigns, businesses) exist and have data.

#### Issue: "RLS policy conflicts"
**Solution**: Drop existing policies first, then recreate with deployment script.

### Recovery Steps
If deployment fails:
1. **Check Supabase logs** in dashboard
2. **Run verification query** to see current state  
3. **Drop new tables** if needed: `DROP TABLE IF EXISTS monitoring_table_name CASCADE;`
4. **Restore from backup** if necessary

### Safe Deployment Tips
1. **Deploy during low usage** periods
2. **Run sections individually** - don't paste entire script at once
3. **Verify each section** before proceeding to next
4. **Monitor for errors** in Supabase dashboard logs
5. **Test immediately** after deployment

## Next Steps
1. [Set up Grafana dashboards](grafana-setup.md)  
2. [Configure monitoring queries](monitoring-queries.md)
3. [Update Railway app](railway-integration.md)

Your ProspectPro database now has enterprise-level monitoring capabilities! 🚀