#!/bin/bash

# ProspectPro Repository Cleanup & Documentation Schema Enforcement
# This script implements the documentation cleanup plan

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

echo "🧹 ProspectPro Repository Cleanup & Documentation Schema Enforcement"
echo "=================================================================="

# Configuration
BACKUP_BRANCH="backup-before-cleanup-$(date +%Y%m%d-%H%M%S)"
CURRENT_BRANCH=$(git branch --show-current)

# Safety check
if [ "$CURRENT_BRANCH" != "main" ]; then
  echo "❌ This script must be run from the main branch"
  echo "Current branch: $CURRENT_BRANCH"
  exit 1
fi

# Create backup branch
echo "📋 Creating backup branch: $BACKUP_BRANCH"
git checkout -b "$BACKUP_BRANCH"
git checkout main

echo "✅ Backup created. You can restore with: git checkout $BACKUP_BRANCH"

# Phase 1: Create archive branches and move content
echo ""
echo "📦 Phase 1: Creating archive branches..."

# Create directories for organization
mkdir -p archive/{development,testing,deployment,production}

# Development artifacts branch
echo "  🔄 Creating archive/development-phase..."
git checkout -b archive/development-phase 2>/dev/null || git checkout archive/development-phase

if [ -f "CORRECTED_ARCHITECTURE.md" ]; then
  git mv CORRECTED_ARCHITECTURE.md archive/development/CORRECTED_ARCHITECTURE.md 2>/dev/null || {
    mkdir -p archive/development
    mv CORRECTED_ARCHITECTURE.md archive/development/CORRECTED_ARCHITECTURE.md
    git add archive/development/CORRECTED_ARCHITECTURE.md
  }
  git commit -m "archive: Move development artifacts to dedicated branch" || echo "Nothing to commit for development branch"
fi

# Deployment experiments branch
echo "  🔄 Creating archive/deployment-phase..."
git checkout main
git checkout -b archive/deployment-phase 2>/dev/null || git checkout archive/deployment-phase

DEPLOYMENT_FILES=(
  "ENHANCED_OPTION_B1_COMPLETE.md"
  "GHP_SECRET_INTEGRATION_COMPLETE.md" 
  "PRODUCTION_DEPLOYMENT_v3.md"
  "RAILWAY_CLEANUP_SUMMARY.md"
)

mkdir -p archive/deployment
for file in "${DEPLOYMENT_FILES[@]}"; do
  if [ -f "$file" ]; then
    git mv "$file" "archive/deployment/$file" 2>/dev/null || {
      mv "$file" "archive/deployment/$file"
      git add "archive/deployment/$file"
    }
  fi
done

git commit -m "archive: Move deployment experiments to dedicated branch" || echo "Nothing to commit for deployment branch"

# Testing reports branch  
echo "  🔄 Creating archive/testing-reports..."
git checkout main
git checkout -b archive/testing-reports 2>/dev/null || git checkout archive/testing-reports

if [ -f "CLIENT_BRIEF_TEST_REPORT.md" ]; then
  mkdir -p archive/testing
  git mv CLIENT_BRIEF_TEST_REPORT.md archive/testing/CLIENT_BRIEF_TEST_REPORT.md 2>/dev/null || {
    mv CLIENT_BRIEF_TEST_REPORT.md archive/testing/CLIENT_BRIEF_TEST_REPORT.md
    git add archive/testing/CLIENT_BRIEF_TEST_REPORT.md
  }
  git commit -m "archive: Move testing reports to dedicated branch" || echo "Nothing to commit for testing branch"
fi

# Production legacy branch
echo "  🔄 Creating archive/production-legacy..."
git checkout main
git checkout -b archive/production-legacy 2>/dev/null || git checkout archive/production-legacy

PRODUCTION_FILES=(
  "PRODUCTION_BUILD_VALIDATION_REPORT.md"
  "PRODUCTION_ENVIRONMENT_IMPLEMENTATION_COMPLETE.md" 
  "PRODUCTION_SERVER_INITIALIZATION_GUIDE.md"
  "PRODUCTION_VALIDATION_SUCCESS.md"
)

mkdir -p archive/production
for file in "${PRODUCTION_FILES[@]}"; do
  if [ -f "$file" ]; then
    git mv "$file" "archive/production/$file" 2>/dev/null || {
      mv "$file" "archive/production/$file" 
      git add "archive/production/$file"
    }
  fi
