# ProspectPro v3.1 — Cloud-Native Technical Overview

This document provides a comprehensive technical overview of ProspectPro's cloud-native architecture, featuring Google Cloud Build + Cloud Run deployment with Supabase backend integration.

## 1. Cloud-Native System Architecture

### 1.1 Platform Specialization

- **GitHub**: Code repository and documentation (minimal CI/CD complexity)
- **Google Cloud Build**: Container builds and deployment automation
- **Google Cloud Run**: Serverless hosting with auto-scaling (0-10 instances)
- **Supabase**: Database, real-time features, secrets vault, edge functions
- **Node.js/Express**: Production API server with comprehensive monitoring

### 1.2 Deployment Pipeline

```
Git Push → Cloud Build Trigger → Docker Container Build → Cloud Run Deploy
              ↓
    Supabase Vault (secrets injection) → Environment Variables
              ↓
    Database Triggers → Webhook Endpoints → Real-time Processing
```

### 1.3 Container Configuration

- **Runtime**: Node.js v20.19.4 in production container
- **Resources**: 2Gi memory, 2 CPU, auto-scaling 0-10 instances
- **Health Checks**: `/health`, `/ready`, `/diag` endpoints
- **Monitoring**: Comprehensive logging via Cloud Run native monitoring

## 2. Production API Architecture

### 2.1 Core API Endpoints

- **Business Discovery**: `/api/business/discover-businesses` - Main lead discovery with 4-stage pipeline
- **Campaign Export**: `/api/campaign-export/*` - Campaign data and analytics export
- **Dashboard Metrics**: `/api/dashboard/metrics` - Real-time business intelligence

### 2.2 Monitoring Endpoints

- **Health Check**: `/health` - Application status with environment validation
- **Readiness**: `/ready` - Database connectivity and service readiness
- **Diagnostics**: `/diag` - Comprehensive system diagnostics and configuration

### 2.3 Production Webhook Infrastructure

- **Campaign Lifecycle**: `/api/webhooks/campaign-lifecycle` - Real-time campaign monitoring
- **Cost Alerts**: `/api/webhooks/cost-alert` - Budget protection and cost monitoring
- **Lead Enrichment**: `/api/webhooks/lead-enrichment` - Automated lead processing pipeline

## 3. Enhanced Quality Scoring v3.0

### 3.1 4-Stage Validation Pipeline

1. **Discovery**: Google Places API + rate limiting for business candidates
2. **Enrichment**: Hunter.io (email), Foursquare (additional data), API prioritization
3. **Validation**: NeverBounce (email verification), quality scoring, cost optimization
4. **Export**: Campaign CSV with analytics, real-time feedback, ROI calculations

### 3.2 Performance Optimization

- **Qualification Rate**: 35-45% (3x improvement over previous version)
- **Cost Efficiency**: Free APIs prioritized, smart budget management
- **Dynamic Thresholds**: Real-time adjustment based on campaign performance
- **Caching**: 5-minute TTL for API responses, reducing redundant calls

## 4. Database Architecture (Supabase)

### 4.1 Optimized Schema

- **Migration Files**: 4 applied migrations with performance optimization v2
- **Tables**: 20+ production tables with optimized indexes and RLS policies
- **Functions**: 9 PostgreSQL functions for analytics and business logic
- **Performance**: 60-80% query improvement from optimization v2

### 4.2 Real-Time Features

- **Database Triggers**: Automatic webhook execution on data changes
- **Supabase Real-Time**: Live dashboard updates and notifications
- **Event-Driven**: Lead processing, campaign monitoring, cost alerts

### 4.3 Security & Compliance

- **Row Level Security (RLS)**: Fine-grained access control
- **Secrets Management**: Supabase Vault for API keys and tokens
- **Authentication**: Bearer token authentication for webhooks
- **Data Validation**: Comprehensive constraints and triggers

## 5. API Integration Stack

### 5.1 Primary APIs

- **Google Places API**: Business discovery with comprehensive rate limiting
- **Hunter.io**: Email discovery and domain validation
- **NeverBounce**: Email verification with confidence scoring
- **Foursquare**: Business data enrichment and validation

### 5.2 Cost Optimization Features

