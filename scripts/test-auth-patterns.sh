#!/bin/bash

# ProspectPro Authentication Pattern Validation
# Validates that our diagnostics and official reference functions honour Supabase session JWTs.

set -e

INFO_PREFIX="🔐 ProspectPro Authentication Pattern Validation"

printf "%s\n" "$INFO_PREFIX"
printf "==============================================\n\n"

if [ -z "$SUPABASE_SESSION_TOKEN" ]; then
  printf "❌ Missing SUPABASE_SESSION_TOKEN environment variable\n\n"
  printf "To generate one:\n"
  printf "1. Sign in a test user via the app or Supabase Auth UI\n"
  printf "2. Use the Supabase CLI or Admin API to fetch the session access token\n"
  printf "3. Export it in your shell:\n"
  printf "   export SUPABASE_SESSION_TOKEN='eyJ...'\n\n"
  exit 1
fi

BASE_URL="https://sriycekxdqnesdsgwiuc.supabase.co/functions/v1"
DIAGNOSTICS_FILE="/tmp/auth_diagnostics.json"
OFFICIAL_FILE="/tmp/auth_official.json"

printf "📋 Testing Functions:\n"
printf "- test-new-auth (Diagnostics using authenticateRequest helper)\n"
printf "- test-official-auth (Supabase Official Pattern)\n\n"

printf "🧪 Testing Diagnostics Function...\n"
printf "Function: test-new-auth\n"
printf "Approach: Supabase client with auth.getUser (RLS enforced)\n"

curl -s -X POST "$BASE_URL/test-new-auth" \
  -H "Authorization: Bearer $SUPABASE_SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"diagnostics":true}' | jq '.' > "$DIAGNOSTICS_FILE"

printf "Result saved to %s\n" "$DIAGNOSTICS_FILE"
printf "Success: %s\n" "$(jq -r '.success // "false"' "$DIAGNOSTICS_FILE")"
printf "Authenticated user: %s\n\n" "$(jq -r '.authentication.request.userId // "N/A"' "$DIAGNOSTICS_FILE")"

printf "🏷️ Testing Supabase Official Pattern...\n"
printf "Function: test-official-auth\n"
printf "Approach: Reference implementation direct from Supabase docs\n"

curl -s -X POST "$BASE_URL/test-official-auth" \
  -H "Authorization: Bearer $SUPABASE_SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}' | jq '.' > "$OFFICIAL_FILE"

printf "Result saved to %s\n" "$OFFICIAL_FILE"
printf "Success: %s\n" "$(jq -r '.success // "false"' "$OFFICIAL_FILE")"
printf "Authenticated user: %s\n\n" "$(jq -r '.user.id // "N/A"' "$OFFICIAL_FILE")"

DIAGNOSTICS_SUCCESS="$(jq -r '.success // "false"' "$DIAGNOSTICS_FILE")"
OFFICIAL_SUCCESS="$(jq -r '.success // "false"' "$OFFICIAL_FILE")"

printf "📊 Comparison Results:\n====================\n"
printf "Diagnostics Function: %s\n" "$DIAGNOSTICS_SUCCESS"
printf "Official Function: %s\n\n" "$OFFICIAL_SUCCESS"

if [ "$DIAGNOSTICS_SUCCESS" = "true" ] && [ "$OFFICIAL_SUCCESS" = "true" ]; then
  printf "✅ Both implementations working\n\n"
  printf "🎯 Recommendation: Continue using the Supabase-native helper everywhere\n"
  printf "- Minimal code footprint\n"
  printf "- No manual JWKS handling required\n"
  printf "- RLS enforced automatically\n"
elif [ "$OFFICIAL_SUCCESS" = "true" ]; then
  printf "✅ Official pattern works; diagnostics failing\n\n"
  printf "🎯 Recommendation: Inspect test-new-auth logs and fix helper usage\n"
elif [ "$DIAGNOSTICS_SUCCESS" = "true" ]; then
  printf "⚠️ Diagnostics pass, official pattern failing\n\n"
  printf "🎯 Recommendation: Re-deploy test-official-auth or re-check the supplied session token\n"
else
  printf "❌ Both implementations failing\n\n"
  printf "🎯 Recommendation: Confirm session token validity and inspect Supabase logs\n"
fi

printf "\n📁 Detailed results in:\n- %s\n- %s\n" "$DIAGNOSTICS_FILE" "$OFFICIAL_FILE"