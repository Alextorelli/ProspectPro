# ProspectPro Complete Environment Variables Documentation

## Overview

This document provides comprehensive documentation for ALL environment variables used across all builds of ProspectPro, including monitoring, dashboard integration, and production deployment configurations.

## Core API Configuration

### Google Places API
```env
# Required for business discovery
GOOGLE_PLACES_API_KEY=your_google_places_api_key_here
# Cost: ~$0.032 per search, $0.017 per details request
```

### Email Discovery & Verification
```env
# Hunter.io for email discovery
HUNTER_API_KEY=your_hunter_api_key_here
# Cost: $49/month for 1,000 searches, $99/month for 5,000 searches

# NeverBounce for email verification
NEVERBOUNCE_API_KEY=your_neverbounce_api_key_here  
# Cost: $0.008 per verification, 1000 free verifications/month
```

### Web Scraping
```env
# ScrapingDog for advanced web scraping
SCRAPINGDOG_API_KEY=your_scrapingdog_api_key_here
# Cost: $5/month for 1,000 requests, $25/month for 10,000 requests

# Alternative: ScrapingBee
SCRAPINGBEE_API_KEY=your_scrapingbee_api_key_here
# Cost: $29/month for 1,000 requests
```

## Database Configuration

### Supabase Database
```env
# Primary database for lead storage and analytics
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# Database connection settings
DATABASE_URL=postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres
DB_HOST=db.your-project-ref.supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=your_database_password_here
```

## Monitoring & Analytics

### Dashboard Configuration
```env
# Grafana Dashboard Integration
GRAFANA_URL=https://yourusername.grafana.net
GRAFANA_API_TOKEN=your_grafana_api_token_here
GRAFANA_ORG_ID=1

# Dashboard refresh intervals (seconds)
METRICS_COLLECTION_INTERVAL=60
HEALTH_CHECK_INTERVAL=300
DASHBOARD_REFRESH_INTERVAL=30
```

### Real-time Monitoring
```env
# WebSocket configuration for real-time updates
ENABLE_REALTIME_MONITORING=true
WEBSOCKET_PORT=8080
WEBSOCKET_HEARTBEAT_INTERVAL=30000

# Alert thresholds
COST_ALERT_THRESHOLD=50.00
QUALIFICATION_RATE_ALERT=70
API_ERROR_RATE_THRESHOLD=5
```

## Production Deployment

### Railway Configuration
```env
# Railway deployment settings
RAILWAY_ENVIRONMENT=production
RAILWAY_PROJECT_NAME=prospectpro-real-api
PORT=3000

# Public URL for API callbacks
PUBLIC_URL=https://your-railway-app.up.railway.app
```

### Server Configuration
```env
# Application settings
NODE_ENV=production
SERVER_PORT=3000
API_BASE_URL=/api
STATIC_FILES_PATH=./public

# CORS settings
CORS_ORIGIN=https://your-domain.com
ALLOWED_ORIGINS=https://your-domain.com,https://your-railway-app.up.railway.app
```

## Application Limits & Controls

### Cost Management
```env
# Daily spending limits
DAILY_COST_LIMIT=50.00
COST_PER_LEAD_LIMIT=2.00
WEEKLY_BUDGET_LIMIT=300.00
MONTHLY_BUDGET_LIMIT=1200.00

# API quota management
MAX_GOOGLE_PLACES_CALLS_PER_DAY=1000
MAX_HUNTER_CALLS_PER_DAY=100
MAX_SCRAPINGDOG_CALLS_PER_DAY=500
```

### Quality Controls
```env
# Lead qualification settings
MIN_CONFIDENCE_THRESHOLD=80
QUALIFICATION_RATE_THRESHOLD=70
EMAIL_VERIFICATION_ENABLED=true
WEBSITE_VALIDATION_ENABLED=true

# Campaign limits
MAX_LEADS_PER_CAMPAIGN=50
MAX_CAMPAIGNS_PER_DAY=10
MAX_CONCURRENT_CAMPAIGNS=3
```

## Security & Authentication

### API Security
```env
# JWT configuration (if implementing authentication)
JWT_SECRET=your_super_secure_jwt_secret_here
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Rate limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Data Protection
```env
# Encryption keys for sensitive data
DATA_ENCRYPTION_KEY=your_32_character_encryption_key
PII_ENCRYPTION_ENABLED=true

# Data retention policies
LEAD_DATA_RETENTION_DAYS=90
LOG_RETENTION_DAYS=30
ANALYTICS_DATA_RETENTION_DAYS=365
```

## Logging & Debugging

### Application Logging
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

### Error Tracking
```env
# Sentry integration (optional)
SENTRY_DSN=your_sentry_dsn_here
SENTRY_ENVIRONMENT=production
SENTRY_SAMPLE_RATE=0.1

# Error notification settings
EMAIL_NOTIFICATIONS_ENABLED=true
SLACK_WEBHOOK_URL=your_slack_webhook_url
```

## Feature Flags

### Optional Features
```env
# Social media integration (future)
LINKEDIN_INTEGRATION_ENABLED=false
FACEBOOK_INTEGRATION_ENABLED=false
TWITTER_INTEGRATION_ENABLED=false

