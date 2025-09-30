-- Complete RLS Setup for Public Access
-- This enables the anon role to work with Edge Functions

-- First, disable RLS temporarily to clear any existing issues
ALTER TABLE campaigns DISABLE ROW LEVEL SECURITY;
ALTER TABLE leads DISABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_exports DISABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DROP POLICY IF EXISTS "Public read campaigns" ON campaigns;
DROP POLICY IF EXISTS "Public insert campaigns" ON campaigns;
DROP POLICY IF EXISTS "Public update campaigns" ON campaigns;
DROP POLICY IF EXISTS "Public read leads" ON leads;
DROP POLICY IF EXISTS "Public insert leads" ON leads;
DROP POLICY IF EXISTS "Public update leads" ON leads;
DROP POLICY IF EXISTS "Public read exports" ON dashboard_exports;
DROP POLICY IF EXISTS "Public insert exports" ON dashboard_exports;

-- Re-enable RLS
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_exports ENABLE ROW LEVEL SECURITY;

-- Create comprehensive public policies
CREATE POLICY "Enable all for anon users" ON campaigns
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Enable all for anon users" ON leads
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Enable all for anon users" ON dashboard_exports
  FOR ALL USING (true) WITH CHECK (true);

-- Grant comprehensive permissions
GRANT ALL ON campaigns TO anon, authenticated, service_role;
GRANT ALL ON leads TO anon, authenticated, service_role;
GRANT ALL ON dashboard_exports TO anon, authenticated, service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- Test the permissions
INSERT INTO campaigns (id, business_type, location) 
VALUES ('test-campaign-' || extract(epoch from now()), 'test', 'test location')
ON CONFLICT (id) DO NOTHING;

-- Verify setup
SELECT 
  'RLS enabled and policies created' as status,
  count(*) as test_campaigns
FROM campaigns 
WHERE business_type = 'test';