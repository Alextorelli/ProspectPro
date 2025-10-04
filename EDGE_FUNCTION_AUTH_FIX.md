# 🔧 Edge Function Authentication Fix

## The Real Problem (Clarified by Supabase AI)

**We're mixing up two different authentication systems:**

### Database API (PostgREST)

- Uses: `sb_publishable_...` or `sb_secret_...` keys
- Status: ✅ WORKING

### Edge Functions API

- Uses: **JWT tokens** (not the publishable keys!)
- JWT sources:
  1. User session JWT (from `supabase.auth.getSession()`)
  2. Project anon key (JWT format, starts with `eyJ...`)
  3. Function secret (custom header)
- Status: ❌ BROKEN - we're sending publishable key instead of JWT

## Current Issue

```bash
# What we're doing (WRONG):
Authorization: Bearer sb_publishable_GaGU6ZiyiO6ncO7kU2qAvA_SFuCyYaM
# Edge Functions reject this because it's not a JWT

# What we need (RIGHT):
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
# OR use authenticated user session JWT
# OR use x-supabase-function-secret header
```

## The Solution

### Option 1: Get the Anon JWT Key (Quick Fix)

**In Supabase Dashboard:**

1. Go to: https://supabase.com/dashboard/project/sriycekxdqnesdsgwiuc/settings/api
2. Look for **"Project API keys"** section
3. Find **"anon" / "public"** key (should be JWT format `eyJ...`)
4. Copy that JWT key

**Note:** This is DIFFERENT from the `sb_publishable_` key!

### Option 2: Use Authenticated User Sessions (Best Practice)

Instead of using anon key, use actual user authentication:

```typescript
// Frontend: Get user's JWT token
const {
  data: { session },
} = await supabase.auth.getSession();
const userToken = session?.access_token;

// Call Edge Function with user's JWT
const response = await fetch(edgeFunctionUrl, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${userToken}`, // User's JWT, not anon key
    "Content-Type": "application/json",
  },
  body: JSON.stringify(params),
});
```

### Option 3: Use Function Secrets (Most Secure)

```bash
# Set a custom function secret
supabase secrets set FUNCTION_SECRET=your-secure-random-string

# Call Edge Function with secret
curl -X POST 'https://...functions/v1/business-discovery-user-aware' \
  -H 'x-supabase-function-secret: your-secure-random-string' \
  -H 'Content-Type: application/json' \
  -d '{...}'
```

## Recommended Implementation

**For ProspectPro, I recommend Option 2 (User Sessions):**

1. **Anonymous users** → Create anonymous session → Get JWT → Use for Edge Functions
2. **Authenticated users** → Already have JWT → Use existing session
3. **No exposed keys** → JWTs are session-specific and expire

### Implementation Steps:

1. **Update Supabase client initialization** to get session JWT
2. **Modify Edge Function calls** to use `session.access_token`
3. **Handle anonymous users** by creating temporary sessions
4. **Remove hardcoded keys** from frontend code

## What About the Keys We Have?

| Key Type                                         | Purpose        | Works For                     |
| ------------------------------------------------ | -------------- | ----------------------------- |
| `sb_publishable_GaGU6ZiyiO6ncO7kU2qAvA_SFuCyYaM` | Database API   | ✅ PostgREST queries          |
| `sb_secret_bY8n_a7-hP0Lxd9dPT_efg_3WzpnXN_`      | Admin Database | ✅ Service role DB access     |
| `eyJ...` (JWT anon key - MISSING)                | Edge Functions | ❌ Need to get from dashboard |
| User session JWT (dynamic)                       | Edge Functions | ✅ Best practice              |

## Next Steps

**Tell me which option you prefer:**

**A) Quick Fix (5 min)** - Get anon JWT key from Supabase dashboard, I'll update everything

**B) Best Practice (15 min)** - Implement user session authentication (anonymous + authenticated users)

**C) Function Secrets (10 min)** - Set up custom function authentication

For ProspectPro, **I recommend Option B** because:

- ✅ Most secure (no exposed keys)
- ✅ Supports both anonymous and authenticated users
- ✅ Aligns with your user-aware architecture
- ✅ Proper session management
- ✅ No hardcoded credentials

## Code Changes Needed (Option B)

```typescript
// 1. Update supabase client to track sessions
// 2. Create anonymous session for unauthenticated users
// 3. Use session.access_token for Edge Function calls
// 4. Handle token refresh automatically
```

Would you like me to implement Option B?
