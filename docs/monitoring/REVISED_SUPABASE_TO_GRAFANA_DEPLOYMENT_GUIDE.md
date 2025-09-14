# ProspectPro Supabase to Grafana Deployment Guide - REVISED COMPATIBLE VERSION

⚠️ **CRITICAL**: This guide has been updated to work with your existing database structure without breaking current functionality.

## Overview

This guide provides step-by-step instructions for:
1. **Database Enhancement**: Adding monitoring tables to existing Supabase database
2. **Grafana Cloud Setup**: Connecting to professional dashboards  
3. **Dashboard Creation**: Building monitoring panels for campaign analytics
4. **Railway Integration**: Production deployment with monitoring
5. **Troubleshooting**: Common issues and solutions

---

## Part 1: Database Enhancement Deployment

### Step 1: Backup Your Existing Database

**CRITICAL**: Always backup before making schema changes.

1. **Access Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your ProspectPro project
   - Open SQL Editor

2. **Create Backup**
   ```sql
   -- Create backup schema with current date
   CREATE SCHEMA IF NOT EXISTS backup_20250914;
   CREATE TABLE backup_20250914.businesses AS SELECT * FROM businesses;
   CREATE TABLE backup_20250914.campaigns AS SELECT * FROM campaigns;
   CREATE TABLE backup_20250914.api_usage AS SELECT * FROM api_usage;
   CREATE TABLE backup_20250914.user_settings AS SELECT * FROM user_settings;
   ```

### Step 2: Deploy Revised Compatible Schema

1. **Open Schema File**
   - Navigate to `database/revised-compatible-schema.sql` 
   - Copy the entire contents

2. **Execute in Supabase**
   - Paste into Supabase SQL Editor
   - Click "Run" to execute
   - Wait for completion (2-3 minutes)

3. **Verify Deployment Success**
   ```sql
   -- Run verification query
   SELECT verify_schema_compatibility();
   ```

   **Expected Result**:
   ```json
   {
     "existing_tables_found": {
       "businesses": "exists",
       "campaigns": "exists", 
       "api_usage": "exists",
       "user_settings": "exists"
     },
     "new_monitoring_tables": {
       "api_cost_tracking": "created",
       "lead_qualification_metrics": "created",
       "service_health_metrics": "created", 
       "dashboard_exports": "created"
     }
   }
   ```

### Step 3: Initialize Monitoring Data

```sql
-- Insert initial service health data
INSERT INTO service_health_metrics (service_name, status, response_time_ms, error_rate)
VALUES 
  ('google_places', 'healthy', 150, 0.01),
  ('hunter_io', 'healthy', 200, 0.02),
  ('scrapingdog', 'healthy', 300, 0.01),
  ('neverbounce', 'healthy', 250, 0.00);
```

---

## Part 2: Grafana Cloud Setup

### Step 1: Create Grafana Cloud Account

1. **Sign up**: https://grafana.com/auth/sign-up/create-user
2. **Choose plan**: Free tier (10,000 series metrics, 14-day retention)
3. **Record details**:
   - **Grafana URL**: `https://[your-stack-name].grafana.net`
   - **Username**: Your email address

### Step 2: Configure PostgreSQL Data Source

1. **Add Data Source**:
   - Configuration > Data Sources > Add data source > PostgreSQL

2. **Connection Settings**:
   ```yaml
   Name: ProspectPro-Database
   Host: db.[your-project-ref].supabase.co:5432
   Database: postgres
   User: postgres
   Password: [your-database-password]
   SSL Mode: require
   Version: 13+
   ```

3. **Test Connection**:
   - Click "Save & Test"
   - Should show: "Database Connection OK"

### Step 3: Create API Token

1. **Service Account**:
   - Administration > Service Accounts > Add service account
   - Name: `ProspectPro-Dashboard`
   - Role: `Viewer`

2. **Generate Token**:
   - Click service account > Add token
   - Name: `Dashboard-API-Token`
   - **Save the token** for environment variables

---

## Part 3: Dashboard Creation - Updated Queries

### Dashboard Panel 1: Campaign Performance (Updated)

