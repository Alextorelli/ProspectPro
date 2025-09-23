#!/bin/bash

# ProspectPro 1Password Integration
# Requires 1Password CLI: brew install 1password-cli

set -e

VAULT_NAME="ProspectPro"

# Check if 1Password CLI is available
if ! command -v op >/dev/null 2>&1; then
    echo "❌ 1Password CLI not found. Install with: brew install 1password-cli"
    exit 1
fi

create_vault_items() {
    echo "🔐 Setting up ProspectPro secrets in 1Password..."
    
    # Check if signed in
    if ! op account list >/dev/null 2>&1; then
        echo "🔑 Please sign in to 1Password..."
        op signin
    fi
    
    read -p "Supabase URL: " SUPABASE_URL
    read -s -p "Supabase Secret Key: " SUPABASE_SECRET_KEY; echo
    read -s -p "Google Places API Key: " GOOGLE_PLACES_API_KEY; echo
    read -s -p "Foursquare API Key: " FOURSQUARE_API_KEY; echo
    read -s -p "Hunter.io API Key: " HUNTER_IO_API_KEY; echo
    read -s -p "NeverBounce API Key: " NEVERBOUNCE_API_KEY; echo
    read -s -p "Personal Access Token: " PERSONAL_ACCESS_TOKEN; echo
    
    # Create items in 1Password
    echo "$SUPABASE_URL" | op item create --category="API Credential" --title="ProspectPro-Supabase-URL" --vault="$VAULT_NAME" "credential[password]=-"
    echo "$SUPABASE_SECRET_KEY" | op item create --category="API Credential" --title="ProspectPro-Supabase-Key" --vault="$VAULT_NAME" "credential[password]=-"
    echo "$GOOGLE_PLACES_API_KEY" | op item create --category="API Credential" --title="ProspectPro-Google-Places" --vault="$VAULT_NAME" "credential[password]=-"
    echo "$FOURSQUARE_API_KEY" | op item create --category="API Credential" --title="ProspectPro-Foursquare" --vault="$VAULT_NAME" "credential[password]=-"
    echo "$HUNTER_IO_API_KEY" | op item create --category="API Credential" --title="ProspectPro-Hunter-IO" --vault="$VAULT_NAME" "credential[password]=-"
    echo "$NEVERBOUNCE_API_KEY" | op item create --category="API Credential" --title="ProspectPro-NeverBounce" --vault="$VAULT_NAME" "credential[password]=-"
    echo "$PERSONAL_ACCESS_TOKEN" | op item create --category="API Credential" --title="ProspectPro-Admin-Token" --vault="$VAULT_NAME" "credential[password]=-"
    
    echo "✅ All credentials stored in 1Password vault: $VAULT_NAME"
}

start_with_1password() {
    echo "🔐 Loading credentials from 1Password..."
    
    # Check if signed in
    if ! op account list >/dev/null 2>&1; then
        echo "🔑 Signing in to 1Password..."
        op signin
    fi
    
    # Load credentials from 1Password
    export SUPABASE_URL="$(op item get 'ProspectPro-Supabase-URL' --fields password --vault="$VAULT_NAME")"
    export SUPABASE_SECRET_KEY="$(op item get 'ProspectPro-Supabase-Key' --fields password --vault="$VAULT_NAME")"
    export GOOGLE_PLACES_API_KEY="$(op item get 'ProspectPro-Google-Places' --fields password --vault="$VAULT_NAME")"
    export FOURSQUARE_API_KEY="$(op item get 'ProspectPro-Foursquare' --fields password --vault="$VAULT_NAME")"
    export HUNTER_IO_API_KEY="$(op item get 'ProspectPro-Hunter-IO' --fields password --vault="$VAULT_NAME")"
    export NEVERBOUNCE_API_KEY="$(op item get 'ProspectPro-NeverBounce' --fields password --vault="$VAULT_NAME")"
    export PERSONAL_ACCESS_TOKEN="$(op item get 'ProspectPro-Admin-Token' --fields password --vault="$VAULT_NAME")"
    
    echo "✅ Credentials loaded from 1Password"
    
    # Start Docker
    if [[ "$1" == "dev" ]]; then
        docker-compose -f docker-compose.dev.yml up -d
    else
        docker-compose up -d
    fi
    
    echo "🚀 ProspectPro started with 1Password credentials!"
}

case "$1" in
    "setup")
        create_vault_items
        ;;
    "start")
        start_with_1password
        ;;
    "dev")
        start_with_1password "dev"
        ;;
    *)
        echo "Usage: $0 {setup|start|dev}"
        echo "Requires 1Password CLI: brew install 1password-cli"
        ;;
esac