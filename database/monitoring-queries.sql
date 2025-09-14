-- ============================================================================
-- ProspectPro Monitoring Queries - Simple SELECT statements
-- Use these instead of complex stored functions to avoid dollar-quoting issues
-- ============================================================================

-- ============================================================================
-- CAMPAIGN COST ANALYSIS
-- ============================================================================

-- Cost per qualified lead analysis (replace function call)
SELECT 
  c.id as campaign_id,
  c.name as campaign_name,
  COALESCE(c.current_cost, 0) as total_api_cost,
  COALESCE((c.results->>'qualified')::INTEGER, 0) as total_qualified_leads,
  CASE 
    WHEN COALESCE((c.results->>'qualified')::INTEGER, 0) > 0 
    THEN ROUND(COALESCE(c.current_cost, 0) / (c.results->>'qualified')::INTEGER, 4)
    ELSE 0 
  END as cost_per_qualified_lead,
  CASE 
    WHEN COALESCE(c.current_cost, 0) > 0 
    THEN ROUND((COALESCE((c.results->>'qualified')::INTEGER, 0) * 10.0) / COALESCE(c.current_cost, 0) * 100, 2)
    ELSE 0 
  END as roi_percentage,
  LEAST(100, GREATEST(0, 
    100 - (CASE 
      WHEN COALESCE((c.results->>'qualified')::INTEGER, 0) > 0 
      THEN (COALESCE(c.current_cost, 0) / (c.results->>'qualified')::INTEGER * 20)::INTEGER
      ELSE 100 
    END)
  )) as efficiency_score
FROM campaigns c
WHERE c.status IN ('active', 'completed')
  AND c.created_at >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY cost_per_qualified_lead ASC;

-- ============================================================================
-- REAL-TIME DASHBOARD METRICS
-- ============================================================================

-- Dashboard overview metrics (replace function call)
SELECT 
  json_build_object(
    'overview', json_build_object(
      'active_campaigns', COUNT(*) FILTER (WHERE status = 'active'),
      'total_campaigns', COUNT(*),
      'total_leads_discovered', COALESCE(SUM((results->>'discovered')::INTEGER), 0),
      'total_qualified_leads', COALESCE(SUM((results->>'qualified')::INTEGER), 0),
      'total_cost_today', COALESCE(SUM(current_cost), 0),
      'avg_qualification_rate', CASE 
        WHEN SUM((results->>'discovered')::INTEGER) > 0 
        THEN ROUND(SUM((results->>'qualified')::INTEGER)::numeric / SUM((results->>'discovered')::INTEGER) * 100, 2)
        ELSE 0 
      END
    ),
    'timestamp', now()
  ) as dashboard_metrics
FROM campaigns
WHERE created_at >= CURRENT_DATE;

-- ============================================================================
-- API SERVICE BREAKDOWN
-- ============================================================================

-- API service performance analysis (replace function call)
SELECT 
  au.service as api_service,
  COUNT(*)::INTEGER as total_requests,
  COALESCE(SUM(au.cost), 0) as total_cost,
  ROUND(
    (COUNT(*) FILTER (WHERE au.success = true))::numeric / COUNT(*) * 100, 2
  ) as success_rate,
  ROUND(AVG(au.response_time))::INTEGER as avg_response_time_ms,
  ROUND(
    COALESCE(SUM(au.cost), 0) / COUNT(*), 4
  ) as cost_per_request
FROM api_usage au
WHERE au.created_at::DATE >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY au.service
ORDER BY total_cost DESC;

-- ============================================================================
-- CAMPAIGN ANALYTICS DETAILS
-- ============================================================================

