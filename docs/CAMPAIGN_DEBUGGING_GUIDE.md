# Campaign Discovery Debugging Guide

## ✅ **VERIFIED WORKING**

### **Edge Function Test** - SUCCESS

```bash
# Tested with JWT anon key:
curl -X POST '.../business-discovery-user-aware'
Response: { success: true, totalFound: 2 }
```

**Status**: ✅ Edge Function is OPERATIONAL

### **Built Application** - CORRECT KEY

The production build contains the correct JWT anon key from `.env.production`:

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNyaXljZWt4ZHFuZXNkc2d3aXVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5NjU3ODksImV4cCI6MjA3MzU0MTc4OX0.Rx_1Hjz2eayKie0RpPB28i7_683ZwhVJ_5Eu_rzTWpI
```

**Status**: ✅ Correct authentication key in build

---

## 🔍 **DEBUGGING STEPS**

### **Step 1: Open Browser Console**

1. Open: https://prospect-af2g7a72c-appsmithery.vercel.app/
2. Press F12 (or Cmd+Option+I on Mac)
3. Go to **Console** tab
4. Keep it open for next steps

### **Step 2: Test Business Discovery**

1. Select: **Professional Services** → **Accounting & Tax**
2. Location: **New York, NY**
3. Target Leads: **5 leads**
4. Budget: **$50**
5. Tier: **PROFESSIONAL**
6. Click **"Start Discovery"** button

### **Step 3: Check Console Logs**

**Expected Logs** (should see):

```javascript
🚀 Starting user-aware business discovery: {...}
👤 Session User ID: session_[timestamp]_[id]
✅ User-aware discovery response: {...}
```

**If you see errors**, copy the full error message.

### **Step 4: Check Network Tab**

1. In Dev Tools, click **Network** tab
2. Click button again
3. Look for request to: `business-discovery-user-aware`
4. Click on it to see details

**Check**:

- **Status Code**: Should be 200 (success)
- **Response**: Should have `{ success: true }`
- **Headers**: Should have Authorization with JWT token

---

## 🐛 **COMMON ISSUES & FIXES**

### **Issue 1: Button Does Nothing**

**Symptoms**:

- No console logs
- No network request
- Button just doesn't respond

**Possible Causes**:

1. **React not initialized** - Check console for React errors
2. **Event handler not attached** - Check if button has onClick
3. **Form validation** - Check if required fields are filled

**Debug**:

```javascript
// In console:
console.log("Supabase client:", window.supabase);
// Should show Supabase client object
```

---

### **Issue 2: "Invalid JWT" Error**

**Symptoms**:

- Console shows: `Discovery failed: Invalid JWT`
- Network shows 401 status

**This should NOT happen** - Build has correct JWT

**If it does happen**:

1. Clear browser cache: Ctrl+Shift+Delete
2. Hard reload: Ctrl+Shift+R
3. Check if old deployment cached

---

### **Issue 3: Session ID Missing**

**Symptoms**:

- Console shows: `⏳ Waiting for session initialization...`
- Discovery never starts

**Fix**:

```javascript
// In console, manually set session ID:
localStorage.setItem(
  "prospect_session_id",
  "session_" + Date.now() + "_test123"
);
location.reload();
```

---

### **Issue 4: Network Request Fails**

**Symptoms**:

- Network tab shows failed request
- Console shows network error

**Check**:

1. **CORS error**: Edge Function should have CORS enabled
2. **DNS issue**: Check if Supabase URL resolves
3. **Firewall**: Check if requests are blocked

**Test Edge Function directly**:

```bash
curl -X POST 'https://sriycekxdqnesdsgwiuc.supabase.co/functions/v1/business-discovery-user-aware' \
  -H 'Authorization: Bearer [YOUR_JWT]' \
  -H 'Content-Type: application/json' \
  -d '{"businessType": "test", "location": "test", "maxResults": 1, "sessionUserId": "test"}'
