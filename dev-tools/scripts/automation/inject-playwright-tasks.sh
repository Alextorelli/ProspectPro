#!/bin/bash
# inject-playwright-tasks.sh - Inject Playwright tasks into toolset.jsonc files

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="/workspaces/ProspectPro"
TEMPLATE_FILE="$REPO_ROOT/dev-tools/agents/workflows/templates/playwright-toolset-snippet.jsonc"
TOOLSETS_DIR="$REPO_ROOT/dev-tools/agents/workflows"

echo "Injecting Playwright tasks into toolset files..."

if ! command -v jq >/dev/null 2>&1; then
  echo "Installing jq for JSON manipulation..."
  apt-get update && apt-get install -y jq
fi

# Merge into each toolset.jsonc
for toolset_file in "$TOOLSETS_DIR"/*/toolset.jsonc; do
  echo "Updating $toolset_file..."
  jq -s '.[0] * .[1]' "$toolset_file" "$TEMPLATE_FILE" > "$toolset_file.tmp" && mv "$toolset_file.tmp" "$toolset_file"
done

echo "Playwright tasks injected."