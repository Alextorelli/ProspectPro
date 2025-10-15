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
  npx --yes supabase@latest "$top_level" "${args[@]}"
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
  local target="${PROSPECTPRO_REPO_ROOT}/supabase"
  if [[ ! -d "$target" ]]; then
    pp_fail 1 "❌ Supabase directory not found at $target"
  fi
  if [[ "$PWD" != "$target" ]]; then
    cd "$target" || return 1
  fi
  # shellcheck source=/workspaces/ProspectPro/scripts/ensure-supabase-cli-session.sh
  source ../scripts/ensure-supabase-cli-session.sh
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
