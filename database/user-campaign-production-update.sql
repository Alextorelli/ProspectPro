-- User-Campaign Linking Schema - Production Update
-- October 4, 2025 - Add user awareness to existing schema

-- Step 1: Add user_id columns to existing tables
ALTER TABLE campaigns 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS session_user_id TEXT;

ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS session_user_id TEXT;

ALTER TABLE dashboard_exports 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS session_user_id TEXT;

-- Step 2: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_campaigns_user_id ON campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_session_user_id ON campaigns(session_user_id);
CREATE INDEX IF NOT EXISTS idx_leads_user_id ON leads(user_id);
CREATE INDEX IF NOT EXISTS idx_leads_session_user_id ON leads(session_user_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_exports_user_id ON dashboard_exports(user_id);

-- Step 3: Update RLS policies for user-aware access

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own campaigns" ON campaigns;
DROP POLICY IF EXISTS "Users can insert their own campaigns" ON campaigns;
DROP POLICY IF EXISTS "Users can update their own campaigns" ON campaigns;

DROP POLICY IF EXISTS "Users can view their own leads" ON leads;
DROP POLICY IF EXISTS "Users can insert their own leads" ON leads;

DROP POLICY IF EXISTS "Users can view their own exports" ON dashboard_exports;
DROP POLICY IF EXISTS "Users can insert their own exports" ON dashboard_exports;

-- Campaigns table policies
CREATE POLICY "Users can view their own campaigns" ON campaigns
    FOR SELECT USING (
        auth.uid() = user_id OR 
        (auth.uid() IS NULL AND session_user_id IS NOT NULL)
    );

CREATE POLICY "Users can insert their own campaigns" ON campaigns
    FOR INSERT WITH CHECK (
        (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR
        (auth.uid() IS NULL AND session_user_id IS NOT NULL)
    );

CREATE POLICY "Users can update their own campaigns" ON campaigns
    FOR UPDATE USING (
        auth.uid() = user_id OR 
        (auth.uid() IS NULL AND session_user_id IS NOT NULL)
    );

-- Leads table policies
CREATE POLICY "Users can view their own leads" ON leads
    FOR SELECT USING (
        auth.uid() = user_id OR 
        (auth.uid() IS NULL AND session_user_id IS NOT NULL) OR
        campaign_id IN (
            SELECT id FROM campaigns 
            WHERE auth.uid() = user_id OR 
                  (auth.uid() IS NULL AND session_user_id IS NOT NULL)
        )
    );

CREATE POLICY "Users can insert their own leads" ON leads
    FOR INSERT WITH CHECK (
        (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR
        (auth.uid() IS NULL AND session_user_id IS NOT NULL) OR
        campaign_id IN (
            SELECT id FROM campaigns 
            WHERE auth.uid() = user_id OR 
                  (auth.uid() IS NULL AND session_user_id IS NOT NULL)
        )
    );

-- Dashboard exports table policies
CREATE POLICY "Users can view their own exports" ON dashboard_exports
    FOR SELECT USING (
        auth.uid() = user_id OR 
        (auth.uid() IS NULL AND session_user_id IS NOT NULL) OR
        campaign_id IN (
            SELECT id FROM campaigns 
            WHERE auth.uid() = user_id OR 
                  (auth.uid() IS NULL AND session_user_id IS NOT NULL)
        )
    );

CREATE POLICY "Users can insert their own exports" ON dashboard_exports
    FOR INSERT WITH CHECK (
        (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR
        (auth.uid() IS NULL AND session_user_id IS NOT NULL)
    );

-- Step 4: Create helper functions

-- Function to get user campaigns
CREATE OR REPLACE FUNCTION get_user_campaigns(target_user_id UUID DEFAULT NULL, target_session_user_id TEXT DEFAULT NULL)
RETURNS TABLE (
    id TEXT,
    business_type TEXT,
    location TEXT,
    target_count INTEGER,
    results_count INTEGER,
    status TEXT,
    total_cost DECIMAL(10,4),
    created_at TIMESTAMPTZ
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id, c.business_type, c.location, c.target_count, 
        c.results_count, c.status, c.total_cost, c.created_at
    FROM campaigns c
    WHERE 
        (target_user_id IS NOT NULL AND c.user_id = target_user_id) OR
        (target_session_user_id IS NOT NULL AND c.session_user_id = target_session_user_id) OR
        (target_user_id IS NULL AND target_session_user_id IS NULL AND (
            c.user_id = auth.uid() OR 
            (auth.uid() IS NULL AND c.session_user_id IS NOT NULL)
        ))
    ORDER BY c.created_at DESC;
END;
$$;

-- Function to link anonymous campaigns to authenticated user
CREATE OR REPLACE FUNCTION link_anonymous_campaigns_to_user(target_session_user_id TEXT, authenticated_user_id UUID)
RETURNS INTEGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    linked_count INTEGER := 0;
BEGIN
    -- Link campaigns
    UPDATE campaigns 
    SET user_id = authenticated_user_id
    WHERE session_user_id = target_session_user_id AND user_id IS NULL;
    
    GET DIAGNOSTICS linked_count = ROW_COUNT;
    
    -- Link leads
    UPDATE leads 
    SET user_id = authenticated_user_id
    WHERE session_user_id = target_session_user_id AND user_id IS NULL;
    
    -- Link exports
    UPDATE dashboard_exports 
    SET user_id = authenticated_user_id
    WHERE session_user_id = target_session_user_id AND user_id IS NULL;
    
    RETURN linked_count;
END;
$$;

-- Step 5: Update the campaign_analytics view to be user-aware
DROP VIEW IF EXISTS campaign_analytics;
CREATE VIEW campaign_analytics
WITH (security_invoker = true)
AS SELECT
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
FROM campaigns c
LEFT JOIN leads l ON l.campaign_id = c.id
WHERE 
    c.user_id = auth.uid() OR 
    (auth.uid() IS NULL AND c.session_user_id IS NOT NULL)
GROUP BY c.id, c.business_type, c.location, c.target_count, c.min_confidence_score,
         c.status, c.results_count, c.total_cost, c.budget_limit, c.processing_time_ms, 
         c.created_at, c.user_id, c.session_user_id;

-- Step 6: Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON campaign_analytics TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_user_campaigns TO anon, authenticated;
GRANT EXECUTE ON FUNCTION link_anonymous_campaigns_to_user TO anon, authenticated;

-- Success notification
SELECT 'User-campaign linking schema applied successfully!' as status;