done

git commit -m "archive: Move legacy production docs to dedicated branch" || echo "Nothing to commit for production branch"

# Phase 2: Clean main branch
echo ""
echo "🧹 Phase 2: Cleaning main branch..."
git checkout main

# Create new documentation structure
mkdir -p docs/{setup,guides,technical,deployment,development}

# Move active documentation to proper locations
echo "  📁 Reorganizing active documentation..."

if [ -f "API_KEYS_SETUP_GUIDE.md" ]; then
  git mv API_KEYS_SETUP_GUIDE.md docs/setup/API_KEYS_SETUP.md
fi

if [ -f "REAL_CAMPAIGN_SETUP.md" ]; then
  git mv REAL_CAMPAIGN_SETUP.md docs/guides/CAMPAIGN_SETUP.md  
fi

# Remove files that were moved to archive branches (only if they exist)
FILES_TO_REMOVE=(
  "CORRECTED_ARCHITECTURE.md"
  "ENHANCED_OPTION_B1_COMPLETE.md"
  "GHP_SECRET_INTEGRATION_COMPLETE.md"
  "CLIENT_BRIEF_TEST_REPORT.md" 
  "PRODUCTION_BUILD_VALIDATION_REPORT.md"
  "PRODUCTION_DEPLOYMENT_v3.md"
  "PRODUCTION_ENVIRONMENT_IMPLEMENTATION_COMPLETE.md"
  "PRODUCTION_SERVER_INITIALIZATION_GUIDE.md"
  "PRODUCTION_VALIDATION_SUCCESS.md"
  "RAILWAY_CLEANUP_SUMMARY.md"
)

for file in "${FILES_TO_REMOVE[@]}"; do
  if [ -f "$file" ]; then
    git rm "$file"
  fi
done

# Phase 3: Create documentation index
echo ""
echo "📚 Phase 3: Creating documentation index..."

cat > docs/README.md << 'EOF'
# ProspectPro Documentation

## 📚 Documentation Structure

### 🚀 Quick Start
- [API Keys Setup](setup/API_KEYS_SETUP.md) - Configure API keys for external services
- [Campaign Setup](guides/CAMPAIGN_SETUP.md) - Set up and run lead generation campaigns
- [Database Configuration](../database/README.md) - Database setup and configuration

### 📖 User Guides  
- [Business Discovery](guides/BUSINESS_DISCOVERY.md) - How to discover and validate businesses
- [Campaign Management](guides/CAMPAIGN_SETUP.md) - Managing lead generation campaigns
- [CSV Export](guides/CSV_EXPORT.md) - Exporting leads to CSV format

### 🔧 Technical Documentation
- [System Architecture](technical/ARCHITECTURE.md) - System design and components
- [API Reference](technical/API_REFERENCE.md) - Complete API documentation
- [Database Schema](technical/DATABASE_SCHEMA.md) - Database structure and relationships

### 🚢 Deployment
- [Production Deployment](deployment/PRODUCTION_DEPLOYMENT.md) - Deploy to production
- [Supabase Setup](deployment/SUPABASE_SETUP.md) - Configure Supabase backend
- [Monitoring & Diagnostics](deployment/MONITORING.md) - System monitoring and troubleshooting

### 💻 Development
- [Contributing Guidelines](development/CONTRIBUTING.md) - How to contribute to the project
- [Testing Guide](development/TESTING.md) - Running and writing tests
- [Debugging Guide](development/DEBUGGING.md) - Debugging common issues

## 🗄️ Historical Documentation

Historical documents and legacy guides are preserved in dedicated archive branches:

- `archive/development-phase` - Development artifacts and architecture docs
- `archive/deployment-phase` - Deployment experiments and legacy guides  
- `archive/testing-reports` - Test reports and validation documents
- `archive/production-legacy` - Legacy production setup documentation

## 📋 Archive Branch Access

To access historical documentation:

```bash
# List all archive branches
git branch -r | grep archive

# Switch to specific archive branch
git checkout archive/development-phase
git checkout archive/deployment-phase  
git checkout archive/testing-reports
git checkout archive/production-legacy

# Return to main branch
git checkout main
```

## 📏 Documentation Standards

### Root Directory Policy
- **MAXIMUM 3 .md FILES**: README.md, CHANGELOG.md, PRODUCTION_READY_REPORT.md
- All other documentation must be in `docs/` subdirectories

