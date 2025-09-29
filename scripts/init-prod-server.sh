#!/bin/bash

#!/bin/bash

# ============================================================================
# ProspectPro Production Server Initialization v2.0
# Enhanced Option B1: Direct workflow output retrieval
# ============================================================================

set -euo pipefail

echo "🚀 ProspectPro Production Server Initialization v2.0"
echo "=============================================================="
echo "🎯 Enhanced Option B1: Workflow Output Retrieval"
echo "🔒 Repository Secrets: Encrypted & Secure"
echo "⚡ Zero Manual Configuration Required"
echo ""

# Configuration
PROJECT_ROOT="$(pwd)"
LOG_FILE="${PROJECT_ROOT}/logs/startup.log"
ENV_FILE="${PROJECT_ROOT}/.env"
SCRIPTS_DIR="${PROJECT_ROOT}/scripts"

echo "📋 Project root: $PROJECT_ROOT"
echo "📁 Environment file: $ENV_FILE"
echo "📄 Log file: $LOG_FILE"

# Initialize log file
echo "🔧 Initializing startup log..."
echo "# ProspectPro Production Startup Log" > "$LOG_FILE"
echo "# Started: $(date -Iseconds)" >> "$LOG_FILE"
echo "# Enhanced Option B1: Workflow Output Retrieval" >> "$LOG_FILE"
echo "# ==============================================" >> "$LOG_FILE"
echo ""

# Check required environment variables
check_github_token() {
    echo "🔑 Checking GitHub authentication..."
    
    if [[ -n "${GHP_TOKEN:-}" ]]; then
        echo "✅ GHP_TOKEN found in environment"
        echo "# GitHub Token: Found GHP_TOKEN in environment" >> "$LOG_FILE"
        return 0
    fi
    
    if [[ -n "${GITHUB_TOKEN:-}" ]]; then
        echo "✅ GITHUB_TOKEN found in environment"
        echo "# GitHub Token: Found GITHUB_TOKEN in environment" >> "$LOG_FILE"
        return 0
    fi
    
    echo "❌ No GitHub token found!"
    echo "# ERROR: No GitHub token found" >> "$LOG_FILE"
    echo ""
    echo "Required: Set one of these environment variables:"
    echo "  export GHP_TOKEN='your_github_personal_access_token'"
    echo "  export GITHUB_TOKEN='your_github_personal_access_token'"
    echo ""
    echo "Token Requirements:"
    echo "  - repo: Full control of private repositories"
    echo "  - workflow: Update GitHub Action workflows"  
    echo "  - read:org: Read organization membership"
    echo ""
    exit 1
}

set -e

echo "🚀 ProspectPro Production Server Initialization"
echo "=============================================="

# Function to trigger GitHub Actions workflow - Enhanced Option B1
trigger_env_workflow() {
    local github_token="${GHP_TOKEN:-$GITHUB_TOKEN}"
    local repo_owner="${GITHUB_REPOSITORY_OWNER:-Alextorelli}"
    local repo_name="${GITHUB_REPOSITORY_NAME:-ProspectPro}"
    
    if [ -z "$github_token" ]; then
        echo "⚠️  No GitHub token found (GHP_TOKEN or GITHUB_TOKEN)"
        echo "   Set repository secret 'GHP_TOKEN' or environment variable 'GHP_TOKEN'"
        echo "   Cannot proceed with Enhanced Option B1 without authentication"
        return 1
    fi
    
    echo "� Enhanced Option B1: Direct workflow output retrieval"
    echo "📋 Repository: $repo_owner/$repo_name"
    echo "🔑 Token source: ${GHP_TOKEN:+GHP_TOKEN}${GITHUB_TOKEN:+GITHUB_TOKEN}"
    
    # Use the new environment puller script v2.0
    if node ./scripts/pull-env-from-secrets.js; then
        echo "✅ Production environment generated successfully via workflow outputs"
        return 0
    else
        echo "❌ Environment generation script failed"
        echo "   Check GitHub token permissions and repository secrets"
        return 1
    fi
}

