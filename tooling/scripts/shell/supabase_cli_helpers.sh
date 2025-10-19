#!/bin/bash
# ProspectPro Supabase CLI Helper Library
# Provides safe wrappers for common Supabase CLI and Edge Function workflows.
# Official docs (2025-10):
#   https://supabase.com/docs/reference/cli/supabase-cli-overview
#   https://supabase.com/docs/reference/cli/supabase-functions
#   https://supabase.com/docs/reference/cli/supabase-functions-serve
#   https://supabase.com/docs/reference/cli/supabase-functions-deploy

if [[ -n "${_PROSPECTPRO_SUPABASE_CLI_HELPERS_SOURCED:-}" ]]; then
  return 0
fi
readonly _PROSPECTPRO_SUPABASE_CLI_HELPERS_SOURCED=1

PROSPECTPRO_REPO_ROOT=${PROSPECTPRO_REPO_ROOT:-/workspaces/ProspectPro}
DEFAULT_SUPABASE_PROJECT_REF=${SUPABASE_PROJECT_REF:-sriycekxdqnesdsgwiuc}
SUPABASE_DIR=${SUPABASE_DIR:-${PROSPECTPRO_REPO_ROOT}/supabase}
SUPABASE_CLI_DEFAULT_VERSION=${SUPABASE_CLI_DEFAULT_VERSION:-2.51.0}
SUPABASE_CLI_VERSION=${SUPABASE_CLI_VERSION:-$SUPABASE_CLI_DEFAULT_VERSION}

# Guard variables to prevent recursive setup when the auth helper shells out
: "${PROSPECTPRO_SUPABASE_SUPPRESS_SETUP:=0}"

pp_fail() {
  local exit_code=${1:-1}
  shift || true
  if [[ $# -gt 0 ]]; then
    printf '%s\n' "$@" >&2
  fi
  return "$exit_code" 2>/dev/null || exit "$exit_code"
}

pp_require_repo_root() {
  local expected_root="${EXPECTED_REPO_ROOT:-$PROSPECTPRO_REPO_ROOT}"
  local repo_root
  if ! repo_root=$(git rev-parse --show-toplevel 2>/dev/null); then
    pp_fail 1 "❌ Run this command inside the ProspectPro repository"
  fi
  if [[ "$repo_root" != "$expected_root" ]]; then
    pp_fail 1 "❌ Wrong directory. Expected $expected_root but found $repo_root"
  fi
}

pp_require_npx() {
  if ! command -v npx >/dev/null 2>&1; then
    pp_fail 1 "❌ npx not available. Install Node.js tooling before continuing."
  fi
}

_pp_cli_supports_project_ref() {
  case "$1" in
    functions|secrets|storage|backups|branches|config|domains|encryption|network-bans|network-restrictions|postgres-config|vanity-subdomains|snippets)
      return 0
      ;;
    *)
      return 1
      ;;
  esac
}

_pp_invoke_supabase_cli() {
  pp_require_npx || return 1
  if [[ "${PROSPECTPRO_SUPABASE_SUPPRESS_SETUP:-0}" != "1" ]]; then
    supabase_setup || return 1
  fi
  local top_level="$1"
  shift
  local args=("$@")
  if _pp_cli_supports_project_ref "$top_level"; then
    local project_ref="${SUPABASE_PROJECT_REF:-$DEFAULT_SUPABASE_PROJECT_REF}"
    if [[ -n "$project_ref" ]]; then
      local has_flag="false"
      for arg in "${args[@]}"; do
        if [[ "$arg" == "--project-ref" ]]; then
          has_flag="true"
          break
        fi
      done
      if [[ "$has_flag" != "true" ]]; then
        args+=("--project-ref" "$project_ref")
      fi
    fi
  fi
  (
    cd "$SUPABASE_DIR" || return 1
    local cli_pkg="supabase@${SUPABASE_CLI_VERSION}"
    if ! npx --yes "$cli_pkg" "$top_level" "${args[@]}"; then
      if [[ "$SUPABASE_CLI_VERSION" != "latest" ]]; then
        echo "⚠️ Supabase CLI ${SUPABASE_CLI_VERSION} unavailable, retrying with latest..." >&2
        npx --yes supabase@latest "$top_level" "${args[@]}"
      else
        return 1
      fi
    fi
  )
}

