#!/bin/bash
# Final hygiene sweep for repository cleanliness (Phase 05)
set -euo pipefail

# Remove unwanted files flagged by validate-ignore-config
rm -f tooling/scripts/node/validate-ignore-config.js tooling/scripts/shell/validate-ignore-config.js
rm -f scripts/testing/test-discovery-pipeline-mcp.sh scripts/testing/test-enrichment-chain-mcp.sh scripts/testing/test-export-flow-mcp.sh scripts/testing/test-full-stack-validation-mcp.sh
rm -f tooling/scripts/shell/test-auth-patterns.sh tooling/scripts/shell/test-background-tasks.sh tooling/scripts/shell/test-discovery-pipeline.sh tooling/scripts/shell/test-enrichment-chain.sh tooling/scripts/shell/test-env.local.sh tooling/scripts/shell/test-export-flow.sh tooling/scripts/shell/test-pdl-state-licensing.sh

# Confirm .vercelignore and .gitignore compliance
if npm run validate:ignores; then
  echo "Repository hygiene confirmed."
else
  echo "Repository hygiene issues remain."
  exit 1
fi
