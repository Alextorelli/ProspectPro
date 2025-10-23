#!/usr/bin/env bash
set -euo pipefail

require_repo_root() {
  local expected_root="${EXPECTED_REPO_ROOT:-/workspaces/ProspectPro}"
  local repo_root

  if ! repo_root=$(git rev-parse --show-toplevel 2>/dev/null); then
    echo "❌ Unable to determine git root. Run this workflow from inside the ProspectPro repository." >&2
    exit 1
  fi

  local current_dir
  current_dir=$(pwd -P)
  if [ "$current_dir" != "$repo_root" ]; then
    echo "❌ Run this workflow from the repository root ($repo_root). Current directory: $current_dir" >&2
    exit 1
  fi

  if [ "$repo_root" != "$expected_root" ]; then
    echo "❌ Repository root mismatch. Expected $expected_root but detected $repo_root." >&2
    echo "   Set EXPECTED_REPO_ROOT to override when intentionally running from another checkout." >&2
    exit 1
  fi
}

require_repo_root

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
# shellcheck source=/workspaces/ProspectPro/integration/platform/supabase/scripts/operations/supabase_cli_helpers.sh
if ! REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null); then
  REPO_ROOT=$(cd "$SCRIPT_DIR/../../.." && pwd)
fi
source "$REPO_ROOT/integration/platform/supabase/scripts/operations/supabase_cli_helpers.sh"

pp_require_npx

usage() {
  cat <<'EOF'
ProspectPro Deployment & Validation Workflow

Usage: deployment-validation-workflow.sh [--skip steps] [--only steps] [--help]

Options:
  --skip steps   Comma-separated list of step numbers (1-7) to skip.
  --only steps   Comma-separated list of step numbers (1-7) to execute.
  --help         Display this help message and exit.

Environment variables:
  PROJECT_SLUG, SUPABASE_PROJECT_REF   Target Vercel & Supabase projects (defaults provided)
  NEXT_PUBLIC_SUPABASE_ANON_KEY        Preferred source for publishable key (fallbacks supported)
  VITE_SUPABASE_ANON_KEY               Alternate publishable key source
  SUPABASE_SERVICE_ROLE_KEY            Required for REST admin calls (never echoed)
  SUPABASE_URL                         Required for REST admin calls
  SKIP_CONFIRM=1                       Auto-confirm destructive prompts
  CACHE_TABLES="table_a,table_b"      Extra Supabase tables to purge in Step 2 (optional)
EOF
}

check_help_flag() {
  for arg in "$@"; do
    if [[ "$arg" == "--help" || "$arg" == "-h" ]]; then
      usage
      exit 0
    fi
  done
}

check_help_flag "$@"

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
REPO_ROOT=$(cd "$SCRIPT_DIR/.." && pwd)
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
ARTIFACT_ROOT="$REPO_ROOT/logs/deployment-validation"
RUN_DIR="$ARTIFACT_ROOT/$TIMESTAMP"
mkdir -p "$RUN_DIR"
RUN_LOG="$RUN_DIR/workflow.log"
touch "$RUN_LOG"

PROJECT_SLUG=${PROJECT_SLUG:-prospect-fyhedobh1-appsmithery}
SUPABASE_PROJECT_REF=${SUPABASE_PROJECT_REF:-sriycekxdqnesdsgwiuc}

PUBLISHABLE_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY:-${VITE_SUPABASE_ANON_KEY:-${SUPABASE_PUBLISHABLE_KEY:-${SUPABASE_ANON_KEY:-}}}}
SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY:-${SERVICE_ROLE_KEY:-}}
SKIP_CONFIRM=${SKIP_CONFIRM:-0}

CAMPAIGN_ID=""
JOB_ID=""
SESSION_ACCESS_TOKEN=""

COLOR_RESET=$(printf '\033[0m')
COLOR_INFO=$(printf '\033[36m')
COLOR_WARN=$(printf '\033[33m')
COLOR_SUCCESS=$(printf '\033[32m')
COLOR_ERROR=$(printf '\033[31m')
COLOR_SECTION=$(printf '\033[35m')

