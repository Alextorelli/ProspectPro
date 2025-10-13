#!/bin/bash

# Install ProspectPro Documentation Schema Enforcement Git Hooks

set -euo pipefail

EXPECTED_REPO_ROOT=${EXPECTED_REPO_ROOT:-/workspaces/ProspectPro}

require_repo_root() {
  local repo_root
  if ! repo_root=$(git rev-parse --show-toplevel 2>/dev/null); then
    echo "❌ Run this script from inside the ProspectPro repo"
    exit 1
  fi

  if [ "$repo_root" != "$EXPECTED_REPO_ROOT" ]; then
    echo "❌ Wrong directory. Expected repo root: $EXPECTED_REPO_ROOT"
    echo "   Current directory: $repo_root"
    exit 1
  fi
}

require_repo_root

echo "🔗 Installing ProspectPro Documentation Schema Git Hooks"
echo "======================================================"

# Check if we're in a git repository
if [ ! -d ".git" ]; then
  echo "❌ Not in a git repository. Please run from repository root."
  exit 1
fi

# Create .git/hooks directory if it doesn't exist
mkdir -p .git/hooks

# Install pre-commit hook
echo "📦 Installing pre-commit hook..."

cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash

# ProspectPro Documentation Schema Pre-commit Hook
# Automatically enforces documentation organization rules

# Regenerate codebase index before validation
if command -v npm >/dev/null 2>&1; then
  echo "🔁 Regenerating codebase index..."
  if ! npm run --silent codebase:index; then
    echo "❌ Failed to refresh CODEBASE_INDEX.md" >&2
    exit 1
  fi
  git add CODEBASE_INDEX.md 2>/dev/null || true
fi

# Check if the documentation schema validation script exists
if [ -f "scripts/check-docs-schema.sh" ]; then
  echo "🔍 Validating documentation schema..."
  chmod +x scripts/check-docs-schema.sh
  
  if ! scripts/check-docs-schema.sh; then
    echo ""
    echo "💡 Quick fixes:"
    echo "   • Move documentation files to docs/ subdirectories"
    echo "   • Use archive branches for historical content"  
    echo "   • Run cleanup script: scripts/repository-cleanup.sh"
    echo ""
    exit 1
  fi
else
  echo "⚠️  Documentation schema checker not found, skipping validation"
fi

echo "✅ Pre-commit checks passed"
EOF

# Make pre-commit hook executable
chmod +x .git/hooks/pre-commit

# Install pre-push hook (optional additional safety)
echo "📦 Installing pre-push hook..."

cat > .git/hooks/pre-push << 'EOF'
#!/bin/bash

# ProspectPro Documentation Schema Pre-push Hook
# Final validation before pushing to remote

if command -v npm >/dev/null 2>&1; then
  echo "🔁 Ensuring codebase index is current before push..."
  if ! npm run --silent codebase:index; then
    echo "❌ Codebase index refresh failed" >&2
    exit 1
  fi
  git add CODEBASE_INDEX.md 2>/dev/null || true
fi

echo "🚀 Final documentation schema validation before push..."

if [ -f "scripts/check-docs-schema.sh" ]; then
  chmod +x scripts/check-docs-schema.sh
  
  if ! scripts/check-docs-schema.sh; then
    echo ""
    echo "❌ Push blocked: Documentation schema violations detected"
    echo "   Fix violations before pushing to remote repository"
    echo ""
    exit 1
  fi
fi

echo "✅ Documentation schema validated - push allowed"
EOF

# Make pre-push hook executable  
chmod +x .git/hooks/pre-push

# Create commit message template
echo "📝 Installing commit message template..."

cat > .gitmessage << 'EOF'
# ProspectPro Commit Message Template
#
# Format: <type>(<scope>): <description>
#
# Types:
#   feat:     New feature
#   fix:      Bug fix
#   docs:     Documentation changes
#   style:    Code style changes (formatting, etc)
#   refactor: Code refactoring
#   test:     Adding or updating tests
#   chore:    Maintenance tasks
#   archive:  Moving content to archive branches
#
# Scopes (optional):
#   api:      API endpoints
#   db:       Database changes
#   ui:       User interface
#   config:   Configuration
#   docs:     Documentation structure
#   deploy:   Deployment related
#
# Examples:
#   feat(api): add business validation endpoint
#   fix(db): resolve schema cache initialization issue
#   docs: reorganize technical documentation
#   archive: move legacy deployment guides to archive branch
#
# Breaking Changes:
#   Add "BREAKING CHANGE:" in the body for breaking changes
#
# References:
#   Closes #123
#   Fixes #456
#   See also #789
EOF

# Configure git to use the template
git config commit.template .gitmessage

# Create documentation governance README
echo "📚 Creating governance documentation..."

cat > docs/GOVERNANCE.md << 'EOF'
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
4. Archive obsoleted versions

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
EOF

echo ""
echo "✅ Git Hooks Installation Complete!"
echo "=================================="
echo ""
echo "📦 Installed Components:"
echo "   • Pre-commit hook: Documentation schema validation"
echo "   • Pre-push hook: Final validation before remote push"
echo "   • Commit template: Structured commit messages"
echo "   • Documentation governance: docs/GOVERNANCE.md"
echo ""
echo "🔍 Validation Scripts:"
echo "   • scripts/check-docs-schema.sh - Schema compliance checker"
echo "   • scripts/repository-cleanup.sh - Bulk cleanup automation"
echo ""
echo "🎯 Enforcement Active:"
echo "   • All commits will be validated for documentation compliance"
echo "   • Push operations include final schema verification"
echo "   • Structured commit message template configured"
echo ""
echo "💡 Usage:"
echo "   • Hooks run automatically on git commit/push"
echo "   • Manual validation: ./scripts/check-docs-schema.sh"
echo "   • Bulk cleanup: ./scripts/repository-cleanup.sh"
echo "   • View governance: cat docs/GOVERNANCE.md"
echo ""
echo "⚠️  Note: Hooks prevent commits that violate documentation schema"
echo ""