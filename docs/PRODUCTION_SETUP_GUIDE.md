# ProspectPro Production Environment Setup Guide

## 🚀 Complete Production Deployment Workflow

### Overview

This guide covers the complete production environment setup for ProspectPro, maintaining security best practices while providing a streamlined deployment experience.

## 📋 Prerequisites

### 1. Repository Secrets Configuration

Configure these secrets in your GitHub repository:

- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SECRET_KEY` - Your Supabase service role key
- `GHP_SECRET` - GitHub Personal Access Token (for workflow triggering)

**Location**: Repository Settings → Secrets and variables → Actions

### 2. Local Environment Setup

```bash
# Set your GitHub token for workflow triggering
export GHP_SECRET="your_github_personal_access_token"
# OR
export GITHUB_TOKEN="your_github_personal_access_token"
```

## 🎯 Production Deployment Methods

### Method 1: Google Cloud Run Deployment (Production Ready)

ProspectPro supports automated deployment to Google Cloud Run with validated CI/CD pipeline:

```bash
# Prerequisites: Google Cloud Platform project setup
# 1. Service Account: prospectpro-deployment@<project-id>.iam.gserviceaccount.com
# 2. Required Permissions: Cloud Run Admin, Cloud Build, Artifact Registry Writer
# 3. Regional Alignment: us-central1 for all resources

# Deployment Process:
# 1. Push to main branch automatically triggers Cloud Build
# 2. Docker image built and pushed to Artifact Registry
# 3. Cloud Run service deployed with production configuration

# Health Check URLs:
# https://prospectpro-<hash>-uc.a.run.app/health
# https://prospectpro-<hash>-uc.a.run.app/diag
```

**Cloud Build Trigger Configuration:**

- **Trigger ID**: `0358b3a4-c7a4-4da9-9610-1e335c4894e0`
- **Repository Connection**: GitHub App (validated)
- **Service Account**: `prospectpro-deployment@leadgen-471822.iam.gserviceaccount.com`
- **Logging**: `CLOUD_LOGGING_ONLY`
- **Build Time**: ~2 minutes 9 seconds
- **Status**: ✅ VALIDATED & OPERATIONAL

### Method 2: Complete Automated Setup (Local/Development)

```bash
# 1. Generate production environment and start server
npm run prod:init

# This will:
# - Trigger GitHub Actions workflow
# - Generate production .env file
# - Validate environment configuration
# - Start production server
```

### Method 2: Manual Environment Setup

```bash
# 1. Generate production environment template
npm run prod:setup-env

# 2. Edit .env file with your real Supabase credentials
# Replace these template values:
# - https://your-project-ref.supabase.co
# - your_service_role_key_here

# 3. Validate configuration
npm run prod:check

