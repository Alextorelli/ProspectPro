# Quick Testing Guide - ProspectPro v4.2

**Production URL**: https://prospect-1tpnfb7gc-appsmithery.vercel.app

---

## 🚀 **QUICK START TEST**

### **1. Open Production URL**

```
https://prospect-1tpnfb7gc-appsmithery.vercel.app
```

### **2. Open Browser Dev Tools**

**Chrome/Edge**: F12 or Ctrl+Shift+I  
**Check Console Tab**: Should see no errors

### **3. Check Session ID**

In Console, type:

```javascript
localStorage.getItem("prospect_session_id");
```

**Expected**: `"session_1728020000_abc123xyz"`

---

## 🧪 **TEST SCENARIOS**

### **Test 1: Anonymous User Discovery** ⚡ CRITICAL

**Steps**:

1. Don't sign in (use as anonymous user)
2. Select: **Home & Property Services** → **Electrician**
3. Location: **New York, NY**
4. Target Leads: **5 leads**
5. Budget: **$50**
6. Tier: **PROFESSIONAL** ($0.076/lead)
7. Click **"Start Discovery"**

**Expected**:

- ✅ Button triggers without error
- ✅ Progress bar appears
- ✅ Navigates to `/campaign` page
- ✅ Shows processing stages
- ✅ Creates campaign in database

**Check Console**:

```javascript
// Should see:
🚀 Starting user-aware business discovery: {...}
👤 Session User ID: session_[timestamp]_[random]
✅ User-aware discovery response: {...}
```

---

### **Test 2: Dashboard View** ⚡ CRITICAL

**Steps**:

1. Click **Dashboard** in navigation
2. Wait for campaigns to load

**Expected**:

- ✅ Loading spinner appears briefly
- ✅ Stats cards show totals
- ✅ Campaign list displays
- ✅ Only your campaigns visible (filtered by session)

**Check Console**:

```javascript
// Should see:
📊 Fetching campaigns for user: session_[your_session_id]
✅ Campaigns loaded: [number]
```

---

### **Test 3: Campaign Details**

**Steps**:

1. From dashboard, click any campaign
2. View campaign details

**Expected**:

- ✅ Shows business list
- ✅ Shows contact information
- ✅ Shows confidence scores
- ✅ Shows export button

---

### **Test 4: Multi-Tier Testing** (Optional)

Test all 4 enrichment tiers:

| Tier             | Price       | Test Business | Location          |
| ---------------- | ----------- | ------------- | ----------------- |
| **STARTER**      | $0.034/lead | Coffee Shop   | Seattle, WA       |
| **PROFESSIONAL** | $0.076/lead | Restaurant    | San Francisco, CA |
| **ENTERPRISE**   | $0.118/lead | Salon         | Los Angeles, CA   |
| **COMPLIANCE**   | $1.118/lead | Law Firm      | Chicago, IL       |

---

## 🔍 **DEBUGGING CHECKS**

### **If Button Doesn't Work**

**1. Check Network Tab**:

- Open Dev Tools → Network tab
- Click button
- Look for request to: `/functions/v1/business-discovery-user-aware`
- **Expected**: POST request with status 200

**2. Check Console Errors**:

```javascript
// Look for errors like:
❌ User-aware discovery error: [error message]
```

**3. Check Auth Context**:

```javascript
// In Console:
console.log("Auth Context loaded:", !!window.AuthContext);
```

**4. Check Supabase Client**:

```javascript
// In Console:
console.log("Supabase client:", window.supabase);
```

---

### **If Dashboard Shows No Data**

**1. Check Session ID**:

```javascript
localStorage.getItem("prospect_session_id");
// Should not be null
```

**2. Check Database Query**:
Open Supabase Dashboard → SQL Editor:

```sql
SELECT COUNT(*) FROM campaigns
WHERE session_user_id IS NOT NULL;
```

**Expected**: Should show campaign count

**3. Check RLS Policies**:

```sql
SELECT * FROM campaigns LIMIT 1;
```

