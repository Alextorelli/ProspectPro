#!/bin/bash
# test-export-flow-mcp.sh - MCP-aware export flow testing
# Replaces direct HTTP calls with MCP workflow orchestration
# Part of ProspectPro MCP rework: 70-80% script reduction via AI agent automation

set -euo pipefail

# Script configuration
SCRIPT_NAME="test-export-flow-mcp"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ARTIFACT_DIR="$REPO_ROOT/reports/test-artifacts"
ARTIFACT_PATH="$ARTIFACT_DIR/${SCRIPT_NAME}-$(date +%Y%m%d-%H%M%S).json"

# Load shared utilities
source "$REPO_ROOT/scripts/lib/shared-functions.sh"

# MCP integration helpers
call_mcp_tool() {
  local server="$1"
  local tool="$2"
  local args="$3"

  printf '🔧 MCP Call: %s.%s\n' "$server" "$tool" >&2
  printf '   Args: %s\n' "$args" >&2

  # TODO: Replace with actual MCP client call
  # For now, log the intent and return mock success
  printf '{"success": true, "mcp_logged": true, "server": "%s", "tool": "%s", "args": %s}\n' "$server" "$tool" "$args"
}

# Test configuration
CAMPAIGN_ID="${CAMPAIGN_ID:-test-campaign-123}"
EXPORT_FORMAT="${EXPORT_FORMAT:-csv}"
MIN_CONFIDENCE="${MIN_CONFIDENCE:-50}"

printf '🧪 MCP-Aware Export Flow Test\n'
printf '=============================\n\n'

printf '📋 Test Configuration:\n'
printf '   Campaign ID: %s\n' "$CAMPAIGN_ID"
printf '   Export Format: %s\n' "$EXPORT_FORMAT"
printf '   Min Confidence: %s\n' "$MIN_CONFIDENCE"
printf '\n'

# MCP Workflow: export-flow
printf '🔄 Executing MCP workflow: export-flow\n'
workflow_input=$(jq -n \
  --arg campaignId "$CAMPAIGN_ID" \
  --arg format "$EXPORT_FORMAT" \
  --arg minConfidence "$MIN_CONFIDENCE" \
  '{
     campaignId: $campaignId,
     format: $format,
     minConfidence: $minConfidence,
     options: {
       includeMetadata: true,
       filterDuplicates: true,
       validateEmails: true
     }
   }')

mcp_response=$(call_mcp_tool "integration-hub" "execute_workflow" "{\"workflow\": \"export-flow\", \"input\": $workflow_input}")

printf '📝 MCP Response logged\n'
printf '   (In production, this would execute the full export workflow)\n\n'

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

# Test campaign export function
printf '📤 Testing campaign export function...\n'
export_payload=$(jq -n \
  --arg campaignId "$CAMPAIGN_ID" \
  --arg format "$EXPORT_FORMAT" \
  --arg minConfidence "$MIN_CONFIDENCE" \
  '{
     campaignId: $campaignId,
     format: $format,
     minConfidence: $minConfidence,
     options: {
       includeMetadata: true,
       filterDuplicates: true
     }
   }')

export_response=$(http_post_json \
  "$SUPABASE_URL/functions/v1/campaign-export-user-aware" \
  "$export_payload")

export_success=$(printf '%s' "$export_response" | jq -r '.success // false')
if [[ "$export_success" != "true" ]]; then
  echo "❌ Export function returned an error" >&2
  printf '%s\n' "$export_response" >&2
  exit 1
fi

export_id=$(printf '%s' "$export_response" | jq -r '.exportId // empty')
download_url=$(printf '%s' "$export_response" | jq -r '.downloadUrl // empty')
row_count=$(printf '%s' "$export_response" | jq -r '.rowCount // 0')

printf '✅ Export initiated successfully\n'
printf '   Export ID: %s\n' "$export_id"
printf '   Row count: %s\n' "$row_count"
printf '   Download URL: %s\n' "${download_url:-<not provided>}"
printf '\n'

