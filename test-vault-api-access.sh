#!/bin/bash

# ProspectPro v4.3 - Test Vault API Key Access
# Test if enrichment Edge Functions can access API keys from Supabase Vault

echo "🔐 ProspectPro v4.3 - Vault API Key Access Test"
echo "============================================="
echo ""

# Current valid anon key (expires 2073)
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNyaXljZWt4ZHFuZXNkc2d3aXVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5NjU3ODksImV4cCI6MjA3MzU0MTc4OX0.Rx_1Hjz2eayKie0RpPB28i7_683ZwhVJ_5Eu_rzTWpI"

# Test Hunter.io API Key Access
echo "🔍 Testing Hunter.io API Key Access..."
curl -X POST 'https://sriycekxdqnesdsgwiuc.supabase.co/functions/v1/enrichment-hunter' \
  -H "Authorization: Bearer $ANON_KEY" \
  -H 'Content-Type: application/json' \
  -d '{
    "action": "email-count",
    "domain": "example.com"
  }' | jq '.'

echo ""
echo "✅ Testing NeverBounce API Key Access..."
curl -X POST 'https://sriycekxdqnesdsgwiuc.supabase.co/functions/v1/enrichment-neverbounce' \
  -H "Authorization: Bearer $ANON_KEY" \
  -H 'Content-Type: application/json' \
  -d '{
    "action": "syntax-check",
    "email": "test@example.com"
  }' | jq '.'

echo ""
echo "🏛️ Testing Business License API Key Access..."
curl -X POST 'https://sriycekxdqnesdsgwiuc.supabase.co/functions/v1/enrichment-business-license' \
  -H "Authorization: Bearer $ANON_KEY" \
  -H 'Content-Type: application/json' \
  -d '{
    "action": "searchCompany",
    "companyName": "Test Company",
    "state": "CA"
  }' | jq '.'

echo ""
echo "👤 Testing PeopleDataLabs API Key Access..."
curl -X POST 'https://sriycekxdqnesdsgwiuc.supabase.co/functions/v1/enrichment-pdl' \
  -H "Authorization: Bearer $ANON_KEY" \
  -H 'Content-Type: application/json' \
  -d '{
    "action": "enrichCompany",
    "website": "example.com"
  }' | jq '.'

echo ""
echo "🎯 Testing Enrichment Orchestrator with Vault Access..."
curl -X POST 'https://sriycekxdqnesdsgwiuc.supabase.co/functions/v1/enrichment-orchestrator' \
  -H "Authorization: Bearer $ANON_KEY" \
  -H 'Content-Type: application/json' \
  -d '{
    "businessName": "Test Company",
    "domain": "example.com",
    "state": "CA",
    "tier": "professional",
    "maxCostPerBusiness": 1.50
  }' | jq '.'

echo ""
echo "============================================="
echo "🎉 Vault API Key Access Test Complete!"
echo ""
echo "Expected Results:"
echo "- Functions should access API keys from vault"
echo "- May show 401/invalid API key errors (normal for test keys)"
echo "- Should NOT show 'API key not configured' errors"
echo "- Vault client should log successful secret retrieval"