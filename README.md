# ProspectPro# ProspectPro - Real Business Data Lead Generation Platform# ProspectPro - Real Business Data Lead Generation Platform

🎯 **Production-Ready Lead Generation Platform**## ✨ Overview## ✨ Overview

Railway-deployed Node.js application for real business data discovery and lead generation with zero tolerance for fake information.ProspectPro is a production-ready Node.js/Express lead generation platform with **zero tolerance for fake business data**. Built for Railway deployment with Supabase PostgreSQL backend, it processes real business data through a comprehensive 5-phase validation pipeline.ProspectPro is a production-ready Node.js/Express lead generation platform with **zero tolerance for fake business data**. Built for Railway deployment with Supabase PostgreSQL backend, it processes real business data through a comprehensive 5-phase validation pipeline.

## 🚀 Quick Deploy## 🏗️ Architecture## 🏗️ Architecture

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template)### Core Infrastructure### Core Infrastructure

```bash- **Server**: Enhanced Node.js/Express with comprehensive monitoring (`server-enhanced.js`)- **Server**: Enhanced Node.js/Express with comprehensive monitoring (`server-enhanced.js`)

git clone https://github.com/Alextorelli/ProspectPro.git

cd ProspectPro- **Database**: PostgreSQL via Supabase with 5-phase schema architecture- **Database**: PostgreSQL via Supabase with 5-phase schema architecture

railway login && railway init && railway up

`````- **Deployment**: Railway platform with zero-downtime health checks- **Deployment**: Railway platform with zero-downtime health checks



## ✨ Features- **Monitoring**: Comprehensive Prometheus metrics + custom deployment monitoring- **Monitoring**: Comprehensive Prometheus metrics + custom deployment monitoring



- **Real Business Data**: Google Places API integration### 5-Phase Database Architecture### 5-Phase Database Architecture

- **Email Validation**: Hunter.io + NeverBounce verification

- **Quality Scoring**: Confidence-based lead qualification1. **Foundation** (`01-database-foundation.sql`): Core infrastructure, campaigns, system settings1. **Foundation** (`01-database-foundation.sql`): Core infrastructure, campaigns, system settings

- **Cost Controls**: Built-in budget limits and API quotas

- **Railway Ready**: One-click deployment with health monitoring2. **Leads & Enrichment** (`02-leads-and-enrichment.sql`): Business data with API cost tracking2. **Leads & Enrichment** (`02-leads-and-enrichment.sql`): Business data with API cost tracking



## 🔧 Core Architecture3. **Monitoring & Analytics** (`03-monitoring-and-analytics.sql`): Performance metrics and dashboards3. **Monitoring & Analytics** (`03-monitoring-and-analytics.sql`): Performance metrics and dashboards



- **Backend**: Node.js/Express server4. **Functions & Procedures** (`04-functions-and-procedures.sql`): Business logic and quality scoring4. **Functions & Procedures** (`04-functions-and-procedures.sql`): Business logic and quality scoring

- **Database**: Supabase PostgreSQL with RLS security

- **APIs**: Google Places, Hunter.io, NeverBounce5. **Security & RLS** (`05-security-and-rls.sql`): Row Level Security policies5. **Security & RLS** (`05-security-and-rls.sql`): Row Level Security policies

- **Deployment**: Railway.app with auto-scaling

- **Monitoring**: Built-in health endpoints- **Stage 2**: Contact enrichment via Hunter.io + website scraping



## 📊 Health Endpoints## 🚀 Quick Start- **Stage 3**: Government registry validation (CA SOS, NY SOS, Tax Records)



- `GET /health` - Railway health check- **Stage 4**: Email verification + quality scoring (0-100%)

- `GET /diag` - System diagnostics

- `GET /ready` - Database connectivity### Development Setup



## 🌐 Environment Setup````bash### 🎯 Multi-Source Data Integration



```envgit clone https://github.com/your-repo/ProspectPro.git

SUPABASE_URL=https://your-project.supabase.co

SUPABASE_SERVICE_ROLE_KEY=your-service-role-keycd ProspectPro- 🌐 **Google Places API** - Primary business discovery

GOOGLE_PLACES_API_KEY=your-google-places-key

HUNTER_IO_API_KEY=your-hunter-io-keynpm install- 📧 **Hunter.io** - Email discovery and verification

NEVERBOUNCE_API_KEY=your-neverbounce-key

```cp .env.example .env  # Configure your API keys- ✅ **NeverBounce** - Email deliverability validation



