#!/bin/bash
# ProspectPro MCP Server Audit Script
set -e

REPO_ROOT="/workspaces/ProspectPro"
MCP_DIR="$REPO_ROOT/dev-tools/agents/mcp-servers"
REPORT_DIR="$REPO_ROOT/dev-tools/reports/validation"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

echo "=== MCP Server Audit ==="

mkdir -p "$REPORT_DIR"

# Generate inventory
cat > "$REPORT_DIR/mcp-audit-$TIMESTAMP.md" << 'EOF'
# MCP Server Audit Report

## Active Servers (per active-registry.json)
EOF

if [ -f "$MCP_DIR/active-registry.json" ]; then
  jq -r '.servers | keys[]' "$MCP_DIR/active-registry.json" >> "$REPORT_DIR/mcp-audit-$TIMESTAMP.md"
else
  echo "(active-registry.json not found)" >> "$REPORT_DIR/mcp-audit-$TIMESTAMP.md"
fi

cat >> "$REPORT_DIR/mcp-audit-$TIMESTAMP.md" << 'EOF'

## Filesystem Inventory
EOF

find "$MCP_DIR" -name "*.js" -o -name "*.ts" | grep -v node_modules | sort >> "$REPORT_DIR/mcp-audit-$TIMESTAMP.md"

cat >> "$REPORT_DIR/mcp-audit-$TIMESTAMP.md" << 'EOF'

## Deprecated Artifacts
- [ ] observability-server.js (superseded by client-service-layer telemetry)
- [ ] tool-reference.md (manual doc, should be auto-generated)
- [ ] MCP-package.json (redundant with package.json)
- [ ] test-results.json (stale, should use dev-tools/reports/)

## Consolidation Targets
- Utility server: Keep as canonical `utility-server/`
- Environments: Keep development.js, production.js; archive troubleshooting.js
- Package locks: Single canonical lock per package

EOF

echo "✓ Audit report: $REPORT_DIR/mcp-audit-$TIMESTAMP.md"