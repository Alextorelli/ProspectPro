# 🎯 ProspectPro - Enhanced Multi-Source Lead Generation Platform

**Zero fake data. Real business intelligence. 4-stage validation pipeline.**

ProspectPro is a premium lead generation platform that discovers and validates real businesses through multiple data sources including Google Places API, government registries, email verification services, and property intelligence. Built for cost efficiency with smart pre-validation filtering.

## ✨ Enhanced Features

### 🔍 4-Stage Discovery Pipeline

- **Stage 1**: Business discovery via Google Places + Yellow Pages
- **Stage 2**: Contact enrichment via Hunter.io + website scraping
- **Stage 3**: Government registry validation (CA SOS, NY SOS, Tax Records)
- **Stage 4**: Email verification + quality scoring (0-100%)

### 🎯 Multi-Source Data Integration

- 🌐 **Google Places API** - Primary business discovery
- 📧 **Hunter.io** - Email discovery and verification
- ✅ **NeverBounce** - Email deliverability validation
- 🏛️ **Government Registries** - Business entity verification (FREE)
- 🏠 **Property Intelligence** - Address and ownership validation (FREE)
- 🌐 **Website Scraping** - Contact page extraction

### 💰 Cost Optimization Features

- **Pre-validation filtering** reduces expensive API calls by 60%+
- **Smart budget management** with real-time cost tracking
- **Quality thresholds** prevent low-value lead processing
- **Free government APIs** maximize validation without cost
- **Bulk processing** optimization for enterprise campaigns

## 🚀 Quick Start

1. **Deploy to Railway** – Refer to the consolidated [Deployment Guide](DEPLOYMENT_GUIDE.md)
2. **Configure Supabase** – Set `SUPABASE_URL` (HTTPS) + `SUPABASE_SECRET_KEY` (preferred new format) or `SUPABASE_SERVICE_ROLE_KEY` (legacy)
3. **Add API Keys** – Google Places required; others optional but recommended
4. **(Optional) Enable degraded mode** by setting `ALLOW_DEGRADED_START=true` to keep container alive while fixing DB config
5. **Access your app** at `https://your-app.railway.app`
6. **Diagnostics**: Visit `/health` (quick) or `/diag` (full) for connection analysis

## 📋 What You'll Need

### Free Accounts