log_to_file() {
  printf '%s\n' "$1" >>"$RUN_LOG"
}

log_info() {
  printf "%sℹ %s%s\n" "$COLOR_INFO" "$1" "$COLOR_RESET"
  log_to_file "[INFO] $1"
}

log_warn() {
  printf "%s⚠ %s%s\n" "$COLOR_WARN" "$1" "$COLOR_RESET"
  log_to_file "[WARN] $1"
}

log_success() {
  printf "%s✅ %s%s\n" "$COLOR_SUCCESS" "$1" "$COLOR_RESET"
  log_to_file "[OK] $1"
}

log_error() {
  printf "%s❌ %s%s\n" "$COLOR_ERROR" "$1" "$COLOR_RESET" >&2
  log_to_file "[ERR] $1"
}

log_section() {
  local title="$1"
  printf "\n%s%s%s\n" "$COLOR_SECTION" "$title" "$COLOR_RESET"
  printf '%s\n' "$title" | sed 's/./=/g'
  log_to_file "[SECTION] $title"
}

require_command() {
  local binary="$1"
  if ! command -v "$binary" >/dev/null 2>&1; then
    log_warn "Missing command: $binary"
    return 1
  fi
  return 0
}

confirmed() {
  local prompt="$1"
  if [ "$SKIP_CONFIRM" -eq 1 ]; then
    return 0
  fi
  read -r -p "$prompt [y/N]: " reply || true
  case "$reply" in
    [Yy]*) return 0 ;;
    *)     return 1 ;;
  esac
}

run_cmd_plain() {
  local description="$1"
  shift
  log_info "$description"
  set +e
  "$@" >/dev/null 2>&1
  local status=$?
  set -e
  if [ $status -eq 0 ]; then
    log_success "$description"
  else
    log_warn "$description failed (exit $status)"
  fi
  return $status
}

run_cmd_capture() {
  local description="$1"
  local outfile="$2"
  shift 2
  log_info "$description"
  {
    printf '### %s\n' "$description"
    printf 'Timestamp: %s\n\n' "$(date --iso-8601=seconds)"
  } >>"$outfile"
  set +e
  "$@" 2>&1 | tee -a "$outfile"
  local status=${PIPESTATUS[0]}
  set -e
  if [ $status -eq 0 ]; then
    log_success "$description (see $(basename "$outfile"))"
  else
    log_warn "$description failed (exit $status). Review $(basename "$outfile")"
  fi
  return $status
}

curl_json_to_file() {
  local description="$1"
  local outfile="$2"
  shift 2
  log_info "$description"
  set +e
  local http_code
  http_code=$(curl -sS -o "$outfile" -w '%{http_code}' "$@")
  local status=$?
  set -e
  if [ $status -ne 0 ]; then
    log_warn "$description failed (curl exit $status)"
    return $status
  fi
  if [[ "$http_code" =~ ^2 ]]; then
    log_success "$description (HTTP $http_code, see $(basename "$outfile"))"
    return 0
  fi
  log_warn "$description returned HTTP $http_code (see $(basename "$outfile"))"
  return 1
}

attempt_supabase_delete() {
  local table="$1"
  if [ -z "${SUPABASE_URL:-}" ] || [ -z "$SERVICE_ROLE_KEY" ]; then
    log_warn "Skipping purge for $table (SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing)"
    return 1
  fi
  local endpoint="${SUPABASE_URL%/}/rest/v1/$table?id=not.is.null"
  log_info "Purging Supabase table: $table"
  set +e
  local http_code
  http_code=$(curl -sS -o "$RUN_DIR/delete-${table}.log" -w '%{http_code}' \
    -X DELETE "$endpoint" \
    -H "apikey: $SERVICE_ROLE_KEY" \
    -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
    -H "Content-Type: application/json" \
    -H "Prefer: return=minimal")
  local status=$?
  set -e
  if [ $status -ne 0 ]; then
    log_warn "Failed to purge $table (curl exit $status)"
    return $status
  fi
  if [[ "$http_code" =~ ^2 ]]; then
    log_success "Purged $table (HTTP $http_code)"
    return 0
  fi
  log_warn "Purge for $table returned HTTP $http_code (see delete-${table}.log)"
  return 1
}

