#!/usr/bin/env bash
# validate-agents.sh: Phase 5 agent/MCP validation
set -euo pipefail


ROOT_DIR="$(cd "$(dirname "$0")/../../.." && pwd)"
ENV_FILE="$ROOT_DIR/dev-tools/agents/.env.agent.local"
LOG_FILE="$ROOT_DIR/dev-tools/workspace/context/session_store/phase-5-validation-log.md"
COVERAGE_FILE="$ROOT_DIR/dev-tools/workspace/context/session_store/coverage.md"

# Build utility MCP tools
cd "$ROOT_DIR/dev-tools/agents/mcp-servers/utility" && npm run build && cd -

# Test agent secrets
{
  echo "# Agent Secret Validation"
  npx --yes dotenv-cli -e "$ENV_FILE" -- node -e "console.log('Development Workflow:', process.env.SUPABASE_URL ? '✓' : '✗')"
  npx --yes dotenv-cli -e "$ENV_FILE" -- node -e "console.log('Observability:', process.env.CONTEXT7_API_KEY ? '✓' : '✗')"
  npx --yes dotenv-cli -e "$ENV_FILE" -- node -e "console.log('Production Ops:', process.env.VERCEL_TOKEN ? '✓' : '✗')"
} | tee -a "$LOG_FILE"

# Smoke test MCPs (run from mcp-servers root for correct context)
cd "$ROOT_DIR/dev-tools/agents/mcp-servers"
{
  echo "# MCP Smoke Tests"
  echo "## Utility MCP: fetch, filesystem, git, time"
  node utility/dist/index.js --test || true
  echo "## Memory MCP"
  npx tsx mcp-tools/memory/index.ts --store "$ROOT_DIR/dev-tools/workspace/context/session_store/memory.jsonl" --dry-run || true
  echo "## Sequential Thinking MCP"
  npx tsx mcp-tools/sequential/index.ts --ledger "$ROOT_DIR/dev-tools/workspace/context/session_store/sequential-thoughts.jsonl" --dry-run || true
} | tee -a "$LOG_FILE"
cd "$ROOT_DIR"

echo "$(date -u +%Y-%m-%dT%H:%M:%SZ): Phase 5 agent/MCP validation complete" | tee -a "$LOG_FILE" >> "$COVERAGE_FILE"
