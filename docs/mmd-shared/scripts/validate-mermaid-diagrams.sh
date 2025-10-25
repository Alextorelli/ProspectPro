#!/usr/bin/env bash
set -euo pipefail
npm run docs:prepare
npm run lint -- docs/app/diagrams docs/dev-tools/diagrams docs/integration/diagrams docs/shared/mermaid
