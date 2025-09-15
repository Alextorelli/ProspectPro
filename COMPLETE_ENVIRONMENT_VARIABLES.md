# ProspectPro Complete Environment Variables Documentation

## Overview

This document provides comprehensive documentation for ALL environment variables used across all builds of ProspectPro, including monitoring, dashboard integration, and production deployment configurations.

**Last Updated**: September 14, 2025  
**Applies to**: All ProspectPro builds (Development, Production, Railway, Monitoring)  
**Current Variables Count**: 65+ variables across 8 categories

## ⚠️ Critical Variables for Railway Production

### 🗄️ Database Configuration (REQUIRED)
```env
# Supabase Database - CRITICAL for all functionality
SUPABASE_URL=https://vvxdprgfltzblwvpedpx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2eGRwcmdmbHR6Ymx3dnBlZHB4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjQ3MTgzOTksImV4cCI6MjA0MDI5NDM5OX0.TZ9kR6FfNvnZMJF9P6NX6rYSVfM3LRw7BfGK7U6YXwc
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2eGRwcmdmbHR6Ymx3dnBlZHB4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyNDcxODM5OSwiZXhwIjoyMDQwMjk0Mzk5fQ.sOZBWJfb4MvqA2B6dxPCUaGr3zqZCXF7tHv1NjM5QwE
```

### 🔑 Core API Keys (REQUIRED)
```env
# Lead Generation APIs - CRITICAL for business discovery
GOOGLE_PLACES_API_KEY=AIzaSyB3BbYJRUiGSwgyon2iBWQkv6ON3V3eSik
# Cost: ~$0.032 per search, $0.017 per details request

SCRAPINGDOG_API_KEY=68c368582456a537af2a2247  
# Cost: $0.0008 per request, $5/month for 1,000 requests

HUNTER_IO_API_KEY=7bb2d1f9b5f8af7c1e8bf1736cf51f60eff49bbf
# Cost: $49/month for 1,000 searches, $99/month for 5,000 searches

NEVERBOUNCE_API_KEY=private_56e6fb6612fccb12bdf0d237f70e5b96
# Cost: $0.008 per verification, 1000 free verifications/month
```

### 🏛️ Government Registry APIs (Optional Enhancement)
```env
# State Registry Validation - Enhanced Data Quality
SOCRATA_APP_TOKEN=LyweIWl2X0Yls0hdecKgnwd37
SEC_USER_AGENT=ProspectPro Lead Generation Alextorelli28@gmail.com
USPTO_API_KEY=5BoTZaXD2hIxrSOxKvtjkLjozBz5VzOA
COURTLISTENER_TOKEN=58cf8cc4c7d660b6e1532ee56019f8585bede7a9
API_USER_AGENT=ProspectPro/1.0 (Business Lead Verification; Alextorelli28@gmail.com)
```

### 🔐 Security & Authentication (REQUIRED)
```env
# Application Security - REQUIRED for Railway production
JWT_SECRET=production_jwt_secret_change_this_in_production_min_32_characters
PERSONAL_ACCESS_TOKEN=6ef913e6d21ad34cc9f68d91ec559c47797b1959a269a549eeef52ddf0af33d2
```

### ⚙️ Production Environment (REQUIRED)
```env
# Railway Production Settings - REQUIRED
NODE_ENV=production
PORT=3000  
DEBUG_MODE=false
LOG_LEVEL=info
SKIP_AUTH_IN_DEV=false
MOCK_API_RESPONSES=false
ENABLE_DEV_ADMIN=false
```

## 📊 New Monitoring System Variables (September 2025)

### Monitoring Core Configuration (REQUIRED for new features)
```env
# Monitoring System - REQUIRED for analytics dashboard
ENABLE_MONITORING=true
ENABLE_REAL_TIME_MONITORING=true
ENABLE_CAMPAIGN_ANALYTICS=true
MONITORING_ENDPOINT=/api/monitoring
REALTIME_UPDATES=true
ANALYTICS_CACHE_TTL=300
MAX_DASHBOARD_QUERIES=50
```

### Dashboard Configuration (REQUIRED)
```env
# Dashboard UI Settings - REQUIRED for monitoring dashboard
DASHBOARD_REFRESH_INTERVAL_MS=30000
MAX_ACTIVITY_FEED_ITEMS=20
STATS_UPDATE_INTERVAL_MS=60000
MAX_CONCURRENT_DB_CONNECTIONS=10
```

### Budget & Cost Controls (REQUIRED)
```env
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

### Enhanced API Settings (REQUIRED for optimization)
```env
# ScrapingDog Enhanced Settings
SCRAPINGDOG_MONTHLY_BUDGET=200
SCRAPINGDOG_BATCH_SIZE=10
SCRAPINGDOG_RATE_LIMIT_MS=100
SCRAPINGDOG_CONCURRENT_REQUESTS=5
ENABLE_GOOGLE_MAPS_SCRAPING=true
ENABLE_WEBSITE_ENRICHMENT=true
ENABLE_REVIEW_ANALYSIS=true

