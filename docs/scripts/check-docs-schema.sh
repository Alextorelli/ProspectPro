# ...existing code from dev-tools/scripts/tooling/check-docs-schema.sh
#!/bin/bash

# ProspectPro Documentation Schema Enforcement Pre-commit Hook
# Prevents commits that violate the documentation organization rules

set -euo pipefail

EXPECTED_REPO_ROOT=${EXPECTED_REPO_ROOT:-/workspaces/ProspectPro}

require_repo_root() {
	local repo_root
	if ! repo_root=$(git rev-parse --show-toplevel 2>/dev/null); then
		echo "[31m[1m[0m Run this script from inside the ProspectPro repo"
		exit 1
	fi

	if [ "$repo_root" != "$EXPECTED_REPO_ROOT" ]; then
		echo "[31m[1m[0m Wrong directory. Expected repo root: $EXPECTED_REPO_ROOT"
		echo "   Current directory: $repo_root"
		exit 1
	fi
}

require_repo_root

echo "[34m[1m[0m Checking documentation schema compliance..."

if [ "${SKIP_DOC_SCHEMA:-0}" = "1" ]; then
	echo "[33m[1m[0m Documentation schema enforcement skipped (SKIP_DOC_SCHEMA=1)."
	exit 0
fi

# Count markdown files in root directory
ROOT_MD_FILES=$(find . -maxdepth 1 -name "*.md" -not -path "./docs/*" | wc -l)
MAX_ROOT_MD=3

# Check if we're exceeding the root markdown limit
if [ "$ROOT_MD_FILES" -gt "$MAX_ROOT_MD" ]; then
	echo "[31m[1m[0m DOCUMENTATION SCHEMA VIOLATION"
	echo ""
	echo "   Root directory contains $ROOT_MD_FILES markdown files"
	echo "   Maximum allowed: $MAX_ROOT_MD"
	echo ""
	echo "   Current root .md files:"
	find . -maxdepth 1 -name "*.md" -not -path "./docs/*" | sed 's|./||' | sed 's/^/   - /'
	echo ""
	echo "   Allowed root files: README.md, CHANGELOG.md, PRODUCTION_READY_REPORT.md"
	echo ""
	echo "   [33m[1m[0m Move documentation to appropriate docs/ subdirectory:"
	echo "      [32m[1m[0m Setup guides [34m[1m[0m docs/setup/"
	echo "      [32m[1m[0m User guides [34m[1m[0m docs/guides/"
	echo "      [32m[1m[0m Technical docs [34m[1m[0m docs/technical/"
	echo "      [32m[1m[0m Deployment guides [34m[1m[0m docs/deployment/"
	echo "      [32m[1m[0m Development docs [34m[1m[0m docs/development/"
	echo ""
	echo "   [36m[1m[0m Or archive to appropriate branch:"
	echo "      [32m[1m[0m Development artifacts [34m[1m[0m archive/development-phase"
	echo "      [32m[1m[0m Legacy deployment [34m[1m[0m archive/deployment-phase"
	echo "      [32m[1m[0m Test reports [34m[1m[0m archive/testing-reports"
	echo "      [32m[1m[0m Production legacy [34m[1m[0m archive/production-legacy"
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
	echo "[31m[1m[0m DOCUMENTATION NAMING VIOLATIONS"
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
		echo "[31m[1m[0m MISSING REQUIRED DIRECTORY: $dir"
		echo "   Run: mkdir -p $dir"
		exit 1
	fi
done

# Check for missing docs/README.md
if [ ! -f "docs/README.md" ]; then
	echo "[31m[1m[0m MISSING DOCUMENTATION INDEX: docs/README.md"
	echo "   This file is required for navigation"
	exit 1
fi

# All checks passed
echo "[32m[1m[0m Documentation schema compliance verified"
echo "   [32m[1m[0m Root directory: $ROOT_MD_FILES/$MAX_ROOT_MD files"
echo "   [32m[1m[0m Required structure: Present"
echo "   [32m[1m[0m Naming conventions: Compliant"

exit 0
# ...existing code from dev-tools/scripts/tooling/check-docs-schema.sh
