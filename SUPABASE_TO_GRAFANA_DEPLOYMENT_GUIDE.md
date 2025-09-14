# 🚀 Complete Supabase to Grafana Dashboard Deployment Guide

## Overview

This guide will walk you through deploying ProspectPro's enhanced database schema to Supabase and connecting it to a Grafana dashboard for real-time monitoring and analytics.

## Prerequisites

✅ Supabase account with active project  
✅ Grafana Cloud account (free tier available)  
✅ ProspectPro enhanced database schema file  
✅ All API keys configured (Google Places, Hunter.io, ScrapingDog)

---

# PART 1: SUPABASE DATABASE DEPLOYMENT

## Step 1: Access Supabase Dashboard

1. **Navigate to Supabase**
   - Go to https://supabase.com/dashboard
   - Sign in to your account
   - Select your ProspectPro project

2. **Open SQL Editor**
   - In the left sidebar, click "SQL Editor"
   - Click the "New query" button (+ icon)

## Step 2: Deploy Enhanced Database Schema

1. **Open the Schema File**
   - Navigate to your ProspectPro repository
   - Open `database/enhanced-supabase-schema.sql`
   - Copy the entire file contents (Ctrl+A, Ctrl+C)

2. **Execute the Schema**
   - Paste the SQL content into the Supabase SQL Editor
   - Click "Run" button (or Ctrl+Enter)
   - Wait for execution to complete (may take 30-60 seconds)

3. **Verify Success**
   - You should see "Success. No rows returned" or similar
   - Check for any error messages in red

## Step 3: Verify Database Tables

Run this verification query in the SQL Editor:

```sql
-- Verify all tables are created
SELECT 
  table_name,
  (SELECT count(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
AND table_name IN (
  'enhanced_leads',
  'campaigns', 
  'lead_emails',
  'lead_social_profiles',
  'api_usage_log',
  'campaign_analytics',
  'api_cost_tracking', 
  'lead_qualification_metrics',
  'service_health_metrics',
  'dashboard_exports'
);
```

**Expected Results:** All 10 tables should be listed with their column counts.

## Step 4: Verify Monitoring Functions

Run this query to verify analytics functions:

```sql
-- Verify monitoring functions exist
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN (
  'calculate_cost_per_qualified_lead_dashboard',
  'get_dashboard_realtime_metrics',
  'get_api_service_breakdown',
  'prepare_dashboard_export_data'
);
```

**Expected Results:** All 4 functions should be listed as type 'FUNCTION'.

## Step 5: Test Database Connection

1. **Get Connection Details**
   - In Supabase Dashboard, go to "Settings" → "Database"
   - Copy the connection string under "Connection pooling"
   - Note: Use the "Session" mode connection string

2. **Test Connection from Your App**
   ```bash
   cd your-prospectpro-directory
   node -e "
   require('dotenv').config();
   const { createClient } = require('@supabase/supabase-js');
   const client = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
   
   async function test() {
     console.log('🧪 Testing enhanced database...');
     const { data, error } = await client.from('campaigns').select('*').limit(1);
     console.log('✅ Connection:', error ? '❌ Failed' : '✅ Success');
     const metrics = await client.rpc('get_dashboard_realtime_metrics');
     console.log('✅ Functions:', metrics.error ? '❌ Failed' : '✅ Success');
     console.log('🎯 Database is ready for Grafana!');
   }
   test();
   "
   ```

---

# PART 2: GRAFANA CLOUD SETUP

## Step 1: Create Grafana Cloud Account

1. **Sign Up for Grafana Cloud**
   - Go to https://grafana.com/auth/sign-up
   - Choose "Free" plan (includes 10,000 series, sufficient for ProspectPro)
   - Complete account setup

2. **Access Your Grafana Instance**
   - After signup, you'll get a Grafana URL like `https://yourusername.grafana.net`
   - Bookmark this URL for easy access

## Step 2: Configure PostgreSQL Data Source

1. **Add Data Source**
   - In Grafana, go to "Configuration" → "Data Sources"
   - Click "Add data source"
   - Select "PostgreSQL"

2. **Configure Connection**
   ```
   Name: ProspectPro-Supabase
   Host: your-supabase-host (from Supabase Settings → Database)
   Database: postgres
   User: postgres.your-project-ref (from Supabase Settings → Database) 
   Password: your-database-password
   SSL Mode: require
   Version: 13+
   Max open connections: 5
   Max idle connections: 2
   Max connection lifetime: 14400
   ```

