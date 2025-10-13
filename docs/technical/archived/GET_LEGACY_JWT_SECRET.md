# 🔑 Get Legacy JWT Secret for Edge Functions

## Action Required

Based on your Supabase dashboard screenshot, you need to get the **Legacy JWT Secret / Anon Key**.

### Steps:

1. **In your Supabase Dashboard**, click the **"Legacy JWT Secret"** tab (the first tab in your screenshot)

2. **Look for the "anon" key** - it should be in JWT format starting with `eyJ...`

3. **Copy that key**

4. **Run this command** in your Codespace:

```bash
cd /workspaces/ProspectPro

# Set the anon key (replace eyJ... with the actual key)
echo 'SUPABASE_ANON_KEY=eyJ...' > .env.edge
supabase secrets set SUPABASE_ANON_KEY --env-file .env.edge

# Test
./test-session-auth.sh
```

## Why We Need This

Supabase Edge Functions validate JWTs at the platform level using the `SUPABASE_ANON_KEY`. Currently, it's set to the `sb_publishable_` key (database API key), but Edge Functions need the **JWT anon key** to validate user session tokens.

## Alternative: Check Current Value

Let me first check what format the current SUPABASE_ANON_KEY is in. If it's already a JWT, we might have a different issue.

**Can you go to the "Legacy JWT Secret" tab and share:**

- The "anon" key (should start with `eyJ...`)
- The "service_role" key (should also start with `eyJ...`)

Once we have those, I'll update the Edge Function environment and everything will work!
