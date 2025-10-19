#!/bin/bash
# ProspectPro integration test: campaign export flow

set -euo pipefail

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
REPO_ROOT=$(cd "$SCRIPT_DIR/.." && pwd)
EXPECTED_REPO_ROOT=${EXPECTED_REPO_ROOT:-/workspaces/ProspectPro}
ARTIFACT_DIR="$REPO_ROOT/scripts/test-artifacts"
DISCOVERY_ARTIFACT="$ARTIFACT_DIR/latest-discovery.json"
ENRICHMENT_ARTIFACT="$ARTIFACT_DIR/latest-enrichment.json"
ARTIFACT_PATH="$ARTIFACT_DIR/latest-export.json"
EXPORT_DATA_PATH="$ARTIFACT_DIR/latest-export-data.json"

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

http_post_download() {
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
  if [[ "$http_code" != "200" ]]; then
    echo "❌ Download request to $url failed with HTTP $http_code" >&2
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

if [[ -z "$campaign_id" && -f "$ENRICHMENT_ARTIFACT" ]]; then
  campaign_id=$(jq -r '.campaignId // ""' "$ENRICHMENT_ARTIFACT")
fi

if [[ -z "$campaign_id" ]]; then
  echo "❌ Set CAMPAIGN_ID or run the discovery/enrichment tests first." >&2
  exit 1
fi

printf '🧪 Starting export flow test\n'
printf '   Campaign ID: %s\n\n' "$campaign_id"

payload=$(jq -n \
  --arg campaign "$campaign_id" \
  --arg session "$SESSION_USER_ID" \
  '{
     campaignId: $campaign,
     format: "json",
     includeEnrichmentData: true
   } + (if $session == "" then {} else {sessionUserId: $session} end)')

metadata=$(http_post_json \
  "$SUPABASE_URL/functions/v1/campaign-export-user-aware" \
  "$payload")

export_success=$(printf '%s' "$metadata" | jq -r '.success // false')
if [[ "$export_success" != "true" ]]; then
  echo "❌ Campaign export returned an error" >&2
  printf '%s\n' "$metadata" >&2
  exit 1
fi

file_name=$(printf '%s' "$metadata" | jq -r '.export.fileName // ""')
lead_count=$(printf '%s' "$metadata" | jq -r '.campaign.leadCount // 0')
size_bytes=$(printf '%s' "$metadata" | jq -r '.export.size // 0')

printf '✅ Export metadata received\n'
printf '   File: %s (%s bytes)\n' "$file_name" "$size_bytes"
printf '   Leads included: %s\n\n' "$lead_count"

download_url="$SUPABASE_URL/functions/v1/campaign-export-user-aware?download=true"
export_data=$(http_post_download "$download_url" "$payload")

dashboard_exports_url="$rest_base/dashboard_exports?campaign_id=eq.$campaign_id&select=id,campaign_id,completed_at,row_count&order=completed_at.desc&limit=1"
exports_response=$(http_get_json "$dashboard_exports_url")
latest_export_record=$(printf '%s' "$exports_response" | jq '.[0] // {}')

mkdir -p "$ARTIFACT_DIR"
artifact_payload=$(jq -n \
  --arg timestamp "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  --arg campaignId "$campaign_id" \
  --arg fileName "$file_name" \
  --arg size "$size_bytes" \
  --argjson metadata "$metadata" \
  --argjson exportRecord "$latest_export_record" \
  '{
     timestamp: $timestamp,
     campaignId: $campaignId,
     fileName: $fileName,
     size: ($size | tonumber),
     metadata: $metadata,
     dashboardExport: $exportRecord
   }')
printf '%s\n' "$artifact_payload" >"$ARTIFACT_PATH"
printf '%s\n' "$export_data" >"$EXPORT_DATA_PATH"

printf '📝 Saved metadata: %s\n' "$ARTIFACT_PATH"
printf '📝 Saved export payload: %s\n\n' "$EXPORT_DATA_PATH"

printf '🎉 Export flow test complete.\n'
printf '   Inspect %s for the exported dataset.\n' "$EXPORT_DATA_PATH"
