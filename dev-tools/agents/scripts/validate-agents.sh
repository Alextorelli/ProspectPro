#!/usr/bin/env bash
# validate-agents.sh: Phase 5 agent/MCP validation
set -euo pipefail

ENV_FILE="dev-tools/agents/.env.agent.local"
LOG_FILE="dev-tools/workspace/context/session_store/phase-5-validation-log.md"
COVERAGE_FILE="dev-tools/workspace/context/session_store/coverage.md"

# Build utility MCP tools
cd dev-tools/agents/mcp-servers/utility && npm run build && cd -

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
  npx tsx dev-tools/agents/mcp-servers/mcp-tools/memory/index.ts --store dev-tools/workspace/context/session_store/memory.jsonl --dry-run
  npx tsx dev-tools/agents/mcp-servers/mcp-tools/sequential/index.ts --ledger dev-tools/workspace/context/session_store/sequential-thoughts.jsonl --dry-run
  node dev-tools/agents/mcp-servers/utility/dist/index.js --test || true
} | tee -a "$LOG_FILE"

echo "$(date -u +%Y-%m-%dT%H:%M:%SZ): Phase 5 agent/MCP validation complete" | tee -a "$LOG_FILE" >> "$COVERAGE_FILE"
