#!/bin/bash

# Test comprehensive CSV export with unified template
# Test comprehensive tier-aware CSV export functionality

echo "🧪 Testing comprehensive CSV export..."

# Get the current anon key from Supabase configuration
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNyaXljZWt4ZHFuZXNkc2d3aXVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY3ODE2NjgsImV4cCI6MjA1MjM1NzY2OH0.LrGsppZSHuCZqxH-NowJ6u8DUG8j63W6_VZC7OPQ5JM"
BASE_URL="https://sriycekxdqnesdsgwiuc.supabase.co/functions/v1"

echo "📋 Step 1: Creating test campaign with Base tier..."
CAMPAIGN_RESPONSE=$(curl -s -X POST "$BASE_URL/business-discovery-background" \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "businessType": "coffee shop", 
    "location": "Seattle, WA", 
    "maxResults": 3,
    "tierKey": "BASE",
    "sessionUserId": "test_csv_export_123"
  }')

echo "Campaign Response: $CAMPAIGN_RESPONSE"

# Extract campaign ID
CAMPAIGN_ID=$(echo "$CAMPAIGN_RESPONSE" | jq -r '.campaignId // .campaign_id // empty')

if [ -z "$CAMPAIGN_ID" ] || [ "$CAMPAIGN_ID" = "null" ]; then
  echo "❌ Failed to create campaign or extract campaign ID"
  echo "Response: $CAMPAIGN_RESPONSE"
  exit 1
fi

echo "✅ Created campaign: $CAMPAIGN_ID"

echo "⏳ Step 2: Waiting for campaign completion..."
sleep 8

echo "📊 Step 3: Testing comprehensive CSV export..."
CSV_RESPONSE=$(curl -s -X POST "$BASE_URL/campaign-export" \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"campaignId\": \"$CAMPAIGN_ID\",
    \"format\": \"csv\",
    \"sessionUserId\": \"test_csv_export_123\"
  }")

echo "CSV Export Response: $CSV_RESPONSE"

# Check if response contains CSV data
if echo "$CSV_RESPONSE" | grep -q "Business Name"; then
  echo "✅ CSV export contains expected headers"
  
  # Count columns in CSV
  HEADER_COUNT=$(echo "$CSV_RESPONSE" | head -1 | tr ',' '\n' | wc -l)
  echo "📈 CSV contains $HEADER_COUNT columns"
  
  # Check for tier-specific columns
  if echo "$CSV_RESPONSE" | grep -q "Professional Email"; then
    echo "✅ Professional tier columns included"
  fi
  
  if echo "$CSV_RESPONSE" | grep -q "Executive Contact Name"; then
    echo "✅ Enterprise tier columns included"
  fi
  
  if echo "$CSV_RESPONSE" | grep -q "Email Verification Status"; then
    echo "✅ Email verification columns included"
  fi
  
  # Show first few lines of CSV
  echo "📝 First 3 lines of CSV:"
  echo "$CSV_RESPONSE" | head -3
  
  echo ""
  echo "🎯 Testing tier-aware data population..."
  # Check for N/A values in higher tier columns for Base tier campaign
  if echo "$CSV_RESPONSE" | grep -q "N/A"; then
    echo "✅ N/A values present for unavailable tier features"
  fi
  
else
  echo "❌ CSV export failed or missing headers"
  echo "Response: $CSV_RESPONSE"
fi

echo "🏁 Comprehensive CSV export test completed"