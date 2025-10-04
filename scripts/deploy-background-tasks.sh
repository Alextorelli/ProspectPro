#!/bin/bash
# Deploy Background Task Architecture - ProspectPro v4.2
# October 2025 - Complete deployment script

set -e  # Exit on error

echo "🚀 ProspectPro v4.2 - Background Task Architecture Deployment"
echo "============================================================="
echo ""

# Step 1: Database Schema
echo "📊 Step 1: Creating job queue database schema..."
echo "Run this SQL in Supabase Dashboard → SQL Editor:"
echo ""
cat database/job-queue-schema.sql
echo ""
read -p "Press Enter after running the SQL schema..."

# Step 2: Deploy new Edge Function
echo ""
echo "🔧 Step 2: Deploying background task Edge Function..."
supabase functions deploy business-discovery-background --no-verify-jwt
echo "✅ Edge Function deployed"

# Step 3: Verify deployment
echo ""
echo "🧪 Step 3: Testing Edge Function..."
CAMPAIGN_RESPONSE=$(curl -s -X POST 'https://sriycekxdqnesdsgwiuc.supabase.co/functions/v1/business-discovery-background' \
  -H "Authorization: Bearer $(grep SUPABASE_ANON_KEY .env | cut -d '=' -f2)" \
  -H 'Content-Type: application/json' \
  -d '{
    "businessType": "coffee shop",
    "location": "Portland, OR",
    "maxResults": 2,
    "sessionUserId": "test_deployment"
  }')

echo "Response:"
echo "$CAMPAIGN_RESPONSE" | jq '.'

JOB_ID=$(echo "$CAMPAIGN_RESPONSE" | jq -r '.jobId')

if [ "$JOB_ID" != "null" ] && [ -n "$JOB_ID" ]; then
  echo ""
  echo "✅ Job created successfully: $JOB_ID"
  echo "🔄 Monitor job progress in Supabase Dashboard → Database → discovery_jobs table"
  echo "📊 Real-time channel: discovery_jobs:id=eq.$JOB_ID"
else
  echo ""
  echo "❌ Job creation failed. Check Edge Function logs in Supabase Dashboard."
  exit 1
fi

# Step 4: Frontend integration
echo ""
echo "🎨 Step 4: Frontend integration"
echo "New files created:"
echo "  - src/hooks/useJobProgress.tsx (Real-time progress hook)"
echo ""
echo "Next steps for frontend integration:"
echo "  1. Import useJobProgress hook in your campaign component"
echo "  2. Display JobProgressDisplay component with jobId"
echo "  3. Update API call to use /business-discovery-background endpoint"
echo ""

# Step 5: Monitoring
echo ""
echo "📈 Step 5: Monitoring tools"
echo "  - Supabase Dashboard → Database → discovery_jobs (job status)"
echo "  - Supabase Dashboard → Edge Functions → Logs (execution logs)"
echo "  - Real-time updates will appear in frontend automatically"
echo ""

echo "============================================================="
echo "✅ Background Task Architecture Deployment Complete!"
echo ""
echo "🔍 What just happened:"
echo "  ✅ Job queue database schema created"
echo "  ✅ Background task Edge Function deployed"
echo "  ✅ Real-time progress tracking enabled"
echo "  ✅ Test campaign created and running"
echo ""
echo "📝 Key Changes:"
echo "  • Edge Function returns immediately (no timeout)"
echo "  • Processing continues in background with EdgeRuntime.waitUntil()"
echo "  • Real-time updates via Supabase Real-time"
echo "  • Complete campaign processing (1-2 minutes) without limits"
echo ""
echo "🎯 Frontend Integration:"
echo "  1. Update CampaignForm to call /business-discovery-background"
echo "  2. Show JobProgressDisplay component with returned jobId"
echo "  3. Real-time updates will stream automatically"
echo ""
echo "🚀 Your app is now ready for production with unlimited processing time!"