# Advanced features
AI_LEAD_SCORING_ENABLED=false
BATCH_PROCESSING_ENABLED=true
ADVANCED_ANALYTICS_ENABLED=true
```

### Experimental Features
```env
# Beta features
BETA_FEATURES_ENABLED=false
EXPERIMENTAL_SCRAPING=false
ML_CONFIDENCE_SCORING=false
```

## Development & Testing

### Development Environment
```env
# Development overrides
NODE_ENV=development
DEBUG=true
HOT_RELOAD_ENABLED=true
MOCK_APIS_ENABLED=false

# Test database
TEST_DATABASE_URL=postgresql://localhost:5432/prospectpro_test
```

### Testing Configuration
```env
# Test API keys (use test/sandbox keys)
TEST_GOOGLE_PLACES_API_KEY=test_key_here
TEST_HUNTER_API_KEY=test_key_here
TEST_SCRAPINGDOG_API_KEY=test_key_here

# Testing settings
RUN_INTEGRATION_TESTS=true
MOCK_EXTERNAL_APIS=false
TEST_TIMEOUT_MS=30000
```

## Environment File Examples

### .env.production
```env
# Production Environment Configuration
NODE_ENV=production
PORT=3000

# API Keys (Production)
GOOGLE_PLACES_API_KEY=AIza...
HUNTER_API_KEY=e1b2c3d4...
SCRAPINGDOG_API_KEY=sdapi-abc123...
NEVERBOUNCE_API_KEY=secret_live_...

# Database (Production)
SUPABASE_URL=https://your-prod-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Monitoring (Production)
GRAFANA_URL=https://yourcompany.grafana.net
ENABLE_REALTIME_MONITORING=true
METRICS_COLLECTION_INTERVAL=60

# Limits (Production)
DAILY_COST_LIMIT=100.00
MAX_LEADS_PER_CAMPAIGN=100
MIN_CONFIDENCE_THRESHOLD=80
```

### .env.development
```env
# Development Environment Configuration
NODE_ENV=development
PORT=3000
DEBUG=true

# API Keys (Development/Sandbox)
GOOGLE_PLACES_API_KEY=AIza... # Use production key for real data
HUNTER_API_KEY=test_key_here
SCRAPINGDOG_API_KEY=test_key_here
NEVERBOUNCE_API_KEY=secret_test_...

# Database (Development)
SUPABASE_URL=https://your-dev-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Monitoring (Development)
GRAFANA_URL=http://localhost:3001
ENABLE_REALTIME_MONITORING=false
LOG_LEVEL=debug

# Limits (Development)
DAILY_COST_LIMIT=10.00
MAX_LEADS_PER_CAMPAIGN=10
MIN_CONFIDENCE_THRESHOLD=50
```

## Setup Instructions

### 1. Copy Environment Template
```bash
cp .env.example .env
```

### 2. Configure Required Variables
At minimum, configure these variables:
- `GOOGLE_PLACES_API_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

### 3. Configure Optional Services
Based on your needs:
- Email verification: `HUNTER_API_KEY`, `NEVERBOUNCE_API_KEY`
- Web scraping: `SCRAPINGDOG_API_KEY`
- Monitoring: `GRAFANA_URL`, `GRAFANA_API_TOKEN`

### 4. Set Production Limits
Configure cost and quality controls:
- `DAILY_COST_LIMIT`
- `MIN_CONFIDENCE_THRESHOLD`
- `MAX_LEADS_PER_CAMPAIGN`

## Cost Optimization Settings

### Free Tier Maximization
```env
# Optimize for free tiers
HUNTER_API_KEY=your_free_tier_key  # 25 requests/month
NEVERBOUNCE_API_KEY=your_free_tier_key  # 1000 verifications/month
SCRAPINGDOG_API_KEY=your_free_tier_key  # 1000 requests/month

# Conservative limits for free tier
DAILY_COST_LIMIT=5.00
MAX_LEADS_PER_CAMPAIGN=25
EMAIL_VERIFICATION_THRESHOLD=80  # Only verify high-confidence emails
```

### Paid Tier Optimization
```env
# Optimize for paid subscriptions
DAILY_COST_LIMIT=50.00
MAX_LEADS_PER_CAMPAIGN=100
BATCH_PROCESSING_ENABLED=true
PARALLEL_PROCESSING_THREADS=3
```

## Monitoring Variables Reference

| Variable | Default | Description |
|----------|---------|-------------|
| `GRAFANA_URL` | - | Grafana dashboard URL |
| `METRICS_COLLECTION_INTERVAL` | 60 | Metrics collection interval (seconds) |
| `HEALTH_CHECK_INTERVAL` | 300 | API health check interval (seconds) |
| `ENABLE_REALTIME_MONITORING` | true | Enable WebSocket real-time updates |
| `COST_ALERT_THRESHOLD` | 50.00 | Daily cost alert threshold ($) |
| `QUALIFICATION_RATE_ALERT` | 70 | Qualification rate alert threshold (%) |

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