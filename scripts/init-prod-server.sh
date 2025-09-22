#!/bin/bash

# ProspectPro Production Server Initialization Script
# Triggers environment generation workflow and starts production server

set -e

echo "🚀 ProspectPro Production Server Initialization"
echo "=============================================="

# Function to trigger GitHub Actions workflow
trigger_env_workflow() {
    local github_token="${GHP_SECRET:-$GITHUB_TOKEN}"
    local repo_owner="${GITHUB_REPOSITORY_OWNER:-Alextorelli}"
    local repo_name="${GITHUB_REPOSITORY_NAME:-ProspectPro}"
    
    if [ -z "$github_token" ]; then
        echo "⚠️  No GitHub token found (GHP_SECRET or GITHUB_TOKEN)"
        echo "   Set repository secret 'GHP_SECRET' or environment variable 'GHP_SECRET'"
        echo "   Using local environment generation instead..."
        return 1
    fi
    
    echo "🔔 Using new production environment puller script..."
    echo "📋 Repository: $repo_owner/$repo_name"
    
    # Use the new environment puller script
    if ./scripts/pull-env-from-secrets.js; then
        echo "✅ Production environment generated successfully"
        return 0
    else
        echo "❌ Environment generation script failed"
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

# Function to start production server
start_production_server() {
    echo "🌐 Starting ProspectPro production server..."
    
    # Set production environment
    export NODE_ENV=production
    export ALLOW_DEGRADED_START=true  # Allow startup even if some API keys missing
    
    # Start server with production optimizations
    node server.js
}

# Main execution flow
main() {
    local skip_workflow_trigger=false
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --skip-workflow)
                skip_workflow_trigger=true
                shift
                ;;
            --help|-h)
                echo "Usage: $0 [--skip-workflow] [--help]"
                echo ""
                echo "Options:"
                echo "  --skip-workflow  Skip triggering GitHub Actions workflow"
                echo "  --help, -h       Show this help message"
                exit 0
                ;;
            *)
                echo "Unknown option: $1"
                exit 1
                ;;
        esac
    done
    
    # Check if .env already exists and is valid
    if [ -f ".env" ] && ! grep -q "your_supabase.*_here\|your_service_role_key_here\|your-project-ref\.supabase\.co" .env; then
        echo "✅ Valid .env file already exists, skipping workflow trigger"
        skip_workflow_trigger=true
    fi
    
    # Step 1: Trigger environment generation workflow (unless skipped)
    if [ "$skip_workflow_trigger" = false ]; then
        if ! trigger_env_workflow; then
            echo "⚠️  Workflow trigger failed or unavailable"
            echo "   Run manually: npm run prod:setup-env"
            echo "   Then edit .env file with your Supabase credentials"
            exit 1
        fi
        
        # Step 2: Check for environment file readiness
        if ! wait_for_env; then
            echo "❌ Environment configuration incomplete"
            echo "   Complete the setup: npm run prod:setup-env"
            echo "   Edit .env with real credentials, then: npm run prod:check"
            exit 1
        fi
    else
        echo "⏭️  Skipping workflow trigger"
        # If skipping workflow, we MUST have a valid .env file
        if ! wait_for_env; then
            echo "❌ Cannot start production server"
            echo "   Missing or incomplete .env file"
            echo "   Run: npm run prod:setup-env"
            echo "   Then edit .env with your Supabase credentials"
            exit 1
        fi
    fi
    
    # Step 3: Validate environment
    if ! validate_environment; then
        echo "❌ Environment validation failed"
        exit 1
    fi
    
    # Step 4: Start production server
    echo ""
    echo "🚀 All systems ready - starting production server!"
    echo "=================================================="
    start_production_server
}

# Handle script interruption
trap 'echo "🛑 Production server initialization interrupted"; exit 1' INT TERM

# Run main function with all arguments
main "$@"