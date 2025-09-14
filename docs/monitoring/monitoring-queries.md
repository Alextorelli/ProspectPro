# ProspectPro Monitoring Queries

## Overview
Ready-to-use SQL queries for ProspectPro analytics and monitoring. These queries work with your enhanced Supabase database to provide real-time insights.

## Core Analytics Queries

### Campaign Performance Dashboard

#### 1. Campaign Overview Metrics
```sql
-- Real-time campaign performance 
SELECT 
  c.id,
  c.name as campaign_name,
  c.status,
  c.created_at,
  COALESCE((c.results->>'discovered')::INTEGER, 0) as leads_discovered,
  COALESCE((c.results->>'qualified')::INTEGER, 0) as leads_qualified,
  COALESCE(c.current_cost, 0) as total_cost,
  CASE 
    WHEN COALESCE((c.results->>'discovered')::INTEGER, 0) > 0 
    THEN ROUND(
      COALESCE((c.results->>'qualified')::INTEGER, 0) * 100.0 / 
      COALESCE((c.results->>'discovered')::INTEGER, 1), 2
    )
    ELSE 0 
  END as qualification_rate,
  CASE 
    WHEN COALESCE((c.results->>'qualified')::INTEGER, 0) > 0 
    THEN ROUND(COALESCE(c.current_cost, 0) / (c.results->>'qualified')::INTEGER, 4)
    ELSE 0 
  END as cost_per_qualified_lead
FROM campaigns c 
WHERE c.status IN ('active', 'completed')
ORDER BY c.created_at DESC;
```

#### 2. Campaign Cost Analysis  
```sql
-- Cost breakdown by campaign
SELECT 
  c.name as campaign_name,
  c.status,
  COALESCE(c.current_cost, 0) as total_api_cost,
  COUNT(b.id) as total_leads,
  COUNT(b.id) FILTER (WHERE b.is_qualified = true) as qualified_leads,
  COALESCE(AVG(b.confidence_score), 0) as avg_confidence_score,
  COALESCE(SUM(b.total_cost), 0) as detailed_costs,
  CASE 
    WHEN COUNT(b.id) > 0 
    THEN ROUND(COALESCE(c.current_cost, 0) / COUNT(b.id), 4)
    ELSE 0 
  END as cost_per_lead,
  CASE 
    WHEN COUNT(b.id) FILTER (WHERE b.is_qualified = true) > 0 
    THEN ROUND(COALESCE(c.current_cost, 0) / COUNT(b.id) FILTER (WHERE b.is_qualified = true), 4)
    ELSE 0 
  END as cost_per_qualified_lead
FROM campaigns c
LEFT JOIN businesses b ON c.id = b.campaign_id
GROUP BY c.id, c.name, c.status, c.current_cost
ORDER BY total_api_cost DESC;
```

### API Usage & Cost Tracking

#### 3. API Service Performance
```sql
-- API service breakdown with performance metrics
SELECT 
  au.service as api_service,
  DATE(au.created_at) as date,
  COUNT(*) as total_requests,
  COUNT(*) FILTER (WHERE au.success = true) as successful_requests,
  ROUND(
    COUNT(*) FILTER (WHERE au.success = true) * 100.0 / COUNT(*), 2
  ) as success_rate,
  COALESCE(SUM(au.cost), 0) as total_cost,
  COALESCE(AVG(au.response_time), 0) as avg_response_time,
  COALESCE(MIN(au.response_time), 0) as min_response_time,
  COALESCE(MAX(au.response_time), 0) as max_response_time,
  ROUND(COALESCE(SUM(au.cost) / COUNT(*), 0), 4) as cost_per_request
FROM api_usage au
WHERE au.created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY au.service, DATE(au.created_at)
ORDER BY DATE(au.created_at) DESC, total_cost DESC;
```

