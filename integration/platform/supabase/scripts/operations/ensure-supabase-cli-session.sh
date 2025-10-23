#!/bin/bash
# ProspectPro v4.3 - Supabase CLI Authentication Guard
# Usage: source scripts/ensure-supabase-cli-session.sh
#
# Behavior:
# - Initializes Supabase CLI session once per Codespace and persists readiness.
# - Subsequent invocations SKIP auth using a persistent marker file.
# - Force a re-auth by exporting PROSPECTPRO_SUPABASE_FORCE_REAUTH=1 before running.
#
# Cache marker:
#   ${XDG_CACHE_HOME:-$HOME/.cache}/prospectpro/supabase_session_ready
#
# Environment flags:
#   PROSPECTPRO_SUPABASE_SESSION_READY=1   # (set by this script) indicates session initialized
#   PROSPECTPRO_SUPABASE_FORCE_REAUTH=1    # force re-run of interactive/token auth flow

if [[ -z "${_PP_SUPABASE_CLI_PREV_OPTS_CAPTURED:-}" ]]; then
  _PP_SUPABASE_CLI_PREV_OPTS_CAPTURED=1
  _PP_SUPABASE_CLI_PREV_OPTS=$(set +o)
  _PP_SUPABASE_PREV_SUPPRESS="${PROSPECTPRO_SUPABASE_SUPPRESS_SETUP-}"
  trap '
    eval "$_PP_SUPABASE_CLI_PREV_OPTS"
    if [[ -n "${_PP_SUPABASE_PREV_SUPPRESS+x}" ]]; then
      if [[ -z "$_PP_SUPABASE_PREV_SUPPRESS" ]]; then
        unset PROSPECTPRO_SUPABASE_SUPPRESS_SETUP
      else
        export PROSPECTPRO_SUPABASE_SUPPRESS_SETUP="$_PP_SUPABASE_PREV_SUPPRESS"
      fi
    fi
    trap - RETURN
    unset _PP_SUPABASE_CLI_PREV_OPTS_CAPTURED
    unset _PP_SUPABASE_CLI_PREV_OPTS
    unset _PP_SUPABASE_PREV_SUPPRESS
  ' RETURN
fi

set -euo pipefail

# ---------------------------------------------------------------------------
# Fast path: if the session was already initialized in this Codespace, skip
# all authentication checks. We persist a tiny cache marker so new shells/tasks
# don't re-run the login flow repeatedly. Override with PROSPECTPRO_SUPABASE_FORCE_REAUTH=1.
# ---------------------------------------------------------------------------

# Determine cache directory (XDG first, then ~/.cache)
_PP_XDG_CACHE_DIR="${XDG_CACHE_HOME:-$HOME/.cache}"
_PP_CACHE_DIR="${_PP_XDG_CACHE_DIR%/}/prospectpro"
_PP_CACHE_MARKER="${_PP_CACHE_DIR}/supabase_session_ready"
_PP_AUTH_MARKER="${_PP_CACHE_DIR}/supabase_auth_session_ready"

if [[ -n "${PROSPECTPRO_SUPABASE_FORCE_REAUTH:-}" ]]; then
  rm -f "${_PP_CACHE_MARKER}" "${_PP_AUTH_MARKER}" || true
fi

# If caller already exported readiness and no reauth forced, short-circuit.
if [[ "${PROSPECTPRO_SUPABASE_SESSION_READY:-}" = "1" && -z "${PROSPECTPRO_SUPABASE_FORCE_REAUTH:-}" ]]; then
  if [[ -f "${_PP_AUTH_MARKER}" ]]; then
    export PROSPECTPRO_SUPABASE_AUTH_READY=1
  fi
  echo "✅ Supabase CLI session already initialized (env cached). Skipping auth."
  return 0 2>/dev/null || exit 0
fi

# If a persistent marker exists and no reauth forced, short-circuit.
if [[ -z "${PROSPECTPRO_SUPABASE_FORCE_REAUTH:-}" && -f "${_PP_CACHE_MARKER}" ]]; then
  if [[ -f "${_PP_AUTH_MARKER}" ]]; then
    export PROSPECTPRO_SUPABASE_AUTH_READY=1
  fi
  echo "✅ Supabase CLI session already initialized (marker: ${_PP_CACHE_MARKER}). Skipping auth."
  export PROSPECTPRO_SUPABASE_SESSION_READY=1
  return 0 2>/dev/null || exit 0
fi

EXPECTED_REPO_ROOT=${EXPECTED_REPO_ROOT:-/workspaces/ProspectPro}

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
# shellcheck source=/workspaces/ProspectPro/integration/platform/supabase/scripts/operations/supabase_cli_helpers.sh
source "$SCRIPT_DIR/supabase_cli_helpers.sh"