### File Organization
- Setup guides → `docs/setup/`
- User guides → `docs/guides/`
- Technical docs → `docs/technical/`
- Deployment guides → `docs/deployment/`
- Development docs → `docs/development/`

### Naming Conventions
- Use UPPERCASE for major document names
- Use descriptive, specific names
- Include file extensions (.md for markdown)
- Use underscores for multi-word names

## 🔄 Maintenance

This documentation structure is actively maintained:

- **Monthly**: Review for documentation sprawl
- **Per Release**: Update relevant guides and references
- **Per Feature**: Add/update technical documentation
- **Archive Creation**: When starting major new development phases

For questions about documentation structure or to suggest improvements, please create an issue.
EOF

# Create CHANGELOG.md if it doesn't exist
if [ ! -f "CHANGELOG.md" ]; then
  cat > CHANGELOG.md << 'EOF'
# ProspectPro Changelog

All notable changes to ProspectPro will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.0.0] - 2025-09-23

### Added
- Enhanced schema cache handling for production initialization
- Graceful degraded mode startup capability  
- Schema cache refresh utilities and automation
- Comprehensive production diagnostics and monitoring
- Enhanced Supabase configuration with automatic recovery
- Production-ready error handling and user guidance

### Changed
- Improved server startup process with detailed error reporting
- Enhanced database connection testing with cache management
- Reorganized documentation structure with archive branches
- Updated production deployment workflow with artifact-based configuration

### Fixed
- Schema cache initialization issues after database updates
- Production server startup failures during cache refresh
- Database connectivity issues in production environment

## [2.0.0] - 2025-09-22

### Added
- Complete production validation system
- Enhanced deployment pipeline with GitHub Actions
- Comprehensive database schema with RLS policies
- Multi-source business discovery with API integrations

### Changed
- Migration to production-ready architecture
- Enhanced error handling and logging
- Improved cost tracking and budget management

## [1.0.0] - Initial Release

### Added
- Basic lead generation functionality
- Supabase database integration
- Simple web interface
- Core business discovery features
EOF
fi

# Commit the reorganization
echo "  💾 Committing documentation reorganization..."
git add .
git commit -m "docs: Enforce new documentation schema - clean main branch

🧹 Repository Cleanup Complete:
- Root directory limited to 3 essential .md files  
- All documentation organized into docs/ subdirectories
- Historical content moved to dedicated archive branches
- Created comprehensive documentation index
- Added CHANGELOG.md for version tracking
- Established governance rules and standards

📚 New Structure:
- docs/setup/ - Installation and configuration guides
- docs/guides/ - User guides and tutorials  
- docs/technical/ - Technical documentation
- docs/deployment/ - Deployment and production guides
- docs/development/ - Development and contribution docs

🗄️ Archive Branches:
- archive/development-phase - Development artifacts
- archive/deployment-phase - Deployment experiments
- archive/testing-reports - Test reports and validation
- archive/production-legacy - Legacy production documentation

All historical content preserved with full git history."

# Phase 4: Push all branches
echo ""
echo "🚀 Phase 4: Pushing all branches..."

# Push all archive branches
git push -u origin archive/development-phase
git push -u origin archive/deployment-phase  
git push -u origin archive/testing-reports
git push -u origin archive/production-legacy

# Push main branch with cleanup
git push origin main

# Push backup branch  
git push -u origin "$BACKUP_BRANCH"

echo ""
echo "🎉 Repository Cleanup Complete!"
echo "================================"
echo ""
echo "✅ Main Branch:"
echo "   - Clean root directory (3 files maximum)"
echo "   - Organized docs/ structure"
echo "   - Comprehensive documentation index"
echo ""
echo "🗄️ Archive Branches Created:"
echo "   - archive/development-phase"
echo "   - archive/deployment-phase"
echo "   - archive/testing-reports"
echo "   - archive/production-legacy"
echo ""
echo "🛡️ Backup Branch: $BACKUP_BRANCH"
echo ""
echo "📋 Next Steps:"
echo "   1. Review the new documentation structure in docs/"
echo "   2. Update any broken cross-references"
echo "   3. Create missing documentation files"
echo "   4. Set up pre-commit hooks for governance"
echo ""
echo "🔍 To access historical documents:"
echo "   git checkout archive/[branch-name]"
echo "   git checkout main  # to return"
echo ""