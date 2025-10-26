#!/usr/bin/env bash
set -euo pipefail
node docs/mmd-shared/scripts/check-tags.mjs
npm run lint -- docs/app/diagrams docs/dev-tools/diagrams docs/integration/diagrams docs/shared/mermaid
