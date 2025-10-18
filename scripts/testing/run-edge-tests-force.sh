#!/bin/bash
set -euo pipefail

REPO_ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)
SUPABASE_CLI_VERSION="${SUPABASE_CLI_VERSION:-1.125.3}"

cd "$REPO_ROOT"
source "$REPO_ROOT/scripts/testing/test-env.local.sh" --diagnose

deno test --allow-all supabase/functions/tests/

(
	cd "$REPO_ROOT/supabase"
	npx --yes "supabase@${SUPABASE_CLI_VERSION}" functions logs --since=5m
)
