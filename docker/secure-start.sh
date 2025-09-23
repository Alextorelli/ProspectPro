#!/bin/bash

# ProspectPro Secure Credential Manager
# Stores credentials securely on your local machine and injects into Docker

CREDENTIALS_FILE="$HOME/.prospectpro/credentials"
CREDENTIALS_DIR="$(dirname "$CREDENTIALS_FILE")"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

setup_credentials() {
    echo -e "${GREEN}🔐 Setting up ProspectPro credentials...${NC}"
    
    # Create secure credentials directory
    mkdir -p "$CREDENTIALS_DIR"
    chmod 700 "$CREDENTIALS_DIR"
    
    echo -e "${YELLOW}Enter your credentials (they will be stored securely):${NC}"
    
    # Collect credentials securely
    read -p "Supabase URL: " SUPABASE_URL
    read -s -p "Supabase Secret Key: " SUPABASE_SECRET_KEY
    echo ""
    read -s -p "Google Places API Key: " GOOGLE_PLACES_API_KEY  
    echo ""
    read -s -p "Foursquare API Key: " FOURSQUARE_API_KEY
    echo ""
    read -s -p "Hunter.io API Key: " HUNTER_IO_API_KEY
    echo ""
    read -s -p "NeverBounce API Key: " NEVERBOUNCE_API_KEY
    echo ""
    read -s -p "Personal Access Token: " PERSONAL_ACCESS_TOKEN
    echo ""
    
    # Store credentials securely
    cat > "$CREDENTIALS_FILE" << EOF
# ProspectPro Secure Credentials
# Created: $(date)
export SUPABASE_URL="$SUPABASE_URL"
export SUPABASE_SECRET_KEY="$SUPABASE_SECRET_KEY"
export GOOGLE_PLACES_API_KEY="$GOOGLE_PLACES_API_KEY"
export FOURSQUARE_API_KEY="$FOURSQUARE_API_KEY"
export HUNTER_IO_API_KEY="$HUNTER_IO_API_KEY"
export NEVERBOUNCE_API_KEY="$NEVERBOUNCE_API_KEY"
export PERSONAL_ACCESS_TOKEN="$PERSONAL_ACCESS_TOKEN"
EOF
    
    # Secure the file
    chmod 600 "$CREDENTIALS_FILE"
    
    echo -e "${GREEN}✅ Credentials stored securely at $CREDENTIALS_FILE${NC}"
}

load_and_start_docker() {
    if [[ ! -f "$CREDENTIALS_FILE" ]]; then
        echo -e "${RED}❌ Credentials not found. Run: $0 setup${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}🔐 Loading credentials and starting Docker...${NC}"
    
    # Load credentials
    source "$CREDENTIALS_FILE"
    
    # Start Docker with credentials
    docker-compose up -d
    
    echo -e "${GREEN}✅ ProspectPro started with secure credentials!${NC}"
    echo -e "${GREEN}🌐 Access: http://localhost:3000${NC}"
}

case "$1" in
    "setup")
        setup_credentials
        ;;
    "start"|"")
        load_and_start_docker
        ;;
    "dev")
        source "$CREDENTIALS_FILE" 2>/dev/null || { echo "Run setup first"; exit 1; }
        docker-compose -f docker-compose.dev.yml up -d
        ;;
    *)
        echo "Usage: $0 {setup|start|dev}"
        echo "  setup - Configure credentials (run once)"
        echo "  start - Start production with saved credentials"
        echo "  dev   - Start development with saved credentials"
        ;;
esac