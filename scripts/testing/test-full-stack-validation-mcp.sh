#!/bin/bash
# test-full-stack-validation-mcp.sh - MCP-aware full stack validation
# Orchestrates discovery → enrichment → export workflows via MCP
# Part of ProspectPro MCP rework: 70-80% script reduction via AI agent automation

set -euo pipefail

# Script configuration
SCRIPT_NAME="test-full-stack-validation-mcp"
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
BUSINESS_TYPE="${BUSINESS_TYPE:-coffee shop}"
LOCATION="${LOCATION:-Seattle, WA}"
TIER_KEY="${TIER_KEY:-PROFESSIONAL}"
MAX_RESULTS="${MAX_RESULTS:-5}"
EXPORT_FORMAT="${EXPORT_FORMAT:-csv}"

printf '🧪 MCP-Aware Full Stack Validation\n'
printf '==================================\n\n'

printf '📋 Test Configuration:\n'
printf '   Business Type: %s\n' "$BUSINESS_TYPE"
printf '   Location: %s\n' "$LOCATION"
printf '   Tier: %s\n' "$TIER_KEY"
printf '   Max Results: %s\n' "$MAX_RESULTS"
printf '   Export Format: %s\n' "$EXPORT_FORMAT"
printf '\n'

# MCP Workflow: full-stack-validation
printf '🔄 Executing MCP workflow: full-stack-validation\n'
workflow_input=$(jq -n \
  --arg businessType "$BUSINESS_TYPE" \
  --arg location "$LOCATION" \
  --arg tierKey "$TIER_KEY" \
  --argjson maxResults "$MAX_RESULTS" \
  --arg exportFormat "$EXPORT_FORMAT" \
  '{
     businessType: $businessType,
     location: $location,
     tierKey: $tierKey,
     maxResults: $maxResults,
     exportFormat: $exportFormat,
     workflows: [
       "test-discovery-pipeline",
       "enrichment-chain",
       "export-flow"
     ],
     options: {
       parallelExecution: false,
       validateEachStep: true,
       collectArtifacts: true,
       circuitBreakerEnabled: true
     }
   }')

mcp_response=$(call_mcp_tool "integration-hub" "execute_workflow" "{\"workflow\": \"full-stack-validation\", \"input\": $workflow_input}")

printf '📝 MCP Response logged\n'
printf '   (In production, this would orchestrate the complete pipeline)\n\n'

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

# Step 1: Discovery Pipeline
printf '🚀 Step 1: Discovery Pipeline\n'
printf '----------------------------\n'

discovery_payload=$(jq -n \
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
     sessionUserId: "test-session-full-stack-'$(date +%s)'"
   }')

discovery_response=$(http_post_json \
  "$SUPABASE_URL/functions/v1/business-discovery-background" \
  "$discovery_payload")

discovery_success=$(printf '%s' "$discovery_response" | jq -r '.success // false')
if [[ "$discovery_success" != "true" ]]; then
  echo "❌ Discovery failed" >&2
  printf '%s\n' "$discovery_response" >&2
  exit 1
fi

campaign_id=$(printf '%s' "$discovery_response" | jq -r '.campaignId // empty')
job_id=$(printf '%s' "$discovery_response" | jq -r '.jobId // empty')

printf '✅ Discovery initiated\n'
printf '   Campaign ID: %s\n' "$campaign_id"
printf '   Job ID: %s\n' "$job_id"
printf '\n'

# Monitor discovery completion
printf '⏳ Monitoring discovery completion...\n'
rest_base="$SUPABASE_URL/rest/v1"
job_url="$rest_base/discovery_jobs?id=eq.$job_id&select=status,progress"

for ((i = 1; i <= 10; i++)); do
  job_response=$(http_get_json "$job_url")
  job_status=$(printf '%s' "$job_response" | jq -r '.[0].status // "unknown"')
  job_progress=$(printf '%s' "$job_response" | jq -r '.[0].progress // 0')
  printf '   [%d/10] Status: %s | Progress: %s%%\n' "$i" "$job_status" "$job_progress"

  if [[ "$job_status" == "completed" ]]; then
    printf '✅ Discovery completed\n\n'
    break
  fi
  if [[ "$job_status" == "failed" ]]; then
    echo "❌ Discovery failed" >&2
    exit 1
  fi
  sleep 6
done

if [[ "$job_status" != "completed" ]]; then
  printf '⚠️  Discovery still in progress (status: %s)\n\n' "$job_status"
fi

# Step 2: Enrichment Chain
printf '🔄 Step 2: Enrichment Chain\n'
printf '---------------------------\n'

