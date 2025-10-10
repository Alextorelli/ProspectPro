# ProspectPro v4.3 Production Validation Strategy

## Overview: Native Platform-First Debugging

**Philosophy**: Leverage Supabase, Vercel, and browser native tooling for lightweight, iterative issue isolation without external dependencies or complex monitoring infrastructure.

**Approach**: Systematic validation using platform-native logging, real-time observability, and targeted debugging to rapidly identify and resolve production issues.

## 1. Multi-Layer Validation Architecture

### Layer 1: Frontend Health (Vercel + Browser)

- **Tool**: Browser Developer Tools + Vercel Analytics
- **Scope**: User authentication, UI functionality, API call initiation
- **Validation**: Session token generation, frontend state management, network request formation

### Layer 2: Edge Function Health (Supabase)

- **Tool**: Supabase Dashboard Edge Function Logs
- **Scope**: Authentication validation, business logic execution, external API calls
- **Validation**: Session JWT processing, API integration responses, error handling

### Layer 3: Database Operations (Supabase)

- **Tool**: Supabase Dashboard SQL Editor + Real-time Logs
- **Scope**: RLS policy enforcement, data persistence, query performance
- **Validation**: User-scoped data access, campaign creation, lead insertion

### Layer 4: External API Integration (Edge Function Logs)

- **Tool**: Structured logging within Edge Functions
- **Scope**: Google Places, Hunter.io, NeverBounce, Foursquare API responses
- **Validation**: Rate limiting, response parsing, cost tracking

## 2. Iterative Testing Methodology

### Phase 1: Authentication Flow Validation

```bash
# Test 1: Frontend session establishment
# Browser DevTools → Application → Local Storage → sb-* keys
# Expected: Valid session token, user object, refresh token

# Test 2: Edge Function authentication
curl -X POST "https://sriycekxdqnesdsgwiuc.supabase.co/functions/v1/test-new-auth" \
  -H "Authorization: Bearer [SESSION_JWT]" \
  -H "Content-Type: application/json" \
  -d '{"diagnostics": true}'
# Expected: 200 response with user context

# Test 3: Database RLS enforcement
# Supabase SQL Editor: SELECT * FROM campaigns WHERE user_id = auth.uid() LIMIT 1;
# Expected: User-scoped results only
```

### Phase 2: Campaign Discovery Validation

```bash
# Test 4: Background discovery initiation
curl -X POST "https://sriycekxdqnesdsgwiuc.supabase.co/functions/v1/business-discovery-background" \
  -H "Authorization: Bearer [SESSION_JWT]" \
  -H "Content-Type: application/json" \
  -d '{"businessType": "coffee shop", "location": "Seattle, WA", "maxResults": 2, "tierKey": "PROFESSIONAL", "sessionUserId": "validation_test"}'
# Expected: 200 response with campaign ID

# Test 5: Real-time discovery progress
# Supabase Dashboard → Table Editor → campaigns table
# Expected: New campaign row with 'processing' status

# Test 6: Discovery completion
# Wait 30 seconds, refresh campaigns table
# Expected: Campaign status 'completed', results_count > 0
```

### Phase 3: Data Quality Validation

```bash
# Test 7: Lead quality verification
# Supabase SQL Editor:
SELECT business_name, phone, website, email, confidence_score
FROM leads
WHERE campaign_id = '[CAMPAIGN_ID]'
ORDER BY confidence_score DESC LIMIT 5;
# Expected: Non-null phone/website, verified emails only, confidence > 50

# Test 8: Cost tracking accuracy
SELECT SUM(validation_cost) as total_cost
FROM leads
WHERE campaign_id = '[CAMPAIGN_ID]';
# Expected: Reasonable cost per lead ($0.50-$2.00 range)
```

### Phase 4: Export Functionality Validation

```bash
# Test 9: Campaign export generation
curl -X POST "https://sriycekxdqnesdsgwiuc.supabase.co/functions/v1/campaign-export-user-aware" \
  -H "Authorization: Bearer [SESSION_JWT]" \
  -H "Content-Type: application/json" \
  -d '{"campaignId": "[CAMPAIGN_ID]", "format": "csv", "sessionUserId": "validation_test"}'
# Expected: CSV download with complete lead data

# Test 10: Export data integrity
# Verify CSV contains: business_name, phone, website, email, confidence_score
# Expected: All discovered leads present, no fake/generated data
```

## 3. Native Platform Observability Setup

### Supabase Edge Function Logging

```typescript
// Standard logging pattern for all Edge Functions
console.log(`[${functionName}] ${stage}: ${JSON.stringify(data)}`);

// Example stages:
// - AUTH_START, AUTH_SUCCESS, AUTH_FAILED
// - API_REQUEST, API_SUCCESS, API_ERROR
// - DB_QUERY, DB_SUCCESS, DB_ERROR
// - VALIDATION_START, VALIDATION_SUCCESS, VALIDATION_FAILED
```

