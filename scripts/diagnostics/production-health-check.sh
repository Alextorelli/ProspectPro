#!/bin/bash
# ProspectPro v4.3 Production Health Check
# Usage: ./scripts/production-health-check.sh

set -e

require_repo_root() {
  local expected_root="${EXPECTED_REPO_ROOT:-/workspaces/ProspectPro}"
  local repo_root

  if ! repo_root=$(git rev-parse --show-toplevel 2>/dev/null); then
    echo "❌ Unable to determine git root. Run this health check from inside the ProspectPro repository." >&2
    exit 1
  fi

  local current_dir
  current_dir=$(pwd -P)
  if [ "$current_dir" != "$repo_root" ]; then
    echo "❌ Run this health check from the repository root ($repo_root). Current directory: $current_dir" >&2
    exit 1
  fi

  if [ "$repo_root" != "$expected_root" ]; then
    echo "❌ Repository root mismatch. Expected $expected_root but detected $repo_root." >&2
    echo "   Set EXPECTED_REPO_ROOT to override if operating from a different checkout." >&2
    exit 1
  fi
}

require_repo_root

echo "🔍 ProspectPro v4.3 Production Health Check"
echo "============================================"
echo "Timestamp: $(date)"
echo ""

# Color codes for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Frontend accessibility
echo "🌐 Testing frontend accessibility..."
FRONTEND_URL="${FRONTEND_URL:-https://prospect-fyhedobh1-appsmithery.vercel.app}"
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL")
FRONTEND_TIME=$(curl -s -o /dev/null -w "%{time_total}" "$FRONTEND_URL")

if [ "$FRONTEND_STATUS" = "200" ]; then
  echo -e "   ${GREEN}✅ Frontend: Accessible (${FRONTEND_TIME}s)${NC}"
else
  echo -e "   ${RED}❌ Frontend: Error $FRONTEND_STATUS${NC}"
fi

# Test 2: Edge Functions availability
echo "⚡ Testing Edge Functions availability..."
PROJECT_REF="${SUPABASE_PROJECT_REF:-sriycekxdqnesdsgwiuc}"
EDGE_BASE="https://${PROJECT_REF}.supabase.co/functions/v1"
EDGE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$EDGE_BASE/business-discovery-background")

if [ "$EDGE_STATUS" = "401" ] || [ "$EDGE_STATUS" = "405" ]; then
  echo -e "   ${GREEN}✅ Edge Functions: Responding (auth enforced)${NC}"
elif [ "$EDGE_STATUS" = "404" ]; then
  echo -e "   ${YELLOW}⚠️  Edge Functions: business-discovery-background not found (check deployment)${NC}"
else
  echo -e "   ${RED}❌ Edge Functions: Unexpected response $EDGE_STATUS${NC}"
fi

# Test 3: Edge Function inventory
echo "📋 Checking Edge Function inventory..."
FUNCTIONS=(
  "business-discovery-background"
  "business-discovery-optimized"
  "business-discovery-user-aware"
  "campaign-export-user-aware"
  "enrichment-orchestrator"
  "enrichment-hunter"
  "enrichment-neverbounce"
  "enrichment-business-license"
  "enrichment-pdl"
)

for func in "${FUNCTIONS[@]}"; do
  FUNC_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$EDGE_BASE/$func")
  if [ "$FUNC_STATUS" = "401" ] || [ "$FUNC_STATUS" = "405" ]; then
    echo -e "   ${GREEN}✅ $func: Deployed${NC}"
  else
    echo -e "   ${RED}❌ $func: Status $FUNC_STATUS${NC}"
  fi
done

# Test 4: Database connectivity probe
echo "🗄️  Testing database connectivity..."
# We can't directly test database without auth, but we can check if functions respond appropriately
DB_PROBE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$EDGE_BASE/campaign-export-user-aware")
if [ "$DB_PROBE_STATUS" = "401" ] || [ "$DB_PROBE_STATUS" = "405" ]; then
  echo -e "   ${GREEN}✅ Database: Export function deployed (auth enforced)${NC}"
else
  echo -e "   ${YELLOW}⚠️  Database: Export probe returned $DB_PROBE_STATUS${NC}"
fi

# Test 5: External API reachability
echo "🌍 Testing external API reachability..."
GOOGLE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://maps.googleapis.com/maps/api/place/textsearch/json?query=test&key=invalid")
HUNTER_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://api.hunter.io/v2/account")

if [ "$GOOGLE_STATUS" = "400" ] || [ "$GOOGLE_STATUS" = "403" ]; then
  echo -e "   ${GREEN}✅ Google Places API: Reachable${NC}"
else
  echo -e "   ${RED}❌ Google Places API: Status $GOOGLE_STATUS${NC}"
fi

if [ "$HUNTER_STATUS" = "401" ] || [ "$HUNTER_STATUS" = "403" ]; then
  echo -e "   ${GREEN}✅ Hunter.io API: Reachable${NC}"
else
  echo -e "   ${RED}❌ Hunter.io API: Status $HUNTER_STATUS${NC}"
fi

echo ""
echo "🎯 Next Steps for Full Validation:"
echo "=================================="
echo "1. 🔐 Authenticate in browser: $FRONTEND_URL"
echo "2. 🔑 Extract session JWT from browser Local Storage:"
echo "   - Open DevTools → Application → Local Storage"
echo "   - Copy value from 'sb-access-token' key"
echo "3. 🧪 Run full campaign validation:"
echo "   ./scripts/campaign-validation.sh <SESSION_JWT>"
echo ""
echo "📊 Platform Dashboard Access:"
echo "   - Supabase: https://supabase.com/dashboard/project/sriycekxdqnesdsgwiuc"
echo "   - Vercel: https://vercel.com/appsmithery/prospect-pro"
echo ""

# Summary
echo "🏁 Health Check Summary:"
if [ "$FRONTEND_STATUS" = "200" ] && ([ "$EDGE_STATUS" = "401" ] || [ "$EDGE_STATUS" = "405" ]); then
  echo -e "   ${GREEN}✅ System Status: HEALTHY${NC}"
  echo "   Ready for authenticated campaign validation"
else
  echo -e "   ${YELLOW}⚠️  System Status: DEGRADED${NC}"
  echo "   Some components need attention before full validation"
fi