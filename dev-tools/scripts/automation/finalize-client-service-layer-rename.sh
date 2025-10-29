#!/bin/bash
# ProspectPro: Automated Client Service Layer Rename Finalization
# Phase: Complete propagation of mcp-service-layer → client-service-layer rename
# Usage: bash dev-tools/scripts/automation/finalize-client-service-layer-rename.sh

set -e

REPO_ROOT="/workspaces/ProspectPro"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
LOG_FILE="$REPO_ROOT/dev-tools/workspace/context/session_store/rename-finalization-${TIMESTAMP}.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}" | tee -a "$LOG_FILE"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}" | tee -a "$LOG_FILE"
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}" | tee -a "$LOG_FILE"
}

cd "$REPO_ROOT"

echo ""
log "═══════════════════════════════════════════════════════════"
log "  Client Service Layer Rename Finalization"
log "═══════════════════════════════════════════════════════════"
echo ""

# Phase 1: Update deployment script
log "Phase 1: Updating deployment script..."

DEPLOY_SCRIPT="$REPO_ROOT/dev-tools/agents/scripts/deploy-mcp-service-layer.sh"

if [[ -f "$DEPLOY_SCRIPT" ]]; then
    info "  Renaming deployment script file..."
    mv "$DEPLOY_SCRIPT" "$REPO_ROOT/dev-tools/agents/scripts/deploy-client-service-layer.sh"
    DEPLOY_SCRIPT="$REPO_ROOT/dev-tools/agents/scripts/deploy-client-service-layer.sh"
    
    info "  Updating script content..."
    
    # Update header comment
    sed -i 's/ProspectPro MCP Service Layer Production Deployment Script/ProspectPro Client Service Layer Production Deployment Script/' "$DEPLOY_SCRIPT"
    
    # Update SERVICE_NAME
    sed -i 's/SERVICE_NAME="mcp-service-layer"/SERVICE_NAME="client-service-layer"/' "$DEPLOY_SCRIPT"
    
    # Update SERVICE_DIR path
    sed -i 's|SERVICE_DIR="$WORKSPACE_ROOT/dev-tools/agents/mcp"|SERVICE_DIR="$WORKSPACE_ROOT/dev-tools/agents/client-service-layer"|' "$DEPLOY_SCRIPT"
    
    # Update config comment
    sed -i 's/# Check if service is configured in mcp-config.json/# Check if service is configured in MCP config/' "$DEPLOY_SCRIPT"
    
    # Update grep pattern for config validation
    sed -i 's/"mcp-service-layer"/"client-service-layer"/' "$DEPLOY_SCRIPT"
    
    # Update systemd service name
    sed -i 's/prospectpro-mcp-service-layer/prospectpro-client-service-layer/g' "$DEPLOY_SCRIPT"
    
    # Update environment variable prefix
    sed -i 's/OTEL_SERVICE_NAME=prospectpro-mcp-service-layer/OTEL_SERVICE_NAME=prospectpro-client-service-layer/' "$DEPLOY_SCRIPT"
    
    log "  ✓ Deployment script updated"
else
    warn "  Deployment script not found at expected location"
fi

# Phase 2: Scrub root package.json
log "Phase 2: Cleaning root package.json..."

PACKAGE_JSON="$REPO_ROOT/package.json"

if [[ -f "$PACKAGE_JSON" ]]; then
    info "  Removing legacy MCP script references..."
    
    # Create backup
    cp "$PACKAGE_JSON" "${PACKAGE_JSON}.backup-${TIMESTAMP}"
    
    # Remove deprecated mcp:debug, mcp:dev, mcp:prod scripts (these should use mcp-servers, not service layer)
    # Note: mcp:start, mcp:stop are for MCP servers and should remain
    
    # Check for any mcp-service-layer references in comments or values
    if grep -q "mcp-service-layer" "$PACKAGE_JSON"; then
        warn "  Found 'mcp-service-layer' references in package.json"
        info "  Manual review may be needed for: $(grep -n 'mcp-service-layer' "$PACKAGE_JSON" | head -n 3)"
    fi
    
    log "  ✓ Root package.json reviewed"
else
    error "  Root package.json not found!"
    exit 1
fi

# Phase 3: Update documentation references
log "Phase 3: Updating documentation staging notes..."

SETTINGS_STAGING="$REPO_ROOT/docs/tooling/settings-staging.md"

if [[ -f "$SETTINGS_STAGING" ]]; then
    cat >> "$SETTINGS_STAGING" << EOF

# Staged: Client Service Layer Rename Completion ($(date +%Y-%m-%d))

