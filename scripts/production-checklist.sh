#!/bin/bash

# ============================================================================
# ProspectPro Production Readiness Checklist v3.0
# Validates complete production environment before deployment
# ============================================================================

set -euo pipefail

echo "📋 ProspectPro Production Readiness Checklist v3.0"
echo "=================================================="

# Configuration
PROJECT_ROOT="$(dirname "$(realpath "$0")")/.."
CHECKLIST_LOG="${PROJECT_ROOT}/logs/production-checklist.log"

# Initialize checklist log
cat > "$CHECKLIST_LOG" << EOF
# ProspectPro Production Readiness Checklist
# Generated: $(date -Iseconds)
# Project: $PROJECT_ROOT
# ==========================================

EOF

log_check() {
    local status="$1"
    local message="$2"
    local detail="${3:-}"
    
    echo "$status $message"
    echo "[$status] $message" >> "$CHECKLIST_LOG"
    
    if [ -n "$detail" ]; then
        echo "    $detail"
        echo "    $detail" >> "$CHECKLIST_LOG"
    fi
}

check_passed() {
    log_check "✅" "$1" "${2:-}"
}

check_failed() {
    log_check "❌" "$1" "${2:-}"
    return 1
}

check_warning() {
    log_check "⚠️ " "$1" "${2:-}"
}

echo ""
echo "🔍 PHASE 1: Environment Validation"
echo "=================================="

# Check 1.1: Required environment variables
echo "1.1 Checking environment variables..."
REQUIRED_VARS=("SUPABASE_URL" "SUPABASE_SECRET_KEY")
ENV_PASSED=true

for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var:-}" ]; then
        check_failed "Missing: $var" "Set this in GitHub repository secrets"
        ENV_PASSED=false
    else
        VAR_VALUE="${!var}"
        check_passed "Present: $var" "Length: ${#VAR_VALUE} chars"
    fi
done