#### 4. Daily Cost Tracking
```sql
-- Daily API spending with budget tracking
SELECT 
  DATE(au.created_at) as date,
  COUNT(*) as total_api_calls,
  SUM(au.cost) as daily_cost,
  SUM(au.cost) FILTER (WHERE au.service = 'google_places') as google_places_cost,
  SUM(au.cost) FILTER (WHERE au.service = 'hunter_io') as hunter_cost,
  SUM(au.cost) FILTER (WHERE au.service = 'scrapingdog') as scraping_cost,
  SUM(au.cost) FILTER (WHERE au.service = 'neverbounce') as validation_cost,
  CASE 
    WHEN SUM(au.cost) > 25.00 THEN 'Over Budget'
    WHEN SUM(au.cost) > 20.00 THEN 'Near Limit' 
    ELSE 'Within Budget'
  END as budget_status
FROM api_usage au
WHERE au.created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(au.created_at)
ORDER BY DATE(au.created_at) DESC;
```

### Lead Quality Analysis

#### 5. Lead Quality Distribution
```sql
-- Lead quality grades and confidence scoring
SELECT 
  c.name as campaign_name,
  COUNT(b.id) as total_leads,
  COUNT(b.id) FILTER (WHERE b.confidence_score >= 90) as a_grade_count,
  COUNT(b.id) FILTER (WHERE b.confidence_score >= 80 AND b.confidence_score < 90) as b_grade_count,
  COUNT(b.id) FILTER (WHERE b.confidence_score >= 70 AND b.confidence_score < 80) as c_grade_count,
  COUNT(b.id) FILTER (WHERE b.confidence_score >= 60 AND b.confidence_score < 70) as d_grade_count,
  COUNT(b.id) FILTER (WHERE b.confidence_score < 60) as f_grade_count,
  ROUND(
    COUNT(b.id) FILTER (WHERE b.confidence_score >= 90) * 100.0 / COUNT(b.id), 2
  ) as a_grade_percentage,
  ROUND(
    COUNT(b.id) FILTER (WHERE b.confidence_score >= 80) * 100.0 / COUNT(b.id), 2
  ) as quality_leads_percentage
FROM campaigns c
JOIN businesses b ON c.id = b.campaign_id
GROUP BY c.id, c.name
ORDER BY quality_leads_percentage DESC;
```

#### 6. Processing Stage Analysis
```sql
-- Lead processing pipeline analysis
SELECT 
  b.processing_stage,
  COUNT(*) as lead_count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage,
  AVG(b.confidence_score) as avg_confidence,
  COUNT(*) FILTER (WHERE b.is_qualified = true) as qualified_count,
  COALESCE(AVG(b.total_cost), 0) as avg_processing_cost
FROM businesses b
WHERE b.created_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY b.processing_stage
ORDER BY 
  CASE b.processing_stage 
    WHEN 'discovered' THEN 1
    WHEN 'enriched' THEN 2  
    WHEN 'validated' THEN 3
    WHEN 'qualified' THEN 4
    ELSE 5
  END;
```

### Service Health Monitoring

#### 7. Service Health Dashboard
```sql
-- Current service health status
SELECT DISTINCT ON (shm.service_name)
  shm.service_name,
  shm.status,
  shm.response_time_ms,
  shm.error_rate * 100 as error_rate_percentage,
  shm.requests_today,
  shm.cost_today,
  shm.rate_limit_remaining,
  shm.cost_budget_remaining,
  shm.last_successful_call,
  shm.timestamp as last_check,
  CASE 
    WHEN shm.status = 'healthy' AND shm.error_rate < 0.05 THEN '🟢 Healthy'
    WHEN shm.status = 'healthy' AND shm.error_rate < 0.10 THEN '🟡 Warning'
    ELSE '🔴 Critical'
  END as health_indicator
FROM service_health_metrics shm
ORDER BY shm.service_name, shm.timestamp DESC;
```

#### 8. Service Performance Trends
```sql
-- Service performance over time
SELECT 
  shm.service_name,
  DATE(shm.timestamp) as date,
  AVG(shm.response_time_ms) as avg_response_time,
  AVG(shm.error_rate) * 100 as avg_error_rate,
  SUM(shm.requests_today) as total_requests,
  SUM(shm.cost_today) as total_cost,
  COUNT(*) as health_checks
FROM service_health_metrics shm
WHERE shm.timestamp >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY shm.service_name, DATE(shm.timestamp)
ORDER BY shm.service_name, DATE(shm.timestamp) DESC;
```

### Real-time Dashboard Queries

