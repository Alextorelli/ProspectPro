# ProspectPro - Real Business Data Lead Generation Platform# ProspectPro - Real Business Data Lead Generation Platform

## ✨ Overview## ✨ Overview

ProspectPro is a production-ready Node.js/Express lead generation platform with **zero tolerance for fake business data**. Built for Railway deployment with Supabase PostgreSQL backend, it processes real business data through a comprehensive 5-phase validation pipeline.ProspectPro is a production-ready Node.js/Express lead generation platform with **zero tolerance for fake business data**. Built for Railway deployment with Supabase PostgreSQL backend, it processes real business data through a comprehensive 5-phase validation pipeline.

## 🏗️ Architecture## 🏗️ Architecture

### Core Infrastructure### Core Infrastructure

- **Server**: Enhanced Node.js/Express with comprehensive monitoring (`server-enhanced.js`)- **Server**: Enhanced Node.js/Express with comprehensive monitoring (`server-enhanced.js`)

- **Database**: PostgreSQL via Supabase with 5-phase schema architecture- **Database**: PostgreSQL via Supabase with 5-phase schema architecture

- **Deployment**: Railway platform with zero-downtime health checks- **Deployment**: Railway platform with zero-downtime health checks

- **Monitoring**: Comprehensive Prometheus metrics + custom deployment monitoring- **Monitoring**: Comprehensive Prometheus metrics + custom deployment monitoring

### 5-Phase Database Architecture### 5-Phase Database Architecture

1. **Foundation** (`01-database-foundation.sql`): Core infrastructure, campaigns, system settings1. **Foundation** (`01-database-foundation.sql`): Core infrastructure, campaigns, system settings

2. **Leads & Enrichment** (`02-leads-and-enrichment.sql`): Business data with API cost tracking2. **Leads & Enrichment** (`02-leads-and-enrichment.sql`): Business data with API cost tracking

3. **Monitoring & Analytics** (`03-monitoring-and-analytics.sql`): Performance metrics and dashboards3. **Monitoring & Analytics** (`03-monitoring-and-analytics.sql`): Performance metrics and dashboards

4. **Functions & Procedures** (`04-functions-and-procedures.sql`): Business logic and quality scoring4. **Functions & Procedures** (`04-functions-and-procedures.sql`): Business logic and quality scoring

5. **Security & RLS** (`05-security-and-rls.sql`): Row Level Security policies5. **Security & RLS** (`05-security-and-rls.sql`): Row Level Security policies

- **Stage 2**: Contact enrichment via Hunter.io + website scraping

## 🚀 Quick Start- **Stage 3**: Government registry validation (CA SOS, NY SOS, Tax Records)

- **Stage 4**: Email verification + quality scoring (0-100%)

### Development Setup

````bash### 🎯 Multi-Source Data Integration

git clone https://github.com/your-repo/ProspectPro.git

cd ProspectPro- 🌐 **Google Places API** - Primary business discovery

npm install- 📧 **Hunter.io** - Email discovery and verification

cp .env.example .env  # Configure your API keys- ✅ **NeverBounce** - Email deliverability validation

npm run dev           # Starts with nodemon on port 3000- 🏛️ **Government Registries** - Business entity verification (FREE)

