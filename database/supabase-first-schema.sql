-- Supabase-First Architecture Database Schema
-- Core tables for campaign and lead management

-- Campaigns table
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

-- Leads table
CREATE TABLE IF NOT EXISTS leads (
  id BIGSERIAL PRIMARY KEY,
  campaign_id TEXT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
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

-- Dashboard exports tracking
CREATE TABLE IF NOT EXISTS dashboard_exports (
  id BIGSERIAL PRIMARY KEY,
  campaign_id TEXT REFERENCES campaigns(id) ON DELETE CASCADE,
  export_type TEXT DEFAULT 'lead_export',
  file_format TEXT DEFAULT 'csv',
  row_count INTEGER DEFAULT 0,
  export_status TEXT DEFAULT 'completed',
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_campaigns_created_at ON campaigns(created_at);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_leads_campaign_id ON leads(campaign_id);
CREATE INDEX IF NOT EXISTS idx_leads_confidence_score ON leads(confidence_score);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_exports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for public access (since we're not using auth yet)
-- In production, these would be more restrictive
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

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_campaigns_updated_at 
  BEFORE UPDATE ON campaigns 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_leads_updated_at 
  BEFORE UPDATE ON leads 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Analytics view for campaign performance
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

-- Grant permissions for Edge Functions to access these tables
-- Note: In production, you'd use more specific service role permissions
GRANT ALL ON campaigns TO postgres, anon, authenticated, service_role;
GRANT ALL ON leads TO postgres, anon, authenticated, service_role;
GRANT ALL ON dashboard_exports TO postgres, anon, authenticated, service_role;
GRANT SELECT ON campaign_analytics TO postgres, anon, authenticated, service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;