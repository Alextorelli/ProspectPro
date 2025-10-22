#!/bin/bash
set -e

# Archive legacy assets in one batch move
ARCHIVE_DIR="docs/tooling/history/round-1"
mkdir -p "$ARCHIVE_DIR"

# List of files to archive
FILES_TO_ARCHIVE=(
  "scripts/tooling/preflight-checklist.sh"
  "scripts/diagnostics/validate-supabase-architecture.sh"
  "docs/tooling/research/devops-environment-taxonomy.md"
)

for FILE in "${FILES_TO_ARCHIVE[@]}"; do
  if [ -e "$FILE" ]; then
    git mv "$FILE" "$ARCHIVE_DIR/"
  fi
done

echo "Legacy assets archived to $ARCHIVE_DIR."
