#!/bin/bash

# ProspectPro v4.3 - Check Vault Secrets
# List all secrets in Supabase Vault and test decryption

echo "🔐 ProspectPro v4.3 - Vault Secrets Diagnostic"
echo "============================================="
echo ""

# Current valid service role key for vault access
SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNyaXljZWt4ZHFuZXNkc2d3aXVjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Nzk2NTc4OSwiZXhwIjoyMDczNTQxNzg5fQ.V2wlvxGC1_SshWudFw27ZWmQjuxj0UtXANXrZmt4OjY"

echo "🔍 Step 1: List all secrets in vault..."
curl -X POST 'https://sriycekxdqnesdsgwiuc.supabase.co/rest/v1/rpc/vault_decrypt_multiple_secrets' \
  -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
  -H "apikey: $SERVICE_ROLE_KEY" \
  -H 'Content-Type: application/json' \
  -d '{
    "secret_names": [
      "BUSINESS_LICENSE_LOOKUP_API_KEY",
      "PEOPLE_DATA_LABS_API_KEY", 
      "COBALT_API_KEY",
      "FINRA_API_KEY",
      "HUNTER_IO_API_KEY",
      "NEVERBOUNCE_API_KEY",
      "SCRAPINGDOG_API_KEY"
    ]
  }' | jq '.'

echo ""
echo "🔍 Step 2: Test lowercase secret names..."
curl -X POST 'https://sriycekxdqnesdsgwiuc.supabase.co/rest/v1/rpc/vault_decrypt_multiple_secrets' \
  -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
  -H "apikey: $SERVICE_ROLE_KEY" \
  -H 'Content-Type: application/json' \
  -d '{
    "secret_names": [
      "business-license-lookup-api-key",
      "peopledatalabs-api-key", 
      "hunter-io-api-key",
      "neverbounce-api-key"
    ]
  }' | jq '.'

echo ""
echo "🔍 Step 3: Direct vault table query..."
curl -X GET 'https://sriycekxdqnesdsgwiuc.supabase.co/rest/v1/secrets?select=name,description' \
  -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
  -H "apikey: $SERVICE_ROLE_KEY" \
  -H 'Content-Type: application/json' | jq '.'

echo ""
echo "============================================="
echo "🎯 This will show:"
echo "- What secret names exist in the vault"
echo "- Whether our naming convention matches"
echo "- If decryption is working properly"