export PROSPECTPRO_SUPABASE_SUPPRESS_SETUP=1

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
  if project_list_output=$(prospectpro_supabase_cli projects list --output json 2>&1); then
    echo "✅ Supabase CLI session authenticated."
    # Create/update cache marker so future tasks short-circuit
    mkdir -p "${_PP_CACHE_DIR}" || true
    printf 'ready=1\nproject=%s\ntimestamp=%s\n' "sriycekxdqnesdsgwiuc" "$(date -Iseconds)" > "${_PP_CACHE_MARKER}" || true
    export PROSPECTPRO_SUPABASE_SESSION_READY=1
    ensure_supabase_cli_auth_login
    return 0
  fi

  echo "⚠️ Supabase CLI session not authenticated."
  echo "👇 Triggering login flow. Share the device code + URL below with Alex so the session can be approved in the browser."
  echo "---- Supabase CLI Login Prompt ----"
  prospectpro_supabase_cli login --no-browser
  echo "-----------------------------------"

  if prospectpro_supabase_cli projects list --output json >/dev/null 2>&1; then
    echo "✅ Supabase CLI session authenticated after login."
    # Create/update cache marker so future tasks short-circuit
    mkdir -p "${_PP_CACHE_DIR}" || true
    printf 'ready=1\nproject=%s\ntimestamp=%s\n' "sriycekxdqnesdsgwiuc" "$(date -Iseconds)" > "${_PP_CACHE_MARKER}" || true
    export PROSPECTPRO_SUPABASE_SESSION_READY=1
    ensure_supabase_cli_auth_login
    return 0
  fi

  echo "❌ Supabase CLI login still not authorized. Verify Alex approved the device code, then rerun this script." >&2
  return 1
}

ensure_supabase_cli_auth_login() {
  if [[ "${PROSPECTPRO_SUPABASE_SKIP_AUTH_LOGIN:-}" = "1" ]]; then
    return 0
  fi

  if [[ -z "${PROSPECTPRO_SUPABASE_FORCE_REAUTH:-}" ]]; then
    if [[ "${PROSPECTPRO_SUPABASE_AUTH_READY:-}" = "1" && -f "${_PP_AUTH_MARKER}" ]]; then
      return 0
    fi
  fi

  if [[ -z "${PROSPECTPRO_SUPABASE_FORCE_REAUTH:-}" && -f "${_PP_AUTH_MARKER}" ]]; then
    export PROSPECTPRO_SUPABASE_AUTH_READY=1
    return 0
  fi

  local supabase_dir="${EXPECTED_REPO_ROOT}/supabase"
  if [[ ! -d "$supabase_dir" ]]; then
    echo "ℹ️ Supabase directory not found at $supabase_dir; skipping auth bypass login."
    return 0
  fi

  echo "🔐 Ensuring Supabase Auth session via CLI (front-end bypass)..."
  local login_output=""
  local login_status=0

  set +e
  if command -v timeout >/dev/null 2>&1; then
    login_output=$(cd "$supabase_dir" && printf '\n' | timeout 120s npx --yes supabase@latest auth login 2>&1)
  else
    login_output=$(cd "$supabase_dir" && printf '\n' | npx --yes supabase@latest auth login 2>&1)
  fi
  login_status=$?
  set -e

  if [[ $login_status -eq 0 ]]; then
    echo "✅ Supabase CLI auth login completed."
    mkdir -p "${_PP_CACHE_DIR}" || true
    printf 'ready=1\ntimestamp=%s\n' "$(date -Iseconds)" > "${_PP_AUTH_MARKER}" || true
    export PROSPECTPRO_SUPABASE_AUTH_READY=1
  else
    if [[ $login_status -eq 124 ]]; then
      echo "⚠️ Supabase CLI auth login timed out (120s). Run manually: cd ${supabase_dir} && npx --yes supabase@latest auth login" >&2
    elif grep -qi "unknown command" <<<"$login_output"; then
      echo "ℹ️ Supabase CLI 'auth login' not supported in current build; skipping bypass step." >&2
    else
      echo "⚠️ Supabase CLI auth login failed (exit ${login_status}). Run manually: cd ${supabase_dir} && npx --yes supabase@latest auth login" >&2
      if [[ -n "$login_output" ]]; then
        printf '%s\n' "$login_output" >&2
      fi
    fi
    rm -f "${_PP_AUTH_MARKER}" || true
  fi

  return 0
}

require_repo_root || return 1

if ! command -v npx >/dev/null 2>&1; then
  echo "❌ npx not available on PATH. Install Node.js tooling before proceeding." >&2
  return 1
fi

token_authenticated="false"

if [[ -n "${SUPABASE_ACCESS_TOKEN:-}" ]]; then
  if prospectpro_supabase_cli projects list --output json >/dev/null 2>&1; then
    echo "✅ Supabase CLI session authenticated via SUPABASE_ACCESS_TOKEN."
    token_authenticated="true"
    ensure_supabase_cli_auth_login
  else
    echo "⚠️ SUPABASE_ACCESS_TOKEN present but authentication failed. Falling back to interactive login."
  fi
fi

if [[ "$token_authenticated" != "true" ]]; then
  check_supabase_login
fi

PROSPECTPRO_SUPABASE_SESSION_READY=1
unset PROSPECTPRO_SUPABASE_SUPPRESS_SETUP

# On success, also persist the cache marker if not already written.
mkdir -p "${_PP_CACHE_DIR}" || true
printf 'ready=1\nproject=%s\ntimestamp=%s\n' "sriycekxdqnesdsgwiuc" "$(date -Iseconds)" > "${_PP_CACHE_MARKER}" || true
