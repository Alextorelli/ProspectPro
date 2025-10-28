#!/bin/bash
set -e

REPO_ROOT="/workspaces/ProspectPro"
CHATMODES_DIR="$REPO_ROOT/.github/chatmodes"
OBS_JSON="$REPO_ROOT/dev-tools/agents/context/store/observability.json"

echo "=== Syncing Chatmode Workflow References ==="

# Update workflow path references
for chatmode in "$CHATMODES_DIR"/*.chatmode.md; do
  [[ ! -f "$chatmode" ]] && continue
  echo "Processing: $(basename "$chatmode")"
  
  sed -i -E \
    's|dev-tools/agents/workflows/([^/]+)/(instructions\.md|toolset\.jsonc|config\.json)|dev-tools/agents/workflows/\1.\2|g' \
    "$chatmode"
done

# Inject staging alias instructions and telemetry endpoints
STAGING_SNIPPET=$(cat <<'EOF'

## Staging Deployment

Deploy to staging subdomain:
\`\`\`bash
npm run deploy:preview          # Get preview URL
npm run deploy:staging:alias    # Alias to staging.prospectpro.appsmithery.co
\`\`\`

## Observability Endpoints

EOF
)

# Extract telemetry endpoints from observability.json
TELEMETRY=$(node -e "
const obs = require('$OBS_JSON');
console.log('- **Highlight.io**: ' + obs.tools.highlight.projectId);
console.log('- **Jaeger**: ' + obs.tools.jaeger.endpoint);
console.log('- **Vercel Analytics**: ' + obs.tools.vercel.analyticsUrl);
")

for chatmode in "$CHATMODES_DIR"/*.chatmode.md; do
  [[ ! -f "$chatmode" ]] && continue
  
  # Check if staging section already exists
  if ! grep -q "## Staging Deployment" "$chatmode"; then
    echo "$STAGING_SNIPPET" >> "$chatmode"
    echo "$TELEMETRY" >> "$chatmode"
  fi
done

echo "=== Chatmode Sync Complete ==="