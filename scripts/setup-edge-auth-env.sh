#!/bin/bash
# ProspectPro v4.3 Edge Auth Environment Bootstrapper
# Usage: source scripts/setup-edge-auth-env.sh

# Preserve caller shell options so sourcing this script does not mutate the
# interactive environment (RETURN fires both for functions and sourced files).
if [[ -z "${_PP_EDGE_ENV_PREV_OPTS_CAPTURED:-}" ]]; then
  _PP_EDGE_ENV_PREV_OPTS_CAPTURED=$(set +o)
  _PP_EDGE_ENV_PREV_RETURN_TRAP=$(trap -p RETURN || true)
  _PP_EDGE_ENV_PREV_EXIT_TRAP=$(trap -p EXIT || true)
  _pp_edge_env_restore_shell_opts() {
    eval "$_PP_EDGE_ENV_PREV_OPTS_CAPTURED"
    if [[ -n "${_PP_EDGE_ENV_PREV_RETURN_TRAP:-}" ]]; then
      eval "$_PP_EDGE_ENV_PREV_RETURN_TRAP"
    else
      trap - RETURN
    fi
    if [[ -n "${_PP_EDGE_ENV_PREV_EXIT_TRAP:-}" ]]; then
      eval "$_PP_EDGE_ENV_PREV_EXIT_TRAP"
    else
      trap - EXIT
    fi
    unset _PP_EDGE_ENV_PREV_OPTS_CAPTURED
    unset _PP_EDGE_ENV_PREV_RETURN_TRAP
    unset _PP_EDGE_ENV_PREV_EXIT_TRAP
    unset -f _pp_edge_env_restore_shell_opts
  }
  trap _pp_edge_env_restore_shell_opts RETURN
  trap _pp_edge_env_restore_shell_opts EXIT
fi

set -euo pipefail

EXPECTED_REPO_ROOT=${EXPECTED_REPO_ROOT:-/workspaces/ProspectPro}

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
# shellcheck source=/workspaces/ProspectPro/scripts/lib/supabase_cli_helpers.sh
source "$SCRIPT_DIR/lib/supabase_cli_helpers.sh"

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

resolve_project_api_keys_json() {
  local project_ref cache_file
  project_ref="$1"
  cache_file="$HOME/.cache/prospectpro/api_keys_${project_ref}.json"
  
  # Try cached file first (24h TTL)
  if [[ -f "$cache_file" ]]; then
    local cache_age
    cache_age=$(($(date +%s) - $(stat -c %Y "$cache_file" 2>/dev/null || echo 0)))
    if [[ $cache_age -lt 86400 ]]; then
      PP_EDGE_AUTH_API_KEYS_JSON=$(<"$cache_file")
      printf '%s' "$PP_EDGE_AUTH_API_KEYS_JSON"
      return 0
    fi
  fi
  
  # Fetch fresh keys and cache result
  if [[ -z "${PP_EDGE_AUTH_API_KEYS_JSON:-}" ]]; then
    export PROSPECTPRO_SUPABASE_SUPPRESS_SETUP=1
    if ! PP_EDGE_AUTH_API_KEYS_JSON=$(cd "$EXPECTED_REPO_ROOT/supabase" && npx --yes supabase@latest projects api-keys \
      --project-ref "$project_ref" \
      --output json 2>/dev/null); then
      echo "❌ Failed to call supabase projects api-keys" >&2
      return 1
    fi
    unset PROSPECTPRO_SUPABASE_SUPPRESS_SETUP
    
    # Cache for next time
    mkdir -p "$(dirname "$cache_file")"
    printf '%s' "$PP_EDGE_AUTH_API_KEYS_JSON" > "$cache_file"
  fi

  printf '%s' "$PP_EDGE_AUTH_API_KEYS_JSON"
}

resolve_project_api_key() {
  local project_ref key_types api_keys_json resolved_key
  project_ref="$1"
  key_types="$2"

  api_keys_json=$(resolve_project_api_keys_json "$project_ref") || return 1

  resolved_key=$(PP_API_KEYS_JSON="$api_keys_json" KEY_TYPES="$key_types" python3 <<'PY'
import json
import os

raw = os.environ.get("PP_API_KEYS_JSON", "[]")
key_types_raw = os.environ.get("KEY_TYPES", "")
try:
    data = json.loads(raw)
except json.JSONDecodeError:
    raise SystemExit(0)
key_types = [item.strip() for item in key_types_raw.split(",") if item.strip()]

def iter_candidates():
  for entry in data:
    yield entry

def match(entry, candidates):
  entry_type = entry.get("type")
  entry_name = entry.get("name")
  entry_id = entry.get("id")
  for candidate in candidates:
    if candidate == "legacy":
      if entry_type == "legacy" and entry_name == "service_role":
        return True
      continue
    if entry_type == candidate:
      return True
    if entry_name == candidate:
      return True
    if entry_id == candidate:
      return True
  return False

for entry in iter_candidates():
  if key_types and not match(entry, key_types):
    continue
  key = entry.get("api_key")
  if key:
    print(key)
    break
PY
)

  if [ -z "$resolved_key" ]; then
  echo "❌ Unable to retrieve key via supabase projects api-keys (searched: $key_types)" >&2
    return 1
  fi

  echo "$resolved_key"
}

