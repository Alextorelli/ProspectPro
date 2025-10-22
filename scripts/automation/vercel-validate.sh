#!/bin/bash
# Vercel production deploy sanity check
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
  echo "[DRY RUN] Vercel validate script initialized. No actions will be executed."
  echo "[DRY RUN] Vercel validation skipped."
else
  node "$ENV_LOADER"
  npx vercel --confirm --cwd app/frontend
fi
