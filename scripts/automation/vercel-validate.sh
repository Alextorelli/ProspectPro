#!/bin/bash
# Vercel production deploy sanity check
set -euo pipefail
source $(git rev-parse --show-toplevel)/scripts/operations/ensure-supabase-cli-session.sh
source $(git rev-parse --show-toplevel)/scripts/automation/lib/participant-routing.sh
ENV_LOADER="$(git rev-parse --show-toplevel)/config/environment-loader.v2.js"
DRY_RUN=false
if [[ "$*" == *"--dry-run"* ]]; then
  DRY_RUN=true
  echo "[DRY RUN] Vercel validate script initialized. No actions will be executed."
fi
if ! $DRY_RUN; then
  node "$ENV_LOADER"
  npx vercel --confirm --cwd app/frontend
else
  echo "[DRY RUN] Vercel validation skipped."
fi