# Hunter.io Enhanced Settings
HUNTER_MONTHLY_BUDGET=500
HUNTER_DAILY_LIMIT=50
HUNTER_BATCH_SIZE=10
HUNTER_RATE_LIMIT_MS=1000
ENABLE_EMAIL_PATTERNS=true
ENABLE_EMAIL_VERIFICATION=true
ENABLE_PERSON_FINDER=true
```

### Database Performance (REQUIRED for monitoring)
```env
# Supabase Enhanced Features - REQUIRED for monitoring system
ENABLE_AUTO_ARCHIVING=true
ARCHIVE_CAMPAIGNS_AFTER_DAYS=90
API_LOG_RETENTION_DAYS=30
ENABLE_ROW_LEVEL_SECURITY=true
ENABLE_MATERIALIZED_VIEWS=true
```

### Optional Grafana Integration
```env
# Grafana Integration - OPTIONAL (for advanced analytics)
GRAFANA_URL=https://appsmithery.grafana.net
# GRAFANA_API_KEY=add_your_grafana_api_key_here_if_needed
```

## Legacy/Optional Variables

## Railway Deployment Guide

### 🚀 Where to Set Environment Variables in Railway

**Step 1: Access Railway Dashboard**
1. Login to Railway: https://railway.app/login
2. Click on your ProspectPro project 
3. Click on your ProspectPro service

**Step 2: Set Variables**
1. Click the **"Variables"** tab (top navigation)
2. Click **"Raw Editor"** toggle (recommended for bulk import)
3. Paste all production variables from above sections
4. Click **"Deploy"** to save and redeploy

### 🔄 Variable Categories by Priority

#### Priority 1: CRITICAL (Required for basic functionality)
- All Database Configuration variables
- All Core API Keys variables  
- All Production Environment variables
- All Security & Authentication variables

#### Priority 2: MONITORING (Required for new features)
- All Monitoring Core Configuration variables
- All Dashboard Configuration variables
- All Budget & Cost Controls variables
- All Enhanced API Settings variables

#### Priority 3: OPTIONAL (Enhanced features)
- Government Registry APIs
- Grafana Integration
- Advanced logging settings

## 📝 Development vs Production Values

### Development (.env file)
```env
NODE_ENV=development
DEBUG_MODE=true
SKIP_AUTH_IN_DEV=true
DAILY_BUDGET_LIMIT=10.00
LOG_LEVEL=debug
ENABLE_DEV_ADMIN=true
```

### Production (Railway)
```env
NODE_ENV=production
DEBUG_MODE=false
SKIP_AUTH_IN_DEV=false
DAILY_BUDGET_LIMIT=25.00
LOG_LEVEL=info  
ENABLE_DEV_ADMIN=false
```

## Variable Change History

### September 14, 2025 - Monitoring Enhancement
**Added Variables (23 new):**
- `ENABLE_MONITORING=true`
- `ENABLE_REAL_TIME_MONITORING=true` 
- `ENABLE_CAMPAIGN_ANALYTICS=true`
- `MONITORING_ENDPOINT=/api/monitoring`
- `REALTIME_UPDATES=true`
- `ANALYTICS_CACHE_TTL=300`
- `MAX_DASHBOARD_QUERIES=50`
- `DASHBOARD_REFRESH_INTERVAL_MS=30000`
- `MAX_ACTIVITY_FEED_ITEMS=20`
- `STATS_UPDATE_INTERVAL_MS=60000`
- `MAX_CONCURRENT_DB_CONNECTIONS=10`
- `ENABLE_COST_ALERTS=true`
- `ENABLE_BUDGET_ALERTS=true`
- `BUDGET_WARNING_THRESHOLD=80`
- `BUDGET_CRITICAL_THRESHOLD=95`
- `AUTO_PAUSE_ON_BUDGET_EXCEEDED=true`
- `SCRAPINGDOG_MONTHLY_BUDGET=200`
- `SCRAPINGDOG_BATCH_SIZE=10`
- `HUNTER_MONTHLY_BUDGET=500`
- `HUNTER_DAILY_LIMIT=50`
- `ENABLE_AUTO_ARCHIVING=true`
- `ARCHIVE_CAMPAIGNS_AFTER_DAYS=90`
- `ENABLE_MATERIALIZED_VIEWS=true`

**Purpose:** Enable real-time monitoring dashboard, cost tracking, and analytics features.

### Previously Configured Variables
**Core Variables (Production Ready):**
- All Supabase database configuration
- All API keys for lead generation
- Security and authentication settings
- Basic production environment configuration

## Legacy/Optional Variables
### Application Logging (Optional)
```env
# Log levels: error, warn, info, debug, trace
LOG_LEVEL=info
LOG_FORMAT=json
LOG_FILE_ENABLED=true
LOG_FILE_PATH=./logs/app.log

# Debug settings
DEBUG_MODE=false
VERBOSE_LOGGING=false
API_REQUEST_LOGGING=true
```

### Error Tracking (Optional)
```env
# Sentry integration (optional)
SENTRY_DSN=your_sentry_dsn_here
SENTRY_ENVIRONMENT=production
SENTRY_SAMPLE_RATE=0.1