-- Detailed campaign analytics (replace function call)
-- Use this query and replace 'YOUR_CAMPAIGN_ID' with actual campaign ID
SELECT 
  json_build_object(
    'campaign_id', c.id,
    'campaign_name', c.name,
    'status', c.status,
    'created_at', c.created_at,
    'total_leads', COUNT(b.id),
    'qualified_leads', COUNT(b.id) FILTER (WHERE b.is_qualified = true),
    'total_cost', COALESCE(SUM(b.total_cost), 0),
    'average_confidence', COALESCE(ROUND(AVG(b.confidence_score)), 0),
    'cost_per_lead', CASE 
      WHEN COUNT(b.id) > 0 THEN ROUND(COALESCE(SUM(b.total_cost), 0) / COUNT(b.id), 4)
      ELSE 0 
    END,
    'cost_per_qualified_lead', CASE 
      WHEN COUNT(b.id) FILTER (WHERE b.is_qualified = true) > 0 
      THEN ROUND(COALESCE(SUM(b.total_cost), 0) / COUNT(b.id) FILTER (WHERE b.is_qualified = true), 4)
      ELSE 0 
    END,
    'quality_distribution', json_build_object(
      'a_grade', COUNT(b.id) FILTER (WHERE b.confidence_score >= 90),
      'b_grade', COUNT(b.id) FILTER (WHERE b.confidence_score >= 80 AND b.confidence_score < 90),
      'c_grade', COUNT(b.id) FILTER (WHERE b.confidence_score >= 70 AND b.confidence_score < 80),
      'd_grade', COUNT(b.id) FILTER (WHERE b.confidence_score >= 60 AND b.confidence_score < 70),
      'f_grade', COUNT(b.id) FILTER (WHERE b.confidence_score < 60)
    )
  ) as campaign_analytics
FROM campaigns c
LEFT JOIN businesses b ON c.id = b.campaign_id
WHERE c.id = 'YOUR_CAMPAIGN_ID'  -- Replace with actual campaign ID
GROUP BY c.id, c.name, c.status, c.created_at;

-- ============================================================================
-- SERVICE HEALTH CHECK
-- ============================================================================

-- Current service health status
SELECT 
  service_name,
  status,
  response_time_ms,
  error_rate,
  requests_today,
  cost_today,
  last_successful_call,
  timestamp as last_check
FROM service_health_metrics
WHERE timestamp >= CURRENT_DATE - INTERVAL '1 day'
ORDER BY service_name, timestamp DESC;

-- Latest service health summary
SELECT DISTINCT ON (service_name)
  service_name,
  status,
  response_time_ms,
  error_rate,
  requests_today,
  cost_today,
  timestamp as last_check
FROM service_health_metrics 
ORDER BY service_name, timestamp DESC;

-- ============================================================================
-- MONITORING TABLE STATUS
-- ============================================================================

-- Check monitoring table contents
SELECT 
  'api_cost_tracking' as table_name,
  COUNT(*) as record_count,
  MAX(created_at) as latest_record
FROM api_cost_tracking
UNION ALL
SELECT 
  'lead_qualification_metrics' as table_name,
  COUNT(*) as record_count,
  MAX(created_at) as latest_record
FROM lead_qualification_metrics
UNION ALL
SELECT 
  'service_health_metrics' as table_name,
  COUNT(*) as record_count,
  MAX(timestamp) as latest_record
FROM service_health_metrics
UNION ALL
SELECT 
  'dashboard_exports' as table_name,
  COUNT(*) as record_count,
  MAX(created_at) as latest_record
FROM dashboard_exports;

-- ============================================================================
-- USAGE INSTRUCTIONS
-- ============================================================================

/*
USAGE INSTRUCTIONS:

1. Run the simplified deployment script first: supabase-deployment-simplified.sql

2. Use these queries instead of function calls:
   - Copy and paste each query section as needed
   - Replace placeholder values (like 'YOUR_CAMPAIGN_ID') with actual IDs
   - Run queries individually for specific insights

3. For recurring monitoring, save these queries in your Supabase dashboard

4. No complex function creation needed - just simple SELECT statements

5. All queries are safe and read-only (except INSERT for sample data)
*/