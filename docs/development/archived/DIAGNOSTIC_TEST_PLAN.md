# ProspectPro Zero Results Diagnostic Test Plan

**Status**: Comprehensive debug logging deployed  
**Frontend URL**: https://dist-agukzwo1d-appsmithery.vercel.app  
**Deployment Time**: Just deployed with enhanced diagnostics  
**Goal**: Identify exactly where the data pipeline is failing

---

## 🎯 Testing Procedure

### Step 1: Run a New Campaign

1. **Open Frontend**: https://dist-agukzwo1d-appsmithery.vercel.app
2. **Open Browser DevTools**: Press F12 → Console tab
3. **Clear Console**: Click the 🚫 icon to clear old logs
4. **Launch Campaign**:
   - Business Type: `coffee shop` (known to have results)
   - Location: `Seattle, WA`
   - Max Results: `3`
   - Tier: Any (PROFESSIONAL recommended)
5. **Watch Job Progress**: Let it complete
6. **Note Campaign ID**: Will appear in console logs

### Step 2: Gather Console Logs (CRITICAL)

**During Campaign Progress Page:**

- Look for `[CampaignProgress]` logs showing job updates
- Note the `jobId` value
- Watch for completion or error messages

**On Results Page Redirect:**

- Look for `[useCampaignResults]` logs showing:
  - Campaign query result
  - Leads query result
  - Transform attempts
  - Final return values
- Look for `[Results]` logs showing:
  - useCampaignResults output
  - setCampaignLeads attempts
  - Any errors

**Copy ALL console logs** and save to a file

### Step 3: Gather Network Responses

**In DevTools Network Tab:**

1. **Filter to `campaigns`**:

   - Find GET request to `/rest/v1/campaigns?id=eq.CAMPAIGN_ID`
   - Click on it → Response tab
   - Copy the JSON response

2. **Filter to `leads`**:

   - Find GET request to `/rest/v1/leads?campaign_id=eq.CAMPAIGN_ID`
   - Click on it → Response tab
   - Copy the JSON response
   - Note the `count` header value

3. **Filter to `discovery_jobs`**:
   - Find any requests to `/rest/v1/discovery_jobs`
   - Copy responses showing job status/metrics

### Step 4: Run Database Diagnostics

**In Supabase Dashboard → SQL Editor:**

```sql
-- Get latest campaign and job details
WITH latest_campaign AS (
  SELECT id, business_type, location, status, results_count,
         total_cost, user_id, created_at
  FROM campaigns
  WHERE user_id = auth.uid()
  ORDER BY created_at DESC
  LIMIT 1
)
SELECT
  c.*,
  dj.id as job_id,
  dj.status as job_status,
  dj.stage as job_stage,
  dj.metrics as job_metrics,
  dj.error as job_error,
  (SELECT COUNT(*) FROM leads WHERE campaign_id = c.id) as actual_lead_count,
  (SELECT COUNT(*) FROM lead_fingerprints WHERE user_id = c.user_id) as user_fingerprint_count
FROM latest_campaign c
LEFT JOIN discovery_jobs dj ON dj.campaign_id = c.id;
```

**Copy the entire result** (should show 1 row with comprehensive data)

### Step 5: Check Leads Table Directly

```sql
-- Get actual leads for the campaign
SELECT
  id,
  campaign_id,
  business_name,
  phone,
  website,
  email,
  confidence_score,
  enrichment_data->>'data_source' as data_source,
  user_id,
  created_at
FROM leads
WHERE campaign_id = (
  SELECT id FROM campaigns
  WHERE user_id = auth.uid()
  ORDER BY created_at DESC
  LIMIT 1
)
LIMIT 10;
```

**Copy all returned rows** (or note if 0 rows)

---

## 🔍 What the Logs Will Tell Us

### Scenario 1: No businesses discovered (API failure)

**Console logs will show:**

```
[useCampaignResults] Campaign query result: { results_count: 0 }
[useCampaignResults] Leads query result: { leadsCount: 0, totalCount: 0 }
```

**Database will show:**

```
job_metrics: { businesses_found: 0, ... }
```

**Root cause**: Google Places/Foursquare API not returning data

### Scenario 2: Businesses found but filtered out

**Console logs will show:**

```
[useCampaignResults] Campaign query result: { results_count: 0 }
```

**Database will show:**

```
job_metrics: { businesses_found: 15, qualified_leads: 0 }
```

**Root cause**: Fingerprint filter too aggressive or scoring rejecting all

### Scenario 3: Leads created but query not returning them

**Database will show:**

```
results_count: 3
actual_lead_count: 3
```

**Console logs will show:**

```
[useCampaignResults] Leads query result: { leadsCount: 0, totalCount: 0 }
```

**Root cause**: RLS policies or user_id mismatch blocking query

### Scenario 4: Data returned but transform failing

**Console logs will show:**

```
[useCampaignResults] Leads query result: { leadsCount: 3, ... }
[useCampaignResults] Transform error: [ERROR MESSAGE]
```

**Root cause**: Data shape mismatch in transformCampaignData

### Scenario 5: Transform succeeds but store rejects

**Console logs will show:**

```
[useCampaignResults] Transform SUCCESS: { leadsLength: 3 }
[Results] setCampaignLeads FAILED: [ERROR MESSAGE]
```

**Root cause**: Zustand store validation or state mutation issue

---

## 📋 Checklist for Alex

Before reporting back, gather ALL of these:

- [ ] **Campaign ID** from console logs
- [ ] **Job ID** from console logs or database
- [ ] **Complete console log dump** (all [useCampaignResults] and [Results] logs)
- [ ] **Network tab responses** (campaigns, leads, discovery_jobs)
- [ ] **SQL query #1 result** (campaign + job details)
- [ ] **SQL query #2 result** (actual leads in database)
- [ ] **Browser info** (Chrome/Firefox version)
- [ ] **Auth status** (logged in as authenticated user or anonymous?)

---

## 🚨 Common Issues to Check First

1. **Browser Extensions**: Disable ad blockers, Rokt, etc.
2. **Cache**: Hard refresh (Ctrl+Shift+R) after deployment
3. **Auth**: Make sure you're logged in (check top-right corner)
4. **Previous Campaigns**: Check if this is the FIRST campaign or subsequent
5. **Fingerprint Table**: Check how many fingerprints exist for your user

---

## 📤 How to Share Results

**Create a GitHub Gist or paste.txt with:**

```
=== CAMPAIGN INFO ===
Campaign ID: [from console]
Job ID: [from console]
Auth Status: [authenticated/anonymous]
Browser: [Chrome 131 / Firefox 134 / etc]

=== CONSOLE LOGS ===
[paste entire console output here]

=== NETWORK RESPONSES ===

--- GET /rest/v1/campaigns ---
[paste JSON response]

--- GET /rest/v1/leads ---
[paste JSON response]
Count header: [number]

=== DATABASE QUERIES ===

--- Query 1: Campaign + Job Details ---
[paste SQL result]

--- Query 2: Actual Leads ---
[paste SQL result or "0 rows"]

=== OBSERVATIONS ===
[any patterns you noticed]
```

---

## 🎯 Next Steps After Data Collection

Once we have this data, we can:

1. **Pinpoint exact failure stage** (discovery, scoring, insert, query, transform, store)
2. **Identify root cause** (API, logic, permissions, data shape)
3. **Implement targeted fix** (no more blind debugging)
4. **Validate fix works** (with confidence based on evidence)

This diagnostic deployment gives us **complete visibility** into every step of the pipeline. The logs will definitively show where data stops flowing.
