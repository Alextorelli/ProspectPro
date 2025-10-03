#!/bin/bash

# Test Enrichment Edge Functions
# Using service role key for testing (has full access)

SUPABASE_URL="https://sriycekxdqnesdsgwiuc.supabase.co"
SERVICE_ROLE_KEY="${SUPABASE_SERVICE_ROLE_KEY}"

echo "🧪 Testing ProspectPro Enrichment APIs"
echo "======================================"
echo ""

# Test 1: Hunter.io Email Count (FREE)
echo "📧 Test 1: Hunter.io Email Count (FREE endpoint)"
echo "Domain: google.com"
echo ""

RESPONSE=$(curl -s -X POST "${SUPABASE_URL}/functions/v1/enrichment-hunter" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"action": "email-count", "domain": "google.com"}')

echo "Response:"
echo "$RESPONSE" | jq '.'
echo ""
echo "---"
echo ""

# Test 2: NeverBounce Syntax Check (FREE)
echo "✅ Test 2: NeverBounce Syntax Check (FREE, no API call)"
echo "Email: john.smith@example.com"
echo ""

RESPONSE=$(curl -s -X POST "${SUPABASE_URL}/functions/v1/enrichment-neverbounce" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"action": "syntax-check", "email": "john.smith@example.com"}')

echo "Response:"
echo "$RESPONSE" | jq '.'
echo ""
echo "---"
echo ""

# Test 3: Enrichment Orchestrator (combines all services)
echo "🎯 Test 3: Enrichment Orchestrator"
echo "Business: Example Coffee Shop"
echo ""

RESPONSE=$(curl -s -X POST "${SUPABASE_URL}/functions/v1/enrichment-orchestrator" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "businessName": "Example Coffee Shop",
    "domain": "example.com",
    "address": "123 Main St, Seattle, WA",
    "phone": "+1-555-0100",
    "website": "https://example.com",
    "discoverEmails": false,
    "verifyEmails": false,
    "apolloEnrichment": false,
    "yellowPagesLookup": true,
    "maxCostPerBusiness": 2.0
  }')

echo "Response:"
echo "$RESPONSE" | jq '.'
echo ""
echo "---"
echo ""

echo "✅ Testing complete!"
echo ""
echo "📊 Summary:"
echo "  - enrichment-hunter: DEPLOYED"
echo "  - enrichment-neverbounce: DEPLOYED"
echo "  - enrichment-orchestrator: DEPLOYED"
echo "  - business-discovery-optimized: DEPLOYED (v14)"
echo ""
echo "🔑 Next Steps:"
echo "  1. Configure API keys in Supabase Dashboard → Settings → Edge Functions → Secrets"
echo "  2. Add HUNTER_IO_API_KEY secret"
echo "  3. Add NEVERBOUNCE_API_KEY secret"
echo "  4. Test paid endpoints once API keys are configured"
echo ""
