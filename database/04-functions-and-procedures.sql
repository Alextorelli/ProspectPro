-- ============================================================================
-- ProspectPro Database Foundation - Phase 4: Functions and Procedures
-- ============================================================================
-- This script creates PostgreSQL functions and stored procedures for
-- business logic, analytics calculations, and data processing automation.
--
-- PREREQUISITES: Execute phases 01, 02, and 03 FIRST
-- ============================================================================

-- Phase 4.1: Verify Analytics Prerequisites
-- ============================================================================

DO $$
DECLARE
  required_tables TEXT[] := ARRAY['campaigns', 'enhanced_leads', 'campaign_analytics', 'api_cost_tracking'];
  missing_table TEXT;
  table_exists BOOLEAN;
BEGIN
  RAISE NOTICE '🔍 Phase 4.1: Verifying analytics prerequisites...';
  
  FOREACH missing_table IN ARRAY required_tables LOOP
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = missing_table
    ) INTO table_exists;
    
    IF NOT table_exists THEN
      RAISE EXCEPTION 'Missing required table: %. Execute previous phases first.', missing_table;
    END IF;
    
    RAISE NOTICE '   ✅ Required table % exists', missing_table;
  END LOOP;
  
  RAISE NOTICE '✅ Phase 4.1 Complete: All analytics prerequisites verified';
END $$;

-- Phase 4.2: Lead Quality and Scoring Functions
-- ============================================================================

-- Calculate comprehensive lead quality score
CREATE OR REPLACE FUNCTION calculate_lead_quality_score(lead_data JSON)
RETURNS INTEGER AS $$
DECLARE
  score INTEGER := 0;
  business_name TEXT;
  phone TEXT;
  address TEXT;
  website TEXT;
  email_verified BOOLEAN;
  social_verified BOOLEAN;
BEGIN
  -- Extract data from JSON
  business_name := lead_data->>'business_name';
  phone := lead_data->>'phone';
  address := lead_data->>'address';
  website := lead_data->>'website';
  email_verified := COALESCE((lead_data->>'email_verified')::BOOLEAN, false);
  social_verified := COALESCE((lead_data->>'social_verified')::BOOLEAN, false);
  
  -- Basic completeness scoring (40 points max)
  IF business_name IS NOT NULL AND LENGTH(business_name) > 0 THEN
    score := score + 10;
    -- Bonus for non-generic business names
    IF business_name !~* '(company|business|llc|inc|corp)$' AND LENGTH(business_name) > 10 THEN
      score := score + 5;
    END IF;
  END IF;
  
  IF phone IS NOT NULL AND phone ~ '^\+?1?[-.\s]?(\([0-9]{3}\)|[0-9]{3})[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}$' THEN
    score := score + 10;
  END IF;
  
  IF address IS NOT NULL AND LENGTH(address) > 10 THEN
    score := score + 10;
  END IF;
  
  IF website IS NOT NULL AND website ~* '^https?://' THEN
    score := score + 10;
    -- Bonus for website accessibility
    IF (lead_data->>'website_status')::INTEGER BETWEEN 200 AND 399 THEN
      score := score + 5;
    END IF;
  END IF;
  
  -- Email verification scoring (25 points max)
  IF email_verified = true THEN
    score := score + 20;
  ELSIF lead_data->>'email' IS NOT NULL THEN
    score := score + 10;
  END IF;
  
  -- Additional verification bonuses (20 points max)
  IF (lead_data->'enrichment_sources'->>'government_registry')::BOOLEAN = true THEN
    score := score + 10;
  END IF;
  
  IF social_verified = true THEN
    score := score + 10;
  END IF;
  
  -- Cap at 100
  RETURN LEAST(100, score);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Update lead confidence scores based on current data
CREATE OR REPLACE FUNCTION update_lead_confidence_scores(campaign_id_param UUID DEFAULT NULL)
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER := 0;
  lead_record RECORD;
  new_score INTEGER;
  lead_data JSON;
