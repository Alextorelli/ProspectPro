# ProspectPro v4.3 System Reference Guide

*Auto-generated: 2025-10-29 - Tier-Aware Background Discovery & Verification System*

**Quick Navigation**: [Discovery Module](#discovery-module) | [Enrichment Module](#enrichment-module) | [Validation Module](#validation-module)

---


## Discovery Module

- **Primary Function**: `business-discovery-background` — Tier-aware async discovery that sources business prospects and persists campaign-ready records.
- **Technical Flow**: Google Places → Foursquare Places → Census targeting → Lead persistence

### Key Files

```typescript
app/backend/functions/business-discovery-background/
app/backend/functions/business-discovery-optimized/
app/backend/functions/business-discovery-user-aware/
app/backend/functions/tests/business-discovery.test.ts
app/backend/functions/tests/test-google-places/
```

### Supporting Services

```typescript
app/backend/functions/_shared/edge-auth.ts
app/backend/functions/_shared/edge-auth-simplified.ts
app/backend/functions/_shared/vault-client.ts
app/backend/functions/_shared/api-usage.ts
app/backend/functions/_shared/cache-manager.ts
```

### Quick Commands

```bash
curl -X POST "$SUPABASE_URL/functions/v1/business-discovery-background"
npm run supabase:test:functions
npm run validate:contexts
```

---


## Enrichment Module

- **Primary Function**: `enrichment-orchestrator` — Budget-controlled enrichment that coordinates Hunter, NeverBounce, and licensing providers.
- **Technical Flow**: Hunter.io → NeverBounce → Cobalt SOS → Quality scoring

### Key Files

```typescript
app/backend/functions/enrichment-orchestrator/
app/backend/functions/enrichment-hunter/
app/backend/functions/enrichment-neverbounce/
app/backend/functions/enrichment-business-license/
app/backend/functions/enrichment-pdl/
```

### Supporting Services

```typescript
app/backend/functions/_shared/api-usage.ts
app/backend/functions/_shared/cache-manager.ts
app/backend/functions/_shared/cobalt-cache.ts
app/backend/functions/_shared/vault-client.ts
app/backend/functions/_shared/edge-auth.ts
```

### Quick Commands

```bash
curl -X POST "$SUPABASE_URL/functions/v1/enrichment-orchestrator"
npm run supabase:test:functions
```

---


## Validation Module

- **Primary Function**: `test-new-auth` — Session diagnostics ensuring all edge functions enforce RLS and zero fake data policies.
- **Technical Flow**: Supabase Auth → RLS enforcement → Validation diagnostics

### Key Files

```typescript
app/backend/functions/test-new-auth/
app/backend/functions/auth-diagnostics/
app/backend/functions/tests/test-new-auth/
```

### Supporting Services

```typescript
app/backend/functions/_shared/edge-auth.ts
app/backend/functions/_shared/edge-auth-simplified.ts
app/backend/functions/_shared/vault-client.ts
app/backend/functions/_shared/api-usage.ts
```

### Quick Commands

```bash
npm run supabase:test:db
curl -X POST "$SUPABASE_URL/functions/v1/test-new-auth"
```

---


## Cross-Module Integration

### Export System (User-Aware)

```typescript
app/backend/functions/campaign-export-user-aware/
app/backend/functions/campaign-export/
```

### Shared Authentication Infrastructure

```typescript
app/backend/functions/_shared/edge-auth.ts
app/backend/functions/_shared/edge-auth-simplified.ts
app/backend/functions/_shared/vault-client.ts
```

## Maintenance Commands

```bash
# Full documentation update
npm run docs:update

# Validate MCP and Supabase contexts
npm run validate:contexts
source dev-tools/scripts/operations/ensure-supabase-cli-session.sh
```

### Deployment & Testing Workflow

```bash
# Ensure Supabase session
source dev-tools/scripts/operations/ensure-supabase-cli-session.sh

# Deploy core functions
cd /workspaces/ProspectPro/supabase
npx --yes supabase@latest functions deploy auth-diagnostics --no-verify-jwt
npx --yes supabase@latest functions deploy business-discovery-background --no-verify-jwt
npx --yes supabase@latest functions deploy business-discovery-optimized --no-verify-jwt
npx --yes supabase@latest functions deploy business-discovery-user-aware --no-verify-jwt
npx --yes supabase@latest functions deploy campaign-export --no-verify-jwt

# Run validation suites
npm run docs:update
npm run lint
npm test
```

### Environment Verification Checklist

- Frontend publishable key matches Supabase dashboard
- Session JWTs forwarded on authenticated requests
- RLS policies active for campaigns, leads, and exports
- Edge Function secrets configured for Google Places, Hunter.io, NeverBounce, Foursquare, Cobalt
- User-owned tables populated: campaigns, leads, dashboard_exports
- Production URL reachable: https://prospectpro.appsmithery.co
- Authentication flows (signup, signin, session persist) operational

## Current Production Status

### Deployment URLs

- Production Frontend: https://prospectpro.appsmithery.co
- Edge Functions: https://sriycekxdqnesdsgwiuc.supabase.co/functions/v1/
- Database: Supabase project sriycekxdqnesdsgwiuc

### System Health

- Edge Functions deployed and authenticated
- Database RLS policies enforced
- Frontend session management active
- API integrations validated (Google Places, Hunter.io, NeverBounce, Cobalt)
- Zero fake data policy enforced

### Architecture Benefits
- Cost reduction via serverless edge functions
- Global edge cold starts under 100ms
- Platform-managed auto scaling
- No container orchestration overhead
