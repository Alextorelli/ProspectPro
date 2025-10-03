#!/bin/bash

# ProspectPro v4.3 - Live Enrichment Test with Cache
# Test complete enrichment pipeline with real API keys and caching

echo "🚀 ProspectPro v4.3 - Live Enrichment Test"
echo "=========================================="
echo ""

# Current valid anon key (expires 2073)
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNyaXljZWt4ZHFuZXNkc2d3aXVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5NjU3ODksImV4cCI6MjA3MzU0MTc4OX0.Rx_1Hjz2eayKie0RpPB28i7_683ZwhVJ_5Eu_rzTWpI"

echo "🎯 Test 1: Professional Tier Enrichment (Real Business)"
echo "--------------------------------------------------------"
curl -X POST 'https://sriycekxdqnesdsgwiuc.supabase.co/functions/v1/enrichment-orchestrator' \
  -H "Authorization: Bearer $ANON_KEY" \
  -H 'Content-Type: application/json' \
  -d '{
    "businessName": "Starbucks Corporation",
    "domain": "starbucks.com",
    "state": "WA",
    "tier": "professional",
    "maxCostPerBusiness": 2.00,
    "includeBusinessLicense": true,
    "includeCompanyEnrichment": true,
    "discoverEmails": true,
    "verifyEmails": true
  }' | jq '.'

echo ""
echo "📧 Test 2: Hunter.io Domain Search (Real Domain)"
echo "-----------------------------------------------"
curl -X POST 'https://sriycekxdqnesdsgwiuc.supabase.co/functions/v1/enrichment-hunter' \
  -H "Authorization: Bearer $ANON_KEY" \
  -H 'Content-Type: application/json' \
  -d '{
    "action": "domain-search",
    "domain": "starbucks.com",
    "limit": 5
  }' | jq '.'

echo ""
echo "🏢 Test 3: Company Enrichment (Microsoft)"
echo "----------------------------------------"
curl -X POST 'https://sriycekxdqnesdsgwiuc.supabase.co/functions/v1/enrichment-pdl' \
  -H "Authorization: Bearer $ANON_KEY" \
  -H 'Content-Type: application/json' \
  -d '{
    "action": "enrichCompany",
    "website": "microsoft.com"
  }' | jq '.'

echo ""
echo "🏛️ Test 4: Business License Lookup (Real Company)"
echo "------------------------------------------------"
curl -X POST 'https://sriycekxdqnesdsgwiuc.supabase.co/functions/v1/enrichment-business-license' \
  -H "Authorization: Bearer $ANON_KEY" \
  -H 'Content-Type: application/json' \
  -d '{
    "action": "searchCompany",
    "companyName": "Tesla Inc",
    "state": "CA"
  }' | jq '.'

echo ""
echo "⚡ Test 5: Cache Performance Test (Repeat Request)"
echo "------------------------------------------------"
echo "Making repeat request to test 90-day caching..."
curl -X POST 'https://sriycekxdqnesdsgwiuc.supabase.co/functions/v1/enrichment-orchestrator' \
  -H "Authorization: Bearer $ANON_KEY" \
  -H 'Content-Type: application/json' \
  -d '{
    "businessName": "Starbucks Corporation",
    "domain": "starbucks.com",
    "state": "WA",
    "tier": "professional",
    "maxCostPerBusiness": 2.00
  }' | jq '.'

echo ""
echo "=========================================="
echo "🎉 Live Enrichment Test Complete!"
echo ""
echo "Expected Results:"
echo "✅ Real company data for Starbucks, Microsoft, Tesla"
echo "✅ Valid email addresses discovered via Hunter.io"
echo "✅ Company enrichment with industry/size data"
echo "✅ Business license validation (if available)"
echo "✅ Faster response times on repeat requests (cache)"
echo "✅ Cost tracking and confidence scoring"
echo ""
echo "💰 Cost Optimization Active:"
echo "- First request: Full API costs charged"
echo "- Repeat requests: $0 cost (served from cache)"
echo "- 90-day intelligent caching operational"