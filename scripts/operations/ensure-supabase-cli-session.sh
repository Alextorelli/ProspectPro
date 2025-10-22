token_authenticated="false"

#!/bin/bash
# Thin wrapper: always source the canonical script
CANONICAL_SCRIPT="$(git rev-parse --show-toplevel)/dev-tools/scripts/shell/ensure-supabase-cli-session.sh"
if [ -f "$CANONICAL_SCRIPT" ]; then
	source "$CANONICAL_SCRIPT" "$@"
else
	echo "[ERROR] Canonical Supabase CLI session script not found: $CANONICAL_SCRIPT" >&2
fi
