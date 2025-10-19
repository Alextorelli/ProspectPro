#!/bin/bash
# test-enrichment-chain-mcp.sh - MCP-aware enrichment chain testing
# Replaces direct HTTP calls with MCP workflow orchestration
# Part of ProspectPro MCP rework: 70-80% script reduction via AI agent automation

set -euo pipefail

# Script configuration
SCRIPT_NAME="test-enrichment-chain-mcp"
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
LEAD_ID="${LEAD_ID:-test-lead-456}"
BUSINESS_NAME="${BUSINESS_NAME:-Test Business LLC}"
EMAIL="${EMAIL:-test@example.com}"

printf '🧪 MCP-Aware Enrichment Chain Test\n'
printf '==================================\n\n'

printf '📋 Test Configuration:\n'
printf '   Campaign ID: %s\n' "$CAMPAIGN_ID"
printf '   Lead ID: %s\n' "$LEAD_ID"
printf '   Business: %s\n' "$BUSINESS_NAME"
printf '   Email: %s\n' "$EMAIL"
printf '\n'

# MCP Workflow: enrichment-chain
printf '🔄 Executing MCP workflow: enrichment-chain\n'
workflow_input=$(jq -n \
  --arg campaignId "$CAMPAIGN_ID" \
  --arg leadId "$LEAD_ID" \
  --arg businessName "$BUSINESS_NAME" \
  --arg email "$EMAIL" \
  '{
     campaignId: $campaignId,
     leadId: $leadId,
     businessName: $businessName,
     email: $email,
     enrichmentSteps: [
       "hunter_email_discovery",
       "neverbounce_verification",
       "business_license_lookup",
       "chamber_verification"
     ],
     options: {
       cacheFirst: true,
       circuitBreakerEnabled: true,
       maxRetries: 3
     }
   }')

mcp_response=$(call_mcp_tool "integration-hub" "execute_workflow" "{\"workflow\": \"enrichment-chain\", \"input\": $workflow_input}")

printf '📝 MCP Response logged\n'
printf '   (In production, this would execute the full enrichment chain)\n\n'

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

# Test Hunter.io enrichment
printf '🔍 Testing Hunter.io email discovery...\n'
hunter_payload=$(jq -n \
  --arg domain "example.com" \
  --arg firstName "John" \
  --arg lastName "Doe" \
  '{
     domain: $domain,
     firstName: $firstName,
     lastName: $lastName,
     campaignId: "'$CAMPAIGN_ID'",
     leadId: "'$LEAD_ID'"
   }')

hunter_response=$(http_post_json \
  "$SUPABASE_URL/functions/v1/enrichment-hunter" \
  "$hunter_payload")

hunter_success=$(printf '%s' "$hunter_response" | jq -r '.success // false')
printf '   Hunter.io result: %s\n' "${hunter_success}"

# Test NeverBounce verification
printf '✅ Testing NeverBounce email verification...\n'
neverbounce_payload=$(jq -n \
  --arg email "$EMAIL" \
  --arg campaignId "$CAMPAIGN_ID" \
  --arg leadId "$LEAD_ID" \
  '{
     email: $email,
     campaignId: $campaignId,
     leadId: $leadId
   }')

neverbounce_response=$(http_post_json \
  "$SUPABASE_URL/functions/v1/enrichment-neverbounce" \
  "$neverbounce_payload")

neverbounce_success=$(printf '%s' "$neverbounce_response" | jq -r '.success // false')
printf '   NeverBounce result: %s\n' "${neverbounce_success}"

# Test enrichment orchestrator
printf '🎯 Testing enrichment orchestrator...\n'
orchestrator_payload=$(jq -n \
  --arg campaignId "$CAMPAIGN_ID" \
  --arg leadId "$LEAD_ID" \
  --arg businessName "$BUSINESS_NAME" \
  '{
     campaignId: $campaignId,
     leadId: $leadId,
     businessName: $businessName,
     enrichmentTypes: ["hunter", "neverbounce", "license", "chamber"],
     budgetLimit: 5.0
   }')

orchestrator_response=$(http_post_json \
  "$SUPABASE_URL/functions/v1/enrichment-orchestrator" \
  "$orchestrator_payload")

orchestrator_success=$(printf '%s' "$orchestrator_response" | jq -r '.success // false')
printf '   Orchestrator result: %s\n' "${orchestrator_success}"

printf '\n'

# Check final enrichment data
printf '📊 Checking final enrichment results...\n'
rest_base="$SUPABASE_URL/rest/v1"
lead_url="$rest_base/leads?id=eq.$LEAD_ID&select=business_name,email,confidence_score,enrichment_data"

lead_response=$(http_get_json "$lead_url")
lead_record=$(printf '%s' "$lead_response" | jq '.[0] // {}')
enrichment_count=$(printf '%s' "$lead_record" | jq '.enrichment_data | length // 0')
confidence_score=$(printf '%s' "$lead_record" | jq -r '.confidence_score // 0')

printf '   Enrichment data points: %s\n' "$enrichment_count"
printf '   Final confidence score: %s\n' "$confidence_score"
printf '\n'

mkdir -p "$ARTIFACT_DIR"
artifact_payload=$(jq -n \
  --arg timestamp "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  --arg campaignId "$CAMPAIGN_ID" \
  --arg leadId "$LEAD_ID" \
  --arg businessName "$BUSINESS_NAME" \
  --arg email "$EMAIL" \
  --argjson hunter "$hunter_response" \
  --argjson neverbounce "$neverbounce_response" \
  --argjson orchestrator "$orchestrator_response" \
  --argjson lead "$lead_record" \
  --arg enrichmentCount "$enrichment_count" \
  --arg confidenceScore "$confidence_score" \
  '{
     timestamp: $timestamp,
     campaignId: $campaignId,
     leadId: $leadId,
     businessName: $businessName,
     email: $email,
     hunter: $hunter,
     neverbounce: $neverbounce,
     orchestrator: $orchestrator,
     lead: $lead,
     enrichmentCount: $enrichmentCount,
     confidenceScore: $confidenceScore
   }')
printf '%s\n' "$artifact_payload" >"$ARTIFACT_PATH"

printf '📝 Saved MCP-aware artifact: %s\n' "$ARTIFACT_PATH"
printf '   (enrichment chain results available for validation)\n\n'

printf '🎉 MCP-aware enrichment chain test complete.\n'
printf '   Next: run ./scripts/test-export-flow-mcp.sh\n'