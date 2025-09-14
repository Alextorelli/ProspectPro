-- Enhanced ProspectPro Database Schema
-- Advanced lead management with real-time capabilities and comprehensive analytics

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Enhanced leads table with rich metadata and quality scoring
CREATE TABLE IF NOT EXISTS enhanced_leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Basic business data
  business_name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  website TEXT,
  
  -- Enhanced intelligence fields
  confidence_score INTEGER DEFAULT 0 CHECK (confidence_score >= 0 AND confidence_score <= 100),
  business_type TEXT[],
  owner_name TEXT,
  employee_count INTEGER,
  
  -- API source attribution
  discovery_source TEXT, -- 'google_places', 'scrapingdog_maps', etc.
  enrichment_sources JSONB DEFAULT '{}',
  validation_sources JSONB DEFAULT '{}',
  
  -- Cost tracking
  discovery_cost DECIMAL(10,4) DEFAULT 0.00,
  enrichment_cost DECIMAL(10,4) DEFAULT 0.00,
  total_cost DECIMAL(10,4) GENERATED ALWAYS AS (discovery_cost + enrichment_cost) STORED,
  
  -- Quality metrics
  data_completeness_score INTEGER DEFAULT 0 CHECK (data_completeness_score >= 0 AND data_completeness_score <= 100),
  email_verified BOOLEAN DEFAULT false,
  website_status INTEGER, -- HTTP status code
  social_verified BOOLEAN DEFAULT false,
  
  -- Campaign tracking
  campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
  export_status TEXT DEFAULT 'pending' CHECK (export_status IN ('pending', 'exported', 'excluded')),
  exported_at TIMESTAMP WITH TIME ZONE,
  
  -- Search and filtering
  search_query TEXT,
  location_coordinates POINT,
  search_radius_km INTEGER,
  
  -- Rich metadata
  metadata JSONB DEFAULT '{}',
  
  -- Indexes for performance
  CONSTRAINT valid_confidence_score CHECK (confidence_score BETWEEN 0 AND 100),
  CONSTRAINT valid_completeness_score CHECK (data_completeness_score BETWEEN 0 AND 100)
);

-- Email tracking table with verification details
CREATE TABLE IF NOT EXISTS lead_emails (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES enhanced_leads(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  source TEXT, -- 'hunter_io', 'scraped', 'pattern_generated'
  verification_status TEXT CHECK (verification_status IN ('deliverable', 'undeliverable', 'risky', 'unknown')),
  verification_score INTEGER CHECK (verification_score >= 0 AND verification_score <= 100),
  discovery_cost DECIMAL(8,4) DEFAULT 0.00,
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  UNIQUE(lead_id, email)
);

-- Social media profiles table
CREATE TABLE IF NOT EXISTS lead_social_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES enhanced_leads(id) ON DELETE CASCADE NOT NULL,
  platform TEXT NOT NULL, -- 'linkedin', 'facebook', 'twitter', 'instagram'
  profile_url TEXT,
  username TEXT,
  followers_count INTEGER,
  verification_status TEXT DEFAULT 'pending',
  scraped_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  UNIQUE(lead_id, platform)
);

-- Campaign management table
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL, -- From auth.users
  name TEXT NOT NULL,
  search_parameters JSONB NOT NULL,
  status TEXT DEFAULT 'running' CHECK (status IN ('running', 'paused', 'completed', 'cancelled')),
  
  -- Budget and limits
  budget_limit DECIMAL(10,2),
  lead_limit INTEGER,
  quality_threshold INTEGER DEFAULT 70 CHECK (quality_threshold >= 0 AND quality_threshold <= 100),
  
  -- Performance tracking
  leads_discovered INTEGER DEFAULT 0,
  leads_qualified INTEGER DEFAULT 0,
  total_cost DECIMAL(10,2) DEFAULT 0.00,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  
  CONSTRAINT positive_budget CHECK (budget_limit IS NULL OR budget_limit > 0),
  CONSTRAINT positive_lead_limit CHECK (lead_limit IS NULL OR lead_limit > 0)
);

