#!/bin/bash
# Diagnostic Script for Campaign Discovery Failures
# ProspectPro v4.3 - October 8, 2025

set -euo pipefail

EXPECTED_REPO_ROOT=${EXPECTED_REPO_ROOT:-/workspaces/ProspectPro}

require_repo_root() {
  local repo_root
  if ! repo_root=$(git rev-parse --show-toplevel 2>/dev/null); then
    echo "❌ Run this script from inside the ProspectPro repo"
    exit 1
  fi

  if [ "$repo_root" != "$EXPECTED_REPO_ROOT" ]; then
    echo "❌ Wrong directory. Expected repo root: $EXPECTED_REPO_ROOT"
    echo "   Current directory: $repo_root"
    exit 1
  fi
}

require_repo_root

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
# shellcheck source=/workspaces/ProspectPro/integration/platform/supabase/scripts/operations/supabase_cli_helpers.sh
if ! REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null); then
  REPO_ROOT=$(cd "$SCRIPT_DIR/../../.." && pwd)
fi
source "$REPO_ROOT/integration/platform/supabase/scripts/operations/supabase_cli_helpers.sh"

usage() {
  cat <<'EOF'
Usage: diagnose-campaign-failure.sh [mode]

Modes:
  business-discovery   Analyze Supabase logs for discovery functions (24h window)
  enrichment           Analyze Supabase logs for enrichment functions (24h window)
  export               Analyze Supabase logs for export functions (24h window)
  --help               Show this message

Run without arguments to execute the full campaign diagnostic flow.
EOF
}

analyze_function_logs() {
  local fn="$1"
  local hours="${2:-24}"
  supabase_setup || return 1
  local sanitized_fn
  sanitized_fn=$(printf '%s' "$fn" | tr '/' '_')
  local log_file="/tmp/${sanitized_fn}_logs.txt"

  echo "📊 Analyzing logs for $fn (last ${hours}h)"
  if ! prospectpro_supabase_cli functions logs "$fn" --since="${hours}h" | tee "$log_file"; then
    echo "⚠️  Unable to stream logs with Supabase CLI; collect logs via Supabase dashboard." >&2
    return 1
  fi

  echo "🔍 Error patterns:"
  if ! grep -Ei '(error|timeout|429|500|503)' "$log_file" | cut -d' ' -f4- | sort | uniq -c | sort -nr | head -20; then
    echo "No error signatures detected in captured window."
  fi
  echo "Logs saved to $log_file"
}

case "${1:-}" in
  --help|-h)
    usage
    exit 0
    ;;
  business-discovery)
    analyze_function_logs "business-discovery-background" 24
    analyze_function_logs "business-discovery-optimized" 24
    exit 0
    ;;
  enrichment)
    analyze_function_logs "enrichment-orchestrator" 24
    analyze_function_logs "enrichment-hunter" 24
    analyze_function_logs "enrichment-neverbounce" 24
    exit 0
    ;;
  export)
    analyze_function_logs "campaign-export-user-aware" 24
    exit 0
    ;;
esac

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
USER_TOKEN=$(resolve_env SUPABASE_USER_TOKEN SUPABASE_ACCESS_TOKEN)

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
echo "3️⃣  Testing Edge Function with User Authentication..."
echo "----------------------------------------"

# Check if user is logged in via Supabase CLI
echo "Checking Supabase CLI login status..."
if prospectpro_supabase_cli projects list >/dev/null 2>&1; then
  echo "✅ Supabase CLI authenticated"
  
  # Try to use an existing user session token
  if [ -n "$USER_TOKEN" ]; then
    echo "Using provided user session token"
  else
    echo "No user session token provided; falling back to publishable key"
  fi

  AUTH_TOKEN="${USER_TOKEN:-$ANON_KEY}"
  if [ -n "$USER_TOKEN" ]; then
    echo "Using provided user access token for authentication"
  else
    echo "Using anon key (may require user session for background discovery)"
  fi
  
  echo "Testing Edge Function with authentication..."
  TEST_RESPONSE=$(curl -s -X POST "$BASE_URL/business-discovery-background" \
    -H "Authorization: Bearer $AUTH_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "businessType": "coffee shop",
      "location": "Seattle, WA",
      "maxResults": 1,
      "sessionUserId": "diagnostic_test_cli"
    }')
  
  echo "$TEST_RESPONSE" | jq '.' 2>/dev/null || echo "$TEST_RESPONSE"
  
  # If we get Invalid JWT, provide guidance for getting a real user session
  if echo "$TEST_RESPONSE" | grep -q "Invalid JWT"; then
    echo ""
    echo "ℹ️  Edge Function requires authenticated user session."
    echo "   To get a user access token:"
    echo "   1. Sign up/in to your app in browser"
    echo "   2. Open browser DevTools → Application → Local Storage"
    echo "   3. Find 'sb-<project-id>-auth-token' key"
    echo "   4. Copy the 'access_token' value"
    echo "   5. Export it: export SUPABASE_USER_TOKEN=\"<access_token>\""
    echo "   6. Re-run this script"
    echo ""
  fi
  
else
  echo "❌ Supabase CLI not authenticated"
  echo "   Run: source scripts/ensure-supabase-cli-session.sh"
  echo ""
  
  # Fall back to anon key testing
  echo "Testing with anon key only..."
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
fi

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
elif echo "$TEST_RESPONSE" | grep -q "Authentication required\|Invalid JWT"; then
  echo ""
  echo "❌ Authentication Issue!"
  echo "   The Edge Function requires a valid user session token."
  echo "   This is expected for user-aware background discovery."
  echo ""
  echo "   To test with a real user session:"
  echo "   1. Sign in to your app at: https://prospect-fyhedobh1-appsmithery.vercel.app"
  echo "   2. Open DevTools → Application → Local Storage"
  echo "   3. Find key: sb-sriycekxdqnesdsgwiuc-auth-token"
  echo "   4. Copy the 'access_token' value from the JSON"
  echo "   5. Export: export SUPABASE_USER_TOKEN=\"<access_token>\""
  echo "   6. Re-run this script"
  echo ""
  echo "   Alternatively, test the frontend directly instead of this CLI script."
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
echo "Supabase CLI no longer streams Edge Function logs."
echo "Open the Supabase dashboard → Edge Functions → business-discovery-background → Logs for real-time output."

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
