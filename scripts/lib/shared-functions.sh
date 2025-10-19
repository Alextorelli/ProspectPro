#!/bin/bash
# shared-functions.sh - Shared utility functions for ProspectPro scripts
# Provides common HTTP utilities, logging, and validation helpers

# HTTP utility functions
http_get_json() {
  local url="$1"
  local auth_header=""

  if [[ -n "${SUPABASE_SESSION_JWT:-}" ]]; then
    auth_header="-H \"Authorization: Bearer $SUPABASE_SESSION_JWT\""
  fi

  # Use curl with proper error handling
  eval "curl -s -f $auth_header \"$url\"" 2>/dev/null || echo "{}"
}

http_post_json() {
  local url="$1"
  local payload="$2"
  local auth_header=""

  if [[ -n "${SUPABASE_SESSION_JWT:-}" ]]; then
    auth_header="-H \"Authorization: Bearer $SUPABASE_SESSION_JWT\""
  fi

  # Use curl with proper error handling
  eval "curl -s -f -X POST $auth_header -H \"Content-Type: application/json\" -d '$payload' \"$url\"" 2>/dev/null || echo "{\"error\": \"HTTP request failed\"}"
}

# String utility functions
trim_trailing_slash() {
  local str="$1"
  echo "${str%/}"
}

# Logging functions
log_info() {
  echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] INFO: $*" >&2
}

log_error() {
  echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] ERROR: $*" >&2
}

log_warn() {
  echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] WARN: $*" >&2
}

# Validation functions
validate_required_env() {
  local var_name="$1"
  local var_value="${!var_name:-}"

  if [[ -z "$var_value" ]]; then
    log_error "Required environment variable $var_name is not set"
    return 1
  fi

  return 0
}

validate_file_exists() {
  local file_path="$1"

  if [[ ! -f "$file_path" ]]; then
    log_error "Required file does not exist: $file_path"
    return 1
  fi

  return 0
}

# Directory functions
ensure_directory() {
  local dir_path="$1"

  if [[ ! -d "$dir_path" ]]; then
    mkdir -p "$dir_path" || {
      log_error "Failed to create directory: $dir_path"
      return 1
    }
  fi

  return 0
}

# JSON utility functions
is_valid_json() {
  local json_str="$1"

  echo "$json_str" | jq empty >/dev/null 2>&1
}

extract_json_value() {
  local json_str="$1"
  local key="$2"
  local default="${3:-}"

  if is_valid_json "$json_str"; then
    echo "$json_str" | jq -r "$key // \"$default\""
  else
    echo "$default"
  fi
}

# Array utility functions
array_contains() {
  local element="$1"
  shift
  local array=("$@")

  for item in "${array[@]}"; do
    if [[ "$item" == "$element" ]]; then
      return 0
    fi
  done

  return 1
}

# Process management
is_process_running() {
  local pid="$1"

  if [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null; then
    return 0
  fi

  return 1
}

wait_for_process() {
  local pid="$1"
  local timeout="${2:-30}"
  local interval="${3:-1}"

  local count=0
  while [[ $count -lt $timeout ]]; do
    if is_process_running "$pid"; then
      sleep "$interval"
      ((count += interval))
    else
      return 0
    fi
  done

  return 1
}

# File operations
safe_move() {
  local src="$1"
  local dst="$2"

  if [[ -f "$src" ]]; then
    mv "$src" "$dst" || {
      log_error "Failed to move $src to $dst"
      return 1
    }
  else
    log_warn "Source file does not exist: $src"
    return 1
  fi

  return 0
}

safe_copy() {
  local src="$1"
  local dst="$2"

  if [[ -f "$src" ]]; then
    cp "$src" "$dst" || {
      log_error "Failed to copy $src to $dst"
      return 1
    }
  else
    log_warn "Source file does not exist: $src"
    return 1
  fi

  return 0
}

# Cleanup functions
cleanup_temp_files() {
  local pattern="${1:-/tmp/prospectpro-*}"

  find /tmp -name "$(basename "$pattern")" -type f -mtime +1 -delete 2>/dev/null || true
}

# Version comparison
version_compare() {
  local version1="$1"
  local version2="$2"

  if [[ "$version1" == "$version2" ]]; then
    echo "equal"
    return 0
  fi

  local IFS=.
  local v1=($version1)
  local v2=($version2)

  for ((i = 0; i < ${#v1[@]} || i < ${#v2[@]}; i++)); do
    local num1="${v1[i]:-0}"
    local num2="${v2[i]:-0}"

    if ((num1 > num2)); then
      echo "greater"
      return 0
    elif ((num1 < num2)); then
      echo "less"
      return 0
    fi
  done

  echo "equal"
}

# Export all functions
export -f http_get_json
export -f http_post_json
export -f trim_trailing_slash
export -f log_info
export -f log_error
export -f log_warn
export -f validate_required_env
export -f validate_file_exists
export -f ensure_directory
export -f is_valid_json
export -f extract_json_value
export -f array_contains
export -f is_process_running
export -f wait_for_process
export -f safe_move
export -f safe_copy
export -f cleanup_temp_files
export -f version_compare