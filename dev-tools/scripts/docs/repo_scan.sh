#!/usr/bin/env bash
set -euo pipefail

# Thin wrapper to maintain backward compatibility for legacy automation hooks.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [[ -z "${ROOT_DIR:-}" ]]; then
	if git_root=$(git -C "$SCRIPT_DIR" rev-parse --show-toplevel 2>/dev/null); then
		ROOT_DIR="$git_root"
	else
		ROOT_DIR="$SCRIPT_DIR"
	fi
fi

exec "$ROOT_DIR/dev-tools/automation/ci-cd/repo_scan.sh" "$@"