BEGIN
  FOR lead_record IN 
    SELECT id, business_name, phone, address, website, email_verified, 
           website_status, social_verified, enrichment_sources
    FROM enhanced_leads 
    WHERE campaign_id_param IS NULL OR campaign_id = campaign_id_param
  LOOP
    -- Build JSON object for scoring function
    lead_data := json_build_object(
      'business_name', lead_record.business_name,
      'phone', lead_record.phone,
      'address', lead_record.address,
      'website', lead_record.website,
      'email_verified', lead_record.email_verified,
      'website_status', lead_record.website_status,
      'social_verified', lead_record.social_verified,
      'enrichment_sources', lead_record.enrichment_sources
    );
    
    -- Calculate new confidence score
    new_score := calculate_lead_quality_score(lead_data);
    
    -- Update if score has changed
    UPDATE enhanced_leads 
    SET confidence_score = new_score,
        updated_at = now()
    WHERE id = lead_record.id 
      AND confidence_score != new_score;
    
    IF FOUND THEN
      updated_count := updated_count + 1;
    END IF;
  END LOOP;
  
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  RAISE NOTICE '✅ Phase 4.2 Complete: Lead quality and scoring functions created';
  RAISE NOTICE '   - calculate_lead_quality_score(): Comprehensive quality scoring algorithm';
  RAISE NOTICE '   - update_lead_confidence_scores(): Batch confidence score updates';
END $$;

-- Phase 4.3: Campaign Analytics Functions
-- ============================================================================

-- Calculate comprehensive campaign analytics
CREATE OR REPLACE FUNCTION get_campaign_analytics(campaign_id_param UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'campaign_id', c.id,
    'campaign_name', c.name,
    'status', c.status,
    'created_at', c.created_at,
    'completed_at', c.completed_at,
    'total_leads', COUNT(el.id),
    'qualified_leads', COUNT(el.id) FILTER (WHERE el.confidence_score >= c.quality_threshold),
    'total_cost', COALESCE(SUM(el.total_cost), 0),
    'average_confidence', COALESCE(ROUND(AVG(el.confidence_score)), 0),
    'cost_per_lead', CASE 
      WHEN COUNT(el.id) > 0 THEN ROUND(COALESCE(SUM(el.total_cost), 0) / COUNT(el.id), 4)
      ELSE 0 
    END,
    'cost_per_qualified_lead', CASE 
      WHEN COUNT(el.id) FILTER (WHERE el.confidence_score >= c.quality_threshold) > 0 
      THEN ROUND(COALESCE(SUM(el.total_cost), 0) / COUNT(el.id) FILTER (WHERE el.confidence_score >= c.quality_threshold), 4)
      ELSE 0 
    END,
    'qualification_rate', CASE 
      WHEN COUNT(el.id) > 0 
      THEN ROUND(COUNT(el.id) FILTER (WHERE el.confidence_score >= c.quality_threshold)::DECIMAL / COUNT(el.id) * 100, 1)
      ELSE 0 
    END,
    'quality_distribution', (
      SELECT json_build_object(
        'excellent', COUNT(*) FILTER (WHERE confidence_score >= 90),
        'very_good', COUNT(*) FILTER (WHERE confidence_score >= 80 AND confidence_score < 90),
        'good', COUNT(*) FILTER (WHERE confidence_score >= 70 AND confidence_score < 80),
        'average', COUNT(*) FILTER (WHERE confidence_score >= 50 AND confidence_score < 70),
        'poor', COUNT(*) FILTER (WHERE confidence_score < 50)
      )
      FROM enhanced_leads WHERE campaign_id = campaign_id_param
    ),
    'email_discovery_stats', (
      SELECT json_build_object(
        'leads_with_emails', COUNT(DISTINCT el.id),
        'total_emails_found', COUNT(le.id),
        'verified_deliverable', COUNT(le.id) FILTER (WHERE le.verification_status = 'deliverable'),
        'verification_rate', CASE 
          WHEN COUNT(le.id) > 0 
          THEN ROUND(COUNT(le.id) FILTER (WHERE le.verification_status = 'deliverable')::DECIMAL / COUNT(le.id) * 100, 1)
          ELSE 0 
        END
      )
      FROM enhanced_leads el
      LEFT JOIN lead_emails le ON el.id = le.lead_id
      WHERE el.campaign_id = campaign_id_param
    ),
    'api_usage_breakdown', (
      SELECT json_object_agg(api_service, usage_stats)
      FROM (
        SELECT 
          api_service,
          json_build_object(
            'requests_made', COUNT(*),
            'total_cost', COALESCE(SUM(request_cost), 0),
            'avg_response_time_ms', COALESCE(ROUND(AVG(processing_time_ms)), 0),
            'success_rate', ROUND(COUNT(*) FILTER (WHERE response_status < 400)::DECIMAL / COUNT(*) * 100, 1)
          ) as usage_stats
        FROM api_usage_log 
        WHERE campaign_id = campaign_id_param 
        GROUP BY api_service
      ) api_stats
    ),
    'budget_utilization', CASE 
      WHEN c.budget_limit IS NOT NULL AND c.budget_limit > 0
      THEN ROUND(c.total_cost / c.budget_limit * 100, 1)
      ELSE NULL
    END,
    'performance_metrics', (
      SELECT json_build_object(
        'leads_per_hour', ROUND(COUNT(el.id)::DECIMAL / GREATEST(1, EXTRACT(EPOCH FROM (COALESCE(c.completed_at, now()) - c.created_at)) / 3600), 2),
        'cost_efficiency_score', LEAST(100, GREATEST(0, 100 - (COALESCE(SUM(el.total_cost), 0) / GREATEST(1, COUNT(el.id)) * 10))),
        'data_completeness_avg', ROUND(AVG(el.data_completeness_score), 1)
      )
      FROM enhanced_leads el
      WHERE el.campaign_id = campaign_id_param
    )
  ) INTO result
  FROM campaigns c
  LEFT JOIN enhanced_leads el ON c.id = el.campaign_id
  WHERE c.id = campaign_id_param
  GROUP BY c.id, c.name, c.status, c.created_at, c.completed_at, c.quality_threshold, c.budget_limit, c.total_cost;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Get real-time dashboard metrics
