# 🔑 **JWT TOKEN EXTRACTION GUIDE**

## October 4, 2025 - Get New JWT After Rotation

### 🎯 **CURRENT STATUS**

- ✅ JWT keys have been successfully rotated
- ✅ New Key ID: `41073739-ae09-48ff-b3ed-c3f978d1d3b2`
- ❌ Need to extract the actual JWT token (not just the key ID)

### 📋 **STEPS TO GET NEW JWT TOKEN**

#### **Option 1: From Supabase Dashboard - API Keys Page**

1. **Go to**: https://supabase.com/dashboard/project/sriycekxdqnesdsgwiuc/settings/api
2. **Look for**: "Project API keys" section (not JWT Signing Keys)
3. **Find**: `anon` key (this is the JWT token for Edge Functions)
4. **Copy**: The full token starting with `eyJ...`

#### **Option 2: Legacy JWT Secret Tab**

1. **In your screenshot**: Click on "Legacy JWT Secret" tab
2. **Look for**: `anon` and `service_role` keys
3. **Copy**: The `anon` key (for Edge Functions)

### 🧪 **TEST COMMAND TEMPLATE**

Once you have the new JWT token, test with:

```bash
curl -X POST 'https://sriycekxdqnesdsgwiuc.supabase.co/functions/v1/test-business-discovery' \
  -H 'Authorization: Bearer YOUR_NEW_JWT_TOKEN_HERE' \
  -H 'Content-Type: application/json' \
  -d '{"businessType": "coffee shop", "location": "Seattle, WA", "maxResults": 2}'
```

### 🔍 **WHAT TO LOOK FOR**

**Valid JWT Token Format**:

- ✅ Starts with: `eyJ`
- ✅ Length: ~800+ characters
- ✅ Three parts separated by dots: `header.payload.signature`

**Example**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNyaXljZWt4ZHFuZXNkc2d3aXVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjgwMDIzNjgsImV4cCI6MjA0MzU3ODM2OH0.NEW_SIGNATURE_HERE`

### 🚨 **TROUBLESHOOTING**

If JWT still shows as invalid after rotation:

1. **Check if rotation is complete**: The "CURRENT KEY" should be active
2. **Try service_role key**: Sometimes anon key needs additional time
3. **Verify project ref**: Ensure URL matches your project
4. **Wait 2-3 minutes**: Key rotation may need propagation time

### 📋 **NEXT ACTIONS**

1. Extract the new JWT token from Supabase dashboard
2. Test Edge Function with new JWT
3. Verify database operations still work with new keys
4. Update environment variables if needed

**Expected Result**: Edge Functions should work with the new JWT token! 🔐
