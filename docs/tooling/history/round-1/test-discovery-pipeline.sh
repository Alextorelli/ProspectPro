#!/bin/bash
# ProspectPro integration test: background discovery pipeline

set -euo pipefail

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
REPO_ROOT=$(cd "$SCRIPT_DIR/../.." && pwd)
EXPECTED_REPO_ROOT=${EXPECTED_REPO_ROOT:-/workspaces/ProspectPro}
ARTIFACT_DIR="$REPO_ROOT/scripts/test-artifacts"
ARTIFACT_PATH="$ARTIFACT_DIR/latest-discovery.json"

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
  if [[ "$http_code" != "200" && "$http_code" != "202" ]]; then
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
  # shellcheck source=/workspaces/ProspectPro/scripts/operations/setup-edge-auth-env.sh
  source "$REPO_ROOT/scripts/operations/setup-edge-auth-env.sh"
fi

SUPABASE_URL=$(trim_trailing_slash "${SUPABASE_URL:-https://sriycekxdqnesdsgwiuc.supabase.co}")
SESSION_USER_ID=${SESSION_USER_ID:-}

BUSINESS_TYPE=${BUSINESS_TYPE:-"Chiropractor"}
LOCATION=${LOCATION:-"Brooklyn, NY"}
SEARCH_RADIUS=${SEARCH_RADIUS:-"5 miles"}
MAX_RESULTS=${MAX_RESULTS:-3}
BUDGET_LIMIT=${BUDGET_LIMIT:-2.5}
MIN_CONFIDENCE=${MIN_CONFIDENCE:-70}
TIER_KEY=${TIER_KEY:-"PROFESSIONAL"}
POLL_ATTEMPTS=${POLL_ATTEMPTS:-8}
POLL_INTERVAL_SECONDS=${POLL_INTERVAL_SECONDS:-7}

printf '🧪 Starting discovery pipeline test\n'
printf '   Business Type: %s\n' "$BUSINESS_TYPE"
printf '   Location: %s\n' "$LOCATION"
printf '   Tier: %s\n' "$TIER_KEY"
printf '\n'

payload=$(jq -n \
  --arg bt "$BUSINESS_TYPE" \
  --arg loc "$LOCATION" \
  --arg radius "$SEARCH_RADIUS" \
  --arg tier "$TIER_KEY" \
  --arg session "$SESSION_USER_ID" \
  --argjson max "$MAX_RESULTS" \
  --argjson budget "$BUDGET_LIMIT" \
  --argjson minScore "$MIN_CONFIDENCE" \
  '{
     businessType: $bt,
     location: $loc,
     searchRadius: $radius,
     maxResults: $max,
     budgetLimit: $budget,
     minConfidenceScore: $minScore,
     tierKey: $tier,
     options: {
       tradeAssociation: true,
       professionalLicense: true,
       chamberVerification: true
     }
   } + (if $session == "" then {} else {sessionUserId: $session} end)')

response=$(http_post_json \
  "$SUPABASE_URL/functions/v1/business-discovery-background" \
  "$payload")

success=$(printf '%s' "$response" | jq -r '.success // false')
if [[ "$success" != "true" ]]; then
  echo "❌ Discovery function returned an error" >&2
  printf '%s\n' "$response" >&2
  exit 1
fi

job_id=$(printf '%s' "$response" | jq -r '.jobId // empty')
campaign_id=$(printf '%s' "$response" | jq -r '.campaignId // empty')
if [[ -z "$job_id" || -z "$campaign_id" ]]; then
  echo "❌ Response missing jobId or campaignId" >&2
  printf '%s\n' "$response" >&2
  exit 1
fi

printf '✅ Background discovery accepted\n'
printf '   Job ID: %s\n' "$job_id"
printf '   Campaign ID: %s\n' "$campaign_id"
printf '\n'

