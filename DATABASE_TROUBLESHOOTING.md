# 🚨 ProspectPro Database Implementation Troubleshooting Guide

## Common Errors & Solutions

### 1. "relation does not exist" or "table does not exist"

**Error:** `relation "system_settings" does not exist`

**Solution:**

```bash
# Run the main schema first in Supabase SQL editor
# Copy/paste entire content from: database/enhanced-supabase-schema.sql
```

### 2. "column does not exist"

**Error:** `column "user_id" of relation "system_settings" does not exist`

**Solution:** The table structure is inconsistent. Drop and recreate:

```sql
-- In Supabase SQL editor:
DROP TABLE IF EXISTS system_settings CASCADE;

-- Then re-run the enhanced-supabase-schema.sql
```

### 3. "permission denied" or "insufficient privileges"

**Error:** `permission denied for table system_settings`

**Solution:**

```sql
-- Run the RLS hardening script in Supabase SQL editor:
-- Copy/paste entire content from: database/rls-security-hardening.sql
```

### 4. "policy already exists"

**Error:** `policy "system_settings_all_operations" already exists`

**Solution:**

```sql
-- Drop existing policies first:
DROP POLICY IF EXISTS "system_settings_all_operations" ON system_settings;
DROP POLICY IF EXISTS "Users can manage their own system settings" ON system_settings;

-- Then re-run the RLS script
```

### 5. "constraint violation" or "duplicate key"

**Error:** `duplicate key value violates unique constraint`

**Solution:**

```sql
-- Check for duplicate entries:
SELECT setting_key, user_id, COUNT(*)
FROM system_settings
GROUP BY setting_key, user_id
HAVING COUNT(*) > 1;

-- Remove duplicates manually or truncate table
```

### 6. Railway Environment Variable Issues

**Error:** `SUPABASE_URL is not defined` or connection fails

**Solution:** Check Railway dashboard variables:

- `SUPABASE_URL=https://your-project.supabase.co`
- `SUPABASE_SECRET_KEY=sb_secret_your_key_here`
- `GOOGLE_PLACES_API_KEY=your_google_key`

### 7. "function gen_random_uuid() does not exist"

**Error:** UUID generation fails

**Solution:** Enable extensions first:

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### 8. PostGIS Extension Issues

**Error:** `type "point" does not exist`

**Solution:**

```sql
CREATE EXTENSION IF NOT EXISTS "postgis";
```

## 🔧 Step-by-Step Recovery Process

### If Everything is Broken:

1. **Reset Database (CAUTION - DELETES ALL DATA):**

```sql
-- Drop all ProspectPro tables
DROP TABLE IF EXISTS dashboard_exports CASCADE;
DROP TABLE IF EXISTS system_settings CASCADE;
DROP TABLE IF EXISTS service_health_metrics CASCADE;
DROP TABLE IF EXISTS lead_qualification_metrics CASCADE;
DROP TABLE IF EXISTS api_cost_tracking CASCADE;
DROP TABLE IF EXISTS campaign_analytics CASCADE;
DROP TABLE IF EXISTS api_usage_log CASCADE;
DROP TABLE IF EXISTS lead_social_profiles CASCADE;
DROP TABLE IF EXISTS lead_emails CASCADE;
DROP TABLE IF EXISTS enhanced_leads CASCADE;
DROP TABLE IF EXISTS campaigns CASCADE;

-- Drop materialized view
DROP MATERIALIZED VIEW IF EXISTS lead_analytics_summary;
```

2. **Re-run Schema:**

```sql
-- Copy/paste ENTIRE content from: database/enhanced-supabase-schema.sql
```

3. **Apply Security:**

```sql
-- Copy/paste ENTIRE content from: database/rls-security-hardening.sql
```

### If Only system_settings is Broken:

1. **Fix system_settings table:**

```sql
-- Drop and recreate with correct structure
DROP TABLE IF EXISTS system_settings CASCADE;

CREATE TABLE system_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  setting_key VARCHAR(255) NOT NULL,
  setting_value JSONB NOT NULL,
  data_type TEXT DEFAULT 'string' CHECK (data_type IN ('string', 'number', 'boolean', 'object', 'array')),
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),

  CONSTRAINT system_settings_setting_key_user_unique UNIQUE (setting_key, user_id)
);

-- Enable RLS
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "system_settings_all_operations" ON system_settings
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Create indexes
CREATE INDEX idx_system_settings_user_id ON system_settings(user_id);
CREATE INDEX idx_system_settings_user_setting ON system_settings(user_id, setting_key);
```

## 📋 Verification Checklist

After running scripts, verify everything works:

```sql
-- 1. Check all tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- 2. Verify system_settings structure
\\d system_settings

-- 3. Check RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename = 'system_settings';

-- 4. Verify policies exist
SELECT policyname FROM pg_policies
WHERE tablename = 'system_settings';

-- 5. Test basic insert
INSERT INTO system_settings (user_id, setting_key, setting_value, data_type)
VALUES ('00000000-0000-0000-0000-000000000000', 'test_key', '{"value": "test"}', 'object');
```

## 🆘 Emergency Contact

If you're still having issues, provide these details:

1. **Exact error message** (copy/paste)
2. **Which step failed** (schema creation, RLS application, etc.)
3. **Your Supabase project details** (region, plan)
4. **Browser/environment** (Chrome, Firefox, etc.)

The most common issue is running the scripts out of order. Always run:

1. `enhanced-supabase-schema.sql` FIRST
2. `rls-security-hardening.sql` SECOND
