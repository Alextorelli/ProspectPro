#!/bin/bash
# MCP-aware regression test suite for Dev Tools
set -euo pipefail

# Source participant routing helper
source ./scripts/automation/lib/participant-routing.sh

# Source environment loader
ENV_LOADER="$(git rev-parse --show-toplevel)/config/environment-loader.v2.js"
DRY_RUN=false
if [[ "$*" == *"--dry-run"* ]]; then
	DRY_RUN=true
	echo "[DRY RUN] DevTools regression script initialized. No actions will be executed."
fi

if ! $DRY_RUN; then
	# Select environment (no prompt in dry-run)
	node "$ENV_LOADER"
	# Test React DevTools startup
	npm run devtools:react
	# Test Vercel CLI validation
	npx vercel --confirm --cwd app/frontend
	# Test Supabase troubleshooting
	npm run mcp:start:troubleshooting
	# Test Redis observability (placeholder)
	echo "TODO: Add Redis observability checks"
else
	echo "[DRY RUN] React DevTools, Vercel, Supabase, Redis checks skipped."
fi

mkdir -p dev-tools/context/session_store/testing
REPORT="dev-tools/context/session_store/testing/devtools-regression-$(date +%Y%m%d-%H%M%S).log"
if ! $DRY_RUN; then
	echo "DevTools regression tests completed at $(date -u)" > "$REPORT"
else
	echo "[DRY RUN] DevTools regression tests simulated at $(date -u)" > "$REPORT"
fi
