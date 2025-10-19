#!/bin/bash
# Update all Edge Functions with new API keys

echo "🔑 Updating Edge Functions with new API keys..."

# Resolve keys from environment or arguments
NEW_PUBLISHABLE_KEY="${SUPABASE_PUBLISHABLE_KEY:-${1:-}}"
NEW_SECRET_KEY="${SUPABASE_SERVICE_ROLE_KEY:-${2:-}}"

if [[ -z "$NEW_PUBLISHABLE_KEY" || -z "$NEW_SECRET_KEY" ]]; then
  echo "❌ Missing keys. Provide SUPABASE_PUBLISHABLE_KEY and SUPABASE_SERVICE_ROLE_KEY env vars or pass them as arguments." >&2
  echo "   Usage: SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxx SUPABASE_SERVICE_ROLE_KEY=sb_secret_xxx $0" >&2
  exit 1
fi

# Update environment variables for Edge Functions
supabase secrets set SUPABASE_ANON_KEY="${NEW_PUBLISHABLE_KEY}"
supabase secrets set SUPABASE_SERVICE_ROLE_KEY="${NEW_SECRET_KEY}"

echo "✅ Edge Function secrets updated!"
echo ""
echo "📋 Testing Edge Function..."

# Test the Edge Function with new keys
curl -s -X POST 'https://sriycekxdqnesdsgwiuc.supabase.co/functions/v1/business-discovery-user-aware' \
  -H "Authorization: Bearer ${TEST_SESSION_TOKEN:-JWT_TOKEN}" \
  -H 'Content-Type: application/json' \
  -d '{
    "businessType": "coffee shop",
    "location": "Seattle, WA",
    "maxResults": 1,
    "sessionUserId": "test_new_keys"
  }' | jq -r '.success, .discoveryEngine // "Error", .results.totalFound // "N/A"'

echo ""
echo "✅ Edge Functions updated and tested!"
