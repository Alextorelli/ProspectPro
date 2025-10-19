#!/bin/bash
# ProspectPro Edge Function Diagnostics
# Usage: ./scripts/edge-function-diagnostics.sh [SESSION_JWT | LOG_FILE_PATH]

set -euo pipefail

EXPECTED_REPO_ROOT=${EXPECTED_REPO_ROOT:-/workspaces/ProspectPro}

require_repo_root() {
  local repo_root
  if ! repo_root=$(git rev-parse --show-toplevel 2>/dev/null); then
    echo "❌ Run this script from inside the ProspectPro repository" >&2
    exit 1
  fi

  if [ "$repo_root" != "$EXPECTED_REPO_ROOT" ]; then
    echo "❌ Repository root mismatch" >&2
    echo "   Expected: $EXPECTED_REPO_ROOT" >&2
    echo "   Detected: $repo_root" >&2
    echo "   Set EXPECTED_REPO_ROOT to override when needed" >&2
    exit 1
  fi

  if [ "$(pwd -P)" != "$repo_root" ]; then
    echo "❌ Run this script from repo root: $repo_root" >&2
    exit 1
  fi
}

require_repo_root

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
# shellcheck source=/workspaces/ProspectPro/scripts/lib/supabase_cli_helpers.sh
source "$SCRIPT_DIR/lib/supabase_cli_helpers.sh"