## 💰 Cost Structurenpm run dev           # Starts with nodemon on port 3000- 🏛️ **Government Registries** - Business entity verification (FREE)



- **Google Places**: ~$10/month (moderate usage)```- 🏠 **Property Intelligence** - Address and ownership validation (FREE)

- **Hunter.io**: Free tier (25 searches/month)

- **NeverBounce**: Free tier (1000 verifications/month)- 🌐 **Website Scraping** - Contact page extraction

- **Railway**: Usage-based hosting

### Production Deployment (Railway)

## 📁 Production Structure

1. Connect your GitHub repository to Railway### 💰 Cost Optimization Features

`````

├── api/ # Business discovery routes2. Set environment variables in Railway dashboard:

├── config/ # Database and API configuration

├── database/ # Schema and RLS policies - `SUPABASE_URL`- **Pre-validation filtering** reduces expensive API calls by 60%+

├── modules/ # Core business logic

│ ├── api-clients/ # External API integrations - `SUPABASE_SECRET_KEY` - **Smart budget management** with real-time cost tracking

│ ├── validators/ # Data quality enforcement

│ └── logging/ # Campaign tracking - `GOOGLE_PLACES_API_KEY`- **Quality thresholds** prevent low-value lead processing

├── public/ # Web interface

└── server.js # Production server - `PERSONAL_ACCESS_TOKEN`- **Free government APIs** maximize validation without cost

````

3. Deploy automatically via git push- **Bulk processing** optimization for enterprise campaigns

## 🔍 Data Quality Standards



✅ **Real business names** from Google Places API

✅ **Verifiable addresses** with geocoding validation  ## 📊 Monitoring & Health Checks## 🚀 Quick Start

✅ **Working phone numbers** (no fake 555 patterns)

✅ **Accessible websites** (200-399 HTTP responses)

✅ **Deliverable emails** (80%+ confidence scoring)

### Health Endpoints1. **Deploy to Railway** – Refer to the consolidated [Deployment Guide](DEPLOYMENT_GUIDE.md)

## 📚 Documentation & Development

- `/health` - Basic health check (Railway monitoring)2. **Configure Supabase** – Set `SUPABASE_URL` (HTTPS) + `SUPABASE_SECRET_KEY` (preferred new format) or `SUPABASE_SERVICE_ROLE_KEY` (legacy)

This repository uses a clean branch structure:

- `/diag` - Comprehensive system diagnostics  3. **Add API Keys** – Google Places required; others optional but recommended

- **`main`** - Production code (Railway deployment)

- **`instructions`** - Documentation and guides  - `/boot-report` - Detailed boot sequence analysis4. **(Optional) Enable degraded mode** by setting `ALLOW_DEGRADED_START=true` to keep container alive while fixing DB config

- **`debugging`** - Development tools and diagnostics

- **`testing`** - Test files and validation- `/system-info` - Full system information5. **Access your app** at `https://your-app.railway.app`



```bash- `/metrics` - Prometheus metrics endpoint6. **Diagnostics**: Visit `/health` (quick) or `/diag` (full) for connection analysis

# Access documentation

git checkout instructions



# Development tools  ### Monitoring Features## 📋 What You'll Need

git checkout debugging

- **Boot Debugging**: 8-phase startup monitoring with timing

# Run tests

git checkout testing- **API Cost Tracking**: Real-time cost monitoring across all services### Free Accounts

````

- **Service Health**: Automatic health checks for all external APIs

## 🆘 Support

- **Error Tracking**: Structured error logging with categorization- [Railway](https://railway.app) - Web hosting ($5/month after free tier)

- 📖 **Documentation**: Switch to `instructions` branch

- 🔧 **Troubleshooting**: Switch to `debugging` branch - **Performance Metrics**: Response time, memory usage, and throughput monitoring- [Supabase](https://supabase.com) - PostgreSQL database (free tier: 500MB)

- 🧪 **Testing**: Switch to `testing` branch

- 🐛 **Issues**: Use GitHub Issues- [Google Cloud](https://console.cloud.google.com) - Places API

## 📄 License## 🛡️ Security Features

MIT License - Built for real business data discovery### Connection & Key Precedence

- **Row Level Security**: Multi-tenant data isolation via Supabase RLS

- **Rate Limiting**: API endpoint protection with intelligent backoffEnvironment variables used by the server (in order of selection for Supabase client):

- **Input Validation**: Comprehensive sanitization and validation

- **Authentication**: Token-based API access control1. `SUPABASE_SECRET_KEY` (preferred new secure format: sb*secret*...)

- **Security Headers**: Production-ready security middleware2. `SUPABASE_SERVICE_ROLE_KEY` (legacy service role: eyJ... JWT format)

3. `SUPABASE_ANON_KEY` (fallback / reduced capability)

## 💰 Cost Management4. `SUPABASE_PUBLISHABLE_KEY` (last resort; limited access)

### API Integration CostsRequired: `SUPABASE_URL` must be the HTTPS API root (`https://<ref>.supabase.co`).

