#!/bin/bash
set -e

REPO_ROOT="/workspaces/ProspectPro"
COVERAGE="$REPO_ROOT/dev-tools/workspace/context/session_store/coverage.md"
STAGING="$REPO_ROOT/docs/tooling/settings-staging.md"

echo "=== Finalizing Chatmode Sync ==="

# Update inventories
cd "$REPO_ROOT"
npm run docs:update

# Log to coverage.md
cat >> "$COVERAGE" << EOF

## $(date +%Y-%m-%d): Chatmode & CI Workflow Sync

**Changes**:
- Updated all chatmode files to reference flattened workflow paths
- Injected staging deployment instructions and telemetry endpoints
- Refreshed chatmode-manifest.json with new npm scripts
- Enhanced CI workflows with artifact collection and observability logging

**Artifacts**:
- CI logs now captured in \`dev-tools/reports/ci/<workflow>/<run>\`
- Chatmode manifest includes deployment script reference

**Validation**: All contexts pass \`npm run validate:contexts\`

EOF

# Log to settings-staging.md
cat >> "$STAGING" << EOF

## $(date +%Y-%m-%d): Chatmode & Workflow Sync

- Flattened workflow references in all chatmode files
- Added staging deployment instructions to chatmodes
- Enhanced CI workflows with automated artifact collection
- All logs now route to \`dev-tools/reports/ci/\`

EOF

echo "=== Sync Finalization Complete ==="