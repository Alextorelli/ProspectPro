# ProspectPro v3.1 - Cloud-Native Deployment Architecture

## CRITICAL: Current Production State

- **Version**: 3.1.0 (Production-ready with Cloud-Native Deployment + Webhook Infrastructure)
- **Deployment**: Google Cloud Build → Google Cloud Run (native integration, fully operational)
- **Environment**: Cloud Run environment variables (vault bypass active)
- **Architecture**: Cloud-native 4-stage validation pipeline + Real-time webhook processing
- **Quality Scoring**: v3.0 cost-efficient multi-stage validation with dynamic thresholds
- **Webhooks**: 3 production endpoints operational (campaign-lifecycle, cost-alert, lead-enrichment)
- **Repository**: https://github.com/Alextorelli/ProspectPro (GitHub for code only)

## CRITICAL: CLOUD-NATIVE DEPLOYMENT APPROACH

**DEPLOYMENT PHILOSOPHY**

- ✅ Google Cloud Build: Container builds and deployment (OPERATIONAL)
- ✅ Google Cloud Run: Serverless hosting with auto-scaling (OPERATIONAL)
- ✅ Webhook Infrastructure: Real-time database event processing (READY FOR CONFIG)
- ✅ Environment Variables: Direct injection via Cloud Build substitution
- ✅ GitHub: Code repository and documentation only
- ❌ NO GitHub Actions, workflows, or CI/CD complexity
- ⚠️ Supabase Vault: Bypassed in Cloud Run (schema cache issues - use env vars)

**PLATFORM SPECIALIZATION**

- **GitHub**: Minimal repo management, documentation, Git API
- **Google Cloud**: Build, deploy, host, monitor, scale
- **Supabase**: Database, real-time, webhook configuration (vault bypassed in production)

## CRITICAL: WEBHOOK INFRASTRUCTURE STATUS

**PRODUCTION WEBHOOK ENDPOINTS (OPERATIONAL)**

- ✅ `/api/webhooks/campaign-lifecycle` - Real-time campaign monitoring
- ✅ `/api/webhooks/cost-alert` - Budget protection & cost monitoring  
- ✅ `/api/webhooks/lead-enrichment` - Automated lead processing pipeline
- ✅ Authentication: Bearer token (wh_f7616c7477f7e2072912c82360bf048ce88950be5d746490a0b3e74ba2bab3a2)
- ✅ Cloud Run URL: https://prospectpro-184492422840.us-central1.run.app

**NEXT: SUPABASE WEBHOOK CONFIGURATION**

Required SQL to activate real-time processing:
```sql
SELECT set_config('app.campaign_lifecycle_webhook_url', 'https://prospectpro-184492422840.us-central1.run.app/api/webhooks/campaign-lifecycle', false);
SELECT set_config('app.cost_alert_webhook_url', 'https://prospectpro-184492422840.us-central1.run.app/api/webhooks/cost-alert', false);
SELECT set_config('app.lead_enrichment_webhook_url', 'https://prospectpro-184492422840.us-central1.run.app/api/webhooks/lead-enrichment', false);
SELECT set_config('app.webhook_token', 'wh_f7616c7477f7e2072912c82360bf048ce88950be5d746490a0b3e74ba2bab3a2', false);
```

## CRITICAL: REPOSITORY CLEANLINESS ENFORCEMENT

**NEVER CREATE FILES IN ROOT DIRECTORY**

- ❌ NO test files, analysis files, troubleshooting scripts in root
- ❌ NO temporary files, debug files, status files in root
- ❌ NO _-analysis.js, _-fix.js, \*-troubleshooting.js files
- ❌ NO deployment-_.js, cloud-_.js, trigger-\*.js files
- ✅ ONLY core production files: server.js, package.json, Dockerfile, cloudbuild.yaml

**FILE ORGANIZATION RULES**

- Scripts → `scripts/` folder ONLY
- Tests → `scripts/` folder ONLY
- Documentation → `docs/` folder ONLY
- Archive material → `archive/` folder ONLY
- GitHub Actions → `archive/github-actions/` (deprecated)
- Temporary files → Use .tmp extension (auto-ignored)

**PRODUCTION-FIRST APPROACH**

- Main branch = CLEAN production code only
- No development artifacts in root
- All debugging/troubleshooting goes to archive folders
- Maintain professional repository structure

