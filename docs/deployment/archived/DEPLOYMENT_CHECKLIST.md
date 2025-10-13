# ✅ Background Tasks Deployment Checklist

**Alex's Personal Deployment Guide**  
**Estimated Time**: 30 minutes total  
**Difficulty**: Easy (copy-paste commands)

---

## 📋 Pre-Deployment Checklist

### Before You Start

- [ ] I'm in GitHub Codespaces with ProspectPro repo open
- [ ] I have Supabase Dashboard open in another tab
- [ ] I have my Supabase project selected (ProspectPro-Production)
- [ ] I know my Supabase URL: `https://sriycekxdqnesdsgwiuc.supabase.co`
- [ ] I have my anon key ready (Settings → API in Supabase Dashboard)

---

## 🎯 Phase 1: Database Setup (5 minutes)

### Step 1.1: Open SQL Editor

- [ ] Open Supabase Dashboard → SQL Editor (left sidebar)
- [ ] Click "+ New query" button

### Step 1.2: Copy Schema

- [ ] Open file: `/database/job-queue-schema.sql` in Codespaces
- [ ] Select all (Ctrl+A / Cmd+A)
- [ ] Copy (Ctrl+C / Cmd+C)

### Step 1.3: Run Schema

- [ ] Paste in Supabase SQL Editor (Ctrl+V / Cmd+V)
- [ ] Click "RUN" button (bottom right)
- [ ] Wait for "Success. No rows returned" message

### Step 1.4: Verify Table

- [ ] Go to Database → Tables (left sidebar)
- [ ] Look for `discovery_jobs` in table list
- [ ] Click on it to see columns
- [ ] Should show: id, campaign_id, status, progress, current_stage, config, results, metrics, error, created_at, started_at, completed_at, updated_at, user_id, session_user_id

**✅ Phase 1 Complete!** Job queue database ready.

---

## 🚀 Phase 2: Edge Function Deployment (5 minutes)

### Step 2.1: Open Terminal

- [ ] In Codespaces, click Terminal menu → New Terminal
- [ ] Terminal should open at bottom of screen

### Step 2.2: Deploy Function

Copy and paste this command:

```bash
supabase functions deploy business-discovery-background --no-verify-jwt
```

- [ ] Press Enter
- [ ] Wait for "Function deployed successfully" message

### Step 2.3: Verify Deployment

Copy and paste this command:

```bash
supabase functions list
```

- [ ] Press Enter
- [ ] Look for `business-discovery-background` in list
- [ ] Status should show "deployed"

**✅ Phase 2 Complete!** Edge Function deployed.

---

## 🧪 Phase 3: Backend Testing (5 minutes)

### Step 3.1: Get Publishable Key

- [ ] Open Supabase Dashboard → Settings → API
- [ ] Find "Project API keys" section
- [ ] Copy the **publishable** key (starts with `sb_publishable_`)

### Step 3.2: Set Environment Variable

In terminal, paste this (replace with your actual key):

```bash
export NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_XXXXXXXXXXXXXXXXXXXXXXXX
```

- [ ] Press Enter

### Step 3.3: Run Test Script

Copy and paste this command:

```bash
./scripts/test-background-tasks.sh
```

- [ ] Press Enter
- [ ] Watch the output

### Step 3.4: Check Test Results

Look for these messages in output:

- [ ] "✅ Test 1 PASSED: Campaign created"
- [ ] You see a jobId (something like "job_1234567890_abc123")
- [ ] Progress updates appear (10%, 30%, 50%, etc.)
- [ ] "✅ Test 2 PASSED: Job completed successfully!"
- [ ] "✅ Test 3 PASSED: X leads found in database"

**If you see all ✅ marks**: Everything works! Continue to Phase 4.

**If you see ❌ marks**: Check troubleshooting section below.

**✅ Phase 3 Complete!** Backend verified working.

---

## 📊 Phase 4: Verify in Dashboard (3 minutes)

### Step 4.1: Check Job Record

- [ ] Supabase Dashboard → Database → discovery_jobs
- [ ] Click "Select rows" or refresh table view
- [ ] Find your test job (look for recent timestamp)
- [ ] Verify: status = "completed", progress = 100

### Step 4.2: Check Campaign Record

- [ ] Database → campaigns
- [ ] Find your test campaign (business_type = "coffee shop", location = "Portland, OR")
- [ ] Verify: results_count > 0, total_cost > 0

