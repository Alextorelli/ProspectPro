#!/usr/bin/env bash
set -euo pipefail

PP_TEST_ENV_DIAGNOSE=0
if [[ "${1:-}" == "--diagnose" ]]; then
  PP_TEST_ENV_DIAGNOSE=1
  shift || true
fi

SCRIPT_ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
REPO_ROOT=$(cd "$SCRIPT_ROOT/../.." && pwd)
REPORTS_DIR="$REPO_ROOT/reports"
DIAG_LOG="$REPORTS_DIR/edge-auth-diagnose.log"
PINNED_CLI_VERSION="${SUPABASE_CLI_VERSION:-2.51.0}"

supabase_cli_exec() {
  local cli_pkg="supabase@${PINNED_CLI_VERSION}"
  (
    cd "$REPO_ROOT/supabase" || exit 1
    if ! npx --yes "$cli_pkg" "$@"; then
      if [[ "$PINNED_CLI_VERSION" != "latest" ]]; then
        echo "⚠️ Supabase CLI ${PINNED_CLI_VERSION} unavailable, retrying with latest..." >&2
        npx --yes supabase@latest "$@"
      else
        exit 1
      fi
    fi
  )
}

if (( PP_TEST_ENV_DIAGNOSE )); then
  mkdir -p "$REPORTS_DIR"
  {
    printf '[%s] test-env.local.sh diagnostics start\n' "$(date -Iseconds)"
    printf 'Pinned CLI version: %s\n' "$PINNED_CLI_VERSION"
    printf 'Resolved pinned CLI version: %s\n' "$(supabase_cli_exec --version 2>&1 | head -n1 || echo "unavailable")"
    printf 'Default npx supabase version: %s\n' "$(npx --yes supabase --version 2>&1 | head -n1 || echo "unavailable")"
  } >>"$DIAG_LOG"
fi

# Always test against local Supabase to avoid DNS/pooler freezes
LOCAL_SUPABASE_URL="http://127.0.0.1:54321"
export SUPABASE_URL="$LOCAL_SUPABASE_URL"
export SUPABASE_FUNCTION_BASE_URL="${SUPABASE_URL}/functions/v1"

# Ensure local stack is running; if not, start it
if ! curl -sf "${SUPABASE_URL}/rest/v1/" >/dev/null 2>&1; then
  echo "Starting local Supabase stack..."
  supabase_cli_exec start
fi

# Pull local anon/service keys from local status
if ! command -v jq >/dev/null 2>&1; then
  echo "ERROR: jq is required for local test env setup."
  exit 1
fi

STATUS_JSON="$(supabase_cli_exec status --output json)"

export SUPABASE_ANON_KEY="$(echo "$STATUS_JSON" | jq -r '.ANON_KEY')"
export SUPABASE_PUBLISHABLE_KEY="$(echo "$STATUS_JSON" | jq -r '.PUBLISHABLE_KEY')"
export SUPABASE_SERVICE_ROLE_KEY="$(echo "$STATUS_JSON" | jq -r '.SERVICE_ROLE_KEY')"

# Overwrite URLs with authoritative local values from status output when available
STATUS_API_URL="$(echo "$STATUS_JSON" | jq -r '.API_URL')"
if [ -n "${STATUS_API_URL:-}" ] && [ "$STATUS_API_URL" != "null" ]; then
  export SUPABASE_URL="$STATUS_API_URL"
  export SUPABASE_FUNCTION_BASE_URL="${SUPABASE_URL}/functions/v1"
fi

# Helper to confirm a session token works against the local stack
validate_session_jwt() {
  [ -z "${SUPABASE_SESSION_JWT:-}" ] && return 1
  curl -sf \
    -H "Authorization: Bearer ${SUPABASE_SESSION_JWT}" \
    -H "apikey: ${SUPABASE_ANON_KEY}" \
    "${SUPABASE_URL}/auth/v1/user" >/dev/null 2>&1
}

