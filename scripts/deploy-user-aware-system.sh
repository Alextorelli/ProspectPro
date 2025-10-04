#!/bin/bash

# ProspectPro v4.2 - User-Aware System Deployment Script
# October 4, 2025 - Complete frontend and backend alignment

echo "🚀 ProspectPro v4.2 User-Aware System Deployment"
echo "================================================="

# Step 1: Build the static frontend
echo ""
echo "📦 Step 1: Building static frontend..."
cd /workspaces/ProspectPro/public

# Create a simple build process for our static files
mkdir -p dist

# Copy and prepare the user-aware frontend
cp index-user-aware.html dist/index.html
cp supabase-app-user-aware.js dist/app.js

# Update the HTML to use the local app.js
sed -i 's|public/supabase-app-user-aware.js|app.js|g' dist/index.html

echo "✅ Frontend built successfully"

# Step 2: Test Edge Functions
echo ""
echo "🔧 Step 2: Testing Edge Functions..."

# Test business discovery
echo "Testing business-discovery-user-aware..."
DISCOVERY_RESPONSE=$(curl -s -X POST \
  'https://sriycekxdqnesdsgwiuc.supabase.co/functions/v1/business-discovery-user-aware' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNyaXljZWt4ZHFuZXNkc2d3aXVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5NjU3ODksImV4cCI6MjA3MzU0MTc4OX0.Rx_1Hjz2eayKie0RpPB28i7_683ZwhVJ_5Eu_rzTWpI' \
  -H 'Content-Type: application/json' \
  -d '{
    "businessType": "coffee shop",
    "location": "Portland, OR",
    "maxResults": 2,
    "sessionUserId": "test_session_'$(date +%s)'"
  }')

if echo "$DISCOVERY_RESPONSE" | grep -q '"success":true'; then
    echo "✅ Business discovery Edge Function working"
    CAMPAIGN_ID=$(echo "$DISCOVERY_RESPONSE" | grep -o '"campaignId":"[^"]*"' | cut -d'"' -f4)
    echo "   Campaign ID: $CAMPAIGN_ID"
else
    echo "❌ Business discovery Edge Function failed"
    echo "   Response: $DISCOVERY_RESPONSE"
fi

# Test export function if we have a campaign ID
if [ ! -z "$CAMPAIGN_ID" ]; then
    echo ""
    echo "Testing campaign-export-user-aware..."
    EXPORT_RESPONSE=$(curl -s -X POST \
      'https://sriycekxdqnesdsgwiuc.supabase.co/functions/v1/campaign-export-user-aware' \
      -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNyaXljZWt4ZHFuZXNkc2d3aXVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5NjU3ODksImV4cCI6MjA3MzU0MTc4OX0.Rx_1Hjz2eayKie0RpPB28i7_683ZwhVJ_5Eu_rzTWpI' \
      -H 'Content-Type: application/json' \
      -d '{
        "campaignId": "'$CAMPAIGN_ID'",
        "format": "csv",
        "sessionUserId": "test_session_'$(date +%s)'"
      }')
    
    if echo "$EXPORT_RESPONSE" | grep -q 'business_name\|businessName'; then
        echo "✅ Campaign export Edge Function working"
    else
        echo "❌ Campaign export Edge Function failed"
        echo "   Response: $EXPORT_RESPONSE"
    fi
fi

# Step 3: Check database schema
echo ""
echo "🗄️  Step 3: Checking database schema..."
echo "Please run this SQL in the Supabase dashboard SQL editor:"
echo ""
echo "-- Test user-aware schema"
echo "SELECT 'Campaigns table' as test, COUNT(*) as count FROM campaigns;"
echo "SELECT 'Leads table' as test, COUNT(*) as count FROM leads;"
echo "SELECT 'User columns exist' as test, "
echo "  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='campaigns' AND column_name='user_id') "
echo "  THEN 'YES' ELSE 'NO' END as user_id_exists;"
echo ""

# Step 4: Deployment options
echo ""
echo "📤 Step 4: Deployment Options"
echo "=============================="
echo ""
echo "Option A: Vercel Deployment (Recommended)"
echo "cd /workspaces/ProspectPro/public/dist"
echo "vercel --prod"
echo ""
echo "Option B: GitHub Pages"
echo "git add public/dist/*"
echo "git commit -m 'User-aware frontend v4.2'"
echo "git push origin main"
echo ""
echo "Option C: Simple HTTP Server (Testing)"
echo "cd /workspaces/ProspectPro/public/dist"
echo "python3 -m http.server 8080"
echo ""

# Step 5: Testing checklist
echo "✅ Testing Checklist:"
echo "====================="
echo "□ Run database schema SQL in Supabase dashboard"
echo "□ Deploy frontend using one of the options above"
echo "□ Test anonymous user workflow (discovery + export)"
echo "□ Test user signup/signin workflow"
echo "□ Test campaign ownership and data isolation"
echo "□ Verify export functionality with user context"
echo ""

# Step 6: URLs and access
echo "🌐 Access Information:"
echo "======================"
echo "Database Dashboard: https://supabase.com/dashboard/project/sriycekxdqnesdsgwiuc"
echo "Edge Functions: https://supabase.com/dashboard/project/sriycekxdqnesdsgwiuc/functions"
echo "SQL Editor: https://supabase.com/dashboard/project/sriycekxdqnesdsgwiuc/sql"
echo ""
echo "Edge Function URLs:"
echo "- Business Discovery: https://sriycekxdqnesdsgwiuc.supabase.co/functions/v1/business-discovery-user-aware"
echo "- Campaign Export: https://sriycekxdqnesdsgwiuc.supabase.co/functions/v1/campaign-export-user-aware"
echo ""

echo "🎉 User-aware system alignment complete!"
echo "   Frontend: User authentication with session management"
echo "   Backend: User-aware Edge Functions with campaign ownership"
echo "   Database: RLS policies for data isolation and user linking"
echo ""
echo "Next: Run the database SQL and deploy the frontend to complete the setup."