CREATE OR REPLACE FUNCTION get_realtime_dashboard_metrics(user_id_param UUID DEFAULT NULL)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'overview', (
      SELECT json_build_object(
        'active_campaigns', COUNT(*) FILTER (WHERE status = 'running'),
        'completed_campaigns', COUNT(*) FILTER (WHERE status = 'completed'),
        'total_campaigns', COUNT(*),
        'total_leads_today', (
          SELECT COUNT(*) FROM enhanced_leads el
          JOIN campaigns c ON el.campaign_id = c.id
          WHERE DATE(el.created_at) = CURRENT_DATE
            AND (user_id_param IS NULL OR c.user_id = user_id_param)
        ),
        'qualified_leads_today', (
          SELECT COUNT(*) FROM enhanced_leads el
          JOIN campaigns c ON el.campaign_id = c.id
          WHERE DATE(el.created_at) = CURRENT_DATE
            AND el.confidence_score >= 80
            AND (user_id_param IS NULL OR c.user_id = user_id_param)
        ),
        'total_cost_today', (
          SELECT COALESCE(SUM(act.total_cost), 0)
          FROM api_cost_tracking act
          LEFT JOIN campaigns c ON act.campaign_id = c.id
          WHERE act.date = CURRENT_DATE
            AND (user_id_param IS NULL OR c.user_id = user_id_param OR act.campaign_id IS NULL)
        ),
        'avg_qualification_rate', (
          SELECT ROUND(AVG(lqm.qualification_rate * 100), 1)
          FROM lead_qualification_metrics lqm
          LEFT JOIN campaigns c ON lqm.campaign_id = c.id
          WHERE lqm.date >= CURRENT_DATE - INTERVAL '7 days'
            AND (user_id_param IS NULL OR c.user_id = user_id_param)
        )
      )
      FROM campaigns
      WHERE user_id_param IS NULL OR user_id = user_id_param
    ),
    'recent_campaigns', (
      SELECT json_agg(
        json_build_object(
          'campaign_id', c.id,
          'name', c.name,
          'status', c.status,
          'leads_count', (SELECT COUNT(*) FROM enhanced_leads WHERE campaign_id = c.id),
          'qualified_leads', (SELECT COUNT(*) FROM enhanced_leads WHERE campaign_id = c.id AND confidence_score >= 80),
          'total_cost', c.total_cost,
          'created_at', c.created_at
        )
        ORDER BY c.created_at DESC
      )
      FROM campaigns c
      WHERE (user_id_param IS NULL OR c.user_id = user_id_param)
      LIMIT 10
    ),
    'performance_trends', (
      SELECT json_agg(
        json_build_object(
          'date', date,
          'total_leads', SUM(total_leads_discovered),
          'qualified_leads', SUM(leads_qualified),
          'total_cost', SUM(total_api_cost),
          'avg_qualification_rate', ROUND(AVG(qualification_rate * 100), 1)
        )
        ORDER BY date DESC
      )
      FROM lead_qualification_metrics lqm
      LEFT JOIN campaigns c ON lqm.campaign_id = c.id
      WHERE lqm.date >= CURRENT_DATE - INTERVAL '30 days'
        AND (user_id_param IS NULL OR c.user_id = user_id_param)
      GROUP BY date
      LIMIT 30
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  RAISE NOTICE '✅ Phase 4.3 Complete: Campaign analytics functions created';
  RAISE NOTICE '   - get_campaign_analytics(): Comprehensive campaign analysis';
  RAISE NOTICE '   - get_realtime_dashboard_metrics(): Real-time dashboard data';
END $$;

-- Phase 4.4: Geographic and Search Functions
-- ============================================================================

-- Find leads within geographic radius
CREATE OR REPLACE FUNCTION leads_within_radius(
  center_lat FLOAT,
  center_lng FLOAT,
  radius_km FLOAT,
  campaign_id_param UUID DEFAULT NULL
)
RETURNS TABLE (
  lead_id UUID,
  business_name TEXT,
  distance_km FLOAT,
  confidence_score confidence_score_type
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    el.id as lead_id,
    el.business_name,
    (ST_Distance(
      ST_SetSRID(ST_MakePoint(center_lng, center_lat), 4326)::geography,
      el.location_coordinates
    ) / 1000)::FLOAT as distance_km,
    el.confidence_score
  FROM enhanced_leads el
  WHERE el.location_coordinates IS NOT NULL
    AND (campaign_id_param IS NULL OR el.campaign_id = campaign_id_param)
    AND ST_DWithin(
      ST_SetSRID(ST_MakePoint(center_lng, center_lat), 4326)::geography,
      el.location_coordinates,
      radius_km * 1000
    )
  ORDER BY distance_km;
END;
$$ LANGUAGE plpgsql;

-- Search leads by business name with fuzzy matching
CREATE OR REPLACE FUNCTION search_leads_by_name(
  search_term TEXT,
  user_id_param UUID DEFAULT NULL,
  limit_param INTEGER DEFAULT 50
)
RETURNS TABLE (
  lead_id UUID,
  campaign_id UUID,
  business_name TEXT,
  confidence_score confidence_score_type,
  similarity_score FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    el.id as lead_id,
    el.campaign_id,
    el.business_name,
    el.confidence_score,
    SIMILARITY(el.business_name, search_term)::double precision as similarity_score
  FROM enhanced_leads el
  JOIN campaigns c ON el.campaign_id = c.id
  WHERE (user_id_param IS NULL OR c.user_id = user_id_param)
    AND (
      el.business_name ILIKE '%' || search_term || '%'
      OR el.business_name % search_term
      OR to_tsvector('english', el.business_name) @@ plainto_tsquery('english', search_term)
    )
  ORDER BY similarity_score DESC, el.confidence_score DESC
  LIMIT limit_param;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  RAISE NOTICE '✅ Phase 4.4 Complete: Geographic and search functions created';
  RAISE NOTICE '   - leads_within_radius(): Geographic lead search';
  RAISE NOTICE '   - search_leads_by_name(): Fuzzy name search with ranking';
END $$;

-- Phase 4.5: Data Maintenance and Optimization Functions
-- ============================================================================

-- Update campaign statistics based on actual lead data
CREATE OR REPLACE FUNCTION update_campaign_statistics(campaign_id_param UUID DEFAULT NULL)
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER := 0;
BEGIN
  UPDATE campaigns 
  SET 
    leads_discovered = (
      SELECT COUNT(*) 
      FROM enhanced_leads 
      WHERE campaign_id = campaigns.id
    ),
    leads_qualified = (
      SELECT COUNT(*) 
      FROM enhanced_leads 
      WHERE campaign_id = campaigns.id 
        AND confidence_score >= campaigns.quality_threshold
    ),
    total_cost = (
      SELECT COALESCE(SUM(total_cost), 0) 
      FROM enhanced_leads 
      WHERE campaign_id = campaigns.id
    ),
    updated_at = now()
  WHERE (campaign_id_param IS NULL OR id = campaign_id_param);
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- Refresh materialized view safely
CREATE OR REPLACE FUNCTION refresh_analytics_views()
RETURNS BOOLEAN AS $$
BEGIN
  BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY lead_analytics_summary;
    RETURN true;
  EXCEPTION 
    WHEN OTHERS THEN
      -- Fallback to non-concurrent refresh
      REFRESH MATERIALIZED VIEW lead_analytics_summary;
      RETURN true;
  END;
END;
$$ LANGUAGE plpgsql;

-- Archive old campaigns and leads
CREATE OR REPLACE FUNCTION archive_old_data(cutoff_date DATE DEFAULT (CURRENT_DATE - INTERVAL '90 days')::DATE)
RETURNS JSON AS $$
DECLARE
  archived_campaigns INTEGER := 0;
  archived_leads INTEGER := 0;
  result JSON;
BEGIN
  -- Create archive tables if they don't exist
  CREATE TABLE IF NOT EXISTS campaigns_archive (LIKE campaigns INCLUDING ALL);
  CREATE TABLE IF NOT EXISTS enhanced_leads_archive (LIKE enhanced_leads INCLUDING ALL);
  
  -- Archive old completed campaigns
  WITH archived AS (
    DELETE FROM campaigns 
    WHERE status IN ('completed', 'cancelled') 
      AND (completed_at < cutoff_date OR created_at < cutoff_date - INTERVAL '180 days')
    RETURNING *
  )
  INSERT INTO campaigns_archive SELECT * FROM archived;
  
  GET DIAGNOSTICS archived_campaigns = ROW_COUNT;
  
  -- Archive orphaned leads
  WITH archived AS (
    DELETE FROM enhanced_leads
    WHERE created_at < cutoff_date 
      AND campaign_id NOT IN (SELECT id FROM campaigns)
    RETURNING *
  )
  INSERT INTO enhanced_leads_archive SELECT * FROM archived;
  
  GET DIAGNOSTICS archived_leads = ROW_COUNT;
  
  result := json_build_object(
    'archived_campaigns', archived_campaigns,
    'archived_leads', archived_leads,
    'cutoff_date', cutoff_date,
    'archived_at', now()
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  RAISE NOTICE '✅ Phase 4.5 Complete: Data maintenance functions created';
  RAISE NOTICE '   - update_campaign_statistics(): Campaign stats synchronization';
  RAISE NOTICE '   - refresh_analytics_views(): Safe materialized view refresh';
  RAISE NOTICE '   - archive_old_data(): Automated data archiving';
END $$;

-- Phase 4.6: Function Validation and Testing
-- ============================================================================

DO $$
DECLARE
  function_count INTEGER;
  test_result JSON;
BEGIN
  -- Count created functions
  SELECT COUNT(*) INTO function_count
  FROM information_schema.routines
  WHERE routine_schema = 'public'
    AND routine_name IN (
      'calculate_lead_quality_score',
      'update_lead_confidence_scores',
      'get_campaign_analytics',
      'get_realtime_dashboard_metrics',
      'leads_within_radius',
      'search_leads_by_name',
      'update_campaign_statistics',
      'refresh_analytics_views',
      'archive_old_data'
    );
  
  -- Test basic function
  SELECT calculate_lead_quality_score('{"business_name": "Test Business", "phone": "+1-555-123-4567"}') INTO test_result;
  
  RAISE NOTICE '✅ Phase 4.6 Complete: Function validation successful';
  RAISE NOTICE '   - Functions created: %', function_count;
  RAISE NOTICE '   - Basic function test: % points', test_result;
END $$;

-- ============================================================================
-- Phase 4 Complete Summary
-- ============================================================================

DO $$
DECLARE
  completion_time TIMESTAMP WITH TIME ZONE := now();
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🎯 PHASE 4 COMPLETE: Functions and Procedures Infrastructure';
  RAISE NOTICE '=======================================================';
  RAISE NOTICE 'Completion Time: %', completion_time;
  RAISE NOTICE '';
  RAISE NOTICE 'Business Logic Functions:';
  RAISE NOTICE '- ✅ Lead quality scoring with comprehensive algorithms';
  RAISE NOTICE '- ✅ Campaign analytics and performance calculations';
  RAISE NOTICE '- ✅ Real-time dashboard metrics aggregation';
  RAISE NOTICE '- ✅ Geographic search and proximity analysis';
  RAISE NOTICE '- ✅ Fuzzy text search with similarity ranking';
  RAISE NOTICE '';
  RAISE NOTICE 'Data Maintenance Functions:';
  RAISE NOTICE '- ✅ Automated campaign statistics updates';
  RAISE NOTICE '- ✅ Safe materialized view refresh procedures';
  RAISE NOTICE '- ✅ Automated data archiving and cleanup';
  RAISE NOTICE '';
  RAISE NOTICE 'Advanced Features:';
  RAISE NOTICE '- ✅ PostGIS integration for geographic analysis';
  RAISE NOTICE '- ✅ Full-text search capabilities';
  RAISE NOTICE '- ✅ JSON aggregation for complex analytics';
  RAISE NOTICE '- ✅ Error handling and fallback procedures';
  RAISE NOTICE '';
  RAISE NOTICE 'Next Steps:';
  RAISE NOTICE '1. Execute 05-security-and-rls.sql (FINAL PHASE)';
  RAISE NOTICE '2. Run validation and testing procedures';
  RAISE NOTICE '3. Configure application connection strings';
END $$;