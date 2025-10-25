#!/bin/bash
# ProspectPro MCP server startup helper

set -euo pipefail

REPO_ROOT="/workspaces/ProspectPro"
cd "$REPO_ROOT" || exit 1

echo "🤖 Starting ProspectPro MCP servers"

MCP_DIR="$REPO_ROOT/mcp-servers"
if [[ ! -d "$MCP_DIR" ]]; then
  echo "❌ mcp-servers directory missing. Run dev-tools/scripts/setup/.codespaces-init.sh to restore." >&2
  exit 1
fi

if [[ ! -d "$MCP_DIR/node_modules" ]]; then
  echo "📥 Installing MCP server dependencies..."
  (cd "$MCP_DIR" && npm install) || {
    echo "❌ Failed to install MCP dependencies." >&2
    exit 1
  }
fi

ENSURE_SCRIPT="$REPO_ROOT/scripts/operations/ensure-supabase-cli-session.sh"
if [[ -f "$ENSURE_SCRIPT" ]]; then
  echo "🔐 Verifying Supabase CLI session..."
  # shellcheck disable=SC1091
  source "$ENSURE_SCRIPT" || echo "⚠️ Supabase CLI session not verified."
else
  echo "⚠️ Supabase session guard missing; MCP troubleshooting tools may fail." >&2
fi

if command -v gh >/dev/null 2>&1; then
  if ! gh auth status >/dev/null 2>&1; then
    echo "⚠️ GitHub CLI not authenticated. Roadmap tools may fail." >&2
  fi
else
  echo "⚠️ GitHub CLI not installed; roadmap tasks unavailable." >&2
fi

PID_FILE="$REPO_ROOT/.mcp-pids"
rm -f "$PID_FILE"

cd "$MCP_DIR" || exit 1

node production-server.js &
PROD_PID=$!
node development-server.js &
DEV_PID=$!
node supabase-troubleshooting-server.js &
TROUBLE_PID=$!

{
  echo "$PROD_PID"
  echo "$DEV_PID"
  echo "$TROUBLE_PID"
} > "$PID_FILE"

cat <<EOF
✅ MCP servers launched
   Production PID:      $PROD_PID
   Development PID:     $DEV_PID
   Troubleshooting PID: $TROUBLE_PID
EOF

echo "Use 'npm run mcp:stop' to terminate servers."
