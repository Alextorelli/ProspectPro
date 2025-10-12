-- Deterministic dedupe infrastructure for background discovery (2025-10-10)
-- Adds request snapshot storage + lead fingerprint ledger so the database
-- enforces "new results only" independently of the client.

BEGIN;

-- ============================================================================
-- Lead fingerprint ledger (per-user)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.lead_fingerprints (
  id BIGSERIAL PRIMARY KEY,
  fingerprint TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_user_id TEXT,
  campaign_id TEXT REFERENCES public.campaigns(id) ON DELETE CASCADE,
  lead_id BIGINT REFERENCES public.leads(id) ON DELETE CASCADE,
  business_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_lead_fingerprints_user_unique
  ON public.lead_fingerprints (fingerprint, user_id)
  WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_lead_fingerprints_session_unique
  ON public.lead_fingerprints (fingerprint, session_user_id)
  WHERE session_user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_lead_fingerprints_campaign
  ON public.lead_fingerprints (campaign_id);

CREATE INDEX IF NOT EXISTS idx_lead_fingerprints_created
  ON public.lead_fingerprints (created_at DESC);

ALTER TABLE public.lead_fingerprints ENABLE ROW LEVEL SECURITY;

CREATE POLICY lead_fingerprints_select_self
  ON public.lead_fingerprints
  FOR SELECT
  USING (user_id = (SELECT auth.uid()));

-- ============================================================================
-- Campaign request snapshots (immutable audit of queued work)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.campaign_request_snapshots (
  id BIGSERIAL PRIMARY KEY,
  campaign_id TEXT REFERENCES public.campaigns(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_user_id TEXT,
  request_hash TEXT NOT NULL,
  request_payload JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_campaign_request_hash_unique
  ON public.campaign_request_snapshots (request_hash, user_id)
  WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_campaign_request_snapshots_campaign
  ON public.campaign_request_snapshots (campaign_id);

ALTER TABLE public.campaign_request_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY campaign_request_snapshots_select_self
  ON public.campaign_request_snapshots
  FOR SELECT
  USING (user_id = (SELECT auth.uid()));

COMMIT;
