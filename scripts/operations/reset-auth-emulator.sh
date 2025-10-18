#!/bin/bash
set -euo pipefail

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
REPO_ROOT=$(cd "$SCRIPT_DIR/.." && pwd)
SUPABASE_DIR="$REPO_ROOT/supabase"
PINNED_CLI_VERSION="${SUPABASE_CLI_VERSION:-1.125.3}"
LOG_DIR="$REPO_ROOT/reports"
LOG_FILE="$LOG_DIR/reset-auth-emulator.log"

mkdir -p "$LOG_DIR"

echo "🔄 Resetting Supabase auth emulator" | tee -a "$LOG_FILE"

if command -v npx >/dev/null 2>&1; then
  (
    cd "$SUPABASE_DIR" && npx --yes "supabase@${PINNED_CLI_VERSION}" stop
  ) || true
else
  echo "⚠️ npx not found; skipping supabase stop command" | tee -a "$LOG_FILE"
fi

rm -rf "$HOME/.supabase"

echo "🚀 Starting Supabase local stack" | tee -a "$LOG_FILE"
(
  cd "$SUPABASE_DIR" && npx --yes "supabase@${PINNED_CLI_VERSION}" start >/tmp/prospectpro-reset-start.log 2>&1
)
cat /tmp/prospectpro-reset-start.log >>"$LOG_FILE"

STATUS_JSON=$(cd "$SUPABASE_DIR" && npx --yes "supabase@${PINNED_CLI_VERSION}" status --output json)
API_URL=$(printf '%s' "$STATUS_JSON" | jq -r '.API_URL // "http://127.0.0.1:54321"')
SERVICE_ROLE_KEY=$(printf '%s' "$STATUS_JSON" | jq -r '.SERVICE_ROLE_KEY')

if [[ -z "$SERVICE_ROLE_KEY" || "$SERVICE_ROLE_KEY" == "null" ]]; then
  echo "⚠️ Service role key unavailable; skipping admin ping" | tee -a "$LOG_FILE"
else
  echo "📡 Pinging auth admin endpoint" | tee -a "$LOG_FILE"
  ADMIN_RESPONSE=$(curl -s -D - \
    -H "Content-Type: application/json" \
    -H "apikey: ${SERVICE_ROLE_KEY}" \
    -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
    -d '{"email":"edge-tests@local.test","password":"LocalTest123!","email_confirm":true}' \
    "${API_URL}/auth/v1/admin/users") || true
  {
    printf '\n[%s] Auth emulator response\n' "$(date -Iseconds)"
    printf '%s\n' "$ADMIN_RESPONSE"
  } >>"$LOG_FILE"
fi

echo "✅ Supabase auth emulator reset complete" | tee -a "$LOG_FILE"