rest_base="$SUPABASE_URL/rest/v1"
job_url="$rest_base/discovery_jobs?id=eq.$job_id&select=status,progress,current_stage,metrics"
campaign_url="$rest_base/campaigns?id=eq.$campaign_id&select=*"
leads_url="$rest_base/leads?campaign_id=eq.$campaign_id&select=business_name,website,email,confidence_score,address,phone"

printf '⏳ Monitoring job status (up to %s checks)...\n' "$POLL_ATTEMPTS"
final_status="pending"
job_snapshot='{}'
for ((i = 1; i <= POLL_ATTEMPTS; i++)); do
  job_response=$(http_get_json "$job_url")
  job_status=$(printf '%s' "$job_response" | jq -r '.[0].status // "unknown"')
  job_progress=$(printf '%s' "$job_response" | jq -r '.[0].progress // 0')
  job_stage=$(printf '%s' "$job_response" | jq -r '.[0].current_stage // ""')
  printf '   [%d/%d] Status: %s | Progress: %s%% | Stage: %s\n' "$i" "$POLL_ATTEMPTS" "$job_status" "$job_progress" "$job_stage"
  job_snapshot=$(printf '%s' "$job_response" | jq '.[0] // {}')
  final_status="$job_status"
  if [[ "$job_status" == "completed" ]]; then
    break
  fi
  if [[ "$job_status" == "failed" ]]; then
    echo "❌ Discovery job failed" >&2
    printf '%s\n' "$job_response" | jq '.' >&2
    exit 1
  fi
  sleep "$POLL_INTERVAL_SECONDS"
done

printf '\n'
if [[ "$final_status" == "completed" ]]; then
  printf '✅ Discovery job completed successfully\n\n'
else
  printf '⚠️  Discovery job not completed yet (status: %s)\n\n' "$final_status"
fi

campaign_response=$(http_get_json "$campaign_url")
campaign_record=$(printf '%s' "$campaign_response" | jq '.[0] // {}')

leads_response=$(http_get_json "$leads_url")
lead_count=$(printf '%s' "$leads_response" | jq 'length')
lead_preview=$(printf '%s' "$leads_response" | jq '[.[] | {business_name, website, email, confidence_score}] | .[0:3]')
primary_domain=$(printf '%s' "$leads_response" | jq -r '[.[] | .website // ""]
  | map(sub("^https?://"; ""))
  | map(sub("/$"; ""))
  | map(split("/")[0])
  | map(select(. != ""))
  | first // """)

printf '📊 Campaign snapshot:\n'
printf '   Leads stored: %s\n' "$lead_count"
printf '   Primary domain: %s\n' "${primary_domain:-<unknown>}"
printf '\n'
printf '   Lead preview (up to 3):\n'
printf '%s\n\n' "$lead_preview"

mkdir -p "$ARTIFACT_DIR"
artifact_payload=$(jq -n \
  --arg timestamp "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  --arg jobId "$job_id" \
  --arg campaignId "$campaign_id" \
  --arg businessType "$BUSINESS_TYPE" \
  --arg location "$LOCATION" \
  --arg tier "$TIER_KEY" \
  --arg status "$final_status" \
  --arg primaryDomain "$primary_domain" \
  --argjson job "$job_snapshot" \
  --argjson campaign "$campaign_record" \
  --argjson leads "$leads_response" \
  '{
     timestamp: $timestamp,
     jobId: $jobId,
     campaignId: $campaignId,
     businessType: $businessType,
     location: $location,
     tierKey: $tier,
     status: $status,
     primaryDomain: $primaryDomain,
     job: $job,
     campaign: $campaign,
     leads: $leads
   }')
printf '%s\n' "$artifact_payload" >"$ARTIFACT_PATH"

printf '📝 Saved artifact: %s\n' "$ARTIFACT_PATH"
printf '   (campaignId, jobId, and lead preview available for follow-up tests)\n\n'

printf '🎉 Discovery pipeline test complete.\n'
printf '   Next: run ./scripts/test-enrichment-chain.sh or ./scripts/test-export-flow.sh\n'