### Vercel Deployment Monitoring

- **Deployment Logs**: Vercel Dashboard → Deployments → View Function Logs
- **Analytics**: Real-time traffic, error rates, response times
- **Network Tab**: Browser DevTools for client-side request inspection

### Browser-Based Debugging

```javascript
// Frontend debugging utilities
console.log("Supabase Session:", await supabase.auth.getSession());
console.log("Campaign Request:", requestPayload);
console.log("API Response:", response);

// Network monitoring
// DevTools → Network → Filter by 'supabase.co' → Monitor request/response
```

## 4. Issue Isolation Decision Tree

### Authentication Issues (401/403 Errors)

1. **Check**: Browser Local Storage for `sb-*` keys
2. **Verify**: Session token validity in Supabase Auth dashboard
3. **Test**: Direct Edge Function call with curl
4. **Debug**: Edge Function logs for specific authentication errors

### Discovery Issues (Discovery Fails)

1. **Check**: Edge Function logs for API integration errors
2. **Verify**: External API quotas and rate limits
3. **Test**: Individual API calls within Edge Functions
4. **Debug**: Google Places/Foursquare response validation

### Database Issues (Empty Results)

1. **Check**: RLS policies in Supabase dashboard
2. **Verify**: User ID propagation in database queries
3. **Test**: Direct SQL queries in Supabase SQL Editor
4. **Debug**: Campaign and lead table row-level access

### Performance Issues (Slow Response)

1. **Check**: Edge Function execution time in logs
2. **Verify**: External API response times
3. **Test**: Database query performance with EXPLAIN
4. **Debug**: Network latency between services

## 5. Automated Validation Scripts

### Quick Health Check Script

```bash
#!/bin/bash
# scripts/production-health-check.sh

echo "🔍 ProspectPro v4.3 Production Health Check"
echo "============================================"

# Test 1: Frontend accessibility
echo "Testing frontend accessibility..."
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://prospect-28j3db56m-appsmithery.vercel.app)
if [ "$FRONTEND_STATUS" = "200" ]; then
  echo "✅ Frontend: Accessible"
else
  echo "❌ Frontend: Error $FRONTEND_STATUS"
fi

# Test 2: Edge Functions availability
echo "Testing Edge Functions availability..."
EDGE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://sriycekxdqnesdsgwiuc.supabase.co/functions/v1/test-new-auth)
if [ "$EDGE_STATUS" = "401" ]; then
  echo "✅ Edge Functions: Responding (auth required)"
else
  echo "❌ Edge Functions: Unexpected response $EDGE_STATUS"
fi

# Test 3: Database connectivity
echo "Testing database connectivity..."
echo "→ Manual verification required: Check Supabase dashboard connectivity"

echo ""
echo "🎯 Next Steps:"
echo "1. Authenticate in browser: https://prospect-28j3db56m-appsmithery.vercel.app"
echo "2. Extract session JWT from browser Local Storage (sb-* keys)"
echo "3. Run full campaign validation with session token"
```

### Full Campaign Validation Script

```bash
#!/bin/bash
# scripts/campaign-validation.sh

if [ -z "$1" ]; then
  echo "Usage: $0 <SESSION_JWT>"
  exit 1
fi

SESSION_JWT="$1"
CAMPAIGN_TEST_ID="validation_$(date +%s)"

echo "🚀 Full Campaign Validation"
echo "=========================="

# Step 1: Authentication test
echo "Step 1: Testing authentication..."
AUTH_RESPONSE=$(curl -s -X POST "https://sriycekxdqnesdsgwiuc.supabase.co/functions/v1/test-new-auth" \
  -H "Authorization: Bearer $SESSION_JWT" \
  -H "Content-Type: application/json" \
  -d '{"diagnostics": true}')

if echo "$AUTH_RESPONSE" | grep -q '"userId"'; then
  echo "✅ Authentication: Success"
  USER_ID=$(echo "$AUTH_RESPONSE" | grep -o '"userId":"[^"]*"' | cut -d'"' -f4)
  echo "   User ID: $USER_ID"
else
  echo "❌ Authentication: Failed"
  echo "   Response: $AUTH_RESPONSE"
  exit 1
fi

# Step 2: Campaign discovery test
echo "Step 2: Testing campaign discovery..."
DISCOVERY_RESPONSE=$(curl -s -X POST "https://sriycekxdqnesdsgwiuc.supabase.co/functions/v1/business-discovery-background" \
  -H "Authorization: Bearer $SESSION_JWT" \
  -H "Content-Type: application/json" \
  -d "{\"businessType\": \"coffee shop\", \"location\": \"Seattle, WA\", \"maxResults\": 2, \"tierKey\": \"PROFESSIONAL\", \"sessionUserId\": \"$CAMPAIGN_TEST_ID\"}")

if echo "$DISCOVERY_RESPONSE" | grep -q '"campaignId"'; then
  echo "✅ Discovery: Campaign initiated"
  CAMPAIGN_ID=$(echo "$DISCOVERY_RESPONSE" | grep -o '"campaignId":"[^"]*"' | cut -d'"' -f4)
  echo "   Campaign ID: $CAMPAIGN_ID"
else
  echo "❌ Discovery: Failed"
  echo "   Response: $DISCOVERY_RESPONSE"
  exit 1
fi

# Step 3: Wait for processing
echo "Step 3: Waiting for campaign processing (30 seconds)..."
sleep 30

# Step 4: Export test
echo "Step 4: Testing campaign export..."
EXPORT_RESPONSE=$(curl -s -X POST "https://sriycekxdqnesdsgwiuc.supabase.co/functions/v1/campaign-export-user-aware" \
  -H "Authorization: Bearer $SESSION_JWT" \
  -H "Content-Type: application/json" \
  -d "{\"campaignId\": \"$CAMPAIGN_ID\", \"format\": \"csv\", \"sessionUserId\": \"$CAMPAIGN_TEST_ID\"}")

if echo "$EXPORT_RESPONSE" | grep -q '"rowCount"'; then
  echo "✅ Export: Success"
  ROW_COUNT=$(echo "$EXPORT_RESPONSE" | grep -o '"rowCount":[0-9]*' | cut -d':' -f2)
  echo "   Exported Rows: $ROW_COUNT"
else
  echo "❌ Export: Failed"
  echo "   Response: $EXPORT_RESPONSE"
fi

echo ""
echo "🎯 Validation Complete"
echo "Campaign ID: $CAMPAIGN_ID"
echo "Check Supabase dashboard for detailed results"
```

