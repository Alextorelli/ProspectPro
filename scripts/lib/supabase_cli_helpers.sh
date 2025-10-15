#!/bin/bash
# Shared helpers for invoking the Supabase CLI inside ProspectPro scripts.
# This file is intended to be sourced; do not execute directly.
#
# Reference: Supabase CLI migration docs (2025-10)
#   https://supabase.com/docs/reference/cli/supabase-migration
#   https://supabase.com/docs/reference/cli/supabase-migration-new
#   https://supabase.com/docs/reference/cli/supabase-migration-list
#   https://supabase.com/docs/reference/cli/supabase-migration-fetch
#   https://supabase.com/docs/reference/cli/supabase-migration-repair
#   https://supabase.com/docs/reference/cli/supabase-migration-squash
#   https://supabase.com/docs/reference/cli/supabase-migration-up

if [[ -n "${_PROSPECTPRO_SUPABASE_CLI_HELPERS_SOURCED:-}" ]]; then
  return 0
fi
readonly _PROSPECTPRO_SUPABASE_CLI_HELPERS_SOURCED=1

# Determine repository root (defaults to Codespaces path).
PROSPECTPRO_REPO_ROOT=${PROSPECTPRO_REPO_ROOT:-/workspaces/ProspectPro}

DEFAULT_SUPABASE_PROJECT_REF=${SUPABASE_PROJECT_REF:-sriycekxdqnesdsgwiuc}

# Fail gracefully whether the script is sourced or executed.
pp_fail() {
  local exit_code=${1:-1}
  shift || true
  if [[ $# -gt 0 ]]; then
    printf '%s\n' "$@" >&2
  fi
  # If sourced, return. Otherwise exit.
  return "$exit_code" 2>/dev/null || exit "$exit_code"
}

# Guard that ensures commands are run from repo root but never hard exits the terminal.
pp_require_repo_root() {
  local expected_root="${EXPECTED_REPO_ROOT:-$PROSPECTPRO_REPO_ROOT}"
  local repo_root
  if ! repo_root=$(git rev-parse --show-toplevel 2>/dev/null); then
    pp_fail 1 "❌ Run this script from inside the ProspectPro repo"
  fi

  if [[ "$repo_root" != "$expected_root" ]]; then
    pp_fail 1 "❌ Wrong directory. Expected repo root: $expected_root" "   Current directory: $repo_root"
  fi
}

# Ensure npx is available so we can shim the Supabase CLI.
pp_require_npx() {
  if ! command -v npx >/dev/null 2>&1; then
    pp_fail 1 "❌ npx not available on PATH. Install Node.js tooling before proceeding."
  fi
}

_pp_cli_supports_project_ref() {
  # Lightweight allowlist of subcommands that accept --project-ref.
  local top_level="$1"
  case "$top_level" in
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

# Shared Supabase CLI invocation (always downloads the latest CLI via npx).
prospectpro_supabase_cli() {
  if [[ $# -eq 0 ]]; then
    pp_fail 1 "❌ prospectpro_supabase_cli requires subcommands (e.g. 'functions list')."
  fi
  local top_level="$1"
  shift
  _pp_invoke_supabase_cli "$top_level" "$@"
}

# Wrapper that surfaces CLI errors without killing the parent shell.
pp_run_supabase_cli() {
  if ! prospectpro_supabase_cli "$@"; then
    local status=$?
    pp_fail "$status" "❌ Supabase CLI command failed: supabase $*"
  fi
}

# Migration helpers --------------------------------------------------------

pp_supabase_migration_new() {
  pp_require_repo_root || return 1
  prospectpro_supabase_cli migration new "$@"
}

pp_supabase_migration_list() {
  pp_require_repo_root || return 1
  prospectpro_supabase_cli migration list "$@"
}

pp_supabase_migration_fetch() {
  pp_require_repo_root || return 1
  prospectpro_supabase_cli migration fetch "$@"
}

pp_supabase_migration_repair() {
  pp_require_repo_root || return 1
  prospectpro_supabase_cli migration repair "$@"
}

pp_supabase_migration_squash() {
  pp_require_repo_root || return 1
  prospectpro_supabase_cli migration squash "$@"
}

pp_supabase_migration_up() {
  pp_require_repo_root || return 1
  prospectpro_supabase_cli migration up "$@"
}

pp_supabase_db_push() {
  pp_require_repo_root || return 1
  prospectpro_supabase_cli db push "$@"
}

# Convenience helpers aligned with terminal usage --------------------------------

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

supabase_link() {
  supabase_setup || return 1
  local project_ref="${SUPABASE_PROJECT_REF:-$DEFAULT_SUPABASE_PROJECT_REF}"
  prospectpro_supabase_cli link --project-ref "$project_ref"
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

supabase_push() {
  supabase_setup || return 1
  prospectpro_supabase_cli migration list
  prospectpro_supabase_cli db push "$@"
}

supabase_pull_schema() {
  supabase_setup || return 1
  local schema="${1:-public}"
  prospectpro_supabase_cli db pull --schema "$schema"
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

export -f supabase_setup
export -f supabase_link
export -f supabase_migrations_status
export -f supabase_new_migration
export -f supabase_push
export -f supabase_pull_schema
export -f supabase_generate_types
export -f supabase_full_workflow
