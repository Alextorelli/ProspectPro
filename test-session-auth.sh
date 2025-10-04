#!/bin/bash

# Test Session Authentication - ProspectPro v4.2
# Tests if Edge Functions accept anonymous session JWT tokens

echo "🧪 Testing Session-Based Authentication"
echo "========================================"
echo ""

SUPABASE_URL="https://sriycekxdqnesdsgwiuc.supabase.co"
PUBLISHABLE_KEY="sb_publishable_GaGU6ZiyiO6ncO7kU2qAvA_SFuCyYaM"

echo "Step 1: Creating Anonymous Session..."
echo "--------------------------------------"

# Create anonymous session and get JWT token
SESSION_RESPONSE=$(curl -s -X POST "${SUPABASE_URL}/auth/v1/signup" \
  -H "apikey: ${PUBLISHABLE_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"data": {}}')

echo "Response:"
echo "$SESSION_RESPONSE" | jq '.'
echo ""

# Extract access token from response
ACCESS_TOKEN=$(echo "$SESSION_RESPONSE" | jq -r '.access_token // .session.access_token // empty')

if [ -z "$ACCESS_TOKEN" ] || [ "$ACCESS_TOKEN" == "null" ]; then
  echo "❌ Failed to create anonymous session"
  echo "Response: $SESSION_RESPONSE"
  echo ""
  echo "Possible causes:"
  echo "1. Anonymous sign-ins disabled in Supabase"
  echo "2. API key incorrect"
  echo ""
  echo "To enable anonymous auth:"
  echo "1. Go to: https://supabase.com/dashboard/project/sriycekxdqnesdsgwiuc/auth/users"
  echo "2. Click 'Configuration' → 'Providers'"
  echo "3. Enable 'Anonymous' provider"
  exit 1
fi

echo "✅ Anonymous session created successfully!"
echo "JWT Token (first 50 chars): ${ACCESS_TOKEN:0:50}..."
echo ""

echo "Step 2: Testing Edge Function with Session JWT..."
echo "--------------------------------------------------"

# Test Edge Function with session JWT
EDGE_RESPONSE=$(curl -s -X POST "${SUPABASE_URL}/functions/v1/business-discovery-user-aware" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "businessType": "coffee shop",
    "location": "Seattle, WA",
    "maxResults": 1,
    "sessionUserId": "test-session"
  }')

echo "Response:"
echo "$EDGE_RESPONSE" | jq '.'
echo ""

# Check if response is successful
if echo "$EDGE_RESPONSE" | jq -e '.success == true' > /dev/null 2>&1; then
  echo "✅ Edge Function authentication SUCCESS!"
  echo ""
  echo "Summary:"
  echo "--------"
  echo "✅ Anonymous session created"
  echo "✅ JWT token obtained"
  echo "✅ Edge Function accepted JWT"
  echo "✅ Business discovery working"
  echo ""
  echo "🎉 Session-based authentication is FULLY FUNCTIONAL!"
  exit 0
elif echo "$EDGE_RESPONSE" | jq -e '.code == 401' > /dev/null 2>&1; then
  echo "❌ Edge Function returned 401 Unauthorized"
  echo ""
  echo "This means:"
  echo "- Anonymous session was created successfully"
  echo "- JWT token was obtained"
  echo "- BUT Edge Function rejected the token"
  echo ""
  echo "Possible fixes:"
  echo "1. Check Edge Function auth configuration"
  echo "2. Verify JWT token is being validated correctly"
  echo "3. Redeploy Edge Functions"
  exit 1
else
  echo "⚠️  Unexpected response from Edge Function"
  echo ""
  echo "Response details:"
  echo "$EDGE_RESPONSE" | jq '.'
  exit 1
fi