prospectpro_supabase_cli() {
  if [[ $# -eq 0 ]]; then
    pp_fail 1 "❌ prospectpro_supabase_cli requires a subcommand."
  fi
  local top_level="$1"
  shift
  _pp_invoke_supabase_cli "$top_level" "$@"
}

pp_run_supabase_cli() {
  if ! prospectpro_supabase_cli "$@"; then
    local status=$?
    pp_fail "$status" "❌ Supabase CLI command failed: supabase $*"
  fi
}

supabase_setup() {
  pp_require_repo_root || return 1
  if [[ ! -d "$SUPABASE_DIR" ]]; then
    pp_fail 1 "❌ Supabase directory not found at $SUPABASE_DIR"
  fi

  if [[ "${PROSPECTPRO_SUPABASE_SESSION_READY:-0}" != "1" ]]; then
    local _prev_guard="${PROSPECTPRO_SUPABASE_SUPPRESS_SETUP:-0}"
    export PROSPECTPRO_SUPABASE_SUPPRESS_SETUP=1
    # shellcheck source=/workspaces/ProspectPro/scripts/ensure-supabase-cli-session.sh
    source "$PROSPECTPRO_REPO_ROOT/scripts/ensure-supabase-cli-session.sh" || return 1
    export PROSPECTPRO_SUPABASE_SUPPRESS_SETUP="$_prev_guard"
    PROSPECTPRO_SUPABASE_SESSION_READY=1
  fi

  local project_ref="${SUPABASE_PROJECT_REF:-$DEFAULT_SUPABASE_PROJECT_REF}"
  local config_file="$SUPABASE_DIR/.supabase/config.toml"
  if [[ ! -f "$config_file" ]] || ! grep -q "ref *= *\"$project_ref\"" "$config_file"; then
    local _prev_guard="${PROSPECTPRO_SUPABASE_SUPPRESS_SETUP:-0}"
    export PROSPECTPRO_SUPABASE_SUPPRESS_SETUP=1
    (
      cd "$SUPABASE_DIR" || return 1
      npx --yes "supabase@${SUPABASE_CLI_VERSION}" link --project-ref "$project_ref" >/dev/null
    ) || return 1
    export PROSPECTPRO_SUPABASE_SUPPRESS_SETUP="$_prev_guard"
  fi
}

# Database & migration workflows ------------------------------------------

supabase_link() {
  supabase_setup || return 1
  local project_ref="${SUPABASE_PROJECT_REF:-$DEFAULT_SUPABASE_PROJECT_REF}"
  prospectpro_supabase_cli link --project-ref "$project_ref"
}

supabase_status() {
  supabase_setup || return 1
  prospectpro_supabase_cli status "$@"
}

supabase_migrations_status() {
  supabase_setup || return 1
  prospectpro_supabase_cli migration list "$@"
}

supabase_new_migration() {
  supabase_setup || return 1
  if [[ -z "${1:-}" ]]; then
    pp_fail 1 "❌ supabase_new_migration requires a descriptive migration name."
  fi
  prospectpro_supabase_cli migration new "$1"
}

supabase_migration_repair() {
  supabase_setup || return 1
  prospectpro_supabase_cli migration repair "$@"
}

supabase_db_push() {
  supabase_setup || return 1
  prospectpro_supabase_cli db push "$@"
}

supabase_db_pull() {
  supabase_setup || return 1
  local schema="${1:-public}"
  prospectpro_supabase_cli db pull --schema "$schema"
}

supabase_reset_local() {
  supabase_setup || return 1
  prospectpro_supabase_cli db reset --local "$@"
}

supabase_dump_schema() {
  supabase_setup || return 1
  if [[ -z "${1:-}" ]]; then
    pp_fail 1 "❌ supabase_dump_schema requires an output path."
  fi
  local schema="${2:-public}"
  prospectpro_supabase_cli db dump --schema "$schema" --file "$1"
}

supabase_generate_types() {
  supabase_setup || return 1
  prospectpro_supabase_cli gen types --lang typescript > ../src/types/supabase.ts
}

supabase_full_workflow() {
  supabase_link || return 1
  supabase_migrations_status || return 1
  printf '%s\n' '✅ Supabase workflow complete'
}

# Edge function workflows --------------------------------------------------

edge_functions_serve() {
  supabase_setup || return 1
  prospectpro_supabase_cli functions serve --no-verify-jwt --debug "$@"
}

edge_functions_deploy_critical() {
  supabase_setup || return 1
  prospectpro_supabase_cli functions deploy business-discovery-background --no-verify-jwt || return 1
  prospectpro_supabase_cli functions deploy enrichment-orchestrator "$@"
}

edge_functions_deploy_group() {
  supabase_setup || return 1
  local group="${1:-}"
  shift || true
  case "$group" in
    discovery)
      prospectpro_supabase_cli functions deploy business-discovery-background --no-verify-jwt &&
        prospectpro_supabase_cli functions deploy business-discovery-optimized &&
        prospectpro_supabase_cli functions deploy business-discovery-user-aware
      ;;
    enrichment)
      prospectpro_supabase_cli functions deploy enrichment-orchestrator &&
        prospectpro_supabase_cli functions deploy enrichment-hunter &&
        prospectpro_supabase_cli functions deploy enrichment-neverbounce &&
        prospectpro_supabase_cli functions deploy enrichment-business-license &&
        prospectpro_supabase_cli functions deploy enrichment-pdl
      ;;
    export)
      prospectpro_supabase_cli functions deploy campaign-export-user-aware
      ;;
    diagnostics)
      prospectpro_supabase_cli functions deploy test-google-places &&
        prospectpro_supabase_cli functions deploy auth-diagnostics
      ;;
    *)
      pp_fail 1 "❌ Unknown edge function group: ${group}"
      ;;
  esac
}