- **Google Places**: ~$0.032/search, $0.017/details request

- **Hunter.io**: ~$0.04/domain search (25 free/month)Optional: `SUPABASE_DB_POOLER_URL` only for external raw Postgres tools — NOT used by `supabase-js`.

- **NeverBounce**: ~$0.008/verification (1000 free/month)

- **Scrapingdog**: $0.002/request (1000 free/month)### API Keys (Some Free Tiers Available)

### Budget Controls- **Google Places API** (Required) - ~$0.032 per search

- Real-time cost tracking per campaign- **Hunter.io** (Optional) - Email discovery, 25 free/month

- Automatic budget limit enforcement- **NeverBounce** (Optional) - Email validation, 1000 free/month

- Pre-validation filtering to reduce API waste

- Cost-per-qualified-lead optimization## 💡 Cost Breakdown

## 🎯 Data Quality Standards| Service | Cost | Free Tier |

| ----------------- | ------------------------------ | ------------------------ |

### Zero Fake Data Policy| Google Places | $0.032/search + $0.017/details | $200 monthly credit |

- No hardcoded business arrays or sample data| Railway Hosting | $5/month | Free hobby plan |

- All businesses verified through multiple APIs| Supabase Database | Free up to 50MB | 500MB free |

- Website accessibility validation (HTTP 200-399 required)| Hunter.io | $0.04/search | 25 searches/month |

- Email deliverability verification (80%+ confidence)| NeverBounce | $0.008/verification | 1000 verifications/month |

- Phone number format validation (no 555/000 patterns)

**Estimated cost per qualified lead: $0.08 - $0.15**

### Quality Scoring

- Business Name Verification: 20 points## 🌐 Web Access & Monitoring

- Address Verification: 20 points

- Phone Verification: 25 points### Main Application

- Website Verification: 15 points

- Email Verification: 20 points- **Lead generation interface** with industry/location filters

- **Minimum Export Threshold**: 80 points- **Campaign management** with real-time progress tracking

- **Export tools** for CSV/Excel download

## 🔧 Development Workflows- **Quality scoring** with confidence ratings

### Database Management### Admin Dashboard

````bash

# Initialize complete database schemaProvides cost tracking, budget alerts, quality metrics, and usage analytics.

node database/database-master-setup.js

### 📊 Enhanced Monitoring & Diagnostics

# Run individual phases

node database/database-master-setup.js --phase=1| Endpoint        | Purpose                                           |

node database/database-master-setup.js --test-mode| --------------- | ------------------------------------------------- |

```| `/health`       | Fast JSON status: ok / degraded / error + summary |

| `/diag`         | Full Supabase diagnostics snapshot                |

### Testing & Validation| `/metrics`      | **NEW** Prometheus metrics for monitoring         |

```bash| `/boot-report`  | **NEW** Detailed startup phase diagnostics        |

# Validate zero fake data patterns| `/loop-metrics` | **NEW** Event loop performance metrics            |

node test/test-real-data.js

#### 🔍 Boot Phase Debugging

# Test website accessibility

node test/test-website-validation.jsThe application now includes comprehensive startup instrumentation:



# Integration testing- **Phase tracking** - Monitor each startup phase with timing

node test/test-enhanced-integrations.js- **Error context** - Detailed error reporting with stack traces

```- **Performance metrics** - Startup efficiency and overhead analysis

- **Health reporting** - Real-time boot status with 75%+ success rate

### Production Readiness

```bash#### 📈 Prometheus Metrics

