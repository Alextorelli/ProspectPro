# ProspectPro v4.3 Debug Collection Guide

## Browser Debug Data Collection

### Frontend Session Information

```javascript
// Run this in browser console at https://prospect-28j3db56m-appsmithery.vercel.app
const debugInfo = {
  timestamp: new Date().toISOString(),
  url: window.location.href,
  userAgent: navigator.userAgent,
  supabaseSession: await supabase.auth.getSession(),
  localStorage: Object.keys(localStorage).filter((k) => k.startsWith("sb-")),
  sessionStorage: Object.keys(sessionStorage).filter((k) =>
    k.startsWith("sb-")
  ),
  networkTiming: performance.getEntriesByType("navigation")[0],
  errors: [], // Manually captured from console
};

console.log("🔍 Frontend Debug Info:");
console.log(JSON.stringify(debugInfo, null, 2));

// Copy this output for troubleshooting
copy(JSON.stringify(debugInfo, null, 2));
```

### Session JWT Extraction

```javascript
// Get current session JWT for API testing
const {
  data: { session },
} = await supabase.auth.getSession();
if (session) {
  console.log("🔑 Session JWT:", session.access_token);
  console.log("📅 Expires:", new Date(session.expires_at * 1000));
  copy(session.access_token);
} else {
  console.log("❌ No active session");
}
```

### Network Request Monitoring

```javascript
// Monitor API calls in real-time
const originalFetch = window.fetch;
window.fetch = function (...args) {
  console.log("🌐 API Request:", args[0], args[1]);
  return originalFetch
    .apply(this, arguments)
    .then((response) => {
      console.log("📥 API Response:", response.status, response.url);
      return response;
    })
    .catch((error) => {
      console.log("❌ API Error:", error);
      throw error;
    });
};
```

## Edge Function Debug Patterns

### Standard Logging Template

```typescript
// Add to all Edge Functions for comprehensive debugging
const debugContext = {
  timestamp: new Date().toISOString(),
  functionName: "business-discovery-background",
  requestId: crypto.randomUUID(),
  userContext: {
    userId: user?.id,
    email: user?.email,
    sessionId: sessionUserId,
  },
  requestPayload: requestBody,
  environment: {
    region: Deno.env.get("SUPABASE_REGION"),
    version: "4.3.0",
  },
};

console.log(
  `[DEBUG] ${debugContext.functionName}:`,
  JSON.stringify(debugContext)
);

// Add stage-specific logging
console.log(`[AUTH] ${debugContext.functionName}: Authentication successful`);
console.log(`[API] ${debugContext.functionName}: Calling external API`);
console.log(`[DB] ${debugContext.functionName}: Database operation complete`);
console.log(
  `[RESULT] ${debugContext.functionName}: Function execution complete`
);
```

### Error Context Collection

```typescript
// Enhanced error logging with full context
try {
  // Function logic here
} catch (error) {
  const errorContext = {
    timestamp: new Date().toISOString(),
    functionName: "business-discovery-background",
    errorMessage: error.message,
    errorStack: error.stack,
    userContext: debugContext.userContext,
    requestData: debugContext.requestPayload,
    apiResponses: {}, // Capture API responses leading to error
  };

  console.error(
    `[ERROR] ${debugContext.functionName}:`,
    JSON.stringify(errorContext)
  );

  return new Response(
    JSON.stringify({
      error: "Internal server error",
      requestId: debugContext.requestId,
      timestamp: errorContext.timestamp,
    }),
    {
      status: 500,
      headers: { "Content-Type": "application/json" },
    }
  );
}
```

## Platform-Specific Debug Commands

### Supabase Dashboard Debugging

```sql
-- Check recent campaigns for user
SELECT
  id, business_type, location, status, results_count,
  total_cost, created_at, user_id
FROM campaigns
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC
LIMIT 10;

-- Analyze lead quality for campaign
SELECT
  business_name, phone, website, email, confidence_score,
  validation_cost, created_at
FROM leads
WHERE campaign_id = 'YOUR_CAMPAIGN_ID'
ORDER BY confidence_score DESC
LIMIT 20;

-- Check user session activity
SELECT
  COUNT(*) as campaign_count,
  SUM(results_count) as total_leads,
  SUM(total_cost) as total_spent,
  MAX(created_at) as last_activity
FROM campaigns
WHERE user_id = auth.uid();

-- Validate RLS policies
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM campaigns WHERE user_id = auth.uid() LIMIT 1;
```

### Vercel Deployment Debugging

```bash
# Check deployment status and logs
vercel --version
vercel whoami
vercel ls prospect-pro
vercel logs https://prospect-28j3db56m-appsmithery.vercel.app

# Test deployment health
curl -I https://prospect-28j3db56m-appsmithery.vercel.app
curl -s https://prospect-28j3db56m-appsmithery.vercel.app | grep -E "(title|version|error)"

# Check cache headers
curl -I https://prospect-28j3db56m-appsmithery.vercel.app | grep -i cache
```