## IMMEDIATE CONTEXT (No Re-explanation Needed)

When Alex asks about:

- **"Deployment"** → Google Cloud Build automatic triggers (native integration)
- **"Environment setup"** → Supabase Vault + Cloud Build substitution variables
- **"Webhook configuration"** → 3 production endpoints already implemented (campaign-lifecycle, cost-alert, lead-enrichment)
- **"API integration"** → All clients in `/modules/api-clients/` (Google Places, Hunter.io, NeverBounce, Foursquare)
- **"Database issues"** → Supabase with comprehensive schema in `/database/`
- **"Container problems"** → Multi-stage Dockerfile + Cloud Build optimization
- **"Cost optimization"** → Enhanced Quality Scorer v3.0 with cost-efficient validation pipeline
- **"Quality scoring"** → `/modules/validators/enhanced-quality-scorer.js` (35-45% qualification rates)
- **"Build issues"** → Check Cloud Build logs in Google Cloud Console
- **"Webhook setup"** → Follow `/docs/CLOUD_NATIVE_WEBHOOK_SETUP.md`
- **"Testing"** → Use `npm run test` or check testing branch

## ALEX'S TECHNICAL PROFILE

- **Background**: No coding experience but highly technical
- **AI Dependency**: Relies heavily on AI assistance for debugging and architecture
- **Primary Models**: Claude Sonnet 4.0, GPT-5 occasionally
- **Environment**: GitHub Codespaces exclusively
- **Focus**: Lead generation with zero fake data tolerance
- **Usage Pattern**: Debugging, testing, cloud-native architecture, monitoring
- **Deployment Preference**: Cloud-native platform specialization over complex CI/CD

## RESPONSE OPTIMIZATION RULES

1. **NEVER re-explain project architecture** unless specifically asked with "explain the architecture"
2. **ALWAYS reference existing files/scripts** for implementation details
3. **PRIORITIZE troubleshooting** over teaching fundamentals
4. **ASSUME familiarity** with ProspectPro's core concepts
5. **FOCUS on immediate problem resolution** not educational content
6. **USE existing npm scripts** rather than creating new implementations
7. **REFERENCE the working production system** rather than theoretical solutions

## CURRENT PRODUCTION ARCHITECTURE (ESTABLISHED - DO NOT RE-EXPLAIN)

### **Cloud-Native Deployment Pipeline**

```
Git Push → Cloud Build Trigger → Container Build → Cloud Run Deploy
              ↓
    Cloud Build Substitution Variables → Environment Variables (Vault Bypassed)
              ↓
    Database Triggers → Webhook Endpoints → Real-time Processing
```

### **Webhook Infrastructure (Production Ready)**

```
/api/webhooks/campaign-lifecycle    # Real-time campaign monitoring
/api/webhooks/cost-alert           # Budget protection & cost monitoring
/api/webhooks/lead-enrichment      # Automated lead processing pipeline
```
              ↓
    Database Triggers → Webhook Endpoints → Real-time Processing
