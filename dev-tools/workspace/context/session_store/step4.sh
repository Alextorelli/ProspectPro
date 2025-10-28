#!/bin/bash
set -e

REPO_ROOT="/workspaces/ProspectPro"

echo "=== Updating Automation Script Workflow References ==="

# Update all scripts in dev-tools/scripts/
find "$REPO_ROOT/dev-tools/scripts" -name "*.sh" -type f -exec sed -i \
  -e 's|dev-tools/agents/workflows/\([^/]*\)/instructions\.md|dev-tools/agents/workflows/\1.instructions.md|g' \
  -e 's|dev-tools/agents/workflows/\([^/]*\)/toolset\.jsonc|dev-tools/agents/workflows/\1.toolset.jsonc|g' \
  -e 's|dev-tools/agents/workflows/\([^/]*\)/config\.json|dev-tools/agents/workflows/\1.config.json|g' \
  {} \;

echo "=== Automation Script Updates Complete ==="