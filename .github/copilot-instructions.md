# ProspectPro Real API Integration - AI Coding Agent Instructions

## Project Overview

ProspectPro is a lead generation platform being rebuilt to eliminate ALL fake data and integrate with real APIs (Google Places, website scraping, email verification). The core mission: **Zero tolerance for fake business data**.

## Critical Architecture Understanding

### 4-Stage Data Pipeline

1. **Discovery** (Free): Google Places API + Yellow Pages scraping for business discovery
2. **Enrichment** (Paid): Website scraping, email discovery, contact extraction
3. **Validation** (Verification): Multi-source validation of all contact data
4. **Export** (Quality Assurance): Only verified, complete leads exported

### Key Directories & Purpose

- `api/business-discovery.js` - Core business discovery logic (NEVER generate fake data)
- `modules/api-clients/` - External API integrations (Google Places, Scrapingdog, Hunter.io)
- `modules/validators/` - Data validation and quality scoring
- `modules/scrapers/` - Website content extraction logic
- `public/` - Frontend interface for campaign management

## Zero Fake Data Policy 🚨

### PROHIBITED Patterns (Remove immediately if found):

````javascript
# ProspectPro AI Coding Agent Instructions

## Project Overview

ProspectPro is a Node.js/Express lead generation platform with **zero tolerance for fake business data**. Built for Railway deployment with Supabase PostgreSQL backend, it processes real business data through a 4-stage validation pipeline: Discovery → Enrichment → Validation → Export.

## Critical Architecture

### Server Bootstrap Pattern (server.js)
- **Graceful degraded mode**: `ALLOW_DEGRADED_START=true` keeps server alive during DB issues
- **Comprehensive health endpoints**: `/health` (fast), `/diag` (full diagnostics), `/ready` (DB required)
- **Import pattern**: Always use defensive `require()` with stub fallbacks for missing modules

