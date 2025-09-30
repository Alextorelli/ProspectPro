#!/bin/bash

# Supabase Webhook Configuration Script
# Configures all three production webhooks for ProspectPro

set -e

echo "🔗 Configuring Supabase Webhooks for ProspectPro"

# Configuration
WEBHOOK_BASE_URL="https://prospectpro-uswbuyt7ha-uc.a.run.app/api/webhooks"
AUTH_TOKEN=$(gcloud secrets versions access latest --secret="webhook-auth-token")

echo "📍 Base URL: $WEBHOOK_BASE_URL"
echo "🔑 Auth Token: ${AUTH_TOKEN:0:10}..."

# Function to create webhook
create_webhook() {
    local name=$1
    local endpoint=$2
    local table=$3
    local events=$4
    
    echo ""
    echo "🚀 Creating webhook: $name"
    echo "   📍 Endpoint: $WEBHOOK_BASE_URL/$endpoint"
    echo "   📊 Table: $table"
    echo "   📝 Events: $events"
    
    # Create webhook using Supabase API (replace with your actual project reference)
    curl -X POST "https://api.supabase.com/v1/projects/YOUR_PROJECT_REF/database/webhooks" \
        -H "Authorization: Bearer YOUR_SUPABASE_ACCESS_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{
            \"name\": \"$name\",
            \"url\": \"$WEBHOOK_BASE_URL/$endpoint\",
            \"method\": \"POST\",
            \"headers\": {
                \"Content-Type\": \"application/json\",
                \"Authorization\": \"Bearer $AUTH_TOKEN\"
            },
            \"conditions\": {
                \"table\": \"$table\",
                \"events\": $events
            },
            \"timeout\": 5000
        }"
}

# 1. Campaign Lifecycle Webhook
create_webhook \
    "prospectpro-campaign-lifecycle" \
    "campaign-lifecycle" \
    "business_discovery_campaigns" \
    '["INSERT", "UPDATE"]'

# 2. Cost Alert Webhook  
create_webhook \
    "prospectpro-cost-alert" \
    "cost-alert" \
    "campaign_costs" \
    '["INSERT", "UPDATE"]'

# 3. Lead Enrichment Webhook
create_webhook \
    "prospectpro-lead-enrichment" \
    "lead-enrichment" \
    "business_contacts" \
    '["INSERT", "UPDATE"]'

echo ""
echo "✅ Webhook configuration script complete!"
echo ""
echo "📋 Manual Configuration Required:"
echo "   1. Replace YOUR_PROJECT_REF with your Supabase project ID"
echo "   2. Replace YOUR_SUPABASE_ACCESS_TOKEN with your service role key"
echo "   3. Or configure manually in Supabase Dashboard → Database → Webhooks"
echo ""
echo "🔧 Manual Configuration Parameters:"
echo "   Method: POST"
echo "   Timeout: 5000ms"
echo "   Content-Type: application/json"
echo "   Authorization: Bearer $AUTH_TOKEN"