attempt_supabase_get_json() {
  local resource="$1"
  local query="$2"
  local outfile="$3"
  if [ -z "${SUPABASE_URL:-}" ] || [ -z "$SERVICE_ROLE_KEY" ]; then
    log_warn "Cannot snapshot $resource (missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY)"
    return 1
  fi
  local endpoint="${SUPABASE_URL%/}/rest/v1/${resource}${query}"
  curl_json_to_file "Supabase snapshot: ${resource}${query}" "$outfile" \
    -H "apikey: $SERVICE_ROLE_KEY" \
    -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
    -H "Accept: application/json" \
    -H "Prefer: count=exact" \
    "$endpoint"
}

attempt_supabase_count() {
  local table="$1"
  if [ -z "${SUPABASE_URL:-}" ] || [ -z "$SERVICE_ROLE_KEY" ]; then
    echo "-"
    return 1
  fi
  local endpoint="${SUPABASE_URL%/}/rest/v1/$table?select=id"
  local headers_file="$RUN_DIR/count-${table}.headers"
  set +e
  curl -sS -D "$headers_file" -o /dev/null "$endpoint" \
    -H "apikey: $SERVICE_ROLE_KEY" \
    -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
    -H "Prefer: count=exact" >/dev/null
  local status=$?
  set -e
  if [ $status -ne 0 ]; then
    rm -f "$headers_file"
    echo "-"
    return $status
  fi
  local range_line
  range_line=$(grep -i 'content-range:' "$headers_file" | tail -n1)
  rm -f "$headers_file"
  if [ -z "$range_line" ]; then
    echo "-"
    return 1
  fi
  printf '%s\n' "$range_line" | awk -F'/' '{gsub(/\s+/, "", $2); print $2}'
}

declare -A SKIP_MAP=()
declare -A ONLY_MAP=()