```javascript
// ✅ CORRECT: Defensive imports with graceful degradation
let businessDiscoveryRouter;
try {
  businessDiscoveryRouter = require('./api/business-discovery');
} catch (e) {
  console.error('Failed to load business-discovery router:', e);
  const r = require('express').Router();
  r.use((req, res) => res.status(500).json({ error: 'Module failed to load' }));
  businessDiscoveryRouter = r;
}
````

### Supabase Connection Management (config/supabase.js)

- **Key precedence**: `SUPABASE_SECRET_KEY` → `SUPABASE_SERVICE_ROLE_KEY` → `SUPABASE_ANON_KEY` → `SUPABASE_PUBLISHABLE_KEY`
- **Lazy client initialization**: Only create client when needed, cache instance
- **Diagnostic system**: `testConnection()` returns detailed failure categorization with remediation steps

```javascript
// Key pattern for diagnostics functions
function getLastSupabaseDiagnostics() {
  return lastSupabaseDiagnostics;
}
function setLastSupabaseDiagnostics(diag) {
  lastSupabaseDiagnostics = diag;
}
// ⚠️ CRITICAL: Always export these functions or server.js imports will fail
```

### 4-Stage Lead Processing Pipeline (modules/enhanced-lead-discovery.js)

1. **Pre-validation** (0-100 score): Filter out obviously fake data before expensive API calls
2. **Registry Validation** (FREE): California SOS, NY SOS, tax records cross-reference
3. **Email Discovery** (PAID): Hunter.io domain search with cost optimization
4. **Email Verification** (PAID): NeverBounce deliverability with 80%+ confidence threshold

## Zero Fake Data Enforcement

### Prohibited Patterns

```javascript
// ❌ NEVER: Hardcoded business arrays
const fakeBusinesses = ["Artisan Bistro", "Downtown Café"];
// ❌ NEVER: Sequential fake addresses
const addresses = ["100 Main St", "110 Main St", "120 Main St"];
// ❌ NEVER: 555/000 phone numbers
const phones = ["(555) 123-4567", "(000) 123-4567"];
```

### Required Validation Standards

- **Website validation**: Must return HTTP 200-399 status codes
- **Email verification**: NeverBounce confidence ≥80% OR manual domain validation
- **Phone format**: US 10-digit, exclude 555/000/111 area codes
- **Address geocoding**: Must resolve to real coordinates (not sequential patterns)

## Cost Optimization Patterns

### Budget-Aware Processing

```javascript
// Always check budget before expensive operations
if (this.totalCost >= budgetLimit) {
  console.warn(`⚠️ Budget limit reached: $${this.totalCost.toFixed(2)}`);
  break;
}
```

### API Cost Tracking (per modules/enhanced-lead-discovery.js)

- Google Places: ~$0.032/search, $0.017/details
- Hunter.io: ~$0.04/domain search (25 free/month)
- NeverBounce: ~$0.008/verification (1000 free/month)

## Database Schema Conventions (database/enhanced-supabase-schema.sql)

### Core Tables

- `enhanced_leads`: Main business records with confidence scoring (0-100)
- `campaigns`: User session tracking with cost attribution
- `api_costs`: Per-request cost tracking for budget management
- `validation_results`: Multi-source validation outcomes

### RLS Security Pattern

```sql
-- Enable RLS on all tables
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;
-- User isolation with auth.uid()
CREATE POLICY "Users can only see own data" ON table_name
FOR ALL USING (auth.uid() = user_id);
```

## Development Workflows

### Local Development

```bash
npm install
cp .env.example .env  # Configure SUPABASE_URL + SUPABASE_SECRET_KEY
npm run dev           # Starts with nodemon on port 3000
```

### Railway Deployment Testing

```bash
# Test diagnostics without deployment
SUPABASE_URL=your_url SUPABASE_SECRET_KEY=your_key node server.js
# Check health endpoints
curl localhost:3000/health
curl localhost:3000/diag
```

### Data Validation Testing

```bash
node test/test-real-data.js         # Verify zero fake data patterns
node test/test-website-validation.js # Test all URLs return 200-399
```

## Error Handling Standards

### API Client Pattern

```javascript
// ✅ CORRECT: Never fallback to fake data
try {
  const realData = await apiClient.search(query);
  if (!realData || realData.length === 0) {
    throw new Error("No real data available for query");
  }
  return realData;
} catch (error) {
  console.error("API failed:", error.message);
  throw error; // Propagate, don't mask with fake data
}
```

### Server Resilience (server.js patterns)

- Global error handlers for `unhandledRejection`, `uncaughtException`
- Heartbeat logging every 120s for Railway monitoring
- Event loop delay monitoring at `/loop-metrics`

## File-Specific Implementation Notes

### `/api/business-discovery.js`

- Uses `EnhancedLeadDiscovery` class with budget limits
- Returns comprehensive metadata: cost per lead, processing time, qualification rate
- Implements campaign logging to `campaigns` table via `CampaignLogger`

### `/modules/validators/data-validator.js`

- Comprehensive fake pattern detection with regex arrays
- Website accessibility testing with 10s timeout
- DNS resolution validation for domain existence
- NeverBounce integration with confidence scoring

### `/public/` Frontend

- Vanilla JS with real-time cost display
- Admin dashboard at `/admin-dashboard.html?token=PERSONAL_ACCESS_TOKEN`
- Business intelligence dashboard with campaign metrics

## Railway Production Considerations

### Environment Variables

- `ALLOW_DEGRADED_START=true` for initial deployment debugging
- `PERSONAL_ACCESS_TOKEN` for admin dashboard authentication
- `PORT` automatically set by Railway (bind to `0.0.0.0`)

### Monitoring Endpoints

- `/health`: Railway health checks with degraded mode support
- `/diag`: Full Supabase connection diagnostics with sanitized environment
- `/ready`: Kubernetes-style readiness probe requiring privileged DB connection

This platform prioritizes data authenticity, cost efficiency, and production reliability over development convenience.

````

### Required Real Data Sources:

- Business names: Google Places API results only
- Addresses: Geocoded, real locations from Google Maps
- Phones: Extracted from business listings or websites
- Websites: Must return HTTP 200-399 status codes
- Emails: Must pass NeverBounce deliverability validation

## Development Workflows

### Setup Commands:

```bash
cd ProspectPro-Real-API-Package
npm install
cp .env.example .env    # Add real API keys
npm run dev            # Start development server
````

