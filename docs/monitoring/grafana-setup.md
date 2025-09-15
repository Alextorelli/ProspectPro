# Grafana Setup for ProspectPro Monitoring

## Overview
Configure your existing Grafana Cloud account to connect to your Supabase database and create ProspectPro monitoring dashboards.

## Prerequisites
- ✅ Existing Grafana Cloud account: https://appsmithery.grafana.net/
- ✅ Supabase database with monitoring schema deployed
- ✅ Environment variables from `.env` file

## Step 1: Configure PostgreSQL Data Source

### 1.1 Get Supabase Connection Details (Detailed Steps)

**Step-by-Step for New Supabase Dashboard:**

1. **Login to Supabase**: https://supabase.com/dashboard/projects
2. **Select your ProspectPro project** (vvxdprgfltzblwvpedpx)
3. **Navigate to Project Settings**:
   - Click the **"Settings"** icon (⚙️) in the left sidebar (bottom)
   - OR click your project name → **"Settings"**

4. **Find Database Connection Info**:
   - In Settings, click **"Database"** tab
   - Look for **"Connection parameters"** section
   - OR look for **"Connection pooling"** section
   - You'll see connection details like:

**Your Exact Connection Details:**
```yaml
Host: db.vvxdprgfltzblwvpedpx.supabase.co
Database: postgres  
Username: postgres
Port: 5432
Password: [Your database password from setup]
```

**Alternative Method - API Settings:**
1. In Settings, click **"API"** tab
2. Find **"Project URL"**: `https://vvxdprgfltzblwvpedpx.supabase.co`
3. Database host is: `db.vvxdprgfltzblwvpedpx.supabase.co`

**If you don't see "Connection String" option:**
- Look for **"Connection parameters"**
- OR check **"Database"** → **"Connection pooling"**  
- OR use the **API URL** format: change `https://` to `db.` for database host

### 1.2 Add Data Source in Grafana

1. **Login to Grafana**: https://appsmithery.grafana.net/
2. **Navigate**: Administration → Data Sources (or Configuration → Data Sources)
3. **Add data source**: Click "Add data source" → Select "PostgreSQL"
4. **Configure connection**:

```yaml
Name: ProspectPro-Supabase
Host: db.vvxdprgfltzblwvpedpx.supabase.co:5432
Database: postgres
User: postgres
Password: {YOUR_DB_PASSWORD}
SSL Mode: require
Version: 12+
TimescaleDB: No
```

**SSL Configuration (IMPORTANT):**
- **TLS/SSL Mode**: `require`
- **TLS/SSL Method**: `file-path`
- **TLS/SSL Root Certificate**: Upload `config/supabase-ca-2021.crt` from your repo

### 1.2a Detailed Grafana Configuration Steps

**Step 1: Access Data Sources**
1. In Grafana, look for the **gear icon (⚙️)** in left sidebar
2. Click **"Data sources"** 
3. OR go to **"Administration"** → **"Data sources"** in newer Grafana versions

**Step 2: Add PostgreSQL Data Source**
1. Click **"Add data source"** button
2. Search for **"PostgreSQL"** and click it
3. Fill in these EXACT values:

**Basic Settings:**
```
Name: ProspectPro-Production
Default: ✅ (check this box)
```

**PostgreSQL Connection:**
```
Host: db.vvxdprgfltzblwvpedpx.supabase.co:5432
Database: postgres
User: postgres
Password: [Your Supabase database password]
```

**SSL Settings:**
```
SSL Mode: require
TLS/SSL Method: file-path
TLS/SSL Root Certificate: [Upload config/supabase-ca-2021.crt]
```

**Advanced Settings:**
```
Version: 12+
TimescaleDB: No
Max open connections: 5
Max idle connections: 2
Max connection lifetime: 14400
```

**Step 3: Get Your Database Password**

If you don't remember your database password:

1. **Go to Supabase Dashboard**: https://supabase.com/dashboard/projects
2. **Select your project**: vvxdprgfltzblwvpedpx
3. **Settings → Database**
4. **Look for "Database password"** section
5. **Reset password if needed**: Click "Generate new password"
6. **Copy the password** and use it in Grafana

**Alternative: Use Connection URI Method**
1. In Supabase Settings → Database
2. Look for **"URI"** tab
3. Copy the connection string like:
   ```
   postgresql://postgres:[password]@db.vvxdprgfltzblwvpedpx.supabase.co:5432/postgres
   ```
4. In Grafana, you can use this full URI in the "Host" field

### 1.3 Test Connection
Click **Save & test** - you should see "Database Connection OK"

## Step 2: Import ProspectPro Dashboard

### 2.1 Create ProspectPro Dashboard
1. **Navigate**: Dashboards → New → Import
2. **Create new dashboard** for ProspectPro monitoring
3. **Set data source**: ProspectPro-Supabase

### 2.2 Add Key Panels

