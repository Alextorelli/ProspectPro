#!/bin/bash

# Test Google Places API directly
# This script helps diagnose API key issues

echo "=== Testing Google Places API ==="
echo ""

# Get the API key from Supabase secrets (first 20 chars for verification)
echo "Checking Supabase secrets..."
supabase secrets list | grep GOOGLE_PLACES_API_KEY

echo ""
echo "Testing Edge Function with detailed output..."

# Test the Edge Function
curl -s -X POST 'https://sriycekxdqnesdsgwiuc.supabase.co/functions/v1/business-discovery-optimized' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNyaXljZWt4ZHFuZXNkc2d3aXVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5NjU3ODksImV4cCI6MjA3MzU0MTc4OX0.Rx_1Hjz2eayKie0RpPB28i7_683ZwhVJ_5Eu_rzTWpI' \
  -H 'Content-Type: application/json' \
  -d '{
    "businessType": "coffee shop",
    "location": "San Francisco, CA",
    "maxResults": 2,
    "qualityThreshold": 20,
    "budgetLimit": 10.0
  }' | jq '.'

echo ""
echo "=== Check Edge Function logs in Supabase Dashboard ==="
echo "URL: https://supabase.com/dashboard/project/sriycekxdqnesdsgwiuc/functions/business-discovery-optimized"