# Security audit

node scripts/security-audit.jsComprehensive business and infrastructure monitoring with 20+ custom metrics:



# Environment validation- **HTTP requests** - Response times, status codes, endpoint usage

node scripts/validate-environment.js- **Supabase operations** - Connection health, query performance, error rates

- **API costs** - Real-time cost tracking across all services

# Deployment readiness check- **Business discovery** - Lead generation rates, qualification success

node scripts/deployment-readiness.js- **Campaign metrics** - User activity, export volumes, search patterns

```- **Security events** - Rate limiting triggers, authentication attempts



## 📁 Project Structure#### 🛡️ Security Hardening



```Enhanced security middleware protecting all endpoints:

ProspectPro/

├── api/                          # API endpoints- **Helmet security headers** - CSRF, XSS, and clickjacking protection

│   ├── business-discovery.js     # Core business discovery logic- **CORS policies** - Controlled cross-origin access

│   ├── export.js                 # Lead export functionality  - **Rate limiting** - 100 requests/15min general, 10/hour for expensive operations

│   └── dashboard-export.js       # Dashboard data exports- **Admin authentication** - Token-based access control

├── config/- **Input validation** - Request sanitization and validation

│   └── supabase.js               # Database configuration

├── database/                     # 5-phase database architectureDegraded mode allows the server to stay online for investigation when the DB is unreachable. Enable by setting `ALLOW_DEGRADED_START=true` before deploy; disable once stable.

│   ├── 01-database-foundation.sql

│   ├── 02-leads-and-enrichment.sql## �️ Database Schema

│   ├── 03-monitoring-and-analytics.sql

│   ├── 04-functions-and-procedures.sqlProspectPro uses a comprehensive PostgreSQL schema with Row Level Security for data isolation:

│   ├── 05-security-and-rls.sql

│   └── database-master-setup.js  # Database orchestration### Core Tables

├── modules/

│   ├── api-clients/              # External API integrations- **`campaigns`** - User lead generation campaigns with cost tracking

│   ├── enrichment/               # Data enrichment algorithms- **`enhanced_leads`** - Discovered businesses with quality scoring (0-100%)

│   ├── logging/                  # Campaign and system logging- **`lead_emails`** - Email addresses found and verified for each lead

│   ├── scrapers/                 # Website and data scrapers- **`lead_social_profiles`** - Social media profiles and contact information

│   ├── validators/               # Data validation and quality scoring- **`system_settings`** - User configuration and preferences

│   ├── deployment-monitor.js     # Comprehensive system monitoring- **`dashboard_exports`** - Export history and file metadata

│   ├── enhanced-lead-discovery.js # Core lead processing engine

│   └── prometheus-metrics.js     # Performance metrics system### Analytics & Monitoring

├── public/                       # Frontend dashboard

│   ├── index.html               # Main campaign interface- **`api_usage_log`** - API call tracking with cost attribution

│   ├── admin-dashboard.html     # Administrative dashboard- **`api_cost_tracking`** - Real-time cost monitoring and budget management

│   └── business-dashboard.html  # Business intelligence dashboard- **`campaign_analytics`** - Performance metrics and success rates

├── scripts/                     # Utility and management scripts- **`lead_qualification_metrics`** - Quality scoring and validation results

├── test/                       # Test suites and validation- **`service_health_metrics`** - System monitoring and uptime tracking

├── server-enhanced.js          # Enhanced server with full monitoring

├── server.js                   # Production server### Security Features

└── railway.toml               # Railway deployment configuration

