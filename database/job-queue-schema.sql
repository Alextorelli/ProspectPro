-- Job Queue System for Background Processing
-- ProspectPro v4.2 - Background Task Architecture

-- Discovery jobs table (tracks long-running campaigns)
CREATE TABLE IF NOT EXISTS discovery_jobs (
  id TEXT PRIMARY KEY,
  campaign_id TEXT, -- No foreign key constraint (campaign created later)
  user_id UUID REFERENCES auth.users(id),
  session_user_id TEXT,
  
  -- Job status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  current_stage TEXT DEFAULT 'initializing',
  
  -- Configuration
  config JSONB NOT NULL,
  
  -- Results
  results JSONB DEFAULT '[]'::jsonb,
  metrics JSONB DEFAULT '{}'::jsonb,
  error TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_jobs_status ON discovery_jobs(status) WHERE status IN ('pending', 'processing');
CREATE INDEX IF NOT EXISTS idx_jobs_user ON discovery_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_jobs_session ON discovery_jobs(session_user_id);
CREATE INDEX IF NOT EXISTS idx_jobs_campaign ON discovery_jobs(campaign_id);
CREATE INDEX IF NOT EXISTS idx_jobs_created ON discovery_jobs(created_at DESC);

-- RLS Policies for user isolation
ALTER TABLE discovery_jobs ENABLE ROW LEVEL SECURITY;

-- Users can only see their own jobs
DROP POLICY IF EXISTS jobs_select_own ON discovery_jobs;
CREATE POLICY jobs_select_own ON discovery_jobs
  FOR SELECT
  USING (
    user_id = (SELECT auth.uid()) OR
    (auth.uid() IS NULL AND session_user_id IS NOT NULL)
  );

-- Users can only insert their own jobs
DROP POLICY IF EXISTS jobs_insert_own ON discovery_jobs;
CREATE POLICY jobs_insert_own ON discovery_jobs
  FOR INSERT
  WITH CHECK (
    user_id = (SELECT auth.uid()) OR
    (auth.uid() IS NULL AND session_user_id IS NOT NULL)
  );

-- Update trigger to maintain updated_at
DROP TRIGGER IF EXISTS trigger_update_discovery_jobs_updated_at ON discovery_jobs;
CREATE OR REPLACE FUNCTION update_discovery_jobs_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_discovery_jobs_updated_at
  BEFORE UPDATE ON discovery_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_discovery_jobs_updated_at();

-- Function to clean up old completed jobs (optional, run periodically)
CREATE OR REPLACE FUNCTION cleanup_old_jobs(retention_days INTEGER DEFAULT 30)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM discovery_jobs
  WHERE status IN ('completed', 'failed')
    AND completed_at < NOW() - (retention_days || ' days')::INTERVAL;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

COMMENT ON TABLE discovery_jobs IS 'Background job queue for business discovery campaigns';
COMMENT ON COLUMN discovery_jobs.config IS 'JSON config: {businessType, location, tier, maxResults, etc}';
COMMENT ON COLUMN discovery_jobs.results IS 'JSON array of discovered and enriched leads';
COMMENT ON COLUMN discovery_jobs.metrics IS 'JSON metrics: {totalCost, processingTime, apisUsed, etc}';
