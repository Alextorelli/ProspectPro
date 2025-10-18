# ProspectPro Documentation Governance

## 🎯 Purpose

This document defines the rules and processes for maintaining clean, organized documentation in the ProspectPro repository.

## 📏 Root Directory Rules

### Maximum File Limit

- **STRICT LIMIT**: Maximum 3 markdown files in root directory
- **Allowed Files**:
  - `README.md` (project overview)
  - `CHANGELOG.md` (version history)
  - `PRODUCTION_READY_REPORT.md` (production status)

### Prohibited Patterns

The following file patterns are **NOT ALLOWED** in the root directory:

- `*_COMPLETE.md`
- `*_REPORT.md` (except PRODUCTION_READY_REPORT.md)
- `*_GUIDE.md`
- `*_VALIDATION*.md`
- `*_IMPLEMENTATION*.md`
- `TEST_*.md`
- `*_DEPLOYMENT*.md`
- `*_SETUP*.md`

## 📁 Required Directory Structure

```
docs/
├── README.md           # Main documentation index
├── GOVERNANCE.md       # This file
├── setup/             # Installation and configuration
├── guides/            # User guides and tutorials
├── technical/         # Technical documentation
├── deployment/        # Deployment and production
└── development/       # Development and contribution
```

## 🗄️ Archive Branch Strategy

Historical and legacy documentation must be moved to dedicated archive branches:

### Archive Branch Types

- `archive/development-phase` - Development artifacts and architecture experiments
- `archive/deployment-phase` - Legacy deployment experiments and testing
- `archive/testing-reports` - Test reports and validation documents
- `archive/production-legacy` - Legacy production setup documentation

### When to Archive

- Documentation becomes outdated or superseded
- Experimental approaches that were not adopted
- Legacy guides that are no longer relevant
- Reports and validations from specific time periods

## 🔧 Enforcement Mechanisms

### Automated Enforcement

1. **Pre-commit Hook**: Validates schema before each commit
2. **Pre-push Hook**: Final validation before pushing to remote
3. **Documentation Checker**: `scripts/check-docs-schema.sh`

### Manual Enforcement

1. **Monthly Reviews**: Check for documentation sprawl
2. **Release Reviews**: Update and reorganize documentation
3. **Cleanup Script**: `scripts/repository-cleanup.sh`

## 📋 Compliance Procedures

### For New Documentation

1. Determine appropriate docs/ subdirectory
2. Use descriptive, specific naming
3. Update docs/README.md index if needed
4. Follow naming conventions

### For Historical Content

1. Identify appropriate archive branch
2. Move content with `git mv` to preserve history
3. Commit to archive branch with descriptive message
4. Remove from main branch if applicable

### For Violations

1. Run `scripts/check-docs-schema.sh` for validation
2. Use `scripts/repository-cleanup.sh` for bulk fixes
3. Archive inappropriate content to correct branches
4. Update documentation index

## 🚨 Emergency Procedures

### Schema Violations Blocking Commits

```bash
# Quick fixes for common violations:

# 1. Move documentation to correct location
mkdir -p docs/setup
git mv API_KEYS_SETUP_GUIDE.md docs/setup/

# 2. Archive historical content
git checkout -b archive/development-phase
git mv CORRECTED_ARCHITECTURE.md archive/development/
git commit -m "archive: move development artifacts"
git checkout main

# 3. Run cleanup script
chmod +x scripts/repository-cleanup.sh
./scripts/repository-cleanup.sh
```

### Bypass Emergency (Use Sparingly)

```bash
# Only for genuine emergencies - bypasses pre-commit hook
git commit --no-verify -m "emergency: bypass documentation validation"
```

## 📊 Monitoring and Metrics

### Key Indicators

- Root directory .md file count (target: ≤ 3)
- Total documentation files (track growth)
- Archive branch utilization
- Compliance violations per month

### Review Schedule

- **Weekly**: Quick compliance check during development
- **Monthly**: Full documentation review and cleanup
- **Per Release**: Comprehensive reorganization and updates
- **Quarterly**: Archive branch maintenance and optimization

## 🤝 Contribution Guidelines

### Adding New Documentation

1. Choose appropriate docs/ subdirectory
2. Follow naming conventions
3. Update relevant index files
4. Test compliance with schema checker

### Modifying Existing Documentation

1. Preserve file history with `git mv`
2. Update cross-references
3. Maintain index accuracy
4. Archive superseded versions to `docs/archive/` or subdirectory archives

### Creating Archive Content

1. Create descriptive archive branch name
2. Organize content in archive/ subdirectories
3. Preserve full git history
4. Document branch purpose in commit message

## 📞 Support

For questions about documentation governance:

1. Check this GOVERNANCE.md document
2. Review docs/README.md for structure
3. Run `scripts/check-docs-schema.sh` for validation
4. Use `scripts/repository-cleanup.sh` for fixes
5. Create issue for governance improvements

This governance system ensures ProspectPro maintains clean, navigable documentation that supports both current development and historical reference.
