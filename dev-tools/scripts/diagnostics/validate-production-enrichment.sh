#!/bin/bash
# Validate PDL & State Licensing on Production Edge Functions
# Usage: ./scripts/validate-production-enrichment.sh <SESSION_JWT>

set -euo pipefail

if [ $# -lt 1 ]; then
  echo "Usage: $0 <SUPABASE_SESSION_JWT>" >&2
  echo "" >&2
  echo "To get a session JWT:" >&2
  echo "  1. Open the ProspectPro frontend (https://prospect-fyhedobh1-appsmithery.vercel.app)" >&2
  echo "  2. Sign in or create an account" >&2
  echo "  3. Open browser dev console and run:" >&2
  echo "     (await window.supabase.auth.getSession()).data.session.access_token" >&2
  exit 1
fi

SESSION_JWT="$1"
EDGE_BASE_URL="https://sriycekxdqnesdsgwiuc.supabase.co/functions/v1"

log_section() {
  echo ""
  echo "=============================================="
  echo "${1}"
  echo "=============================================="
}

log_test() {
  echo ""
  echo "▶️  $1"
}

log_pass() {
  echo "✅ PASS: $1"
}

log_fail() {
  echo "❌ FAIL: $1"
}

echo "🔍 ProspectPro Production Enrichment Validation"
echo "Testing edge functions at: ${EDGE_BASE_URL}"
echo ""

TESTS_PASSED=0
TESTS_FAILED=0

# Test 1: Authentication rejection without token
log_section "Test 1: Authentication Rejection (No Token)"
log_test "Testing enrichment-pdl without auth header..."

RESPONSE=$(curl -sS -w "\n%{http_code}" -X POST "${EDGE_BASE_URL}/enrichment-pdl" \
  -H 'Content-Type: application/json' \
  -d '{"lookupType": "company", "domain": "test.com"}')

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "401" ]; then
  log_pass "Properly rejected unauthenticated request (401)"
  ((TESTS_PASSED++))
else
  log_fail "Expected 401, got $HTTP_CODE"
  ((TESTS_FAILED++))
fi

# Test 2: PDL Company Enrichment
log_section "Test 2: PDL Company Enrichment"
log_test "Testing company lookup for Starbucks..."

RESPONSE=$(curl -sS -w "\n%{http_code}" -X POST "${EDGE_BASE_URL}/enrichment-pdl" \
  -H "Authorization: Bearer ${SESSION_JWT}" \
  -H 'Content-Type: application/json' \
  -d '{
    "lookupType": "company",
    "businessName": "Starbucks Coffee Company",
    "domain": "starbucks.com",
    "website": "https://www.starbucks.com"
  }')

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
  SUCCESS=$(echo "$BODY" | jq -r '.success // false')
  if [ "$SUCCESS" = "true" ]; then
    log_pass "PDL company enrichment succeeded"
    echo "$BODY" | jq -C '.'
    ((TESTS_PASSED++))
  else
    log_fail "PDL call returned success=false"
    echo "$BODY" | jq -C '.'
    ((TESTS_FAILED++))
  fi
else
  log_fail "HTTP error $HTTP_CODE"
  echo "$BODY"
  ((TESTS_FAILED++))
fi

# Test 3: State Licensing - Washington
log_section "Test 3: State Licensing - Washington (Cobalt)"
log_test "Testing WA state licensing lookup..."

RESPONSE=$(curl -sS -w "\n%{http_code}" -X POST "${EDGE_BASE_URL}/enrichment-business-license" \
  -H "Authorization: Bearer ${SESSION_JWT}" \
  -H 'Content-Type: application/json' \
  -d '{
    "businessName": "Starbucks Coffee Company",
    "state": "WA",
    "includeLiveData": true
  }')

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
  SUCCESS=$(echo "$BODY" | jq -r '.success // false')
  RECORDS=$(echo "$BODY" | jq -r '.records | length')
  log_pass "State licensing returned HTTP 200"
  echo "Records found: $RECORDS"
  echo "$BODY" | jq -C '.'
  ((TESTS_PASSED++))
else
  log_fail "HTTP error $HTTP_CODE"
  echo "$BODY"
  ((TESTS_FAILED++))
fi

# Test 4: State Licensing - New York
log_section "Test 4: State Licensing - New York (Socrata)"
log_test "Testing NY state licensing lookup..."

RESPONSE=$(curl -sS -w "\n%{http_code}" -X POST "${EDGE_BASE_URL}/enrichment-business-license" \
  -H "Authorization: Bearer ${SESSION_JWT}" \
  -H 'Content-Type: application/json' \
  -d '{
    "businessName": "JP Morgan Securities LLC",
    "state": "NY",
    "includeInactive": false
  }')

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
  RECORDS=$(echo "$BODY" | jq -r '.records | length')
  log_pass "NY licensing returned HTTP 200"
  echo "Records found: $RECORDS"
  echo "$BODY" | jq -C '.'
  ((TESTS_PASSED++))
else
  log_fail "HTTP error $HTTP_CODE"
  echo "$BODY"
  ((TESTS_FAILED++))
fi

# Test 5: Enrichment Orchestrator Integration
log_section "Test 5: Enrichment Orchestrator"
log_test "Testing orchestrator with full enrichment flow..."

RESPONSE=$(curl -sS -w "\n%{http_code}" -X POST "${EDGE_BASE_URL}/enrichment-orchestrator" \
  -H "Authorization: Bearer ${SESSION_JWT}" \
  -H 'Content-Type: application/json' \
  -d '{
    "businessName": "Costco Wholesale Corporation",
    "domain": "costco.com",
    "website": "https://www.costco.com",
    "state": "WA",
    "tierKey": "ENTERPRISE",
    "includeBusinessLicense": true,
    "includeCompanyEnrichment": true,
    "discoverEmails": true,
    "verifyEmails": false,
    "includePersonEnrichment": true,
    "maxCostPerBusiness": 2.00
  }')

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
  SUCCESS=$(echo "$BODY" | jq -r '.success // false')
  CONFIDENCE=$(echo "$BODY" | jq -r '.confidenceScore // 0')
  COST=$(echo "$BODY" | jq -r '.totalCost // 0')
  log_pass "Orchestrator completed successfully"
  echo "Confidence Score: $CONFIDENCE"
  echo "Total Cost: \$$COST"
  echo "$BODY" | jq -C '.'
  ((TESTS_PASSED++))
else
  log_fail "HTTP error $HTTP_CODE"
  echo "$BODY"
  ((TESTS_FAILED++))
fi

# Summary
log_section "Test Summary"
echo "Tests Passed: $TESTS_PASSED"
echo "Tests Failed: $TESTS_FAILED"
echo ""

if [ "$TESTS_FAILED" -eq 0 ]; then
  echo "✅ All validation tests passed!"
  exit 0
else
  echo "❌ Some tests failed. Review output above."
  exit 1
fi