```- **Row Level Security (RLS)** enabled on all tables with user isolation

- **Campaign ownership** access control - users only see their own data

## 🌐 API Integration- **Indexed policies** for optimal query performance

- **Secure functions** with SECURITY DEFINER for controlled access

### Required API Keys

All API integrations use real services for authentic business data. The complete schema is provided in `/database/all-phases-consolidated.sql` with security hardening and RLS in the same file. Validate with `/database/VALIDATION_QUERIES.sql`.



- **Google Places API**: Business discovery and location data## �📊 Business Metrics

- **Hunter.io**: Email discovery and domain search

- **NeverBounce**: Email deliverability verificationTrack your lead generation performance:

- **Scrapingdog**: Website content extraction

- **Total leads generated** with quality filtering

### Rate Limiting & Error Handling- **API costs breakdown** by service

- Exponential backoff for rate-limited APIs- **Success rates** and lead qualification percentages

- Graceful degradation when services are unavailable- **Cost per lead** optimization tracking

- Comprehensive error logging and recovery- **Budget usage** with automatic alerts

- Budget-aware request management

## 🔐 Enhanced Security & Compliance

## 📈 Performance Optimization

- ✅ **No hardcoded secrets** - All credentials via environment variables

### Caching Strategy- ✅ **Modern Supabase API keys** - Uses new secure `sb_secret_` format

- Google Places results cached for 1 hour- ✅ **Row Level Security** - Comprehensive RLS policies for zero-trust isolation

- Business validation results cached per campaign- ✅ **Token authentication** - Secure admin dashboard access

- API rate limit status tracking- ✅ **HTTPS only** - All traffic encrypted

- Optimized database queries with proper indexing- ✅ **Railway compliance** - Modern security best practices

- ✅ **Security middleware** - Helmet headers, CORS, rate limiting

### Scalability Features- ✅ **Input validation** - Request sanitization and XSS protection

- Horizontal scaling via Railway replicas- ✅ **Authentication hardening** - Admin token validation with rate limits

- Database connection pooling via Supabase

- Background job processing for large campaigns### 🛡️ Row Level Security (RLS)

- Memory-efficient streaming for exports

Complete zero-trust user isolation with:

## 🔍 Dashboard & Analytics

- **User-scoped policies** - All data isolated by authenticated user ID

### Real-time Metrics- **Campaign ownership** - Users can only access their own campaigns

- Campaign progress and qualification rates- **Lead privacy** - Business data restricted to campaign owners

- API costs and budget utilization- **Admin separation** - Administrative functions require special privileges

- Service health and response times- **Performance optimization** - Indexed RLS policies for query efficiency

- Lead quality distribution

## 📚 Documentation

### Business Intelligence

- Cost-per-qualified-lead analysis- **[Deployment Guide](DEPLOYMENT_GUIDE.md)** - Complete setup instructions

- API service breakdown and optimization- **[Security Guide](SECURITY.md)** - Comprehensive security features and RLS implementation

- Geographic lead distribution- **[Monitoring Guide](MONITORING.md)** - Prometheus metrics and observability

- Industry-specific qualification patterns- **Admin Dashboard** - Access at `/admin-dashboard.html?token=YOUR_TOKEN`

- **API Documentation** - Built-in at `/api/docs`

### Export Capabilities

- CSV/JSON export with custom filtering## �️ Support

- Campaign-specific data exports

- Dashboard analytics exports### Self-Service Options

- Automated export scheduling

- **Railway Dashboard** - View logs, metrics, and deployment status

## 🛠️ Troubleshooting- **Supabase Dashboard** - Database management and monitoring

- **Admin Dashboard** - Real-time cost and performance metrics

### Common Issues

1. **"relation 'campaigns' does not exist"**: Run `node database/database-master-setup.js`### No Command Line Required

2. **502 errors on Railway**: Check health endpoint `/health`

3. **API budget exceeded**: Review cost tracking in dashboardEverything can be managed through web interfaces - no need to run terminal commands or local development environment.

4. **Supabase connection issues**: Verify credentials and network access

## 📈 Scaling

### Debug Tools

- `/diag` endpoint for comprehensive system status- **Railway auto-scaling** - Handles traffic spikes automatically

- Boot sequence logging for startup issues  - **Supabase scaling** - Database grows with your usage

- Prometheus metrics for performance analysis- **API rate limiting** - Built-in protection against overuse

- Structured logging for error investigation- **Cost controls** - Budget alerts and usage monitoring



# ProspectPro – Real Business Data Lead Generation

ProspectPro is a production-ready Node.js/Express platform with zero tolerance for fake business data. It uses real APIs (Google Places, website scraping, email verification) and a Supabase PostgreSQL backend with strict RLS.

## Quick Start

1) Clone and install

```powershell
git clone https://github.com/Alextorelli/ProspectPro.git
cd ProspectPro
npm install
cp .env.example .env
```

2) Configure environment variables in `.env`

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SECRET_KEY=sb_secret_...
GOOGLE_PLACES_API_KEY=...
HUNTER_IO_API_KEY=...
NEVERBOUNCE_API_KEY=...
PERSONAL_ACCESS_TOKEN=...
```

