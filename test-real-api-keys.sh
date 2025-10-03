#!/bin/bash

# ProspectPro v4.3 - Test Real API Keys
# Test enrichment functions with real API keys from environment

echo "🚀 ProspectPro v4.3 - Real API Key Test"
echo "======================================"
echo ""

# Set the real API keys as environment variables for testing
export BUSINESS_LICENSE_LOOKUP_API_KEY="f103c1d9d11b1271b0283ce4f10b1ea9"
export PEOPLE_DATA_LABS_API_KEY="7de40769d1339e89dbfc506ba68ba3393674ffc7a10a8188f1fd3c342e32807a"
export COBALT_API_KEY="uUxtwLGSbo89ONYAhyFhW7XpPOjwlBqD22HjIlVe"
export FINRA_API_KEY="76c8b4faf20f42d38cba"

# Current valid anon key (expires 2073)
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNyaXljZWt4ZHFuZXNkc2d3aXVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5NjU3ODksImV4cCI6MjA3MzU0MTc4OX0.Rx_1Hjz2eayKie0RpPB28i7_683ZwhVJ_5Eu_rzTWpI"

echo "🏛️ Testing Business License with Real API Key..."
curl -X POST 'https://sriycekxdqnesdsgwiuc.supabase.co/functions/v1/enrichment-business-license' \
  -H "Authorization: Bearer $ANON_KEY" \
  -H 'Content-Type: application/json' \
  -d '{
    "action": "searchCompany",
    "companyName": "Microsoft Corporation",
    "state": "WA"
  }' | jq '.'

echo ""
echo "👤 Testing PeopleDataLabs with Real API Key..."
curl -X POST 'https://sriycekxdqnesdsgwiuc.supabase.co/functions/v1/enrichment-pdl' \
  -H "Authorization: Bearer $ANON_KEY" \
  -H 'Content-Type: application/json' \
  -d '{
    "action": "enrichCompany",
    "website": "microsoft.com"
  }' | jq '.'

echo ""
echo "🎯 Testing Full Enrichment Pipeline with Real Data..."
curl -X POST 'https://sriycekxdqnesdsgwiuc.supabase.co/functions/v1/enrichment-orchestrator' \
  -H "Authorization: Bearer $ANON_KEY" \
  -H 'Content-Type: application/json' \
  -d '{
    "businessName": "Microsoft Corporation",
    "domain": "microsoft.com",
    "state": "WA",
    "tier": "professional",
    "maxCostPerBusiness": 2.00
  }' | jq '.'

echo ""
echo "======================================"
echo "🎉 Real API Key Test Complete!"
echo ""
echo "Expected Results:"
echo "- Business License: Real license data or valid 'not found'"
echo "- PeopleDataLabs: Company enrichment data for Microsoft"
echo "- Orchestrator: Full enrichment with real API responses"
echo "- All functions using real API keys from environment"