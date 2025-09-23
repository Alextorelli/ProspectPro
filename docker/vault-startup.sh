#!/bin/bash
# vault-startup.sh - Pull API keys from Supabase Vault and start application

set -e

echo "🔐 ProspectPro Vault Startup"
echo "============================="

# Check required environment variables
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SECRET_KEY" ]; then
    echo "❌ Missing required Supabase credentials"
    echo "   Required: SUPABASE_URL, SUPABASE_SECRET_KEY"
    exit 1
fi

# Set default vault prefix
VAULT_KEY_PREFIX=${VAULT_KEY_PREFIX:-"prospectpro"}

echo "🔍 Pulling API keys from Supabase Vault..."

# Function to get secret from Supabase Vault
get_vault_secret() {
    local key_name="$1"
    local vault_key="${VAULT_KEY_PREFIX}_${key_name}"
    
    # Use Supabase REST API to get secret
    curl -s \
        -H "Authorization: Bearer $SUPABASE_SECRET_KEY" \
        -H "apikey: $SUPABASE_SECRET_KEY" \
        "$SUPABASE_URL/rest/v1/vault/secrets?select=secret&name=eq.$vault_key" \
    | node -pe "
        try {
            const data = JSON.parse(require('fs').readFileSync('/dev/stdin'));
            data[0] ? data[0].secret : '';
        } catch (e) {
            '';
        }
    "
}

# Create runtime environment file
echo "📝 Creating runtime environment..."

# Start with base environment
cp .env .env.runtime 2>/dev/null || touch .env.runtime

# Add API keys from vault
declare -a api_keys=(
    "GOOGLE_PLACES_API_KEY"
    "FOURSQUARE_API_KEY" 
    "HUNTER_IO_API_KEY"
    "NEVERBOUNCE_API_KEY"
    "APOLLO_API_KEY"
)

for key in "${api_keys[@]}"; do
    echo "  🔑 Fetching $key..."
    
    secret_value=$(get_vault_secret "$key")
    
    if [ -n "$secret_value" ]; then
        echo "$key=$secret_value" >> .env.runtime
        echo "    ✅ Retrieved"
    else
        echo "    ⚠️  Not found in vault (optional)"
    fi
done

echo ""
echo "✅ Runtime environment prepared"
echo "🚀 Starting ProspectPro..."

# Export runtime environment and start application
set -a
source .env.runtime
set +a

# Start the application
exec npm start