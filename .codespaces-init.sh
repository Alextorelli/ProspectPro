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
  sudo chmod +x $(which supabase)
fi

# 3. Disable GPG signing in git config
# This prevents GPG commit blocks in Codespaces
if git config --get commit.gpgsign; then
  git config --global commit.gpgsign false
fi

echo "Codespaces initialization complete."
