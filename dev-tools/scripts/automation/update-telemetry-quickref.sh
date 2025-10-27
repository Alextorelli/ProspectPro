#!/bin/bash
# update-telemetry-quickref.sh - Inject telemetry quick reference into copilot-instructions.md

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="/workspaces/ProspectPro"
OBSERVABILITY_JSON="$REPO_ROOT/dev-tools/agents/context/store/observability.json"
COPILOT_INSTRUCTIONS="$REPO_ROOT/.github/copilot-instructions.md"

echo "REPO_ROOT: $REPO_ROOT"
echo "OBSERVABILITY_JSON: $OBSERVABILITY_JSON"

echo "Updating telemetry quick reference in $COPILOT_INSTRUCTIONS..."

# Extract endpoints from observability.json using node
TELEMETRY_SECTION=$(node -e "
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('$OBSERVABILITY_JSON', 'utf8'));
const memory = data.longTermMemory || [];
const endpoints = memory.find(item => item.topic === 'observabilityEndpoints')?.payload || {};
let section = '## Observability & Telemetry\n\n';
section += '### Endpoints\n\n';
section += '- **Highlight.io**: ' + (endpoints.highlight || 'Not configured') + '\n';
section += '- **Jaeger**: ' + (endpoints.jaeger || 'Not configured') + '\n';
section += '- **Vercel**: ' + (endpoints.vercel || 'Not configured') + '\n';
console.log(section);
")

# Replace the section in copilot-instructions.md
# Use sed to replace between markers
sed -i '/## Observability & Telemetry/,/## /{
  /## Observability & Telemetry/r /dev/stdin
  d
}' "$COPILOT_INSTRUCTIONS" <<< "$TELEMETRY_SECTION"

echo "Telemetry quick reference updated."