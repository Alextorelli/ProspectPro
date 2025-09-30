#!/bin/bash

# Script to populate Google Secret Manager with values from local environment
# Run this after setup-secret-manager.sh

set -e

PROJECT_ID="leadgen-471822"

echo "🔐 Populating Google Secret Manager with ProspectPro secrets"
echo "Project: $PROJECT_ID"
echo

# Source environment variables from .env file
if [ -f .env ]; then
    echo "📄 Loading environment variables from .env file..."
    export $(grep -v '^#' .env | xargs)
else
    echo "⚠️ No .env file found. Please ensure environment variables are set."
fi

# Function to add secret value
add_secret_value() {
    local secret_name=$1
    local env_var_name=$2
    local env_value="${!env_var_name}"
    
    if [ -n "$env_value" ] && [ "$env_value" != "your_"* ]; then
        echo "🔑 Adding value for $secret_name..."
        echo "$env_value" | gcloud secrets versions add "$secret_name" \
            --data-file=- \
            --project="$PROJECT_ID"
        echo "   ✅ $secret_name updated"
    else
        echo "   ⚠️ Skipping $secret_name (empty or placeholder value)"
    fi
}

# Add secret values
echo "🔴 Adding REQUIRED secrets..."
add_secret_value "supabase-url" "SUPABASE_URL"
add_secret_value "supabase-secret-key" "SUPABASE_SECRET_KEY"
add_secret_value "webhook-auth-token" "WEBHOOK_AUTH_TOKEN"

echo "🟡 Adding OPTIONAL API key secrets..."
add_secret_value "google-places-api-key" "GOOGLE_PLACES_API_KEY"
add_secret_value "hunter-api-key" "HUNTER_API_KEY"
add_secret_value "neverbounce-api-key" "NEVERBOUNCE_API_KEY"
add_secret_value "foursquare-api-key" "FOURSQUARE_SERVICE_API_KEY"
add_secret_value "apollo-api-key" "APOLLO_API_KEY"
add_secret_value "scrapingdog-api-key" "SCRAPINGDOG_API_KEY"
add_secret_value "socrata-api-key" "SOCRATA_API_KEY"
add_secret_value "socrata-app-token" "SOCRATA_APP_TOKEN"
add_secret_value "uspto-api-key" "USPTO_TSDR_API_KEY"
add_secret_value "zerobounce-api-key" "ZEROBOUNCE_API_KEY"
add_secret_value "california-sos-api-key" "CALIFORNIA_SOS_API_KEY"
add_secret_value "personal-access-token" "PERSONAL_ACCESS_TOKEN"

echo
echo "✅ Secret values populated successfully!"
echo
echo "🔒 Setting up IAM permissions for Cloud Run service account..."

# Grant access to the Cloud Run service account for all secrets
secrets=(
    "supabase-url"
    "supabase-secret-key"
    "webhook-auth-token"
    "google-places-api-key"
    "hunter-api-key"
    "neverbounce-api-key"
    "foursquare-api-key"
    "apollo-api-key"
    "scrapingdog-api-key"
    "socrata-api-key"
    "socrata-app-token"
    "uspto-api-key"
    "zerobounce-api-key"
    "california-sos-api-key"
    "personal-access-token"
)

for secret in "${secrets[@]}"; do
    echo "🔐 Granting access to $secret..."
    gcloud secrets add-iam-policy-binding "$secret" \
        --member="serviceAccount:prospectpro-deployment@$PROJECT_ID.iam.gserviceaccount.com" \
        --role="roles/secretmanager.secretAccessor" \
        --project="$PROJECT_ID" \
        --quiet
done

echo
echo "🎉 Google Secret Manager setup complete!"
echo "🚀 Ready to deploy: git push origin main"