-- API usage tracking for cost analytics
CREATE TABLE IF NOT EXISTS api_usage_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
  api_service TEXT NOT NULL, -- 'hunter_io', 'scrapingdog', 'phantombuster'
  endpoint TEXT,
  request_cost DECIMAL(8,4),
  response_status INTEGER,
  credits_used INTEGER DEFAULT 1,
  processing_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_enhanced_leads_confidence ON enhanced_leads(confidence_score DESC);
CREATE INDEX IF NOT EXISTS idx_enhanced_leads_cost ON enhanced_leads(total_cost);
CREATE INDEX IF NOT EXISTS idx_enhanced_leads_campaign ON enhanced_leads(campaign_id);
CREATE INDEX IF NOT EXISTS idx_enhanced_leads_created ON enhanced_leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_enhanced_leads_export_status ON enhanced_leads(export_status);
CREATE INDEX IF NOT EXISTS idx_enhanced_leads_location ON enhanced_leads USING GIST(location_coordinates);

CREATE INDEX IF NOT EXISTS idx_lead_emails_lead_id ON lead_emails(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_emails_verification ON lead_emails(verification_status);

CREATE INDEX IF NOT EXISTS idx_lead_social_profiles_lead_id ON lead_social_profiles(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_social_profiles_platform ON lead_social_profiles(platform);

CREATE INDEX IF NOT EXISTS idx_campaigns_user_id ON campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_created ON campaigns(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_api_usage_campaign_id ON api_usage_log(campaign_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_service ON api_usage_log(api_service);
CREATE INDEX IF NOT EXISTS idx_api_usage_created ON api_usage_log(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE enhanced_leads ENABLE ROW LEVEL SECURITY;  
ALTER TABLE lead_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_social_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for multi-tenant security

-- Users can only access their own campaigns
CREATE POLICY "Users can view their own campaigns" ON campaigns
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own campaigns" ON campaigns
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own campaigns" ON campaigns
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can only access leads from their campaigns
CREATE POLICY "Users can view leads from their campaigns" ON enhanced_leads
  FOR SELECT USING (
    campaign_id IN (
      SELECT id FROM campaigns WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert leads" ON enhanced_leads
  FOR INSERT WITH CHECK (
    campaign_id IN (
      SELECT id FROM campaigns WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update leads from their campaigns" ON enhanced_leads
  FOR UPDATE USING (
    campaign_id IN (
      SELECT id FROM campaigns WHERE user_id = auth.uid()
    )
  );

-- Users can view emails from their leads
CREATE POLICY "Users can view emails from their leads" ON lead_emails
  FOR SELECT USING (
    lead_id IN (
      SELECT el.id FROM enhanced_leads el
      JOIN campaigns c ON el.campaign_id = c.id
      WHERE c.user_id = auth.uid()
    )
  );

-- Users can view social profiles from their leads
CREATE POLICY "Users can view social profiles from their leads" ON lead_social_profiles
  FOR SELECT USING (
    lead_id IN (
      SELECT el.id FROM enhanced_leads el
      JOIN campaigns c ON el.campaign_id = c.id
      WHERE c.user_id = auth.uid()
    )
  );

-- Users can view API usage logs from their campaigns
CREATE POLICY "Users can view API usage from their campaigns" ON api_usage_log
  FOR SELECT USING (
    campaign_id IN (
      SELECT id FROM campaigns WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert API usage logs" ON api_usage_log
  FOR INSERT WITH CHECK (
    campaign_id IN (
      SELECT id FROM campaigns WHERE user_id = auth.uid()
    )
  );

-- PostgreSQL Functions for Business Logic

-- Calculate comprehensive campaign analytics
CREATE OR REPLACE FUNCTION campaign_analytics(campaign_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'campaign_id', c.id,
    'campaign_name', c.name,
    'status', c.status,
    'created_at', c.created_at,
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
    'quality_distribution', (
      SELECT json_build_object(
        'excellent', COUNT(*) FILTER (WHERE confidence_score >= 90),
        'very_good', COUNT(*) FILTER (WHERE confidence_score >= 80 AND confidence_score < 90),
        'good', COUNT(*) FILTER (WHERE confidence_score >= 70 AND confidence_score < 80),
        'average', COUNT(*) FILTER (WHERE confidence_score >= 50 AND confidence_score < 70),
        'poor', COUNT(*) FILTER (WHERE confidence_score < 50)
      )
      FROM enhanced_leads WHERE campaign_id = $1
    ),
    'email_discovery_stats', (
      SELECT json_build_object(
        'leads_with_emails', COUNT(DISTINCT el.id),
        'total_emails_found', COUNT(le.id),
        'verified_deliverable', COUNT(le.id) FILTER (WHERE le.verification_status = 'deliverable'),
        'verification_rate', CASE 
          WHEN COUNT(le.id) > 0 
          THEN ROUND(COUNT(le.id) FILTER (WHERE le.verification_status = 'deliverable')::numeric / COUNT(le.id) * 100, 1)
          ELSE 0 
        END
      )
      FROM enhanced_leads el
      LEFT JOIN lead_emails le ON el.id = le.lead_id
      WHERE el.campaign_id = $1
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
            'success_rate', ROUND(COUNT(*) FILTER (WHERE response_status < 400)::numeric / COUNT(*) * 100, 1)
          ) as usage_stats
        FROM api_usage_log 
        WHERE campaign_id = $1 
        GROUP BY api_service
      ) api_stats
    ),
    'budget_utilization', CASE 
      WHEN c.budget_limit IS NOT NULL AND c.budget_limit > 0
      THEN ROUND(c.total_cost / c.budget_limit * 100, 1)
      ELSE NULL
    END
  ) INTO result
  FROM campaigns c
  LEFT JOIN enhanced_leads el ON c.id = el.campaign_id
  WHERE c.id = $1
  GROUP BY c.id, c.name, c.status, c.created_at, c.quality_threshold, c.budget_limit, c.total_cost;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Geographic lead search function
CREATE OR REPLACE FUNCTION leads_within_radius(
  center_lat float,
  center_lng float,
  radius_km float
)
RETURNS TABLE (
  lead_id UUID,
  distance_km float
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    el.id as lead_id,
    (ST_Distance(
      ST_GeogFromText('POINT(' || center_lng || ' ' || center_lat || ')'),
      ST_GeogFromText('POINT(' || ST_X(el.location_coordinates) || ' ' || ST_Y(el.location_coordinates) || ')')
    ) / 1000)::float as distance_km
  FROM enhanced_leads el
  WHERE el.location_coordinates IS NOT NULL
    AND ST_DWithin(
      ST_GeogFromText('POINT(' || center_lng || ' ' || center_lat || ')'),
      ST_GeogFromText('POINT(' || ST_X(el.location_coordinates) || ' ' || ST_Y(el.location_coordinates) || ')'),
      radius_km * 1000
    )
  ORDER BY distance_km;
END;
$$ LANGUAGE plpgsql;

-- Lead quality scoring function
CREATE OR REPLACE FUNCTION calculate_lead_quality_score(lead_data JSON)
RETURNS INTEGER AS $$
DECLARE
  score INTEGER := 0;
BEGIN
  -- Basic completeness (40 points max)
  IF lead_data->>'business_name' IS NOT NULL AND LENGTH(lead_data->>'business_name') > 0 THEN
    score := score + 10;
  END IF;
  
  IF lead_data->>'phone' IS NOT NULL AND LENGTH(lead_data->>'phone') >= 10 THEN
    score := score + 10;
  END IF;
  
  IF lead_data->>'address' IS NOT NULL AND LENGTH(lead_data->>'address') > 0 THEN
    score := score + 10;
  END IF;
  
  IF lead_data->>'website' IS NOT NULL AND lead_data->>'website' LIKE 'http%' THEN
    score := score + 10;
  END IF;
  
  -- Email verification (30 points max)
  IF (lead_data->>'email_verified')::boolean = true THEN
    score := score + 20;
  ELSIF lead_data->>'email' IS NOT NULL THEN
    score := score + 10;
  END IF;
  
  -- Additional verification bonuses (30 points max)
  IF (lead_data->'enrichment_sources'->>'government_registry')::boolean = true THEN
    score := score + 15;
  END IF;
  
  IF (lead_data->>'social_verified')::boolean = true THEN
    score := score + 10;
  END IF;
  
  IF lead_data->'metadata'->>'review_sentiment' IS NOT NULL THEN
    score := score + 5;
  END IF;
  
  RETURN LEAST(100, score);
END;
$$ LANGUAGE plpgsql;

-- Archive old campaigns function
CREATE OR REPLACE FUNCTION archive_old_campaigns(cutoff_date TIMESTAMP WITH TIME ZONE)
RETURNS INTEGER AS $$
DECLARE
  archived_count INTEGER;
BEGIN
  -- Create archive table if it doesn't exist
  CREATE TABLE IF NOT EXISTS campaigns_archive (LIKE campaigns INCLUDING ALL);
  
  -- Move old campaigns to archive
  WITH moved_campaigns AS (
    DELETE FROM campaigns 
    WHERE completed_at < cutoff_date 
      OR (status IN ('completed', 'cancelled') AND created_at < cutoff_date - INTERVAL '30 days')
    RETURNING *
  )
  INSERT INTO campaigns_archive SELECT * FROM moved_campaigns;
  
  GET DIAGNOSTICS archived_count = ROW_COUNT;
  
  RETURN archived_count;
END;
$$ LANGUAGE plpgsql;

-- Performance optimization: Update statistics
CREATE OR REPLACE FUNCTION update_lead_statistics()
RETURNS VOID AS $$
BEGIN
  -- Update campaign statistics based on actual lead data
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
    );
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically update campaign stats
CREATE OR REPLACE FUNCTION trigger_update_campaign_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the campaign statistics when a lead is inserted or updated
  UPDATE campaigns 
  SET 
    leads_discovered = (
      SELECT COUNT(*) 
      FROM enhanced_leads 
      WHERE campaign_id = NEW.campaign_id
    ),
    leads_qualified = (
      SELECT COUNT(*) 
      FROM enhanced_leads 
      WHERE campaign_id = NEW.campaign_id 
        AND confidence_score >= campaigns.quality_threshold
    ),
    total_cost = (
      SELECT COALESCE(SUM(total_cost), 0) 
      FROM enhanced_leads 
      WHERE campaign_id = NEW.campaign_id
    )
  WHERE id = NEW.campaign_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS update_campaign_stats_trigger ON enhanced_leads;
CREATE TRIGGER update_campaign_stats_trigger
  AFTER INSERT OR UPDATE ON enhanced_leads
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_campaign_stats();

-- Create materialized view for lead analytics (optional - for performance)
CREATE MATERIALIZED VIEW IF NOT EXISTS lead_analytics_summary AS
SELECT 
  c.id as campaign_id,
  c.name as campaign_name,
  c.user_id,
  COUNT(el.id) as total_leads,
  COUNT(el.id) FILTER (WHERE el.confidence_score >= 70) as qualified_leads,
  ROUND(AVG(el.confidence_score), 1) as avg_confidence,
  SUM(el.total_cost) as total_cost,
  COUNT(le.id) as total_emails,
  COUNT(le.id) FILTER (WHERE le.verification_status = 'deliverable') as verified_emails,
  COUNT(lsp.id) as social_profiles,
  c.created_at
FROM campaigns c
LEFT JOIN enhanced_leads el ON c.id = el.campaign_id
LEFT JOIN lead_emails le ON el.id = le.lead_id
LEFT JOIN lead_social_profiles lsp ON el.id = lsp.lead_id
GROUP BY c.id, c.name, c.user_id, c.created_at;

-- Create index on the materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_lead_analytics_summary_campaign_id 
ON lead_analytics_summary(campaign_id);

-- Function to refresh the materialized view
CREATE OR REPLACE FUNCTION refresh_lead_analytics()
RETURNS VOID AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY lead_analytics_summary;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- MONITORING DASHBOARD INTEGRATION TABLES
-- ============================================================================

-- Campaign analytics for dashboard monitoring
CREATE TABLE IF NOT EXISTS campaign_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  metric_name TEXT NOT NULL,
  metric_value DECIMAL(12,4),
  metric_type TEXT, -- 'cost', 'usage', 'performance', 'quality'
  api_service TEXT, -- 'hunter_io', 'scrapingdog', 'google_places'
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
  metadata JSONB DEFAULT '{}',
  
  CONSTRAINT valid_metric_type CHECK (metric_type IN ('cost', 'usage', 'performance', 'quality'))
);

-- API cost tracking for dashboard monitoring
CREATE TABLE IF NOT EXISTS api_cost_tracking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  api_service TEXT NOT NULL,
  endpoint TEXT,
  request_count INTEGER DEFAULT 1,
  cost_per_request DECIMAL(8,4),
  total_cost DECIMAL(10,4),
  success_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  avg_response_time_ms INTEGER,
  rate_limit_remaining INTEGER,
  date DATE DEFAULT CURRENT_DATE,
  hour INTEGER DEFAULT EXTRACT(hour FROM now()),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Lead qualification metrics for dashboard
CREATE TABLE IF NOT EXISTS lead_qualification_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  total_leads_discovered INTEGER DEFAULT 0,
  leads_qualified INTEGER DEFAULT 0,
  qualification_rate DECIMAL(5,4), -- Calculated: qualified/total
  avg_confidence_score DECIMAL(5,2),
  total_api_calls INTEGER DEFAULT 0,
  total_api_cost DECIMAL(10,4) DEFAULT 0,
  cost_per_qualified_lead DECIMAL(8,4),
  roi_percentage DECIMAL(8,4),
  date DATE DEFAULT CURRENT_DATE,
  hour INTEGER DEFAULT EXTRACT(hour FROM now()),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Real-time service health for dashboard monitoring
CREATE TABLE IF NOT EXISTS service_health_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  service_name TEXT NOT NULL, -- 'hunter_io', 'scrapingdog', 'google_places'
  status TEXT NOT NULL, -- 'healthy', 'degraded', 'down'
  response_time_ms INTEGER,
  error_rate DECIMAL(5,4), -- Percentage
  rate_limit_remaining INTEGER,
  cost_budget_remaining DECIMAL(10,2),
  requests_today INTEGER DEFAULT 0,
  cost_today DECIMAL(10,2) DEFAULT 0.00,
  last_successful_call TIMESTAMP WITH TIME ZONE,
  last_error TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Dashboard export logs
CREATE TABLE IF NOT EXISTS dashboard_exports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  export_type TEXT NOT NULL, -- 'cost_analysis', 'campaign_performance', 'roi_report'
  file_format TEXT NOT NULL, -- 'csv', 'excel', 'json'
  start_date DATE,
  end_date DATE,
  campaign_ids UUID[],
  row_count INTEGER,
  file_size_mb DECIMAL(8,2),
  export_status TEXT DEFAULT 'completed' CHECK (export_status IN ('pending', 'completed', 'failed')),
  download_url TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indexes for monitoring dashboard performance
CREATE INDEX IF NOT EXISTS idx_campaign_analytics_campaign_date ON campaign_analytics(campaign_id, DATE(timestamp));
CREATE INDEX IF NOT EXISTS idx_campaign_analytics_metric_type ON campaign_analytics(metric_type, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_api_cost_tracking_service_date ON api_cost_tracking(api_service, date, hour);
CREATE INDEX IF NOT EXISTS idx_api_cost_tracking_campaign ON api_cost_tracking(campaign_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_lead_qualification_date ON lead_qualification_metrics(date DESC, hour DESC);
CREATE INDEX IF NOT EXISTS idx_lead_qualification_campaign ON lead_qualification_metrics(campaign_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_service_health_service_timestamp ON service_health_metrics(service_name, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_dashboard_exports_user_created ON dashboard_exports(user_id, created_at DESC);

-- ============================================================================
-- MONITORING DASHBOARD FUNCTIONS
-- ============================================================================

-- Calculate comprehensive cost per qualified lead for dashboards
CREATE OR REPLACE FUNCTION calculate_cost_per_qualified_lead_dashboard(
  campaign_id_param UUID DEFAULT NULL,
  start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
  end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  campaign_id UUID,
  campaign_name TEXT,
  total_api_cost DECIMAL(10,4),
  total_qualified_leads INTEGER,
  cost_per_qualified_lead DECIMAL(8,4),
  roi_percentage DECIMAL(8,4),
  efficiency_score INTEGER,
  trend_direction TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id as campaign_id,
    c.name as campaign_name,
    COALESCE(SUM(act.total_cost), 0) as total_api_cost,
    COALESCE(SUM(lqm.leads_qualified), 0) as total_qualified_leads,
    CASE 
      WHEN SUM(lqm.leads_qualified) > 0 
      THEN ROUND(SUM(act.total_cost) / SUM(lqm.leads_qualified), 4)
      ELSE 0 
    END as cost_per_qualified_lead,
    CASE 
      WHEN SUM(act.total_cost) > 0 
      THEN ROUND((SUM(lqm.leads_qualified) * 10.00 - SUM(act.total_cost)) / SUM(act.total_cost) * 100, 4)
      ELSE 0 
    END as roi_percentage,
    -- Efficiency score (0-100) based on cost per lead and qualification rate
    LEAST(100, GREATEST(0, 
      100 - (CASE 
        WHEN SUM(lqm.leads_qualified) > 0 
        THEN (SUM(act.total_cost) / SUM(lqm.leads_qualified)) * 100
        ELSE 100 
      END)::INTEGER
    )) as efficiency_score,
    -- Trend direction based on last 7 days vs previous 7 days
    CASE 
      WHEN LAG(SUM(act.total_cost)) OVER (ORDER BY c.id) IS NULL THEN 'stable'
      WHEN SUM(act.total_cost) > LAG(SUM(act.total_cost)) OVER (ORDER BY c.id) THEN 'improving'
      ELSE 'declining'
    END as trend_direction
  FROM campaigns c
  LEFT JOIN api_cost_tracking act ON c.id = act.campaign_id 
    AND act.date BETWEEN start_date AND end_date
  LEFT JOIN lead_qualification_metrics lqm ON c.id = lqm.campaign_id 
    AND lqm.date BETWEEN start_date AND end_date
  WHERE (campaign_id_param IS NULL OR c.id = campaign_id_param)
    AND c.status IN ('running', 'completed')
  GROUP BY c.id, c.name
  ORDER BY cost_per_qualified_lead ASC;
END;
$$ LANGUAGE plpgsql;

-- Real-time dashboard metrics function
CREATE OR REPLACE FUNCTION get_dashboard_realtime_metrics()
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'overview', (
      SELECT json_build_object(
        'active_campaigns', COUNT(*) FILTER (WHERE status = 'running'),
        'total_leads_today', (
          SELECT COUNT(*) FROM enhanced_leads 
          WHERE DATE(created_at) = CURRENT_DATE
        ),
        'qualified_leads_today', (
          SELECT COUNT(*) FROM enhanced_leads 
          WHERE DATE(created_at) = CURRENT_DATE AND confidence_score >= 80
        ),
        'total_cost_today', (
          SELECT COALESCE(SUM(total_cost), 0) 
          FROM api_cost_tracking 
          WHERE date = CURRENT_DATE
        ),
        'avg_qualification_rate', (
          SELECT ROUND(AVG(qualification_rate * 100), 1)
          FROM lead_qualification_metrics 
          WHERE date >= CURRENT_DATE - INTERVAL '7 days'
        )
      )
      FROM campaigns
    ),
    'service_health', (
      SELECT json_object_agg(
        service_name, 
        json_build_object(
          'status', status,
          'response_time_ms', response_time_ms,
          'error_rate', error_rate,
          'rate_limit_remaining', rate_limit_remaining,
          'cost_budget_remaining', cost_budget_remaining,
          'requests_today', requests_today,
          'last_updated', timestamp
        )
      )
      FROM (
        SELECT DISTINCT ON (service_name) 
          service_name, status, response_time_ms, error_rate,
          rate_limit_remaining, cost_budget_remaining, requests_today, timestamp
        FROM service_health_metrics 
        ORDER BY service_name, timestamp DESC
      ) latest_health
    ),
    'hourly_performance', (
      SELECT json_agg(
        json_build_object(
          'hour', hour,
          'total_requests', SUM(request_count),
          'total_cost', SUM(total_cost),
          'success_rate', ROUND(SUM(success_count)::numeric / NULLIF(SUM(request_count), 0) * 100, 1),
          'avg_response_time', ROUND(AVG(avg_response_time_ms))
        )
        ORDER BY hour DESC
      )
      FROM api_cost_tracking 
      WHERE date = CURRENT_DATE
      GROUP BY hour
      LIMIT 24
    ),
    'top_performing_campaigns', (
      SELECT json_agg(
        json_build_object(
          'campaign_id', campaign_id,
          'campaign_name', campaign_name,
          'qualified_leads', total_qualified_leads,
          'cost_per_lead', cost_per_qualified_lead,
          'roi_percentage', roi_percentage,
          'efficiency_score', efficiency_score
        )
        ORDER BY efficiency_score DESC
      )
      FROM calculate_cost_per_qualified_lead_dashboard(NULL, CURRENT_DATE - INTERVAL '7 days', CURRENT_DATE)
      LIMIT 10
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- API service breakdown for dashboard
CREATE OR REPLACE FUNCTION get_api_service_breakdown(
  start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
  end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  api_service TEXT,
  total_requests INTEGER,
  total_cost DECIMAL(10,4),
  success_rate DECIMAL(5,2),
  avg_response_time_ms INTEGER,
  cost_per_request DECIMAL(8,4),
  trend_7day TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    act.api_service,
    SUM(act.request_count)::INTEGER as total_requests,
    SUM(act.total_cost) as total_cost,
    ROUND(
      SUM(act.success_count)::numeric / NULLIF(SUM(act.request_count), 0) * 100, 2
    ) as success_rate,
    ROUND(AVG(act.avg_response_time_ms))::INTEGER as avg_response_time_ms,
    ROUND(
      SUM(act.total_cost) / NULLIF(SUM(act.request_count), 0), 4
    ) as cost_per_request,
    CASE 
      WHEN AVG(CASE WHEN act.date >= end_date - INTERVAL '7 days' THEN act.total_cost END) >
           AVG(CASE WHEN act.date < end_date - INTERVAL '7 days' THEN act.total_cost END)
      THEN 'increasing'
      WHEN AVG(CASE WHEN act.date >= end_date - INTERVAL '7 days' THEN act.total_cost END) <
           AVG(CASE WHEN act.date < end_date - INTERVAL '7 days' THEN act.total_cost END)
      THEN 'decreasing'
      ELSE 'stable'
    END as trend_7day
  FROM api_cost_tracking act
  WHERE act.date BETWEEN start_date AND end_date
  GROUP BY act.api_service
  ORDER BY total_cost DESC;
END;
$$ LANGUAGE plpgsql;

-- Export data preparation function for dashboards
CREATE OR REPLACE FUNCTION prepare_dashboard_export_data(
  export_type TEXT,
  start_date DATE,
  end_date DATE,
  campaign_ids UUID[] DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  CASE export_type
    WHEN 'cost_analysis' THEN
      SELECT json_build_object(
        'export_type', 'cost_analysis',
        'date_range', json_build_object('start', start_date, 'end', end_date),
        'campaign_performance', (
          SELECT json_agg(row_to_json(cpq))
          FROM calculate_cost_per_qualified_lead_dashboard(
            NULL, start_date, end_date
          ) cpq
          WHERE campaign_ids IS NULL OR cpq.campaign_id = ANY(campaign_ids)
        ),
        'api_breakdown', (
          SELECT json_agg(row_to_json(asb))
          FROM get_api_service_breakdown(start_date, end_date) asb
        ),
        'daily_trends', (
          SELECT json_agg(
            json_build_object(
              'date', date,
              'total_cost', SUM(total_cost),
              'total_requests', SUM(request_count),
              'qualified_leads', (
                SELECT COUNT(*) FROM enhanced_leads el
                JOIN campaigns c ON el.campaign_id = c.id
                WHERE DATE(el.created_at) = act.date
                AND el.confidence_score >= 80
                AND (campaign_ids IS NULL OR c.id = ANY(campaign_ids))
              )
            )
            ORDER BY date
          )
          FROM api_cost_tracking act
          WHERE act.date BETWEEN start_date AND end_date
          AND (campaign_ids IS NULL OR act.campaign_id = ANY(campaign_ids))
          GROUP BY date
        )
      ) INTO result;
      
    WHEN 'campaign_performance' THEN
      SELECT json_build_object(
        'export_type', 'campaign_performance',
        'campaigns', (
          SELECT json_agg(
            json_build_object(
              'campaign_id', c.id,
              'name', c.name,
              'status', c.status,
              'created_at', c.created_at,
              'total_leads', COUNT(el.id),
              'qualified_leads', COUNT(el.id) FILTER (WHERE el.confidence_score >= 80),
              'total_cost', COALESCE(SUM(el.total_cost), 0),
              'avg_confidence_score', ROUND(AVG(el.confidence_score), 2)
            )
          )
          FROM campaigns c
          LEFT JOIN enhanced_leads el ON c.id = el.campaign_id
          WHERE c.created_at BETWEEN start_date AND end_date + INTERVAL '1 day'
          AND (campaign_ids IS NULL OR c.id = ANY(campaign_ids))
          GROUP BY c.id, c.name, c.status, c.created_at
        )
      ) INTO result;
      
    ELSE
      SELECT json_build_object('error', 'Invalid export type') INTO result;
  END CASE;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Enable RLS on monitoring tables
ALTER TABLE campaign_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_cost_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_qualification_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_health_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_exports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for monitoring tables
CREATE POLICY "Users can view campaign analytics from their campaigns" ON campaign_analytics
  FOR SELECT USING (
    campaign_id IN (
      SELECT id FROM campaigns WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert campaign analytics" ON campaign_analytics
  FOR INSERT WITH CHECK (
    campaign_id IN (
      SELECT id FROM campaigns WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view API cost tracking from their campaigns" ON api_cost_tracking
  FOR SELECT USING (
    campaign_id IN (
      SELECT id FROM campaigns WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert API cost tracking" ON api_cost_tracking
  FOR INSERT WITH CHECK (
    campaign_id IN (
      SELECT id FROM campaigns WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view lead qualification metrics from their campaigns" ON lead_qualification_metrics
  FOR SELECT USING (
    campaign_id IN (
      SELECT id FROM campaigns WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert lead qualification metrics" ON lead_qualification_metrics
  FOR INSERT WITH CHECK (
    campaign_id IN (
      SELECT id FROM campaigns WHERE user_id = auth.uid()
    )
  );

-- Service health metrics can be viewed by all authenticated users
CREATE POLICY "Users can view service health metrics" ON service_health_metrics
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "System can insert service health metrics" ON service_health_metrics
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Dashboard exports for user's own exports
CREATE POLICY "Users can view their own dashboard exports" ON dashboard_exports
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own dashboard exports" ON dashboard_exports
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Grant necessary permissions (adjust as needed for your setup)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
-- GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
-- GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;