#!/bin/bash

# ProspectPro Production Server Initialization Script
# Triggers environment generation workflow and starts production server

set -e

echo "🚀 ProspectPro Production Server Initialization"
echo "=============================================="

# Function to trigger GitHub Actions workflow
trigger_env_workflow() {
    local github_token="${GITHUB_TOKEN:-$GITHUB_PAT}"
    local repo_owner="${GITHUB_REPOSITORY_OWNER:-Alextorelli}"
    local repo_name="${GITHUB_REPOSITORY_NAME:-ProspectPro}"
    
    if [ -z "$github_token" ]; then
        echo "⚠️  No GitHub token found (GITHUB_TOKEN or GITHUB_PAT)"
        echo "   Skipping workflow trigger - ensure .env is manually configured"
        return 1
    fi
    
    echo "🔔 Triggering environment generation workflow..."
    
    # Trigger the workflow via GitHub API
    curl -X POST \
        -H "Accept: application/vnd.github+json" \
        -H "Authorization: Bearer $github_token" \
        -H "X-GitHub-Api-Version: 2022-11-28" \
        "https://api.github.com/repos/$repo_owner/$repo_name/dispatches" \
        -d '{"event_type":"server-init","client_payload":{"source":"production-server-init","timestamp":"'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"}}' \
        && echo "✅ Workflow triggered successfully" \
        || echo "❌ Failed to trigger workflow"
}

# Function to wait for environment file
wait_for_env() {
    local max_wait=300  # 5 minutes
    local wait_time=0
    
    echo "⏳ Waiting for .env file to be generated..."
    
    while [ $wait_time -lt $max_wait ]; do
        if [ -f ".env" ]; then
            # Check if .env has real values (not just templates)
            if ! grep -q "your_.*_here" .env; then
                echo "✅ Production .env file ready"
                return 0
            else
                echo "⏳ .env file exists but contains template values..."
            fi
        fi
        
        sleep 10
        wait_time=$((wait_time + 10))
        
        if [ $((wait_time % 60)) -eq 0 ]; then
            echo "⏳ Still waiting for environment generation (${wait_time}s elapsed)..."
        fi
    done
    
    echo "⚠️  Timeout waiting for .env file generation"
    return 1
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
    if [ -f ".env" ] && ! grep -q "your_.*_here" .env; then
        echo "✅ Valid .env file already exists, skipping workflow trigger"
        skip_workflow_trigger=true
    fi
    
    # Step 1: Trigger environment generation workflow (unless skipped)
    if [ "$skip_workflow_trigger" = false ]; then
        if ! trigger_env_workflow; then
            echo "⚠️  Workflow trigger failed, checking for existing .env..."
            if [ ! -f ".env" ]; then
                echo "❌ No .env file available and workflow trigger failed"
                echo "   Please manually create .env file or set GitHub token"
                exit 1
            fi
        else
            # Step 2: Wait for environment file generation
            if ! wait_for_env; then
                echo "❌ Environment generation failed or timed out"
                exit 1
            fi
        fi
    else
        echo "⏭️  Skipping workflow trigger"
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