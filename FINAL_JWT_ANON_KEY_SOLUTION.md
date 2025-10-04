# ✅ FINAL SOLUTION: JWT Anon Key Required

## The Root Cause (Confirmed)

Supabase Edge Functions reject JWTs at the **platform level** before our code runs. This validation requires the correct `SUPABASE_ANON_KEY` to be configured.

**Current Problem**:

- `SUPABASE_ANON_KEY` in Edge Functions = `sb_publishable_...` (database key)
- Edge Functions need = JWT anon key (`eyJ...` format)

## The Solution

### Step 1: Get the JWT Anon Key

**Go to Supabase Dashboard** → API Settings:
https://supabase.com/dashboard/project/sriycekxdqnesdsgwiuc/settings/api

**Look for "Project API keys" section** - You should see:

```
anon / public
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL3...
[Copy] [Show]
```

**Copy that JWT key** (starts with `eyJ...`, NOT `sb_publishable_...`)

### Step 2: Update Edge Function Environment

**Option A: Via Supabase CLI** (from your Codespace):

```bash
cd /workspaces/ProspectPro

# Create .env file with JWT anon key
echo "SUPABASE_ANON_KEY=eyJ..." > .env.edge-functions
# ^ Replace eyJ... with actual JWT anon key

# Set the secret
supabase secrets set SUPABASE_ANON_KEY --env-file .env.edge-functions

# Verify it was set
supabase secrets list | grep SUPABASE_ANON_KEY
```

**Option B: Via Supabase Dashboard**:

1. Go to: https://supabase.com/dashboard/project/sriycekxdqnesdsgwiuc/settings/functions
2. Find "Environment variables" section
3. Find `SUPABASE_ANON_KEY`
4. Click "Edit"
5. Replace value with JWT anon key (`eyJ...`)
6. Save

### Step 3: Test

```bash
cd /workspaces/ProspectPro
./test-session-auth.sh
```

**Expected Result**:

```
✅ Anonymous session created successfully!
✅ Edge Function authentication SUCCESS!
🎉 Session-based authentication is FULLY FUNCTIONAL!
```

## Why This is Necessary

Supabase Edge Functions use the `SUPABASE_ANON_KEY` to:

1. **Validate incoming JWTs** (platform level, before your code)
2. **Create Supabase clients** inside Edge Functions
3. **Apply RLS policies** based on user context

Without the correct JWT anon key, the platform rejects all JWTs with "Invalid JWT".

## What's the Difference?

| Key Type            | Format               | Purpose                         | Used By                           |
| ------------------- | -------------------- | ------------------------------- | --------------------------------- |
| **Publishable Key** | `sb_publishable_...` | Database REST API access        | Frontend database queries         |
| **JWT Anon Key**    | `eyJhbGc...`         | JWT validation + Edge Functions | Edge Function authentication      |
| **Secret Key**      | `sb_secret_...`      | Admin database access           | Server-side privileged operations |

## After Setting the JWT Anon Key

**Everything will work**:

- ✅ Anonymous users can call Edge Functions
- ✅ Authenticated users can call Edge Functions
- ✅ Business discovery will work
- ✅ Lead enrichment will work
- ✅ Database operations respect RLS policies
- ✅ User context properly tracked

## Quick Test Commands

```bash
# After setting JWT anon key, test Edge Function directly:
curl -X POST 'https://sriycekxdqnesdsgwiuc.supabase.co/functions/v1/business-discovery-user-aware' \
  -H 'Authorization: Bearer <USER_JWT_TOKEN>' \
  -H 'Content-Type: application/json' \
  -d '{"businessType": "coffee shop", "location": "Seattle, WA", "maxResults": 1}'

# Should return:
# { "success": true, "campaignId": "...", "leads": [...] }
```

## Summary

**What to Do**:

1. Get JWT anon key from dashboard (eyJ... format)
2. Set it as SUPABASE_ANON_KEY in Edge Functions
3. Test with `./test-session-auth.sh`
4. Visit production site and test discovery

**Time Required**: 2-3 minutes

**This is the FINAL piece needed** - once the JWT anon key is set, everything will work!
