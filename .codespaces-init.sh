#!/bin/bash
# Codespaces initialization script

# 1. Add theme license key for all sessions
THEME_KEY="7F6F4437-EFA6-4CDA-8841-7D55CB40DE71"
THEME_KEY_FILE="$HOME/.theme-license-key"
echo "$THEME_KEY" > "$THEME_KEY_FILE"
chmod 600 "$THEME_KEY_FILE"

# Optionally export for use in VS Code extensions
export THEME_LICENSE_KEY="$THEME_KEY"

# 2. Elevate permissions for Supabase CLI (if needed)
if command -v supabase >/dev/null 2>&1; then
  sudo chmod +x "$(which supabase)" || true
fi

# 3. Disable GPG signing in git config
# This prevents GPG commit blocks in Codespaces
if git config --get commit.gpgsign >/dev/null 2>&1; then
  git config --global commit.gpgsign false || true
fi

# 4. Restore consolidated MCP servers if missing
REPO_ROOT="/workspaces/ProspectPro"
MCP_DIR="${REPO_ROOT}/mcp-servers"
MCP_ARCHIVE="${REPO_ROOT}/archive-ProspectPro-2025-10-17.tar.gz"
if [[ ! -d "${MCP_DIR}" && -f "${MCP_ARCHIVE}" ]]; then
  echo "Restoring MCP servers from archive..."
  tar -xzf "${MCP_ARCHIVE}" -C "${REPO_ROOT}" mcp-servers
fi

# 5. Ensure MCP dependencies are installed
if [[ -d "${MCP_DIR}" && ! -d "${MCP_DIR}/node_modules" ]]; then
  echo "Installing MCP server dependencies..."
  (cd "${MCP_DIR}" && npm install --no-progress --no-audit)
fi

# 6. Ensure Supabase CLI session and link project (minimal bootstrap)
SUPABASE_CONFIG="${REPO_ROOT}/supabase/config.toml"
ENSURE_SCRIPT="${REPO_ROOT}/scripts/ensure-supabase-cli-session.sh"

if [[ -f "$ENSURE_SCRIPT" ]]; then
  echo "Ensuring Supabase CLI session..."
  (
    cd "${REPO_ROOT}" || exit 0
    # shellcheck disable=SC1091
    source "$ENSURE_SCRIPT" || true
  )
fi

if [[ -d "${REPO_ROOT}/supabase" ]]; then
  SHOULD_LINK="true"
  if [[ -f "$SUPABASE_CONFIG" ]] && grep -q 'project_id = "sriycekxdqnesdsgwiuc"' "$SUPABASE_CONFIG"; then
    SHOULD_LINK="false"
  fi

  if [[ "$SHOULD_LINK" == "true" ]]; then
    echo "Linking Supabase project (sriycekxdqnesdsgwiuc)..."
    (
      cd "${REPO_ROOT}/supabase" || exit 0
      npx --yes supabase@latest link --project-ref sriycekxdqnesdsgwiuc || echo "⚠️ Supabase link command failed. Run npm run supabase:link manually."
    )
  fi
fi

echo "Codespaces initialization complete."
