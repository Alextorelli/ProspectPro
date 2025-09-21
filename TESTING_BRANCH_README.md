# 🧪 ProspectPro - Iterative Testing Branch v1

**Branch:** `iterative-testing-v1`  
**Purpose:** Real API integration testing and validation  
**Status:** Ready for real data testing  
**Date:** September 21, 2025

---

## 🎯 Branch Overview

This branch is specifically configured for **real API testing** with actual business data sources. All fake data generation has been eliminated and replaced with production-ready API integrations.

### 🚀 Key Features
- ✅ **Zero fake data** - All simulation code removed
- ✅ **Real API integrations** - Google Places, Foursquare, Hunter.io, NeverBounce
- ✅ **4-stage validation pipeline** - Discovery → Pre-validation → Enrichment → Qualification
- ✅ **Cost optimization** - Pre-validation filtering and budget controls
- ✅ **Quality enforcement** - 80%+ confidence threshold for exports

---

## 🔧 API Configuration Required

### Environment Variables (.env)
```bash
# Required for real API testing
GOOGLE_PLACES_API_KEY=your_google_places_key_here
FOURSQUARE_API_KEY=your_foursquare_key_here
HUNTER_IO_API_KEY=your_hunter_io_key_here
NEVERBOUNCE_API_KEY=your_neverbounce_key_here

# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_SECRET_KEY=your_supabase_service_role_key

# Optional: Testing Configuration
ALLOW_DEGRADED_START=true
NODE_ENV=testing
```

### API Key Sources
- **Google Places**: [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
- **Foursquare**: [Foursquare Developer Portal](https://developer.foursquare.com/)
- **Hunter.io**: [Hunter.io Dashboard](https://hunter.io/api_keys)
- **NeverBounce**: [NeverBounce API](https://app.neverbounce.com/settings/api)

---

## 🏃‍♂️ Quick Start Testing

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure API Keys
```bash
cp .env.example .env
# Edit .env with your real API keys
```

### 3. Start Server
```bash
npm run dev
# Server starts on http://localhost:3000
```

### 4. Test Real API Integration
```bash
# Run fake data verification (should pass)
node test/verify-no-fake-data.js

# Test production API structure
node test/test-production-api-real-data.js

# Test real business discovery (requires API keys)
curl -X POST http://localhost:3000/api/business-discovery \
  -H "Content-Type: application/json" \
  -d '{"query":"plumbing contractors","location":"San Diego, CA","maxResults":3,"budget":2.0}'
```

---

## 📁 Testing Files Structure

```
test/
├── verify-no-fake-data.js          # Scans codebase for fake data patterns
├── test-production-api-real-data.js # Verifies API structure & readiness
└── test-core-integration.js        # Integration test suite

modules/
├── api-clients/                     # Real API client implementations
│   ├── google-places.js           # Google Places API integration
│   ├── foursquare-places-client.js # Foursquare Places API
│   ├── enhanced-hunter-client.js  # Hunter.io email discovery
│   └── enhanced-state-registry-client.js # State business registries
├── enhanced-lead-discovery.js      # Main 4-stage pipeline
└── validators/                     # Data quality validation
    ├── data-validator.js          # Business data validation
    └── pre-validation.js          # Pre-API call filtering
```

---

## 🔍 Verification Commands

### Check System Health
```bash
# Basic health check
curl http://localhost:3000/health

# Full diagnostics (includes DB connection)
curl http://localhost:3000/diag

# Readiness probe (requires privileged DB access)
curl http://localhost:3000/ready
```

### Validate No Fake Data
```bash
# Comprehensive fake data scan
node test/verify-no-fake-data.js
# Expected: "✅ VERIFICATION PASSED - No fake data generation patterns found!"
```

### Test API Integrations
```bash
# Test individual API clients (with your keys)
node -e "
const GooglePlaces = require('./modules/api-clients/google-places.js');
const client = new GooglePlaces(process.env.GOOGLE_PLACES_API_KEY);
client.textSearch({query: 'restaurants in New York'}).then(console.log);
"
```

---

## 💰 Cost Management

### Pre-Validation Filtering
- Businesses are scored 0-100% before expensive API calls
- Only businesses scoring ≥70% proceed to enrichment
- Prevents waste on obviously fake/incomplete data

### API Cost Estimates
```
Google Places Text Search: ~$0.032 per request
Google Places Details: ~$0.017 per request
Foursquare Places: Free (950 requests/day)
Hunter.io Domain Search: ~$0.04 per request (25 free/month)
NeverBounce Email Verification: ~$0.008 per request (1000 free/month)
```

### Budget Controls
- Configurable budget limits per campaign
- Real-time cost tracking and alerts
- Automatic stop when budget exceeded

---

## 🎯 Quality Standards

### Export Requirements (All Must Pass)
- ✅ **Business name**: Real, specific (not generic patterns)
- ✅ **Address**: Geocoded to real coordinates
- ✅ **Phone**: Valid US format (no 555/000/111 prefixes)
- ✅ **Website**: Returns HTTP 200-399 status codes
- ✅ **Email**: Passes deliverability validation (≥80% confidence)
- ✅ **Overall confidence**: ≥80/100 score required

### Multi-Source Verification
- Cross-reference Google Places + Foursquare data
- State business registration validation (where available)
- Website accessibility and content verification
- Professional email deliverability testing

---

## 🐛 Troubleshooting

### Common Issues

**"API key not configured" errors:**
- Verify `.env` file has correct API keys
- Check key names match exactly: `GOOGLE_PLACES_API_KEY`, etc.
- Restart server after adding keys

**"No businesses found" results:**
- Check API quotas aren't exceeded
- Try broader search terms or different locations
- Verify API keys have proper permissions enabled

**Database connection failures:**
- Check `SUPABASE_URL` and `SUPABASE_SECRET_KEY` in `.env`
- Verify Supabase project is active and accessible
- Use `ALLOW_DEGRADED_START=true` to start without DB

---

## 🚀 Expected Results

### Sample Successful Response
```json
{
  "success": true,
  "businesses": [
    {
      "name": "Priority Plumbing Services",
      "address": "1234 Miramar Rd, San Diego, CA 92126",
      "phone": "(619) 442-1234",
      "website": "https://priorityplumbingsd.com",
      "email": "contact@priorityplumbingsd.com",
      "confidence_score": 87,
      "validation_results": {
        "businessName": {"isValid": true, "score": 90},
        "address": {"isValid": true, "score": 85},
        "phone": {"isValid": true, "score": 85},
        "website": {"isValid": true, "status": 200, "score": 95},
        "email": {"isValid": true, "deliverable": true, "confidence": 89}
      },
      "total_cost": 0.097
    }
  ],
  "totalProcessed": 3,
  "qualifiedCount": 1,
  "qualificationRate": 33.3,
  "totalCost": 0.234
}
```

---

## 📞 Support

For testing issues or questions about this branch:
1. Check the troubleshooting section above
2. Review API key configuration
3. Verify all dependencies are installed
4. Check server logs for detailed error messages

**Branch Status**: Production-ready for real API testing  
**Last Updated**: September 21, 2025