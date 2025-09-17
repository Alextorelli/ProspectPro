# 🚀 ProspectPro Web Deployment Guide

## Overview
Deploy ProspectPro as a web application that you can access from any browser without needing to run terminal commands. This guide will help you deploy to Railway (free hosting) with a user-friendly web interface.

---

33. **Copy the new Secret key** (`sb_secret_...`)
4. **Update `SUPABASE_SECRET_KEY` in Railway variables**
5. Redeploy your app*Copy the new Secret key** (`sb_secret_...`)
4. Update `SUPABASE_SECRET_KEY` in Railway variables 📋 Quick Start Summary

**What you'll get:**
- 🌐 **Web-based interface** at `https://your-app-name.railway.app`
- 📊 **Admin dashboard** for monitoring costs and leads
- 🔐 **Secure authentication** with personal access tokens
- 💰 **Real-time cost tracking** for all API services
- 📈 **Business metrics** without command-line access

**Time required:** ~30 minutes

---

## 🛠️ Prerequisites

### 1. Create Required Accounts (All Free)

| Service | Purpose | Sign Up Link |
|---------|---------|--------------|
| **Railway** | Web hosting | [railway.app](https://railway.app) |
| **Supabase** | Database | [supabase.com](https://supabase.com) |
| **Google Cloud** | Places API | [console.cloud.google.com](https://console.cloud.google.com) |

### 2. Get API Keys

#### Google Places API (Required)
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable "Places API" in APIs & Services
4. Create credentials → API Key
5. Copy your API key (starts with `AIza...`)

#### Optional APIs (Recommended)
- **Hunter.io**: [hunter.io/api](https://hunter.io/api) - Email discovery
- **NeverBounce**: [neverbounce.com/api](https://neverbounce.com/api) - Email validation

---

## 🗄️ Database Setup (5 minutes)

### Step 1: Create Supabase Project
1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Choose organization, enter project name: `prospect-pro`
4. Generate a strong password and select region
5. Wait for project creation (~2 minutes)

### Step 2: Get Database Credentials
1. In your project dashboard, go to **Settings** → **API**
2. **Generate new API keys** (recommended):
   - Click "Generate new API keys" to create the modern secure keys
   - Use **Publishable key** (`sb_publishable_...`) for client-side
   - Use **Secret key** (`sb_secret_...`) for server-side (this app)
3. Copy these values:
   - **URL**: `https://xxx.supabase.co`
   - **Secret Key**: `sb_secret_xxx...` (for server-side operations)

> **Note**: Legacy `anon`/`service_role` keys still work but the new `publishable`/`secret` keys offer better security, rotation capabilities, and are the future-proof choice.

### Step 3: Import Database Schema
1. Go to **SQL Editor** in Supabase dashboard
2. Click "New Query"
3. Copy and paste the contents of `/database/enhanced-supabase-schema.sql`
4. Click **Run** to create all tables
5. Verify tables were created in the **Table Editor**

### 🔑 API Key Types Explained

Supabase now offers **two types of API keys** for better security:

| Key Type | Format | Usage | Security Level |
|----------|--------|-------|----------------|
| **Publishable Key** | `sb_publishable_...` | Client-side apps, browsers | Low - Safe to expose |
| **Secret Key** | `sb_secret_...` | Server-side, backend APIs | High - Keep secure |

**For ProspectPro**: We use the **Secret Key** for server-side operations with full database access.

**Migration from legacy keys**: 
- Old `anon` key → New `publishable` key
- Old `service_role` key → New `secret` key  
- Legacy keys work until late 2026, but new keys are recommended

---

## 🚂 Railway Deployment (10 minutes)

### Step 1: Deploy from GitHub
1. Go to [railway.app](https://railway.app) and sign in with GitHub
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your ProspectPro repository
4. Click "Deploy Now"

### Step 2: Configure Environment Variables
In your Railway project dashboard:

1. Go to **Variables** tab
2. Add these environment variables:

| Variable Name | Value | Example |
|---------------|-------|---------|
| `NODE_ENV` | `production` | `production` |
| `PORT` | `8080` | `8080` |
| `SUPABASE_URL` | Your Supabase URL | `https://abc123.supabase.co` |
| `SUPABASE_SECRET_KEY` | Your **new secret key** | `sb_secret_xxx...` |
| `GOOGLE_PLACES_API_KEY` | Your Google API key | `AIzaS...` |
| `PERSONAL_ACCESS_TOKEN` | Create a secure token | `ProspectPro2024_SecureToken123` |
| `ADMIN_PASSWORD` | Your admin password | `YourSecurePassword123!` |

> **Important**: Use the new **Secret key** (`sb_secret_...`) format for better security. The legacy JWT service role key is still supported but deprecated.

### Supabase Key Selection Order
The server automatically selects the first available key in this order:
1. `SUPABASE_SECRET_KEY` (preferred: sb_secret_...)
2. `SUPABASE_SERVICE_ROLE_KEY` (legacy: eyJ... JWT)
3. `SUPABASE_ANON_KEY`
4. `SUPABASE_PUBLISHABLE_KEY`

Use the **Secret key** (`sb_secret_...`) from Supabase → Settings → API → Secret keys.

**Optional variables** (add if you have the API keys):
- `HUNTER_IO_API_KEY`
- `NEVERBOUNCE_API_KEY`
- `SCRAPINGDOG_API_KEY`

### Step 3: Deploy and Get Your URL
1. Railway will automatically deploy after adding variables
2. Go to **Deployments** tab to see progress
3. Once deployed, click **View App** to get your URL
4. Your app will be available at: `https://your-app-name.railway.app`

---

## 🌐 Accessing Your Web Application

### Main Application
- **URL**: `https://your-app-name.railway.app`
- **Features**: Lead generation, campaign management, export tools
- **Access**: Direct browser access, no login required for basic features

### Admin Dashboard
- **URL**: `https://your-app-name.railway.app/admin-dashboard.html?token=YOUR_TOKEN`
- **Replace** `YOUR_TOKEN` with your `PERSONAL_ACCESS_TOKEN`
- **Features**: 
  - 📊 Real-time business metrics
  - 💰 API cost tracking
  - 📈 Lead quality analytics
  - ⚠️ Budget alerts

### Quick Access Bookmarks
Create browser bookmarks for easy access:

1. **ProspectPro App**: `https://your-app-name.railway.app`
2. **Admin Dashboard**: `https://your-app-name.railway.app/admin-dashboard.html?token=YOUR_TOKEN`

---

## 🎯 Using the Web Interface

### Lead Generation Workflow
1. **Open your app** in browser
2. **Select industry** (restaurant, retail, etc.)
3. **Enter location** (city, state, or address)
4. **Set lead count** (recommended: start with 10-20)
5. **Click "Start Campaign"**
6. **Monitor progress** in real-time
7. **Export results** when complete

### Cost Monitoring
1. **Open admin dashboard** (bookmark recommended)
2. **Enter admin password** when prompted
3. **View real-time metrics**:
   - Daily/monthly API costs
   - Cost per lead
   - Budget usage percentage
   - Lead quality scores

### Budget Management
- **Automatic alerts** at 75% and 90% of monthly budget
- **Real-time cost tracking** for all API services
- **Cost breakdown** by Google Places, Hunter.io, etc.
- **Monthly budget limits** configurable in dashboard

---

## 📱 Mobile Access

Your ProspectPro app is mobile-responsive and works on:
- 📱 **iPhone/iPad** - Safari, Chrome
- 🤖 **Android** - Chrome, Samsung Internet
- 💻 **Desktop** - All modern browsers

**Recommended**: Add to home screen on mobile for app-like experience.

---

## 🛠️ Maintenance & Updates

### No Command Line Required!
All maintenance can be done through web interfaces:

#### Railway Dashboard
- **View logs**: Deployments → View Logs
- **Update environment variables**: Variables tab
- **Monitor performance**: Metrics tab
- **Scale resources**: Settings → Resources

#### Supabase Dashboard
- **View database**: Table Editor
- **Monitor usage**: Settings → Usage
- **Backup data**: Settings → Database → Backups

#### Admin Dashboard
- **Monitor costs**: Built-in cost tracking
- **View lead quality**: Success rate metrics
- **Budget alerts**: Automatic notifications

---

## 🚨 Troubleshooting

### App Not Loading
1. **Check Railway deployment**: Go to Deployments tab, ensure latest deploy succeeded
2. **Verify environment variables**: All required variables set correctly
3. **Check build logs**: Look for any error messages in deployment logs

### Database Connection Issues
1. **Verify Supabase credentials**: URL and secret key correct (should start with `sb_secret_`)
2. **API key format check**:
   - ✅ **Recommended**: `sb_secret_...` (new secure format)
   - ⚠️ **Legacy**: Long JWT format (still works, but update recommended)
   - ❌ **Wrong**: `sb_publishable_...` (this is for client-side only)
3. **Check database schema**: Ensure enhanced-supabase-schema.sql was imported
4. **Test connection**: Use Supabase SQL Editor to run `SELECT 1;`

### Runtime Diagnostics & Degraded Mode
ProspectPro now exposes operational diagnostics endpoints:

| Endpoint | Purpose |
|----------|---------|
| `/health` | Lightweight status (ok / degraded / error) |
| `/diag` | Full diagnostics summary (key detection, network probes, auth probe, table probe) |
| `/diag?force=true` | Force immediate re-run of diagnostics |

If initial Supabase connectivity fails the process normally exits. Set `ALLOW_DEGRADED_START=true` to keep the container alive for investigation. Once `/health` reports `ok`, remove this variable for stricter future deploys.

Typical degraded `/health` response excerpt:
```
{
   "status": "degraded",
   "supabase": {
      "success": false,
      "error": "SUPABASE_URL missing",
      "recommendations": ["Set SUPABASE_URL=https://<ref>.supabase.co"]
   }
}
```

Use `/diag?force=true` after updating environment variables to confirm recovery without waiting for a restart.

### API Key Migration
If you're using **legacy keys** and want to migrate:
1. Go to **Settings** → **API** in Supabase dashboard
2. Click "Generate new API keys" 
3. Copy the new **Secret key** (`sb_secret_...`)
4. **Update `SUPABASE_SECRET_KEY` in Railway variables**
5. Redeploy your app

**Both key formats work simultaneously** - no downtime required for migration.

### API Costs Too High
1. **Check admin dashboard**: Review cost breakdown
2. **Adjust lead counts**: Start with smaller batches (10-20 leads)
3. **Monitor budget alerts**: Set monthly limits in dashboard
4. **Quality filtering**: Use higher confidence score thresholds

### Admin Dashboard Access Issues
1. **Check URL format**: Include `?token=YOUR_TOKEN` parameter
2. **Verify token**: Must match `PERSONAL_ACCESS_TOKEN` in Railway
3. **Check admin password**: Must match `ADMIN_PASSWORD` in Railway

---

## 💡 Pro Tips

### Efficient Usage
- **Bookmark both URLs** for quick access
- **Start with small campaigns** (10-20 leads) to test costs
- **Use admin dashboard** to monitor ROI before scaling up
- **Set monthly budget alerts** to prevent overspend

### Cost Optimization
- **Google Places API**: ~$0.032 per search - main cost driver
- **Pre-filter locations**: Use specific areas to reduce API calls
- **Monitor success rates**: Higher quality = better ROI
- **Use caching**: Results cached for 1 hour to reduce redundant calls

### Security Best Practices
- **Keep tokens secure**: Don't share admin dashboard URLs
- **Use strong passwords**: For admin dashboard access
- **Monitor access logs**: Check Railway logs periodically
- **Rotate tokens**: Update access tokens every 90 days

---

## 🎉 You're Ready!

Your ProspectPro application is now deployed and accessible via web browser. No more command-line tools needed!

### Quick Reference
- **Main App**: `https://your-app-name.railway.app`
- **Admin Dashboard**: `https://your-app-name.railway.app/admin-dashboard.html?token=YOUR_TOKEN`
- **Railway Control Panel**: [railway.app/dashboard](https://railway.app/dashboard)
- **Supabase Dashboard**: [app.supabase.com](https://app.supabase.com)

### Next Steps
1. **Test lead generation** with a small campaign
2. **Monitor costs** in admin dashboard
3. **Set up budget alerts** for your monthly limits
4. **Create browser bookmarks** for easy access

**🚀 Happy lead generating!**