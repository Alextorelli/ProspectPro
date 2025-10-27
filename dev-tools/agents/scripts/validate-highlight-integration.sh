#!/bin/bash
# filepath: dev-tools/agents/scripts/validate-highlight-integration.sh
set -euo pipefail

echo "🔍 Validating Highlight.io Integration..."

# Load environment
if [ ! -f ".env.agent.local" ]; then
  echo "❌ .env.agent.local not found. Copy from .env.agent.example and populate."
  exit 1
fi

source .env.agent.local

# Check required variables
MISSING_VARS=()
[ -z "${HIGHLIGHT_PROJECT_ID:-}" ] && MISSING_VARS+=("HIGHLIGHT_PROJECT_ID")
[ -z "${HIGHLIGHT_API_KEY:-}" ] && MISSING_VARS+=("HIGHLIGHT_API_KEY")

if [ ${#MISSING_VARS[@]} -gt 0 ]; then
  echo "❌ Missing required Highlight.io credentials:"
  printf '  - %s\n' "${MISSING_VARS[@]}"
  echo ""
  echo "Add these to .env.agent.local before running validation."
  exit 1
fi

echo "✅ Highlight.io credentials configured"
echo ""
echo "🧪 Running failing CI/CD test to trigger error reporting..."

# Run a test that should fail (using non-existent suite)
node dev-tools/agents/mcp-servers/observability-server.js <<EOF || true
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "validate_ci_cd_suite",
    "arguments": {
      "suite": "intentionally_failing_test"
    }
  }
}
EOF

echo ""
echo "✅ Test triggered. Check Highlight.io dashboard:"
echo "   https://app.highlight.io/${HIGHLIGHT_PROJECT_ID}/errors"
echo ""
echo "Expected: Error reported with suite='intentionally_failing_test'"