# Function to wait for environment file
wait_for_env() {
    echo "🔍 Checking for production .env file..."
    
    if [ -f ".env" ]; then
        # Check if .env has critical template values (not just optional ones)
        if ! grep -q "your_supabase.*_here\|your_service_role_key_here\|your-project-ref\.supabase\.co" .env; then
            echo "✅ Production .env file ready (core credentials configured)"
            return 0
        else
            echo "⚠️  .env file exists but requires manual credential configuration"
            echo "   Edit .env file and replace template values with real Supabase credentials"
            echo "   Then run: npm run prod:check"
            return 1
        fi
    else
        echo "❌ No .env file found"
        echo "   Run: npm run prod:setup-env  # Generate production environment template"
        return 1
    fi
}

# Function to validate environment
validate_environment() {
    echo "🔍 Validating production environment..."
    
    # Check required environment variables
    local required_vars=("SUPABASE_URL" "SUPABASE_SECRET_KEY" "NODE_ENV")
    local missing_vars=()
    
    # Load .env if it exists
    if [ -f ".env" ]; then
        set -a  # automatically export all variables
        source .env
        set +a
    fi
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -gt 0 ]; then
        echo "❌ Missing required environment variables:"
        printf "   - %s\n" "${missing_vars[@]}"
        return 1
    fi
    
    # Validate Supabase URL format
    if [[ "$SUPABASE_URL" =~ ^https://.*\.supabase\.co$ ]]; then
        echo "✅ Supabase URL format validated"
    else
        echo "⚠️  Supabase URL format may be incorrect: $SUPABASE_URL"
    fi
    
    echo "✅ Environment validation passed"
    return 0
}

# Function to validate production database
validate_production_database() {
    echo "🔍 Validating production database configuration..."
    
    if node ./scripts/validate-production-database-v31.js; then
        echo "✅ Database validation passed - production ready"
        return 0
    else
        echo "❌ Database validation failed"
        echo "   Production requires properly configured database"
        echo "   Check database-validation.log for details"
        return 1
    fi
}

# Function to start production server
start_production_server() {
    echo "🌐 Starting ProspectPro production server v3.0..."
    
    # Set production environment - NO degraded mode
    export NODE_ENV=production
    
    # Start server with production-grade initialization
    node server.js
}

# Main execution flow
main() {
    # Production mode: ALWAYS use workflow artifact, no fallback options
    echo "🔒 Production Mode: Workflow artifact required"
    
    # Parse command line arguments - only allow help
    while [[ $# -gt 0 ]]; do
        case $1 in
            --help|-h)
                echo "Usage: $0 [--help]"
                echo ""
                echo "Production Server Initialization"
                echo "Automatically triggers GitHub Actions workflow to generate environment"
                echo ""
                echo "Options:"
                echo "  --help, -h       Show this help message"
                echo ""
                echo "Requirements:"
                echo "  - GHP_TOKEN or GITHUB_TOKEN environment variable"
                echo "  - Repository secrets: SUPABASE_URL, SUPABASE_SECRET_KEY"
                echo "  - GitHub Actions workflow must complete successfully"
                exit 0
                ;;
            *)
                echo "❌ Invalid option: $1"
                echo "Production mode only supports --help"
                echo "All configuration must come from GitHub Actions workflow artifact"
                exit 1
                ;;
        esac
    done
    
    # Step 1: Always trigger environment generation workflow in production
    if ! trigger_env_workflow; then
        echo "❌ Workflow trigger failed - production requires workflow artifact"
        echo "   Production deployment MUST use GitHub Actions generated environment"
        echo "   Check GitHub token permissions and repository secrets"
        exit 1
    fi
    
    # Step 2: Verify environment file was created from workflow
    if ! wait_for_env; then
        echo "❌ Environment configuration failed to generate from workflow"
        echo "   Production requires valid workflow artifact"
        exit 1
    fi
    
    # Step 3: Validate database configuration
    if ! validate_production_database; then
        echo "❌ Database validation failed - production requires complete database setup"
        echo "   Run: database/all-phases-consolidated.sql in Supabase SQL Editor"
        echo "   Configure: API keys in Supabase Dashboard -> Settings -> Vault"
        exit 1
    fi
    
    # Step 4: Validate environment
    if ! validate_environment; then
        echo "❌ Environment validation failed"
        exit 1
    fi
    
    # Step 5: Start production server
    echo ""
    echo "🚀 All systems validated - starting production server!"
    echo "===================================================="
    start_production_server
}

# Handle script interruption
trap 'echo "🛑 Production server initialization interrupted"; exit 1' INT TERM

# Run main function with all arguments
main "$@"