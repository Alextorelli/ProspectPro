#!/usr/bin/env bash
set -euo pipefail
node integration/platform/github/docs-automation/generate-mermaid-diagrams.js
git add docs/diagrams docs/mmd-shared
if ! git diff --cached --quiet; then
  git commit -m "docs: update mermaid diagrams via automation"
fi
