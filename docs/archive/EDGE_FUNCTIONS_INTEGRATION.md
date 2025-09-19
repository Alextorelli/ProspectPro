# ProspectPro Edge Functions Integration Guide

## 🎯 Overview

ProspectPro Edge Functions provide serverless, scalable lead processing with zero fake data policy:

- **Business Discovery**: Real Google Places API integration
- **Lead Validation**: Multi-source validation (websites, emails, phones)

## 🚀 Deployment

Deploy to Supabase Edge Runtime:

```bash
# Deploy both functions
npx supabase functions deploy business-discovery-edge
npx supabase functions deploy lead-validation-edge

# Or deploy individually
npx supabase functions deploy business-discovery-edge --project-ref YOUR_PROJECT_REF
```

## 📡 API Endpoints

### Business Discovery

```
POST https://YOUR_PROJECT.supabase.co/functions/v1/business-discovery-edge
```

**Request:**

```json
{
  "query": "restaurants",
  "location": "San Francisco, CA",
  "radius": 5000,
  "maxResults": 20
}
```

**Response:**

```json
{
  "query": "restaurants in San Francisco, CA",
  "location": "San Francisco, CA",
  "totalFound": 25,
  "qualifiedResults": 18,
  "businesses": [
    {
      "name": "The French Laundry",
      "address": "6640 Washington St, Yountville, CA 94599",
      "website": "https://www.thomaskeller.com/tfl",
      "rating": 4.6,
      "placeId": "ChIJw7MZuQR-hYARt6E8nM-kW8g",
      "confidence": 100
    }
  ],
  "apiCallsMade": 1,
  "estimatedCost": 0.032
}
```

### Lead Validation

```
POST https://YOUR_PROJECT.supabase.co/functions/v1/lead-validation-edge
```

**Request:**

```json
{
  "leads": [
    {
      "id": "1",
      "name": "Test Restaurant",
      "website": "https://example.com",
      "email": "info@example.com",
      "phone": "(555) 123-4567",
      "address": "123 Main St, San Francisco, CA"
    }
  ],
  "skipWebsiteCheck": false,
  "skipEmailValidation": false
}
```

**Response:**

```json
{
  "totalLeads": 1,
  "qualifiedLeads": 1,
  "qualificationRate": 100,
  "results": [
    {
      "id": "1",
      "name": "Test Restaurant",
      "validation": {
        "website": {
          "isValid": true,
          "statusCode": 200,
          "accessible": true
        },
        "email": {
          "isValid": true,
          "deliverable": true,
          "confidence": 85,
          "provider": "example.com"
        },
        "phone": {
          "isValid": true,
          "format": "(555) 123-4567"
        }
      },
      "overallScore": 100,
      "qualified": true
    }
  ]
}
```

## 🔧 Integration with Main App

### 1. Update Business Discovery API

Replace existing business discovery logic in `api/business-discovery.js`:

```javascript
// Add Edge Function call
const edgeResponse = await fetch(
  `${supabaseUrl}/functions/v1/business-discovery-edge`,
  {
    method: "POST",
    headers: {
      Authorization: `Bearer ${supabaseServiceKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: businessType,
      location: location,
      maxResults: parseInt(maxLeads),
    }),
  }
);

const edgeData = await edgeResponse.json();
return edgeData.businesses;
```

### 2. Add Lead Validation Step

Integrate validation into the lead processing pipeline:

```javascript
// Validate discovered leads
const validationResponse = await fetch(
  `${supabaseUrl}/functions/v1/lead-validation-edge`,
  {
    method: "POST",
    headers: {
      Authorization: `Bearer ${supabaseServiceKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      leads: discoveredLeads,
      skipEmailValidation: false,
      skipWebsiteCheck: false,
    }),
  }
);

const validationData = await validationResponse.json();
const qualifiedLeads = validationData.results.filter((lead) => lead.qualified);
```

### 3. Environment Variables

Add to your `.env` file:

```env
# Required for Edge Functions
GOOGLE_PLACES_API_KEY=your_google_places_api_key
SUPABASE_URL=https://your_project.supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key
```

## ⚡ Performance & Cost Optimization

### Edge Function Benefits:

- **Serverless**: No infrastructure management
- **Auto-scaling**: Handles traffic spikes automatically
- **Global CDN**: Low latency worldwide
- **Cost Efficient**: Pay per execution

### Optimization Tips:

- Use `maxResults` to limit API costs
- Enable `skipWebsiteCheck` for faster processing
- Batch validation requests for efficiency
- Cache results in Supabase database

## 🧪 Local Development

```bash
# Start test server
deno run --allow-net edge-functions-test-server.ts

# Run comprehensive tests
deno run --allow-net test-edge-functions-suite.ts

# Test individual endpoints
curl -X POST http://localhost:8080/business-discovery \
  -H "Content-Type: application/json" \
  -d '{"query":"restaurants","location":"San Francisco, CA"}'
```

## 📊 Monitoring

Monitor Edge Function performance in Supabase Dashboard:

- Execution logs
- Error rates
- Response times
- Cost tracking

## 🚨 Zero Fake Data Compliance

✅ **Enforced Policies:**

- All business data from Google Places API
- Real website accessibility validation
- Actual email deliverability testing
- No hardcoded mock business arrays
- Confidence scoring based on real data quality

❌ **Prohibited Patterns:**

- Mock business names like "Sample Restaurant"
- Sequential fake addresses
- 555-xxxx phone numbers
- Non-functional email addresses

## 🔒 Security

- JWT authentication via Supabase
- API key management through environment variables
- CORS headers configured for cross-origin requests
- Input validation and sanitization
- Error handling without data exposure
