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