```sql
-- Campaign Overview using existing campaigns table
SELECT 
  c.name as "Campaign Name",
  c.status as "Status",
  (c.results->>'discovered')::int as "Leads Discovered",
  (c.results->>'qualified')::int as "Qualified Leads", 
  c.current_cost as "Total Cost",
  CASE 
    WHEN (c.results->>'discovered')::int > 0 
    THEN ROUND((c.results->>'qualified')::int::numeric / (c.results->>'discovered')::int * 100, 1)
    ELSE 0 
  END as "Qualification Rate %",
  c.created_at as "Created"
FROM campaigns c
WHERE c.created_at >= $__timeFrom()
  AND c.created_at <= $__timeTo()
ORDER BY c.created_at DESC;
```

### Dashboard Panel 2: API Cost Analysis (Updated)

```sql
-- API costs using existing api_usage table
SELECT 
  au.service as "API Service",
  DATE(au.created_at) as "Date",
  SUM(au.cost) as "Daily Cost ($)",
  COUNT(*) as "Requests",
  AVG(au.response_time) as "Avg Response Time (ms)",
  (COUNT(*) FILTER (WHERE au.success = true))::float / COUNT(*) * 100 as "Success Rate %"
FROM api_usage au
WHERE au.created_at >= $__timeFrom()
  AND au.created_at <= $__timeTo()
GROUP BY au.service, DATE(au.created_at)
ORDER BY "Date" DESC, "Daily Cost ($)" DESC;
```

### Dashboard Panel 3: Lead Quality Distribution (Updated)

```sql  
-- Lead quality using existing businesses table
SELECT 
  c.name as "Campaign",
  COUNT(b.id) as "Total Leads",
  COUNT(b.id) FILTER (WHERE b.confidence_score >= 90) as "A Grade (90+%)",
  COUNT(b.id) FILTER (WHERE b.confidence_score >= 80 AND b.confidence_score < 90) as "B Grade (80-89%)",
  COUNT(b.id) FILTER (WHERE b.confidence_score >= 70 AND b.confidence_score < 80) as "C Grade (70-79%)",
  COUNT(b.id) FILTER (WHERE b.confidence_score < 70) as "Below Threshold",
  ROUND(AVG(b.confidence_score), 1) as "Avg Confidence",
  DATE(b.created_at) as "Date"
FROM campaigns c
LEFT JOIN businesses b ON c.id = b.campaign_id  
WHERE b.created_at >= $__timeFrom()
  AND b.created_at <= $__timeTo()
GROUP BY c.name, DATE(b.created_at)
ORDER BY "Date" DESC;
```

### Dashboard Panel 4: Cost Efficiency (Updated)

```sql
-- Cost per qualified lead using existing structure
SELECT 
  c.name as "Campaign",
  c.current_cost as "Total Cost ($)",
  (c.results->>'qualified')::int as "Qualified Leads",
  CASE 
    WHEN (c.results->>'qualified')::int > 0 
    THEN ROUND(c.current_cost / (c.results->>'qualified')::int, 2)
    ELSE 0 
  END as "Cost Per Qualified Lead ($)",
  CASE
    WHEN c.current_cost > 0
    THEN ROUND((c.results->>'qualified')::int * 10.0 / c.current_cost * 100, 1)  
    ELSE 0
  END as "ROI Score",
  c.created_at::date as "Date"
FROM campaigns c
WHERE c.created_at >= $__timeFrom()
  AND c.created_at <= $__timeTo()
  AND c.status IN ('active', 'completed')
  AND (c.results->>'qualified')::int > 0
ORDER BY "Cost Per Qualified Lead ($)" ASC;
```

### Dashboard Panel 5: Service Health (New Monitoring)

```sql
-- Service health from new monitoring table
SELECT 
  shm.service_name as "Service",
  shm.status as "Status",
  shm.response_time_ms as "Response Time (ms)",
  ROUND(shm.error_rate * 100, 2) as "Error Rate %",
  shm.requests_today as "Requests Today",
  ROUND(shm.cost_today, 2) as "Cost Today ($)",
  shm.timestamp as "Last Check"
FROM service_health_metrics shm
WHERE shm.timestamp >= NOW() - INTERVAL '4 hours'
ORDER BY shm.timestamp DESC;
```

### Dashboard Panel 6: Budget Tracking (Updated)

