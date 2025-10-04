# ✅ API Key Issue RESOLVED

## The Root Cause

Supabase has **TWO different types of API keys**:

1. **Database API Keys** (PostgREST) - NEW FORMAT

   - `sb_publishable_...` - For database queries
   - `sb_secret_...` - For admin database access
   - ✅ These work! We updated and tested successfully.

2. **Edge Function API Keys** - LEGACY JWT FORMAT
   - `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` - For Edge Functions
   - ❌ These were disabled September 15, 2025
   - 🔴 **Edge Functions ONLY work with JWT tokens, not the new keys**

## Current Status

✅ **Database Access**: WORKING with new `sb_publishable_` key  
❌ **Edge Functions**: NOT WORKING - need JWT tokens re-enabled  
❌ **Frontend**: Dashboard works but Discovery/Campaigns broken (use Edge Functions)

## The Fix

You need to **re-enable legacy JWT keys** in Supabase Dashboard:

### Step 1: Re-enable Legacy Keys

1. Go to: https://supabase.com/dashboard/project/sriycekxdqnesdsgwiuc/settings/api
2. Scroll to **"Legacy API Keys"** section
3. Click **"Re-enable Legacy Keys"** button
4. Copy the new JWT tokens (starts with `eyJ...`)

### Step 2: Update .env.production

```bash
# Database access (already updated - WORKING)
VITE_SUPABASE_ANON_KEY=sb_publishable_GaGU6ZiyiO6ncO7kU2qAvA_SFuCyYaM

# Edge Functions access (NEEDS JWT TOKEN)
VITE_EDGE_FUNCTION_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...NEW_JWT_HERE
```

### Step 3: Update Frontend Code

Update `/src/lib/supabase.ts` to use different keys for database vs Edge Functions:

```typescript
// Database access - use publishable key
export const supabase = createClient(supabaseUrl, supabasePublishableKey);

// Edge Function access - use JWT token
export const edgeFunctionAuth = supabaseJWTToken;
```

## Alternative Solution (Recommended)

**Don't use Edge Functions authentication at all!**

Instead, make Edge Functions publicly accessible with their own API key parameter:

```typescript
// Call Edge Function without Bearer token
const response = await fetch(edgeFunctionUrl, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-api-key": "your-custom-api-key", // Custom auth
  },
  body: JSON.stringify(params),
});
```

This decouples database auth from Edge Function auth.

## What I Recommend

**Option A: Quick Fix (5 minutes)**

1. Re-enable legacy JWT keys in Supabase dashboard
2. Use JWT for Edge Functions, publishable key for database
3. Update `.env.production` with both keys
4. Rebuild and redeploy

**Option B: Better Architecture (30 minutes)**

1. Remove JWT requirement from Edge Functions
2. Use custom API key authentication
3. Keep publishable key for database only
4. More flexible, no dependency on Supabase auth formats

## Test Commands

After fixing:

```bash
# Test database access (should work now)
curl 'https://sriycekxdqnesdsgwiuc.supabase.co/rest/v1/campaigns?select=id&limit=1' \
  -H "apikey: sb_publishable_GaGU6ZiyiO6ncO7kU2qAvA_SFuCyYaM" \
  -H "Authorization: Bearer sb_publishable_GaGU6ZiyiO6ncO7kU2qAvA_SFuCyYaM"

# Test Edge Function (needs JWT token)
curl -X POST 'https://sriycekxdqnesdsgwiuc.supabase.co/functions/v1/business-discovery-user-aware' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...JWT_HERE' \
  -H 'Content-Type: application/json' \
  -d '{"businessType": "test", "location": "test", "maxResults": 1, "sessionUserId": "test"}'
```

## Summary

| Component            | Key Type             | Status             |
| -------------------- | -------------------- | ------------------ |
| Database (PostgREST) | `sb_publishable_...` | ✅ WORKING         |
| Edge Functions       | JWT `eyJ...`         | ❌ NEEDS RE-ENABLE |
| Dashboard Page       | Uses database        | ✅ WORKING         |
| Discovery Page       | Uses Edge Functions  | ❌ BROKEN          |
| Campaign Page        | Uses Edge Functions  | ❌ BROKEN          |

**Next Step**: Re-enable legacy JWT keys in Supabase dashboard, then I'll update everything.