# Check 1.2: Supabase URL format
if [ -n "${SUPABASE_URL:-}" ]; then
    if [[ "$SUPABASE_URL" =~ ^https://[a-z0-9]+\.supabase\.co$ ]]; then
        check_passed "Supabase URL format valid" "$SUPABASE_URL"
    else
        check_failed "Invalid Supabase URL format" "Expected: https://xxx.supabase.co"
        ENV_PASSED=false
    fi
fi

# Check 1.3: GitHub token for workflow
if [ -n "${GHP_TOKEN:-}" ] || [ -n "${GITHUB_TOKEN:-}" ]; then
    TOKEN_SOURCE="${GHP_TOKEN:+GHP_TOKEN}${GITHUB_TOKEN:+GITHUB_TOKEN}"
    check_passed "GitHub token available" "Source: $TOKEN_SOURCE"
else
    check_warning "No GitHub token" "Workflow artifact generation may fail"
fi

if [ "$ENV_PASSED" = true ]; then
    check_passed "Environment validation completed"
else
    check_failed "Environment validation failed" "Fix missing variables before proceeding"
    exit 1
fi

echo ""
echo "🔗 PHASE 2: Database Connectivity"
echo "================================="

# Check 2.1: Database validation script
echo "2.1 Running comprehensive database validation..."
if node "${PROJECT_ROOT}/scripts/validate-production-database-v31.js" >> "$CHECKLIST_LOG" 2>&1; then
    check_passed "Database validation passed" "Schema, vault, and API keys verified"
else
    check_failed "Database validation failed" "Check database-validation.log for details"
    exit 1
fi

echo ""
echo "📁 PHASE 3: File System Validation"
echo "=================================="

# Check 3.1: Critical files exist
echo "3.1 Checking critical files..."
CRITICAL_FILES=(
    "server.js"
    "config/supabase.js"
    "database/all-phases-consolidated.sql"
    "database/08-enable-supabase-vault.sql"
    "api/business-discovery.js"
    "api/campaign-export.js"
)

FILES_PASSED=true
for file in "${CRITICAL_FILES[@]}"; do
    if [ -f "${PROJECT_ROOT}/$file" ]; then
        SIZE=$(stat -f%z "${PROJECT_ROOT}/$file" 2>/dev/null || stat -c%s "${PROJECT_ROOT}/$file")
        check_passed "File exists: $file" "Size: ${SIZE} bytes"
    else
        check_failed "Missing file: $file" "Required for production startup"
        FILES_PASSED=false
    fi
done

# Check 3.2: Package dependencies
echo "3.2 Checking package.json..."
if [ -f "${PROJECT_ROOT}/package.json" ]; then
    DEPS_COUNT=$(node -e "console.log(Object.keys(require('./package.json').dependencies || {}).length)")
    check_passed "Package.json exists" "Dependencies: $DEPS_COUNT"
    
    # Check for critical dependencies
    CRITICAL_DEPS=("@supabase/supabase-js" "express")
    for dep in "${CRITICAL_DEPS[@]}"; do
        if node -e "require('./package.json')" -e "process.exit(require('./package.json').dependencies['$dep'] ? 0 : 1)" 2>/dev/null; then
            check_passed "Dependency: $dep" "Present in package.json"
        else
            check_failed "Missing dependency: $dep" "Run: npm install $dep"
            FILES_PASSED=false
        fi
    done
else
    check_failed "Missing package.json" "Required for dependency management"
    FILES_PASSED=false
fi

if [ "$FILES_PASSED" = false ]; then
    check_failed "File system validation failed" "Fix missing files before proceeding"
    exit 1
fi

echo ""
echo "🚀 PHASE 4: Production Server Test"
echo "=================================="

# Check 4.1: Test production server startup
echo "4.1 Testing production server initialization..."
export NODE_ENV=production

# Start server in background for testing
timeout 30s node "${PROJECT_ROOT}/server.js" > "${PROJECT_ROOT}/logs/server-test.log" 2>&1 &
SERVER_PID=$!

# Wait for server to start
sleep 5

# Test if server is responding
if kill -0 $SERVER_PID 2>/dev/null; then
    check_passed "Production server started successfully" "PID: $SERVER_PID"
    
    # Test health endpoint if server is accessible
    if command -v curl >/dev/null 2>&1; then
        if curl -s http://localhost:3000/health > /dev/null 2>&1; then
            check_passed "Health endpoint responding" "Server fully functional"
        else
            check_warning "Health endpoint not accessible" "Server may still be initializing"
        fi
    fi
    
    # Clean up test server
    kill $SERVER_PID 2>/dev/null || true
    wait $SERVER_PID 2>/dev/null || true
else
    check_failed "Production server failed to start" "Check production-startup.log for errors"
    exit 1
fi

echo ""
echo "🎯 PHASE 5: Production Readiness Summary"
echo "========================================"

# Count checks (disable strict mode temporarily for grep)
set +e
TOTAL_CHECKS=$(grep -c "^\[✅\|❌\|⚠️ \]" "$CHECKLIST_LOG" 2>/dev/null | head -1)
PASSED_CHECKS=$(grep -c "^\[✅\]" "$CHECKLIST_LOG" 2>/dev/null | head -1)
FAILED_CHECKS=$(grep -c "^\[❌\]" "$CHECKLIST_LOG" 2>/dev/null | head -1)  
WARNING_CHECKS=$(grep -c "^\[⚠️ \]" "$CHECKLIST_LOG" 2>/dev/null | head -1)
set -e

# Set defaults if empty
TOTAL_CHECKS=${TOTAL_CHECKS:-0}
PASSED_CHECKS=${PASSED_CHECKS:-0}
FAILED_CHECKS=${FAILED_CHECKS:-0}
WARNING_CHECKS=${WARNING_CHECKS:-0}

echo "📊 Checklist Results:"
echo "   ✅ Passed: $PASSED_CHECKS"
echo "   ❌ Failed: $FAILED_CHECKS"
echo "   ⚠️  Warnings: $WARNING_CHECKS"
echo "   📋 Total: $TOTAL_CHECKS"
echo ""

if [ $FAILED_CHECKS -eq 0 ]; then
    echo "🎉 PRODUCTION READINESS: PASSED"
    echo "==============================="
    echo "✅ ProspectPro is ready for production deployment"
    echo "🚀 You can now run: ./scripts/init-prod-server.sh"
    echo "📋 Full checklist log: $CHECKLIST_LOG"
    echo ""
    exit 0
else
    echo "❌ PRODUCTION READINESS: FAILED"
    echo "==============================="
    echo "🔧 Fix $FAILED_CHECKS failed check(s) before deployment"
    echo "📋 Full checklist log: $CHECKLIST_LOG"
    echo ""
    echo "Common fixes:"
    echo "1. Set SUPABASE_URL and SUPABASE_SECRET_KEY in GitHub secrets"
    echo "2. Run database/all-phases-consolidated.sql in Supabase"
    echo "3. Configure API keys in Supabase Dashboard → Vault"
    echo "4. Ensure all required files are present"
    echo ""
    exit 1
fi