```

---

### **Issue 5: Progress Bar Stuck**

**Symptoms**:

- Progress bar appears but doesn't complete
- No campaign created
- Page doesn't navigate

**Check**:

1. **Database permissions**: RLS policies might be blocking
2. **Edge Function timeout**: Long-running discovery
3. **Error not caught**: Check console for unhandled errors

**Verify database write**:

```sql
-- Run in Supabase SQL Editor
SELECT * FROM campaigns ORDER BY created_at DESC LIMIT 1;
```

---

## 🧪 **MANUAL TEST COMMANDS**

### **Test 1: Check Session Storage**

```javascript
// In browser console:
console.log("Session ID:", localStorage.getItem("prospect_session_id"));
console.log("All localStorage:", { ...localStorage });
```

### **Test 2: Check Supabase Client**

```javascript
// In browser console:
console.log("Supabase:", window.supabase);
console.log("Auth:", await window.supabase.auth.getSession());
```

### **Test 3: Manual Edge Function Call**

```javascript
// In browser console:
const response = await fetch(
  "https://sriycekxdqnesdsgwiuc.supabase.co/functions/v1/business-discovery-user-aware",
  {
    method: "POST",
    headers: {
      Authorization:
        "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNyaXljZWt4ZHFuZXNkc2d3aXVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5NjU3ODksImV4cCI6MjA3MzU0MTc4OX0.Rx_1Hjz2eayKie0RpPB28i7_683ZwhVJ_5Eu_rzTWpI",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      businessType: "coffee shop",
      location: "Seattle, WA",
      maxResults: 2,
      sessionUserId: "test_" + Date.now(),
    }),
  }
);
const data = await response.json();
console.log("Manual test result:", data);
```

**Expected Output**:

```javascript
{
  success: true,
  campaignId: "campaign_...",
  results: { totalFound: 2, qualified: 2 },
  leads: [ ... ]
}
```

---

## 📊 **VERIFICATION CHECKLIST**

After clicking "Start Discovery", verify:

- [ ] Console shows: `🚀 Starting user-aware business discovery`
- [ ] Console shows: `👤 Session User ID: session_...`
- [ ] Network tab shows POST request to Edge Function
- [ ] Network request has 200 status code
- [ ] Console shows: `✅ User-aware discovery response`
- [ ] Page navigates to `/campaign`
- [ ] Progress bar appears on campaign page
- [ ] Database has new campaign record

**If ALL checkboxes pass**: Campaign creation is working! ✅

**If ANY checkbox fails**: Note which one and report the error

---

## 🎯 **WHAT TO REPORT**

If campaigns still aren't working, please provide:

1. **Browser Console Screenshot** (after clicking button)
2. **Network Tab Screenshot** (showing the Edge Function request)
3. **Specific Error Message** (copy exact text)
4. **Steps You Took** (what you clicked, what fields you filled)

**Example Good Report**:

```
"Clicked Start Discovery button with:
- Business Type: Accounting & Tax
- Location: New York, NY
- Tier: PROFESSIONAL

Console Error:
❌ Discovery failed: [exact error message]

Network Tab:
Request to business-discovery-user-aware returned 401"
```

---

## 🔧 **QUICK FIXES TO TRY**

### **Fix 1: Clear Everything and Retry**

```javascript
// In console:
localStorage.clear();
sessionStorage.clear();
location.reload();
```

### **Fix 2: Force New Session**

```javascript
// In console:
localStorage.setItem(
  "prospect_session_id",
  "session_" + Date.now() + "_manual"
);
location.reload();
```

### **Fix 3: Test with Simple Data**

Try the absolute minimum:

- Business Type: Coffee Shop
- Location: Seattle, WA
- Target Leads: 2
- Tier: STARTER (cheapest)

---

**Current Deployment**: https://prospect-af2g7a72c-appsmithery.vercel.app  
**Edge Function Status**: ✅ OPERATIONAL  
**Authentication**: ✅ CORRECT JWT IN BUILD  
**Next**: Follow debugging steps above to identify the specific issue
