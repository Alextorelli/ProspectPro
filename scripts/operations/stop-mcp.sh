#!/bin/bash
# ProspectPro MCP server shutdown helper

set -euo pipefail

REPO_ROOT="/workspaces/ProspectPro"
PID_FILE="$REPO_ROOT/.mcp-pids"

cd "$REPO_ROOT" || exit 1

if [[ ! -f "$PID_FILE" ]]; then
  echo "⚠️ No MCP PID file found; servers may not be running."
  exit 0
fi

echo "🛑 Stopping ProspectPro MCP servers"

while read -r pid; do
  if [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null; then
    kill "$pid" 2>/dev/null || true
    echo "   Stopped PID $pid"
  fi
done < "$PID_FILE"

rm -f "$PID_FILE"
echo "✅ MCP servers stopped"
