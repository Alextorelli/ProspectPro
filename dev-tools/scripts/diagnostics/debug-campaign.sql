-- ═══════════════════════════════════════════════════════════════
-- ProspectPro Zero Results Diagnostic SQL Queries
-- ═══════════════════════════════════════════════════════════════
-- Purpose: Identify exactly where the data pipeline is failing
-- Usage: Run in Supabase Dashboard → SQL Editor
-- Context: After running a campaign that showed 0 results
-- ═══════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════
-- QUERY 1: COMPREHENSIVE CAMPAIGN + JOB ANALYSIS
-- ═══════════════════════════════════════════════════════════════
-- What it shows:
-- - Campaign creation details and configuration
-- - Associated discovery job status and metrics
-- - Actual lead count vs reported results_count
-- - User fingerprint count (for dedupe context)
-- What to look for:
-- - results_count: Should match actual_lead_count
-- - job_status: Should be "completed" not "failed"
-- - job_metrics: Check businesses_found, qualified_leads values
-- - actual_lead_count: If 0, leads never created
-- ═══════════════════════════════════════════════════════════════

WITH latest_campaign AS (
  SELECT id, business_type, location, status, results_count, 
         total_cost, user_id, created_at
  FROM campaigns
  WHERE user_id = auth.uid()
  ORDER BY created_at DESC
  LIMIT 1
)
SELECT 
  c.id as campaign_id,
  c.business_type,
  c.location,
  c.status as campaign_status,
  c.results_count as reported_results,
  c.total_cost,
  c.created_at as campaign_created,
  
  -- Job details
  dj.id as job_id,
  dj.status as job_status,
  dj.stage as job_stage,
  dj.progress as job_progress,
  dj.metrics as job_metrics,
  dj.error as job_error,
  dj.started_at as job_started,
  dj.completed_at as job_completed,
  EXTRACT(EPOCH FROM (dj.completed_at - dj.started_at)) as job_duration_seconds,
  
  -- Verification metrics
  (SELECT COUNT(*) FROM leads WHERE campaign_id = c.id) as actual_lead_count,
  (SELECT COUNT(*) FROM lead_fingerprints WHERE user_id = c.user_id) as user_total_fingerprints,
  
  -- Status checks
  CASE 
    WHEN dj.id IS NULL THEN '🚨 NO JOB RECORD'
    WHEN dj.status = 'failed' THEN '🚨 JOB FAILED'
    WHEN dj.status = 'completed' AND c.results_count = 0 THEN '⚠️ COMPLETED BUT ZERO RESULTS'
    WHEN dj.status = 'completed' AND c.results_count > 0 THEN '✅ COMPLETED WITH RESULTS'
    ELSE '⏳ JOB IN PROGRESS'
  END as diagnostic_status
  
FROM latest_campaign c
LEFT JOIN discovery_jobs dj ON dj.campaign_id = c.id;

-- ═══════════════════════════════════════════════════════════════
-- QUERY 2: VERIFY LEADS IN DATABASE
-- ═══════════════════════════════════════════════════════════════
-- What it shows:
-- - Actual lead records for the latest campaign
-- - Basic contact info completeness
-- - Data sources used (cached vs API)
-- - Confidence scores
-- What to look for:
-- - If returns 0 rows: Leads never inserted to database
-- - If returns rows: Check data_source for "cached_reuse" vs "google_places"
-- - Check email/phone/website presence
-- ═══════════════════════════════════════════════════════════════

SELECT 
  l.id as lead_id,
  l.campaign_id,
  l.business_name,
  l.address,
  l.phone,
  l.website,
  l.email,
  l.confidence_score,
  l.enrichment_data->>'data_source' as data_source,
  l.enrichment_data->'processingMetadata'->>'reuseCampaignId' as reused_from_campaign,
  l.user_id,
  l.created_at,
  
  -- Quick checks
  CASE WHEN l.phone IS NOT NULL THEN '✅' ELSE '❌' END as has_phone,
  CASE WHEN l.email IS NOT NULL THEN '✅' ELSE '❌' END as has_email,
  CASE WHEN l.website IS NOT NULL THEN '✅' ELSE '❌' END as has_website
  
FROM leads l
WHERE l.campaign_id = (
  SELECT id FROM campaigns 
  WHERE user_id = auth.uid() 
  ORDER BY created_at DESC 
  LIMIT 1
)
ORDER BY l.confidence_score DESC
LIMIT 20;

-- ═══════════════════════════════════════════════════════════════
-- QUERY 3: RECENT CAMPAIGN SUMMARY (LAST 5)
-- ═══════════════════════════════════════════════════════════════
-- What it shows:
-- - Pattern across multiple recent campaigns
-- - Which campaigns succeeded vs failed
-- - Lead counts and costs
-- What to look for:
-- - Are ALL campaigns showing 0 results or just recent ones?
-- - Did earlier campaigns work but recent ones fail?
-- - Any pattern in business types or locations?
-- ═══════════════════════════════════════════════════════════════

