# Custom Domain Setup - prospectpro.appsmithery.co

## 🎯 **CRITICAL FIX APPLIED**

### **Dashboard Query Bug Fixed** ✅
**Problem**: Dashboard was trying to query `user_id.eq."null"` as a string, causing PostgreSQL error:
```
invalid input syntax for type uuid: "null"
```

**Solution**: Updated query logic in `/src/pages/Dashboard.tsx`:
```typescript
// OLD (BROKEN):
.or(`user_id.eq.${user?.id || "null"},session_user_id.eq.${sessionUserId}`)

// NEW (FIXED):
if (user?.id) {
  // Authenticated: match user_id OR session_user_id
  query.or(`user_id.eq.${user.id},session_user_id.eq.${sessionUserId}`);
} else {
  // Anonymous: match session_user_id only
  query.eq("session_user_id", sessionUserId);
}
```

**Status**: ✅ Fixed, rebuilt, and deployed

---

## 🌐 **CUSTOM DOMAIN SETUP**

### **Current Status**
- ✅ Latest build deployed: https://prospect-af2g7a72c-appsmithery.vercel.app
- ⏳ Custom domain needs configuration: `prospectpro.appsmithery.co`

### **Steps to Configure Custom Domain**

#### **Option 1: Via Vercel Dashboard** (RECOMMENDED)

1. **Go to Vercel Dashboard**:
   - https://vercel.com/appsmithery/prospect-pro
   - Click **Settings** → **Domains**

2. **Add Custom Domain**:
   - Click **"Add Domain"**
   - Enter: `prospectpro.appsmithery.co`
   - Click **"Add"**

3. **Configure DNS**:
   Vercel will show DNS instructions. You need to add one of these:

   **Option A - CNAME Record** (if prospectpro is a subdomain):
   ```
   Type: CNAME
   Name: prospectpro
   Value: cname.vercel-dns.com
   ```

   **Option B - A Record** (if using root domain):
   ```
   Type: A
   Name: @
   Value: 76.76.21.21
   ```

4. **Wait for DNS Propagation**:
   - Usually takes 5-30 minutes
   - Vercel will auto-verify and issue SSL certificate

#### **Option 2: Via Vercel CLI**

```bash
cd /workspaces/ProspectPro/dist
vercel domains add prospectpro.appsmithery.co prospect-pro
```

Then follow DNS configuration instructions.

---

## 📊 **DEPLOYMENT STATUS**

### **Current Deployments**
| URL | Status | Type |
|-----|--------|------|
| https://prospect-af2g7a72c-appsmithery.vercel.app | ✅ ACTIVE | Latest production |
| https://prospect-1tpnfb7gc-appsmithery.vercel.app | ✅ ACTIVE | Previous deployment |
| https://prospectpro.appsmithery.co | ⏳ PENDING | Custom domain (needs DNS) |

### **What's Fixed in Latest Deployment**
✅ Dashboard query handles NULL values properly  
✅ Anonymous users can view their campaigns  
✅ Authenticated users can view their campaigns  
✅ No more UUID syntax errors  

---

## 🧪 **VERIFICATION STEPS**

### **1. Test Dashboard (Critical)**

**Open**: https://prospect-af2g7a72c-appsmithery.vercel.app/dashboard

**Expected Behavior**:
- ✅ No error messages
- ✅ Loading spinner → Campaign list or "No campaigns yet"
- ✅ No "invalid input syntax" errors in console

**Check Console**:
```javascript
// Should see:
📊 Fetching campaigns for user: session_[timestamp]_[id]
✅ Campaigns loaded: [number]
```

**No Longer Should See**:
```javascript
❌ Error: invalid input syntax for type uuid: "null"
```

### **2. Test Business Discovery**

**Open**: https://prospect-af2g7a72c-appsmithery.vercel.app/

1. Select: **Professional Services** → **Accounting & Tax**
2. Location: **New York, NY**
3. Click **"Start Discovery"**

**Expected**:
- ✅ Progress bar appears
- ✅ Navigates to campaign page
- ✅ Campaign saved to database
- ✅ Dashboard shows new campaign

### **3. Verify Database**

**Run in Supabase SQL Editor**:
```sql
-- Check campaigns with session IDs
SELECT 
  id,
  business_type,
  location,
  status,
  user_id,
  session_user_id,
  created_at
FROM campaigns
WHERE session_user_id IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;
```

**Expected**: Should see campaigns with `session_user_id` populated

---

## 🔧 **DNS CONFIGURATION GUIDE**

### **If using Cloudflare, Namecheap, or GoDaddy**

1. **Log in to your DNS provider**
2. **Navigate to DNS Management** for `appsmithery.co`
3. **Add CNAME Record**:
   ```
   Type:  CNAME
   Name:  prospectpro (or prospectpro.appsmithery.co)
   Value: cname.vercel-dns.com
   TTL:   Auto or 3600
   Proxy: OFF (important for Cloudflare)
   ```
4. **Save Changes**
5. **Return to Vercel Dashboard** - It will auto-verify

### **Verification**

After DNS propagation (5-30 minutes), check:
```bash
# Check DNS resolution
nslookup prospectpro.appsmithery.co

# Should show:
# Name: cname.vercel-dns.com
# Address: [Vercel IP]
```

---

## 🎯 **QUICK COMMANDS**

### **Check Current Deployment**
```bash
curl -I https://prospect-af2g7a72c-appsmithery.vercel.app
# Should return: HTTP/2 200
```

### **Test Dashboard API Call**
```bash
# Check if dashboard loads without errors
curl -s https://prospect-af2g7a72c-appsmithery.vercel.app/dashboard | grep "Error loading campaigns"
# Should return nothing (no errors)
```

### **Deploy to Production Again** (if needed)
```bash
cd /workspaces/ProspectPro
npm run build
cd dist
vercel --prod
```

---

## 📋 **CUSTOM DOMAIN CHECKLIST**

- [ ] Add domain in Vercel Dashboard
- [ ] Configure CNAME record in DNS provider
- [ ] Wait for DNS propagation (5-30 mins)
- [ ] Verify SSL certificate issued
- [ ] Test custom domain: https://prospectpro.appsmithery.co
- [ ] Verify dashboard works without errors
- [ ] Update all documentation with new URL

---

## 🚨 **TROUBLESHOOTING**

### **Issue**: Dashboard still shows error
**Check**: 
1. Are you on the latest deployment? (https://prospect-af2g7a72c-appsmithery.vercel.app)
2. Clear browser cache: Ctrl+Shift+Delete
3. Check browser console for errors
4. Verify session ID exists: `localStorage.getItem('prospect_session_id')`

### **Issue**: Custom domain not working
**Check**:
1. DNS record added correctly (CNAME → cname.vercel-dns.com)
2. DNS propagated: `nslookup prospectpro.appsmithery.co`
3. Vercel shows "Valid Configuration" in Domains settings
4. SSL certificate issued (can take 10-15 mins)

### **Issue**: "Too many redirects"
**Fix**: In Cloudflare, set SSL/TLS to "Full" not "Flexible"

---

## ✅ **NEXT STEPS**

1. **Configure Custom Domain** (see steps above)
2. **Test Dashboard** on latest deployment
3. **Verify No Errors** in browser console
4. **Test Complete Flow**:
   - Business discovery → Campaign creation → Dashboard view
5. **Update Documentation** with final custom domain URL

---

**Latest Deployment**: https://prospect-af2g7a72c-appsmithery.vercel.app  
**Target Custom Domain**: https://prospectpro.appsmithery.co  
**Status**: Dashboard bug fixed ✅, Custom domain pending DNS configuration ⏳
