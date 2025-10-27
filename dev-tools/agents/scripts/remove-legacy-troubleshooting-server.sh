#!/bin/bash
# filepath: dev-tools/agents/scripts/remove-legacy-troubleshooting-server.sh
set -euo pipefail

echo "🔍 Checking for references to supabase-troubleshooting-server.js..."

# Search for references (excluding this script and git history)
REFERENCES=$(grep -r "supabase-troubleshooting-server" \
  --exclude-dir=.git \
  --exclude-dir=node_modules \
  --exclude="*.log" \
  --exclude="remove-legacy-troubleshooting-server.sh" \
  . 2>/dev/null || true)

if [ -n "$REFERENCES" ]; then
  echo "❌ Found references to legacy troubleshooting server:"
  echo "$REFERENCES"
  echo ""
  echo "Please update these references to observability-server.js before removal."
  exit 1
fi

echo "✅ No active references found."
echo "📝 Archiving supabase-troubleshooting-server.js..."

# Create archive directory
ARCHIVE_DIR="dev-tools/workspace/archive/legacy-mcp-servers"
mkdir -p "$ARCHIVE_DIR"

# Move file to archive
if [ -f "dev-tools/agents/mcp-servers/supabase-troubleshooting-server.js" ]; then
  mv "dev-tools/agents/mcp-servers/supabase-troubleshooting-server.js" \
     "$ARCHIVE_DIR/supabase-troubleshooting-server.js.$(date +%Y%m%d)"
  echo "✅ Archived to $ARCHIVE_DIR"
else
  echo "⚠️  File not found (may have already been removed)"
fi

# Update coverage log
COVERAGE_FILE="dev-tools/workspace/context/session_store/coverage.md"
echo "" >> "$COVERAGE_FILE"
echo "## $(date +%Y-%m-%d): Legacy Troubleshooting Server Removed" >> "$COVERAGE_FILE"
echo "" >> "$COVERAGE_FILE"
echo "- Archived \`supabase-troubleshooting-server.js\` after migrating all tools to \`observability-server.js\`" >> "$COVERAGE_FILE"
echo "- All Supabase diagnostics now consolidated with OpenTelemetry tracing and Highlight.io error reporting" >> "$COVERAGE_FILE"
echo "- Updated active-registry.json and package.json to reference observability-server exclusively" >> "$COVERAGE_FILE"

echo "✅ Coverage log updated"
echo "🎉 Legacy server removal complete"
