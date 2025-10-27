#!/bin/bash
# promote-e2e-docs.sh - Promote E2E workplan to docs and archive temp plan

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="/workspaces/ProspectPro"
WORKPLAN_FILE="$REPO_ROOT/dev-tools/workspace/context/session_store/e2e-playwright-reactdevtools-workplan.md"
DOCS_FILE="$REPO_ROOT/docs/dev-tools/testing/playwright-react-devtools.md"
ARCHIVE_DIR="$REPO_ROOT/dev-tools/workspace/context/session_store/archive"

echo "Promoting E2E workplan to docs..."

if [[ ! -f "$WORKPLAN_FILE" ]]; then
  echo "ERROR: Workplan file $WORKPLAN_FILE not found"
  exit 1
fi

# Copy to docs
cp "$WORKPLAN_FILE" "$DOCS_FILE"

# Archive with timestamp
mkdir -p "$ARCHIVE_DIR"
ARCHIVE_FILE="$ARCHIVE_DIR/e2e-playwright-reactdevtools-workplan-$(date +%Y%m%d-%H%M%S).md"
cp "$WORKPLAN_FILE" "$ARCHIVE_FILE"

echo "E2E docs promoted and archived."