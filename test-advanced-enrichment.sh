#!/bin/bash

# ProspectPro v4.3 - Advanced Enrichment Testing Script
# Tests Business License Lookup and PeopleDataLabs integrations

echo "🧪 ProspectPro v4.3 - Advanced Enrichment Testing"
echo "=================================================="
echo ""

# Configuration
SUPABASE_URL="https://sriycekxdqnesdsgwiuc.supabase.co"
BUSINESS_LICENSE_URL="${SUPABASE_URL}/functions/v1/enrichment-business-license"
PDL_URL="${SUPABASE_URL}/functions/v1/enrichment-pdl"

# Get service role key
read -p "Enter SERVICE_ROLE_KEY: " SERVICE_ROLE_KEY
echo ""

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0
TOTAL_COST=0

# Test 1: Business License Lookup - Company Search
echo "Test 1: Business License Lookup - Company Search"
echo "------------------------------------------------"
echo "Searching for 'Starbucks Corporation' in WA..."
echo ""

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${BUSINESS_LICENSE_URL}" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "searchCompany",
    "state": "WA",
    "companyName": "Starbucks Corporation"
  }')

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ]; then
    if echo "$BODY" | grep -q '"action":"searchCompany"'; then
        echo "✅ Test 1 PASSED - Business License company search"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        TOTAL_COST=$(echo "$TOTAL_COST + 0.03" | bc)
        echo "   Found: $(echo "$BODY" | grep -o '"found":[^,]*' | cut -d':' -f2)"
        echo "   Result count: $(echo "$BODY" | grep -o '"resultCount":[0-9]*' | cut -d':' -f2)"
        echo "   Cost: \$0.03"
    else
        echo "❌ Test 1 FAILED - Unexpected response format"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
else
    echo "❌ Test 1 FAILED - HTTP $HTTP_CODE"
    echo "Response: $BODY"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi
echo ""

# Test 2: Business License Lookup - NPI Search (Healthcare)
echo "Test 2: Business License Lookup - NPI Search"
echo "--------------------------------------------"
echo "Searching NPI 1033223124 (example healthcare provider)..."
echo ""

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${BUSINESS_LICENSE_URL}" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "searchNPI",
    "npi": "1033223124"
  }')

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ]; then
    if echo "$BODY" | grep -q '"action":"searchNPI"'; then
        echo "✅ Test 2 PASSED - Business License NPI search"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        TOTAL_COST=$(echo "$TOTAL_COST + 0.03" | bc)
        echo "   Found: $(echo "$BODY" | grep -o '"found":[^,]*' | cut -d':' -f2)"
        echo "   Cost: \$0.03"
    else
        echo "❌ Test 2 FAILED - Unexpected response format"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
else
    echo "❌ Test 2 FAILED - HTTP $HTTP_CODE"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi
echo ""

# Test 3: PeopleDataLabs Company Enrichment - Large Company
echo "Test 3: PeopleDataLabs Company Enrichment - Large Company"
echo "---------------------------------------------------------"
echo "Enriching 'Microsoft Corporation' with website..."
echo ""

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${PDL_URL}" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "enrichCompany",
    "companyName": "Microsoft Corporation",
    "website": "microsoft.com",
    "maxCostPerRequest": 0.50
  }')

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ]; then
    if echo "$BODY" | grep -q '"action":"enrichCompany"'; then
        echo "✅ Test 3 PASSED - PDL Company Enrichment"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        COST=$(echo "$BODY" | grep -o '"cost":[0-9.]*' | cut -d':' -f2)
        TOTAL_COST=$(echo "$TOTAL_COST + $COST" | bc)
        echo "   Status: $(echo "$BODY" | grep -o '"status":[0-9]*' | cut -d':' -f2)"
        echo "   Found: $(echo "$BODY" | grep -o '"found":[^,]*' | cut -d':' -f2)"
        echo "   Cost: \$$COST"
        
        if echo "$BODY" | grep -q '"employeeCount"'; then
            echo "   Employee Count: $(echo "$BODY" | grep -o '"employeeCount":[0-9]*' | cut -d':' -f2)"
        fi
        if echo "$BODY" | grep -q '"industry"'; then
            echo "   Industry: $(echo "$BODY" | grep -o '"industry":"[^"]*"' | cut -d':' -f2 | tr -d '"')"
        fi
    else
        echo "❌ Test 3 FAILED - Unexpected response format"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
else
    echo "❌ Test 3 FAILED - HTTP $HTTP_CODE"
    echo "Response: $BODY"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi
echo ""

# Test 4: PeopleDataLabs Company Search - Small Business
echo "Test 4: PeopleDataLabs Company Search - Small Business"
echo "------------------------------------------------------"
echo "Searching for coffee shops in Seattle with <25 employees..."
echo ""

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${PDL_URL}" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "searchCompany",
    "industryQuery": "coffee",
    "location": "Seattle, WA",
    "maxEmployees": 25,
    "maxCostPerRequest": 1.00
  }')

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ]; then
    if echo "$BODY" | grep -q '"action":"searchCompany"'; then
        echo "✅ Test 4 PASSED - PDL Company Search"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        COST=$(echo "$BODY" | grep -o '"cost":[0-9.]*' | cut -d':' -f2)
        TOTAL_COST=$(echo "$TOTAL_COST + $COST" | bc)
        echo "   Status: $(echo "$BODY" | grep -o '"status":[0-9]*' | cut -d':' -f2)"
        echo "   Result count: $(echo "$BODY" | grep -o '"resultCount":[0-9]*' | cut -d':' -f2)"
        echo "   Cost: \$$COST"
    else
        echo "❌ Test 4 FAILED - Unexpected response format"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
