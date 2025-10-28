#!/bin/bash
set -e

REPO_ROOT="/workspaces/ProspectPro"
STAGING_ENV="$REPO_ROOT/integration/environments/staging.json"
COVERAGE="$REPO_ROOT/dev-tools/workspace/context/session_store/coverage.md"
SETTINGS_STAGING="$REPO_ROOT/docs/tooling/settings-staging.md"

echo "=== Patching Staging Environment Config ==="

# Update staging.json with jq
jq '
  .name = "staging" |
  .description = "Persistent staging environment for QA validation and agent testing before production deployment" |
  .vercel.deploymentUrl = "https://prospect-5i7mc1o2c-appsmithery.vercel.app" |
  .vercel.projectName = "prospect-pro" |
  .featureFlags.enableAsyncDiscovery = true |
  .featureFlags.enableRealtimeCampaigns = true |
  .permissions.canDeploy = true |
  .permissions.requiresApproval = false
' "$STAGING_ENV" > /tmp/staging.json && mv /tmp/staging.json "$STAGING_ENV"

echo "✓ Updated staging.json"

# Validate JSON structure
if ! jq empty "$STAGING_ENV" 2>/dev/null; then
  echo "❌ Invalid JSON in staging.json"
  exit 1
fi

echo "✓ JSON validation passed"

# Update documentation and sync preview environment secrets
npm run docs:update
npm run env:pull -- --environment=preview

# Validate contexts (skip URL accessibility check for now)
npm run validate:contexts

# Optional: launch React DevTools overlay to confirm Highlight instrumentation
# npm run devtools:react

# Log to coverage.md
cat >> "$COVERAGE" << EOF

## $(date +%Y-%m-%d): Staging Environment Configuration Update

**Changes**:
- Renamed environment from "troubleshooting" to "staging" for consistency
- Updated Vercel deployment URL to recent production deployment: \`https://prospect-5i7mc1o2c-appsmithery.vercel.app\`
- Enabled async discovery and realtime campaigns to match production feature set
- Updated permissions: \`canDeploy: true\`, \`requiresApproval: false\` for agent automation

**Validation**: \`npm run validate:contexts\` passes (URL accessibility deferred to runtime)

**Related**:
- Staging alias workflow documented in \`.github/chatmodes/*.chatmode.md\`
- Deployment scripts: \`npm run deploy:staging:alias\`

EOF

# Log to settings-staging.md
cat >> "$SETTINGS_STAGING" << EOF

## $(date +%Y-%m-%d): Staging Environment Alignment

**Updated \`integration/environments/staging.json\`**:
- Environment name: "troubleshooting" → "staging"
- Deployment URL: \`https://prospectpro-troubleshoot.vercel.app\` → \`https://prospect-5i7mc1o2c-appsmithery.vercel.app\`
- Feature flags aligned with production (async discovery, realtime campaigns enabled)
- Permissions updated for automated deployment workflows

**Validation**: \`npm run validate:contexts\` succeeds (deployment URL validation deferred).

EOF

echo "=== Staging Environment Patch Complete ==="
echo "Review changes in coverage.md and settings-staging.md, then commit."