-- Safe Database Setup for Existing Supabase Project
-- This script handles existing objects gracefully

-- Drop existing policies first (only if tables exist)
DO $$
BEGIN
  -- Drop campaigns policies if table exists
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'campaigns') THEN
    DROP POLICY IF EXISTS "Public read campaigns" ON campaigns;
    DROP POLICY IF EXISTS "Public insert campaigns" ON campaigns;
    DROP POLICY IF EXISTS "Public update campaigns" ON campaigns;
  END IF;

  -- Drop leads policies if table exists
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'leads') THEN
    DROP POLICY IF EXISTS "Public read leads" ON leads;
    DROP POLICY IF EXISTS "Public insert leads" ON leads;
    DROP POLICY IF EXISTS "Public update leads" ON leads;
  END IF;

  -- Drop dashboard_exports policies if table exists
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'dashboard_exports') THEN
    DROP POLICY IF EXISTS "Public read exports" ON dashboard_exports;
    DROP POLICY IF EXISTS "Public insert exports" ON dashboard_exports;
  END IF;
END $$;

-- Campaigns table (safe creation)
CREATE TABLE IF NOT EXISTS campaigns (
  id TEXT PRIMARY KEY,
  business_type TEXT NOT NULL,
  location TEXT NOT NULL,
  target_count INTEGER DEFAULT 10,
  budget_limit DECIMAL(10,4) DEFAULT 50.0,
  min_confidence_score INTEGER DEFAULT 50,
  status TEXT DEFAULT 'pending',
  results_count INTEGER DEFAULT 0,
  total_cost DECIMAL(10,4) DEFAULT 0,
  processing_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Leads table (safe creation)
CREATE TABLE IF NOT EXISTS leads (
  id BIGSERIAL PRIMARY KEY,
  campaign_id TEXT NOT NULL,
  business_name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  website TEXT,
  email TEXT,
  confidence_score INTEGER DEFAULT 0,
  score_breakdown JSONB,
  validation_cost DECIMAL(10,4) DEFAULT 0,
  cost_efficient BOOLEAN DEFAULT true,
  scoring_recommendation TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'leads_campaign_id_fkey'
  ) THEN
    ALTER TABLE leads ADD CONSTRAINT leads_campaign_id_fkey 
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Dashboard exports tracking (safe creation)
CREATE TABLE IF NOT EXISTS dashboard_exports (
  id BIGSERIAL PRIMARY KEY,
  campaign_id TEXT,
  export_type TEXT DEFAULT 'lead_export',
  file_format TEXT DEFAULT 'csv',
  row_count INTEGER DEFAULT 0,
  export_status TEXT DEFAULT 'completed',
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key constraint for dashboard_exports if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'dashboard_exports_campaign_id_fkey'
  ) THEN
    ALTER TABLE dashboard_exports ADD CONSTRAINT dashboard_exports_campaign_id_fkey 
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create indexes (safe creation)
CREATE INDEX IF NOT EXISTS idx_campaigns_created_at ON campaigns(created_at);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_leads_campaign_id ON leads(campaign_id);
CREATE INDEX IF NOT EXISTS idx_leads_confidence_score ON leads(confidence_score);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);

-- Enable Row Level Security (safe - only if tables exist)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'campaigns') THEN
    ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'leads') THEN
    ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'dashboard_exports') THEN
    ALTER TABLE dashboard_exports ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Create fresh RLS Policies for public access
CREATE POLICY "Public read campaigns" ON campaigns 
  FOR SELECT USING (true);

CREATE POLICY "Public insert campaigns" ON campaigns 
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Public update campaigns" ON campaigns 
  FOR UPDATE USING (true);

CREATE POLICY "Public read leads" ON leads 
  FOR SELECT USING (true);

CREATE POLICY "Public insert leads" ON leads 
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Public update leads" ON leads 
  FOR UPDATE USING (true);

CREATE POLICY "Public read exports" ON dashboard_exports 
  FOR SELECT USING (true);

CREATE POLICY "Public insert exports" ON dashboard_exports 
  FOR INSERT WITH CHECK (true);

-- Create or replace the timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_campaigns_updated_at ON campaigns;
DROP TRIGGER IF EXISTS update_leads_updated_at ON leads;

-- Create triggers
CREATE TRIGGER update_campaigns_updated_at 
  BEFORE UPDATE ON campaigns 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_leads_updated_at 
  BEFORE UPDATE ON leads 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Create or replace analytics view
CREATE OR REPLACE VIEW campaign_analytics AS
SELECT 
  c.id,
  c.business_type,
  c.location,
  c.target_count,
  c.budget_limit,
  c.total_cost,
  c.results_count,
  c.processing_time_ms,
  COUNT(l.id) as actual_leads,
  AVG(l.confidence_score) as avg_confidence,
  SUM(l.validation_cost) as total_validation_cost,
  COUNT(CASE WHEN l.cost_efficient = true THEN 1 END) as cost_efficient_leads,
  c.created_at
FROM campaigns c
LEFT JOIN leads l ON c.id = l.campaign_id
GROUP BY c.id, c.business_type, c.location, c.target_count, c.budget_limit, 
         c.total_cost, c.results_count, c.processing_time_ms, c.created_at;

-- Grant permissions (safe)
GRANT ALL ON campaigns TO postgres, anon, authenticated, service_role;
GRANT ALL ON leads TO postgres, anon, authenticated, service_role;
GRANT ALL ON dashboard_exports TO postgres, anon, authenticated, service_role;
GRANT SELECT ON campaign_analytics TO postgres, anon, authenticated, service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- Verification query to confirm setup
SELECT 
  'campaigns' as table_name, 
  count(*) as row_count 
FROM campaigns
UNION ALL
SELECT 
  'leads' as table_name, 
  count(*) as row_count 
FROM leads
UNION ALL
SELECT 
  'dashboard_exports' as table_name, 
  count(*) as row_count 
FROM dashboard_exports;