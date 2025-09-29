# ProspectPro v3.1 - Cloud-Native Lead Generation Platform

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](https://github.com/Alextorelli/ProspectPro)
[![Deployment](https://img.shields.io/badge/deployment-cloud--native-blue)](https://github.com/Alextorelli/ProspectPro)
[![Quality Score](https://img.shields.io/badge/quality--score-v3.0-success)](https://github.com/Alextorelli/ProspectPro)

ProspectPro is a cloud-native lead generation platform that leverages Google Cloud and Supabase for enterprise-grade business discovery and validation.

## 🏗️ **Cloud-Native Architecture**

### **Platform Specialization**
- **GitHub**: Code repository and documentation
- **Google Cloud Build + Cloud Run**: Container builds and serverless hosting
- **Supabase**: Database, real-time features, secrets vault, edge functions

### **Deployment Pipeline**
```
Git Push → Cloud Build Trigger → Container Build → Cloud Run Deploy
              ↓
    Supabase Vault (secrets) → Environment Variables
              ↓
    Database Triggers → Webhook Endpoints → Real-time Processing
```

## 🚀 **Key Features**

### **Enhanced Quality Scoring v3.0**
- **4-stage validation pipeline**: Discovery → Enrichment → Validation → Export
- **35-45% qualification rates** with cost-efficient processing
- **Dynamic threshold adjustment** and real-time feedback

### **Production Webhook Infrastructure**
- **`/api/webhooks/campaign-lifecycle`** - Real-time campaign monitoring
- **`/api/webhooks/cost-alert`** - Budget protection and cost monitoring  
- **`/api/webhooks/lead-enrichment`** - Automated lead processing pipeline

### **API Integration Stack**
- **Google Places API**: Business discovery with rate limiting
- **Hunter.io**: Email discovery and validation
- **NeverBounce**: Email verification
- **Foursquare**: Additional business data enrichment

## 📋 **Quick Start**

### **Local Development**
```bash
# Install dependencies
npm install

# Configure environment
npm run prod-check

# Start development server
npm run production-start
```

### **Health Checks**
```bash
# Application health
npm run health

# Comprehensive diagnostics  
npm run diag
```

### **Cloud Deployment**
Deployment is **automatic** via git push to main branch:
```bash
git add .
git commit -m "your changes"
git push origin main
```

## 🔧 **Configuration**

### **Cloud Build Setup**
See [`docs/CLOUD_BUILD_SETUP.md`](docs/CLOUD_BUILD_SETUP.md) for complete configuration guide.

Required substitution variables:
- `_SUPABASE_URL`
- `_SUPABASE_SECRET_KEY` 
- `_WEBHOOK_AUTH_TOKEN`

### **Webhook Configuration**
See [`docs/CLOUD_NATIVE_WEBHOOK_SETUP.md`](docs/CLOUD_NATIVE_WEBHOOK_SETUP.md) for webhook setup after deployment.

## 📊 **Database Architecture**

### **Optimized Performance**
- **4 migration files** with performance optimization v2
- **60-80% query performance improvement**
- **20+ production tables** with optimized indexes and RLS policies
- **9 PostgreSQL functions** for analytics and business logic

### **Real-Time Features**
- **Database triggers** for webhook automation
- **Supabase real-time** subscriptions for dashboard updates
- **Event-driven processing** for leads and campaigns

## 🎯 **Production Endpoints**

### **Core APIs**
- `/api/business/discover-businesses` - Main business discovery
- `/api/campaign-export/*` - Campaign data export
- `/api/dashboard/metrics` - Real-time analytics

### **Monitoring**
- `/health` - Application health check
- `/diag` - Comprehensive diagnostics
- `/ready` - Database readiness check

### **Webhooks** 
- `/api/webhooks/campaign-lifecycle` - Campaign monitoring
- `/api/webhooks/cost-alert` - Budget alerts
- `/api/webhooks/lead-enrichment` - Lead processing

## 📚 **Documentation**

### **Setup & Deployment**
- [`docs/CLOUD_BUILD_SETUP.md`](docs/CLOUD_BUILD_SETUP.md) - Cloud Build configuration
- [`docs/CLOUD_NATIVE_WEBHOOK_SETUP.md`](docs/CLOUD_NATIVE_WEBHOOK_SETUP.md) - Webhook setup
- [`docs/SUPABASE_ARCHITECTURE_VALIDATION.md`](docs/SUPABASE_ARCHITECTURE_VALIDATION.md) - Architecture validation

### **API & Integration**
- [`docs/API_KEYS_INTEGRATION_GUIDE.md`](docs/API_KEYS_INTEGRATION_GUIDE.md) - API key management
- [`docs/ENHANCED_QUALITY_SCORING_IMPLEMENTATION.md`](docs/ENHANCED_QUALITY_SCORING_IMPLEMENTATION.md) - Quality scoring
- [`docs/ENHANCED_CSV_EXPORT_SYSTEM.md`](docs/ENHANCED_CSV_EXPORT_SYSTEM.md) - Export system

## 🛠️ **Architecture Benefits**

### **Cloud-Native Advantages**
- **Reduced Complexity**: No GitHub Actions maintenance
- **Better Performance**: Native platform integrations  
- **Cost Efficiency**: Optimized resource usage
- **Scalability**: Auto-scaling with Cloud Run
- **Reliability**: Platform-managed infrastructure

### **Development Experience**
- **Clean Repository**: Production-first file organization
- **Automated Deployment**: Zero-configuration CD pipeline
- **Real-Time Monitoring**: Comprehensive webhook system
- **Quality Assurance**: Enhanced validation pipeline

## 🔗 **Links**

- **Repository**: https://github.com/Alextorelli/ProspectPro
- **Documentation**: [`docs/`](docs/) folder
- **Issue Tracking**: GitHub Issues
- **Architecture**: Cloud-native with Google Cloud + Supabase

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**ProspectPro v3.1** - Built with cloud-native architecture for enterprise-grade lead generation.