-- ProspectPro v4.3 Database Cleanup Queries
-- Run these in Supabase SQL Editor to identify cleanup candidates

-- 1. Find test/development campaigns (safe to remove)
-- Look for campaigns with test patterns in IDs or session user IDs
SELECT 
  id, business_type, location, status, results_count, 
  total_cost, created_at, user_id, session_user_id
FROM campaigns 
WHERE 
  id LIKE '%test%' 
  OR id LIKE '%debug%'
  OR id LIKE '%validation%'
  OR session_user_id LIKE '%test%'
  OR session_user_id LIKE '%debug%'
ORDER BY created_at DESC;

-- 2. Find old completed campaigns (older than 30 days)
-- These might be candidates for archival
SELECT 
  id, business_type, location, status, results_count, 
  total_cost, created_at, user_id
FROM campaigns 
WHERE 
  created_at < NOW() - INTERVAL '30 days'
  AND status = 'completed'
ORDER BY created_at ASC
LIMIT 20;

-- 3. Find orphaned leads (campaigns that no longer exist)
-- These should be cleaned up
SELECT 
  l.id, l.campaign_id, l.business_name, l.created_at
FROM leads l
LEFT JOIN campaigns c ON l.campaign_id = c.id
WHERE c.id IS NULL
LIMIT 10;

-- 4. Find large campaigns that might need review
-- Campaigns with unusually high lead counts or costs
SELECT 
  id, business_type, location, results_count, total_cost,
  (total_cost / NULLIF(results_count, 0)) as cost_per_lead,
  created_at, user_id
FROM campaigns 
WHERE 
  results_count > 100 
  OR total_cost > 100
ORDER BY total_cost DESC
LIMIT 10;

-- 5. Find old dashboard exports (older than 7 days)
-- Export records can usually be cleaned up after a week
SELECT 
  id, campaign_id, export_type, file_format, row_count,
  export_status, created_at, user_id
FROM dashboard_exports 
WHERE created_at < NOW() - INTERVAL '7 days'
ORDER BY created_at ASC
LIMIT 20;

-- 6. Database storage summary
-- Check overall table sizes and row counts
SELECT 
  'campaigns' as table_name,
  COUNT(*) as row_count,
  MIN(created_at) as oldest_record,
  MAX(created_at) as newest_record
FROM campaigns
UNION ALL
SELECT 
  'leads' as table_name,
  COUNT(*) as row_count,
  MIN(created_at) as oldest_record,
  MAX(created_at) as newest_record
FROM leads
UNION ALL
SELECT 
  'dashboard_exports' as table_name,
  COUNT(*) as row_count,
  MIN(created_at) as oldest_record,
  MAX(created_at) as newest_record
FROM dashboard_exports;

-- 7. Identify potentially problematic campaigns
-- Campaigns stuck in processing or with errors
SELECT 
  id, business_type, location, status, results_count,
  processing_time_ms, created_at, updated_at
FROM campaigns 
WHERE 
  status = 'processing' 
  OR (status = 'completed' AND results_count = 0)
  OR processing_time_ms > 300000 -- More than 5 minutes
ORDER BY created_at DESC
LIMIT 10;

-- CLEANUP COMMANDS (Run after reviewing results above)
-- =================================================

-- Clean up test campaigns and their leads
-- DELETE FROM leads WHERE campaign_id IN (
--   SELECT id FROM campaigns WHERE 
--   id LIKE '%test%' OR id LIKE '%debug%' OR id LIKE '%validation%'
-- );
-- DELETE FROM campaigns WHERE 
--   id LIKE '%test%' OR id LIKE '%debug%' OR id LIKE '%validation%';

-- Clean up orphaned leads
-- DELETE FROM leads WHERE id IN (
--   SELECT l.id FROM leads l
--   LEFT JOIN campaigns c ON l.campaign_id = c.id
--   WHERE c.id IS NULL
-- );

-- Clean up old dashboard exports
-- DELETE FROM dashboard_exports 
-- WHERE created_at < NOW() - INTERVAL '30 days';

-- Reset stuck campaigns to failed status
-- UPDATE campaigns 
-- SET status = 'failed', updated_at = NOW()
-- WHERE status = 'processing' 
-- AND created_at < NOW() - INTERVAL '1 hour';