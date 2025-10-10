#!/bin/bash
# ProspectPro v4.3 Auth Pattern Testing
# Usage: ./scripts/test-auth-patterns.sh <SESSION_JWT>

set -e

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
RESPONSE_1=$(curl -s -X POST "$EDGE_BASE/test-new-auth" \
  -H "Content-Type: application/json" \
  -d '{"diagnostics": true}')

if echo "$RESPONSE_1" | grep -q "401" || echo "$RESPONSE_1" | grep -q "Invalid JWT"; then
  echo "   ✅ Security: Correctly rejects unauthenticated requests"
else
  echo "   ❌ Security: VULNERABILITY - Accepts unauthenticated requests"
  echo "   Response: $RESPONSE_1"
fi

# Test 2: Security verification - Invalid JWT (should fail) 
echo ""
echo "Test 2: Invalid JWT - security verification"
RESPONSE_2=$(curl -s -X POST "$EDGE_BASE/test-new-auth" \
  -H "Authorization: Bearer invalid.jwt.token" \
  -H "Content-Type: application/json" \
  -d '{"diagnostics": true}')

if echo "$RESPONSE_2" | grep -q "401" || echo "$RESPONSE_2" | grep -q "Invalid JWT"; then
  echo "   ✅ Security: Correctly rejects invalid JWT"
else
  echo "   ❌ Security: VULNERABILITY - Accepts invalid JWT"
  echo "   Response: $RESPONSE_2"
fi

echo ""
echo "🏁 Security Testing Complete"
echo "Ready for authenticated testing with valid session JWT"
