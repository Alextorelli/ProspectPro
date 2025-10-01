-- Security Fixes Only for ProspectPro
-- Fix the specific errors and warnings identified

-- Fix 1: Remove SECURITY DEFINER from campaign_analytics view
-- Error: View `public.campaign_analytics` is defined with the SECURITY DEFINER property
DROP VIEW IF EXISTS campaign_analytics;

-- Recreate campaign_analytics view without SECURITY DEFINER
CREATE OR REPLACE VIEW campaign_analytics AS
SELECT 
    c.id,
    c.business_type,
    c.location,
    c.verification_level,
    c.target_count,
    c.results_count,
    c.total_cost,
    c.created_at,
    COUNT(l.id) as actual_leads_count,
    AVG(l.confidence_score) as avg_confidence_score,
    COUNT(CASE WHEN l.apollo_verified = true THEN 1 END) as apollo_verified_count,
    COUNT(CASE WHEN l.chamber_verified = true THEN 1 END) as chamber_verified_count,
    COUNT(CASE WHEN l.license_verified = true THEN 1 END) as license_verified_count
FROM campaigns c
LEFT JOIN leads l ON c.id = l.campaign_id
GROUP BY c.id, c.business_type, c.location, c.verification_level, c.target_count, c.results_count, c.total_cost, c.created_at;

-- Fix 2: Set search_path for update_updated_at_column function
-- Warning: Function `public.update_updated_at_column` has a role mutable search_path
DROP FUNCTION IF EXISTS update_updated_at_column();

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

-- Recreate triggers with the fixed function
DROP TRIGGER IF EXISTS update_campaigns_updated_at ON campaigns;
DROP TRIGGER IF EXISTS update_leads_updated_at ON leads;

CREATE TRIGGER update_campaigns_updated_at
    BEFORE UPDATE ON campaigns
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leads_updated_at
    BEFORE UPDATE ON leads
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

SELECT 'Security fixes applied successfully!' as status;