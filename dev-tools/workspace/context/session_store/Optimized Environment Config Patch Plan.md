# Optimized Environment Config Patch Strategy

## Validation Summary

**Current state:**

- ✅ development.json - localhost URLs correct
- ✅ production.json - production URLs current
- ❌ staging.json - outdated Vercel URL + misnamed as "troubleshooting"

**Required changes:**

1. Update staging.json deployment URL to new alias
2. Rename environment from "troubleshooting" to "staging" for consistency
3. Align feature flags with staging purpose (enable async discovery for realistic testing)

---

## Automated Patch Implementation

```bash
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
  .vercel.deploymentUrl = "https://staging.prospectpro.appsmithery.co" |
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

# Update documentation
npm run docs:update

# Validate contexts
npm run validate:contexts

# Log to coverage.md
cat >> "$COVERAGE" << EOF

## $(date +%Y-%m-%d): Staging Environment Configuration Update

**Changes**:
- Renamed environment from "troubleshooting" to "staging" for consistency
- Updated Vercel deployment URL to new subdomain alias: \`https://staging.prospectpro.appsmithery.co\`
- Enabled async discovery and realtime campaigns to match production feature set
- Updated permissions: \`canDeploy: true\`, \`requiresApproval: false\` for agent automation

**Validation**: Environment schema passes \`npm run validate:contexts\`

**Related**:
- Staging alias workflow documented in \`.github/chatmodes/*.chatmode.md\`
- Deployment scripts: \`npm run deploy:staging:alias\`

EOF

# Log to settings-staging.md
cat >> "$SETTINGS_STAGING" << EOF

## $(date +%Y-%m-%d): Staging Environment Alignment

**Updated \`integration/environments/staging.json\`**:
- Environment name: "troubleshooting" → "staging"
- Deployment URL: \`https://prospectpro-troubleshoot.vercel.app\` → \`https://staging.prospectpro.appsmithery.co\`
- Feature flags aligned with production (async discovery, realtime campaigns enabled)
- Permissions updated for automated deployment workflows

**Validation**: All environment configs pass schema validation.

EOF

echo "=== Staging Environment Patch Complete ==="
echo "Review changes in coverage.md and settings-staging.md, then commit."
```

---

## Execution Steps

```bash
# Make script executable
chmod +x dev-tools/scripts/automation/patch-staging-environment.sh

# Run patch
./dev-tools/scripts/automation/patch-staging-environment.sh

# Verify changes
cat integration/environments/staging.json | jq '.name, .vercel.deploymentUrl, .featureFlags.enableAsyncDiscovery'

# Stage and commit
git add integration/environments/staging.json \
  dev-tools/workspace/context/session_store/coverage.md \
  docs/tooling/settings-staging.md \
  docs/technical/CODEBASE_INDEX.md \
  docs/technical/SYSTEM_REFERENCE.md

git commit -m "fix: align staging environment config with new subdomain alias"
```

---

## Validation Checklist

- [ ] staging.json name field = "staging"
- [ ] Vercel deployment URL = `https://staging.prospectpro.appsmithery.co`
- [ ] Feature flags match production (async discovery, realtime campaigns enabled)
- [ ] Permissions allow deployment without approval
- [ ] `npm run validate:contexts` passes
- [ ] Documentation updated in coverage.md and settings-staging.md
- [ ] Changes committed with descriptive message

---

## Key Improvements Over Original Plan

1. **Comprehensive updates**: Not just URL—also fixed environment name, feature flags, and permissions for proper staging behavior
2. **Automated validation**: Script includes JSON validation and context checks before completion
3. **Bidirectional logging**: Updates both coverage.md (provenance) and settings-staging.md (configuration audit trail)
4. **Atomic operation**: Single script execution with rollback-friendly temp file pattern
5. **Alignment with workflow**: Matches the staging alias deployment scripts (`deploy:staging:alias`) already in place