# 4. Start production server
npm run prod
```

### Method 3: Use Existing Environment

```bash
# If you already have a valid .env file
npm run prod:start-existing
```

## 🔧 Script Descriptions

### Core Scripts

| Script                   | Purpose                            | Usage                                                        |
| ------------------------ | ---------------------------------- | ------------------------------------------------------------ |
| `npm run prod:init`      | Complete production initialization | Auto-triggers workflow, waits for environment, starts server |
| `npm run prod:setup-env` | Generate production .env template  | Creates production-ready template for manual completion      |
| `npm run prod:check`     | Validate environment readiness     | Checks all configuration and system readiness                |
| `npm run prod`           | Start production server            | Direct production server start with existing config          |

### Support Scripts

| Script                            | Purpose                           | Usage                                    |
| --------------------------------- | --------------------------------- | ---------------------------------------- |
| `npm run prod:init-skip-workflow` | Start without triggering workflow | Uses existing .env, skips GitHub Actions |
| `npm run prod:start-existing`     | Start with existing configuration | Quick start for validated environments   |

## 🔍 Environment Validation Process

The system validates:

### ✅ Required Components

- `.env` file exists with core credentials
- All required environment variables present
- GitHub workflow triggering capability
- Server component functionality

### 🔑 Critical Configuration

- `SUPABASE_URL`: Valid Supabase project URL format
- `SUPABASE_SECRET_KEY`: Valid service role key
- `NODE_ENV`: Set to "production"
- Performance and security settings enabled

### 📊 Production Features

- Prometheus metrics collection
- TTL caching and batch processing
- Circuit breaker and smart routing
- Cost tracking and performance monitoring
- Request validation and rate limiting

## 🛡️ Security Architecture

### Environment File Security

- `.env` file excluded from version control (`.gitignore`)
- Contains sensitive production credentials
- Generated locally or via secure workflow
- Never committed to repository

### API Key Management

- Primary credentials in `.env` file
- Additional API keys loaded from Supabase Vault
- Runtime credential injection
- Graceful degradation for missing optional keys

### Production Hardening

```env
# Production security settings
ALLOW_DEGRADED_START=false
ENABLE_REQUEST_VALIDATION=true
ENABLE_RATE_LIMITING=true
REQUIRE_API_AUTHENTICATION=true
```

## 📊 Monitoring and Health Checks

### Health Endpoints

- `/health` - Fast health check
- `/diag` - Comprehensive diagnostics
- `/ready` - Kubernetes-style readiness probe
- `/metrics` - Prometheus metrics
- `/boot-report` - Server initialization report

### Monitoring Features

- Real-time performance metrics
- Cost tracking and budget alerts
- API usage monitoring
- Error reporting and logging
- Circuit breaker status

## 🚨 Troubleshooting

### Common Issues

#### 1. Invalid API Key Errors

```
❌ Vault access failed: Invalid API key
❌ Supabase connectivity issue: Table probe failed
```

**Solution**: Verify `SUPABASE_SECRET_KEY` in `.env` file

#### 2. Template Values in .env

```
⚠️ .env file contains template values
```

**Solution**: Edit `.env` file with real Supabase credentials

#### 3. Workflow Trigger Failed

```
⚠️ No GitHub token found (GHP_SECRET or GITHUB_TOKEN)
```

**Solution**: Set `GHP_SECRET` environment variable or repository secret

#### 4. Server Won't Start

```
❌ Environment validation failed
```

**Solution**: Run `npm run prod:check` for detailed diagnostics

### Recovery Commands

```bash
# Reset and regenerate environment
rm .env
npm run prod:setup-env

# Validate configuration
npm run prod:check

# Check server health after start
curl http://localhost:3000/health
curl http://localhost:3000/diag
```

## 🎯 Production Deployment Best Practices

### 1. Pre-Deployment Validation

```bash
# Always validate before production deployment
npm run prod:check
```

### 2. Secure Credential Management

- Store secrets in GitHub repository secrets
- Use Supabase Vault for API keys
- Never commit `.env` files
- Regularly rotate credentials

### 3. Monitoring Setup

- Monitor `/health` endpoint
- Set up Prometheus metrics collection
- Configure cost alerts
- Track API usage and budgets

### 4. Deployment Verification

```bash
# After deployment, verify:
curl http://your-domain/health
curl http://your-domain/diag
```

## 📈 Performance Configuration

### Production Optimizations

```env
# High-performance settings
MAX_CONCURRENT_REQUESTS=10
BATCH_SIZE=25
CACHE_TTL_SECONDS=3600
REQUEST_TIMEOUT=30000

# API Rate Limits
GOOGLE_PLACES_RPM=1000
HUNTER_IO_RPM=100
NEVERBOUNCE_RPM=300
```

### Cost Management

```env
# Budget controls
DAILY_BUDGET_LIMIT=100.00
DEFAULT_BUDGET_LIMIT=25.00
PER_LEAD_COST_LIMIT=2.00
COST_ALERT_THRESHOLD=80.00
```

This production setup ensures zero fake data generation, real API integration, and enterprise-grade security while maintaining cost efficiency and operational reliability.
