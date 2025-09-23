#!/bin/bash

# ProspectPro Documentation Schema Enforcement Pre-commit Hook
# Prevents commits that violate the documentation organization rules

set -euo pipefail

echo "🔍 Checking documentation schema compliance..."

# Count markdown files in root directory
ROOT_MD_FILES=$(find . -maxdepth 1 -name "*.md" -not -path "./docs/*" | wc -l)
MAX_ROOT_MD=3

# Check if we're exceeding the root markdown limit
if [ "$ROOT_MD_FILES" -gt "$MAX_ROOT_MD" ]; then
  echo "❌ DOCUMENTATION SCHEMA VIOLATION"
  echo ""
  echo "   Root directory contains $ROOT_MD_FILES markdown files"
  echo "   Maximum allowed: $MAX_ROOT_MD"
  echo ""
  echo "   Current root .md files:"
  find . -maxdepth 1 -name "*.md" -not -path "./docs/*" | sed 's|./||' | sed 's/^/   - /'
  echo ""
  echo "   Allowed root files: README.md, CHANGELOG.md, PRODUCTION_READY_REPORT.md"
  echo ""
  echo "   📁 Move documentation to appropriate docs/ subdirectory:"
  echo "      • Setup guides → docs/setup/"
  echo "      • User guides → docs/guides/"
  echo "      • Technical docs → docs/technical/"
  echo "      • Deployment guides → docs/deployment/"
  echo "      • Development docs → docs/development/"
  echo ""
  echo "   🗄️ Or archive to appropriate branch:"
  echo "      • Development artifacts → archive/development-phase"
  echo "      • Legacy deployment → archive/deployment-phase"
  echo "      • Test reports → archive/testing-reports"
  echo "      • Production legacy → archive/production-legacy"
  echo ""
  echo "   To run cleanup script: chmod +x scripts/repository-cleanup.sh && scripts/repository-cleanup.sh"
  exit 1
fi

# Check for prohibited patterns in root directory
PROHIBITED_PATTERNS=(
  "*_COMPLETE.md"
  "*_REPORT.md"
  "*_GUIDE.md" 
  "*_VALIDATION*.md"
  "*_IMPLEMENTATION*.md"
  "TEST_*.md"
  "*_DEPLOYMENT*.md"
  "*_SETUP*.md"
)

VIOLATIONS=()

for pattern in "${PROHIBITED_PATTERNS[@]}"; do
  if ls $pattern 1> /dev/null 2>&1; then
    VIOLATIONS+=($(ls $pattern))
  fi
done

# Exclude allowed files from violations
ALLOWED_FILES=("README.md" "CHANGELOG.md" "PRODUCTION_READY_REPORT.md")
FILTERED_VIOLATIONS=()

for violation in "${VIOLATIONS[@]}"; do
  IS_ALLOWED=false
  for allowed in "${ALLOWED_FILES[@]}"; do
    if [[ "$violation" == "$allowed" ]]; then
      IS_ALLOWED=true
      break
    fi
  done
  
  if [[ "$IS_ALLOWED" == false ]]; then
    FILTERED_VIOLATIONS+=("$violation")
  fi
done

if [ ${#FILTERED_VIOLATIONS[@]} -gt 0 ]; then
  echo "❌ DOCUMENTATION NAMING VIOLATIONS"
  echo ""
  echo "   Files with prohibited naming patterns in root:"
  printf '   - %s\n' "${FILTERED_VIOLATIONS[@]}"
  echo ""
  echo "   These files should be moved to docs/ subdirectories or archive branches"
  echo ""
  exit 1
fi

# Check for missing required documentation structure
REQUIRED_DIRS=(
  "docs"
  "docs/setup"
  "docs/guides" 
  "docs/technical"
  "docs/deployment"
  "docs/development"
)

for dir in "${REQUIRED_DIRS[@]}"; do
  if [ ! -d "$dir" ]; then
    echo "❌ MISSING REQUIRED DIRECTORY: $dir"
    echo "   Run: mkdir -p $dir"
    exit 1
  fi
done

# Check for missing docs/README.md
if [ ! -f "docs/README.md" ]; then
  echo "❌ MISSING DOCUMENTATION INDEX: docs/README.md"
  echo "   This file is required for navigation"
  exit 1
fi

# All checks passed
echo "✅ Documentation schema compliance verified"
echo "   • Root directory: $ROOT_MD_FILES/$MAX_ROOT_MD files"
echo "   • Required structure: Present"
echo "   • Naming conventions: Compliant"

exit 0