### Step 4.3: Check Leads

- [ ] Database → leads
- [ ] Filter by campaign_id (copy from campaigns table)
- [ ] Verify: You see multiple rows with business names, addresses, phones

**✅ Phase 4 Complete!** Data verified in database.

---

## 🎨 Phase 5: Frontend Integration (10 minutes)

### Step 5.1: Update Campaign Form

File to edit: `src/components/CampaignForm.tsx` (or wherever you handle campaign submission)

**Find this line** (or similar):

```typescript
const response = await fetch(
  'https://sriycekxdqnesdsgwiuc.supabase.co/functions/v1/business-discovery-user-aware',
```

**Change to**:

```typescript
const response = await fetch(
  'https://sriycekxdqnesdsgwiuc.supabase.co/functions/v1/business-discovery-background',
```

**After getting response, add**:

```typescript
const { jobId, campaignId } = await response.json();
navigate(`/campaign/${campaignId}/progress?jobId=${jobId}`);
```

- [ ] Made these changes
- [ ] Saved file

### Step 5.2: Create Progress Page

Create new file: `src/pages/CampaignProgress.tsx`

Copy this entire template:

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

- [ ] Created file
- [ ] Pasted template
- [ ] Saved file

### Step 5.3: Add Route

File to edit: `src/App.tsx` (or your main routing file)

**Find your routes section**, add this line:

```typescript
<Route path="/campaign/:campaignId/progress" element={<CampaignProgress />} />
```

- [ ] Added route
- [ ] Imported CampaignProgress at top of file
- [ ] Saved file

**✅ Phase 5 Complete!** Frontend integrated.

---

## 🌐 Phase 6: Deploy to Production (5 minutes)

### Step 6.1: Build Frontend

In terminal:

```bash
npm run build
```

- [ ] Command completed without errors
- [ ] You see "✓ built in XXXXms" message

### Step 6.2: Deploy to Vercel

```bash
cd dist
vercel --prod
```

- [ ] Command completed
- [ ] You see deployment URL

### Step 6.3: Test Production

- [ ] Open the deployment URL in browser
- [ ] Submit a test campaign
- [ ] You're redirected to progress page
- [ ] Progress bar appears and updates
- [ ] Campaign completes successfully

**✅ Phase 6 Complete!** Production deployment verified.

---

## 🎯 Final Verification Checklist

### Backend

- [ ] Job record created in `discovery_jobs` table
- [ ] Status progresses: pending → processing → completed
- [ ] Progress increases: 0% → 100%
- [ ] Campaign record created in `campaigns` table
- [ ] Leads created in `leads` table
- [ ] No errors in Edge Function logs

### Frontend

- [ ] Campaign form submits successfully
- [ ] Redirects to progress page with jobId
- [ ] Progress bar displays
- [ ] Progress bar updates automatically
- [ ] Stage labels change (discovering → scoring → enriching → storing)
- [ ] Metrics update (businesses found, cost, etc)
- [ ] Completed state shows success message
- [ ] Can navigate to results page

### User Experience

- [ ] Response time <100ms (instant feedback)
- [ ] Progress updates every 2-5 seconds
- [ ] Campaign completes in 1-2 minutes
- [ ] Results show accurate data (not 0 leads)
- [ ] Cost calculation is correct
- [ ] No timeout errors

**If all checked**: 🎉 **YOU'RE PRODUCTION READY!**

---

## 🚨 Troubleshooting

### Issue: "Invalid JWT" Error

**What you see**:

```json
{ "error": "Invalid JWT" }
```

**Fix**:

1. Get fresh publishable key from Supabase Dashboard → Settings → API
2. Update in terminal: `export NEXT_PUBLIC_SUPABASE_ANON_KEY="new_key"`
3. Re-run test: `./scripts/test-background-tasks.sh`

- [ ] Fixed

---

### Issue: "Foreign Key Constraint" Error

**What you see**:

```json
{
  "success": false,
  "error": "Failed to create job: insert or update on table \"discovery_jobs\" violates foreign key constraint \"discovery_jobs_campaign_id_fkey\""
}
```

**What happened**: The old schema had a foreign key constraint that required the campaign to exist before the job, but the job is created first.

**Fix**:

1. Open Supabase Dashboard → SQL Editor
2. Run this migration script:

