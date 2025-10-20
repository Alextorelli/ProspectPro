#!/bin/bash
# ProspectPro integration test: enrichment orchestration chain

set -euo pipefail

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
REPO_ROOT=$(cd "$SCRIPT_DIR/.." && pwd)
EXPECTED_REPO_ROOT=${EXPECTED_REPO_ROOT:-/workspaces/ProspectPro}
ARTIFACT_DIR="$REPO_ROOT/scripts/test-artifacts"
DISCOVERY_ARTIFACT="$ARTIFACT_DIR/latest-discovery.json"
ARTIFACT_PATH="$ARTIFACT_DIR/latest-enrichment.json"

require_repo_root() {
  local repo_root
  if ! repo_root=$(git rev-parse --show-toplevel 2>/dev/null); then
    echo "❌ Run this script inside the ProspectPro repository." >&2
    exit 1
  fi
  if [[ "$repo_root" != "$EXPECTED_REPO_ROOT" ]]; then
    echo "❌ Repository root mismatch. Expected $EXPECTED_REPO_ROOT but found $repo_root." >&2
    exit 1
  fi
}

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "❌ Missing required command: $1" >&2
    exit 1
  fi
}

trim_trailing_slash() {
  local value="$1"
  printf '%s' "${value%/}"
}

http_post_json() {
  local url="$1"
  local payload="$2"
  local response http_code body
  response=$(curl -sS -w '\n%{http_code}' \
    -H "Authorization: Bearer $SUPABASE_SESSION_JWT" \
    -H "apikey: $SUPABASE_PUBLISHABLE_KEY" \
    -H "Content-Type: application/json" \
    -d "$payload" \
    "$url")
  http_code=$(printf '%s' "$response" | tail -n1)
  body=$(printf '%s' "$response" | sed '$d')
  if [[ "$http_code" != "200" && "$http_code" != "201" && "$http_code" != "202" ]]; then
    echo "❌ Request to $url failed with HTTP $http_code" >&2
    printf '%s\n' "$body" >&2
    exit 1
  fi
  printf '%s' "$body"
}

http_get_json() {
  local url="$1"
  local response http_code body
  response=$(curl -sS -w '\n%{http_code}' \
    -H "Authorization: Bearer $SUPABASE_SESSION_JWT" \
    -H "apikey: $SUPABASE_PUBLISHABLE_KEY" \
    "$url")
  http_code=$(printf '%s' "$response" | tail -n1)
  body=$(printf '%s' "$response" | sed '$d')
  if [[ "$http_code" != "200" ]]; then
    echo "❌ GET $url failed with HTTP $http_code" >&2
    printf '%s\n' "$body" >&2
    exit 1
  fi
  printf '%s' "$body"
}

require_repo_root
require_command curl
require_command jq

if [[ -z "${SUPABASE_SESSION_JWT:-}" ]]; then
  echo "❌ SUPABASE_SESSION_JWT is required. Export a session token before running." >&2
  exit 1
fi

if [[ -z "${SUPABASE_PUBLISHABLE_KEY:-}" ]]; then
  echo "ℹ️  Resolving Supabase publishable key via setup-edge-auth-env.sh"
  # shellcheck source=/workspaces/ProspectPro/scripts/setup-edge-auth-env.sh
  source "$REPO_ROOT/scripts/setup-edge-auth-env.sh"
fi

SUPABASE_URL=$(trim_trailing_slash "${SUPABASE_URL:-https://sriycekxdqnesdsgwiuc.supabase.co}")
SESSION_USER_ID=${SESSION_USER_ID:-}
rest_base="$SUPABASE_URL/rest/v1"

campaign_id=${CAMPAIGN_ID:-}
if [[ -z "$campaign_id" && -f "$DISCOVERY_ARTIFACT" ]]; then
  campaign_id=$(jq -r '.campaignId // ""' "$DISCOVERY_ARTIFACT")
fi

if [[ -z "$campaign_id" ]]; then
  echo "❌ Set CAMPAIGN_ID or run test-discovery-pipeline.sh first." >&2
  exit 1
fi

campaign_url="$rest_base/campaigns?id=eq.$campaign_id&select=*"
leads_url="$rest_base/leads?campaign_id=eq.$campaign_id&select=business_name,website,email,confidence_score,address,phone"

campaign_response=$(http_get_json "$campaign_url")
campaign_record=$(printf '%s' "$campaign_response" | jq '.[0] // {}')
leads_response=$(http_get_json "$leads_url")
lead_count=$(printf '%s' "$leads_response" | jq 'length')

primary_domain=${CAMPAIGN_DOMAIN:-}
if [[ -z "$primary_domain" && -f "$DISCOVERY_ARTIFACT" ]]; then
  primary_domain=$(jq -r '.primaryDomain // ""' "$DISCOVERY_ARTIFACT")
