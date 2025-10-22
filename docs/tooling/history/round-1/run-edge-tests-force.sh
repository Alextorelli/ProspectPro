#!/bin/bash
set -euo pipefail

REPO_ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)
SUPABASE_CLI_VERSION="${SUPABASE_CLI_VERSION:-2.51.0}"

supabase_cli_exec() {
	local cli_pkg="supabase@${SUPABASE_CLI_VERSION}"
	(
		cd "$REPO_ROOT/supabase" || exit 1
		if ! npx --yes "$cli_pkg" "$@"; then
			if [[ "$SUPABASE_CLI_VERSION" != "latest" ]]; then
				echo "⚠️ Supabase CLI ${SUPABASE_CLI_VERSION} unavailable, retrying with latest..." >&2
				npx --yes supabase@latest "$@"
			else
				exit 1
			fi
		fi
	)
}

cd "$REPO_ROOT"
source "$REPO_ROOT/scripts/testing/test-env.local.sh" --diagnose

deno test --allow-all app/backend/functions/tests/

supabase_cli_exec functions logs --since=5m
