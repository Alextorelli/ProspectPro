#!/bin/bash

# ProspectPro helper script to launch all MCP servers in one command.
# Ensures we run from the repository root and surfaces useful logging.

set -euo pipefail

REPO_ROOT="/workspaces/ProspectPro"

if ! current_root=$(git rev-parse --show-toplevel 2>/dev/null); then
  echo "❌ Not inside a git repository. Run this script from the ProspectPro repo root." >&2
  exit 1
fi

if [ "$current_root" != "$REPO_ROOT" ]; then
  echo "❌ Please run scripts/start-mcp.sh from $REPO_ROOT (current: $current_root)" >&2
  exit 1
fi

echo "🚀 Starting ProspectPro MCP servers..."
exec npm run mcp:start
