#!/bin/bash
# Manual Cloud Run deployment script
# Use this if GitHub Actions deployment fails

set -e

echo "🚀 ProspectPro Manual Cloud Run Deployment"
echo "=========================================="

# Configuration
PROJECT_ID="${GCP_PROJECT_ID:-your-project-id}"
SERVICE_NAME="prospectpro"
REGION="${GCP_REGION:-us-central1}"

# Check if gcloud is authenticated
echo "🔐 Checking Google Cloud authentication..."
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | head -1; then
    echo "❌ Not authenticated to Google Cloud"
    echo "Run: gcloud auth login"
    exit 1
fi

# Set project
echo "📋 Setting project to: $PROJECT_ID"
gcloud config set project $PROJECT_ID

# Enable required APIs
echo "🔧 Enabling required APIs..."
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable containerregistry.googleapis.com

# Check for required environment variables
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SECRET_KEY" ]; then
    echo "❌ Missing required environment variables:"
    echo "   SUPABASE_URL and SUPABASE_SECRET_KEY must be set"
    echo ""
    echo "Example:"
    echo "   export SUPABASE_URL='https://your-project.supabase.co'"
    echo "   export SUPABASE_SECRET_KEY='your-secret-key'"
    exit 1
fi

# Deploy using source-based deployment
echo "🚀 Deploying ProspectPro to Cloud Run..."
gcloud run deploy $SERVICE_NAME \
    --source . \
    --platform managed \
    --region $REGION \
    --allow-unauthenticated \
    --port 3100 \
    --memory 2Gi \
    --cpu 2 \
    --min-instances 0 \
    --max-instances 10 \
    --concurrency 100 \
    --timeout 300 \
    --set-env-vars NODE_ENV=production \
    --set-env-vars SUPABASE_URL="$SUPABASE_URL" \
    --set-env-vars SUPABASE_SECRET_KEY="$SUPABASE_SECRET_KEY" \
    --set-env-vars PORT=3100 \
    --set-env-vars ALLOW_DEGRADED_START=true

# Get service URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region=$REGION --format='value(status.url)')

echo ""
echo "✅ Deployment completed!"
echo "🌐 Service URL: $SERVICE_URL"
echo "📊 Health: $SERVICE_URL/health"
echo "📋 API: $SERVICE_URL/api/business/discover-businesses"

# Test deployment
echo ""
echo "🧪 Testing deployment..."
sleep 15

echo "Testing health endpoint..."
if curl -f --max-time 30 "$SERVICE_URL/health"; then
    echo "✅ Health check passed"
else
    echo "❌ Health check failed"
fi

echo ""
echo "Testing business discovery API..."
if curl -X POST --max-time 30 -H "Content-Type: application/json" \
    -d '{"businessType":"restaurant","location":"Austin, TX","maxResults":1}' \
    -f "$SERVICE_URL/api/business/discover-businesses"; then
    echo "✅ Business discovery API working"
else
    echo "❌ Business discovery API failed"
fi

echo ""
echo "🎉 Deployment process complete!"
echo "📝 Next steps:"
echo "   1. Test the webapp at: $SERVICE_URL"
echo "   2. Verify business discovery returns results"
echo "   3. Check logs: gcloud run services logs tail $SERVICE_NAME --region=$REGION"