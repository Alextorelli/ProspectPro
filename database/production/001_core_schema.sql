-- ProspectPro Production Schema - Core Tables & Policies
-- Provides campaigns, leads, exports, triggers, and analytics view

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================================
-- TABLE DEFINITIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.campaigns (
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
  campaign_hash TEXT,
  user_id UUID REFERENCES auth.users(id),
  session_user_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.leads (
  id BIGSERIAL PRIMARY KEY,
  campaign_id TEXT NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
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
  user_id UUID REFERENCES auth.users(id),
  session_user_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.dashboard_exports (
  id BIGSERIAL PRIMARY KEY,
  campaign_id TEXT REFERENCES public.campaigns(id) ON DELETE CASCADE,
  export_type TEXT DEFAULT 'lead_export',
  file_format TEXT DEFAULT 'csv',
  row_count INTEGER DEFAULT 0,
  export_status TEXT DEFAULT 'completed',
  user_id UUID REFERENCES auth.users(id),
  session_user_id TEXT,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_campaigns_created_at ON public.campaigns(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON public.campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_user_id ON public.campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_session_user_id ON public.campaigns(session_user_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_campaign_hash ON public.campaigns(campaign_hash) WHERE campaign_hash IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_leads_campaign_id ON public.leads(campaign_id);
CREATE INDEX IF NOT EXISTS idx_leads_user_id ON public.leads(user_id);
CREATE INDEX IF NOT EXISTS idx_leads_session_user_id ON public.leads(session_user_id);
CREATE INDEX IF NOT EXISTS idx_leads_confidence_score ON public.leads(confidence_score);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_dashboard_exports_user_id ON public.dashboard_exports(user_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_exports_campaign_id ON public.dashboard_exports(campaign_id);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_campaigns_updated_at ON public.campaigns;
CREATE TRIGGER trg_campaigns_updated_at
  BEFORE UPDATE ON public.campaigns
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_leads_updated_at ON public.leads;
CREATE TRIGGER trg_leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dashboard_exports ENABLE ROW LEVEL SECURITY;

-- Remove legacy permissive policies
DROP POLICY IF EXISTS "Public read campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Public insert campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Public update campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Public read leads" ON public.leads;
DROP POLICY IF EXISTS "Public insert leads" ON public.leads;
DROP POLICY IF EXISTS "Public update leads" ON public.leads;
DROP POLICY IF EXISTS "Public read exports" ON public.dashboard_exports;
DROP POLICY IF EXISTS "Public insert exports" ON public.dashboard_exports;
DROP POLICY IF EXISTS "Users can view their own campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Users can insert their own campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Users can update their own campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Users can view their own leads" ON public.leads;
DROP POLICY IF EXISTS "Users can insert their own leads" ON public.leads;
DROP POLICY IF EXISTS "Users can view their own exports" ON public.dashboard_exports;
DROP POLICY IF EXISTS "Users can insert their own exports" ON public.dashboard_exports;
DROP POLICY IF EXISTS "campaigns_user_access" ON public.campaigns;
DROP POLICY IF EXISTS "campaigns_anon_create" ON public.campaigns;
DROP POLICY IF EXISTS "campaigns_anon_access" ON public.campaigns;
DROP POLICY IF EXISTS "leads_user_access" ON public.leads;
DROP POLICY IF EXISTS "leads_anon_access" ON public.leads;
DROP POLICY IF EXISTS "exports_user_access" ON public.dashboard_exports;
DROP POLICY IF EXISTS "exports_anon_access" ON public.dashboard_exports;
DROP POLICY IF EXISTS "campaigns_anon_access" ON public.campaigns;
DROP POLICY IF EXISTS "campaigns_session_access" ON public.campaigns;
DROP POLICY IF EXISTS "campaigns_session_insert" ON public.campaigns;
DROP POLICY IF EXISTS "leads_session_access" ON public.leads;
DROP POLICY IF EXISTS "leads_session_insert" ON public.leads;
DROP POLICY IF EXISTS "dashboard_exports_session_access" ON public.dashboard_exports;
DROP POLICY IF EXISTS "dashboard_exports_session_insert" ON public.dashboard_exports;

-- Centralized session claim helper expression (inline)
CREATE POLICY "campaigns_authenticated_access" ON public.campaigns
  FOR SELECT TO authenticated USING (
    auth.uid() = user_id OR (
      user_id IS NULL AND session_user_id IS NOT NULL AND
      session_user_id = COALESCE(auth.jwt() ->> 'session_id', auth.uid()::text)
    )
  );

CREATE POLICY "campaigns_authenticated_insert" ON public.campaigns
  FOR INSERT TO authenticated WITH CHECK (
    auth.uid() = user_id OR (
      user_id IS NULL AND session_user_id IS NOT NULL AND
      session_user_id = COALESCE(auth.jwt() ->> 'session_id', auth.uid()::text)
    )
  );

CREATE POLICY "campaigns_authenticated_update" ON public.campaigns
  FOR UPDATE TO authenticated USING (
    auth.uid() = user_id OR (
      user_id IS NULL AND session_user_id IS NOT NULL AND
      session_user_id = COALESCE(auth.jwt() ->> 'session_id', auth.uid()::text)
    )
  )
  WITH CHECK (
    auth.uid() = user_id OR (
      user_id IS NULL AND session_user_id IS NOT NULL AND
      session_user_id = COALESCE(auth.jwt() ->> 'session_id', auth.uid()::text)
    )
  );

CREATE POLICY "leads_authenticated_access" ON public.leads
  FOR SELECT TO authenticated USING (
    auth.uid() = user_id OR (
      user_id IS NULL AND session_user_id IS NOT NULL AND
      session_user_id = COALESCE(auth.jwt() ->> 'session_id', auth.uid()::text)
    ) OR campaign_id IN (
      SELECT id FROM public.campaigns
      WHERE user_id = auth.uid() OR (
        user_id IS NULL AND session_user_id IS NOT NULL AND
        session_user_id = COALESCE(auth.jwt() ->> 'session_id', auth.uid()::text)
      )
    )
  );

CREATE POLICY "leads_authenticated_insert" ON public.leads
  FOR INSERT TO authenticated WITH CHECK (
    auth.uid() = user_id OR (
      user_id IS NULL AND session_user_id IS NOT NULL AND
      session_user_id = COALESCE(auth.jwt() ->> 'session_id', auth.uid()::text)
    ) OR campaign_id IN (
      SELECT id FROM public.campaigns
      WHERE user_id = auth.uid() OR (
        user_id IS NULL AND session_user_id IS NOT NULL AND
        session_user_id = COALESCE(auth.jwt() ->> 'session_id', auth.uid()::text)
      )
    )
  );

CREATE POLICY "dashboard_exports_authenticated_access" ON public.dashboard_exports
  FOR SELECT TO authenticated USING (
    auth.uid() = user_id OR (
      user_id IS NULL AND session_user_id IS NOT NULL AND
      session_user_id = COALESCE(auth.jwt() ->> 'session_id', auth.uid()::text)
    ) OR campaign_id IN (
      SELECT id FROM public.campaigns
      WHERE user_id = auth.uid() OR (
        user_id IS NULL AND session_user_id IS NOT NULL AND
        session_user_id = COALESCE(auth.jwt() ->> 'session_id', auth.uid()::text)
      )
    )
  );

CREATE POLICY "dashboard_exports_authenticated_insert" ON public.dashboard_exports
  FOR INSERT TO authenticated WITH CHECK (
    auth.uid() = user_id OR (
      user_id IS NULL AND session_user_id IS NOT NULL AND
      session_user_id = COALESCE(auth.jwt() ->> 'session_id', auth.uid()::text)
    )
  );

CREATE POLICY "campaigns_session_access" ON public.campaigns
  FOR SELECT TO anon USING (
    user_id IS NULL AND session_user_id IS NOT NULL AND
    session_user_id = auth.jwt() ->> 'session_id'
  );

CREATE POLICY "campaigns_session_insert" ON public.campaigns
  FOR INSERT TO anon WITH CHECK (
    user_id IS NULL AND session_user_id IS NOT NULL AND
    session_user_id = auth.jwt() ->> 'session_id'
  );

CREATE POLICY "leads_session_access" ON public.leads
  FOR SELECT TO anon USING (
    user_id IS NULL AND session_user_id IS NOT NULL AND
    session_user_id = auth.jwt() ->> 'session_id'
  );

CREATE POLICY "leads_session_insert" ON public.leads
  FOR INSERT TO anon WITH CHECK (
    user_id IS NULL AND session_user_id IS NOT NULL AND
    session_user_id = auth.jwt() ->> 'session_id'
  );

CREATE POLICY "dashboard_exports_session_access" ON public.dashboard_exports
  FOR SELECT TO anon USING (
    user_id IS NULL AND session_user_id IS NOT NULL AND
    session_user_id = auth.jwt() ->> 'session_id'
  );

CREATE POLICY "dashboard_exports_session_insert" ON public.dashboard_exports
  FOR INSERT TO anon WITH CHECK (
    user_id IS NULL AND session_user_id IS NOT NULL AND
    session_user_id = auth.jwt() ->> 'session_id'
  );

-- ============================================================================
-- VIEW DEFINITIONS
-- ============================================================================

DROP VIEW IF EXISTS public.campaign_analytics;
CREATE VIEW public.campaign_analytics
WITH (security_invoker = true)
AS
SELECT
  c.id,
  c.business_type,
  c.location,
  c.target_count,
  c.min_confidence_score,
  c.status,
  c.results_count,
  c.total_cost,
  c.budget_limit,
  c.processing_time_ms,
  c.created_at,
  c.user_id,
  c.session_user_id,
  COUNT(l.id) AS actual_leads,
  COALESCE(AVG(l.confidence_score), 0)::numeric(10,2) AS avg_confidence
FROM public.campaigns c
LEFT JOIN public.leads l ON l.campaign_id = c.id
GROUP BY c.id, c.business_type, c.location, c.target_count, c.min_confidence_score,
         c.status, c.results_count, c.total_cost, c.budget_limit,
         c.processing_time_ms, c.created_at, c.user_id, c.session_user_id;

-- ============================================================================
-- GRANTS
-- ============================================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.campaign_analytics TO anon, authenticated, service_role;
GRANT ALL ON public.campaigns TO postgres, authenticated, service_role;
GRANT ALL ON public.leads TO postgres, authenticated, service_role;
GRANT ALL ON public.dashboard_exports TO postgres, authenticated, service_role;
GRANT SELECT, INSERT ON public.campaigns TO anon;
GRANT SELECT, INSERT ON public.leads TO anon;
GRANT SELECT, INSERT ON public.dashboard_exports TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO postgres, authenticated, service_role;