# Test export status monitoring
if [[ -n "$export_id" ]]; then
  printf '⏳ Monitoring export status...\n'
  rest_base="$SUPABASE_URL/rest/v1"
  export_url="$rest_base/dashboard_exports?id=eq.$export_id&select=export_status,row_count,completed_at"

  for ((i = 1; i <= 5; i++)); do
    status_response=$(http_get_json "$export_url")
    export_status=$(printf '%s' "$status_response" | jq -r '.[0].export_status // "unknown"')
    export_row_count=$(printf '%s' "$status_response" | jq -r '.[0].row_count // 0')
    printf '   [%d/5] Status: %s | Rows: %s\n' "$i" "$export_status" "$export_row_count"

    if [[ "$export_status" == "completed" ]]; then
      printf '✅ Export completed successfully\n\n'
      break
    fi
    if [[ "$export_status" == "failed" ]]; then
      echo "❌ Export failed" >&2
      printf '%s\n' "$status_response" | jq '.' >&2
      exit 1
    fi
    sleep 3
  done
fi

# Validate export data structure
if [[ -n "$download_url" && "$download_url" != "<not provided>" ]]; then
  printf '🔍 Validating export data structure...\n'
  # Note: In production, this would download and validate the actual file
  # For now, just check that we got a valid URL
  if [[ "$download_url" =~ ^https:// ]]; then
    printf '✅ Download URL appears valid\n'
  else
    printf '⚠️  Download URL format unexpected: %s\n' "$download_url"
  fi
fi

printf '\n'

# Check campaign analytics
printf '📊 Checking campaign analytics...\n'
analytics_url="$SUPABASE_URL/rest/v1/campaign_analytics?id=eq.$CAMPAIGN_ID&select=results_count,total_cost,avg_confidence"

analytics_response=$(http_get_json "$analytics_url")
analytics_record=$(printf '%s' "$analytics_response" | jq '.[0] // {}')
results_count=$(printf '%s' "$analytics_record" | jq -r '.results_count // 0')
total_cost=$(printf '%s' "$analytics_record" | jq -r '.total_cost // 0')
avg_confidence=$(printf '%s' "$analytics_record" | jq -r '.avg_confidence // 0')

printf '   Total results: %s\n' "$results_count"
printf '   Total cost: $%s\n' "$total_cost"
printf '   Avg confidence: %s%%\n' "$avg_confidence"
printf '\n'

mkdir -p "$ARTIFACT_DIR"
artifact_payload=$(jq -n \
  --arg timestamp "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  --arg campaignId "$CAMPAIGN_ID" \
  --arg format "$EXPORT_FORMAT" \
  --arg minConfidence "$MIN_CONFIDENCE" \
  --argjson export "$export_response" \
  --arg exportId "$export_id" \
  --arg downloadUrl "$download_url" \
  --arg rowCount "$row_count" \
  --arg exportStatus "$export_status" \
  --argjson analytics "$analytics_record" \
  --arg resultsCount "$results_count" \
  --arg totalCost "$total_cost" \
  --arg avgConfidence "$avg_confidence" \
  '{
     timestamp: $timestamp,
     campaignId: $campaignId,
     format: $format,
     minConfidence: $minConfidence,
     export: $export,
     exportId: $exportId,
     downloadUrl: $downloadUrl,
     rowCount: $rowCount,
     exportStatus: $exportStatus,
     analytics: $analytics,
     resultsCount: $resultsCount,
     totalCost: $totalCost,
     avgConfidence: $avgConfidence
   }')
printf '%s\n' "$artifact_payload" >"$ARTIFACT_PATH"

printf '📝 Saved MCP-aware artifact: %s\n' "$ARTIFACT_PATH"
printf '   (export flow results available for validation)\n\n'

printf '🎉 MCP-aware export flow test complete.\n'
printf '   Full pipeline test: ./scripts/test-full-stack-validation-mcp.sh\n'