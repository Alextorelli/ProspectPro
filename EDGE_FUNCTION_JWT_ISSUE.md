# 🔍 Edge Function JWT Authentication Issue

## Current Status

**Anonymous Session**: ✅ Working  
**JWT Token Generated**: ✅ Working  
**Edge Function**: ❌ Rejecting JWT with "Invalid JWT"

## The Problem

Supabase Edge Functions have **two layers of authentication**:

1. **Platform-level JWT validation** (happens first, before our code)
2. **Application-level validation** (our edge-auth.ts code)

The JWT is being rejected at **layer 1** - before our code even runs.

## Why This Happens

Supabase Edge Functions validate JWTs against the project's **JWT_SECRET**. The anonymous user JWT we're sending is valid, but something about the validation is failing.

## Possible Causes

### 1. Missing JWT Anon Key

The `SUPABASE_ANON_KEY` environment variable in Edge Functions might be:

- Set to `sb_publishable_...` (wrong - this is for database API)
- Missing the actual JWT anon key
- Not updated after enabling anonymous auth

**Solution**: Get the JWT anon key from Supabase dashboard

### 2. Edge Functions Need Anon Key for Validation

Even though we're sending user JWTs, Edge Functions might need the **anon key** configured to validate those JWTs.

**How to Get JWT Anon Key**:

1. Go to: https://supabase.com/dashboard/project/sriycekxdqnesdsgwiuc/settings/api
2. Look for "Project API keys" section
3. Find **"anon / public"** key
4. This should be JWT format (`eyJ...`), NOT `sb_publishable_...`

### 3. Edge Function Configuration

Need to check if Edge Functions are configured to accept anonymous user JWTs.

## Next Steps

### Option 1: Get JWT Anon Key (Recommended)

If there's a JWT anon key in the dashboard:

1. Copy the JWT anon key (starts with `eyJ...`)
2. Set it as Edge Function secret:
   ```bash
   echo "SUPABASE_ANON_KEY=eyJ..." > .env
   supabase secrets set --env-file .env SUPABASE_ANON_KEY
   ```
3. Redeploy Edge Functions
4. Test again

### Option 2: Disable JWT Validation (Not Recommended)

Make Edge Functions publicly accessible without JWT validation. This is less secure but would work.

### Option 3: Use Service Role Key

Have the frontend call Edge Functions with the service role key. This is NOT recommended for security reasons.

## What We Need from You

**Go to the Supabase Dashboard**:
https://supabase.com/dashboard/project/sriycekxdqnesdsgwiuc/settings/api

**Check the "Project API keys" section**:

- Do you see both `sb_publishable_...` AND a JWT key (`eyJ...`)?
- If yes, copy the JWT key and share it
- If no, we need to use a different approach

## Alternative: Check if JWT Anon Key Exists

```bash
# Check current Edge Function secrets
supabase secrets list

# Look for SUPABASE_ANON_KEY
# Is it set to sb_publishable_... or eyJ...?
```

The issue is that Edge Functions validate JWTs using a secret key, and we need to make sure that secret is properly configured.