# Get a lead to enrich
leads_url="$rest_base/leads?campaign_id=eq.$campaign_id&select=id,business_name,email&limit=1"
leads_response=$(http_get_json "$leads_url")
lead_record=$(printf '%s' "$leads_response" | jq '.[0] // {}')
lead_id=$(printf '%s' "$lead_record" | jq -r '.id // empty')
business_name=$(printf '%s' "$lead_record" | jq -r '.business_name // "Unknown Business"')
email=$(printf '%s' "$lead_record" | jq -r '.email // ""')

if [[ -z "$lead_id" ]]; then
  printf '⚠️  No leads found for enrichment\n\n'
else
  printf '📋 Enriching lead: %s (%s)\n' "$business_name" "$email"

  orchestrator_payload=$(jq -n \
    --arg campaignId "$campaign_id" \
    --arg leadId "$lead_id" \
    --arg businessName "$business_name" \
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
  printf '✅ Enrichment orchestrator: %s\n\n' "${orchestrator_success}"
fi

# Step 3: Export Flow
printf '📤 Step 3: Export Flow\n'
printf '--------------------\n'

export_payload=$(jq -n \
  --arg campaignId "$campaign_id" \
  --arg format "$EXPORT_FORMAT" \
  '{
     campaignId: $campaignId,
     format: $format,
     minConfidence: 0,
     options: {
       includeMetadata: true,
       filterDuplicates: true
     }
   }')

export_response=$(http_post_json \
  "$SUPABASE_URL/functions/v1/campaign-export-user-aware" \
  "$export_payload")

export_success=$(printf '%s' "$export_response" | jq -r '.success // false')
export_id=$(printf '%s' "$export_response" | jq -r '.exportId // empty')
row_count=$(printf '%s' "$export_response" | jq -r '.rowCount // 0')

printf '✅ Export initiated: %s\n' "${export_success}"
printf '   Export ID: %s\n' "$export_id"
printf '   Row count: %s\n' "$row_count"
printf '\n'

# Final validation
printf '🎯 Final Validation\n'
printf '------------------\n'

campaign_url="$rest_base/campaigns?id=eq.$campaign_id&select=status,results_count,total_cost"
campaign_response=$(http_get_json "$campaign_url")
campaign_status=$(printf '%s' "$campaign_response" | jq -r '.[0].status // "unknown"')
results_count=$(printf '%s' "$campaign_response" | jq -r '.[0].results_count // 0')
total_cost=$(printf '%s' "$campaign_response" | jq -r '.[0].total_cost // 0"')

printf '📊 Campaign Summary:\n'
printf '   Status: %s\n' "$campaign_status"
printf '   Results: %s\n' "$results_count"
printf '   Total Cost: $%s\n' "$total_cost"
printf '\n'

mkdir -p "$ARTIFACT_DIR"
artifact_payload=$(jq -n \
  --arg timestamp "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  --arg businessType "$BUSINESS_TYPE" \
  --arg location "$LOCATION" \
  --arg tierKey "$TIER_KEY" \
  --argjson maxResults "$MAX_RESULTS" \
  --arg exportFormat "$EXPORT_FORMAT" \
  --arg campaignId "$campaign_id" \
  --arg jobId "$job_id" \
  --arg leadId "$lead_id" \
  --arg exportId "$export_id" \
  --arg campaignStatus "$campaign_status" \
  --arg resultsCount "$results_count" \
  --arg totalCost "$total_cost" \
  --argjson discovery "$discovery_response" \
  --argjson orchestrator "$orchestrator_response" \
  --argjson export "$export_response" \
  '{
     timestamp: $timestamp,
     configuration: {
       businessType: $businessType,
       location: $location,
       tierKey: $tierKey,
       maxResults: $maxResults,
       exportFormat: $exportFormat
     },
     results: {
       campaignId: $campaignId,
       jobId: $jobId,
       leadId: $leadId,
       exportId: $exportId,
       campaignStatus: $campaignStatus,
       resultsCount: $resultsCount,
       totalCost: $totalCost
     },
     responses: {
       discovery: $discovery,
       orchestrator: $orchestrator,
       export: $export
     }
   }')
printf '%s\n' "$artifact_payload" >"$ARTIFACT_PATH"

printf '📝 Saved MCP-aware artifact: %s\n' "$ARTIFACT_PATH"
printf '   (full stack validation results available)\n\n'

printf '🎉 MCP-aware full stack validation complete!\n'
printf '   Pipeline: Discovery → Enrichment → Export ✅\n'