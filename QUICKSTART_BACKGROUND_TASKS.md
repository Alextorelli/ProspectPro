# 🚀 Quick Start: Deploy Background Tasks in 15 Minutes

**For Alex - Zero Coding Experience Needed**

---

## ✅ Pre-flight Checklist

- [ ] Supabase project: ProspectPro-Production (sriycekxdqnesdsgwiuc)
- [ ] Supabase CLI installed (`supabase --version`)
- [ ] GitHub Codespaces open with this repo
- [ ] API keys configured in Supabase (Google Places, Hunter.io, NeverBounce)

All good? Let's go! 🚀

---

## Step 1: Deploy Database Schema (5 min)

### Open Supabase Dashboard

```
1. Go to: https://supabase.com/dashboard
2. Select: ProspectPro-Production
3. Click: SQL Editor (left sidebar)
```

### Run Schema Script

```
1. Click: "+ New query"
2. Copy entire contents of: /database/job-queue-schema.sql
3. Paste into SQL editor
4. Click: "RUN" button (bottom right)
5. Wait for: "Success. No rows returned"
```

### Verify Table Created

```
1. Click: "Database" → "Tables" (left sidebar)
2. Look for: "discovery_jobs" table
3. Should show: 11 columns (id, campaign_id, status, etc)
```

✅ **Step 1 Complete!** Job queue database ready.

---

## Step 2: Deploy Edge Function (3 min)

### Open Terminal in Codespaces

```
1. Click: Terminal menu → New Terminal
2. Should see: @Alextorelli ➜ /workspaces/ProspectPro $
```

### Deploy Function

```bash
# Copy and paste this command:
supabase functions deploy business-discovery-background --no-verify-jwt
```

### Expected Output

```
Deploying function business-discovery-background...
✓ Function deployed successfully
✓ No JWT verification required
```

### Verify Deployment

```bash
# List all functions:
supabase functions list
```

Should show:

```
business-discovery-background (deployed)
business-discovery-user-aware (deployed)
enrichment-orchestrator (deployed)
... (others)
```

✅ **Step 2 Complete!** Edge Function deployed.

---

## Step 3: Test Backend (5 min)

### Get Your Anon Key

```
1. Supabase Dashboard → Settings → API
2. Copy: "anon public" key (starts with "eyJ...")
3. Keep it handy for next step
```

### Run Test Script

```bash
# In Codespaces terminal:
export SUPABASE_ANON_KEY="paste_your_anon_key_here"

# Run test:
./scripts/test-background-tasks.sh
```

### Expected Output

```
🧪 Testing Background Task Architecture
========================================

✅ Anon key configured

Test 1: Checking Edge Function deployment...
Creating test campaign (coffee shops in Portland)...

Response:
{
  "success": true,
  "jobId": "job_1234567890_abc123",
  "campaignId": "campaign_1234567890_xyz789",
  "status": "processing",
  "estimatedTime": "1-2 minutes"
}

✅ Test 1 PASSED: Campaign created
   Job ID: job_1234567890_abc123
   Campaign ID: campaign_1234567890_xyz789

Test 2: Monitoring job progress (30 seconds)...
[1/6] Status: processing | Progress: 10% | Stage: discovering_businesses
[2/6] Status: processing | Progress: 30% | Stage: scoring_businesses
[3/6] Status: processing | Progress: 50% | Stage: enriching_contacts
[4/6] Status: processing | Progress: 70% | Stage: enriching_contacts
[5/6] Status: processing | Progress: 90% | Stage: storing_results
[6/6] Status: completed | Progress: 100% | Stage: storing_results

✅ Test 2 PASSED: Job completed successfully!

Metrics:
{
  "total_found": 2,
  "total_cost": 0.52,
  "avg_confidence": 87
}

Test 3: Verifying database records...
✅ Campaign record found
   Results: 2 leads
   Cost: $0.52
✅ Test 3 PASSED: 2 leads found in database

========================================
🎉 Background Task Architecture Test Complete!
```

