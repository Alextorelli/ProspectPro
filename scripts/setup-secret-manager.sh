#!/bin/bash

# Google Secret Manager Setup Script for ProspectPro
# This script creates all necessary secrets in Google Secret Manager

set -e

PROJECT_ID="leadgen-471822"
REGION="us-central1"

echo "🔐 Setting up Google Secret Manager for ProspectPro"
echo "Project: $PROJECT_ID"
echo "Region: $REGION"
echo

# Function to create or update a secret
create_or_update_secret() {
    local secret_name=$1
    local description=$2
    
    echo "📝 Setting up secret: $secret_name"
    
    # Check if secret exists
    if gcloud secrets describe "$secret_name" --project="$PROJECT_ID" >/dev/null 2>&1; then
        echo "   ✅ Secret $secret_name already exists"
    else
        echo "   🆕 Creating secret $secret_name"
        gcloud secrets create "$secret_name" \
            --project="$PROJECT_ID"
    fi
}

# Core secrets (required)
echo "🔴 Creating REQUIRED secrets..."
create_or_update_secret "supabase-url" "Supabase project URL for ProspectPro"
create_or_update_secret "supabase-secret-key" "Supabase service role secret key for ProspectPro"
create_or_update_secret "webhook-auth-token" "Webhook authentication token for ProspectPro"

# API Key secrets (optional but recommended)
echo "🟡 Creating OPTIONAL API key secrets..."
create_or_update_secret "google-places-api-key" "Google Places API key for business discovery"
create_or_update_secret "hunter-api-key" "Hunter.io API key for email discovery"
create_or_update_secret "neverbounce-api-key" "NeverBounce API key for email validation"
create_or_update_secret "foursquare-api-key" "Foursquare API key for business data"
create_or_update_secret "apollo-api-key" "Apollo API key for B2B data enrichment"
create_or_update_secret "scrapingdog-api-key" "ScrapingDog API key for web scraping"
create_or_update_secret "socrata-api-key" "Socrata API key for government data"
create_or_update_secret "socrata-app-token" "Socrata app token for government data"
create_or_update_secret "uspto-api-key" "USPTO API key for trademark data"
create_or_update_secret "zerobounce-api-key" "ZeroBounce API key for email validation"
create_or_update_secret "california-sos-api-key" "California SOS API key for business verification"
create_or_update_secret "personal-access-token" "Personal access token for various services"

echo
echo "✅ All secrets created successfully!"
echo
echo "📋 Next steps:"
echo "1. Add secret values using Google Cloud Console or gcloud commands:"
echo "   gcloud secrets versions add SECRET_NAME --data-file=- <<< 'your-secret-value'"
echo
echo "2. Grant access to the Cloud Run service account:"
echo "   gcloud secrets add-iam-policy-binding SECRET_NAME \\"
echo "     --member='serviceAccount:prospectpro-deployment@$PROJECT_ID.iam.gserviceaccount.com' \\"
echo "     --role='roles/secretmanager.secretAccessor'"
echo
echo "3. Required secrets to populate first:"
echo "   - supabase-url"
echo "   - supabase-secret-key" 
echo "   - webhook-auth-token"
echo
echo "4. Optional but recommended:"
echo "   - google-places-api-key"
echo "   - hunter-api-key"
echo "   - neverbounce-api-key"
echo
echo "🚀 After adding secret values, deploy with: git push origin main"