#### Campaign Overview Panel
```sql
-- Campaign Performance Metrics
SELECT 
  c.name as campaign_name,
  c.status,
  COALESCE((c.results->>'discovered')::INTEGER, 0) as leads_discovered,
  COALESCE((c.results->>'qualified')::INTEGER, 0) as leads_qualified,
  COALESCE(c.current_cost, 0) as total_cost,
  c.created_at
FROM campaigns c 
WHERE c.created_at >= $__timeFrom()
  AND c.created_at <= $__timeTo()
ORDER BY c.created_at DESC;
```

#### API Cost Tracking Panel
```sql
-- API Cost Breakdown
SELECT 
  $__time(au.created_at),
  au.service,
  SUM(au.cost) as total_cost,
  AVG(au.response_time) as avg_response_time,
  COUNT(*) FILTER (WHERE au.success = true) * 100.0 / COUNT(*) as success_rate
FROM api_usage au
WHERE $__timeFilter(au.created_at)
GROUP BY $__time(au.created_at), au.service
ORDER BY $__time(au.created_at);
```

#### Service Health Panel  
```sql
-- Service Health Status
SELECT 
  $__time(shm.timestamp),
  shm.service_name,
  shm.status,
  shm.response_time_ms,
  shm.error_rate,
  shm.requests_today,
  shm.cost_today
FROM service_health_metrics shm
WHERE $__timeFilter(shm.timestamp)
ORDER BY $__time(shm.timestamp);
```

#### Lead Qualification Metrics Panel
```sql
-- Lead Quality Analysis  
SELECT 
  $__time(b.created_at),
  COUNT(*) as total_leads,
  COUNT(*) FILTER (WHERE b.is_qualified = true) as qualified_leads,
  AVG(b.confidence_score) as avg_confidence,
  COUNT(*) FILTER (WHERE b.confidence_score >= 90) as a_grade_leads,
  COUNT(*) FILTER (WHERE b.confidence_score >= 80 AND b.confidence_score < 90) as b_grade_leads
FROM businesses b
WHERE $__timeFilter(b.created_at)
GROUP BY $__time(b.created_at)
ORDER BY $__time(b.created_at);
```

## Step 3: Configure Dashboard Variables

### 3.1 Campaign Selector Variable
- **Name**: `campaign`
- **Type**: Query
- **Query**: `SELECT id, name FROM campaigns ORDER BY created_at DESC`
- **Display**: `name`
- **Value**: `id`

### 3.2 Time Range Variable  
- **Name**: `timerange`
- **Type**: Custom
- **Options**: `1h,6h,12h,24h,7d,30d`

## Step 4: Set Up Alerting (Optional)

### 4.1 High API Cost Alert
```sql
-- Alert when daily API costs exceed budget
SELECT 
  SUM(cost) as daily_cost
FROM api_usage 
WHERE created_at >= CURRENT_DATE
HAVING SUM(cost) > 25.00;  -- Daily budget limit
```

### 4.2 Service Down Alert
```sql
-- Alert when service health shows errors
SELECT 
  service_name,
  status,
  error_rate
FROM service_health_metrics
WHERE timestamp >= now() - INTERVAL '5 minutes'
  AND (status != 'healthy' OR error_rate > 0.05);
```

## Step 5: Dashboard Organization

### 5.1 Create Folders
1. **ProspectPro** - Main application dashboards
2. **System Health** - Infrastructure monitoring  
3. **Cost Analytics** - Budget and spending analysis

### 5.2 Set Permissions
- **Viewer**: All team members
- **Editor**: Development team
- **Admin**: Project leads

## Step 6: Export/Import Configuration

### 6.1 Export Dashboard JSON
Once configured, export your dashboard:
1. **Dashboard settings** → **JSON Model**  
2. **Copy** the JSON configuration
3. **Save** as `docs/monitoring/dashboards/prospectpro-main.json`

### 6.2 Version Control
Commit dashboard configurations to git for team sharing:
```bash
git add docs/monitoring/dashboards/
git commit -m "Add ProspectPro monitoring dashboards"
```

## Troubleshooting

### Connection Issues
- ✅ **Check SSL requirement**: Supabase requires SSL connections
- ✅ **Verify credentials**: Test with psql command line tool
- ✅ **IP allowlisting**: Grafana Cloud IPs may need to be allowed

### Query Performance  
- ✅ **Use indexes**: Monitoring schema includes performance indexes
- ✅ **Limit time ranges**: Use dashboard time picker appropriately
- ✅ **Cache settings**: Enable query result caching in Grafana

### Data Issues
- ✅ **Check schema**: Verify monitoring tables exist with `fix-verification-function.sql`
- ✅ **Sample data**: Use sample queries to test data availability
- ✅ **Permissions**: Ensure Grafana user has SELECT permissions

## Next Steps
1. [Configure monitoring queries](monitoring-queries.md)
2. [Set up Railway integration](railway-integration.md)  
3. [Review dashboard examples](dashboards/)

Your ProspectPro monitoring dashboard is now ready for professional lead generation analytics! 📊