edge_functions_logs() {
  supabase_setup || return 1
  prospectpro_supabase_cli functions logs "$@"
}

edge_functions_list() {
  supabase_setup || return 1
  prospectpro_supabase_cli functions list "$@"
}

edge_functions_dev_workflow() {
  supabase_setup || return 1
  edge_functions_list || return 1
  edge_functions_serve "$@" || return 1
}

supabase_cli_version_status() {
  local pinned_version="$SUPABASE_CLI_VERSION"
  local resolved_version
  local default_version

  if ! resolved_version=$(npx --yes "supabase@${SUPABASE_CLI_VERSION}" --version 2>&1 | head -n1); then
    resolved_version="unavailable"
  fi

  if ! default_version=$(npx --yes supabase --version 2>&1 | head -n1); then
    default_version="unavailable"
  fi

  printf 'Pinned CLI version: %s\n' "$pinned_version"
  printf 'Resolved CLI version (supabase@%s): %s\n' "$pinned_version" "$resolved_version"
  printf 'Default npx supabase version: %s\n' "$default_version"
}

run_database_tests() {
  supabase_setup || return 1
  prospectpro_supabase_cli test db "$@"
}

get_function_report() {
  if [[ -z "${1:-}" ]]; then
    pp_fail 1 "❌ get_function_report requires a function name."
  fi
  local function_name="$1"
  local hours="${2:-24}"
  supabase_setup || return 1

  echo "📊 Function Report: $function_name (${hours}h)"
  local sql_file
  sql_file=$(mktemp /tmp/function-report.XXXXXX.sql)
  cat >"$sql_file" <<EOF
SELECT public.get_function_summary('$function_name', $hours);
EOF
  echo "Run in Supabase SQL Editor or psql:" && cat "$sql_file"
  rm -f "$sql_file"

  echo ""
  echo "Recent CLI logs:"
  if ! prospectpro_supabase_cli functions logs "$function_name" --since="${hours}h" | tail -20; then
    echo "⚠️  Supabase CLI log stream unavailable; capture logs via dashboard."
  fi
}

# Export helper symbols ----------------------------------------------------

export -f pp_fail
export -f pp_require_repo_root
export -f pp_require_npx
export -f prospectpro_supabase_cli
export -f pp_run_supabase_cli
export -f supabase_setup
export -f supabase_link
export -f supabase_status
export -f supabase_migrations_status
export -f supabase_new_migration
export -f supabase_migration_repair
export -f supabase_db_push
export -f supabase_db_pull
export -f supabase_reset_local
export -f supabase_dump_schema
export -f supabase_generate_types
export -f supabase_full_workflow
export -f edge_functions_serve
export -f edge_functions_deploy_critical
export -f edge_functions_deploy_group
export -f edge_functions_logs
export -f edge_functions_list
export -f edge_functions_dev_workflow
export -f run_database_tests
export -f get_function_report
export -f supabase_cli_version_status

if [[ "${BASH_SOURCE[0]}" == "$0" ]]; then
  case "${1:-}" in
    --status)
      supabase_cli_version_status
      ;;
    *)
      echo "Usage: $0 --status" >&2
      exit 1
      ;;
  esac
fi
