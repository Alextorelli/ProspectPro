#!/bin/bash

# Manual deployment script for ProspectPro
# Builds locally and deploys to Cloud Run with Secret Manager integration

set -e

PROJECT_ID="leadgen-471822"
REGION="us-central1"
SERVICE_NAME="prospectpro"
REPO_NAME="prospectpro"

echo "🚀 Manual deployment for ProspectPro"
echo "Project: $PROJECT_ID"
echo "Region: $REGION"

# Step 1: Build and tag the Docker image
echo "📦 Building Docker image..."
docker build -t "us-central1-docker.pkg.dev/$PROJECT_ID/$REPO_NAME/app:latest" .

# Step 2: Push to Artifact Registry
echo "🔄 Pushing to Artifact Registry..."
docker push "us-central1-docker.pkg.dev/$PROJECT_ID/$REPO_NAME/app:latest"

# Step 3: Deploy to Cloud Run with Secret Manager
echo "🌐 Deploying to Cloud Run..."
gcloud run deploy $SERVICE_NAME \
  --image="us-central1-docker.pkg.dev/$PROJECT_ID/$REPO_NAME/app:latest" \
  --platform=managed \
  --region=$REGION \
  --allow-unauthenticated \
  --memory=2Gi \
  --cpu=2 \
  --min-instances=0 \
  --max-instances=10 \
  --concurrency=100 \
  --timeout=300 \
  --set-env-vars=NODE_ENV=production \
  --set-env-vars=ALLOW_DEGRADED_START=true \
  --set-secrets=SUPABASE_URL=supabase-url:latest \
  --set-secrets=SUPABASE_SECRET_KEY=supabase-secret-key:latest \
  --set-secrets=WEBHOOK_AUTH_TOKEN=webhook-auth-token:latest \
  --set-secrets=GOOGLE_PLACES_API_KEY=google-places-api-key:latest \
  --set-secrets=HUNTER_API_KEY=hunter-api-key:latest \
  --set-secrets=NEVERBOUNCE_API_KEY=neverbounce-api-key:latest \
  --set-secrets=FOURSQUARE_SERVICE_API_KEY=foursquare-api-key:latest \
  --set-secrets=APOLLO_API_KEY=apollo-api-key:latest \
  --set-secrets=SCRAPINGDOG_API_KEY=scrapingdog-api-key:latest \
  --set-secrets=SOCRATA_API_KEY=socrata-api-key:latest \
  --set-secrets=SOCRATA_APP_TOKEN=socrata-app-token:latest \
  --set-secrets=USPTO_TSDR_API_KEY=uspto-api-key:latest \
  --set-secrets=ZEROBOUNCE_API_KEY=zerobounce-api-key:latest \
  --set-secrets=CALIFORNIA_SOS_API_KEY=california-sos-api-key:latest \
  --set-secrets=PERSONAL_ACCESS_TOKEN=personal-access-token:latest \
  --service-account=prospectpro-deployment@$PROJECT_ID.iam.gserviceaccount.com

# Step 4: Get service URL and test
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region=$REGION --format='value(status.url)')
echo "🌐 Service deployed at: $SERVICE_URL"

# Wait for service to be ready
echo "⏳ Waiting for service to be ready..."
sleep 30

# Test health endpoint
echo "🧪 Testing health endpoint..."
curl -f --max-time 30 --retry 5 --retry-delay 10 "$SERVICE_URL/health" || echo "❌ Health check failed but deployment succeeded"

echo "✅ Deployment completed - Service URL: $SERVICE_URL"