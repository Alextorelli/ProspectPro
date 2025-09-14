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

```javascript
// ❌ NEVER DO THIS:
const fakeBusinesses = ["Artisan Bistro", "Downtown Café"];
const fakeAddresses = ["100 Main St", "110 Main St", "120 Main St"];
const fakePhones = ["(512) 555-0123", "(000) 123-4567"];
```

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
```

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
