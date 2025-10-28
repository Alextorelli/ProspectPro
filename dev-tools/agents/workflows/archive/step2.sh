#!/bin/bash
set -e

REPO_ROOT="/workspaces/ProspectPro"
CHATMODES_DIR="$REPO_ROOT/.github/chatmodes"

echo "=== Updating Chat Mode Workflow References ==="

for chatmode in "$CHATMODES_DIR"/*.chatmode.md; do
  echo "Updating: $(basename "$chatmode")"
  
  # Replace old nested paths with flat paths
  sed -i 's|dev-tools/agents/workflows/development-workflow/instructions\.md|dev-tools/agents/workflows/development-workflow.instructions.md|g' "$chatmode"
  sed -i 's|dev-tools/agents/workflows/development-workflow/toolset\.jsonc|dev-tools/agents/workflows/development-workflow.toolset.jsonc|g' "$chatmode"
  sed -i 's|dev-tools/agents/workflows/production-ops/instructions\.md|dev-tools/agents/workflows/production-ops.instructions.md|g' "$chatmode"
  sed -i 's|dev-tools/agents/workflows/production-ops/toolset\.jsonc|dev-tools/agents/workflows/production-ops.toolset.jsonc|g' "$chatmode"
  sed -i 's|dev-tools/agents/workflows/system-architect/instructions\.md|dev-tools/agents/workflows/system-architect.instructions.md|g' "$chatmode"
  sed -i 's|dev-tools/agents/workflows/system-architect/toolset\.jsonc|dev-tools/agents/workflows/system-architect.toolset.jsonc|g' "$chatmode"
  sed -i 's|dev-tools/agents/workflows/observability/instructions\.md|dev-tools/agents/workflows/observability.instructions.md|g' "$chatmode"
  sed -i 's|dev-tools/agents/workflows/observability/toolset\.jsonc|dev-tools/agents/workflows/observability.toolset.jsonc|g' "$chatmode"
done

echo "=== Chat Mode Updates Complete ==="