3) Start locally

```powershell
npm run dev
```

## Database Setup (Supabase)

- Preferred: run `database/all-phases-consolidated.sql` once in the Supabase SQL editor.
- Then run `database/VALIDATION_QUERIES.sql` to verify extensions, domains, tables, triggers, functions, MV, and RLS.

Detailed UI walkthrough with screenshots: see `docs/DB-SETUP.md`.

Important Supabase SQL editor constraints used by our scripts:
- Domains are created via guarded DO/EXECUTE blocks instead of `CREATE DOMAIN IF NOT EXISTS`.
- No `CREATE INDEX CONCURRENTLY` (single-transaction editor).
- Geospatial uses `geography(Point,4326)` with GIST indexes.
- The `campaign_analytics.timestamp_date` field is maintained by a trigger; use it for date filters instead of `DATE(timestamp)` expression indexes.

If you prefer phased setup, execute `01-05` in order from `database/`.

## Health Endpoints

- `GET /health` – Fast Railway health check
- `GET /diag` – Full Supabase diagnostics and environment analysis
- `GET /ready` – Readiness probe (requires DB)

## Data Quality Standards

- Real business discovery via Google Places
- Website must return HTTP 200–399
- Email deliverability confidence ≥ 80%
- Exclude fake phone patterns (555/000/111)
- Zero hardcoded business data – all sources are real APIs

## Cost Management

- Budget-aware processing with per-request cost tracking
- Optimized API usage (pre-validation scoring, quotas, backoff)

## Project Structure

```
ProspectPro/
├── api/                    # API endpoints
├── config/                 # Supabase and API config
├── database/               # SQL schema, RLS policies, validation
├── modules/                # Core logic, API clients, validators
├── public/                 # Frontend dashboard
├── server.js               # Production server
└── server-enhanced.js      # Extended diagnostics/metrics
```

## Deployment (Railway)

1) Connect repo to Railway and set environment variables:
		- `SUPABASE_URL`, `SUPABASE_SECRET_KEY`
		- `GOOGLE_PLACES_API_KEY`, `HUNTER_IO_API_KEY`, `NEVERBOUNCE_API_KEY`
		- Optional: `ALLOW_DEGRADED_START=true` for initial debugging
2) Deploy; check `/health` and `/diag` for status

## Security

- Supabase Row Level Security across all tables
- Token-protected admin dashboard (`/admin-dashboard.html?token=...`)
- Secure headers, CORS, rate limiting

## Monitoring

- Prometheus metrics at `/metrics`
- Boot report at `/boot-report`; event loop metrics at `/loop-metrics`

## Testing

```powershell
node tests/validation/test-real-data.js
node tests/validation/test-website-validation.js
```

## License

MIT

## Dev Drive Setup and Branch Workflow (Windows)

Recommended layout for coding on your Dev Drive, with clean deployments from `main` to Lovable/Supabase.

```powershell
# 1) Clone to your Dev Drive
cd D:\APPS
git clone https://github.com/Alextorelli/ProspectPro.git
cd ProspectPro

# 2) Install dependencies
npm ci

# 3) Create a local dev env file
Copy-Item .env.example .env

# 4) Work on a feature branch (avoid committing directly to main)
git checkout -b feat/edge-functions

# 5) Run the Node server locally
npm run dev

# 6) Merge to main only after tests pass
git checkout main
git merge --no-ff feat/edge-functions
git push origin main
```

Branch purpose:

- `main`: Production-ready code that deploys to Lovable frontend + Supabase backend
- Feature branches (e.g., `feat/*`, `fix/*`): Active development isolated from production
- Optional: `testing`, `debugging`, `instructions` for specialized workflows

## Supabase Edge Functions – Local Dev (Windows PowerShell)

If you use Supabase Edge Functions (recommended for Lovable + Supabase architecture), you can run them locally:

```powershell
# From the repo root, serve functions without JWT during local dev
supabase functions serve diag --no-verify-jwt
supabase functions serve business-discovery --no-verify-jwt
supabase functions serve lead-enrichment --no-verify-jwt

# Invoke from Supabase CLI (example)
supabase functions invoke diag --no-verify-jwt --body '{"ping": true}'
```

Environment variables for functions should be configured in Supabase Project Settings → Functions, not in `.env`.
````
