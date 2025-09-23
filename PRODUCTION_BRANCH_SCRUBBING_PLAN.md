# ProspectPro Production Branch Scrubbing Plan

## 🎯 Objective

Transform the main branch into a production-only environment by removing all development artifacts, test files, logs, and non-essential scripts while preserving full git history through archive branches.

## 📊 Current State Analysis

### Repository Size Distribution

```
141M    node_modules/     # Development dependencies (keep)
788K    database/         # Mixed: production + development files
612K    modules/          # Core production modules (keep)
340K    public/           # Frontend assets (keep)
320K    frontend/         # Frontend code (keep)
272K    docs/             # Mixed: production docs + development
212K    scripts/          # Mixed: production + development scripts
152K    supabase/         # Database migrations (keep)
144K    api/              # Core API endpoints (keep)
88K     test/             # Development testing (archive)
84K     archive/          # Historical content (keep structure)
28K     config/           # Configuration files (keep)
4.0K    logs/             # Runtime logs (remove)
```

## 🔍 File Classification Analysis

### ✅ PRODUCTION ESSENTIAL (Keep in main)

**Core Application Files:**

- `server.js` - Main application server
- `package.json` & `package-lock.json` - Dependencies
- `README.md`, `CHANGELOG.md`, `PRODUCTION_READY_REPORT.md` - Essential docs

**Production Directories:**

- `api/` - Core API endpoints
- `modules/` - Core business logic modules
- `config/` - Production configuration
- `public/` - Static assets
- `frontend/` - User interface
- `supabase/` - Database schema and migrations

**Production Scripts:**

- `scripts/init-prod-server.sh` - Production server initialization
- `scripts/production-checklist.sh` - Production readiness validation
- `scripts/production-startup.sh` - Production startup automation
- `scripts/force-schema-refresh.js` - Database cache management
- `scripts/refresh-schema-cache.js` - Schema synchronization

**Documentation (Curated):**

- `docs/setup/` - Production setup guides only
- `docs/guides/` - User guides for production features
- `docs/deployment/` - Production deployment documentation
- Essential technical docs for production operations

### 🗄️ ARCHIVE TO EXISTING BRANCHES (Remove from main)

**Development Scripts → archive/development-phase:**

- `scripts/demonstrate-phase-1-success.js` - Demo script
- `scripts/execute-optimization-v2.js` - Development optimization
- `scripts/execute-test-campaign.js` - Testing automation
- `scripts/run-production-test.js` - Development testing
- `scripts/validate-production-database-v31.js` - Development validation
- `scripts/verify-testing-branch.sh` - Branch verification
- `scripts/APOLLO_INTEGRATION_STATUS.js` - Development status
- `scripts/direct-sql-executor.js` - Development utility
- `scripts/quick-table-check.js` - Development debugging
- `scripts/supabase-validator.js` - Development validation

**Development Files → archive/development-phase:**

- `launch-real-campaign.js` - Campaign testing
- `quick-campaign.js` - Development shortcuts
- `verify-setup.js` - Development verification

**Test Infrastructure → archive/old-tests:**

- `test/` - Complete testing infrastructure
- `test-client-brief-simulation.js` - Simulation testing
- `test-comprehensive-webhook-system.js` - Integration testing

**Sample & Config Files → archive/legacy-files:**

- `sample-export-client-brief.csv` - Sample data
- Development configuration examples
- `.env` - Development secrets (use environment variables in production)

**Debug & Log Files → archive/debug-tools:**

### 🗑️ REMOVE COMPLETELY (Generate in production)

**Log Files:**

- `database-validation.log`
- `production-checklist.log`
- `production-fixed.log`
- `production.log`
- `server-test.log`
- `startup.log`
- `diagnostics.json`

**Development Configuration:**

- `.env` - Contains development secrets (use environment variables)

## 🏗️ Archive Branch Strategy

### Existing Archive Branches (Already Created):

1. **archive/development-phase** ✅ - Development artifacts and architecture experiments
2. **archive/deployment-phase** ✅ - Legacy deployment guides and experiments
3. **archive/testing-reports** ✅ - Test reports and validation documents
4. **archive/production-legacy** ✅ - Legacy production setup documentation

### Additional Archive Branches Available (Remote):

5. **archive/debug-tools** ✅ - Debugging utilities and diagnostic tools
6. **archive/documentation** ✅ - Historical documentation versions
7. **archive/legacy-files** ✅ - Legacy code and deprecated files
8. **archive/old-tests** ✅ - Outdated testing frameworks and scripts

### Utilization Strategy for Production Scrubbing:

**Use Existing Branches:**

- `archive/development-phase` - Additional development scripts and utilities
- `archive/testing-reports` - Move remaining test files and simulation scripts
- `archive/debug-tools` - Development log files and debugging artifacts
- `archive/legacy-files` - Sample data and deprecated configuration files

### Database Directory Cleanup:

**Keep in Production:**

