# 🚨 URGENT: API Key Migration Required

**Issue**: Legacy Supabase API keys were disabled on September 15, 2025
**Error**: "Legacy API keys are disabled"
**Impact**: Dashboard not loading, all API calls failing

---

## Immediate Action Required

### Step 1: Get New API Keys from Supabase Dashboard

1. Go to: https://supabase.com/dashboard/project/sriycekxdqnesdsgwiuc/settings/api
2. Find the **NEW API Keys** section (not legacy)
3. Copy these values:
   - **Project URL**: https://sriycekxdqnesdsgwiuc.supabase.co
   - **Anon/Publishable Key**: `sb_publishable_...` (NEW FORMAT)
   - **Service Role Key**: `sb_secret_...` (NEW FORMAT)

### Step 2: Update `.env.production`

Replace the old JWT tokens with the new keys:

```bash
VITE_SUPABASE_URL=https://sriycekxdqnesdsgwiuc.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_YOUR_NEW_KEY_HERE
VITE_EDGE_FUNCTIONS_URL=https://sriycekxdqnesdsgwiuc.supabase.co/functions/v1
SUPABASE_SERVICE_ROLE_KEY=sb_secret_YOUR_NEW_KEY_HERE
```

### Step 3: Rebuild and Redeploy

```bash
# Rebuild frontend with new keys
npm run build

# Deploy to Vercel
cd dist && vercel --prod
```

### Step 4: Update Edge Function Secrets

The Edge Functions also need the new service role key:

1. Go to: https://supabase.com/dashboard/project/sriycekxdqnesdsgwiuc/functions
2. Click on each Edge Function
3. Go to "Settings" tab
4. Update `SUPABASE_SERVICE_ROLE_KEY` with new `sb_secret_...` key

**Edge Functions to Update**:

- business-discovery-user-aware
- campaign-export-user-aware
- enrichment-orchestrator
- enrichment-hunter
- enrichment-neverbounce
- enrichment-business-license
- enrichment-pdl

---

## Alternative: Re-enable Legacy Keys (Temporary)

If you need immediate access while migrating:

1. Go to: https://supabase.com/dashboard/project/sriycekxdqnesdsgwiuc/settings/api
2. Find "Legacy API Keys" section
3. Click "Re-enable Legacy Keys"
4. This gives you temporary access while you migrate to new keys

**Warning**: Legacy keys will be permanently disabled eventually. Migrate to new keys ASAP.

---

## Verification Steps

After updating keys:

### Test 1: Database Access

```bash
curl 'https://sriycekxdqnesdsgwiuc.supabase.co/rest/v1/campaigns?select=id&limit=1' \
  -H "apikey: YOUR_NEW_PUBLISHABLE_KEY" \
  -H "Authorization: Bearer YOUR_NEW_PUBLISHABLE_KEY"
```

Expected: JSON response with campaign data (not "Legacy API keys" error)

### Test 2: Edge Function

```bash
curl -X POST 'https://sriycekxdqnesdsgwiuc.supabase.co/functions/v1/business-discovery-user-aware' \
  -H 'Authorization: Bearer YOUR_NEW_PUBLISHABLE_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"businessType": "coffee shop", "location": "Seattle, WA", "maxResults": 1, "sessionUserId": "test"}'
```

Expected: JSON response with discovery results

### Test 3: Frontend

1. Open: https://prospect-ijj4myuyt-appsmithery.vercel.app
2. Go to Dashboard tab
3. Should see campaigns (not "Legacy API keys" error)

---

## New API Key Format Reference

### Old Format (JWT Tokens - DEPRECATED):

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### New Format (Current):

```
Publishable: sb_publishable_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
Secret:      sb_secret_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

---

## Impact Assessment

**Affected Components**:

- ❌ Frontend (Dashboard, Discovery, Campaign pages)
- ❌ Edge Functions (all 7 functions)
- ❌ Database queries (campaigns, leads)
- ❌ Enrichment services (Hunter.io, NeverBounce)

**Timeline**:

- Legacy keys disabled: September 15, 2025
- Current date: October 4, 2025
- **You've been using disabled keys for 19 days!**

**Priority**: 🔴 CRITICAL - Fix immediately to restore all functionality

---

## Quick Commands

### 1. Get current keys (will fail with legacy error):

```bash
grep VITE_SUPABASE_ANON_KEY .env.production
```

### 2. Test if keys work:

```bash
curl -s 'https://sriycekxdqnesdsgwiuc.supabase.co/rest/v1/campaigns?select=count' \
  -H "apikey: $(grep VITE_SUPABASE_ANON_KEY .env.production | cut -d'=' -f2)" \
  -H "Authorization: Bearer $(grep VITE_SUPABASE_ANON_KEY .env.production | cut -d'=' -f2)"
```

### 3. After getting new keys, update and deploy:

```bash
# Update .env.production with new keys
nano .env.production

# Rebuild
npm run build

# Deploy
cd dist && vercel --prod

# Test
curl https://prospect-ijj4myuyt-appsmithery.vercel.app
```

---

## Support

**Supabase Dashboard**: https://supabase.com/dashboard/project/sriycekxdqnesdsgwiuc/settings/api
**Documentation**: https://supabase.com/docs/guides/api#api-keys

**Need Help?**

1. Check Supabase dashboard for new key format
2. Verify keys are enabled (not disabled)
3. Ensure keys have proper permissions

---

## Checklist

- [ ] Access Supabase Dashboard API settings
- [ ] Copy new `sb_publishable_...` key
- [ ] Copy new `sb_secret_...` key
- [ ] Update `.env.production` with new keys
- [ ] Rebuild frontend (`npm run build`)
- [ ] Redeploy to Vercel (`cd dist && vercel --prod`)
- [ ] Update Edge Function secrets in Supabase dashboard
- [ ] Test database access (curl command)
- [ ] Test Edge Functions (curl command)
- [ ] Test frontend (open production URL)
- [ ] Verify Dashboard loads
- [ ] Verify Discovery works
- [ ] Verify Campaign results display

**Estimated Time**: 15-30 minutes (mostly waiting for deployments)
