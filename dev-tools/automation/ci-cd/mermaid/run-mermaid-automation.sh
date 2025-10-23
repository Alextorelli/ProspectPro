#!/usr/bin/env bash
set -euo pipefail
node integration/platform/github/docs-automation/generate-mermaid-diagrams.js
git add docs/app/diagrams docs/dev-tools/diagrams docs/integration/diagrams docs/shared/mermaid
if ! git diff --cached --quiet; then
  git commit -m "docs: update mermaid diagrams via automation"
fi