parse_args() {
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --skip)
        if [[ $# -lt 2 ]]; then
          log_error "--skip requires a value"
          exit 1
        fi
        IFS=',' read -r -a list <<<"$2"
        for item in "${list[@]}"; do
          item=${item// /}
          [[ -n "$item" ]] && SKIP_MAP[$item]=1
        done
        shift 2
        ;;
      --only)
        if [[ $# -lt 2 ]]; then
          log_error "--only requires a value"
          exit 1
        fi
        IFS=',' read -r -a list <<<"$2"
        for item in "${list[@]}"; do
          item=${item// /}
          [[ -n "$item" ]] && ONLY_MAP[$item]=1
        done
        shift 2
        ;;
      --help|-h)
        usage
        exit 0
        ;;
      *)
        log_warn "Unknown option: $1 (ignored)"
        shift
        ;;
    esac
  done
}

should_run_step() {
  local step="$1"
  if [[ ${SKIP_MAP[$step]:-0} -eq 1 ]]; then
    return 1
  fi
  if [ ${#ONLY_MAP[@]} -gt 0 ] && [[ ${ONLY_MAP[$step]:-0} -ne 1 ]]; then
    return 1
  fi
  return 0
}

step1_environment_observability() {
  if ! should_run_step 1; then
    log_warn "Skipping Step 1 (filtered)"
    return
  fi
  log_section "Step 1 – Environment & Observability Snapshot"
  if ! confirmed "Proceed with Step 1?"; then
    log_warn "User skipped Step 1"
    return
  fi
  if require_command vercel; then
    run_cmd_capture "Snapshot Vercel environment variables" "$RUN_DIR/vercel-env.txt" vercel env ls "$PROJECT_SLUG" || true
    run_cmd_capture "Fetch Vercel logs (last hour)" "$RUN_DIR/vercel-logs.txt" vercel logs "$PROJECT_SLUG" --since=1h --no-ansi || true
  fi
  run_cmd_capture "Snapshot Supabase secrets digests" "$RUN_DIR/supabase-secrets.txt" \
    prospectpro_supabase_cli secrets list --project-ref "$SUPABASE_PROJECT_REF" || true
  log_warn "Supabase CLI log streaming was removed upstream. Capture logs from the dashboard (Edge Functions → Logs) instead."
  log_info "Capture dashboard screenshots manually and store them in $RUN_DIR as needed."
}

step2_data_cache_scrub() {
  if ! should_run_step 2; then
    log_warn "Skipping Step 2 (filtered)"
    return
  fi
  log_section "Step 2 – Legacy Data & Cache Scrub"
  if ! confirmed "Proceed with destructive Supabase purges?"; then
    log_warn "User skipped Step 2"
    return
  fi
  local tables=(leads campaigns discovery_jobs dashboard_exports)
  for table in "${tables[@]}"; do
    attempt_supabase_delete "$table" || true
  done
  if [ -n "${CACHE_TABLES:-}" ]; then
    IFS=',' read -r -a extra_tables <<<"$CACHE_TABLES"
    for table in "${extra_tables[@]}"; do
      table=${table// /}
      [[ -n "$table" ]] && attempt_supabase_delete "$table" || true
    done
  else
    log_info "No CACHE_TABLES override supplied; skipping additional cache purge."
  fi
  if confirmed "List Supabase storage buckets (requires supabase login)?"; then
    run_cmd_capture "List Supabase storage buckets" "$RUN_DIR/supabase-storage.txt" \
      prospectpro_supabase_cli storage ls --experimental --project-ref "$SUPABASE_PROJECT_REF" || true
    log_info "Use 'supabase storage rm ss:///bucket/path --recursive --experimental' for targeted cleanup—never run blindly."
  else
    log_warn "Supabase storage cleanup deferred to manual review."
  fi
  if require_command vercel; then
    run_cmd_capture "Purge Vercel cache layers" "$RUN_DIR/vercel-cache.txt" vercel cache purge --yes --cwd "$REPO_ROOT" || true
  fi
}

step3_backend_redeploy() {
  if ! should_run_step 3; then
    log_warn "Skipping Step 3 (filtered)"
    return
  fi
  log_section "Step 3 – Clean Backend Redeployment"
  if ! confirmed "Redeploy Supabase functions and secrets?"; then
    log_warn "User skipped Step 3"
    return
  fi
  if [ -n "$PUBLISHABLE_KEY" ]; then
    run_cmd_plain "Reapply Supabase publishable key" \
      prospectpro_supabase_cli secrets set SUPABASE_PUBLISHABLE_KEY="$PUBLISHABLE_KEY" --project-ref "$SUPABASE_PROJECT_REF" || true
  else
    log_warn "Publishable key not supplied; skipping secret reset."
  fi
  if [ -n "$SERVICE_ROLE_KEY" ]; then
    run_cmd_plain "Reapply Supabase service role key" \
      prospectpro_supabase_cli secrets set SUPABASE_SERVICE_ROLE_KEY="$SERVICE_ROLE_KEY" --project-ref "$SUPABASE_PROJECT_REF" || true
  else
    log_warn "Service role key not supplied; skipping secret reset."
  fi
  local function_slugs=(
    business-discovery-background
    campaign-export-user-aware
    enrichment-hunter
    enrichment-neverbounce
  )
  if [ -d "$REPO_ROOT/app/backend/functions/data-enhancement-orchestrator" ]; then
    function_slugs+=(data-enhancement-orchestrator)
  elif [ -d "$REPO_ROOT/app/backend/functions/enrichment-orchestrator" ]; then
    function_slugs+=(enrichment-orchestrator)
  fi
  for fn in "${function_slugs[@]}"; do
    run_cmd_capture "Deploy Supabase function: $fn" "$RUN_DIR/deploy-$fn.log" \
      prospectpro_supabase_cli functions deploy "$fn" --project-ref "$SUPABASE_PROJECT_REF" || true
  done
  if [ -x "$REPO_ROOT/scripts/diagnose-campaign-failure.sh" ]; then
    run_cmd_capture "Run diagnose-campaign-failure.sh" "$RUN_DIR/diagnose-campaign-failure.log" "$REPO_ROOT/scripts/diagnose-campaign-failure.sh" || true
  else
    log_warn "diagnose-campaign-failure.sh not executable; skipping."
  fi
  if [ -x "$REPO_ROOT/scripts/test-background-tasks.sh" ]; then
    run_cmd_capture "Run test-background-tasks.sh" "$RUN_DIR/test-background-tasks.log" "$REPO_ROOT/scripts/test-background-tasks.sh" || true
  else
    log_warn "test-background-tasks.sh not executable; skipping."
  fi
}

step4_frontend_redeploy() {
  if ! should_run_step 4; then
    log_warn "Skipping Step 4 (filtered)"
    return
  fi
  log_section "Step 4 – Frontend Build & Deployment"
  if ! confirmed "Rebuild and deploy the frontend?"; then
    log_warn "User skipped Step 4"
    return
  fi
  if require_command npm; then
    run_cmd_capture "npm ci" "$RUN_DIR/npm-ci.log" npm ci || true
    run_cmd_capture "npm run lint" "$RUN_DIR/npm-lint.log" npm run lint || true
    run_cmd_capture "npm run test" "$RUN_DIR/npm-test.log" npm run test || true
    run_cmd_capture "npm run build" "$RUN_DIR/npm-build.log" npm run build || true
  else
    log_warn "npm command unavailable; skipping frontend build."
  fi
  if require_command vercel; then
    run_cmd_capture "Deploy Vercel prebuilt build" "$RUN_DIR/vercel-deploy.log" vercel deploy --prebuilt --prod || true
  fi
  log_info "Perform a hard reload and clear DevTools Application storage before UI validation."
}

step5_user_workflow() {
  if ! should_run_step 5; then
    log_warn "Skipping Step 5 (filtered)"
    return
  fi
  log_section "Step 5 – Full User Workflow Simulation"
  cat <<'EOF'
Manual actions before continuing:
  1. Sign in to the production app and capture the session access token.
  2. Launch a campaign (e.g., Coffee Shops in Seattle) and note the campaign ID and discovery job ID.
  3. Keep Supabase → Edge Functions logs open while the job processes.
EOF
  if ! confirmed "Provide session token and IDs for scripted checks?"; then
    log_warn "Automated workflow validation skipped."
    return
  fi
  read -r -s -p "Enter session access token (hidden input): " SESSION_ACCESS_TOKEN
  printf '\n'
  read -r -p "Enter campaign ID (leave blank to skip REST checks): " CAMPAIGN_ID
  read -r -p "Enter discovery job ID (leave blank to skip job monitor): " JOB_ID
  if [ -n "$JOB_ID" ] && [ -x "$REPO_ROOT/scripts/monitor-discovery-job.sh" ]; then
    run_cmd_capture "Monitor discovery job $JOB_ID" "$RUN_DIR/monitor-job.log" "$REPO_ROOT/scripts/monitor-discovery-job.sh" "$JOB_ID" ${CAMPAIGN_ID:+--campaign "$CAMPAIGN_ID"} --interval 5 || true
  elif [ -n "$JOB_ID" ]; then
    log_warn "monitor-discovery-job.sh unavailable; monitor job manually."
  fi
  if [ -n "$CAMPAIGN_ID" ] && [ -n "${SUPABASE_URL:-}" ] && [ -n "$SESSION_ACCESS_TOKEN" ] && [ -n "$PUBLISHABLE_KEY" ]; then
    local base="${SUPABASE_URL%/}"
    if [ -n "$JOB_ID" ]; then
      run_cmd_capture "REST discovery_jobs payload" "$RUN_DIR/discovery-job-${JOB_ID}.json" \
        curl -sS "$base/rest/v1/discovery_jobs?id=eq.${JOB_ID}&select=*" \
        -H "Authorization: Bearer $SESSION_ACCESS_TOKEN" \
        -H "apikey: $PUBLISHABLE_KEY" \
        -H "Accept: application/json" || true
    fi
    run_cmd_capture "REST leads payload for campaign" "$RUN_DIR/leads-${CAMPAIGN_ID}.json" \
      curl -sS "$base/rest/v1/leads?campaign_id=eq.${CAMPAIGN_ID}&select=*" \
      -H "Authorization: Bearer $SESSION_ACCESS_TOKEN" \
      -H "apikey: $PUBLISHABLE_KEY" \
      -H "Accept: application/json" || true
    local payload
    payload=$(printf '{"campaignId":"%s","format":"csv"}' "$CAMPAIGN_ID")
    run_cmd_capture "Trigger export via Edge Function" "$RUN_DIR/export-${CAMPAIGN_ID}.json" \
      curl -sS -X POST "$base/functions/v1/campaign-export-user-aware" \
      -H "Authorization: Bearer $SESSION_ACCESS_TOKEN" \
      -H "apikey: $PUBLISHABLE_KEY" \
      -H "Content-Type: application/json" \
      -d "$payload" || true
  else
    log_warn "Skipping REST validation (campaign ID, session token, or publishable key missing)."
  fi
}

step6_analytics_cleanup() {
  if ! should_run_step 6; then
    log_warn "Skipping Step 6 (filtered)"
    return
  fi
  log_section "Step 6 – Analytics & Cleanup"
  attempt_supabase_get_json discovery_jobs "?order=updated_at.desc&limit=10" "$RUN_DIR/discovery-jobs-latest.json" || true
  attempt_supabase_get_json campaigns "?select=id,total_cost,results_count,status,updated_at&order=updated_at.desc&limit=10" "$RUN_DIR/campaigns-costs.json" || true
  attempt_supabase_get_json dashboard_exports "?order=completed_at.desc&limit=10" "$RUN_DIR/dashboard-exports.json" || true
  log_info "Capture Supabase monitoring dashboards (requests, errors, auth) and attach screenshots to $RUN_DIR."
  log_info "Remove any temporary credentials from local history after the run."
}

step7_greenlight() {
  if ! should_run_step 7; then
    log_warn "Skipping Step 7 (filtered)"
    return
  fi
  log_section "Step 7 – Green-Light Criteria"
  local leads_count campaigns_count exports_count
  leads_count=$(attempt_supabase_count leads || echo "-")
  campaigns_count=$(attempt_supabase_count campaigns || echo "-")
  exports_count=$(attempt_supabase_count dashboard_exports || echo "-")
  log_info "Leads table row count: $leads_count"
  log_info "Campaigns table row count: $campaigns_count"
  log_info "Dashboard exports row count: $exports_count"
  if [ -n "$CAMPAIGN_ID" ] && [ -f "$RUN_DIR/export-${CAMPAIGN_ID}.json" ]; then
    if grep -q '"success":true' "$RUN_DIR/export-${CAMPAIGN_ID}.json" 2>/dev/null; then
      log_success "Export Edge Function returned success=true"
    else
      log_warn "Export response did not include success=true; inspect export-${CAMPAIGN_ID}.json"
    fi
  else
    log_warn "No export artefact captured; verify export flow manually."
  fi
  log_info "Review Supabase Edge Function logs for 4xx/5xx errors during the run."
  log_info "Perform a UI regression sweep (login → campaign → monitor → results → export) across primary browsers."
  log_info "If all checks pass, lock the Vercel deployment, snapshot the Supabase schema, and record the validated commit hash."
}

main() {
  parse_args "$@"
  log_section "ProspectPro Deployment & Validation Workflow"
  log_info "Artefacts directory: $RUN_DIR"
  step1_environment_observability
  step2_data_cache_scrub
  step3_backend_redeploy
  step4_frontend_redeploy
  step5_user_workflow
  step6_analytics_cleanup
  step7_greenlight
  log_success "Workflow complete. Review artefacts under $RUN_DIR"
}

main "$@"