#### 9. Executive Dashboard Summary
```sql
-- High-level KPIs for executive dashboard  
SELECT 
  json_build_object(
    'active_campaigns', (
      SELECT COUNT(*) FROM campaigns WHERE status = 'active'
    ),
    'total_campaigns_today', (
      SELECT COUNT(*) FROM campaigns WHERE created_at >= CURRENT_DATE
    ),
    'leads_discovered_today', (
      SELECT COUNT(*) FROM businesses WHERE created_at >= CURRENT_DATE
    ),
    'leads_qualified_today', (
      SELECT COUNT(*) FROM businesses WHERE created_at >= CURRENT_DATE AND is_qualified = true
    ),
    'api_cost_today', (
      SELECT COALESCE(SUM(cost), 0) FROM api_usage WHERE created_at >= CURRENT_DATE
    ),
    'avg_qualification_rate', (
      SELECT ROUND(
        COUNT(*) FILTER (WHERE is_qualified = true) * 100.0 / COUNT(*), 2
      ) FROM businesses WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
    ),
    'budget_remaining', (
      25.00 - COALESCE((SELECT SUM(cost) FROM api_usage WHERE created_at >= CURRENT_DATE), 0)
    )
  ) as dashboard_metrics;
```

#### 10. Recent Activity Feed
```sql
-- Recent system activity for activity feed
SELECT 
  'campaign' as activity_type,
  c.name as title,
  'Campaign ' || c.status as description,
  c.created_at as timestamp
FROM campaigns c
WHERE c.created_at >= CURRENT_DATE - INTERVAL '24 hours'

UNION ALL

SELECT 
  'lead' as activity_type,
  b.business_name as title,
  'Lead ' || CASE WHEN b.is_qualified THEN 'qualified' ELSE 'processed' END as description,
  b.created_at as timestamp
FROM businesses b
WHERE b.created_at >= CURRENT_DATE - INTERVAL '24 hours'
  AND b.is_qualified = true

UNION ALL

SELECT 
  'cost_alert' as activity_type,
  'Budget Alert' as title,
  'Daily cost exceeded $' || ROUND(daily_cost, 2) as description,
  date::timestamp as timestamp
FROM (
  SELECT 
    DATE(created_at) as date,
    SUM(cost) as daily_cost
  FROM api_usage 
  WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
  GROUP BY DATE(created_at)
  HAVING SUM(cost) > 25.00
) budget_alerts

ORDER BY timestamp DESC
LIMIT 20;
```

## Grafana Time-Series Queries

### For Grafana Dashboard Panels
These queries use Grafana's `$__time()` and `$__timeFilter()` macros:

#### 11. Campaign Performance Time Series
```sql
-- For Grafana time series visualization
SELECT 
  $__time(c.created_at),
  c.name as metric,
  COALESCE((c.results->>'qualified')::INTEGER, 0) as value
FROM campaigns c 
WHERE $__timeFilter(c.created_at)
  AND c.status IN ('active', 'completed')
ORDER BY $__time(c.created_at);
```

#### 12. API Cost Time Series
```sql
-- For Grafana cost tracking over time
SELECT 
  $__time(au.created_at),
  au.service,
  SUM(au.cost) as total_cost
FROM api_usage au
WHERE $__timeFilter(au.created_at)
GROUP BY $__time(au.created_at), au.service
ORDER BY $__time(au.created_at);
```

## Usage Tips

### Query Optimization
- **Use indexes**: All queries leverage the performance indexes from the monitoring schema
- **Limit time ranges**: Use `WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'` for better performance
- **Filter early**: Apply WHERE clauses before JOINs when possible

### Customization
- **Replace time intervals**: Adjust `INTERVAL '30 days'` based on your needs
- **Modify thresholds**: Update budget limits and confidence score thresholds
- **Add filters**: Include campaign-specific or user-specific WHERE clauses

### Integration with Applications
- **API endpoints**: Use these queries in your Railway application APIs
- **Scheduled reports**: Run queries on cron jobs for automated reporting  
- **Real-time updates**: Combine with Supabase real-time subscriptions

## Next Steps
1. [Set up Grafana visualizations](grafana-setup.md)
2. [Configure Railway integration](railway-integration.md)
3. [Explore dashboard examples](dashboards/)

These queries provide comprehensive insights into your ProspectPro lead generation performance! 📈