```sql
-- Drop and recreate table without foreign key constraint
DROP TABLE IF EXISTS discovery_jobs CASCADE;

CREATE TABLE discovery_jobs (
  id TEXT PRIMARY KEY,
  campaign_id TEXT, -- No FK constraint
  user_id UUID REFERENCES auth.users(id),
  session_user_id TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  current_stage TEXT DEFAULT 'initializing',
  config JSONB NOT NULL,
  results JSONB DEFAULT '[]'::jsonb,
  metrics JSONB DEFAULT '{}'::jsonb,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_jobs_status ON discovery_jobs(status) WHERE status IN ('pending', 'processing');
CREATE INDEX idx_jobs_user ON discovery_jobs(user_id);
CREATE INDEX idx_jobs_session ON discovery_jobs(session_user_id);
CREATE INDEX idx_jobs_campaign ON discovery_jobs(campaign_id);
CREATE INDEX idx_jobs_created ON discovery_jobs(created_at DESC);

ALTER TABLE discovery_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY jobs_select_own ON discovery_jobs
  FOR SELECT USING (auth.uid() = user_id OR (auth.uid() IS NULL AND session_user_id IS NOT NULL));

CREATE POLICY jobs_insert_own ON discovery_jobs
  FOR INSERT WITH CHECK (auth.uid() = user_id OR (auth.uid() IS NULL AND session_user_id IS NOT NULL));

CREATE OR REPLACE FUNCTION update_discovery_jobs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_discovery_jobs_updated_at
  BEFORE UPDATE ON discovery_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_discovery_jobs_updated_at();
```

3. Click "RUN"
4. Re-run test: `./scripts/test-background-tasks.sh`

**Alternative**: Copy/paste from `/database/fix-foreign-key-constraint.sql`

- [ ] Fixed

---

### Issue: Job Stays in "Pending"

**What you see**: Job never progresses past "pending" status

**Fix**:

1. Check Edge Function logs:
   - Supabase Dashboard → Edge Functions → business-discovery-background → Logs
2. Look for error messages
3. Usually API key issue - verify these are set:
   - Edge Functions → business-discovery-background → Settings → Secrets
   - Should see: GOOGLE_PLACES_API_KEY, HUNTER_IO_API_KEY, NEVERBOUNCE_API_KEY

- [ ] Fixed

---

### Issue: No Leads in Database

**What you see**: Campaign completes but leads table is empty

**Fix**:

1. Check RLS policies:
   ```sql
   -- Run in SQL Editor:
   SELECT * FROM campaigns WHERE id = 'your_campaign_id';
   SELECT * FROM leads WHERE campaign_id = 'your_campaign_id';
   ```
2. If returns empty, run `/database/rls-setup.sql` again

- [ ] Fixed

---

### Issue: Real-time Updates Not Working

**What you see**: Progress page shows "Loading..." forever

**Fix**:

1. Enable Supabase Real-time:
   - Dashboard → Database → Replication
   - Find `discovery_jobs` table
   - Toggle "Enable" if disabled
2. Check browser console for errors (F12 → Console tab)

- [ ] Fixed

---

### Issue: Test Script Fails

**What you see**: Test script exits with error

**Fix**:

1. Check if `NEXT_PUBLIC_SUPABASE_ANON_KEY` (or `VITE_SUPABASE_ANON_KEY`) is set:
   ```bash
   echo $NEXT_PUBLIC_SUPABASE_ANON_KEY
   ```
   Should print your key. If empty, set it again.
2. Check if function is deployed:
   ```bash
   supabase functions list
   ```
   Should show `business-discovery-background`. If not, deploy again.

- [ ] Fixed

---

## 📞 Getting Help

### Debugging Commands

**Check Edge Function logs**:

```bash
# View recent logs
supabase functions logs business-discovery-background
```

**Check database directly**:

```sql
-- In Supabase SQL Editor:
SELECT * FROM discovery_jobs ORDER BY created_at DESC LIMIT 5;
SELECT * FROM campaigns ORDER BY created_at DESC LIMIT 5;
SELECT * FROM leads ORDER BY created_at DESC LIMIT 10;
```

**Test Edge Function directly**:

```bash
curl -X POST 'https://sriycekxdqnesdsgwiuc.supabase.co/functions/v1/business-discovery-background' \
  -H "Authorization: Bearer $NEXT_PUBLIC_SUPABASE_ANON_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"businessType": "coffee shop", "location": "Seattle", "maxResults": 2, "sessionUserId": "test"}'
```

### Documentation to Check