SELECT 
  c.id,
  c.business_type,
  c.location,
  c.status,
  c.results_count,
  c.total_cost,
  c.created_at,
  (SELECT COUNT(*) FROM leads WHERE campaign_id = c.id) as actual_leads,
  CASE 
    WHEN c.results_count = 0 AND (SELECT COUNT(*) FROM leads WHERE campaign_id = c.id) = 0 
      THEN '🚨 ZERO RESULTS'
    WHEN c.results_count != (SELECT COUNT(*) FROM leads WHERE campaign_id = c.id) 
      THEN '⚠️ COUNT MISMATCH'
    ELSE '✅ OK'
  END as status_check
FROM campaigns c
WHERE c.user_id = auth.uid()
ORDER BY c.created_at DESC
LIMIT 5;

-- ═══════════════════════════════════════════════════════════════
-- QUERY 4: FINGERPRINT ANALYSIS
-- ═══════════════════════════════════════════════════════════════
-- What it shows:
-- - Total unique businesses discovered for this user
-- - Distribution across campaigns
-- - Most recent fingerprints
-- What to look for:
-- - If very high count: Might explain why no "new" results
-- - If 0 count: Fingerprint tracking not working
-- - Check recent fingerprints to see what's being tracked
-- ═══════════════════════════════════════════════════════════════

WITH fingerprint_stats AS (
  SELECT 
    user_id,
    COUNT(*) as total_fingerprints,
    COUNT(DISTINCT source_campaign_id) as campaigns_with_fingerprints,
    MAX(created_at) as most_recent_fingerprint
  FROM lead_fingerprints
  WHERE user_id = auth.uid()
  GROUP BY user_id
)
SELECT 
  fs.*,
  (SELECT COUNT(*) FROM campaigns WHERE user_id = auth.uid()) as total_user_campaigns,
  
  -- Sample recent fingerprints
  (
    SELECT json_agg(
      json_build_object(
        'business', substring(business_identifier, 1, 50),
        'campaign', source_campaign_id,
        'created', created_at
      )
    )
    FROM (
      SELECT business_identifier, source_campaign_id, created_at
      FROM lead_fingerprints
      WHERE user_id = auth.uid()
      ORDER BY created_at DESC
      LIMIT 5
    ) recent
  ) as recent_fingerprints_sample
  
FROM fingerprint_stats fs;

-- ═══════════════════════════════════════════════════════════════
-- INTERPRETATION GUIDE
-- ═══════════════════════════════════════════════════════════════
-- 
-- SCENARIO 1: No businesses discovered
--   Query 1: job_metrics shows businesses_found = 0
--   Query 2: Returns 0 rows
--   → Google Places/Foursquare API issue
--
-- SCENARIO 2: Businesses found but filtered
--   Query 1: job_metrics shows businesses_found > 0, qualified_leads = 0
--   Query 2: Returns 0 rows
--   → Fingerprint filter too aggressive OR scoring rejecting all
--
-- SCENARIO 3: Leads created but query failing
--   Query 1: actual_lead_count > 0, reported_results = 0
--   Query 2: Returns rows
--   → Frontend query issue or data not syncing
--
-- SCENARIO 4: RLS blocking access
--   Query 1: Shows data but actual_lead_count = 0
--   Query 2: Returns 0 rows despite Query 1 showing leads exist
--   → user_id mismatch or RLS policy blocking
--
-- SCENARIO 5: All campaigns failing
--   Query 3: All recent campaigns show zero results
--   → Systematic issue introduced recently
--
-- ═══════════════════════════════════════════════════════════════

-- Check if leads exist for latest campaign
SELECT 
  l.id,
  l.campaign_id,
  l.business_name,
  l.address,
  l.phone,
  l.website,
  l.email,
  l.confidence_score,
  l.validation_cost,
  l.user_id,
  l.session_user_id,
  l.created_at
FROM leads l
JOIN campaigns c ON c.id = l.campaign_id
WHERE c.user_id = auth.uid()
ORDER BY l.created_at DESC
LIMIT 10;

-- Check discovery job details
SELECT 
  id as job_id,
  campaign_id,
  user_id,
  session_user_id,
  status,
  progress,
  current_stage,
  metrics,
  error,
  started_at,
  completed_at,
  created_at
FROM discovery_jobs
WHERE user_id = auth.uid()
ORDER BY created_at DESC
LIMIT 5;

-- Check for orphaned campaigns (campaigns without leads)
SELECT 
  c.id as campaign_id,
  c.business_type,
  c.location,
  c.status,
  c.results_count,
  c.created_at,
  COUNT(l.id) as actual_lead_count
FROM campaigns c
LEFT JOIN leads l ON l.campaign_id = c.id
WHERE c.user_id = auth.uid()
GROUP BY c.id, c.business_type, c.location, c.status, c.results_count, c.created_at
HAVING c.results_count > 0 AND COUNT(l.id) = 0
ORDER BY c.created_at DESC;
