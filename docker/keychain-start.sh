#!/bin/bash

# ProspectPro Keychain Integration
# Uses system keychain for maximum security

set -e

KEYCHAIN_SERVICE="prospectpro"

store_secret() {
    local key="$1"
    local value="$2"
    
    if command -v security >/dev/null 2>&1; then
        # macOS Keychain
        security add-generic-password -a "$USER" -s "$KEYCHAIN_SERVICE-$key" -w "$value" -U
    elif command -v secret-tool >/dev/null 2>&1; then
        # Linux Secret Service
        echo "$value" | secret-tool store --label="ProspectPro $key" service "$KEYCHAIN_SERVICE" key "$key"
    else
        echo "❌ No keychain service available. Install 'secret-tool' on Linux or use macOS"
        exit 1
    fi
}

get_secret() {
    local key="$1"
    
    if command -v security >/dev/null 2>&1; then
        # macOS Keychain
        security find-generic-password -a "$USER" -s "$KEYCHAIN_SERVICE-$key" -w 2>/dev/null
    elif command -v secret-tool >/dev/null 2>&1; then
        # Linux Secret Service
        secret-tool lookup service "$KEYCHAIN_SERVICE" key "$key" 2>/dev/null
    fi
}

setup_keychain_credentials() {
    echo "🔐 Setting up ProspectPro credentials in system keychain..."
    
    read -p "Supabase URL: " SUPABASE_URL
    read -s -p "Supabase Secret Key: " SUPABASE_SECRET_KEY; echo
    read -s -p "Google Places API Key: " GOOGLE_PLACES_API_KEY; echo
    read -s -p "Foursquare API Key: " FOURSQUARE_API_KEY; echo
    read -s -p "Hunter.io API Key: " HUNTER_IO_API_KEY; echo
    read -s -p "NeverBounce API Key: " NEVERBOUNCE_API_KEY; echo
    read -s -p "Personal Access Token: " PERSONAL_ACCESS_TOKEN; echo
    
    store_secret "SUPABASE_URL" "$SUPABASE_URL"
    store_secret "SUPABASE_SECRET_KEY" "$SUPABASE_SECRET_KEY"
    store_secret "GOOGLE_PLACES_API_KEY" "$GOOGLE_PLACES_API_KEY"
    store_secret "FOURSQUARE_API_KEY" "$FOURSQUARE_API_KEY"
    store_secret "HUNTER_IO_API_KEY" "$HUNTER_IO_API_KEY"
    store_secret "NEVERBOUNCE_API_KEY" "$NEVERBOUNCE_API_KEY"
    store_secret "PERSONAL_ACCESS_TOKEN" "$PERSONAL_ACCESS_TOKEN"
    
    echo "✅ Credentials stored securely in system keychain"
}

start_with_keychain() {
    echo "🔐 Loading credentials from keychain..."
    
    export SUPABASE_URL="$(get_secret SUPABASE_URL)"
    export SUPABASE_SECRET_KEY="$(get_secret SUPABASE_SECRET_KEY)"
    export GOOGLE_PLACES_API_KEY="$(get_secret GOOGLE_PLACES_API_KEY)"
    export FOURSQUARE_API_KEY="$(get_secret FOURSQUARE_API_KEY)"
    export HUNTER_IO_API_KEY="$(get_secret HUNTER_IO_API_KEY)"
    export NEVERBOUNCE_API_KEY="$(get_secret NEVERBOUNCE_API_KEY)"
    export PERSONAL_ACCESS_TOKEN="$(get_secret PERSONAL_ACCESS_TOKEN)"
    
    if [[ -z "$SUPABASE_URL" ]]; then
        echo "❌ Credentials not found in keychain. Run: $0 setup"
        exit 1
    fi
    
    echo "✅ Credentials loaded from keychain"
    
    # Start Docker with environment variables
    if [[ "$1" == "dev" ]]; then
        docker-compose -f docker-compose.dev.yml up -d
    else
        docker-compose up -d
    fi
}

case "$1" in
    "setup")
        setup_keychain_credentials
        ;;
    "start")
        start_with_keychain
        ;;
    "dev")
        start_with_keychain "dev"
        ;;
    *)
        echo "Usage: $0 {setup|start|dev}"
        ;;
esac