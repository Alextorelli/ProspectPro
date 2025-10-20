#!/bin/bash
# Real-time watcher for background discovery jobs
# ProspectPro v4.3 - October 8, 2025

set -euo pipefail

require_repo_root() {
  local expected_root="${EXPECTED_REPO_ROOT:-/workspaces/ProspectPro}"
  local repo_root

  if ! repo_root=$(git rev-parse --show-toplevel 2>/dev/null); then
    echo "❌ Unable to determine git root. Run this monitor from inside the ProspectPro repository." >&2
    exit 1
  fi

  local current_dir
  current_dir=$(pwd -P)
  if [[ "$current_dir" != "$repo_root" ]]; then
    echo "❌ Run this monitor from the repository root ($repo_root). Current directory: $current_dir" >&2
    exit 1
  fi

  if [[ "$repo_root" != "$expected_root" ]]; then
    echo "❌ Repository root mismatch. Expected $expected_root but detected $repo_root." >&2
    echo "   Set EXPECTED_REPO_ROOT to override when intentionally operating from another checkout." >&2
    exit 1
  fi
}

require_repo_root

if ! command -v jq &>/dev/null; then
  echo "❌ jq is required for this script. Install jq and rerun." >&2
  exit 1
fi

INTERVAL=5
CAMPAIGN_ID=""
POSITIONAL=()

while [[ $# -gt 0 ]]; do
  case "$1" in
    --interval)
      if [[ -z "${2:-}" ]]; then
        echo "❌ --interval requires a numeric value" >&2
        exit 1
      fi
      INTERVAL="$2"
      shift 2
      ;;
    --campaign)
      if [[ -z "${2:-}" ]]; then
        echo "❌ --campaign requires a campaign ID" >&2
        exit 1
      fi
      CAMPAIGN_ID="$2"
      shift 2
      ;;
    -h|--help)
      cat <<'USAGE'
Usage: monitor-discovery-job.sh <job-id> [--campaign <campaign-id>] [--interval <seconds>]

Polls the Supabase REST API for job, campaign, and lead status to help debug
background discovery runs in real time.

Environment prerequisites (one of each prefix is enough):
  - VITE_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_URL / SUPABASE_URL
  - VITE_SUPABASE_ANON_KEY / NEXT_PUBLIC_SUPABASE_ANON_KEY / SUPABASE_ANON_KEY

Examples:
  monitor-discovery-job.sh job_123 --interval 3
  monitor-discovery-job.sh job_123 --campaign campaign_456
USAGE
      exit 0
      ;;
    *)
      POSITIONAL+=("$1")
      shift
      ;;
  esac
done

set -- "${POSITIONAL[@]}"

