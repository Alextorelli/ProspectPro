#!/usr/bin/env bash
# Vercel Deployment Status Probe
# Usage: ./vercel-status-check.sh
set -euo pipefail

REPO_ROOT=$(git rev-parse --show-toplevel)
cd "$REPO_ROOT"

if [[ ! -f .env.vercel ]]; then
  echo "[WARN] .env.vercel missing. Running 'vercel env pull .env.vercel'..."
  npx --yes vercel@latest env pull .env.vercel
fi

mkdir -p dev-tools/context/session_store/deployments
REPORT_FILE="dev-tools/context/session_store/deployments/vercel-status-$(date +%Y%m%d-%H%M%S).json"

npx --yes vercel@latest whoami > /dev/null
npx --yes vercel@latest status --json > "$REPORT_FILE"
echo "Vercel status saved to $REPORT_FILE"