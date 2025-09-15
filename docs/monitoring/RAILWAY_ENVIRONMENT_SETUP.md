# Railway Environment Variables Setup - Step-by-Step Guide

## Overview
This guide provides exact steps for setting up environment variables in your Railway deployment dashboard. All variables must be configured in Railway for your ProspectPro application to function in production.

## Where to Set Environment Variables in Railway

### Step 1: Access Railway Dashboard
1. **Login** to Railway: https://railway.app/login
2. **Select your project**: Click on your ProspectPro project
3. **Navigate to service**: Click on your ProspectPro service (usually named "prospectpro" or "main")

### Step 2: Open Variables Tab
1. **Click on your service** from the project dashboard
2. **Click the "Variables" tab** in the top navigation (next to Deployments, Metrics, Settings)
3. You'll see the environment variables interface

### Step 3: Add Environment Variables

#### Method 1: Individual Variable Entry
1. **Click "New Variable"** button
2. **Enter Variable Name** (e.g., `SUPABASE_URL`)
3. **Enter Variable Value** (copy from your .env file)
4. **Click "Add"** or press Enter
5. **Repeat** for each variable

#### Method 2: Bulk Import (Recommended)
1. **Click "Raw Editor"** toggle in the top right
2. **Paste all variables** in KEY=VALUE format (see format below)
3. **Click "Deploy"** to save all variables

### Step 4: Variable Categories Setup

Copy and paste these variable groups into Railway's Raw Editor:

#### 🗄️ **Database Configuration (CRITICAL)**
```bash
# Supabase Database - REQUIRED for all functionality
SUPABASE_URL=https://vvxdprgfltzblwvpedpx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2eGRwcmdmbHR6Ymx3dnBlZHB4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjQ3MTgzOTksImV4cCI6MjA0MDI5NDM5OX0.TZ9kR6FfNvnZMJF9P6NX6rYSVfM3LRw7BfGK7U6YXwc
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2eGRwcmdmbHR6Ymx3dnBlZHB4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyNDcxODM5OSwiZXhwIjoyMDQwMjk0Mzk5fQ.sOZBWJfb4MvqA2B6dxPCUaGr3zqZCXF7tHv1NjM5QwE
```

#### 🔑 **API Keys (CRITICAL for Lead Generation)**
```bash
# Core Lead Generation APIs - REQUIRED
GOOGLE_PLACES_API_KEY=AIzaSyB3BbYJRUiGSwgyon2iBWQkv6ON3V3eSik
SCRAPINGDOG_API_KEY=68c368582456a537af2a2247
HUNTER_IO_API_KEY=7bb2d1f9b5f8af7c1e8bf1736cf51f60eff49bbf
NEVERBOUNCE_API_KEY=private_56e6fb6612fccb12bdf0d237f70e5b96
```

#### 🏛️ **Government Registry APIs (Optional but Recommended)**
```bash
# State Registry Validation - Enhanced Data Quality
SOCRATA_APP_TOKEN=LyweIWl2X0Yls0hdecKgnwd37
SEC_USER_AGENT=ProspectPro Lead Generation Alextorelli28@gmail.com
USPTO_API_KEY=5BoTZaXD2hIxrSOxKvtjkLjozBz5VzOA
COURTLISTENER_TOKEN=58cf8cc4c7d660b6e1532ee56019f8585bede7a9
API_USER_AGENT=ProspectPro/1.0 (Business Lead Verification; Alextorelli28@gmail.com)
```

#### 🔐 **Security & Authentication**
```bash
# Application Security - REQUIRED
JWT_SECRET=production_jwt_secret_change_this_in_production_min_32_characters
PERSONAL_ACCESS_TOKEN=6ef913e6d21ad34cc9f68d91ec559c47797b1959a269a549eeef52ddf0af33d2
```

#### ⚙️ **Production Configuration**
```bash
# Production Settings - REQUIRED
NODE_ENV=production
PORT=3000
DEBUG_MODE=false
LOG_LEVEL=info
SKIP_AUTH_IN_DEV=false
MOCK_API_RESPONSES=false
ENABLE_DEV_ADMIN=false
```

#### 📊 **Monitoring & Analytics (New)**
```bash
# Monitoring System - REQUIRED for new monitoring features
ENABLE_MONITORING=true
ENABLE_REAL_TIME_MONITORING=true
ENABLE_CAMPAIGN_ANALYTICS=true
MONITORING_ENDPOINT=/api/monitoring
REALTIME_UPDATES=true
ANALYTICS_CACHE_TTL=300
MAX_DASHBOARD_QUERIES=50
```