# Error notification settings
EMAIL_NOTIFICATIONS_ENABLED=true
SLACK_WEBHOOK_URL=your_slack_webhook_url
```

## ✅ Quick Setup Checklist for Railway

### Minimum Required Variables (Copy to Railway)
```bash
# 🔄 Copy these EXACT variables to Railway Raw Editor:

# Database (CRITICAL)
SUPABASE_URL=https://vvxdprgfltzblwvpedpx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2eGRwcmdmbHR6Ymx3dnBlZHB4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjQ3MTgzOTksImV4cCI6MjA0MDI5NDM5OX0.TZ9kR6FfNvnZMJF9P6NX6rYSVfM3LRw7BfGK7U6YXwc
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2eGRwcmdmbHR6Ymx3dnBlZHB4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyNDcxODM5OSwiZXhwIjoyMDQwMjk0Mzk5fQ.sOZBWJfb4MvqA2B6dxPCUaGr3zqZCXF7tHv1NjM5QwE

# API Keys (CRITICAL)
GOOGLE_PLACES_API_KEY=AIzaSyB3BbYJRUiGSwgyon2iBWQkv6ON3V3eSik
SCRAPINGDOG_API_KEY=68c368582456a537af2a2247
HUNTER_IO_API_KEY=7bb2d1f9b5f8af7c1e8bf1736cf51f60eff49bbf
NEVERBOUNCE_API_KEY=private_56e6fb6612fccb12bdf0d237f70e5b96

# Production Settings (CRITICAL)
NODE_ENV=production
PORT=3000
DEBUG_MODE=false
LOG_LEVEL=info

# Security (CRITICAL)  
JWT_SECRET=production_jwt_secret_change_this_in_production_min_32_characters
PERSONAL_ACCESS_TOKEN=6ef913e6d21ad34cc9f68d91ec559c47797b1959a269a549eeef52ddf0af33d2

# Monitoring (REQUIRED for new features)
ENABLE_MONITORING=true
ENABLE_REAL_TIME_MONITORING=true
ENABLE_CAMPAIGN_ANALYTICS=true
DASHBOARD_REFRESH_INTERVAL_MS=30000

# Budget Controls (REQUIRED)
DAILY_BUDGET_LIMIT=25.00
MONTHLY_BUDGET_LIMIT=150.00
ENABLE_COST_ALERTS=true
ENABLE_BUDGET_ALERTS=true
```

## Environment Variables Summary

| Category | Count | Required | Description |
|----------|--------|----------|-------------|
| **Database** | 3 | ✅ CRITICAL | Supabase connection and authentication |
| **API Keys** | 4 | ✅ CRITICAL | Core lead generation services |
| **Security** | 2 | ✅ CRITICAL | JWT and access tokens |
| **Production** | 5 | ✅ CRITICAL | Basic app configuration |
| **Monitoring** | 23 | ✅ NEW | Real-time analytics and dashboard |
| **Budget** | 8 | ✅ REQUIRED | Cost controls and limits |
| **Enhanced APIs** | 12 | ⚠️ RECOMMENDED | Performance optimization |
| **Government APIs** | 5 | 🔧 OPTIONAL | Enhanced data validation |
| **Grafana** | 2 | 🔧 OPTIONAL | Advanced analytics |
| **Legacy/Others** | 15+ | 🔧 OPTIONAL | Additional features |

**Total Current Variables: 65+**

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check `SUPABASE_URL` format
   - Verify `SUPABASE_SERVICE_ROLE_KEY` has correct permissions
   - Ensure database is deployed and accessible

2. **API Rate Limits Exceeded**
   - Check daily limits in environment variables
   - Verify API keys have sufficient quota
   - Consider upgrading API plans

3. **Grafana Dashboard Not Loading**
   - Verify `GRAFANA_URL` is accessible
   - Check `GRAFANA_API_TOKEN` permissions
   - Ensure PostgreSQL data source is configured

4. **High API Costs**
   - Lower `DAILY_COST_LIMIT`
   - Increase `MIN_CONFIDENCE_THRESHOLD`
   - Reduce `MAX_LEADS_PER_CAMPAIGN`

## Security Best Practices

1. **Never commit `.env` files** to version control
2. **Use different keys** for development and production
3. **Rotate API keys** regularly
4. **Set appropriate rate limits** to prevent abuse
5. **Monitor API usage** and costs regularly
6. **Use service role keys** only server-side
7. **Implement proper error handling** to prevent key exposure

## Support & Resources

- **Supabase Documentation**: https://supabase.com/docs
- **Google Places API**: https://developers.google.com/maps/documentation/places/web-service
- **Hunter.io API**: https://hunter.io/api-documentation
- **ScrapingDog API**: https://docs.scrapingdog.com/
- **NeverBounce API**: https://developers.neverbounce.com/
- **Grafana Documentation**: https://grafana.com/docs/

---

*This documentation covers all environment variables across all ProspectPro builds. Keep this file updated as new features and integrations are added.*