# Check if first argument is a log file path
if [ $# -gt 0 ] && [ -f "$1" ]; then
  LOG_FILE="$1"
  analyze_log_file "$LOG_FILE"
  exit 0
fi

analyze_log_file() {
  local log_file="$1"
  local timestamp
  timestamp=$(date --iso-8601=seconds)
  local report_dir="reports/diagnostics"
  local report_file="$report_dir/supabase-log-analysis-$timestamp.md"

  mkdir -p "$report_dir"

  if [ ! -f "$log_file" ]; then
    echo "❌ Log file not found: $log_file" >&2
    exit 1
  fi

  # Parse log file for errors and warnings
  local error_count
  local warning_count
  local critical_count

  error_count=$(grep -c -i "error\|exception\|failed" "$log_file" || echo "0")
  warning_count=$(grep -c -i "warn\|warning" "$log_file" || echo "0")
  critical_count=$(grep -c -i "critical\|fatal\|500\|401\|403" "$log_file" || echo "0")

  local total_lines
  total_lines=$(wc -l < "$log_file")

  # Generate markdown report
  cat > "$report_file" << EOF
# Supabase Log Analysis Report

**Generated:** $timestamp
**Log File:** $log_file
**Total Lines:** $total_lines

## Summary

- **Errors Found:** $error_count
- **Warnings Found:** $warning_count
- **Critical Issues:** $critical_count

## Error Details

EOF

  if [ "$error_count" -gt 0 ]; then
    echo "### Errors" >> "$report_file"
    grep -n -i "error\|exception\|failed" "$log_file" | head -20 >> "$report_file"
    echo "" >> "$report_file"
  fi

  if [ "$warning_count" -gt 0 ]; then
    echo "### Warnings" >> "$report_file"
    grep -n -i "warn\|warning" "$log_file" | head -20 >> "$report_file"
    echo "" >> "$report_file"
  fi

  if [ "$critical_count" -gt 0 ]; then
    echo "### Critical Issues" >> "$report_file"
    grep -n -i "critical\|fatal\|500\|401\|403" "$log_file" | head -20 >> "$report_file"
    echo "" >> "$report_file"
  fi

  echo "## Next Steps" >> "$report_file"
  echo "" >> "$report_file"

  if [ "$critical_count" -gt 0 ]; then
    cat >> "$report_file" << EOF
1. **Review critical errors above** - these may indicate authentication or deployment issues
2. Check Supabase dashboard → Edge Functions → Logs for more context
3. Verify API keys and environment variables
4. Test affected functions manually via curl
EOF
  elif [ "$error_count" -gt 0 ]; then
    cat >> "$report_file" << EOF
1. **Review errors above** - these may indicate function runtime issues
2. Check function-specific logs in Supabase dashboard
3. Verify database connectivity and permissions
4. Run function tests locally if possible
EOF
  else
    cat >> "$report_file" << EOF
✅ **No critical errors detected** - system appears healthy
EOF
  fi

  echo "📊 Log analysis complete. Report saved to: $report_file"
  echo "Summary: $error_count errors, $warning_count warnings, $critical_count critical issues"
}

SUPABASE_SERVE_PID=""

cleanup_serve() {
  if [[ -n "$SUPABASE_SERVE_PID" ]] && kill -0 "$SUPABASE_SERVE_PID" >/dev/null 2>&1; then
    kill "$SUPABASE_SERVE_PID" >/dev/null 2>&1 || true
    wait "$SUPABASE_SERVE_PID" 2>/dev/null || true
  fi
}

trap cleanup_serve EXIT

# Auto-load publishable key when available
if [ -z "${VITE_SUPABASE_ANON_KEY:-}" ] && [ -f ".env.vercel" ]; then
  set -a && source .env.vercel >/dev/null 2>&1 && set +a || set +a
fi

PUBLISHABLE_KEY=${SUPABASE_PUBLISHABLE_KEY:-${NEXT_PUBLIC_SUPABASE_ANON_KEY:-${VITE_SUPABASE_ANON_KEY:-${SUPABASE_ANON_KEY:-}}}}
if [ -z "$PUBLISHABLE_KEY" ]; then
  echo "❌ Unable to locate Supabase publishable key" >&2
  echo "   Export VITE_SUPABASE_ANON_KEY or run 'vercel env pull .env.vercel'" >&2
  exit 1
fi

SESSION_JWT=${1:-}
PROJECT_REF=${SUPABASE_PROJECT_REF:-sriycekxdqnesdsgwiuc}
EDGE_BASE="https://${PROJECT_REF}.supabase.co/functions/v1"
TIMESTAMP=$(date --iso-8601=seconds)

CURL_COMMON=(-sS --compressed -w '\n%{http_code}')
if [ "${CURL_VERBOSE:-}" = "1" ]; then
  CURL_COMMON=(-sS --compressed -w '\n%{http_code}' -v)
fi

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

print_header() {
  local label=$1
  echo ""
  echo -e "${BLUE}${label}${NC}"
  printf '%*s\n' ${#label} '' | tr ' ' '='
}

invoke_function() {
  local slug=$1
  local method=${2:-GET}
  local payload=${3:-}
  local extra_headers=()

  if [ -n "$payload" ]; then
    extra_headers+=("-H" "Content-Type: application/json" "-d" "$payload")
  fi

  local response
  response=$(curl "${CURL_COMMON[@]}" -X "$method" "$EDGE_BASE/$slug" \
    -H "Authorization: Bearer $PUBLISHABLE_KEY" \
    -H "apikey: $PUBLISHABLE_KEY" \
    "${extra_headers[@]}")

  local http_code
  http_code=$(echo "$response" | tail -n1)
  local body
  body=$(echo "$response" | sed '$d')

  echo "$http_code" "$body"
}

inspect_response() {
  local slug=$1
  local http_code=$2
  local body=$3

  if [ "$http_code" = "200" ] || [ "$http_code" = "202" ]; then
    echo -e "   ${GREEN}✅ $slug responded with HTTP $http_code${NC}"
  elif [ "$http_code" = "405" ]; then
    echo -e "   ${GREEN}✅ $slug deployed (HTTP 405: method not allowed for GET)${NC}"
  elif [ "$http_code" = "401" ] || [ "$http_code" = "403" ]; then
    echo -e "   ${YELLOW}⚠️  $slug requires authentication (HTTP $http_code)${NC}"
  else
    echo -e "   ${RED}❌ $slug returned HTTP $http_code${NC}"
    echo "      Response: ${body:-<empty>}"
  fi
}

ensure_local_supabase() {
  if curl -s "http://localhost:54321" >/dev/null 2>&1; then
    return 0
  fi

  echo "Starting local Supabase Edge Function server (debug mode)..."
  supabase_setup || return 1
  (
    cd "$SUPABASE_DIR" || exit 1
    npx --yes supabase@latest functions serve --no-verify-jwt --debug >/tmp/prospectpro-functions-serve.log 2>&1
  ) &
  SUPABASE_SERVE_PID=$!
  sleep 5

  if ! curl -s "http://localhost:54321" >/dev/null 2>&1; then
    echo "❌ Unable to start local Supabase functions server; see /tmp/prospectpro-functions-serve.log" >&2
    return 1
  fi
  echo "✅ Local Supabase functions server ready"
}

run_function_tests() {
  print_header "Local Function Tests"
  if ! command -v deno >/dev/null 2>&1; then
    echo "❌ Deno CLI not available; install before running local function tests." >&2
    return 1
  fi

  ensure_local_supabase || return 1

  local env_flag=()
  if [[ -f "$PROSPECTPRO_REPO_ROOT/.env.local" ]]; then
    env_flag=(--env-file ../.env.local)
  fi

  (
    cd "$SUPABASE_DIR" || exit 1
    if ! deno test --allow-all functions/tests/ "${env_flag[@]}"; then
      echo "❌ Edge Function tests failed" >&2
      return 1
    fi
  )
  echo "✅ Edge Function tests completed"
}

print_header "ProspectPro Edge Function Diagnostics"
echo "Timestamp: $TIMESTAMP"
echo "Project Ref: $PROJECT_REF"
echo "Publishable Key: ${PUBLISHABLE_KEY:0:16}****************"
if [ -n "$SESSION_JWT" ]; then
  echo "Session JWT: Provided (${#SESSION_JWT} chars)"
else
  echo "Session JWT: Not provided (skipping authenticated tests)"
fi

print_header "Baseline Deployment Checks"
FUNCTIONS=(
  "test-new-auth"
  "test-official-auth"
  "business-discovery-background"
  "business-discovery-optimized"
  "campaign-export-user-aware"
  "enrichment-orchestrator"
)

for fn in "${FUNCTIONS[@]}"; do
  read -r code body < <(invoke_function "$fn")
  inspect_response "$fn" "$code" "$body"
  if [ "$code" = "500" ]; then
    echo "      ❗ Capture logs via Supabase dashboard → Edge Functions → $fn → Logs."
  fi
  if [ "$code" = "200" ] && echo "$body" | grep -q '"error"'; then
    echo "      ⚠️  Function responded with error payload:" "$body"
  fi
done

if ! run_function_tests; then
  echo "⚠️  Local function tests encountered issues; review output above." >&2
fi

if [ -z "$SESSION_JWT" ]; then
  echo ""
  echo "ℹ️  Provide a session JWT to exercise authenticated flows:" >&2
  echo "    ./scripts/edge-function-diagnostics.sh <SESSION_JWT>" >&2
  exit 0
fi

print_header "Authenticated Diagnostics"

# Shared header file for authenticated requests
auth_headers=(-H "Content-Type: application/json" \
  -H "x-prospect-session: Bearer $SESSION_JWT")

# Validate auth helper first
response=$(curl "${CURL_COMMON[@]}" -X POST "$EDGE_BASE/test-new-auth" \
  -H "Authorization: Bearer $PUBLISHABLE_KEY" \
  -H "apikey: $PUBLISHABLE_KEY" \
  "${auth_headers[@]}" \
  -d '{"diagnostics":true}')
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')
inspect_response "test-new-auth (session)" "$http_code" "$body"

if [ "$http_code" = "200" ]; then
  user_id=$(printf "%s" "$body" | python3 - <<'PY'
import json, sys
try:
    data = json.load(sys.stdin)
except Exception:
    print("unknown")
else:
    print(data.get("authentication", {}).get("request", {}).get("userId", "unknown"))
PY
  )
  echo "      Parsed user: ${user_id:-unknown}"
else
  echo "      ❌ Session auth failed; aborting deeper checks"
  exit 1
fi

# Trigger background discovery to detect 500 errors
payload='{"businessType":"coffee shop","location":"Seattle, WA","maxResults":2,"tierKey":"PROFESSIONAL","sessionUserId":"diagnostics_cli"}'
response=$(curl "${CURL_COMMON[@]}" -X POST "$EDGE_BASE/business-discovery-background" \
  -H "Authorization: Bearer $PUBLISHABLE_KEY" \
  -H "apikey: $PUBLISHABLE_KEY" \
  "${auth_headers[@]}" \
  -d "$payload")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')
inspect_response "business-discovery-background (session)" "$http_code" "$body"

if [ "$http_code" = "500" ] || echo "$body" | grep -qi 'Unexpected end of JSON'; then
  echo "      ❗ Edge function returned malformed response"
  echo "      Next steps:"
  echo "         Review Supabase dashboard → Edge Functions → business-discovery-background → Logs"
  echo "         Verify secrets via 'source scripts/setup-edge-auth-env.sh' or the Supabase dashboard"
fi

# Export check to ensure campaign pipeline works
campaign_id=$(printf "%s" "$body" | python3 - <<'PY'
import json, sys
try:
  data = json.load(sys.stdin)
except Exception:
  print("")
else:
  print(data.get("campaignId", ""))
PY
)
if [ -n "$campaign_id" ]; then
  echo "      🚚 Campaign queued: $campaign_id"
  response=$(curl "${CURL_COMMON[@]}" -X POST "$EDGE_BASE/campaign-export-user-aware" \
    -H "Authorization: Bearer $PUBLISHABLE_KEY" \
    -H "apikey: $PUBLISHABLE_KEY" \
    "${auth_headers[@]}" \
    -d "{\"campaignId\":\"$campaign_id\",\"sessionUserId\":\"diagnostics_cli\"}" )
  http_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | sed '$d')
  inspect_response "campaign-export-user-aware (session)" "$http_code" "$body"
else
  echo "      ⚠️  No campaignId returned; skipping export test"
fi

print_header "Recommended Follow-up"
cat <<EOF
1. Inspect Supabase logs for any ❌ results above.
2. Re-run with verbose curl output if needed: CURL_VERBOSE=1 ./scripts/edge-function-diagnostics.sh <SESSION_JWT>
3. Run full campaign validation after fixing errors: ./scripts/campaign-validation.sh <SESSION_JWT>
EOF
