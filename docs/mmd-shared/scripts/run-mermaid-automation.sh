#!/usr/bin/env bash

set -euo pipefail

# 1. Regenerate index and live-tooling-list
node docs/mmd-shared/scripts/update-indexes.mjs

# 2. Generate all diagrams
node docs/mmd-shared/scripts/generate-diagrams.mjs

# 3. Validate diagrams
bash docs/mmd-shared/scripts/validate-mermaid-diagrams.sh

# 4. Stage and commit if there are changes (CI only)
if [ "${CI:-}" = "true" ] || [ "${MERMAID_AUTOCOMMIT:-}" = "1" ]; then
  git add docs/diagrams docs/mmd-shared dev-tools/workspace/context/session_store/live-tooling-list.txt
  if ! git diff --cached --quiet; then
    git commit -m "docs: update mermaid diagrams and indexes via automation"
  fi
fi
