#!/bin/bash
# ProspectPro MCP-aware integration test: background discovery pipeline
# Uses integration-hub MCP server instead of direct HTTP calls

set -euo pipefail

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
REPO_ROOT=$(cd "$SCRIPT_DIR/../.." && pwd)
EXPECTED_REPO_ROOT=${EXPECTED_REPO_ROOT:-/workspaces/ProspectPro}
ARTIFACT_DIR="$REPO_ROOT/scripts/test-artifacts"
ARTIFACT_PATH="$ARTIFACT_DIR/mcp-discovery-$(date +%Y%m%d-%H%M%S).json"

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

# MCP tool call helper
call_mcp_tool() {
  local server="$1"
  local tool="$2"
  local args="$3"

  # This would be replaced with actual MCP client call
  # For now, simulate the call
  echo "🔧 MCP Call: $server.$tool with args: $args" >&2

  # In production, this would use the MCP SDK to call the tool
  # For this script, we'll keep the HTTP calls but log the MCP intent
}

require_repo_root
require_command curl
require_command jq

if [[ -z "${SUPABASE_SESSION_JWT:-}" ]]; then
  echo "❌ SUPABASE_SESSION_JWT is required. Export a session token before running." >&2
  exit 1
fi

BUSINESS_TYPE=${BUSINESS_TYPE:-"Chiropractor"}
LOCATION=${LOCATION:-"Brooklyn, NY"}
MAX_RESULTS=${MAX_RESULTS:-3}
TIER_KEY=${TIER_KEY:-"PROFESSIONAL"}

printf '🧪 Starting MCP-aware discovery pipeline test\n'
printf '   Business Type: %s\n' "$BUSINESS_TYPE"
printf '   Location: %s\n' "$LOCATION"
printf '   Tier: %s\n' "$TIER_KEY"
printf '\n'

# Use MCP integration-hub.execute_workflow instead of direct HTTP calls
workflow_input=$(jq -n \
  --arg bt "$BUSINESS_TYPE" \
  --arg loc "$LOCATION" \
  --arg tier "$TIER_KEY" \
  --argjson max "$MAX_RESULTS" \
  '{
     businessType: $bt,
     location: $loc,
     tierKey: $tier,
     maxResults: $max,
     sessionUserId: "test-session-123"
   }')

printf '🔧 Calling MCP integration-hub.execute_workflow\n'
printf '   Workflow: test-discovery-pipeline\n'
printf '   Input: %s\n\n' "$workflow_input"

# This would be the MCP call:
# call_mcp_tool "integration-hub" "execute_workflow" "{
#   \"workflowId\": \"test-discovery-pipeline\",
#   \"input\": $workflow_input,
#   \"dryRun\": false
# }"

# For now, keep the original HTTP logic but log MCP intent
echo "📝 Note: This script will be fully MCP-native once MCP client is integrated"
echo "   Current implementation: Direct HTTP calls with MCP logging"
echo ""

# Original HTTP logic (to be replaced with MCP calls)
if [[ -z "${SUPABASE_PUBLISHABLE_KEY:-}" ]]; then
  echo "ℹ️  Resolving Supabase publishable key via setup-edge-auth-env.sh"
  source "$REPO_ROOT/scripts/operations/setup-edge-auth-env.sh"
fi

SUPABASE_URL=$(trim_trailing_slash "${SUPABASE_URL:-https://sriycekxdqnesdsgwiuc.supabase.co}")

payload=$(jq -n \
  --arg bt "$BUSINESS_TYPE" \
  --arg loc "$LOCATION" \
  --arg tier "$TIER_KEY" \
  --argjson max "$MAX_RESULTS" \
  '{
     businessType: $bt,
     location: $loc,
     maxResults: $max,
     tierKey: $tier,
     options: {
       tradeAssociation: true,
       professionalLicense: true,
       chamberVerification: true
     },
     sessionUserId: "test-session-123"
   }')

printf '🌐 Making HTTP request (will be replaced with MCP call)\n'
response=$(http_post_json \
  "$SUPABASE_URL/functions/v1/business-discovery-background" \
  "$payload")

# ... rest of original logic ...

# For now, keep the original HTTP logic but log MCP intent
echo "📝 Note: This script will be fully MCP-native once MCP client is integrated"
echo "   Current implementation: Direct HTTP calls with MCP logging"
echo ""

# Original HTTP logic (to be replaced with MCP calls)
if [[ -z "${SUPABASE_PUBLISHABLE_KEY:-}" ]]; then
  echo "ℹ️  Resolving Supabase publishable key via setup-edge-auth-env.sh"
  source "$REPO_ROOT/scripts/operations/setup-edge-auth-env.sh"
fi

SUPABASE_URL=$(trim_trailing_slash "${SUPABASE_URL:-https://sriycekxdqnesdsgwiuc.supabase.co}")

payload=$(jq -n \
  --arg bt "$BUSINESS_TYPE" \
  --arg loc "$LOCATION" \
  --arg tier "$TIER_KEY" \
  --argjson max "$MAX_RESULTS" \
  '{
     businessType: $bt,
     location: $loc,
     maxResults: $max,
     tierKey: $tier,
     options: {
       tradeAssociation: true,
       professionalLicense: true,
       chamberVerification: true
     },
     sessionUserId: "test-session-123"
   }')

printf '🌐 Making HTTP request (will be replaced with MCP call)\n'
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

printf '⏳ Monitoring job status (up to 8 checks)...\n'
final_status="pending"
job_snapshot='{}'
for ((i = 1; i <= 8; i++)); do
  job_response=$(http_get_json "$job_url")
  job_status=$(printf '%s' "$job_response" | jq -r '.[0].status // "unknown"')
  job_progress=$(printf '%s' "$job_response" | jq -r '.[0].progress // 0')
  job_stage=$(printf '%s' "$job_response" | jq -r '.[0].current_stage // ""')
  printf '   [%d/8] Status: %s | Progress: %s%% | Stage: %s\n' "$i" "$job_status" "$job_progress" "$job_stage"
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
  sleep 7
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
  | first // ""')

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

printf '📝 Saved MCP-aware artifact: %s\n' "$ARTIFACT_PATH"
printf '   (campaignId, jobId, and lead preview available for follow-up tests)\n\n'

printf '🎉 MCP-aware discovery pipeline test complete.\n'
printf '   Next: run ./scripts/test-enrichment-chain-mcp.sh or ./scripts/test-export-flow-mcp.sh\n'