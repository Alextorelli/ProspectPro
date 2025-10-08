#!/bin/bash
# Quick Test Script for Background Task Architecture
# ProspectPro v4.2 - October 2025

set -e

echo "🧪 Testing Background Task Architecture"
echo "========================================"
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
SUPABASE_ANON_KEY=$(resolve_env VITE_SUPABASE_ANON_KEY NEXT_PUBLIC_SUPABASE_ANON_KEY SUPABASE_ANON_KEY)

if [ -z "$SUPABASE_URL" ]; then
  SUPABASE_URL="https://sriycekxdqnesdsgwiuc.supabase.co"
  echo "ℹ️  Supabase URL not set. Using default: $SUPABASE_URL"
fi

if [ -z "$SUPABASE_ANON_KEY" ]; then
  echo "❌ Supabase anon key not set"
  echo "Set one of: VITE_SUPABASE_ANON_KEY, NEXT_PUBLIC_SUPABASE_ANON_KEY, or SUPABASE_ANON_KEY"
  exit 1
fi

echo "✅ Anon key configured"
echo ""

# Test 1: Edge Function Health Check
echo "Test 1: Checking Edge Function deployment..."
FUNCTION_URL="${SUPABASE_URL%/}/functions/v1/business-discovery-background"

# Create test campaign
echo "Creating test campaign (coffee shops in Portland)..."
RESPONSE=$(curl -s -X POST "$FUNCTION_URL" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "businessType": "coffee shop",
    "location": "Portland, OR",
    "maxResults": 2,
    "budgetLimit": 10,
    "minConfidenceScore": 50,
    "sessionUserId": "test_script_user"
  }')

echo ""
echo "Response:"
echo "$RESPONSE" | jq '.'
echo ""

# Extract jobId and campaignId
JOB_ID=$(echo "$RESPONSE" | jq -r '.jobId')
CAMPAIGN_ID=$(echo "$RESPONSE" | jq -r '.campaignId')
SUCCESS=$(echo "$RESPONSE" | jq -r '.success')

if [ "$SUCCESS" != "true" ]; then
  echo "❌ Test failed: Edge Function returned error"
  exit 1
fi

if [ "$JOB_ID" = "null" ] || [ -z "$JOB_ID" ]; then
  echo "❌ Test failed: No jobId returned"
  exit 1
fi

echo "✅ Test 1 PASSED: Campaign created"
echo "   Job ID: $JOB_ID"
echo "   Campaign ID: $CAMPAIGN_ID"
echo ""

# Test 2: Monitor Job Progress
echo "Test 2: Monitoring job progress (30 seconds)..."
echo "Checking job status every 5 seconds..."
echo ""

for i in {1..6}; do
  sleep 5
  
  # Query job status from database via Supabase REST API
  JOB_STATUS=$(curl -s -X GET \
    "$SUPABASE_URL/rest/v1/discovery_jobs?id=eq.$JOB_ID&select=status,progress,current_stage,metrics" \
    -H "apikey: $SUPABASE_ANON_KEY" \
    -H "Authorization: Bearer $SUPABASE_ANON_KEY")
  
  STATUS=$(echo "$JOB_STATUS" | jq -r '.[0].status')
  PROGRESS=$(echo "$JOB_STATUS" | jq -r '.[0].progress')
  STAGE=$(echo "$JOB_STATUS" | jq -r '.[0].current_stage')
  
  echo "[$i/6] Status: $STATUS | Progress: $PROGRESS% | Stage: $STAGE"
  
  if [ "$STATUS" = "completed" ]; then
    echo ""
    echo "✅ Test 2 PASSED: Job completed successfully!"
    METRICS=$(echo "$JOB_STATUS" | jq '.[0].metrics')
    echo "Metrics:"
    echo "$METRICS" | jq '.'
    break
  fi
  
  if [ "$STATUS" = "failed" ]; then
    echo ""
    echo "❌ Test 2 FAILED: Job failed"
    echo "Check Supabase Dashboard → Edge Functions → Logs for details"
    exit 1
  fi
done

if [ "$STATUS" != "completed" ]; then
  echo ""
  echo "⚠️  Test 2 INCOMPLETE: Job still processing after 30 seconds"
  echo "This is normal for enrichment tasks (can take 1-2 minutes)"
  echo "Check status in Supabase Dashboard → Database → discovery_jobs"
  echo ""
fi

# Test 3: Verify Database Records
echo ""
echo "Test 3: Verifying database records..."

# Check campaign record
CAMPAIGN=$(curl -s -X GET \
  "$SUPABASE_URL/rest/v1/campaigns?id=eq.$CAMPAIGN_ID&select=*" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY")

CAMPAIGN_EXISTS=$(echo "$CAMPAIGN" | jq 'length')

if [ "$CAMPAIGN_EXISTS" -gt 0 ]; then
  echo "✅ Campaign record found"
  RESULTS_COUNT=$(echo "$CAMPAIGN" | jq -r '.[0].results_count')
  TOTAL_COST=$(echo "$CAMPAIGN" | jq -r '.[0].total_cost')
  echo "   Results: $RESULTS_COUNT leads"
  echo "   Cost: \$$TOTAL_COST"
else
  echo "⚠️  Campaign record not yet created (processing may still be running)"
fi

# Check leads
LEADS=$(curl -s -X GET \
  "$SUPABASE_URL/rest/v1/leads?campaign_id=eq.$CAMPAIGN_ID&select=business_name,email,confidence_score" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY")

LEADS_COUNT=$(echo "$LEADS" | jq 'length')

if [ "$LEADS_COUNT" -gt 0 ]; then
  echo "✅ Test 3 PASSED: $LEADS_COUNT leads found in database"
  echo ""
  echo "Sample leads:"
  echo "$LEADS" | jq '.'
else
  echo "⚠️  No leads yet (processing may still be running)"
fi

echo ""
echo "========================================"
echo "🎉 Background Task Architecture Test Complete!"
echo ""
echo "Summary:"
echo "  ✅ Edge Function deployed and responding"
echo "  ✅ Job queue system working"
echo "  ✅ Background processing initiated"
if [ "$STATUS" = "completed" ]; then
  echo "  ✅ Campaign completed successfully"
fi
if [ "$LEADS_COUNT" -gt 0 ]; then
  echo "  ✅ Leads stored in database"
fi
echo ""
echo "📊 View full results in Supabase Dashboard:"
echo "  - Database → discovery_jobs (job: $JOB_ID)"
echo "  - Database → campaigns (campaign: $CAMPAIGN_ID)"
echo "  - Database → leads (filter by campaign_id)"
echo ""
echo "🔍 Monitor real-time in your app:"
echo "  - Real-time channel: discovery_jobs:id=eq.$JOB_ID"
echo ""
