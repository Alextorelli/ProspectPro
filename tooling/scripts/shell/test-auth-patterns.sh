#!/bin/bash
# ProspectPro v4.3 Auth Pattern Testing
# Usage: ./scripts/test-auth-patterns.sh <SESSION_JWT>

set -e

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

if [ -z "$1" ]; then
  echo "❌ Error: SESSION_JWT required"
  echo "Usage: $0 <SESSION_JWT>"
  exit 1
fi

SESSION_JWT="$1"
EDGE_BASE="https://sriycekxdqnesdsgwiuc.supabase.co/functions/v1"

echo "🔐 ProspectPro v4.3 Auth Pattern Testing"
echo "========================================"
echo "Testing authentication patterns to validate session enforcement"
echo ""

# Test 1: Security verification - No auth header (should fail)
echo "Test 1: No auth header - security verification"
RESPONSE_1=$(curl -s -X POST "$EDGE_BASE/business-discovery-background" \
  -H "Content-Type: application/json" \
  -d '{"businessType":"coffee shop","location":"Seattle, WA","maxResults":1}')

if echo "$RESPONSE_1" | grep -q "401" || echo "$RESPONSE_1" | grep -q "Invalid JWT" || echo "$RESPONSE_1" | grep -q "Auth failure"; then
  echo "   ✅ Security: Correctly rejects unauthenticated requests"
else
  echo "   ❌ Security: VULNERABILITY - Accepts unauthenticated requests"
  echo "   Response: $RESPONSE_1"
fi

# Test 2: Security verification - Invalid JWT (should fail) 
echo ""
echo "Test 2: Invalid JWT - security verification"
RESPONSE_2=$(curl -s -X POST "$EDGE_BASE/business-discovery-background" \
  -H "Authorization: Bearer invalid.jwt.token" \
  -H "Content-Type: application/json" \
  -d '{"businessType":"coffee shop","location":"Seattle, WA","maxResults":1}')

if echo "$RESPONSE_2" | grep -q "401" || echo "$RESPONSE_2" | grep -q "Invalid JWT" || echo "$RESPONSE_2" | grep -q "Auth failure"; then
  echo "   ✅ Security: Correctly rejects invalid JWT"
else
  echo "   ❌ Security: VULNERABILITY - Accepts invalid JWT"
  echo "   Response: $RESPONSE_2"
fi

echo ""
echo "🏁 Security Testing Complete"
echo "Ready for authenticated testing with valid session JWT"