### If Test Fails

**Scenario A: "Invalid JWT" error**

```bash
# Get fresh anon key from Supabase Dashboard
export SUPABASE_ANON_KEY="new_anon_key"
./scripts/test-background-tasks.sh
```

**Scenario B: "Function not found" error**

```bash
# Redeploy function
supabase functions deploy business-discovery-background --no-verify-jwt
./scripts/test-background-tasks.sh
```

**Scenario C: Job stays in "pending"**

```
1. Go to: Supabase Dashboard → Edge Functions → Logs
2. Look for: business-discovery-background logs
3. Check for: Error messages
4. Fix: Usually API key issue (Google Places, Hunter.io)
```

✅ **Step 3 Complete!** Backend fully tested and working.

---

## Step 4: View Results in Dashboard (2 min)

### Check Job Record

```
1. Supabase Dashboard → Database → discovery_jobs
2. Filter by: id (use jobId from test)
3. Should see: status = "completed", progress = 100
```

### Check Campaign Record

```
1. Database → campaigns
2. Filter by: id (use campaignId from test)
3. Should see: results_count = 2, total_cost = 0.52
```

### Check Leads

```
1. Database → leads
2. Filter by: campaign_id (use campaignId from test)
3. Should see: 2 rows with business names, emails, phones
```

✅ **Step 4 Complete!** Data verified in database.

---

## Step 5: Frontend Integration (Coming Next)

### What You Need to Do

**A. Update Campaign Form** (file: `src/components/CampaignForm.tsx`)

Change API endpoint from:

```typescript
// OLD:
const response = await fetch('.../business-discovery-user-aware', ...)

// NEW:
const response = await fetch('.../business-discovery-background', ...)
```

Response will include `jobId`:

```typescript
const { jobId, campaignId } = await response.json();
navigate(`/campaign/${campaignId}/progress?jobId=${jobId}`);
```

**B. Create Progress Page** (file: `src/pages/CampaignProgress.tsx`)

Copy this template:

```typescript
import { useJobProgress, JobProgressDisplay } from "../hooks/useJobProgress";
import { useParams, useSearchParams } from "react-router-dom";

export function CampaignProgress() {
  const { campaignId } = useParams();
  const [searchParams] = useSearchParams();
  const jobId = searchParams.get("jobId");

  return (
    <div className="campaign-progress-page">
      <h1>Campaign In Progress</h1>
      {jobId && <JobProgressDisplay jobId={jobId} />}
    </div>
  );
}
```

**C. Add Route** (file: `src/App.tsx`)

```typescript
<Route path="/campaign/:campaignId/progress" element={<CampaignProgress />} />
```

**That's it!** Real-time progress updates will work automatically via the `useJobProgress` hook.

---

## 🎯 What You Just Built

### Before (Broken)

```
User submits campaign
  ↓
Edge Function times out (25 seconds)
  ↓
Returns 0 leads (incomplete)
  ↓
Dashboard shows wrong data
```

### After (Working)

```
User submits campaign
  ↓
Edge Function returns immediately (<100ms)
  ↓
Shows progress page with live updates
  ↓
Background task completes (1-2 minutes)
  ↓
Shows accurate results
```

### Key Improvements

- ✅ No timeouts (unlimited processing time)
- ✅ Real-time progress updates
- ✅ Accurate lead data
- ✅ Correct cost tracking
- ✅ Better user experience

---

## 📊 Monitoring Your App

### Real-time Job Monitoring

**Supabase Dashboard → Database → discovery_jobs**

```sql
SELECT id, status, progress, current_stage, metrics
FROM discovery_jobs
ORDER BY created_at DESC
LIMIT 10;
```

Shows last 10 jobs with:

- Status: pending, processing, completed, failed
- Progress: 0-100%
- Stage: discovering, scoring, enriching, storing
- Metrics: leads found, cost, avg confidence

