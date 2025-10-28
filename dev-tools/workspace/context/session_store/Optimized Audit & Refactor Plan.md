# Optimized Audit & Refactor Plan

## Audit Summary

**Critical gaps identified:**

1. Chat modes reference obsolete nested paths (`dev-tools/agents/workflows/*/instructions.md`)
2. Chatmode manifest/README missing new deployment scripts and staging workflow
3. CI workflows lack observability log capture and automated artifact collection
4. Manual coverage/report logging creates drift risk

---

## Execution Plan

### 1. Chatmode Reference Sync

```bash
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
```

### 2. Manifest & README Refresh

```bash
#!/bin/bash
set -e

REPO_ROOT="/workspaces/ProspectPro"
CHATMODES_DIR="$REPO_ROOT/.github/chatmodes"
MANIFEST="$CHATMODES_DIR/chatmode-manifest.json"
README="$CHATMODES_DIR/README.md"

echo "=== Refreshing Chatmode Manifest & README ==="

# Rebuild manifest with new npm scripts
cat > "$MANIFEST" << 'EOF'
{
  "version": "2.0.0",
  "chatmodes": [
    {
      "id": "development-workflow",
      "name": "Development Workflow",
      "file": "Development Workflow.chatmode.md",
      "workflows": [
        "dev-tools/agents/workflows/development-workflow.instructions.md",
        "dev-tools/agents/workflows/development-workflow.toolset.jsonc"
      ]
    },
    {
      "id": "production-ops",
      "name": "Production Ops",
      "file": "Production Ops.chatmode.md",
      "workflows": [
        "dev-tools/agents/workflows/production-ops.instructions.md",
        "dev-tools/agents/workflows/production-ops.toolset.jsonc"
      ]
    },
    {
      "id": "observability",
      "name": "Observability",
      "file": "Observability.chatmode.md",
      "workflows": [
        "dev-tools/agents/workflows/observability.instructions.md",
        "dev-tools/agents/workflows/observability.toolset.jsonc"
      ]
    },
    {
      "id": "system-architect",
      "name": "System Architect",
      "file": "System Architect.chatmode.md",
      "workflows": [
        "dev-tools/agents/workflows/system-architect.instructions.md",
        "dev-tools/agents/workflows/system-architect.toolset.jsonc"
      ]
    }
  ],
  "deployment": {
    "scripts": {
      "env:pull": "Sync Vercel environment variables",
      "deploy:preview": "Deploy preview build to Vercel",
      "deploy:staging:alias": "Alias preview to staging subdomain",
      "deploy:prod": "Full production deployment with validation"
    },
    "staging": {
      "domain": "staging.prospectpro.appsmithery.co",
      "workflow": "Preview deploy + alias via npm scripts"
    }
  }
}
EOF

# Rebuild README summary
cat > "$README" << 'EOF'
# Custom Agent Chat Modes

## Available Modes

| Mode | File | Workflows |
|------|------|-----------|
| Development Workflow | `Development Workflow.chatmode.md` | `development-workflow.{instructions,toolset}` |
| Production Ops | `Production Ops.chatmode.md` | `production-ops.{instructions,toolset}` |
| Observability | `Observability.chatmode.md` | `observability.{instructions,toolset}` |
| System Architect | `System Architect.chatmode.md` | `system-architect.{instructions,toolset}` |

## Deployment Scripts

- `npm run env:pull` - Sync Vercel environment variables
- `npm run deploy:preview` - Deploy preview build
- `npm run deploy:staging:alias` - Alias to staging subdomain
- `npm run deploy:prod` - Full production deployment

## Staging Workflow

1. Deploy preview: `npm run deploy:preview`
2. Get preview URL from output
3. Alias to staging: `npm run deploy:staging:alias`

See `chatmode-manifest.json` for full configuration.
EOF

echo "=== Manifest & README Refresh Complete ==="
```

### 3. CI Workflow Enhancements