resolve_session_user() {
  python3 <<'PY'
import base64
import json
import os

session = os.environ.get("SUPABASE_SESSION_JWT", "")
if not session:
    raise SystemExit(0)
try:
    payload = session.split(".")[1]
    padding = "=" * (-len(payload) % 4)
    decoded = base64.urlsafe_b64decode(payload + padding)
    data = json.loads(decoded)
    user_id = data.get("sub", "")
    if user_id:
        print(user_id)
except Exception:
    pass
PY
}

require_repo_root || return 1

# Skip CLI session check when only fetching keys—rely on cached credentials
# or manual `npm run supabase:auth` if needed
if [[ "${PP_SKIP_SESSION_CHECK:-0}" != "1" ]]; then
  # shellcheck source=/workspaces/ProspectPro/scripts/ensure-supabase-cli-session.sh
  source "$EXPECTED_REPO_ROOT"/scripts/ensure-supabase-cli-session.sh || return 1
fi

export SUPABASE_URL="${SUPABASE_URL:-https://sriycekxdqnesdsgwiuc.supabase.co}"
export SUPABASE_PROJECT_REF="${SUPABASE_PROJECT_REF:-sriycekxdqnesdsgwiuc}"

PUBLISHABLE_KEY=$(resolve_project_api_key "$SUPABASE_PROJECT_REF" "publishable") || return 1
export SUPABASE_PUBLISHABLE_KEY="$PUBLISHABLE_KEY"

# Align local automation with production headers; tests expect the anon key env
# to be populated, so default it to the publishable key when unset.
if [[ -z "${SUPABASE_ANON_KEY:-}" ]]; then
  export SUPABASE_ANON_KEY="$SUPABASE_PUBLISHABLE_KEY"
fi

SERVICE_ROLE_KEY=$(resolve_project_api_key "$SUPABASE_PROJECT_REF" "secret,service_role,legacy") || return 1
if [[ -z "${SUPABASE_SERVICE_ROLE_KEY:-}" ]]; then
  export SUPABASE_SERVICE_ROLE_KEY="$SERVICE_ROLE_KEY"
fi

echo "🔐 Publishable key loaded: ${SUPABASE_PUBLISHABLE_KEY:0:24}…"

if ! command -v jq >/dev/null 2>&1; then
  echo "⚠️  jq not installed; install with 'sudo apt-get update && sudo apt-get install jq' for JSON payload helpers."
fi

if ! command -v npx >/dev/null 2>&1; then
  echo "⚠️  npm/npx not found; ensure Node.js tooling is available."
fi

SESSION_USER_ID=$(resolve_session_user)
if [ -n "$SESSION_USER_ID" ]; then
  export SESSION_USER_ID
  echo "🔑 SESSION_USER_ID resolved: $SESSION_USER_ID"
else
  unset SESSION_USER_ID 2>/dev/null || true
  echo "(SESSION_USER_ID not set; commands will omit sessionUserId)"
fi

echo "📋 Edge Functions deployed:"
if command -v jq >/dev/null 2>&1; then
  prospectpro_supabase_cli functions list \
    --output json | jq '.[] | {slug: .slug, status: .status}'
else
  prospectpro_supabase_cli functions list \
    --output json | python3 <<'PY'
import json
import sys

try:
    data = json.load(sys.stdin)
except json.JSONDecodeError:
    data = []
for entry in data:
    slug = entry.get("slug", "<unknown>")
    status = entry.get("status", "unknown")
    print(f"- {slug}: {status}")
PY
fi

cat <<'EON'

✅ Environment variables prepared. Verify the following exports in your shell:
  echo $SUPABASE_URL
  echo $SUPABASE_PROJECT_REF
  echo ${SUPABASE_PUBLISHABLE_KEY:0:24}…
  echo $SESSION_USER_ID

Next steps:
  1. Run the curl suite in docs/edge-auth-testing.md to validate authentication and payload schemas.
  2. Capture HTTP status + response bodies for triage before deployment.
EON