## 6. Debug Information Collection

### Frontend Debug Data Collection

```javascript
// Browser console script for collecting debug information
const debugInfo = {
  timestamp: new Date().toISOString(),
  url: window.location.href,
  userAgent: navigator.userAgent,
  supabaseSession: await supabase.auth.getSession(),
  localStorage: Object.keys(localStorage).filter((k) => k.startsWith("sb-")),
  networkErrors: performance.getEntriesByType("navigation")[0],
  consoleErrors: [], // Manually captured from console
};

console.log("Debug Info:", JSON.stringify(debugInfo, null, 2));
```

### Edge Function Debug Data Collection

```typescript
// Standard debug context for Edge Functions
const debugContext = {
  timestamp: new Date().toISOString(),
  functionName: "business-discovery-background",
  requestId: crypto.randomUUID(),
  userContext: {
    userId: user?.id,
    email: user?.email,
    sessionId: sessionUserId,
  },
  requestPayload: req.body,
  environment: {
    region: Deno.env.get("SUPABASE_REGION"),
    version: Deno.env.get("FUNCTION_VERSION"),
  },
};

console.log(
  `[DEBUG] ${debugContext.functionName}:`,
  JSON.stringify(debugContext)
);
```

## 7. Rapid Issue Resolution Playbook

### Issue: "Invalid JWT" Errors

**Diagnosis Time**: < 2 minutes

1. Check browser Local Storage for `sb-access-token`
2. Verify token expiry in JWT decoder
3. Test fresh authentication in incognito window
4. **Resolution**: Force re-authentication in frontend

### Issue: "Discovery Returns No Results"

**Diagnosis Time**: < 5 minutes

1. Check Edge Function logs for API errors
2. Verify Google Places API quota in Google Cloud Console
3. Test direct API calls with sample queries
4. **Resolution**: Adjust search parameters or check API keys

### Issue: "Database Permission Denied"

**Diagnosis Time**: < 3 minutes

1. Check RLS policies in Supabase dashboard
2. Verify user ID propagation in SQL queries
3. Test direct database access with session user
4. **Resolution**: Update RLS policies or fix user context passing

### Issue: "Export Contains No Data"

**Diagnosis Time**: < 4 minutes

1. Check campaign completion status in database
2. Verify lead insertion during discovery process
3. Test export function with known campaign ID
4. **Resolution**: Re-run discovery or fix lead insertion logic

## 8. Success Metrics & KPIs

### Performance Targets

- **Authentication**: < 500ms session establishment
- **Discovery**: < 60 seconds for 10 leads
- **Export**: < 10 seconds for 100 leads
- **Error Rate**: < 2% for all operations

### Quality Targets

- **Phone Coverage**: > 95% (via Google Places)
- **Website Coverage**: > 90% (via Google Places)
- **Email Accuracy**: > 95% (via Hunter.io + NeverBounce)
- **Zero Fake Data**: 100% verified contacts only

### Observability Targets

- **Log Retention**: 7 days in Supabase
- **Real-time Monitoring**: < 1 minute detection
- **Debug Information**: Complete context in all error logs
- **Issue Resolution**: < 15 minutes average time to fix

This strategy provides comprehensive, lightweight validation using native platform tools while maintaining rapid iteration and targeted issue resolution capabilities.