3. **Get Supabase Connection Details**
   - In Supabase: Settings → Database → Connection Info
   - Host: `db.your-project-ref.supabase.co`
   - Database: `postgres`
   - Port: `5432`
   - User: `postgres.your-project-ref`
   - Password: Use your database password

4. **Test Connection**
   - Click "Save & Test"
   - You should see "Database Connection OK"

## Step 3: Import ProspectPro Dashboard Templates

### Dashboard 1: Campaign Performance Overview

1. **Create New Dashboard**
   - Click "+" → "Dashboard"
   - Click "Add new panel"

2. **Campaign Performance Panel**
   ```sql
   SELECT 
     name as campaign_name,
     leads_discovered,
     leads_qualified,
     ROUND(leads_qualified::float / NULLIF(leads_discovered, 0) * 100, 1) as qualification_rate,
     total_cost,
     created_at
   FROM campaigns 
   WHERE created_at >= NOW() - INTERVAL '30 days'
   ORDER BY created_at DESC;
   ```

   - Panel Settings:
     - Title: "Campaign Performance (30 Days)"
     - Visualization: Table
     - Format: Auto

### Dashboard 2: Real-Time Cost Monitoring

1. **Add Cost Tracking Panel**
   ```sql
   SELECT 
     api_service,
     SUM(total_cost) as total_cost,
     COUNT(request_count) as total_requests,
     ROUND(AVG(avg_response_time_ms)) as avg_response_time,
     date
   FROM api_cost_tracking 
   WHERE date >= CURRENT_DATE - INTERVAL '7 days'
   GROUP BY api_service, date
   ORDER BY date DESC, total_cost DESC;
   ```

   - Panel Settings:
     - Title: "API Cost Breakdown (7 Days)"
     - Visualization: Time series
     - Y-Axis: Cost ($)

### Dashboard 3: Service Health Status

1. **Add Service Health Panel**
   ```sql
   SELECT DISTINCT ON (service_name)
     service_name,
     status,
     response_time_ms,
     error_rate,
     rate_limit_remaining,
     cost_budget_remaining,
     timestamp
   FROM service_health_metrics 
   ORDER BY service_name, timestamp DESC;
   ```

   - Panel Settings:
     - Title: "Service Health Status"
     - Visualization: Stat
     - Color Mode: Value

## Step 4: Set Up Alerting

1. **Create Alert Rules**
   - Go to "Alerting" → "Alert Rules"
   - Click "New Rule"

2. **High Cost Alert**
   ```sql
   SELECT 
     SUM(total_cost) as daily_cost
   FROM api_cost_tracking 
   WHERE date = CURRENT_DATE;
   ```
   - Condition: `daily_cost > 50` (adjust threshold)
   - Alert when: Above threshold for 5 minutes
   - Send to: Email notification

3. **Service Down Alert**
   ```sql
   SELECT 
     COUNT(*) as unhealthy_services
   FROM service_health_metrics 
   WHERE status != 'healthy' 
   AND timestamp >= NOW() - INTERVAL '5 minutes';
   ```
   - Condition: `unhealthy_services > 0`
   - Alert when: Above threshold immediately
   - Send to: Email/Slack notification

---

# PART 3: ADVANCED DASHBOARD CONFIGURATION

## Step 1: Configure Variables

1. **Add Campaign Variable**
   - Dashboard Settings → Variables → Add Variable
   - Name: `campaign`
   - Type: Query
   - Query: 
     ```sql
     SELECT id, name FROM campaigns ORDER BY created_at DESC;
     ```

2. **Add Time Range Variable**
   - Name: `time_range`
   - Type: Interval
   - Values: `1d,7d,30d,90d`

## Step 2: Create Custom Metrics Panels

### ROI Analysis Panel
```sql
SELECT 
  campaign_id,
  campaign_name,
  total_qualified_leads,
  total_api_cost,
  cost_per_qualified_lead,
  roi_percentage,
  efficiency_score
FROM calculate_cost_per_qualified_lead_dashboard(
  $campaign, 
  CURRENT_DATE - INTERVAL '$time_range', 
  CURRENT_DATE
)
ORDER BY efficiency_score DESC;
```

### Hourly Performance Panel
```sql
SELECT 
  DATE_TRUNC('hour', timestamp) as hour,
  api_service,
  SUM(total_cost) as hourly_cost,
  COUNT(*) as hourly_requests,
  AVG(avg_response_time_ms) as avg_response_time
FROM api_cost_tracking 
WHERE date >= CURRENT_DATE - INTERVAL '$time_range'
GROUP BY hour, api_service
ORDER BY hour DESC;
```

