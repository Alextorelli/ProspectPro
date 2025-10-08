#!/bin/bash
# Diagnostic Script for Campaign Discovery Failures
# ProspectPro v4.3 - October 8, 2025

set -e

echo "🔍 ProspectPro Campaign Failure Diagnostic"
echo "=========================================="
echo ""

# Resolve environment variables with fallbacks
resolve_env() {
  for var in "$@"; do
    local value="${!var}"
    if [ -n "$value" ]; then
      echo "$value"
      return 0
    fi
  done
  echo ""
}

SUPABASE_URL=$(resolve_env VITE_SUPABASE_URL NEXT_PUBLIC_SUPABASE_URL SUPABASE_URL)
ANON_KEY=$(resolve_env VITE_SUPABASE_ANON_KEY NEXT_PUBLIC_SUPABASE_ANON_KEY SUPABASE_ANON_KEY)

if [ -z "$SUPABASE_URL" ]; then
  SUPABASE_URL="https://sriycekxdqnesdsgwiuc.supabase.co"
  echo "ℹ️  Supabase URL not set in environment. Using default: $SUPABASE_URL"
fi

if [ -z "$ANON_KEY" ]; then
  echo "❌ Supabase anon key not set. Export one of:"
  echo "   - VITE_SUPABASE_ANON_KEY"
  echo "   - NEXT_PUBLIC_SUPABASE_ANON_KEY"
  echo "   - SUPABASE_ANON_KEY"
  exit 1
fi

BASE_URL="${SUPABASE_URL%/}/functions/v1"

echo "1️⃣  Testing Edge Function Deployment..."
echo "----------------------------------------"

# Test if function is deployed and responsive
HEALTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/business-discovery-background" \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"businessType":"test","location":"test","maxResults":1}' || echo "000")

if [ "$HEALTH_RESPONSE" = "401" ]; then
  echo "✅ Edge Function deployed (401 = auth required, expected)"
elif [ "$HEALTH_RESPONSE" = "500" ]; then
  echo "⚠️  Edge Function deployed but returning errors (500)"
elif [ "$HEALTH_RESPONSE" = "000" ]; then
  echo "❌ Edge Function not accessible (connection failed)"
  exit 1
else
  echo "✅ Edge Function deployed (HTTP $HEALTH_RESPONSE)"
fi

echo ""
echo "2️⃣  Checking Database Tables..."
echo "----------------------------------------"

# Check discovery_jobs table exists
JOBS_TABLE=$(curl -s -X GET \
  "$SUPABASE_URL/rest/v1/discovery_jobs?select=id&limit=1" \
  -H "apikey: $ANON_KEY" \
  -H "Authorization: Bearer $ANON_KEY" || echo "[]")

if echo "$JOBS_TABLE" | grep -q "id"; then
  echo "✅ discovery_jobs table exists and accessible"
elif echo "$JOBS_TABLE" | grep -q "error"; then
  echo "❌ discovery_jobs table error:"
  echo "$JOBS_TABLE" | jq '.message' || echo "$JOBS_TABLE"
else
  echo "⚠️  discovery_jobs table response unclear:"
  echo "$JOBS_TABLE"
fi

# Check campaigns table
CAMPAIGNS_TABLE=$(curl -s -X GET \
  "$SUPABASE_URL/rest/v1/campaigns?select=id&limit=1" \
  -H "apikey: $ANON_KEY" \
  -H "Authorization: Bearer $ANON_KEY" || echo "[]")

if echo "$CAMPAIGNS_TABLE" | grep -q "id\|^\[\]$"; then
  echo "✅ campaigns table exists and accessible"
else
  echo "❌ campaigns table may have issues"
fi

# Check leads table
LEADS_TABLE=$(curl -s -X GET \
  "$SUPABASE_URL/rest/v1/leads?select=id&limit=1" \
  -H "apikey: $ANON_KEY" \
  -H "Authorization: Bearer $ANON_KEY" || echo "[]")

if echo "$LEADS_TABLE" | grep -q "id\|^\[\]$"; then
  echo "✅ leads table exists and accessible"