- [ ] `/QUICKSTART_BACKGROUND_TASKS.md` - Detailed guide
- [ ] `/BACKGROUND_TASKS_IMPLEMENTATION.md` - Technical details
- [ ] `/VISUAL_SUMMARY_BACKGROUND_TASKS.md` - Diagrams and flow
- [ ] Supabase Edge Function logs
- [ ] Browser console (F12)

---

## 🎉 Success Criteria

**You know you're done when**:

### Basic Functionality

- [ ] Test campaign creates job record
- [ ] Job progresses through all stages
- [ ] Campaign completes with >0 leads
- [ ] Data appears in database correctly
- [ ] No errors in Edge Function logs

### User Experience

- [ ] Frontend redirects to progress page
- [ ] Progress bar updates automatically
- [ ] Stage labels change appropriately
- [ ] Metrics display during processing
- [ ] Completion message appears
- [ ] Results page shows accurate data

### Production Ready

- [ ] Deployed to Vercel
- [ ] Real users can submit campaigns
- [ ] Campaigns complete in 1-2 minutes
- [ ] No timeout errors
- [ ] Dashboard shows accurate data

**All checked?** 🎉 **CONGRATULATIONS! You're production ready!**

---

## 📊 Metrics to Monitor

After deployment, track these:

### Daily (First Week)

- [ ] Number of campaigns submitted
- [ ] Number of campaigns completed successfully
- [ ] Average completion time
- [ ] Number of leads generated
- [ ] Total cost per campaign

### Weekly

- [ ] Success rate (completed / total)
- [ ] Average leads per campaign
- [ ] Cost per lead
- [ ] User feedback on progress page

### Monthly

- [ ] Total campaigns processed
- [ ] Infrastructure costs (should be $0)
- [ ] Edge Function usage (vs free tier limit)
- [ ] Database storage usage

---

## 🚀 Next Steps After Deployment

### Immediate (This Week)

- [ ] Monitor first 10 real campaigns
- [ ] Collect user feedback on progress page
- [ ] Document any issues encountered
- [ ] Optimize progress update frequency if needed

### Short-term (This Month)

- [ ] Add error recovery (retry failed jobs)
- [ ] Implement email notifications for completed campaigns
- [ ] Create admin dashboard for monitoring all jobs
- [ ] Add campaign history page

### Long-term (Next Quarter)

- [ ] Integrate Stripe for paid tiers
- [ ] Add advanced filters (industry, revenue size)
- [ ] Implement bulk campaign creation
- [ ] Add team collaboration features

---

## 📚 Resources

### Documentation

- **Quick Start**: `/QUICKSTART_BACKGROUND_TASKS.md`
- **Full Implementation**: `/BACKGROUND_TASKS_IMPLEMENTATION.md`
- **Architecture Decision**: `/ARCHITECTURE_DECISION_BACKGROUND_TASKS.md`
- **Visual Summary**: `/VISUAL_SUMMARY_BACKGROUND_TASKS.md`

### Scripts

- **Deploy Script**: `/scripts/deploy-background-tasks.sh`
- **Test Script**: `/scripts/test-background-tasks.sh`

### Code

- **Database Schema**: `/database/job-queue-schema.sql`
- **Edge Function**: `/supabase/functions/business-discovery-background/index.ts`
- **React Hook**: `/src/hooks/useJobProgress.tsx`

### External

- **Supabase Docs**: https://supabase.com/docs/guides/functions/background-tasks
- **Edge Runtime**: https://supabase.com/docs/guides/functions/architecture
- **Real-time**: https://supabase.com/docs/guides/realtime

---

## ✅ Completion Certificate

**I, Alex, have successfully:**

- [ ] Deployed job queue database schema
- [ ] Deployed background task Edge Function
- [ ] Tested backend with real campaigns
- [ ] Integrated frontend with progress page
- [ ] Deployed to production on Vercel
- [ ] Verified real-time updates working
- [ ] Confirmed accurate lead data
- [ ] Achieved zero timeout errors

**Date completed**: **\*\***\_\_\_\_**\*\***

**First successful campaign ID**: **\*\***\_\_\_\_**\*\***

**Number of leads generated**: **\*\***\_\_\_\_**\*\***

---

**🎉 YOU DID IT! Your app now handles long-running campaigns perfectly!** 🚀

**No timeouts. Real-time progress. Accurate data. $0 cost.**

**Ready for users. Ready for growth. Ready for success.** 💪