## Issue-Specific Debug Workflows

### Authentication Issues

1. **Frontend Session Check**

   ```javascript
   const {
     data: { session },
     error,
   } = await supabase.auth.getSession();
   console.log("Session:", session, "Error:", error);
   ```

2. **Edge Function Auth Test**

   ```bash
   curl -X POST "https://sriycekxdqnesdsgwiuc.supabase.co/functions/v1/test-new-auth" \
     -H "Authorization: Bearer YOUR_SESSION_JWT" \
     -H "Content-Type: application/json" \
     -d '{"diagnostics": true}'
   ```

3. **Database RLS Verification**
   ```sql
   SELECT * FROM campaigns WHERE business_type = 'test' LIMIT 1;
   ```

### Discovery Issues

1. **API Integration Test**

   ```bash
   # Test Google Places API quota
   curl "https://maps.googleapis.com/maps/api/place/textsearch/json?query=test&key=YOUR_API_KEY"

   # Check Hunter.io quota
   curl "https://api.hunter.io/v2/account?api_key=YOUR_API_KEY"
   ```

2. **Edge Function Discovery Test**

   ```bash
   curl -X POST "https://sriycekxdqnesdsgwiuc.supabase.co/functions/v1/business-discovery-background" \
     -H "Authorization: Bearer YOUR_SESSION_JWT" \
     -H "Content-Type: application/json" \
     -d '{"businessType": "coffee shop", "location": "Seattle, WA", "maxResults": 2, "tierKey": "PROFESSIONAL", "sessionUserId": "debug_test"}'
   ```

3. **Database Lead Verification**
   ```sql
   SELECT COUNT(*) FROM leads WHERE campaign_id = 'YOUR_CAMPAIGN_ID';
   ```

### Performance Issues

1. **Edge Function Timing**

   ```bash
   time curl -X POST "https://sriycekxdqnesdsgwiuc.supabase.co/functions/v1/test-new-auth" \
     -H "Authorization: Bearer YOUR_SESSION_JWT" \
     -H "Content-Type: application/json" \
     -d '{"diagnostics": true}'
   ```

2. **Database Query Performance**

   ```sql
   EXPLAIN (ANALYZE, BUFFERS)
   SELECT * FROM leads
   WHERE campaign_id = 'YOUR_CAMPAIGN_ID'
   ORDER BY confidence_score DESC;
   ```

3. **Frontend Load Time**
   ```javascript
   // Measure page load performance
   console.log(
     "Navigation Timing:",
     performance.getEntriesByType("navigation")[0]
   );
   console.log(
     "Resource Timing:",
     performance.getEntriesByType("resource").slice(0, 10)
   );
   ```

## Debug Data Export

### Complete System State Export

```bash
#!/bin/bash
# Generate comprehensive debug report

DEBUG_DIR="/tmp/prospectpro_debug_$(date +%s)"
mkdir -p "$DEBUG_DIR"

# System information
echo "ProspectPro v4.3 Debug Report" > "$DEBUG_DIR/system_info.txt"
echo "Generated: $(date)" >> "$DEBUG_DIR/system_info.txt"
echo "Frontend URL: https://prospect-28j3db56m-appsmithery.vercel.app" >> "$DEBUG_DIR/system_info.txt"
echo "Edge Functions: https://sriycekxdqnesdsgwiuc.supabase.co/functions/v1/" >> "$DEBUG_DIR/system_info.txt"

# Test results
./scripts/production-health-check.sh > "$DEBUG_DIR/health_check.txt" 2>&1

# API connectivity
curl -I https://prospect-28j3db56m-appsmithery.vercel.app > "$DEBUG_DIR/frontend_status.txt" 2>&1
curl -I https://sriycekxdqnesdsgwiuc.supabase.co/functions/v1/test-new-auth > "$DEBUG_DIR/edge_functions_status.txt" 2>&1

# Package debug report
tar -czf "prospectpro_debug_$(date +%s).tar.gz" -C "$DEBUG_DIR" .
echo "Debug report created: prospectpro_debug_$(date +%s).tar.gz"
```

## Real-Time Monitoring Setup

### Browser Console Monitoring

```javascript
// Set up continuous monitoring in browser console
setInterval(async () => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  console.log(
    `[MONITOR] ${new Date().toISOString()}: Session valid:`,
    !!session
  );
}, 30000); // Check every 30 seconds
```

### Edge Function Health Monitoring

```bash
#!/bin/bash
# Monitor edge function health every minute

while true; do
  TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://sriycekxdqnesdsgwiuc.supabase.co/functions/v1/test-new-auth")

  if [ "$STATUS" = "401" ]; then
    echo "[$TIMESTAMP] ✅ Edge Functions: Healthy (auth required)"
  else
    echo "[$TIMESTAMP] ❌ Edge Functions: Unhealthy ($STATUS)"
  fi

  sleep 60
done
```

This debug guide provides comprehensive tools for rapid issue identification and resolution using native platform capabilities.