```sql
-- Daily budget tracking using existing api_usage
SELECT 
  DATE(au.created_at) as "Date",
  SUM(au.cost) as "Daily Cost ($)",
  COUNT(DISTINCT au.campaign_id) as "Active Campaigns",
  COUNT(*) as "Total API Calls",
  ROUND(AVG(au.response_time), 0) as "Avg Response Time (ms)"
FROM api_usage au
WHERE au.created_at >= $__timeFrom()
  AND au.created_at <= $__timeTo()
GROUP BY DATE(au.created_at)
ORDER BY "Date" DESC;
```

---

## Part 4: Railway Integration - Updated

### Step 1: Update Environment Variables

Add to Railway environment variables:

```env
# Database (Updated for existing structure)
SUPABASE_URL=https://[your-project-ref].supabase.co
SUPABASE_SERVICE_ROLE_KEY=[your-service-role-key]

# Grafana Integration  
GRAFANA_URL=https://[your-stack-name].grafana.net
GRAFANA_API_TOKEN=[your-api-token]

# Monitoring
ENABLE_REALTIME_MONITORING=true
METRICS_COLLECTION_INTERVAL=60
HEALTH_CHECK_INTERVAL=300
```

### Step 2: Update Server.js (Compatible Version)

```javascript
// Dashboard endpoints using existing database structure
app.get('/api/dashboard/campaign-performance', async (req, res) => {
  try {
    // Use existing campaigns table
    const { data, error } = await supabase
      .from('campaigns')
      .select(`
        id, name, status, current_cost, results, created_at,
        businesses!inner(id, confidence_score, is_qualified, total_cost)
      `)
      .gte('created_at', req.query.start_date || '2024-01-01')
      .lte('created_at', req.query.end_date || '2024-12-31');

    if (error) throw error;
    
    // Calculate metrics from existing data
    const metrics = data.map(campaign => ({
      campaign_id: campaign.id,
      campaign_name: campaign.name,
      total_leads: campaign.businesses?.length || 0,
      qualified_leads: campaign.businesses?.filter(b => b.is_qualified).length || 0,
      total_cost: campaign.current_cost || 0,
      avg_confidence: campaign.businesses?.length > 0 
        ? Math.round(campaign.businesses.reduce((sum, b) => sum + (b.confidence_score || 0), 0) / campaign.businesses.length)
        : 0
    }));

    res.json(metrics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/dashboard/cost-analysis', async (req, res) => {
  try {
    // Use existing api_usage table
    const { data, error } = await supabase
      .from('api_usage')
      .select('service, cost, success, response_time, created_at')
      .gte('created_at', req.query.start_date || '2024-01-01')
      .lte('created_at', req.query.end_date || '2024-12-31')
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    // Group by service
    const serviceStats = data.reduce((acc, usage) => {
      if (!acc[usage.service]) {
        acc[usage.service] = {
          total_requests: 0,
          total_cost: 0,
          successful_requests: 0,
          total_response_time: 0
        };
      }
      
      acc[usage.service].total_requests++;
      acc[usage.service].total_cost += usage.cost || 0;
      acc[usage.service].total_response_time += usage.response_time || 0;
      if (usage.success) acc[usage.service].successful_requests++;
      
      return acc;
    }, {});

    // Calculate final metrics
    const result = Object.entries(serviceStats).map(([service, stats]) => ({
      api_service: service,
      total_requests: stats.total_requests,
      total_cost: Math.round(stats.total_cost * 10000) / 10000,
      success_rate: Math.round((stats.successful_requests / stats.total_requests) * 100 * 100) / 100,
      avg_response_time: Math.round(stats.total_response_time / stats.total_requests),
      cost_per_request: Math.round((stats.total_cost / stats.total_requests) * 10000) / 10000
    }));

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/dashboard/health-check', async (req, res) => {
  try {
    // Check database connection using existing tables
    const { data: campaignData, error: campaignError } = await supabase
      .from('campaigns')
      .select('count')
      .limit(1);

    const { data: businessData, error: businessError } = await supabase
      .from('businesses') 
      .select('count')
      .limit(1);

    if (campaignError || businessError) {
      throw new Error(campaignError?.message || businessError?.message);
    }

    // Check if monitoring tables exist
    const { data: monitoringData, error: monitoringError } = await supabase
      .from('service_health_metrics')
      .select('count')
      .limit(1);

    res.json({ 
      database: true,
      apiEndpoints: true, 
      monitoring: !monitoringError,
      timestamp: new Date().toISOString(),
      tablesAccessed: {
        campaigns: !campaignError,
        businesses: !businessError,
        monitoring: !monitoringError
      }
    });
  } catch (error) {
    res.status(500).json({ 
      database: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});
```