### Testing Critical Validations:

```bash
node test/test-real-data.js         # Verify no fake data generation
node test/test-website-validation.js # Verify all URLs work
node debug/inspect-business-data.js  # Debug specific business data
```

## API Integration Patterns

### Google Places Client Usage:

```javascript
const results = await googlePlacesClient.textSearch({
  query: `${businessType} in ${location}`,
  type: "establishment",
});
// ALWAYS check results.status before using data
```

### Error Handling Standard:

```javascript
// ✅ CORRECT: Never fallback to fake data
try {
  const realData = await apiCall();
  return realData;
} catch (error) {
  throw new Error(`Real API failed: ${error.message}`);
  // ❌ NEVER: return generateFakeData();
}
```

### Data Validation Requirements:

Every business MUST pass ALL validation checks:

- `businessName`: Real, specific name (not generic patterns)
- `address`: Geocodeable, not sequential patterns
- `phone`: Valid format, not 555-xxxx fake patterns
- `website`: Returns successful HTTP response
- `email`: Passes deliverability check (80%+ confidence)

## Cost Optimization Strategy

### Pre-validation Scoring:

Before expensive API calls, score businesses 0-100% based on:

- Business name quality (avoid generic names)
- Address completeness and realism
- Phone number format validation
- Website URL structure check

Only proceed with businesses scoring >70% to minimize API waste.

### Rate Limiting & Quotas:

- Google Places: ~$0.032/search, $0.017/details
- Hunter.io: 25 free requests/month
- NeverBounce: 1000 free verifications/month
- Implement request queuing and exponential backoff

## Quality Assurance Patterns

### Export Validation:

```javascript
// Only export businesses meeting ALL criteria:
const qualifiedLeads = businesses.filter(
  (b) =>
    b.isQualified &&
    b.confidenceScore >= 80 &&
    b.validation.businessName.isValid &&
    b.validation.phone.isValid &&
    b.validation.website.isValid &&
    b.validation.email.isValid
);
```

### Confidence Scoring:

- Business Name Verification: 20 points
- Address Verification: 20 points
- Phone Verification: 25 points
- Website Verification: 15 points
- Email Verification: 20 points

## Common Implementation Traps

1. **Fake Data Generation**: Remove any hardcoded business arrays
2. **Sequential Addresses**: Check for patterns like "100 Main St", "110 Main St"
3. **Generic Business Names**: Validate against patterns like "Business LLC", "Company Inc"
4. **Non-working URLs**: Always verify website accessibility before export
5. **Undeliverable Emails**: Never export emails that fail validation

## File-Specific Guidelines

### `api/business-discovery.js`

- Replace any fake data generation with real API calls
- Implement proper error handling without fake fallbacks
- Add pre-validation scoring to reduce API costs

### `modules/api-clients/google-places.js`

- Handle API errors gracefully (don't return fake data)
- Implement proper rate limiting
- Parse business details comprehensively

### `modules/validators/data-validator.js`

- Validate ALL fields before marking business as qualified
- Calculate accurate confidence scores
- Never pass businesses with incomplete data

### `public/app.js`

- Display real validation status to users
- Show actual API costs and success rates
- Handle API failures with clear error messages

## Success Verification

### Before declaring completion:

1. Run full test suite - zero fake data patterns found
2. Export sample leads - all websites return HTTP 200
3. Verify emails - <5% bounce rate on sample
4. Cost accuracy - displayed costs match actual API usage

### Quality KPIs:

- Data Accuracy: >95% of exported leads verified
- Website Accessibility: 100% success rate
- Email Deliverability: <5% bounce rate
- Cost Efficiency: <$0.50 per qualified lead

This rebuild transforms ProspectPro into a premium lead generation platform with verified, real business contact data.
