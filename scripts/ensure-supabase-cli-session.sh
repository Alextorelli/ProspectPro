#!/bin/bash
# ProspectPro v4.3 - Supabase CLI Authentication Guard
# Usage: source scripts/ensure-supabase-cli-session.sh

set -euo pipefail

EXPECTED_REPO_ROOT=${EXPECTED_REPO_ROOT:-/workspaces/ProspectPro}

require_repo_root() {
  local repo_root
  if ! repo_root=$(git rev-parse --show-toplevel 2>/dev/null); then
    echo "❌ Run this script from inside the ProspectPro repo"
    return 1
  fi

  if [ "$repo_root" != "$EXPECTED_REPO_ROOT" ]; then
    echo "❌ Wrong directory. Expected repo root: $EXPECTED_REPO_ROOT"
    echo "   Current directory: $repo_root"
    return 1
  fi
}

check_supabase_login() {
  local project_list_output
  if project_list_output=$(npx --yes supabase@latest projects list --output json 2>&1); then
    echo "✅ Supabase CLI session authenticated."
    return 0
  fi

  echo "⚠️ Supabase CLI session not authenticated."
  echo "👇 Triggering login flow. Share the device code + URL below with Alex so the session can be approved in the browser."
  echo "---- Supabase CLI Login Prompt ----"
  npx --yes supabase@latest login
  echo "-----------------------------------"

  if npx --yes supabase@latest projects list --output json >/dev/null 2>&1; then
    echo "✅ Supabase CLI session authenticated after login."
    return 0
  fi

  echo "❌ Supabase CLI login still not authorized. Verify Alex approved the device code, then rerun this script." >&2
  return 1
}

require_repo_root || return 1

if ! command -v npx >/dev/null 2>&1; then
  echo "❌ npx not available on PATH. Install Node.js tooling before proceeding." >&2
  return 1
fi

check_supabase_login