---

## Part 5: Troubleshooting - Updated

### Database Issues

**Issue 1: Foreign Key Errors**
```
ERROR: relation "enhanced_leads" does not exist
```
**Solution**: The revised schema fixes this automatically. If still seeing errors:
```sql
-- Manually check and fix foreign keys
SELECT constraint_name, table_name, referenced_table_name
FROM information_schema.referential_constraints rc
JOIN information_schema.key_column_usage kcu ON rc.constraint_name = kcu.constraint_name
WHERE kcu.table_name IN ('lead_emails', 'lead_social_profiles');
```

**Issue 2: Function Conflicts**  
```
ERROR: function already exists
```
**Solution**: Use updated function names:
```sql
-- Use these compatible functions
SELECT campaign_analytics_current('[campaign-uuid]');
SELECT get_dashboard_realtime_metrics_current();
SELECT calculate_cost_per_qualified_lead_current();
```

**Issue 3: Missing Data in Monitoring Tables**
**Solution**: Initialize with sample data:
```sql
INSERT INTO service_health_metrics (service_name, status, response_time_ms, error_rate)
VALUES 
  ('google_places', 'healthy', 150, 0.01),
  ('hunter_io', 'healthy', 200, 0.02);
```

### Grafana Issues

**Issue**: Dashboard panels show "No data"
**Solutions**:
1. **Check time range** - Use "Last 30 days" initially
2. **Verify queries** - Test in Supabase SQL Editor first:
   ```sql
   SELECT COUNT(*) FROM campaigns WHERE created_at >= NOW() - INTERVAL '30 days';
   ```
3. **Check RLS policies** - Ensure your user can access data
4. **Run test campaigns** to generate sample data

**Issue**: Connection timeouts
**Solutions**:
1. **Verify SSL mode** is "require"
2. **Check connection pooling** - use connection pooler URL
3. **Test basic query**:
   ```sql
   SELECT 1;
   ```

### Railway Issues

**Issue**: Dashboard endpoints return 500 errors
**Solutions**:
1. **Check environment variables** are set correctly
2. **Verify function calls** use correct table names:
   ```javascript
   // Use 'businesses' not 'enhanced_leads'
   .from('businesses')
   // Use 'campaigns' table directly  
   .from('campaigns')
   ```
3. **Check Railway logs**:
   ```bash
   railway logs --tail
   ```

---

## Verification Checklist

### Database Verification
- [ ] **Backup created** before deployment
- [ ] **Schema deployed** without conflicts
- [ ] **New monitoring tables** exist (api_cost_tracking, lead_qualification_metrics, etc.)
- [ ] **Foreign key references** fixed (lead_emails/lead_social_profiles → businesses)
- [ ] **Sample data** inserted in service_health_metrics
- [ ] **Verification function** returns expected results

### Grafana Verification  
- [ ] **Data source** connected successfully
- [ ] **Test queries** return data
- [ ] **Dashboard panels** display without errors
- [ ] **Time range** settings work correctly
- [ ] **API token** has correct permissions

### Railway Verification
- [ ] **Environment variables** configured
- [ ] **Dashboard endpoints** accessible
- [ ] **Health check** returns success
- [ ] **Application logs** show no errors
- [ ] **Monitoring data** being collected

### End-to-End Testing
- [ ] **Run test campaign** through UI  
- [ ] **Check data appears** in both Supabase and Grafana
- [ ] **Export functionality** works
- [ ] **Cost tracking** updates correctly
- [ ] **Service health** monitored in real-time

---

## Success Indicators

✅ **Database enhanced** with monitoring capabilities  
✅ **Existing functionality** preserved and working  
✅ **Grafana dashboards** showing real campaign data  
✅ **Railway deployment** successful with monitoring  
✅ **Cost tracking** and alerts operational  
✅ **Professional monitoring** integrated seamlessly  

Your ProspectPro platform now has enterprise-grade monitoring while maintaining full compatibility with your existing database structure and functionality.