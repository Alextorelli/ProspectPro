#!/usr/bin/env bash
# Supabase Log Pull Wrapper
# Usage: ./supabase-pull-logs.sh <function-slug> <since-time>
set -euo pipefail

# Guard: must run from repo root
REPO_ROOT=$(git rev-parse --show-toplevel)
cd "$REPO_ROOT"

if [[ $# -ne 2 ]]; then
  echo "Usage: $0 <function-slug> <since-time>"
  echo "Example: $0 business-discovery-background 24h"
  exit 1
fi

FUNC_SLUG="$1"
SINCE_TIME="$2"

source scripts/operations/ensure-supabase-cli-session.sh
mkdir -p dev-tools/workspace/context/session_store/diagnostics
LOG_FILE="dev-tools/workspace/context/session_store/diagnostics/${FUNC_SLUG}-$(date +%Y%m%d-%H%M%S).log"

cd supabase
npx --yes supabase@latest functions logs "$FUNC_SLUG" --since="$SINCE_TIME" > "../$LOG_FILE"
echo "Logs saved to $LOG_FILE"