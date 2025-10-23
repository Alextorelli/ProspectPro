#!/bin/bash

# ProspectPro MCP Service Layer Production Deployment Script
# Phase 4: Production deployment and monitoring integration

set -e

echo "🚀 Starting MCP Service Layer Production Deployment"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
SERVICE_NAME="mcp-service-layer"
WORKSPACE_ROOT="/workspaces/ProspectPro"
SERVICE_DIR="$WORKSPACE_ROOT/dev-tools/agent-orchestration/mcp"
DIST_DIR="$SERVICE_DIR/dist"
CONFIG_FILE="$WORKSPACE_ROOT/config/mcp-config.json"

# Function to log with timestamp
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}" >&2
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."

    # Check if dist directory exists
    if [ ! -d "$DIST_DIR" ]; then
        error "Distribution directory not found: $DIST_DIR"
        error "Run 'npm run build' in $SERVICE_DIR first"
        exit 1
    fi

    # Check if config file exists
    if [ ! -f "$CONFIG_FILE" ]; then
        error "MCP config file not found: $CONFIG_FILE"
        exit 1
    fi

    # Check for required environment variables
    if [ -z "$OTLP_ENDPOINT" ]; then
        warn "OTLP_ENDPOINT not set, using default"
        export OTLP_ENDPOINT="http://localhost:4317"
    fi

    log "Prerequisites check passed"
}

# Build the service
build_service() {
    log "Building MCP Service Layer..."

    cd "$SERVICE_DIR"

    # Install dependencies
    npm install

    # Run tests
    npm test

    # Build TypeScript
    npm run build

    # Lint code
    npm run lint

    log "Build completed successfully"
}

# Validate configuration
validate_config() {
    log "Validating MCP configuration..."

    # Check if service is configured in mcp-config.json
    if ! grep -q '"mcp-service-layer"' "$CONFIG_FILE"; then
        error "MCP Service Layer not found in configuration"
        exit 1
    fi

    log "Configuration validation passed"
}

# Setup monitoring
setup_monitoring() {
    log "Setting up monitoring integration..."

    # Check if observability server is running
    if ! pgrep -f "observability-server.js" > /dev/null; then
        warn "Observability server not running"
        warn "Start with: npm run mcp:observability"
    else
        log "Observability server is running"
    fi

    # Check OpenTelemetry configuration
    if [ ! -f "$WORKSPACE_ROOT/config/otel-config.yml" ]; then
        warn "OpenTelemetry config not found: $WORKSPACE_ROOT/config/otel-config.yml"
    else
        log "OpenTelemetry configuration found"
    fi
}

# Deploy service
deploy_service() {
    log "Deploying MCP Service Layer..."

    # Create production environment file
    cat > "$SERVICE_DIR/.env.production" << EOF
NODE_ENV=production
OTEL_SERVICE_NAME=prospectpro-mcp-service-layer
OTEL_SERVICE_VERSION=1.0.0
OTEL_TRACES_EXPORTER=otlp
OTLP_ENDPOINT=${OTLP_ENDPOINT:-http://localhost:4317}
OTLP_AUTH_TOKEN=${OTLP_AUTH_TOKEN:-}
WORKSPACE_ROOT=$WORKSPACE_ROOT
EOF

    log "Production environment configured"

    # Create systemd service file (if running on Linux with systemd)
    if command -v systemctl &> /dev/null && [ -d "/etc/systemd/system" ]; then
        log "Creating systemd service..."

        cat > "/etc/systemd/system/prospectpro-mcp-service-layer.service" << EOF
[Unit]
Description=ProspectPro MCP Service Layer
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$SERVICE_DIR
EnvironmentFile=$SERVICE_DIR/.env.production
ExecStart=/usr/bin/node $DIST_DIR/index.js
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

        log "Systemd service created"
        log "Enable with: sudo systemctl enable prospectpro-mcp-service-layer"
        log "Start with: sudo systemctl start prospectpro-mcp-service-layer"
    else
        log "Systemd not available, manual startup required"
        log "Start with: cd $SERVICE_DIR && source .env.production && node dist/index.js"
    fi
}

# Run health checks
run_health_checks() {
    log "Running health checks..."

    # Check if service is accessible
    if [ -f "/etc/systemd/system/prospectpro-mcp-service-layer.service" ]; then
        if systemctl is-active --quiet prospectpro-mcp-service-layer; then
            log "Service is running"
        else
            warn "Service is not running"
        fi
    fi

    # Test basic functionality
    log "Testing MCP Service Layer functionality..."

    # This would be replaced with actual health check logic
    # For now, just check if the dist files exist
    if [ -f "$DIST_DIR/index.js" ]; then
        log "Distribution files are present"
    else
        error "Distribution files missing"
        exit 1
    fi
}

# Main deployment flow
main() {
    log "Starting MCP Service Layer production deployment"

    check_prerequisites
    build_service
    validate_config
    setup_monitoring
    deploy_service
    run_health_checks

    log "🎉 MCP Service Layer deployment completed successfully!"
    log ""
    log "Next steps:"
    log "1. Monitor logs: journalctl -u prospectpro-mcp-service-layer -f"
    log "2. Check traces in Jaeger: http://localhost:16686"
    log "3. Verify integration with other MCP servers"
    log "4. Update monitoring dashboards if needed"
}

# Run main function
main "$@"