**If this fails**: RLS policy issue

**4. Check Console**:

```javascript
// Should see:
📊 Fetching campaigns for user: [session_id]
✅ Campaigns loaded: [count]
```

---

## 🔧 **COMMON ISSUES & FIXES**

### **Issue**: "Invalid JWT" error

**Fix**: Clear localStorage and reload

```javascript
localStorage.clear();
location.reload();
```

### **Issue**: Button does nothing

**Checks**:

1. Check browser console for errors
2. Check Network tab for failed requests
3. Verify Supabase URL in config
4. Check Edge Function deployment status

### **Issue**: Dashboard empty

**Checks**:

1. Verify campaign was created (check database)
2. Check session_user_id matches
3. Verify RLS policies allow anonymous access
4. Check browser console for query errors

### **Issue**: TypeScript/Build errors

**Fix**: Rebuild and redeploy

```bash
cd /workspaces/ProspectPro
npm run build
cd dist
vercel --prod --force
```

---

## 🎯 **SUCCESS CRITERIA**

| Feature                         | Status  | Notes                         |
| ------------------------------- | ------- | ----------------------------- |
| Business discovery button works | ⏳ TEST | Click should trigger API call |
| Progress bar shows stages       | ⏳ TEST | Should see enrichment stages  |
| Campaign creates in database    | ⏳ TEST | Check Supabase dashboard      |
| Dashboard shows campaigns       | ⏳ TEST | Should see campaign list      |
| Stats are accurate              | ⏳ TEST | Match database counts         |
| User data isolation works       | ⏳ TEST | Each session sees own data    |
| All 4 tiers work                | ⏳ TEST | Test each enrichment tier     |
| Export functionality works      | ⏳ TEST | CSV export downloads          |

---

## 📊 **VERIFICATION QUERIES**

### **Check Campaigns in Database**

```sql
-- Run in Supabase SQL Editor
SELECT
  id,
  business_type,
  location,
  status,
  results_count,
  total_cost,
  session_user_id,
  created_at
FROM campaigns
ORDER BY created_at DESC
LIMIT 10;
```

### **Check Leads Count**

```sql
SELECT
  c.business_type,
  c.location,
  COUNT(l.id) as lead_count
FROM campaigns c
LEFT JOIN leads l ON l.campaign_id = c.id
GROUP BY c.business_type, c.location
ORDER BY c.created_at DESC;
```

### **Check RLS Policies**

```sql
SELECT
  tablename,
  policyname,
  cmd,
  permissive
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('campaigns', 'leads', 'dashboard_exports')
ORDER BY tablename, cmd;
```

---

## 🎊 **EXPECTED RESULTS**

**After successful test**:

- ✅ Button triggers discovery
- ✅ Campaign appears in database
- ✅ Dashboard shows new campaign
- ✅ Stats update correctly
- ✅ No console errors
- ✅ Edge Functions log success

**Performance**:

- Button response: <500ms
- Discovery completion: 2-5 seconds
- Dashboard load: <1 second
- Database queries: <100ms

---

## 📞 **QUICK REFERENCE**

**Production URL**: https://prospect-1tpnfb7gc-appsmithery.vercel.app  
**Supabase Dashboard**: https://supabase.com/dashboard/project/sriycekxdqnesdsgwiuc  
**Edge Functions**: https://sriycekxdqnesdsgwiuc.supabase.co/functions/v1/  
**Vercel Dashboard**: https://vercel.com/appsmithery/prospect-pro

**Edge Function Test**:

```bash
curl -X POST \
  'https://sriycekxdqnesdsgwiuc.supabase.co/functions/v1/business-discovery-user-aware' \
  -H 'Authorization: Bearer sb_publishable_your_key_here' \
  -H 'Content-Type: application/json' \
  -d '{
    "businessType": "coffee shop",
    "location": "Seattle, WA",
    "maxResults": 2,
    "sessionUserId": "test_session_123"
  }'
```

---

**🚀 Ready to test! Start with Test 1 (Anonymous User Discovery)**
