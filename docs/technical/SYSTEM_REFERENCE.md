# ProspectPro v4.3 System Reference Guide

*Auto-generated: 2025-10-16 - Tier-Aware Background Discovery & Verification System*

**Quick Navigation**: [Discovery](#discovery-module) | [Enrichment](#enrichment-module) | [Validation](#validation-module) | [Maintenance](#maintenance-commands)

---

## Discovery Module

### Core Architecture
- **Primary Function**: `business-discovery-background` - Tier-aware async discovery with user authentication
- **Business Logic**: Multi-source business discovery → Background processing → Quality scoring
- **Technical Flow**: Google Places API → Foursquare Places API → Census targeting → User-aware database storage

### Key Files
```typescript
// Core Discovery Module Functions
/supabase/functions/business-discovery-background/                    # PRIMARY: Tier-aware async discovery
/supabase/functions/business-discovery-optimized/                    # Session-aware sync discovery
/supabase/functions/business-discovery-user-aware/                    # Legacy compatibility discovery
/supabase/functions/test-business-discovery/                    # Discovery smoke tests
/supabase/functions/test-google-places/                    # Google Places API testing

// Supporting Services
/supabase/functions/_shared/authenticateRequest.ts         # Session JWT validation
/supabase/functions/_shared/business-taxonomy.ts         # MECE business categories (300+ types)
/supabase/functions/_shared/google-places-service.ts         # Google Places API integration
/supabase/functions/_shared/foursquare-service.ts         # Foursquare Places API integration
/supabase/functions/_shared/census-targeting.ts         # Geographic targeting logic
```

### Quick Commands
```bash
# Test discovery
curl -X POST "$SUPABASE_URL/functions/v1/business-discovery-background"

# Test discovery
source scripts/ensure-supabase-cli-session.sh

# Test discovery
./scripts/campaign-validation.sh
```

---

## Enrichment Module

### Core Architecture
- **Primary Function**: `enrichment-orchestrator` - Budget-controlled multi-service coordination with tier awareness
- **Business Logic**: Tier-based enrichment pipeline with 24-hour caching and circuit breakers
- **Technical Flow**: Hunter.io (email discovery) → NeverBounce (verification) → Cobalt SOS (filings) → Quality scoring

### Key Files
```typescript
// Core Enrichment Module Functions
/supabase/functions/enrichment-orchestrator/                    # PRIMARY: Multi-service coordination
/supabase/functions/enrichment-hunter/                    # Hunter.io email discovery + 24hr caching
/supabase/functions/enrichment-neverbounce/                    # NeverBounce email verification
/supabase/functions/enrichment-business-license/                    # Professional licensing data (Enterprise)
/supabase/functions/enrichment-pdl/                    # People Data Labs integration (Enterprise)

// Supporting Services
/supabase/functions/_shared/hunter-service.ts         # Hunter.io API client with caching
/supabase/functions/_shared/neverbounce-service.ts         # NeverBounce verification client
/supabase/functions/_shared/cobalt-sos-service.ts         # Secretary of State filings (cache-first)
/supabase/functions/_shared/budget-controls.ts         # Tier-based cost management
/supabase/functions/_shared/enrichment-cache.ts         # 24-hour result caching system
```

### Quick Commands
```bash
# Test enrichment
curl -X POST "$SUPABASE_URL/functions/v1/enrichment-orchestrator"

# Test enrichment
./scripts/test-enrichment-pipeline.sh
```

---

## Validation Module

### Core Architecture
- **Primary Function**: `test-new-auth` - Session JWT enforcement across all functions with RLS policies
- **Business Logic**: Contact verification with 95% email accuracy and zero fake patterns
- **Technical Flow**: Supabase Auth → RLS policies → Session validation → Quality scoring → Data isolation

### Key Files
```typescript
// Core Validation Module Functions
/supabase/functions/test-new-auth/                    # PRIMARY: Session diagnostics & RLS validation
/supabase/functions/test-official-auth/                    # Supabase reference auth implementation
/supabase/functions/auth-diagnostics/                    # Authentication testing suite

// Supporting Services
/supabase/functions/_shared/quality-scoring.ts         # Lead confidence scoring (0-100)
/supabase/functions/_shared/data-validation.ts         # Contact data verification
/supabase/functions/_shared/email-validation.ts         # Email pattern validation (rejects fake emails)
/supabase/functions/_shared/rls-helpers.ts         # Row Level Security validation helpers
```

### Quick Commands
```bash
# Test validation
./scripts/test-auth-patterns.sh "$SUPABASE_SESSION_JWT"

# Test validation
curl -X POST "$SUPABASE_URL/functions/v1/test-new-auth"
```

---

## Cross-Module Integration

### Export System (User-Aware)
```typescript
// User-authorized exports with enrichment metadata
/supabase/functions/campaign-export-user-aware/       # PRIMARY: User-authorized exports
/supabase/functions/campaign-export/                  # Internal automation export

// Export features
- User ownership validation
- Enrichment metadata inclusion
- Confidence score reporting
- Source attribution
- Data isolation enforcement
```

### Shared Authentication Infrastructure
```typescript
/supabase/functions/_shared/authenticateRequest.ts    # Session JWT validation
/supabase/functions/_shared/rls-helpers.ts             # RLS policy helpers
/supabase/functions/_shared/user-context.ts           # User session management

// Authentication pattern (all functions)
const user = await authenticateRequest(request);
// Enforces session JWT + RLS policies
```

## Maintenance Commands

### Keep System Reference Current
```bash
# Full documentation update (codebase index + system reference)
npm run docs:update

# Update after deployments (automatic via postdeploy hook)
npm run postdeploy
```

### Deployment & Testing Workflow
```bash
# 1. Ensure Supabase CLI session
source scripts/ensure-supabase-cli-session.sh

# 2. Deploy all core functions
cd /workspaces/ProspectPro/supabase && \
npx --yes supabase@latest functions deploy business-discovery-background && \
npx --yes supabase@latest functions deploy enrichment-orchestrator && \
npx --yes supabase@latest functions deploy campaign-export-user-aware

# 3. Test core functionality
./scripts/test-auth-patterns.sh "$SUPABASE_SESSION_JWT"
./scripts/campaign-validation.sh

# 4. Update documentation
npm run docs:update
```

### Environment Verification Checklist
- [ ] Frontend publishable key (`sb_publishable_*`) matches Supabase dashboard
- [ ] Frontend/services forward Supabase session JWTs on authenticated requests
- [ ] RLS policies active for campaigns, leads, dashboard_exports tables
- [ ] Edge Function secrets configured: GOOGLE_PLACES_API_KEY, HUNTER_IO_API_KEY, NEVERBOUNCE_API_KEY, FOURSQUARE_API_KEY, COBALT_INTELLIGENCE_API_KEY
- [ ] Database tables exist with user columns: campaigns, leads, dashboard_exports, campaign_analytics view
- [ ] Production URL accessible: https://prospect-fyhedobh1-appsmithery.vercel.app
- [ ] User authentication system working (signup/signin/session management)

---

## Current Production Status

### Deployment URLs
- **Production Frontend**: https://prospectpro.appsmithery.co
- **Edge Functions**: https://sriycekxdqnesdsgwiuc.supabase.co/functions/v1/
- **Database**: Supabase project `sriycekxdqnesdsgwiuc`

### System Health
- ✅ **Edge Functions**: All deployed and operational with user authentication
- ✅ **Database**: RLS policies active, user-aware schema implemented  
- ✅ **Frontend**: Static deployment with session management
- ✅ **API Integrations**: Google Places, Hunter.io, NeverBounce, Cobalt Intelligence configured
- ✅ **User Authentication**: Complete signup/signin with session JWT enforcement
- ✅ **Data Quality**: 95% email accuracy, zero fake data tolerance maintained

### Architecture Benefits
- **90% Cost Reduction**: Serverless functions vs. container infrastructure
- **<100ms Cold Starts**: Global edge deployment via Supabase
- **Auto-Scaling**: Native Supabase Edge Function scaling
- **Zero Infrastructure Management**: Platform-managed serverless architecture
- **Enterprise Security**: RLS policies + session JWT authentication

---

*Last Updated: 2025-10-16 | Auto-generated from ProspectPro v4.3 codebase analysis*
*Run `npm run docs:update` to regenerate this reference*