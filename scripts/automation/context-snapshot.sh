#!/usr/bin/env bash
# Context Snapshot Collector
# Usage: ./context-snapshot.sh <function-slug> <since-time>
set -euo pipefail

REPO_ROOT=$(git rev-parse --show-toplevel)
cd "$REPO_ROOT"

if [[ $# -ne 2 ]]; then
  echo "Usage: $0 <function-slug> <since-time>"
  echo "Example: $0 business-discovery-background 24h"
  exit 1
fi

FUNC_SLUG="$1"
SINCE_TIME="$2"

mkdir -p reports/diagnostics
SNAPSHOT_MD="reports/diagnostics/context-snapshot-$(date +%Y%m%d-%H%M%S).md"

# Supabase logs
SUPABASE_LOG="reports/diagnostics/${FUNC_SLUG}-$(date +%Y%m%d-%H%M%S).log"
./scripts/automation/supabase-pull-logs.sh "$FUNC_SLUG" "$SINCE_TIME"

# Vercel status
VERCEL_STATUS="reports/deployments/vercel-status-$(date +%Y%m%d-%H%M%S).json"
./scripts/automation/vercel-status-check.sh

# MCP troubleshooting (non-interactive)
MCP_OUT="reports/diagnostics/mcp-troubleshooting-$(date +%Y%m%d-%H%M%S).log"
if npm run mcp:start:troubleshooting > "$MCP_OUT" 2>&1; then
  MCP_STATUS="OK"
else
  MCP_STATUS="FAILED"
fi

# Compose snapshot
{
  echo "# Context Snapshot"
  echo "- Timestamp: $(date -u)"
  echo "- Supabase Log: $SUPABASE_LOG"
  echo "- Vercel Status: $VERCEL_STATUS"
  echo "- MCP Troubleshooting: $MCP_OUT ($MCP_STATUS)"
  echo ""
  echo "## Supabase Log (tail)"
  tail -20 "$SUPABASE_LOG" || echo "[Log missing]"
  echo ""
  echo "## Vercel Status (head)"
  head -20 "$VERCEL_STATUS" || echo "[Status missing]"
  echo ""
  echo "## MCP Troubleshooting (tail)"
  tail -20 "$MCP_OUT" || echo "[MCP log missing]"
} > "$SNAPSHOT_MD"

echo "Context snapshot saved to $SNAPSHOT_MD"