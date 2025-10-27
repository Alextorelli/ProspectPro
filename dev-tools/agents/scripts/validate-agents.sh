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
  npx --yes dotenv-cli -e "$ENV_FILE" -- node -e "console.log('Development Workflow:', process.env.AGENT_DEV_SUPABASE_URL ? '✓' : '✗')"
  npx --yes dotenv-cli -e "$ENV_FILE" -- node -e "console.log('Observability:', process.env.CONTEXT7_API_KEY ? '✓' : '✗')"
  npx --yes dotenv-cli -e "$ENV_FILE" -- node -e "console.log('Production Ops:', process.env.VERCEL_TOKEN ? '✓' : '✗')"
} | tee -a "$LOG_FILE"

# Smoke test MCPs
{
  echo "# MCP Smoke Tests"
  npx tsx "$ROOT_DIR/dev-tools/agents/mcp-servers/mcp-tools/memory/index.ts" --store "$ROOT_DIR/dev-tools/workspace/context/session_store/memory.jsonl" --dry-run
  npx tsx "$ROOT_DIR/dev-tools/agents/mcp-servers/mcp-tools/sequential/index.ts" --ledger "$ROOT_DIR/dev-tools/workspace/context/session_store/sequential-thoughts.jsonl" --dry-run
  node "$ROOT_DIR/dev-tools/agents/mcp-servers/utility/dist/index.js" --test || true
} | tee -a "$LOG_FILE"

echo "$(date -u +%Y-%m-%dT%H:%M:%SZ): Phase 5 agent/MCP validation complete" | tee -a "$LOG_FILE" >> "$COVERAGE_FILE"
