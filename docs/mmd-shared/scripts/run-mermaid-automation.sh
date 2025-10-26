#!/usr/bin/env bash

set -euo pipefail


# Honor --validate flag to avoid infinite pre-commit loops
VALIDATE_ONLY=false
if [ "${1:-}" = "--validate" ] || [ "${1:-}" = "validate" ]; then
  VALIDATE_ONLY=true
fi

# 1. Regenerate index and live-tooling-list
if [ "$VALIDATE_ONLY" = "false" ]; then
  node docs/mmd-shared/scripts/update-indexes.mjs
fi

# 2. Generate all diagrams
if [ "$VALIDATE_ONLY" = "false" ]; then
  node docs/mmd-shared/scripts/generate-diagrams.mjs
fi

# 3. Validate diagrams
bash docs/mmd-shared/scripts/validate-mermaid-diagrams.sh

# 4. Stage and commit if there are changes (CI only)
if [ "$VALIDATE_ONLY" = "false" ] && { [ "${CI:-}" = "true" ] || [ "${MERMAID_AUTOCOMMIT:-}" = "1" ]; }; then
  git add docs/diagrams docs/mmd-shared dev-tools/workspace/context/session_store/live-tooling-list.txt
  if ! git diff --cached --quiet; then
    git commit -m "docs: update mermaid diagrams and indexes via automation"
  fi
fi