```- 🏠 **Property Intelligence** - Address and ownership validation (FREE)

- 🌐 **Website Scraping** - Contact page extraction

### Production Deployment (Railway)

1. Connect your GitHub repository to Railway### 💰 Cost Optimization Features

2. Set environment variables in Railway dashboard:

   - `SUPABASE_URL`- **Pre-validation filtering** reduces expensive API calls by 60%+

   - `SUPABASE_SECRET_KEY` - **Smart budget management** with real-time cost tracking

   - `GOOGLE_PLACES_API_KEY`- **Quality thresholds** prevent low-value lead processing

   - `PERSONAL_ACCESS_TOKEN`- **Free government APIs** maximize validation without cost

3. Deploy automatically via git push- **Bulk processing** optimization for enterprise campaigns



## 📊 Monitoring & Health Checks## 🚀 Quick Start



### Health Endpoints1. **Deploy to Railway** – Refer to the consolidated [Deployment Guide](DEPLOYMENT_GUIDE.md)

- `/health` - Basic health check (Railway monitoring)2. **Configure Supabase** – Set `SUPABASE_URL` (HTTPS) + `SUPABASE_SECRET_KEY` (preferred new format) or `SUPABASE_SERVICE_ROLE_KEY` (legacy)

- `/diag` - Comprehensive system diagnostics  3. **Add API Keys** – Google Places required; others optional but recommended

- `/boot-report` - Detailed boot sequence analysis4. **(Optional) Enable degraded mode** by setting `ALLOW_DEGRADED_START=true` to keep container alive while fixing DB config

- `/system-info` - Full system information5. **Access your app** at `https://your-app.railway.app`

- `/metrics` - Prometheus metrics endpoint6. **Diagnostics**: Visit `/health` (quick) or `/diag` (full) for connection analysis



### Monitoring Features## 📋 What You'll Need

- **Boot Debugging**: 8-phase startup monitoring with timing

- **API Cost Tracking**: Real-time cost monitoring across all services### Free Accounts

- **Service Health**: Automatic health checks for all external APIs

- **Error Tracking**: Structured error logging with categorization- [Railway](https://railway.app) - Web hosting ($5/month after free tier)

- **Performance Metrics**: Response time, memory usage, and throughput monitoring- [Supabase](https://supabase.com) - PostgreSQL database (free tier: 500MB)

- [Google Cloud](https://console.cloud.google.com) - Places API

## 🛡️ Security Features

### Connection & Key Precedence

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



## 🎯 Data Quality Standards| Service           | Cost                           | Free Tier                |

| ----------------- | ------------------------------ | ------------------------ |

### Zero Fake Data Policy| Google Places     | $0.032/search + $0.017/details | $200 monthly credit      |

- No hardcoded business arrays or sample data| Railway Hosting   | $5/month                       | Free hobby plan          |

- All businesses verified through multiple APIs| Supabase Database | Free up to 50MB                | 500MB free               |

- Website accessibility validation (HTTP 200-399 required)| Hunter.io         | $0.04/search                   | 25 searches/month        |

- Email deliverability verification (80%+ confidence)| NeverBounce       | $0.008/verification            | 1000 verifications/month |

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

```bash

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

All API integrations use real services for authentic business data:The complete schema is available in `/database/enhanced-supabase-schema.sql` with comprehensive RLS policies in `/database/rls-security-hardening.sql`.



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



## 📜 License---



MIT License - see LICENSE file for details### Degraded Mode Workflow



## 🤝 Contributing1. Deploy with misconfigured or pending Supabase creds + `ALLOW_DEGRADED_START=true`

2. Hit `/diag` to view: key presence, network reachability, REST auth probe, table probe

1. Fork the repository3. Correct env vars in Railway → redeploy (or just update variables and restart)

2. Create feature branch (`git checkout -b feature/amazing-feature`)4. Once `/health` shows `status: ok`, remove `ALLOW_DEGRADED_START` for stricter future starts

3. Run test suite (`npm test`)

4. Commit changes (`git commit -m 'Add amazing feature'`)### Crash Prevention Enhancements

5. Push to branch (`git push origin feature/amazing-feature`)

6. Open Pull RequestGlobal handlers (`unhandledRejection`, `uncaughtException`) and a heartbeat log every 2 minutes reduce silent failures and aid log-based monitoring.



## 📞 Support**🚀 Ready to generate real leads? Start with the updated [Deployment Guide](DEPLOYMENT_GUIDE.md)**


- **Health Status**: Check `/health` endpoint
- **System Diagnostics**: Visit `/diag` for detailed status
- **Documentation**: See `/archive/old-documentation/` for historical docs
- **Issues**: GitHub Issues for bug reports and feature requests

---

**Built with ❤️ for authentic business data**
````
