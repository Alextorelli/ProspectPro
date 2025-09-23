# ProspectPro Production Deployment Guide v3.0

## Production Architecture Overview

ProspectPro v3.0 implements a **zero-degradation, fail-fast** production architecture that enforces strict data quality standards and secure API key management through Supabase Vault integration.

## Key Features

- ✅ **Zero Fake Data Policy**: Never generates placeholder or fake business data
- ✅ **Supabase Vault Integration**: Secure API key management with encryption
- ✅ **Fail-Fast Initialization**: Comprehensive validation before startup
- ✅ **Production Logging**: Detailed startup logs for troubleshooting
- ✅ **Multi-Source Lead Discovery**: Google Places + Foursquare APIs with validation
- ✅ **Real-Time Cost Tracking**: Budget management and API usage monitoring

## Production Requirements

### 1. Database Configuration

**Required Tables** (auto-created via consolidated SQL):

- `campaigns` - Campaign management
- `enhanced_leads` - Business data with confidence scoring
- `system_settings` - User configurations
- `api_cost_tracking` - Cost monitoring
- `campaign_analytics` - Performance metrics

**Vault Configuration**:

- Supabase Vault extension enabled
- API keys stored encrypted in `vault.secrets`
- Service role permissions configured

### 2. Environment Variables

**Critical** (Production startup will fail without these):

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SECRET_KEY=your_service_role_key
NODE_ENV=production
PORT=3000
```

**API Keys** (Loaded from Supabase Vault):

- `GOOGLE_PLACES_API_KEY` - **CRITICAL** (Production requires this)
- `FOURSQUARE_API_KEY` - Enhanced discovery
- `HUNTER_IO_API_KEY` - Email discovery
- `NEVERBOUNCE_API_KEY` - Email validation

### 3. GitHub Actions Setup

**Repository Secrets**:

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SECRET_KEY=your_service_role_key
GHP_TOKEN=your_github_personal_access_token
```

## Production Deployment Process

### Option A: GitHub Actions Deployment (Recommended)

```bash
# 1. Trigger environment generation workflow
./scripts/init-prod-server.sh
```

The script will:

1. ✅ Trigger GitHub Actions workflow to generate production environment
2. ✅ Download encrypted environment from workflow artifacts
3. ✅ Validate database configuration and vault setup
4. ✅ Perform comprehensive system validation
5. ✅ Start production server with full monitoring

### Option B: Manual Deployment

```bash
# 1. Set up environment variables
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_SECRET_KEY="your_service_role_key"
export NODE_ENV="production"

# 2. Validate database
node scripts/validate-production-database.js

# 3. Start production server
node server-production.js
```

## Database Setup

### 1. Run Consolidated Schema

In Supabase SQL Editor, execute:

```sql
-- Run this file: database/all-phases-consolidated.sql
-- This creates all required tables, functions, and security policies
```

### 2. Configure Supabase Vault

```sql
-- Enable vault extension
CREATE EXTENSION IF NOT EXISTS "vault" WITH SCHEMA "vault";

-- Run vault setup
-- Execute: database/08-enable-supabase-vault.sql
```

### 3. Set API Keys in Vault

Via Supabase Dashboard → Settings → Vault:

1. **GOOGLE_PLACES_API_KEY**: `your_actual_google_places_key`
2. **FOURSQUARE_API_KEY**: `your_actual_foursquare_key`
3. **HUNTER_IO_API_KEY**: `your_actual_hunter_key`
4. **NEVERBOUNCE_API_KEY**: `your_actual_neverbounce_key`

## Production Server Architecture

### Initialization Sequence

1. **Environment Validation** (30s timeout)

   - Validates all required environment variables
   - Checks Supabase URL format
   - Ensures NODE_ENV=production

2. **Database Connection & Vault Loading**

   - Establishes Supabase client connection
   - Tests database connectivity
   - Loads API keys from Supabase Vault
   - Validates critical API keys are configured

3. **Express Server Setup**

   - Configures security headers
   - Sets up request logging
   - Loads API route modules
   - Implements error boundaries

4. **Health Endpoints**
   - `/health` - Basic server status
   - `/ready` - Kubernetes readiness probe
   - `/diag` - Comprehensive diagnostics

### Production Logging

All startup events are logged to:

- **Console**: Real-time status updates
- **File**: `production-startup.log` with detailed diagnostics

Log includes:

- Environment validation results
- Database connection status
- API key loading from vault
- Module loading success/failure
- Performance metrics

## Troubleshooting

### Common Issues

**1. Database Connection Failed**

```
❌ Database connection failed: PGRST301
```

**Solution**: Check `SUPABASE_URL` and `SUPABASE_SECRET_KEY` are correct

**2. Vault Extension Not Available**

```
⚠️ Supabase Vault extension not available
```

**Solution**: Run vault setup SQL or use app_secrets table fallback

**3. Critical API Key Missing**

```
❌ Critical API key missing: GOOGLE_PLACES_API_KEY
```

**Solution**: Configure in Supabase Dashboard → Settings → Vault

**4. Module Load Failure**

```
❌ Failed to load Business Discovery API
```

**Solution**: Check dependencies in package.json and module exports

### Debug Commands

```bash
# Validate database configuration
node scripts/validate-production-database.js

# Check environment variables
node -e "console.log({
  SUPABASE_URL: !!process.env.SUPABASE_URL,
  SUPABASE_SECRET_KEY: !!process.env.SUPABASE_SECRET_KEY,
  NODE_ENV: process.env.NODE_ENV
})"

# Test Supabase connection
node -e "
const { testConnection } = require('./config/supabase');
testConnection().then(r => console.log(JSON.stringify(r, null, 2)))
"
```

### Log Files

- `production-startup.log` - Server initialization log
- `database-validation.log` - Database validation results

## Production vs Development

| Feature          | Development           | Production               |
| ---------------- | --------------------- | ------------------------ |
| Error Handling   | Graceful degradation  | Fail-fast                |
| API Keys         | Environment variables | Supabase Vault           |
| Logging          | Console only          | Console + File           |
| Validation       | Basic checks          | Comprehensive validation |
| Timeouts         | Relaxed               | Strict (30s startup)     |
| Security Headers | Optional              | Enforced                 |
| CORS             | Permissive            | Disabled                 |

## Performance Expectations

**Startup Time**: < 30 seconds
**Database Test**: < 5 seconds
**API Key Loading**: < 10 seconds
**Memory Usage**: ~150MB base
**Response Time**: < 200ms for /health

## Security Considerations

1. **API Keys**: Encrypted in Supabase Vault, never in environment
2. **Database**: Row Level Security policies enforced
3. **HTTP**: Security headers set, HTTPS enforced
4. **Logging**: Sensitive data redacted from logs
5. **Error Messages**: Generic in production, detailed in development

---

## Quick Start Commands

```bash
# Production deployment with GitHub Actions
./scripts/init-prod-server.sh

# Validate database before deployment
node scripts/validate-production-database.js

# Manual production startup
NODE_ENV=production node server-production.js

# Health check
curl http://localhost:3000/health

# Full diagnostics
curl http://localhost:3000/diag
```

---

**ProspectPro v3.0** - Production-Grade Lead Generation Platform  
Zero fake data, real business leads, enterprise-ready architecture.
