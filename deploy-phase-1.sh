#!/bin/bash

# ProspectPro v4.3 - Phase 1 Deployment Script
# Deploys Business License Lookup and PeopleDataLabs Edge Functions

echo "🚀 ProspectPro v4.3 - Phase 1 Deployment"
echo "=========================================="
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Install with: npm install -g supabase"
    exit 1
fi

echo "✅ Supabase CLI detected"
echo ""

# Verify API keys in Supabase Vault
echo "🔐 Verifying API keys in Supabase Vault..."
echo ""
echo "Required secrets:"
echo "  - BUSINESS_LICENSE_LOOKUP_API_KEY"
echo "  - PEOPLE_DATA_LABS_API_KEY"
echo "  - HUNTER_IO_API_KEY (already configured)"
echo "  - NEVERBOUNCE_API_KEY (already configured)"
echo ""
echo "⚠️  Please verify these secrets exist in Supabase Dashboard → Settings → Vault"
read -p "Press Enter to continue after verification..."
echo ""

# Deploy Business License Lookup Edge Function
echo "📦 Deploying enrichment-business-license Edge Function..."
supabase functions deploy enrichment-business-license

if [ $? -eq 0 ]; then
    echo "✅ enrichment-business-license deployed successfully"
else
    echo "❌ enrichment-business-license deployment failed"
    exit 1
fi
echo ""

# Deploy PeopleDataLabs Edge Function
echo "📦 Deploying enrichment-pdl Edge Function..."
supabase functions deploy enrichment-pdl

if [ $? -eq 0 ]; then
    echo "✅ enrichment-pdl deployed successfully"
else
    echo "❌ enrichment-pdl deployment failed"
    exit 1
fi
echo ""

# Get Edge Function URLs
SUPABASE_URL="https://sriycekxdqnesdsgwiuc.supabase.co"
BUSINESS_LICENSE_URL="${SUPABASE_URL}/functions/v1/enrichment-business-license"
PDL_URL="${SUPABASE_URL}/functions/v1/enrichment-pdl"

echo "🌐 Edge Function URLs:"
echo "  Business License: ${BUSINESS_LICENSE_URL}"
echo "  PeopleDataLabs: ${PDL_URL}"
echo ""

# Test Business License Lookup
echo "🧪 Testing Business License Lookup..."
echo ""
echo "Test 1: Search company by name (Acme Corporation in CA)"
read -p "Enter SERVICE_ROLE_KEY to test: " SERVICE_ROLE_KEY

BUSINESS_LICENSE_TEST=$(curl -s -X POST "${BUSINESS_LICENSE_URL}" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "searchCompany",
    "state": "CA",
    "companyName": "Acme Corporation"
  }')

if echo "$BUSINESS_LICENSE_TEST" | grep -q '"found":true'; then
    echo "✅ Business License Lookup test passed (found: true)"
elif echo "$BUSINESS_LICENSE_TEST" | grep -q '"found":false'; then
    echo "⚠️  Business License Lookup test passed (found: false - no license found)"
elif echo "$BUSINESS_LICENSE_TEST" | grep -q '"error"'; then
    echo "❌ Business License Lookup test failed"
    echo "Response: $BUSINESS_LICENSE_TEST"
else
    echo "❓ Business License Lookup response unclear"
    echo "Response: $BUSINESS_LICENSE_TEST"
fi
echo ""

# Test PeopleDataLabs Company Enrichment
echo "🧪 Testing PeopleDataLabs Company Enrichment..."
echo ""
echo "Test 2: Enrich company (Google)"

PDL_TEST=$(curl -s -X POST "${PDL_URL}" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "enrichCompany",
    "companyName": "Google",
    "website": "google.com",
    "maxCostPerRequest": 0.50
  }')

if echo "$PDL_TEST" | grep -q '"found":true'; then
    echo "✅ PeopleDataLabs Company Enrichment test passed"
    echo "   Employee count: $(echo "$PDL_TEST" | grep -o '"employeeCount":[0-9]*' | cut -d':' -f2)"
    echo "   Industry: $(echo "$PDL_TEST" | grep -o '"industry":"[^"]*"' | cut -d':' -f2 | tr -d '"')"
elif echo "$PDL_TEST" | grep -q '"error"'; then
    echo "❌ PeopleDataLabs Company Enrichment test failed"
    echo "Response: $PDL_TEST"
else
    echo "❓ PeopleDataLabs response unclear"
    echo "Response: $PDL_TEST"
fi
echo ""

# Display deployment summary
echo "=========================================="
echo "📊 Deployment Summary"
echo "=========================================="
echo ""
echo "✅ Deployed Edge Functions:"
echo "   1. enrichment-business-license (v1.0)"
echo "   2. enrichment-pdl (v1.0)"
echo ""
echo "💰 Cost Structure:"
echo "   - Business License: \$0.03 per request"
echo "   - PDL Company: \$0.05-\$0.10 per match"
echo "   - PDL Person: \$0.20-\$0.28 per match"
echo ""
echo "📦 Cache Configuration:"
echo "   - Business License: 90 days"
echo "   - PDL Company: 30 days"
echo "   - PDL Person: 60 days"
echo ""
echo "🎯 Next Steps:"
echo "   1. Update enrichment-orchestrator with new APIs"
echo "   2. Create enrichment_cache database table"
echo "   3. Update frontend UI with tier selection"
echo "   4. Run end-to-end test campaign (10 businesses)"
echo "   5. Deploy Cobalt Intelligence (Phase 2)"
echo ""
echo "📚 Documentation:"
echo "   - ADVANCED_ENRICHMENT_STRATEGY.md"
echo "   - PHASE_1_IMPLEMENTATION_SUMMARY.md"
echo "   - Test with: ./test-advanced-enrichment.sh"
echo ""
echo "🎉 Phase 1 deployment complete!"