- [Railway](https://railway.app) - Web hosting ($5/month after free tier)
- [Supabase](https://supabase.com) - PostgreSQL database (free tier: 500MB)
- [Google Cloud](https://console.cloud.google.com) - Places API

### Connection & Key Precedence

Environment variables used by the server (in order of selection for Supabase client):

1. `SUPABASE_SECRET_KEY` (preferred new secure format: sb*secret*...)
2. `SUPABASE_SERVICE_ROLE_KEY` (legacy service role: eyJ... JWT format)
3. `SUPABASE_ANON_KEY` (fallback / reduced capability)
4. `SUPABASE_PUBLISHABLE_KEY` (last resort; limited access)

Required: `SUPABASE_URL` must be the HTTPS API root (`https://<ref>.supabase.co`).

Optional: `SUPABASE_DB_POOLER_URL` only for external raw Postgres tools — NOT used by `supabase-js`.

### API Keys (Some Free Tiers Available)

- **Google Places API** (Required) - ~$0.032 per search
- **Hunter.io** (Optional) - Email discovery, 25 free/month
- **NeverBounce** (Optional) - Email validation, 1000 free/month

## 💡 Cost Breakdown

| Service           | Cost                           | Free Tier                |
| ----------------- | ------------------------------ | ------------------------ |
| Google Places     | $0.032/search + $0.017/details | $200 monthly credit      |
| Railway Hosting   | $5/month                       | Free hobby plan          |
| Supabase Database | Free up to 50MB                | 500MB free               |
| Hunter.io         | $0.04/search                   | 25 searches/month        |
| NeverBounce       | $0.008/verification            | 1000 verifications/month |

**Estimated cost per qualified lead: $0.08 - $0.15**

## 🌐 Web Access & Monitoring

### Main Application

- **Lead generation interface** with industry/location filters
- **Campaign management** with real-time progress tracking
- **Export tools** for CSV/Excel download
- **Quality scoring** with confidence ratings

### Admin Dashboard

Provides cost tracking, budget alerts, quality metrics, and usage analytics.

### 📊 Enhanced Monitoring & Diagnostics

| Endpoint        | Purpose                                           |
| --------------- | ------------------------------------------------- |
| `/health`       | Fast JSON status: ok / degraded / error + summary |
| `/diag`         | Full Supabase diagnostics snapshot                |
| `/metrics`      | **NEW** Prometheus metrics for monitoring         |
| `/boot-report`  | **NEW** Detailed startup phase diagnostics        |
| `/loop-metrics` | **NEW** Event loop performance metrics            |

#### 🔍 Boot Phase Debugging

The application now includes comprehensive startup instrumentation:

- **Phase tracking** - Monitor each startup phase with timing
- **Error context** - Detailed error reporting with stack traces
- **Performance metrics** - Startup efficiency and overhead analysis
- **Health reporting** - Real-time boot status with 75%+ success rate

#### 📈 Prometheus Metrics

Comprehensive business and infrastructure monitoring with 20+ custom metrics:

- **HTTP requests** - Response times, status codes, endpoint usage
- **Supabase operations** - Connection health, query performance, error rates
- **API costs** - Real-time cost tracking across all services
- **Business discovery** - Lead generation rates, qualification success
- **Campaign metrics** - User activity, export volumes, search patterns
- **Security events** - Rate limiting triggers, authentication attempts

#### 🛡️ Security Hardening

Enhanced security middleware protecting all endpoints:

- **Helmet security headers** - CSRF, XSS, and clickjacking protection
- **CORS policies** - Controlled cross-origin access
- **Rate limiting** - 100 requests/15min general, 10/hour for expensive operations
- **Admin authentication** - Token-based access control
- **Input validation** - Request sanitization and validation

Degraded mode allows the server to stay online for investigation when the DB is unreachable. Enable by setting `ALLOW_DEGRADED_START=true` before deploy; disable once stable.

## �️ Database Schema

ProspectPro uses a comprehensive PostgreSQL schema with Row Level Security for data isolation:

### Core Tables

- **`campaigns`** - User lead generation campaigns with cost tracking
- **`enhanced_leads`** - Discovered businesses with quality scoring (0-100%)
- **`lead_emails`** - Email addresses found and verified for each lead
- **`lead_social_profiles`** - Social media profiles and contact information
- **`system_settings`** - User configuration and preferences
- **`dashboard_exports`** - Export history and file metadata

### Analytics & Monitoring

- **`api_usage_log`** - API call tracking with cost attribution
- **`api_cost_tracking`** - Real-time cost monitoring and budget management
- **`campaign_analytics`** - Performance metrics and success rates
- **`lead_qualification_metrics`** - Quality scoring and validation results
- **`service_health_metrics`** - System monitoring and uptime tracking

### Security Features

- **Row Level Security (RLS)** enabled on all tables with user isolation
- **Campaign ownership** access control - users only see their own data
- **Indexed policies** for optimal query performance
- **Secure functions** with SECURITY DEFINER for controlled access

The complete schema is available in `/database/enhanced-supabase-schema.sql` with comprehensive RLS policies in `/database/rls-security-hardening.sql`.

## �📊 Business Metrics

Track your lead generation performance:

- **Total leads generated** with quality filtering
- **API costs breakdown** by service
- **Success rates** and lead qualification percentages
- **Cost per lead** optimization tracking
- **Budget usage** with automatic alerts

## 🔐 Enhanced Security & Compliance

- ✅ **No hardcoded secrets** - All credentials via environment variables
- ✅ **Modern Supabase API keys** - Uses new secure `sb_secret_` format
- ✅ **Row Level Security** - Comprehensive RLS policies for zero-trust isolation
- ✅ **Token authentication** - Secure admin dashboard access
- ✅ **HTTPS only** - All traffic encrypted
- ✅ **Railway compliance** - Modern security best practices
- ✅ **Security middleware** - Helmet headers, CORS, rate limiting
- ✅ **Input validation** - Request sanitization and XSS protection
- ✅ **Authentication hardening** - Admin token validation with rate limits

### 🛡️ Row Level Security (RLS)

Complete zero-trust user isolation with:

- **User-scoped policies** - All data isolated by authenticated user ID
- **Campaign ownership** - Users can only access their own campaigns
- **Lead privacy** - Business data restricted to campaign owners
- **Admin separation** - Administrative functions require special privileges
- **Performance optimization** - Indexed RLS policies for query efficiency

## 📚 Documentation

- **[Deployment Guide](DEPLOYMENT_GUIDE.md)** - Complete setup instructions
- **[Security Guide](SECURITY.md)** - Comprehensive security features and RLS implementation
- **[Monitoring Guide](MONITORING.md)** - Prometheus metrics and observability
- **Admin Dashboard** - Access at `/admin-dashboard.html?token=YOUR_TOKEN`
- **API Documentation** - Built-in at `/api/docs`

## �️ Support

### Self-Service Options

- **Railway Dashboard** - View logs, metrics, and deployment status
- **Supabase Dashboard** - Database management and monitoring
- **Admin Dashboard** - Real-time cost and performance metrics

### No Command Line Required

Everything can be managed through web interfaces - no need to run terminal commands or local development environment.

## 📈 Scaling

- **Railway auto-scaling** - Handles traffic spikes automatically
- **Supabase scaling** - Database grows with your usage
- **API rate limiting** - Built-in protection against overuse
- **Cost controls** - Budget alerts and usage monitoring

---

### Degraded Mode Workflow

1. Deploy with misconfigured or pending Supabase creds + `ALLOW_DEGRADED_START=true`
2. Hit `/diag` to view: key presence, network reachability, REST auth probe, table probe
3. Correct env vars in Railway → redeploy (or just update variables and restart)
4. Once `/health` shows `status: ok`, remove `ALLOW_DEGRADED_START` for stricter future starts

### Crash Prevention Enhancements

Global handlers (`unhandledRejection`, `uncaughtException`) and a heartbeat log every 2 minutes reduce silent failures and aid log-based monitoring.

**🚀 Ready to generate real leads? Start with the updated [Deployment Guide](DEPLOYMENT_GUIDE.md)**