# Load cached token if caller did not provide one
if [ -z "${SUPABASE_SESSION_JWT:-}" ] && [ -f /tmp/supabase_session_jwt ]; then
  export SUPABASE_SESSION_JWT="$(cat /tmp/supabase_session_jwt)"
fi
# If caller provided a token, ensure it is valid; otherwise fall back to local generation
if ! validate_session_jwt; then
  [ -n "${SUPABASE_SESSION_JWT:-}" ] && echo "Provided SUPABASE_SESSION_JWT is invalid for local stack; generating a fresh session." >&2
  unset SUPABASE_SESSION_JWT

  TEST_EMAIL="${SUPABASE_TEST_EMAIL:-edge-tests@local.test}"
  TEST_PASSWORD="${SUPABASE_TEST_PASSWORD:-LocalTest123!}"

  echo "Generating local Supabase session for ${TEST_EMAIL}..."

  create_payload=$(jq -cn --arg email "$TEST_EMAIL" --arg password "$TEST_PASSWORD" '{email: $email, password: $password, email_confirm: true, user_metadata: {edge_test: true}}')

  # Ensure the test user exists (409 conflict means it is already present)
  create_response="$(curl -s -D - \
    -H "Content-Type: application/json" \
    -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
    -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
    -d "$create_payload" \
    "${SUPABASE_URL}/auth/v1/admin/users")"

  create_status="$(printf '%s\n' "$create_response" | head -n 1 | cut -d' ' -f2)"
  create_body="$(printf '%s\n' "$create_response" | sed '1,/^\r$/d')"

  if (( PP_TEST_ENV_DIAGNOSE )); then
    {
      printf '[%s] admin/users response\n' "$(date -Iseconds)"
      printf 'HTTP status: %s\n' "$create_status"
      printf 'Response body: %s\n' "$create_body"
      printf 'Fallback guidance: Run VS Code task "Supabase: Reset Auth Emulator" if issues persist.\n'
    } >>"$DIAG_LOG"
  fi

  if [ "$create_status" != "200" ] && [ "$create_status" != "201" ] && [ "$create_status" != "409" ] && [ "$create_status" != "422" ]; then
    if printf '%s' "$create_body" | jq -e . >/dev/null 2>&1; then
      echo "ERROR: Failed to ensure local test user (HTTP ${create_status}): $create_body" >&2
      exit 1
    else
      echo "WARN: admin/users returned non-JSON body; skipping ensure-user (likely CLI regression)." >&2
    fi
  fi

  token_response=$(curl -s \
    -H "Content-Type: application/json" \
    -H "apikey: ${SUPABASE_ANON_KEY}" \
    -d "$(jq -cn --arg email "$TEST_EMAIL" --arg password "$TEST_PASSWORD" '{email: $email, password: $password}')" \
    "${SUPABASE_URL}/auth/v1/token?grant_type=password")

  SUPABASE_SESSION_JWT=$(echo "$token_response" | jq -r '.access_token // empty')

  if [ -z "${SUPABASE_SESSION_JWT}" ]; then
    echo "ERROR: Unable to obtain local session JWT. Raw response: $token_response" >&2
    exit 1
  fi

  export SUPABASE_SESSION_JWT
  printf '%s' "$SUPABASE_SESSION_JWT" > /tmp/supabase_session_jwt
else
  if (( PP_TEST_ENV_DIAGNOSE )); then
    {
      printf '[%s] Existing session token validated successfully\n' "$(date -Iseconds)"
    } >>"$DIAG_LOG"
  fi
fi

echo "Local test env ready:"
echo "  SUPABASE_URL=$SUPABASE_URL"
echo "  FUNCTIONS   =$SUPABASE_FUNCTION_BASE_URL"
echo "  Anon key    =${SUPABASE_ANON_KEY:0:12}..."
echo "  JWT prefix  =${SUPABASE_SESSION_JWT:0:16}..."
if (( PP_TEST_ENV_DIAGNOSE )); then
  {
    printf '[%s] Diagnostics complete. Session ready.\n\n' "$(date -Iseconds)"
  } >>"$DIAG_LOG"
fi
