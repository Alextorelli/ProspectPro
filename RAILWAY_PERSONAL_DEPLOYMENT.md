# ProspectPro - Personal Railway Deployment Guide

## Overview

This guide provides a streamlined deployment approach for ProspectPro on Railway, optimized for personal use while maintaining all core business functionality.

## Core Architecture (Simplified)

- **Node.js/Express Server**: Real business data search and lead generation
- **Supabase PostgreSQL**: Managed database with built-in auth and RLS
- **Railway Deployment**: Zero-config production hosting
- **Real API Integrations**: Google Places, Hunter.io, NeverBounce

## Pre-Deployment Checklist

### 1. Environment Variables (Required)

```bash
# Supabase Connection (Primary - use service_role for server operations)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
SUPABASE_ANON_KEY=your_anon_key_here

# Optional: Database direct connection (for debugging)
DATABASE_URL=postgresql://postgres:[password]@db.your-project.supabase.co:5432/postgres

# API Keys for Real Data
GOOGLE_PLACES_API_KEY=your_google_key
HUNTER_IO_API_KEY=your_hunter_key
NEVERBOUNCE_API_KEY=your_neverbounce_key

# Railway Deployment
PORT=3000
ALLOW_DEGRADED_START=true
PERSONAL_ACCESS_TOKEN=your_admin_token_here
```

### 2. API Requirements

- **Google Places API**: $0.032/search - Enable Places API (New)
- **Hunter.io**: 25 free requests/month - Domain search API
- **NeverBounce**: 1000 free verifications/month - Email validation

### 3. Current System Status

✅ **Database**: 5-phase schema complete (enhanced-supabase-schema.sql)
✅ **Server**: Enhanced monitoring with graceful degradation
✅ **APIs**: All real data integrations configured
✅ **Validation**: Zero fake data enforcement
✅ **Monitoring**: Comprehensive health endpoints

## Railway Deployment Steps

### Option 1: One-Click Deploy (Recommended for Personal Use)

```bash
# 1. Fork/clone repository
git clone https://github.com/your-repo/ProspectPro.git
cd ProspectPro

# 2. Connect to Railway
railway login
railway init

# 3. Set environment variables
railway variables set SUPABASE_URL=https://your-project.supabase.co
railway variables set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
railway variables set ALLOW_DEGRADED_START=true
# ... (add other variables)

# 4. Deploy
railway up
```

### Option 2: Manual Configuration

1. **Create Railway Project**: New project from GitHub repo
2. **Set Environment Variables**: Add all required variables in Railway dashboard
3. **Deploy**: Automatic deployment from main branch

## Simplified Architecture Benefits

### Removed Enterprise Complexity

- ❌ Prometheus metrics collection (use Railway's built-in monitoring)
- ❌ Complex logging aggregation (Railway provides logs)
- ❌ Multi-environment orchestration
- ❌ Advanced security hardening (Railway provides base security)

### Retained Core Features

- ✅ **Real Business Data**: Google Places API integration
- ✅ **Data Validation**: Email verification, website validation
- ✅ **Cost Tracking**: Per-lead cost calculation
- ✅ **Quality Scoring**: Confidence-based lead qualification
- ✅ **Export Functionality**: CSV/JSON lead export
- ✅ **Health Monitoring**: `/health`, `/diag`, `/ready` endpoints

## Database Management

### Current Status: READY

Your database is already configured with:

```
✅ enhanced_leads table (main business records)
✅ campaigns table (user session tracking)
✅ api_costs table (cost monitoring)
✅ validation_results table (data quality)
✅ RLS security policies (user isolation)
```

No additional database setup required for Railway deployment.

## Cost Optimization for Personal Use

### Budget-Aware Processing

```javascript
// Built-in cost limits
const PERSONAL_BUDGET_LIMIT = 25.0; // $25/month
const processBusinesses = async (query, location, limit = 10) => {
  // Automatic cost tracking prevents overruns
  if (totalCost >= PERSONAL_BUDGET_LIMIT) {
    throw new Error("Monthly budget limit reached");
  }
  // ... continue processing
};
```

### API Cost Breakdown (Personal Use)

- **Google Places**: ~10 searches/day = $9.60/month
- **Hunter.io**: 25 free searches/month = $0
- **NeverBounce**: 1000 free verifications/month = $0
- **Total**: ~$10/month for moderate usage

## Health & Monitoring

### Built-in Endpoints

- `GET /health` - Quick health check (Railway compatible)
- `GET /diag` - Full system diagnostics
- `GET /ready` - Database connectivity test
- `GET /boot-report` - Startup diagnostics

### Railway Integration

Railway automatically monitors:

- **Uptime**: Service availability
- **Response Time**: Endpoint performance
- **Resource Usage**: CPU/Memory consumption
- **Logs**: Centralized application logs

## Troubleshooting Common Issues

### Database Connection Issues

1. **Check Supabase Status**: https://status.supabase.com/
2. **Verify API Keys**: Use `/diag` endpoint
3. **Test Connection**: Use `/ready` endpoint

### API Rate Limits

1. **Google Places**: Check quota in Google Cloud Console
2. **Hunter.io**: Monitor usage in Hunter dashboard
3. **NeverBounce**: Check remaining credits

### Railway Deployment Issues

1. **Build Logs**: Check Railway deployment logs
2. **Environment Variables**: Ensure all required vars are set
3. **Health Checks**: Railway uses `/health` endpoint

## Security for Personal Use

### Automatic Security Features

- **RLS Policies**: Database-level user isolation
- **API Key Protection**: Server-side only (never exposed to client)
- **Input Validation**: All user inputs validated and sanitized
- **Rate Limiting**: Built-in protection against abuse

### Personal Access Token

Set `PERSONAL_ACCESS_TOKEN` for admin dashboard access:

```
https://your-railway-app.railway.app/admin-dashboard.html?token=your_token
```

## Success Metrics

### Data Quality KPIs

- **Accuracy**: >95% of exported leads verified
- **Website Success**: 100% accessible URLs
- **Email Deliverability**: <5% bounce rate
- **Cost Efficiency**: <$0.50 per qualified lead

### Personal Use Targets

- **10-20 qualified leads/day**
- **Monthly cost under $25**
- **99% uptime on Railway**
- **Sub-2 second response times**

## Next Steps After Deployment

1. **Test All Endpoints**: Verify health, diag, and API endpoints
2. **Run Sample Search**: Test business discovery with real query
3. **Validate Data Export**: Confirm CSV export functionality
4. **Monitor Costs**: Track API usage in first week
5. **Set Up Alerts**: Configure Railway notifications for deployment issues

## Support Resources

- **Railway Docs**: https://docs.railway.app/
- **Supabase Docs**: https://supabase.com/docs
- **ProspectPro Issues**: Use GitHub Issues for bugs
- **API Documentation**: Each provider's official docs

---

This configuration provides a production-ready lead generation platform optimized for personal use, with real business data, cost controls, and Railway-native deployment.