else
  echo "❌ leads table may have issues"
fi

echo ""
echo "3️⃣  Testing Edge Function API Key Configuration..."
echo "----------------------------------------"

# Check for Google Places API key (won't reveal the key, just test if configured)
echo "Note: This test creates a minimal job to check if API keys are configured"

TEST_RESPONSE=$(curl -s -X POST "$BASE_URL/business-discovery-background" \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "businessType": "coffee shop",
    "location": "Seattle, WA",
    "maxResults": 1,
    "sessionUserId": "diagnostic_test"
  }')

echo "$TEST_RESPONSE" | jq '.' 2>/dev/null || echo "$TEST_RESPONSE"

# Check for specific error messages
if echo "$TEST_RESPONSE" | grep -q "API key not configured\|Missing Supabase"; then
  echo ""
  echo "❌ API Keys Missing!"
  echo "   Fix: Configure API keys in Supabase Dashboard → Edge Functions → Secrets"
  echo "   Required secrets:"
  echo "   - GOOGLE_PLACES_API_KEY"
  echo "   - FOURSQUARE_API_KEY (optional)"
  echo "   - CENSUS_API_KEY (optional)"
  exit 1
elif echo "$TEST_RESPONSE" | grep -q "Authentication required"; then
  echo ""
  echo "❌ Authentication Issue!"
  echo "   The Edge Function requires authentication but the request failed"
  echo "   Check: Supabase Auth settings and anon key validity"
  exit 1
elif echo "$TEST_RESPONSE" | grep -q "jobId"; then
  echo ""
  echo "✅ API Keys Configured!"
  JOB_ID=$(echo "$TEST_RESPONSE" | jq -r '.jobId')
  echo "   Test job created: $JOB_ID"
  
  # Wait 3 seconds and check job status
  echo ""
  echo "4️⃣  Monitoring Test Job..."
  echo "----------------------------------------"
  sleep 3
  
  JOB_STATUS=$(curl -s -X GET \
    "$SUPABASE_URL/rest/v1/discovery_jobs?id=eq.$JOB_ID&select=status,progress,current_stage,error" \
    -H "apikey: $ANON_KEY" \
    -H "Authorization: Bearer $ANON_KEY")
  
  echo "$JOB_STATUS" | jq '.[0]' || echo "$JOB_STATUS"
  
  STATUS=$(echo "$JOB_STATUS" | jq -r '.[0].status')
  ERROR_MSG=$(echo "$JOB_STATUS" | jq -r '.[0].error')
  
  if [ "$STATUS" = "failed" ] && [ "$ERROR_MSG" != "null" ]; then
    echo ""
    echo "❌ Job Failed!"
    echo "   Error: $ERROR_MSG"
    exit 1
  elif [ "$STATUS" = "processing" ] || [ "$STATUS" = "pending" ]; then
    echo ""
    echo "✅ Job Running!"
    echo "   Status: $STATUS"
    echo "   The background processing system is working correctly"
  elif [ "$STATUS" = "completed" ]; then
    echo ""
    echo "✅ Job Completed!"
    echo "   The entire discovery pipeline is working correctly"
  fi
else
  echo ""
  echo "⚠️  Unexpected Response:"
  echo "$TEST_RESPONSE"
fi

echo ""
echo "5️⃣  Checking Edge Function Logs..."
echo "----------------------------------------"
echo "To view live logs, run:"
echo "  supabase functions logs business-discovery-background --follow"
echo ""
echo "Or check logs in Supabase Dashboard:"
echo "  Edge Functions → business-discovery-background → Logs"

echo ""
echo "=========================================="
echo "✅ Diagnostic Complete!"
echo ""
echo "Common Issues:"
echo "  1. API Keys Missing → Configure in Edge Function secrets"
echo "  2. Auth Required → Use valid JWT token in Authorization header"
echo "  3. Job Fails → Check Edge Function logs for detailed errors"
echo "  4. Table Access → Verify RLS policies allow anon access"
echo ""
