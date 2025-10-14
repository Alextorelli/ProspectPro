#!/bin/bash
# ProspectPro v4.3 Edge Auth Environment Bootstrapper
# Usage: source scripts/setup-edge-auth-env.sh

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

resolve_publishable_key() {
  local project_ref publishable_key
  project_ref="$1"
  publishable_key=$(prospectpro_supabase_cli projects api-keys \
    --project-ref "$project_ref" \
    --output json \
    | jq -r '.[] | select(.type == "publishable") | .api_key')

  if [ -z "$publishable_key" ] || [ "$publishable_key" = "null" ]; then
    echo "❌ Unable to retrieve publishable key via supabase projects api-keys" >&2
    return 1
  fi

  echo "$publishable_key"
}

resolve_session_user() {
  python <<'PY'
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

# shellcheck source=/workspaces/ProspectPro/scripts/ensure-supabase-cli-session.sh
source "$EXPECTED_REPO_ROOT"/scripts/ensure-supabase-cli-session.sh || return 1

export SUPABASE_URL="${SUPABASE_URL:-https://sriycekxdqnesdsgwiuc.supabase.co}"
export SUPABASE_PROJECT_REF="${SUPABASE_PROJECT_REF:-sriycekxdqnesdsgwiuc}"

PUBLISHABLE_KEY=$(resolve_publishable_key "$SUPABASE_PROJECT_REF") || return 1
export SUPABASE_PUBLISHABLE_KEY="$PUBLISHABLE_KEY"

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
prospectpro_supabase_cli functions list \
  --output json | jq '.[] | {slug: .slug, status: .status}'

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