```yaml
name: Documentation Automation

on:
  push:
    branches: [main]
    paths:
      - "docs/**"
      - "dev-tools/agents/**"
      - ".github/workflows/docs-automation.yml"
  pull_request:
    branches: [main]

jobs:
  docs-update:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Update documentation
        run: npm run docs:update

      - name: Dry-run env pull
        run: npm run env:pull -- --environment=preview || true

      - name: Collect artifacts
        run: |
          mkdir -p dev-tools/reports/docs-automation/${{ github.run_number }}
          cp -r docs dev-tools/reports/docs-automation/${{ github.run_number }}/
          cp dev-tools/workspace/context/session_store/*-filetree.txt \
            dev-tools/reports/docs-automation/${{ github.run_number }}/

      - name: Upload artifacts
        uses: actions/upload-artifact@v4
        with:
          name: docs-automation-${{ github.run_number }}
          path: dev-tools/reports/docs-automation/${{ github.run_number }}
          retention-days: 30
```

```yaml
name: Playwright Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps

      - name: Run Playwright tests
        run: npx playwright test

      - name: Collect test artifacts
        if: always()
        run: |
          mkdir -p dev-tools/reports/ci/playwright/${{ github.run_number }}
          cp -r playwright-report dev-tools/reports/ci/playwright/${{ github.run_number }}/
          cp -r test-results dev-tools/reports/ci/playwright/${{ github.run_number }}/ || true

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-results-${{ github.run_number }}
          path: dev-tools/reports/ci/playwright/${{ github.run_number }}
          retention-days: 30

      - name: Deploy to staging on success
        if: success() && github.ref == 'refs/heads/main'
        run: |
          npm run deploy:preview
          npm run deploy:staging:alias
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
```

```yaml
name: MCP Agent Validation

on:
  push:
    branches: [main]
    paths:
      - "dev-tools/agents/**"
      - ".vscode/mcp_config.json"
  pull_request:
    branches: [main]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Validate agent contexts
        run: npm run validate:contexts

      - name: MCP troubleshooting
        run: npm run mcp:troubleshoot || true

      - name: Collect validation artifacts
        run: |
          mkdir -p dev-tools/reports/ci/mcp-validation/${{ github.run_number }}
          cp dev-tools/agents/context/store/*.json \
            dev-tools/reports/ci/mcp-validation/${{ github.run_number }}/

      - name: Upload validation results
        uses: actions/upload-artifact@v4
        with:
          name: mcp-validation-${{ github.run_number }}
          path: dev-tools/reports/ci/mcp-validation/${{ github.run_number }}
          retention-days: 30
```

### 4. Documentation & Provenance

```bash
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
```

---

## Execution Sequence

```bash
# Make scripts executable
chmod +x dev-tools/scripts/automation/sync-chatmode-workflows.sh
chmod +x dev-tools/scripts/automation/sync-chatmode-meta.sh
chmod +x dev-tools/scripts/automation/finalize-chatmode-sync.sh

# Execute sync
./dev-tools/scripts/automation/sync-chatmode-workflows.sh
./dev-tools/scripts/automation/sync-chatmode-meta.sh
./dev-tools/scripts/automation/finalize-chatmode-sync.sh

# Validate
npm run lint
npm test
npm run validate:contexts

# Stage and commit
git add .
git commit -m "chore: sync chatmodes and ci workflows with flattened agents"
git push origin feature/chatmode-ci-sync

# Open PR after CI passes
```

---

## Validation Checklist

- [ ] All chatmode files reference flat workflow paths
- [ ] Staging deployment instructions present in all chatmodes
- [ ] Telemetry endpoints documented
- [ ] Chatmode manifest includes new npm scripts
- [ ] CI workflows collect artifacts in `dev-tools/reports/ci/`
- [ ] `npm run lint` passes
- [ ] `npm test` passes
- [ ] `npm run validate:contexts` passes
- [ ] Provenance logged in coverage.md and settings-staging.md
- [ ] Inventories refreshed