- `database/setup/` - Production database setup
- Core migration files used in production
- `MANUAL_SETUP_GUIDE.md` - Essential for production deployment

**Archive to development-tools:**

- `database/validate-setup.js` - Development validation
- Development-specific migration scripts
- Testing database configurations

### Docs Directory Cleanup:

**Keep Essential Production Docs Only:**

- `docs/setup/API_KEYS_SETUP.md` - Production API configuration
- `docs/guides/CAMPAIGN_SETUP.md` - Production user guide
- `docs/deployment/` - Production deployment guides
- `docs/README.md` - Documentation index
- `docs/GOVERNANCE.md` - Documentation standards

**Archive Development Docs:**

- Development roadmaps and planning documents
- Architecture experiments and design documents
- Repository cleanup and optimization reports
- Development phase documentation

## 🛡️ Safety Measures

### Pre-Scrubbing Backup:

1. Create `backup-production-scrub-YYYYMMDD-HHMMSS` branch
2. Tag current state as `pre-production-scrub-v3.0`
3. Document complete file inventory before changes

### Git History Preservation:

- All file moves use `git mv` to preserve history
- Archive branches maintain full development timeline
- No files deleted without archiving first

### Recovery Plan:

- Backup branch for complete rollback if needed
- Archive branches for accessing removed content
- Clear documentation of what was moved where

## 📋 Implementation Steps

### Phase 1: Safety & Preparation

1. Create safety backup branch
2. Create git tag for current state
3. Install updated git hooks for production-only enforcement
4. Check out existing archive branches (already available)

### Phase 2: Archive Development Content Using Existing Branches

1. Move development scripts to `archive/development-phase`
2. Move test infrastructure to `archive/old-tests`
3. Move sample data to `archive/legacy-files`
4. Move development logs to `archive/debug-tools`

### Phase 3: Clean Database Directory

1. Archive development-specific database files
2. Keep only production-essential migration files
3. Preserve production setup documentation

### Phase 4: Curate Documentation

1. Archive development documentation
2. Keep only production-essential user guides
3. Maintain production deployment documentation

### Phase 5: Remove Generated Files

1. Remove all `.log` files (regenerated in production)
2. Remove development configuration files
3. Clean up temporary development artifacts

### Phase 6: Production Validation

1. Validate server starts successfully
2. Confirm all production scripts work
3. Test API endpoints function correctly
4. Verify documentation accessibility

## 🎯 Expected Results

### Main Branch (Production-Ready):

- **Reduced size**: Remove ~400KB of development files
- **Clean structure**: Only production-essential code and docs
- **Fast deployment**: No development artifacts to transfer
- **Security**: No development secrets or debugging information

### Archive Branches:

- Complete development history preserved across **8 existing archive branches**
- Easy access to removed content via established branch structure
- Well-organized by purpose:
  - `archive/development-phase` - Development scripts and artifacts
  - `archive/old-tests` - Testing frameworks and infrastructure
  - `archive/legacy-files` - Sample data and deprecated config
  - `archive/debug-tools` - Debug utilities and log files
  - Plus 4 additional specialized archive branches
- Full git history maintained with proven track record

### Deployment Benefits:

- Faster container builds (fewer files to copy)
- Reduced security surface (no development tools)
- Cleaner production environment
- Clear separation of concerns

## 🚨 Risks and Mitigations

### Potential Risks:

1. **Breaking production server** - Mitigated by comprehensive testing
2. **Lost development artifacts** - Mitigated by archive branches
3. **Broken scripts** - Mitigated by validation testing
4. **Documentation gaps** - Mitigated by careful curation

### Validation Checklist:

- [ ] Server starts without errors
- [ ] All API endpoints respond correctly
- [ ] Database connections work
- [ ] Production scripts execute successfully
- [ ] Documentation links are valid
- [ ] No broken module imports

## 🔄 Post-Scrubbing Governance

### Production Branch Protection:

- Updated git hooks prevent non-production files
- Pre-commit validation for production-readiness
- Automated checks for development artifacts

### Development Workflow:

- All development work on feature branches
- Development tools accessed via archive branches
- Production PRs require scrubbing validation

---

## ✋ CONFIRMATION REQUIRED

This plan will significantly transform the main branch using our existing archive infrastructure. Please review and confirm:

1. **Archive Strategy**: Utilize 8 existing archive branches with proven preservation ✅
   - `archive/development-phase` for development scripts
   - `archive/old-tests` for testing infrastructure
   - `archive/legacy-files` for samples and deprecated config
   - `archive/debug-tools` for logs and debugging utilities
   - Plus 4 additional specialized branches available
2. **Production Focus**: Main branch contains only production-essential files ✅
3. **Safety Measures**: Backup branch and git tag for recovery ✅
4. **File Preservation**: All development content archived using established system ✅
5. **Validation Testing**: Comprehensive testing before completion ✅

**Confirm to proceed with production branch scrubbing implementation using existing archive infrastructure.**
