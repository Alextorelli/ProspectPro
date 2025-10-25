#!/bin/bash
# Redis telemetry snapshot
set -euo pipefail
source $(git rev-parse --show-toplevel)/scripts/operations/ensure-supabase-cli-session.sh

# Isolate --dry-run flag before sourcing participant-routing
ENV_LOADER="$(git rev-parse --show-toplevel)/config/environment-loader.v2.js"
DRY_RUN=false
ARGS=()
for arg in "$@"; do
  if [[ "$arg" == "--dry-run" ]]; then
    DRY_RUN=true
  else
    ARGS+=("$arg")
  fi
done

# Only pass non-dry-run args to participant-routing
source $(git rev-parse --show-toplevel)/scripts/automation/lib/participant-routing.sh "${ARGS[@]}"

if $DRY_RUN; then
  echo "[DRY RUN] Redis observability script initialized. No actions will be executed."
  echo "[DRY RUN] Redis observability check skipped."
else
  node "$ENV_LOADER"
  echo "TODO: Implement Redis telemetry checks."
fi
