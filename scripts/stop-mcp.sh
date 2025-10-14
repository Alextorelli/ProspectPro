#!/bin/bash
# ProspectPro helper script to stop active MCP servers.
# Usage: ./scripts/stop-mcp.sh

set -euo pipefail

EXPECTED_REPO_ROOT=${EXPECTED_REPO_ROOT:-/workspaces/ProspectPro}

require_repo_root() {
  local repo_root
  if ! repo_root=$(git rev-parse --show-toplevel 2>/dev/null); then
    echo "❌ Run this script from inside the ProspectPro repo" >&2
    exit 1
  fi

  if [ "$repo_root" != "$EXPECTED_REPO_ROOT" ]; then
    echo "❌ Wrong directory. Expected repo root: $EXPECTED_REPO_ROOT" >&2
    echo "   Current directory: $repo_root" >&2
    exit 1
  fi
}

stop_server() {
  local pattern="$1"
  local label="$2"
  if pids=$(pgrep -f "$pattern" 2>/dev/null); then
    echo "🛑 Stopping $label (PID: $pids)"
    pkill -f "$pattern"
    echo "✅ $label stopped"
  else
    echo "ℹ️ $label not running"
  fi
}

require_repo_root

stop_server "mcp-servers/production-server.js" "production MCP server"
stop_server "mcp-servers/development-server.js" "development MCP server"
stop_server "mcp-servers/supabase-troubleshooting-server.js" "troubleshooting MCP server"

echo "🏁 MCP stop command completed."
