#!/bin/bash
# enhance-production-ops-context.sh - Add deployment checklists to production-ops context

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="/workspaces/ProspectPro"
TEMPLATE_FILE="$REPO_ROOT/dev-tools/agents/workflows/templates/deployment-checklist-template.md"
PROD_OPS_JSON="$REPO_ROOT/dev-tools/agents/context/store/production-ops.json"

echo "Enhancing production-ops context with deployment checklists..."

if [[ ! -f "$TEMPLATE_FILE" ]]; then
  echo "ERROR: Template file $TEMPLATE_FILE not found"
  exit 1
fi

CHECKLIST=$(cat "$TEMPLATE_FILE")

# Write checklist to temp file for node to read
TEMP_CHECKLIST="/tmp/checklist_$$.md"
echo "$CHECKLIST" > "$TEMP_CHECKLIST"

# Update production-ops.json
node -e "
const fs = require('fs');
const file = '$PROD_OPS_JSON';
const checklist = fs.readFileSync('$TEMP_CHECKLIST', 'utf8');
const data = JSON.parse(fs.readFileSync(file, 'utf8'));
if (!data.longTermMemory) data.longTermMemory = [];
let checklistItem = data.longTermMemory.find(item => item.topic === 'deploymentChecklist');
if (!checklistItem) {
  checklistItem = { id: 'deploy-checklist-' + Date.now(), topic: 'deploymentChecklist', payload: { checklist: checklist }, createdAt: new Date().toISOString(), lastAccessed: new Date().toISOString(), environment: data.metadata.environment, tags: ['deployment'] };
  data.longTermMemory.push(checklistItem);
} else {
  checklistItem.payload.checklist = checklist;
  checklistItem.lastAccessed = new Date().toISOString();
}
fs.writeFileSync(file, JSON.stringify(data, null, 2));
"

# Clean up
rm "$TEMP_CHECKLIST"

echo "Production-ops context enhanced."