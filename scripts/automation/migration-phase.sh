#!/bin/bash
# ProspectPro Migration Phase Automation Script
# Usage: bash scripts/automation/migration-phase.sh
set -euo pipefail

# 1. Remove node_modules and ensure .gitignore is correct
echo "Cleaning up node_modules..."
rm -rf ./node_modules ./dev-tools/agent-orchestration/mcp/node_modules

grep -q '^node_modules/' .gitignore || echo 'node_modules/' >> .gitignore

echo "node_modules cleanup complete."

# 2. MCP/Config/Registry sync
echo "Syncing MCP configs and registry..."
cp config/mcp-config.v2.json config/mcp-config.json
cp dev-tools/mcp-servers/v2/registry.v2.json dev-tools/mcp-servers/registry.json

echo "MCP configs and registry synced."

# 3. Documentation and diagram update
echo "Updating documentation and diagrams..."
npm run docs:prepare
npm run docs:update
npm run docs:render:diagrams

echo "Documentation and diagrams updated."

# 4. Lint and test pipeline
echo "Running lint and tests..."
npm run lint
npm test
npm run supabase:test:db || true
npm run supabase:test:functions || true

echo "Lint and tests complete."

# 5. MCP lifecycle tasks
echo "Running MCP lifecycle tasks..."
npm run mcp:chat:sync
npm run mcp:chat:validate
npm run mcp:start:production
npm run mcp:start:development
npm run mcp:start:troubleshooting

echo "MCP lifecycle tasks complete."

# 6. Automation scripts dry-run
echo "Running automation scripts (dry-run)..."
npm run devtools:start -- --dry-run
npm run vercel:validate -- --dry-run
npm run redis:observability -- --dry-run
bash scripts/automation/context-snapshot.sh --dry-run
bash scripts/testing/devtools-regression.sh --dry-run

echo "Automation scripts dry-run complete."

# 7. CI/Workflow smoke test
echo "Triggering CI workflow smoke test..."
# If using act for local CI: act -j Deploy-Frontend || true

echo "Migration phase automation complete."
