#!/bin/bash
# ProspectPro Codespaces initialization

set -euo pipefail

REPO_ROOT="/workspaces/ProspectPro"
cd "$REPO_ROOT" || exit 1

echo "🚀 ProspectPro Codespace Initialization"
echo "========================================"

# 1. Theme license for VS Code extensions
THEME_KEY="7F6F4437-EFA6-4CDA-8841-7D55CB40DE71"
THEME_KEY_FILE="$HOME/.theme-license-key"
echo "$THEME_KEY" > "$THEME_KEY_FILE"
chmod 600 "$THEME_KEY_FILE"
export THEME_LICENSE_KEY="$THEME_KEY"
echo "✅ Theme license configured"

# 2. Elevate Supabase CLI permissions (no-op if missing)
if command -v supabase >/dev/null 2>&1; then
  sudo chmod +x "$(which supabase)" 2>/dev/null || true
  echo "✅ Supabase CLI permissions elevated"
else
  echo "⚠️ Supabase CLI not found on PATH"
fi

# 3. Disable GPG signing to avoid commit prompts
if git config --get commit.gpgsign >/dev/null 2>&1; then
  git config --global commit.gpgsign false || true
  echo "✅ Git commit GPG signing disabled"
else
  echo "ℹ️ Git commit signing already disabled"
fi

# 4. Check GitHub CLI authentication (warn only)
if command -v gh >/dev/null 2>&1; then
  if gh auth status >/dev/null 2>&1; then
    echo "✅ GitHub CLI authenticated"
  else
    echo "⚠️ GitHub CLI not authenticated (run 'gh auth login' if roadmap tasks needed)"
  fi
else
  echo "⚠️ GitHub CLI not installed"
fi

# 5. Restore consolidated MCP servers from archive if missing
MCP_DIR="$REPO_ROOT/mcp-servers"
MCP_ARCHIVE="$REPO_ROOT/archive-ProspectPro-2025-10-17.tar.gz"
if [[ ! -d "$MCP_DIR" && -f "$MCP_ARCHIVE" ]]; then
  echo "📦 Restoring MCP servers from archive..."
  tar -xzf "$MCP_ARCHIVE" -C "$REPO_ROOT" mcp-servers || echo "⚠️ MCP archive extraction failed"
fi

# 6. Ensure MCP dependencies installed
if [[ -d "$MCP_DIR" && ! -d "$MCP_DIR/node_modules" ]]; then
  echo "📥 Installing MCP server dependencies..."
  (cd "$MCP_DIR" && npm install --no-progress --no-audit) || echo "⚠️ MCP dependency installation failed"
fi

# 7. Supabase CLI session (idempotent guard)
ENSURE_SCRIPT="$REPO_ROOT/scripts/ensure-supabase-cli-session.sh"
if [[ -f "$ENSURE_SCRIPT" ]]; then
  echo "🔐 Ensuring Supabase CLI session..."
  # shellcheck disable=SC1091
  source "$ENSURE_SCRIPT" || echo "⚠️ Supabase CLI session guard failed"
else
  echo "⚠️ Supabase session guard script not found"
fi

# 8. Link Supabase project if not already linked
SUPABASE_CONFIG="$REPO_ROOT/supabase/config.toml"
if [[ -d "$REPO_ROOT/supabase" ]]; then
  if [[ -f "$SUPABASE_CONFIG" ]] && grep -q 'project_id = "sriycekxdqnesdsgwiuc"' "$SUPABASE_CONFIG"; then
    echo "✅ Supabase project already linked"
  else
    echo "🔗 Linking Supabase project (sriycekxdqnesdsgwiuc)..."
    (cd "$REPO_ROOT/supabase" && npx --yes supabase@latest link --project-ref sriycekxdqnesdsgwiuc) || echo "⚠️ Supabase link command failed"
  fi
else
  echo "⚠️ Supabase directory missing"
fi

echo ""
echo "✨ Codespace initialization complete"
echo "   Run 'Start Codespace' task to launch MCP servers"
