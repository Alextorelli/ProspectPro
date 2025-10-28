#!/bin/bash
set -e

REPO_ROOT="/workspaces/ProspectPro"

echo "=== Updating Documentation Workflow References ==="

# Update all markdown files in docs/
find "$REPO_ROOT/docs" -name "*.md" -type f -exec sed -i \
  -e 's|dev-tools/agents/workflows/\([^/]*\)/instructions\.md|dev-tools/agents/workflows/\1.instructions.md|g' \
  -e 's|dev-tools/agents/workflows/\([^/]*\)/toolset\.jsonc|dev-tools/agents/workflows/\1.toolset.jsonc|g' \
  -e 's|dev-tools/agents/workflows/\([^/]*\)/config\.json|dev-tools/agents/workflows/\1.config.json|g' \
  {} \;

# Update copilot instructions
sed -i \
  -e 's|dev-tools/agents/workflows/\([^/]*\)/instructions\.md|dev-tools/agents/workflows/\1.instructions.md|g' \
  -e 's|dev-tools/agents/workflows/\([^/]*\)/toolset\.jsonc|dev-tools/agents/workflows/\1.toolset.jsonc|g' \
  "$REPO_ROOT/.github/copilot-instructions.md"

echo "=== Documentation Updates Complete ==="