if [[ $# -lt 1 ]]; then
  echo "❌ Missing required <job-id>. Run with -h for usage." >&2
  exit 1
fi

JOB_ID="$1"

resolve_env() {
  for var in "$@"; do
    local value="${!var:-}"
    if [[ -n "$value" ]]; then
      echo "$value"
      return 0
    fi
  done
  echo ""
}

SUPABASE_URL=$(resolve_env VITE_SUPABASE_URL NEXT_PUBLIC_SUPABASE_URL SUPABASE_URL)
SUPABASE_ANON_KEY=$(resolve_env VITE_SUPABASE_ANON_KEY NEXT_PUBLIC_SUPABASE_ANON_KEY SUPABASE_ANON_KEY)

if [[ -z "$SUPABASE_URL" ]]; then
  SUPABASE_URL="https://sriycekxdqnesdsgwiuc.supabase.co"
  echo "ℹ️  Supabase URL not set. Defaulting to $SUPABASE_URL"
fi

if [[ -z "$SUPABASE_ANON_KEY" ]]; then
  echo "❌ Supabase anon key not configured. Export one of:" >&2
  echo "   VITE_SUPABASE_ANON_KEY / NEXT_PUBLIC_SUPABASE_ANON_KEY / SUPABASE_ANON_KEY" >&2
  exit 1
fi

REST_AUTH=(-H "apikey: $SUPABASE_ANON_KEY" -H "Authorization: Bearer $SUPABASE_ANON_KEY")

echo "👀 Watching discovery job $JOB_ID"
if [[ -n "$CAMPAIGN_ID" ]]; then
  echo "   Associated campaign: $CAMPAIGN_ID"
fi
echo "   Polling interval: ${INTERVAL}s"
echo "========================================"

COUNTER=0

while true; do
  COUNTER=$((COUNTER + 1))
  TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
  echo "[$TIMESTAMP] Poll #$COUNTER"

  JOB_RESPONSE=$(curl -s -X GET \
    "$SUPABASE_URL/rest/v1/discovery_jobs?id=eq.$JOB_ID&select=status,progress,current_stage,error,metrics,updated_at" \
    "${REST_AUTH[@]}" || echo "[]")

  if ! echo "$JOB_RESPONSE" | jq '.[0]' >/dev/null 2>&1; then
    echo "❌ Unable to fetch job status. Response:"
    echo "$JOB_RESPONSE"
    exit 1
  fi

  JOB_STATUS=$(echo "$JOB_RESPONSE" | jq -r '.[0].status // "unknown"')
  JOB_PROGRESS=$(echo "$JOB_RESPONSE" | jq -r '.[0].progress // 0')
  JOB_STAGE=$(echo "$JOB_RESPONSE" | jq -r '.[0].current_stage // "n/a"')
  JOB_ERROR=$(echo "$JOB_RESPONSE" | jq -r '.[0].error // ""')
  JOB_UPDATED=$(echo "$JOB_RESPONSE" | jq -r '.[0].updated_at // ""')

  echo "  • Job status: $JOB_STATUS (${JOB_PROGRESS}% | stage: $JOB_STAGE | updated: $JOB_UPDATED)"
  if [[ "$JOB_ERROR" != "" && "$JOB_ERROR" != "null" ]]; then
    echo "    ↳ Error: $JOB_ERROR"
  fi

  if [[ -n "$CAMPAIGN_ID" ]]; then
    CAMPAIGN_RESPONSE=$(curl -s -X GET \
      "$SUPABASE_URL/rest/v1/campaigns?id=eq.$CAMPAIGN_ID&select=status,results_count,total_cost,processing_time_ms,updated_at" \
      "${REST_AUTH[@]}" || echo "[]")

    if echo "$CAMPAIGN_RESPONSE" | jq '.[0]' >/dev/null 2>&1; then
      CAMPAIGN_STATUS=$(echo "$CAMPAIGN_RESPONSE" | jq -r '.[0].status // "unknown"')
      CAMPAIGN_RESULTS=$(echo "$CAMPAIGN_RESPONSE" | jq -r '.[0].results_count // 0')
      CAMPAIGN_COST=$(echo "$CAMPAIGN_RESPONSE" | jq -r '.[0].total_cost // 0')
      echo "  • Campaign status: $CAMPAIGN_STATUS (results: $CAMPAIGN_RESULTS | cost: \$$CAMPAIGN_COST)"
    else
      echo "  • Campaign lookup returned unexpected payload"
      echo "$CAMPAIGN_RESPONSE"
    fi
  fi

  if [[ -n "$CAMPAIGN_ID" ]]; then
    LEADS_RESPONSE=$(curl -s -X GET \
      "$SUPABASE_URL/rest/v1/leads?campaign_id=eq.$CAMPAIGN_ID&select=id" \
      "${REST_AUTH[@]}" || echo "[]")

    LEADS_COUNT=$(echo "$LEADS_RESPONSE" | jq 'length')
    echo "  • Leads generated: $LEADS_COUNT"
  fi

  echo "----------------------------------------"

  if [[ "$JOB_STATUS" == "completed" ]]; then
    echo "✅ Job completed. Exiting monitor." 
    break
  fi

  if [[ "$JOB_STATUS" == "failed" ]]; then
    echo "❌ Job failed. Check Edge Function logs for details." 
    break
  fi

  sleep "$INTERVAL"
done

echo "Done."