#### 💰 **Budget & Cost Controls**
```bash
# Cost Management - REQUIRED for budget tracking
DAILY_BUDGET_LIMIT=25.00
MONTHLY_BUDGET_LIMIT=150.00
MIN_CONFIDENCE_SCORE=80
MAX_LEADS_PER_CAMPAIGN=100
ENABLE_COST_ALERTS=true
ENABLE_BUDGET_ALERTS=true
BUDGET_WARNING_THRESHOLD=80
BUDGET_CRITICAL_THRESHOLD=95
AUTO_PAUSE_ON_BUDGET_EXCEEDED=true
```

#### 📈 **Enhanced API Settings**
```bash
# API Enhancement Configuration
SCRAPINGDOG_MONTHLY_BUDGET=200
SCRAPINGDOG_BATCH_SIZE=10
SCRAPINGDOG_RATE_LIMIT_MS=100
HUNTER_MONTHLY_BUDGET=500
HUNTER_DAILY_LIMIT=50
HUNTER_BATCH_SIZE=10
HUNTER_RATE_LIMIT_MS=1000
ENABLE_EMAIL_PATTERNS=true
ENABLE_EMAIL_VERIFICATION=true
ENABLE_WEBSITE_ENRICHMENT=true
```

#### 🏠 **Dashboard & UI Configuration**
```bash
# Dashboard Settings - REQUIRED for monitoring UI
DASHBOARD_REFRESH_INTERVAL_MS=30000
MAX_ACTIVITY_FEED_ITEMS=20
STATS_UPDATE_INTERVAL_MS=60000
MAX_CONCURRENT_DB_CONNECTIONS=10
```

#### 🔧 **Optional Grafana Integration**
```bash
# Grafana Integration - OPTIONAL (for advanced monitoring)
GRAFANA_URL=https://appsmithery.grafana.net
# GRAFANA_API_KEY=add_your_grafana_api_key_here_if_needed
```

## Step 5: Verify Variables Are Set

### Check in Railway Dashboard
1. **Go to Variables tab** in your Railway service
2. **Verify all variables** are listed and have values
3. **Look for any missing variables** (they'll show as empty)

### Verify with Application Logs
1. **Go to "Deployments" tab** in Railway
2. **Click on latest deployment**
3. **Check logs** for environment variable errors
4. **Look for startup messages** confirming API connections

## Step 6: Test Production Environment

### Required Tests After Setting Variables
```bash
# Test basic application startup
# Check Railway deployment logs for:
✅ "Server started on port 3000"
✅ "Supabase connected successfully" 
✅ "Google Places API initialized"
✅ "Hunter.io client initialized"
✅ "Monitoring system enabled"

# Test critical endpoints
✅ GET /api/health - Should return 200 OK
✅ POST /api/discover-businesses - Should work with real API
✅ GET /api/monitoring/dashboard - Should return monitoring data
```

## Important Security Notes

### 🚨 **NEVER commit these to Git:**
- API keys
- Database passwords  
- JWT secrets
- Personal access tokens

### ✅ **Development vs Production Variables**

**Development (.env file):**
- `NODE_ENV=development`
- `DEBUG_MODE=true`
- `SKIP_AUTH_IN_DEV=true`
- `MOCK_API_RESPONSES=false` (use real APIs even in dev)

**Production (Railway):**
- `NODE_ENV=production`
- `DEBUG_MODE=false`
- `SKIP_AUTH_IN_DEV=false`
- All real API keys

## Troubleshooting

### Common Issues

#### "Environment variable not found" errors
**Solution**: Double-check variable names match exactly (case-sensitive)

#### "API connection failed" errors  
**Solution**: Verify API keys are correct and have proper permissions

#### "Database connection failed"
**Solution**: Check Supabase URL and keys are correct

#### "Monitoring features not working"
**Solution**: Ensure monitoring schema is deployed and monitoring variables are set

### Railway-Specific Issues

#### Variables not updating after change
**Solution**: 
1. Make sure to click **"Deploy"** after changing variables
2. Check the deployment logs to confirm new deployment started

#### Variables showing as empty
**Solution**:
1. Use **Raw Editor** mode to bulk paste variables
2. Verify no extra spaces or special characters

#### Railway deployment failing
**Solution**:
1. Check **build logs** for missing dependencies
2. Verify **port configuration** (Railway auto-assigns PORT)
3. Ensure **start script** in package.json is correct

## Monitoring Your Variables

### Regular Checks
1. **Monthly**: Review and rotate API keys if needed
2. **Weekly**: Check budget alerts and cost tracking
3. **Daily**: Monitor application logs for API failures

### Variable Management Best Practices
1. **Use Railway's built-in variable management** (don't use external tools)
2. **Group related variables** using consistent naming (e.g., `SUPABASE_*`)
3. **Document all variables** in this guide when adding new ones
4. **Test thoroughly** after any variable changes

---

**Your Railway environment is now configured for production ProspectPro deployment! 🚀**

Next: Test your deployment and verify all monitoring features are working correctly.