```

### **Webhook Infrastructure (Production Ready)**

```
/api/webhooks/campaign-lifecycle    # Real-time campaign monitoring
/api/webhooks/cost-alert           # Budget protection & cost monitoring
/api/webhooks/lead-enrichment      # Automated lead processing pipeline
```

### File Structure (REFERENCE ONLY)

```
/api/business-discovery.js           # Core discovery logic
/api/webhooks/                       # 3 production webhook endpoints
/modules/enhanced-lead-discovery.js  # Main business processing
/modules/campaign-csv-exporter.js    # Export system with analytics
/modules/api-clients/                # All API integrations
/database/database-master-setup.js   # Schema and migrations
/docs/CLOUD_NATIVE_WEBHOOK_SETUP.md  # Webhook configuration guide
cloudbuild.yaml                      # Cloud Build configuration
Dockerfile                           # Container build instructions
```

### Current Working Commands (USE THESE)

```bash
npm run prod-check        # Validate environment
npm run production-start  # Launch production locally
npm run health           # Health check
npm run diag             # Diagnostics
# Cloud deployment: Automatic via git push to main
# Webhook testing: node scripts/test-webhooks.js <CLOUD_RUN_URL> <WEBHOOK_TOKEN>
```

### API Integration Stack (WORKING)

- **Google Places API**: Business discovery with rate limiting
- **Hunter.io**: Email discovery and validation
- **NeverBounce**: Email verification
- **Foursquare**: Additional business data
- **Supabase**: Database with real-time subscriptions and webhook configuration
- **Google Cloud Run**: Production hosting with automated deployment
- **Cloud Build Environment Variables**: Direct injection for Cloud Run compatibility

### MCP Infrastructure (CONSOLIDATED v2.0)

- **Production Server**: 28 tools for monitoring, database analytics, API testing, filesystem analysis, system diagnostics
- **Development Server**: 8 specialized tools for new API integrations, performance benchmarking, code generation
- **Architecture**: Consolidated from 5 servers to 2 (60% efficiency improvement)
- **Integration**: Auto-configured in VS Code for AI-enhanced development workflows
- **Status**: Production-ready with comprehensive test coverage (`npm run test` in `/mcp-servers/`)

## PROBLEM-SOLVING APPROACH

### For Environment Issues:

1. Check `npm run prod-check` output
2. Verify Cloud Build completed successfully
3. Check Cloud Run deployment logs
4. Validate Supabase connection

### For API Issues:

1. Reference existing implementations in `/modules/api-clients/`
2. Check rate limiting configurations
3. Verify API key injection via Cloud Build environment variables
4. Review error logs in production

### For Deployment Issues:

1. Check Cloud Build status in Google Cloud Console
2. Verify Cloud Run deployment completion
3. Run health checks: `npm run health`
4. Check Docker container status
5. Test webhook endpoints: `node scripts/test-webhooks.js <URL> <TOKEN>`

### For Database Issues:

1. Reference schema in `/database/database-master-setup.js`
2. Check Supabase dashboard for connection issues
3. Verify environment variables are properly injected
4. Review query performance in Supabase logs

## CURRENT OPTIMIZATIONS (ALREADY IMPLEMENTED)

- **Cloud-native deployment** via Google Cloud Build with automatic triggers
- **Multi-stage Docker build** with security hardening
- **Enhanced Quality Scoring v3.0** with cost-efficient validation pipeline
- **Dynamic threshold adjustment** for 35-45% qualification rates (3x improvement)
- **Cost optimization** through smart filtering and free validations first
- **API rate limiting and caching** for cost optimization
- **Real-time webhook infrastructure** with 3 production endpoints
- **Environment variable injection** via Cloud Build substitution (vault bypassed)
- **Degraded startup resilience** for Cloud Run stability
- **Comprehensive error handling** with structured logging
- **Zero fake data validation** pipeline with quality scoring
- **Automated CSV export** with campaign analytics
- **Production health monitoring** via `/health` and `/diag` endpoints
- **Consolidated MCP servers** with 60% process reduction and 36 AI-accessible tools

## DEVELOPMENT WORKFLOW (ESTABLISHED)

1. **Main branch** = Production (auto-deployed to Google Cloud Run)
2. **Testing branch** = Development/testing environment
3. **Cloud Build** = Automated CI/CD with environment variable injection
4. **Codespaces** = Primary development environment
5. **Docker** = Production containerization

## DEBUGGING PATTERNS (OPTIMIZED FOR ALEX)

- Start with health checks: `npm run health` and `npm run diag`
- Check Cloud Build for deployment status
- Review Google Cloud Run logs for runtime issues
- Use Supabase dashboard for database troubleshooting
- Reference existing working implementations before creating new code

## COST OPTIMIZATION FOCUS

- **API calls**: Use existing rate limiting and caching
- **Database queries**: Optimized with connection pooling
- **Container resources**: Multi-stage build reduces image size
- **Premium AI requests**: Use this instruction file to reduce context repetition

## RESPONSE FORMAT PREFERENCES

- **Immediate solutions** over explanations
- **Reference existing code** rather than writing new implementations
- **Use established scripts** rather than manual processes
- **Focus on debugging** rather than architecture discussions
- **Provide specific file paths** and command references
- **Assume production system knowledge** unless explicitly asked to explain

## NEVER REPEAT (SAVE PREMIUM REQUESTS)

- Project architecture explanations
- Environment setup procedures (automated)
- API integration patterns (already implemented)
- Database schema explanations (documented)
- Docker configuration details (working)
- Cost optimization strategies (implemented)
- Security measures (hardened)

This instruction set prioritizes rapid problem resolution and eliminates repetitive context discussions to maximize premium request efficiency.