fi
if [[ -z "$primary_domain" ]]; then
  primary_domain=$(printf '%s' "$leads_response" | jq -r '[.[] | .website // ""]
    | map(sub("^https?://"; ""))
    | map(sub("/$"; ""))
    | map(split("/")[0])
    | map(select(. != ""))
    | first // """)
fi

business_name=${BUSINESS_NAME:-}
if [[ -z "$business_name" ]]; then
  business_name=$(printf '%s' "$leads_response" | jq -r '.[0].business_name // ""')
fi
if [[ -z "$business_name" ]]; then
  business_name=$(printf '%s' "$campaign_record" | jq -r '.business_type // ""')
fi

if [[ -z "$business_name" ]]; then
  echo "❌ Unable to resolve business name. Set BUSINESS_NAME manually." >&2
  exit 1
fi

printf '🧪 Starting enrichment chain test\n'
printf '   Campaign ID: %s\n' "$campaign_id"
printf '   Leads available: %s\n' "$lead_count"
printf '   Domain hint: %s\n' "${primary_domain:-<unknown>}"
printf '\n'

payload=$(jq -n \
  --arg business "$business_name" \
  --arg domain "$primary_domain" \
  --arg campaign "$campaign_id" \
  --arg session "$SESSION_USER_ID" \
  '({
      businessName: $business,
      campaignId: $campaign,
      tierKey: "PROFESSIONAL",
      includeBusinessLicense: true,
      includeCompanyEnrichment: true,
      discoverEmails: true,
      verifyEmails: true,
      complianceVerification: true
    }
    + (if $domain == "" then {} else {domain: $domain} end)
    + (if $session == "" then {} else {sessionUserId: $session} end))')

orchestrator_response=$(http_post_json \
  "$SUPABASE_URL/functions/v1/enrichment-orchestrator" \
  "$payload")

orchestrator_success=$(printf '%s' "$orchestrator_response" | jq -r '.success // false')
if [[ "$orchestrator_success" != "true" ]]; then
  echo "❌ Enrichment orchestrator returned an error" >&2
  printf '%s\n' "$orchestrator_response" >&2
  exit 1
fi

primary_email=$(printf '%s' "$orchestrator_response" | jq -r '.enrichedData.emails[0].email // ""')
confidence=$(printf '%s' "$orchestrator_response" | jq -r '.confidenceScore // 0')
services=$(printf '%s' "$orchestrator_response" | jq -r '.processingMetadata.servicesUsed | join(", ")')

printf '✅ Orchestrator completed\n'
printf '   Confidence score: %s\n' "$confidence"
printf '   Services used: %s\n' "${services:-<none>}"
printf '   Primary email: %s\n' "${primary_email:-<none>}"
printf '\n'

hunter_payload=$(jq -n \
  --arg domain "$primary_domain" \
  --arg campaign "$campaign_id" \
  --arg session "$SESSION_USER_ID" \
  '({
      domain: $domain,
      campaignId: $campaign,
      source: "integration-test"
    }
    + (if $session == "" then {} else {sessionUserId: $session} end))')

hunter_response='{}'
if [[ -n "$primary_domain" ]]; then
  hunter_response=$(http_post_json \
    "$SUPABASE_URL/functions/v1/enrichment-hunter" \
    "$hunter_payload")
  printf '🔍 Hunter domain search executed for %s\n' "$primary_domain"
else
  printf '⚠️  Skipping Hunter domain search (no domain available)\n'
fi

neverbounce_response='{}'
if [[ -n "$primary_email" ]]; then
  neverbounce_payload=$(jq -n \
    --arg email "$primary_email" \
    --arg campaign "$campaign_id" \
    --arg session "$SESSION_USER_ID" \
    '({
        email: $email,
        campaignId: $campaign,
        source: "integration-test"
      }
      + (if $session == "" then {} else {sessionUserId: $session} end))')
  neverbounce_response=$(http_post_json \
    "$SUPABASE_URL/functions/v1/enrichment-neverbounce" \
    "$neverbounce_payload")
  printf '📧 NeverBounce verification requested for %s\n' "$primary_email"
else
  printf '⚠️  Skipping NeverBounce verification (no email discovered)\n'
fi

mkdir -p "$ARTIFACT_DIR"
artifact_payload=$(jq -n \
  --arg timestamp "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  --arg campaignId "$campaign_id" \
  --arg businessName "$business_name" \
  --arg primaryDomain "$primary_domain" \
  --arg primaryEmail "$primary_email" \
  --argjson orchestrator "$orchestrator_response" \
  --argjson hunter "$hunter_response" \
  --argjson neverbounce "$neverbounce_response" \
  '{
     timestamp: $timestamp,
     campaignId: $campaignId,
     businessName: $businessName,
     primaryDomain: $primaryDomain,
     primaryEmail: $primaryEmail,
     orchestrator: $orchestrator,
     hunter: $hunter,
     neverbounce: $neverbounce
   }')
printf '%s\n' "$artifact_payload" >"$ARTIFACT_PATH"

printf '\n📝 Saved artifact: %s\n' "$ARTIFACT_PATH"
printf '   (enrichment outputs captured for export validation)\n\n'

printf '🎉 Enrichment chain test complete.\n'
printf '   Next: run ./scripts/test-export-flow.sh to validate export pipeline.\n'