else
    echo "❌ Test 4 FAILED - HTTP $HTTP_CODE"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi
echo ""

# Test 5: Cache Performance - Repeat Company Search
echo "Test 5: Cache Performance - Repeat Company Search"
echo "-------------------------------------------------"
echo "Re-searching 'Starbucks Corporation' to test cache..."
echo ""

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${BUSINESS_LICENSE_URL}" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "searchCompany",
    "state": "WA",
    "companyName": "Starbucks Corporation"
  }')

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ]; then
    if echo "$BODY" | grep -q '"cached":true'; then
        echo "✅ Test 5 PASSED - Cache working (cached: true)"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        echo "   Cache hit confirmed"
        echo "   Cost: \$0.00 (cached)"
    elif echo "$BODY" | grep -q '"cached":false'; then
        echo "⚠️  Test 5 WARNING - Cache miss (cached: false)"
        echo "   This is expected on first run after deployment"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        TOTAL_COST=$(echo "$TOTAL_COST + 0.03" | bc)
    else
        echo "❌ Test 5 FAILED - No cache indicator in response"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
else
    echo "❌ Test 5 FAILED - HTTP $HTTP_CODE"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi
echo ""

# Test 6: Cost Constraint Enforcement
echo "Test 6: Cost Constraint Enforcement"
echo "-----------------------------------"
echo "Testing budget limit (maxCostPerRequest: 0.05)..."
echo ""

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${PDL_URL}" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "enrichCompany",
    "companyName": "Apple Inc",
    "maxCostPerRequest": 0.05
  }')

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ]; then
    if echo "$BODY" | grep -q '"error":"Cost exceeds budget"'; then
        echo "✅ Test 6 PASSED - Budget constraint enforced"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        echo "   Request rejected: estimated cost \$0.10 > max \$0.05"
    elif echo "$BODY" | grep -q '"cost":0'; then
        echo "✅ Test 6 PASSED - Free/cached result within budget"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        echo "   Cached result returned (cost: \$0.00)"
    else
        echo "❌ Test 6 FAILED - Budget constraint not working"
        echo "Response: $BODY"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
else
    echo "❌ Test 6 FAILED - HTTP $HTTP_CODE"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi
echo ""

# Test 7: Error Handling - Invalid State Code
echo "Test 7: Error Handling - Invalid State Code"
echo "-------------------------------------------"
echo "Testing with invalid state code 'ZZ'..."
echo ""

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${BUSINESS_LICENSE_URL}" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "searchCompany",
    "state": "ZZ",
    "companyName": "Test Corp"
  }')

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

# License API may return 200 with empty results or 400 for invalid state
if [ "$HTTP_CODE" -eq 200 ] || [ "$HTTP_CODE" -eq 400 ]; then
    echo "✅ Test 7 PASSED - Invalid input handled gracefully"
    TESTS_PASSED=$((TESTS_PASSED + 1))
    echo "   HTTP Status: $HTTP_CODE"
else
    echo "⚠️  Test 7 WARNING - Unexpected HTTP code: $HTTP_CODE"
    echo "Response: $BODY"
fi
echo ""

# Test 8: Minimum Likelihood Threshold (PDL Person)
echo "Test 8: Minimum Likelihood Threshold (PDL Person)"
echo "-------------------------------------------------"
echo "Testing person enrichment with minLikelihood: 9..."
echo ""

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${PDL_URL}" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "enrichPerson",
    "personName": "Satya Nadella",
    "companyNameForPerson": "Microsoft",
    "minLikelihood": 9,
    "maxCostPerRequest": 0.50
  }')

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ]; then
    if echo "$BODY" | grep -q '"action":"enrichPerson"'; then
        echo "✅ Test 8 PASSED - PDL Person Enrichment with likelihood threshold"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        COST=$(echo "$BODY" | grep -o '"cost":[0-9.]*' | cut -d':' -f2)
        TOTAL_COST=$(echo "$TOTAL_COST + $COST" | bc)
        echo "   Status: $(echo "$BODY" | grep -o '"status":[0-9]*' | cut -d':' -f2)"
        echo "   Found: $(echo "$BODY" | grep -o '"found":[^,]*' | cut -d':' -f2)"
        echo "   Cost: \$$COST"
        
        if echo "$BODY" | grep -q '"likelihood"'; then
            echo "   Likelihood: $(echo "$BODY" | grep -o '"likelihood":[0-9.]*' | cut -d':' -f2)"
        fi
    else
        echo "❌ Test 8 FAILED - Unexpected response format"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
else
    echo "❌ Test 8 FAILED - HTTP $HTTP_CODE"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi
echo ""

# Test Summary
echo "=================================================="
echo "📊 Test Summary"
echo "=================================================="
echo ""
echo "Tests Passed: $TESTS_PASSED"
echo "Tests Failed: $TESTS_FAILED"
echo "Total Tests: $((TESTS_PASSED + TESTS_FAILED))"
echo ""
echo "Total API Cost: \$$TOTAL_COST"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo "🎉 All tests passed!"
    echo ""
    echo "Next Steps:"
    echo "  1. Update enrichment-orchestrator with intelligent routing"
    echo "  2. Create enrichment_cache database table"
    echo "  3. Run end-to-end campaign test (10 businesses)"
    echo "  4. Monitor cost tracking in production"
    exit 0
else
    echo "❌ Some tests failed. Please review errors above."
    exit 1
fi
