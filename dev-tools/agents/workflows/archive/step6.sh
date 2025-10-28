#!/bin/bash
set -e

REPO_ROOT="/workspaces/ProspectPro"
COVERAGE_FILE="$REPO_ROOT/dev-tools/workspace/context/session_store/coverage.md"

echo "=== Finalizing Workflow Flattening ==="

# Refresh inventories
cd "$REPO_ROOT"
npm run docs:update

# Log the changes
cat >> "$COVERAGE_FILE" << EOF

## $(date +%Y-%m-%d): Agent Workflow Flattening

**Change**: Flattened \`dev-tools/agents/workflows/*/\` subdirectories into single-level persona-prefixed files.

**Actions**:
- Moved \`config.json\`, \`instructions.md\`, \`toolset.jsonc\` from nested directories to flat files.
- Removed all \`.gitkeep\` files.
- Updated references in:
  - Chat modes (\`.github/chatmodes/*.chatmode.md\`)
  - Documentation (\`docs/**/*.md\`, \`.github/copilot-instructions.md\`)
  - Automation scripts (\`dev-tools/scripts/**/*.sh\`)
  - Context store (\`dev-tools/agents/context/store/*.json\`)

**Result**: Improved agent discovery, consistent with flat context store layout, single directory scan for all personas.

**Inventories Updated**: \`dev-tools-filetree.txt\`

EOF

echo "=== Workflow Flattening Complete ==="
echo "Review coverage.md and commit changes."