- **Rate Limiting**: Prevents API quota exhaustion
- **Smart Caching**: Reduces redundant API calls
- **Budget Monitoring**: Real-time cost tracking and alerts
- **API Prioritization**: Free sources first, paid sources for qualified leads

## 6. Cloud Build Configuration

### 6.1 Build Process

```yaml
# cloudbuild.yaml - Production Configuration
steps: 1. Create Artifact Registry (if needed)
  2. Build Docker container with multi-stage optimization
  3. Push to Google Artifact Registry
  4. Deploy to Cloud Run with environment injection
  5. Health check validation
```

### 6.2 Environment Variables

- **Supabase Integration**: `SUPABASE_URL`, `SUPABASE_SECRET_KEY`
- **Webhook Authentication**: `WEBHOOK_AUTH_TOKEN`
- **Application Config**: `NODE_ENV=production`, `ALLOW_DEGRADED_START=true`

## 7. Webhook Automation System

### 7.1 Database-Driven Webhooks

- **PostgreSQL Triggers**: Automatic webhook execution on data events
- **HTTP Callbacks**: Real-time notifications to application endpoints
- **Retry Logic**: Built-in failure handling and retry mechanisms
- **Authentication**: Secure Bearer token validation

### 7.2 Webhook Types

1. **Campaign Events**: Creation, progress, completion, errors
2. **Cost Monitoring**: Budget thresholds, spending alerts, anomaly detection
3. **Lead Processing**: Enrichment completion, validation results, quality scoring

## 8. Key Modules & Components

### 8.1 Core Engine

- **`modules/core/core-business-discovery-engine.js`**: Main discovery orchestration
- **`modules/validators/enhanced-quality-scorer.js`**: Quality scoring v3.0 with cost optimization
- **`modules/campaign-csv-exporter.js`**: Analytics and export system

### 8.2 API Clients

- **`modules/api-clients/`**: Comprehensive API integration layer
  - Google Places client with rate limiting
  - Hunter.io client with cost tracking
  - NeverBounce client with confidence scoring
  - Foursquare client with data enrichment

### 8.3 Webhook Infrastructure

- **`api/webhooks/campaign-lifecycle.js`**: Campaign event processing
- **`api/webhooks/cost-alert.js`**: Budget monitoring and alerts
- **`api/webhooks/lead-enrichment.js`**: Automated lead processing

## 9. Development & Monitoring

### 9.1 Local Development

```bash
npm run prod-check        # Environment validation
npm run production-start  # Local production server
npm run health           # Health check
npm run diag             # Comprehensive diagnostics
```

### 9.2 Cloud Monitoring

- **Cloud Run Logs**: Application and container monitoring
- **Supabase Dashboard**: Database and real-time monitoring
- **Webhook Logs**: Database-tracked webhook execution results
- **Cost Tracking**: Real-time API usage and cost monitoring

## 10. Deployment Benefits

### 10.1 Cloud-Native Advantages

- **Reduced Complexity**: No GitHub Actions maintenance overhead
- **Better Performance**: Native Google Cloud integration and optimization
- **Cost Efficiency**: Auto-scaling, optimized resource usage, smart API management
- **Reliability**: Platform-managed infrastructure with health monitoring
- **Scalability**: Serverless auto-scaling from 0 to 10 instances

### 10.2 Developer Experience

- **Clean Repository**: Production-first file organization, no CI/CD artifacts
- **Automated Deployment**: Zero-configuration continuous deployment via git push
- **Real-Time Feedback**: Comprehensive webhook system and live monitoring
- **Quality Assurance**: Enhanced validation pipeline with cost optimization

## 11. Architecture Evolution

### 11.1 Migration from GitHub Actions

- **Before**: Complex GitHub Actions workflows with secret management
- **After**: Native Cloud Build triggers with Supabase Vault integration
- **Benefits**: 1,300+ lines of CI/CD complexity removed, improved reliability

### 11.2 Hybrid Edge Function Strategy

- **Production APIs**: Core business logic via Express.js on Cloud Run
- **Edge Function**: Single specialized function (`enhanced-business-discovery`) for advanced processing
- **Rationale**: Better performance, easier debugging, cost optimization

---

**ProspectPro v3.1** represents a modern cloud-native architecture that prioritizes platform specialization, performance optimization, and developer experience while maintaining enterprise-grade reliability and scalability.
