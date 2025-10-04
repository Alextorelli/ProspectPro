#!/bin/bash
# Update all Edge Functions with new API keys

echo "🔑 Updating Edge Functions with new API keys..."

# Set the new keys
NEW_PUBLISHABLE_KEY="sb_publishable_GaGU6ZiyiO6ncO7kU2qAvA_SFuCyYaM"
NEW_SECRET_KEY="sb_secret_bY8n_a7-hP0Lxd9dPT_efg_3WzpnXN_"

# Update environment variables for Edge Functions
supabase secrets set SUPABASE_ANON_KEY="${NEW_PUBLISHABLE_KEY}"
supabase secrets set SUPABASE_SERVICE_ROLE_KEY="${NEW_SECRET_KEY}"

echo "✅ Edge Function secrets updated!"
echo ""
echo "📋 Testing Edge Function..."

# Test the Edge Function with new keys
curl -s -X POST 'https://sriycekxdqnesdsgwiuc.supabase.co/functions/v1/business-discovery-user-aware' \
  -H "Authorization: Bearer ${NEW_PUBLISHABLE_KEY}" \
  -H 'Content-Type: application/json' \
  -d '{
    "businessType": "coffee shop",
    "location": "Seattle, WA",
    "maxResults": 1,
    "sessionUserId": "test_new_keys"
  }' | jq -r '.success, .discoveryEngine // "Error", .results.totalFound // "N/A"'

echo ""
echo "✅ Edge Functions updated and tested!"
