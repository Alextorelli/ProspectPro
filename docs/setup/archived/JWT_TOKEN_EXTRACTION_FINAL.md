# 🔐 **CRITICAL: JWT TOKEN LOCATION GUIDE**

## October 4, 2025 - Get the Actual JWT Token

### 🎯 **CURRENT STATUS**

✅ **JWT Key Rotation**: COMPLETE  
✅ **New Key Active**: `41073739-ae09-48ff-b3ed-c3f978d1d3b2`  
✅ **JWKS Endpoint**: Updated with new ES256 key  
❌ **Missing**: Actual JWT token for Edge Functions

### 📍 **WHERE TO FIND THE JWT TOKEN**

**FROM YOUR SCREENSHOT**: You're currently on "JWT Signing Keys" tab.

**❗ CLICK THE "Legacy JWT Secret" TAB** (visible in your screenshot)

1. **In Supabase Dashboard**: Click on **"Legacy JWT Secret"** tab
2. **Look for**: Two JWT tokens will be displayed:
   - `anon` key (for Edge Functions)
   - `service_role` key (for backend operations)
3. **Copy the `anon` key**: This is what Edge Functions need

### 🔍 **WHAT THE TOKEN LOOKS LIKE**

**Format**: `eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IjQxMDczNzM5LWFlMDktNDhmZi1iM2VkLWMzZjk3OGQxZDNiMiJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNyaXljZWt4ZHFuZXNkc2d3aXVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjgwMDIzNjgsImV4cCI6MjA0MzU3ODM2OH0.NEW_SIGNATURE`

**Key Points**:

- ✅ Starts with: `eyJ`
- ✅ Length: ~900+ characters (longer due to ES256)
- ✅ Contains new `kid`: `41073739-ae09-48ff-b3ed-c3f978d1d3b2`
- ✅ Algorithm: `ES256` (instead of `HS256`)

### 🧪 **TESTING COMMAND READY**

Once you get the JWT token from the "Legacy JWT Secret" tab:

```bash
curl -X POST 'https://sriycekxdqnesdsgwiuc.supabase.co/functions/v1/test-business-discovery' \
  -H 'Authorization: Bearer [PASTE_JWT_TOKEN_HERE]' \
  -H 'Content-Type: application/json' \
  -d '{"businessType": "coffee shop", "location": "Seattle, WA", "maxResults": 2}'
```

### 🔄 **ALTERNATIVE LOCATIONS**

If "Legacy JWT Secret" tab doesn't show tokens:

1. **API Keys Page**: Go to Settings → API → "Project API keys"
2. **Look for**: `anon` and `service_role` keys
3. **These should be the new JWT tokens** with ES256 signature

### ⚡ **EXPECTED RESULT**

With the correct JWT token, you should see:

```json
{
  "success": true,
  "authentication": {
    "keyFormat": "legacy_jwt",
    "isValid": true
  },
  "database_storage": {
    "success": true,
    "campaign_stored": true
  }
}
```

**Action Required**: Click "Legacy JWT Secret" tab and copy the `anon` key! 🔑
