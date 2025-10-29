#!/bin/bash
set -e

REPO_ROOT="/workspaces/ProspectPro"
cd "$REPO_ROOT"

echo "=== Validating Testing Prerequisites ==="

# Check Playwright browsers
if ! npx playwright --version &> /dev/null; then
  echo "❌ Playwright not installed"
  exit 1
fi
echo "✓ Playwright installed"

# Check Vitest
if ! npx vitest --version &> /dev/null; then
  echo "❌ Vitest not installed"
  exit 1
fi
echo "✓ Vitest installed"

# Check Deno for edge functions
if ! deno --version &> /dev/null; then
  echo "❌ Deno not installed"
  exit 1
fi
echo "✓ Deno installed"

# Verify environment files exist
for env_file in integration/environments/{development,staging,production}.json; do
  if [[ ! -f "$env_file" ]]; then
    echo "❌ Missing: $env_file"
    exit 1
  fi
done
echo "✓ Environment configs present"

echo "=== Prerequisites Valid ==="