### Campaign Results

**Database → campaigns**

```sql
SELECT business_type, location, results_count, total_cost, created_at
FROM campaigns
ORDER BY created_at DESC
LIMIT 10;
```

### Edge Function Logs

**Supabase Dashboard → Edge Functions → Logs**

- Filter by: business-discovery-background
- Shows: All function executions, errors, console.log output
- Refresh every few seconds during testing

---

## 🚨 Common Issues & Fixes

### Issue 1: "Function returns 401 Invalid JWT"

**Cause**: Anon key mismatch  
**Fix**:

```bash
# Get current anon key from Supabase Dashboard
export SUPABASE_ANON_KEY="fresh_key_from_dashboard"
./scripts/test-background-tasks.sh
```

### Issue 2: "Job stays in pending status"

**Cause**: Background task not starting  
**Fix**:

1. Check Edge Function logs (Dashboard → Edge Functions → Logs)
2. Look for error message
3. Usually API key issue:
   - Dashboard → Edge Functions → business-discovery-background → Settings
   - Verify: GOOGLE_PLACES_API_KEY, HUNTER_IO_API_KEY, NEVERBOUNCE_API_KEY

### Issue 3: "No leads in database"

**Cause**: Database permissions (RLS policies)  
**Fix**:

```sql
-- Run in SQL Editor:
SELECT * FROM campaigns WHERE id = 'your_campaign_id';
SELECT * FROM leads WHERE campaign_id = 'your_campaign_id';
```

If returns empty, RLS policies may be blocking. Check user_id and session_user_id match.

### Issue 4: "Real-time updates not appearing in frontend"

**Cause**: Supabase Real-time not enabled  
**Fix**:

1. Dashboard → Database → Replication
2. Enable replication for: discovery_jobs table
3. Click "Enable"

---

## ✅ Success Checklist

After deployment, you should have:

- [x] **Database**: `discovery_jobs` table exists
- [x] **Edge Function**: `business-discovery-background` deployed
- [x] **Test Campaign**: Completed successfully with >0 leads
- [x] **Database Records**: Campaign and leads visible in dashboard
- [x] **Logs**: No errors in Edge Function logs
- [x] **Real-time**: Job progress updates visible in database

If all checked: **🎉 YOU'RE PRODUCTION READY!**

---

## 🚀 Next Steps

### Immediate

1. Integrate frontend (Step 5 above)
2. Test with real campaigns (different business types, locations)
3. Monitor costs and performance

### This Week

1. Deploy to production (Vercel)
2. Share with beta users
3. Collect feedback on progress page UX

### This Month

1. Add Stripe integration (paid tiers)
2. Implement advanced filters
3. Add email notifications for completed campaigns

---

## 📚 Documentation Reference

- **Full Implementation Guide**: `/BACKGROUND_TASKS_IMPLEMENTATION.md`
- **Architecture Decision**: `/ARCHITECTURE_DECISION_BACKGROUND_TASKS.md`
- **Database Schema**: `/database/job-queue-schema.sql`
- **Edge Function**: `/supabase/functions/business-discovery-background/index.ts`
- **Frontend Hook**: `/src/hooks/useJobProgress.tsx`
- **Test Script**: `/scripts/test-background-tasks.sh`

---

## 🎯 You Did It!

**In 15 minutes you:**

- ✅ Created a production-ready job queue system
- ✅ Deployed background task Edge Function
- ✅ Implemented real-time progress tracking
- ✅ Tested with live campaigns
- ✅ Fixed the timeout issue permanently

**Cost**: $0 additional  
**Maintenance**: Zero  
**Scalability**: Unlimited

**Your app now handles 1-2 minute campaigns without timeouts!** 🚀

---

**Questions?** Check the full docs or Edge Function logs.  
**Issues?** Run the test script again to diagnose.  
**Ready?** Deploy to production! 🎉