## Step 3: Dashboard Export Integration

1. **Add Export Panel**
   - Create a text panel with export links:
   ```html
   <h3>Dashboard Exports</h3>
   <p><a href="http://your-railway-app.com/api/dashboard/export/campaigns?start_date=2024-01-01&end_date=2024-01-31&format=csv" target="_blank">📊 Campaign Performance CSV</a></p>
   <p><a href="http://your-railway-app.com/api/dashboard/export/costs?start_date=2024-01-01&end_date=2024-01-31&format=csv" target="_blank">💰 Cost Analysis CSV</a></p>
   <p><a href="http://your-railway-app.com/api/dashboard/export/roi?start_date=2024-01-01&end_date=2024-01-31&format=csv" target="_blank">📈 ROI Report CSV</a></p>
   ```

---

# PART 4: PRODUCTION DEPLOYMENT ON RAILWAY

## Step 1: Update Railway Configuration

1. **Add Environment Variables**
   - In Railway Dashboard, go to your ProspectPro service
   - Add these dashboard-specific variables:
   ```
   DASHBOARD_EXPORT_MAX_ROWS=10000
   DASHBOARD_CACHE_TTL=300
   METRICS_COLLECTION_INTERVAL=60
   COST_ALERT_THRESHOLD=50.00
   QUALIFICATION_RATE_ALERT=0.70
   API_HEALTH_CHECK_INTERVAL=300
   ```

2. **Deploy Updated Code**
   ```bash
   git add .
   git commit -m "Add dashboard integration and monitoring"
   git push origin main
   ```

## Step 2: Test Production Dashboard

1. **Verify Dashboard Endpoints**
   ```bash
   curl "https://your-railway-app.railway.app/api/dashboard/export/snapshot?format=json"
   ```

2. **Test Grafana Connection**
   - Update Grafana data source host to your Railway app
   - Test connection from Grafana

---

# PART 5: TROUBLESHOOTING GUIDE

## Common Issues & Solutions

### 1. "Function does not exist" Error in Grafana
**Solution:**
```sql
-- Run this in Supabase SQL Editor to verify functions
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%dashboard%';
```

### 2. "Permission denied" Error
**Solution:**
- Check RLS policies are properly configured
- Verify you're using the correct database user
- Try using service role key instead of anon key

### 3. "Connection timeout" Error
**Solution:**
- Use connection pooling in Supabase
- Reduce max connections in Grafana to 3-5
- Check firewall settings

### 4. "No data" in Grafana Panels
**Solution:**
```sql
-- Test data exists in Supabase
SELECT COUNT(*) FROM campaigns;
SELECT COUNT(*) FROM api_cost_tracking;
```

### 5. Dashboard Export 404 Error
**Solution:**
- Verify server.js includes dashboard routes
- Check Railway deployment includes all files
- Test locally first: `npm start` then visit endpoints

---

# FINAL CHECKLIST

## Database Deployment ✅
- [ ] Schema deployed to Supabase
- [ ] All 10 tables created successfully  
- [ ] All 4 monitoring functions working
- [ ] RLS policies enabled
- [ ] Connection test passes

## Grafana Setup ✅
- [ ] Grafana Cloud account created
- [ ] PostgreSQL data source configured
- [ ] Campaign performance dashboard created
- [ ] Cost monitoring dashboard created
- [ ] Service health dashboard created
- [ ] Alert rules configured

## Railway Integration ✅
- [ ] Dashboard export routes deployed
- [ ] All environment variables configured
- [ ] Production endpoints accessible
- [ ] Export functionality tested

## Monitoring Active ✅
- [ ] Real-time metrics collecting
- [ ] Cost tracking operational
- [ ] Service health monitoring active
- [ ] Dashboard exports working

---

**🎉 Congratulations!** Your ProspectPro platform now has enterprise-grade monitoring with Grafana dashboards, real-time analytics, and comprehensive cost tracking.

**Dashboard URL:** `https://yourusername.grafana.net`  
**Export API:** `https://your-railway-app.railway.app/api/dashboard/`

## Support Resources

- **Grafana Documentation:** https://grafana.com/docs/
- **Supabase PostgreSQL Guide:** https://supabase.com/docs/guides/database
- **ProspectPro API Reference:** Check `/api/dashboard/` endpoints in your deployment

Your dashboard is now monitoring lead generation costs, campaign performance, and service health in real-time! 🚀