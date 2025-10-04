# 🚨 QUICK FIX: Foreign Key Constraint Error

## The Error You're Seeing

```json
{
  "success": false,
  "error": "Failed to create job: insert or update on table \"discovery_jobs\" violates foreign key constraint \"discovery_jobs_campaign_id_fkey\""
}
```

## What Happened

The original database schema had a foreign key constraint:

```sql
campaign_id TEXT REFERENCES campaigns(id) ON DELETE CASCADE
```

This creates a problem because:

1. Edge Function tries to create job record first
2. Job record references campaign_id
3. But campaign doesn't exist yet
4. Foreign key constraint blocks the insert
5. Error!

## The Fix (2 Minutes)

### Option 1: Run Migration Script (EASIEST)

1. **Open Supabase Dashboard** → SQL Editor
2. **Copy this entire script** from `/database/fix-foreign-key-constraint.sql` or paste below:

```sql
-- Drop and recreate table without foreign key constraint
DROP TABLE IF EXISTS discovery_jobs CASCADE;

CREATE TABLE discovery_jobs (
  id TEXT PRIMARY KEY,
  campaign_id TEXT, -- No FK constraint - campaign created later
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

3. **Click "RUN"** button
4. **Wait for "Success"** message
5. **Re-run test**: `./scripts/test-background-tasks.sh`

### Option 2: Manual Fix (ADVANCED)

If you want to keep existing data:

```sql
-- Remove foreign key constraint only
ALTER TABLE discovery_jobs DROP CONSTRAINT IF EXISTS discovery_jobs_campaign_id_fkey;
```

Then re-run test.

## Verify Fix

After running the migration:

1. **Check table exists**:

   ```sql
   SELECT * FROM discovery_jobs LIMIT 1;
   ```

   Should return "no rows" (not an error)

2. **Re-run test script**:
   ```bash
   ./scripts/test-background-tasks.sh
   ```
   Should now succeed!

## Why This Happened

The original schema was designed with a foreign key for data integrity (good idea in theory), but the Edge Function creates the job BEFORE the campaign, so the foreign key blocks the insert.

**Solution**: Remove the foreign key constraint. The `campaign_id` is still stored and used, but there's no database-level enforcement. This is fine because:

- The Edge Function controls both insertions
- Campaign is created immediately after job
- No orphaned records in practice

## Updated Files

I've already fixed these files:

- ✅ `/database/job-queue-schema.sql` (updated)
- ✅ `/database/fix-foreign-key-constraint.sql` (new migration script)
- ✅ `DEPLOYMENT_CHECKLIST.md` (added troubleshooting)

## Next Steps

1. Run the migration SQL above
2. Re-run test: `./scripts/test-background-tasks.sh`
3. Should see: ✅ Test 1 PASSED, ✅ Test 2 PASSED, ✅ Test 3 PASSED
4. Continue with deployment checklist!

---

**Need help?** Check `DEPLOYMENT_CHECKLIST.md` → Troubleshooting → "Foreign Key Constraint Error"