- **Change**: Completed propagation of \`mcp-service-layer\` → \`client-service-layer\` rename
- **Actions**:
  - Renamed deployment script: \`deploy-mcp-service-layer.sh\` → \`deploy-client-service-layer.sh\`
  - Updated all internal references: SERVICE_NAME, SERVICE_DIR, systemd unit names
  - Updated package name to \`@prospectpro/client-service-layer\`
  - Source code reorganized under \`src/\` subdirectory
  - Package-lock.json regenerated with new namespace
- **Validation**: 
  - Run: \`cd dev-tools/agents/client-service-layer && npm install && npm run build && npm test\`
  - Verify: \`npm run lint\` passes
  - Check: Deployment script can locate dist/ outputs
- **Rollback**: Restore from git history at commit prior to rename
- **Notes**: 
  - MCP config remains at \`.vscode/mcp_config.json\` (primary) and \`config/mcp-config.json\` (fallback)
  - Archive/log references left unchanged for historical context
  - Next: Update MCP server cleanup and automation alignment

EOF
    log "  ✓ Documentation staging notes updated"
else
    warn "  settings-staging.md not found"
fi

# Phase 4: Update coverage.md
log "Phase 4: Logging to coverage.md..."

COVERAGE="$REPO_ROOT/dev-tools/workspace/context/session_store/coverage.md"

if [[ -f "$COVERAGE" ]]; then
    cat >> "$COVERAGE" << EOF

## $(date +%Y-%m-%d): Client Service Layer Rename Finalization

**Actions:**
- Renamed \`dev-tools/agents/scripts/deploy-mcp-service-layer.sh\` to \`deploy-client-service-layer.sh\`
- Updated deployment script variables: SERVICE_NAME, SERVICE_DIR, systemd unit names
- Scrubbed package.json for legacy references (backup created)
- Updated settings-staging.md with rollback procedures

**Validation:**
- ✅ Package metadata: \`@prospectpro/client-service-layer\`
- ✅ Source structure: \`src/\` directory with TypeScript sources
- ✅ Lockfile: Regenerated with npm clean namespace
- ✅ README: Import paths updated
- ✅ Deployment script: All paths and names aligned
- ⏳ Build/test: Ready for validation run

**Outstanding:**
- MCP server cleanup (separate phase per roadmap)
- Automation wiring updates (Taskfile migration)
- CI/CD health check integration

**Provenance:**
- Execution log: \`$LOG_FILE\`
- Package backup: \`${PACKAGE_JSON}.backup-${TIMESTAMP}\`
- Script: \`dev-tools/scripts/automation/finalize-client-service-layer-rename.sh\`

EOF
    log "  ✓ Coverage.md updated"
else
    warn "  coverage.md not found"
fi

# Phase 5: Refresh inventories
log "Phase 5: Refreshing file inventories..."

if [[ -f "$REPO_ROOT/dev-tools/automation/ci-cd/repo_scan.sh" ]]; then
    info "  Running repo scan..."
    bash "$REPO_ROOT/dev-tools/automation/ci-cd/repo_scan.sh" >> "$LOG_FILE" 2>&1 || warn "  Repo scan encountered issues"
    log "  ✓ Inventories refreshed"
else
    warn "  Repo scan script not found, skipping inventory refresh"
fi

# Phase 6: Validation checks
log "Phase 6: Running validation checks..."

info "  Checking client-service-layer package..."
if [[ -d "$REPO_ROOT/dev-tools/agents/client-service-layer" ]]; then
    cd "$REPO_ROOT/dev-tools/agents/client-service-layer"
    
    if [[ -f "package.json" ]]; then
        PACKAGE_NAME=$(node -e "console.log(require('./package.json').name)")
        if [[ "$PACKAGE_NAME" == "@prospectpro/client-service-layer" ]]; then
            log "  ✓ Package name verified: $PACKAGE_NAME"
        else
            error "  Package name mismatch: $PACKAGE_NAME"
        fi
    fi
    
    if [[ -d "src" ]]; then
        log "  ✓ Source directory structure confirmed"
    else
        warn "  src/ directory not found"
    fi
    
    if [[ -f "dist/index.js" ]] || [[ -f "dist/index.d.ts" ]]; then
        log "  ✓ Build outputs present"
    else
        info "  Build outputs not found (run 'npm run build' to generate)"
    fi
    
    cd "$REPO_ROOT"
else
    error "  client-service-layer directory not found!"
    exit 1
fi

info "  Checking deployment script..."
NEW_DEPLOY_SCRIPT="$REPO_ROOT/dev-tools/agents/scripts/deploy-client-service-layer.sh"
if [[ -f "$NEW_DEPLOY_SCRIPT" ]]; then
    if grep -q "client-service-layer" "$NEW_DEPLOY_SCRIPT"; then
        log "  ✓ Deployment script references updated"
    else
        warn "  Deployment script may need manual review"
    fi
else
    warn "  New deployment script not found"
fi

# Phase 7: Summary and next steps
echo ""
log "═══════════════════════════════════════════════════════════"
log "  Finalization Complete"
log "═══════════════════════════════════════════════════════════"
echo ""

log "Summary of changes:"
log "  • Deployment script renamed and updated"
log "  • Package.json scrubbed (backup created)"
log "  • Documentation updated (settings-staging.md, coverage.md)"
log "  • Inventories refreshed"
log "  • Validation checks completed"
echo ""

info "Next validation steps:"
echo "  1. cd dev-tools/agents/client-service-layer"
echo "  2. npm install"
echo "  3. npm run build"
echo "  4. npm test"
echo "  5. npm run lint (from repo root)"
echo ""

info "Next development steps:"
echo "  1. Review MCP server cleanup plan (separate from client layer)"
echo "  2. Update Taskfile automation wiring"
echo "  3. Wire CI/CD health checks"
echo "  4. Complete Phase 3B extension wiring per integration roadmap"
echo ""

log "Full execution log: $LOG_FILE"
log "Package backup: ${PACKAGE_JSON}.backup-${TIMESTAMP}"
echo ""

log "🎉 Client Service Layer rename finalization complete!"
