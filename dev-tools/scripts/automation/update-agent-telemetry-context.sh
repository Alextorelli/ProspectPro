#!/bin/bash
# update-agent-telemetry-context.sh - Sync observability endpoints across agent contexts

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
STORE_DIR="$REPO_ROOT/dev-tools/agents/context/store"
OBSERVABILITY_JSON="$STORE_DIR/observability.json"
COVERAGE_FILE="$REPO_ROOT/dev-tools/workspace/context/session_store/coverage.md"

echo "Syncing observability endpoints across agent contexts..."

# Extract endpoints from observability.json
ENDPOINTS=$(node -e "
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('$OBSERVABILITY_JSON', 'utf8'));
const memory = data.longTermMemory || [];
const endpoints = memory.find(item => item.topic === 'observabilityEndpoints')?.payload || {};
console.log(JSON.stringify(endpoints));
")

# Update each agent context file
for json_file in "$STORE_DIR"/*.json; do
  if [[ "$json_file" == "$OBSERVABILITY_JSON" ]]; then continue; fi
  echo "Updating $json_file..."
  node -e "
  const fs = require('fs');
  const file = '$json_file';
  const endpoints = $ENDPOINTS;
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (!data.longTermMemory) data.longTermMemory = [];
  let endpointItem = data.longTermMemory.find(item => item.topic === 'observabilityEndpoints');
  if (!endpointItem) {
    endpointItem = { id: 'obs-endpoints-' + Date.now(), topic: 'observabilityEndpoints', payload: endpoints, createdAt: new Date().toISOString(), lastAccessed: new Date().toISOString(), environment: data.metadata.environment, tags: ['observability'] };
    data.longTermMemory.push(endpointItem);
  } else {
    endpointItem.payload = endpoints;
    endpointItem.lastAccessed = new Date().toISOString();
  }
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
  "
done

# Log to coverage.md
echo "- $(date +%Y-%m-%d): Synced observability endpoints across all agent contexts from observability.json source of truth." >> "$COVERAGE_FILE"

echo "Observability endpoints synced."