-- Minimal Safe Database Setup
-- Core tables only - no policy conflicts

-- Create campaigns table
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

-- Create leads table
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

-- Create dashboard_exports table
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

-- Add foreign key constraints (safe)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'leads_campaign_id_fkey'
  ) THEN
    ALTER TABLE leads ADD CONSTRAINT leads_campaign_id_fkey 
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'dashboard_exports_campaign_id_fkey'
  ) THEN
    ALTER TABLE dashboard_exports ADD CONSTRAINT dashboard_exports_campaign_id_fkey 
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Grant basic permissions to anon and service_role
GRANT ALL ON campaigns TO anon, service_role;
GRANT ALL ON leads TO anon, service_role;
GRANT ALL ON dashboard_exports TO anon, service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, service_role;

-- Simple verification
SELECT 'Setup complete. Tables created:' as status;

SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_name IN ('campaigns', 'leads', 'dashboard_exports')
  AND table_schema = 'public';