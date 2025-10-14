-- ProspectPro Hotfix Migration: Ledger indexes + Enhanced API usage table
-- Generated: 2025-10-14
BEGIN;
-- ---------------------------------------------------------------------------
-- Lead fingerprint ledger conflict targets
-- ---------------------------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS idx_lead_fingerprints_conflict_user ON public.lead_fingerprints (fingerprint, user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_lead_fingerprints_conflict_session ON public.lead_fingerprints (fingerprint, session_user_id);
-- ---------------------------------------------------------------------------
-- Enhanced API usage telemetry table (service role only)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.enhanced_api_usage (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    campaign_id UUID,
    session_id TEXT,
    request_id UUID NOT NULL,
    source_name TEXT NOT NULL,
    endpoint TEXT,
    http_method TEXT DEFAULT 'GET',
    request_params JSONB,
    query_type TEXT,
    business_query TEXT,
    location_query TEXT,
    response_code INTEGER,
    response_time_ms INTEGER,
    results_returned INTEGER,
    success BOOLEAN,
    error_message TEXT,
    estimated_cost NUMERIC(12, 4),
    actual_cost NUMERIC(12, 4),
    cost_currency TEXT DEFAULT 'USD',
    billing_category TEXT,
    data_quality_score NUMERIC(6, 2),
    useful_results INTEGER,
    cache_hit BOOLEAN DEFAULT FALSE,
    rate_limited BOOLEAN DEFAULT FALSE,
    retry_count INTEGER DEFAULT 0
);
ALTER TABLE public.enhanced_api_usage
ALTER COLUMN http_method
SET DEFAULT 'GET';
ALTER TABLE public.enhanced_api_usage
ALTER COLUMN cost_currency
SET DEFAULT 'USD';
ALTER TABLE public.enhanced_api_usage
ALTER COLUMN cache_hit
SET DEFAULT FALSE;
ALTER TABLE public.enhanced_api_usage
ALTER COLUMN rate_limited
SET DEFAULT FALSE;
ALTER TABLE public.enhanced_api_usage
ALTER COLUMN retry_count
SET DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_enhanced_api_usage_created_at ON public.enhanced_api_usage (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_enhanced_api_usage_campaign_id ON public.enhanced_api_usage (campaign_id);
CREATE INDEX IF NOT EXISTS idx_enhanced_api_usage_source_name ON public.enhanced_api_usage (source_name);
CREATE INDEX IF NOT EXISTS idx_enhanced_api_usage_success ON public.enhanced_api_usage (success);
ALTER TABLE public.enhanced_api_usage ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS service_role_enhanced_api_usage_access ON public.enhanced_api_usage;
CREATE POLICY service_role_enhanced_api_usage_access ON public.enhanced_api_usage FOR ALL TO PUBLIC USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
COMMIT;