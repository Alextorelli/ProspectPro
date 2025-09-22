-- Campaign Lifecycle Webhooks
-- Implements automated campaign management with event-driven processing
-- Triggers on campaign creation, completion, and error states

-- Campaign lifecycle states tracking table
CREATE TABLE IF NOT EXISTS campaign_lifecycle_log (
  id SERIAL PRIMARY KEY,
  campaign_id INTEGER NOT NULL,
  lifecycle_event VARCHAR(50) NOT NULL, -- 'created', 'processing', 'completed', 'error', 'cancelled'
  previous_state VARCHAR(50),
  new_state VARCHAR(50) NOT NULL,
  event_data JSONB,
  triggered_by VARCHAR(100), -- 'user', 'system', 'webhook'
  webhook_sent BOOLEAN DEFAULT false,
  webhook_response TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE
);

-- Index for efficient lifecycle queries
CREATE INDEX IF NOT EXISTS idx_campaign_lifecycle_campaign ON campaign_lifecycle_log(campaign_id, created_at);
CREATE INDEX IF NOT EXISTS idx_campaign_lifecycle_event ON campaign_lifecycle_log(lifecycle_event, created_at);
CREATE INDEX IF NOT EXISTS idx_campaign_lifecycle_state ON campaign_lifecycle_log(new_state, created_at);

-- Campaign processing pipeline status
CREATE TABLE IF NOT EXISTS campaign_processing_status (
  campaign_id INTEGER PRIMARY KEY,
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'error', 'cancelled'
  total_leads INTEGER DEFAULT 0,
  processed_leads INTEGER DEFAULT 0,
  qualified_leads INTEGER DEFAULT 0,
  error_leads INTEGER DEFAULT 0,
  processing_cost DECIMAL(10,4) DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  estimated_completion TIMESTAMP WITH TIME ZONE,
  current_stage VARCHAR(100), -- 'discovery', 'enrichment', 'validation', 'export'
  stage_progress DECIMAL(5,2) DEFAULT 0, -- percentage 0-100
  error_message TEXT,
  processing_metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Function to execute campaign lifecycle webhook
CREATE OR REPLACE FUNCTION execute_campaign_lifecycle_webhook(
  p_campaign_id INTEGER,
  p_lifecycle_event VARCHAR(50),
  p_event_data JSONB
) RETURNS void AS $$
DECLARE
  webhook_url TEXT;
  webhook_payload JSONB;
  response_record RECORD;
  campaign_data RECORD;
  processing_status RECORD;
BEGIN
  -- Get webhook URL from configuration
  webhook_url := current_setting('app.campaign_lifecycle_webhook_url', true);
  
  IF webhook_url IS NULL OR webhook_url = '' THEN
    RETURN; -- Skip if webhook not configured
  END IF;
  
  -- Get campaign information
  SELECT * INTO campaign_data FROM campaigns WHERE id = p_campaign_id;
  
  -- Get processing status if available
  SELECT * INTO processing_status FROM campaign_processing_status WHERE campaign_id = p_campaign_id;
  
  -- Build comprehensive webhook payload
  webhook_payload := jsonb_build_object(
    'campaign_id', p_campaign_id,
    'lifecycle_event', p_lifecycle_event,
    'event_data', COALESCE(p_event_data, '{}'::jsonb),
    'campaign_info', jsonb_build_object(
      'name', campaign_data.name,
      'user_id', campaign_data.user_id,
      'search_query', campaign_data.search_query,
      'location', campaign_data.location,
      'business_type', campaign_data.business_type,
      'target_count', campaign_data.target_count,
      'budget_limit', campaign_data.budget_limit,
      'created_at', campaign_data.created_at,
      'status', campaign_data.status
    ),
    'processing_status', CASE 
      WHEN processing_status IS NOT NULL THEN
        jsonb_build_object(
          'status', processing_status.status,
          'total_leads', processing_status.total_leads,
          'processed_leads', processing_status.processed_leads,
          'qualified_leads', processing_status.qualified_leads,
          'error_leads', processing_status.error_leads,
          'processing_cost', processing_status.processing_cost,
          'current_stage', processing_status.current_stage,
          'stage_progress', processing_status.stage_progress,
          'started_at', processing_status.started_at,
          'estimated_completion', processing_status.estimated_completion
        )
      ELSE NULL
    END,
    'webhook_metadata', jsonb_build_object(
      'trigger_time', NOW(),
      'trigger_source', 'database_trigger'
    )
  );
  
  -- Execute webhook
  BEGIN
    SELECT * INTO response_record FROM net.http_post(
      url := webhook_url,
      body := webhook_payload::text,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.webhook_token', true),
        'X-Webhook-Type', 'campaign_lifecycle',
        'X-Campaign-ID', p_campaign_id::text,
        'X-Lifecycle-Event', p_lifecycle_event
      ),
      timeout_milliseconds := 10000 -- 10 second timeout for campaign operations
    );
    
    -- Log webhook execution result
    INSERT INTO campaign_lifecycle_log (
      campaign_id,
      lifecycle_event,
      new_state,
      event_data,
      triggered_by,
      webhook_sent,
      webhook_response,
      processed_at
    ) VALUES (
      p_campaign_id,
      p_lifecycle_event,
      campaign_data.status,
      webhook_payload,
      'system',
      (response_record.status_code >= 200 AND response_record.status_code < 300),
      response_record.status_code || ': ' || response_record.content::text,
      NOW()
    );
    
  EXCEPTION WHEN OTHERS THEN
    -- Log webhook failure
    INSERT INTO campaign_lifecycle_log (
      campaign_id,
      lifecycle_event,
      new_state,
      event_data,
      triggered_by,
      webhook_sent,
      webhook_response
    ) VALUES (
      p_campaign_id,
      p_lifecycle_event,
      campaign_data.status,
      webhook_payload,
      'system',
      false,
      'Error: ' || SQLERRM
    );
  END;
END;
$$ LANGUAGE plpgsql;

-- Campaign creation trigger function
CREATE OR REPLACE FUNCTION trigger_campaign_creation_webhook()
RETURNS trigger AS $$
BEGIN
  -- Initialize processing status
  INSERT INTO campaign_processing_status (
    campaign_id,
    status,
    total_leads,
    processing_metadata
  ) VALUES (
    NEW.id,
    'pending',
    0,
    jsonb_build_object(
      'initialized_at', NOW(),
      'target_count', NEW.target_count,
      'budget_limit', NEW.budget_limit
    )
  ) ON CONFLICT (campaign_id) DO UPDATE SET
    status = 'pending',
    updated_at = NOW();
  
  -- Trigger campaign creation webhook
  PERFORM execute_campaign_lifecycle_webhook(
    NEW.id,
    'created',
    jsonb_build_object(
      'campaign_name', NEW.name,
      'search_query', NEW.search_query,
      'location', NEW.location,
      'business_type', NEW.business_type,
      'target_count', NEW.target_count,
      'budget_limit', NEW.budget_limit,
      'user_id', NEW.user_id
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Campaign status update trigger function
CREATE OR REPLACE FUNCTION trigger_campaign_status_webhook()
RETURNS trigger AS $$
DECLARE
  lifecycle_event VARCHAR(50);
  event_data JSONB;
BEGIN
  -- Skip if status hasn't changed
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;
  
  -- Determine lifecycle event based on status change
  CASE NEW.status
    WHEN 'processing' THEN
      lifecycle_event := 'processing_started';
    WHEN 'completed' THEN
      lifecycle_event := 'completed';
    WHEN 'error' THEN
      lifecycle_event := 'error';
    WHEN 'cancelled' THEN
      lifecycle_event := 'cancelled';
    ELSE
      lifecycle_event := 'status_changed';
  END CASE;
  
  -- Build event data
  event_data := jsonb_build_object(
    'old_status', OLD.status,
    'new_status', NEW.status,
    'status_changed_at', NOW(),
    'leads_found', NEW.leads_found,
    'total_cost', NEW.total_cost
  );
  
  -- Update processing status
  UPDATE campaign_processing_status SET
    status = CASE
      WHEN NEW.status = 'processing' THEN 'processing'
      WHEN NEW.status = 'completed' THEN 'completed'
      WHEN NEW.status = 'error' THEN 'error'
      WHEN NEW.status = 'cancelled' THEN 'cancelled'
      ELSE status
    END,
    completed_at = CASE WHEN NEW.status IN ('completed', 'error', 'cancelled') THEN NOW() ELSE completed_at END,
    total_leads = COALESCE(NEW.leads_found, total_leads),
    processing_cost = COALESCE(NEW.total_cost, processing_cost),
    updated_at = NOW()
  WHERE campaign_id = NEW.id;
  
  -- Trigger lifecycle webhook
  PERFORM execute_campaign_lifecycle_webhook(NEW.id, lifecycle_event, event_data);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Campaign processing progress update function
CREATE OR REPLACE FUNCTION update_campaign_progress(
  p_campaign_id INTEGER,
  p_processed_leads INTEGER DEFAULT NULL,
  p_qualified_leads INTEGER DEFAULT NULL,
  p_error_leads INTEGER DEFAULT NULL,
  p_processing_cost DECIMAL(10,4) DEFAULT NULL,
  p_current_stage VARCHAR(100) DEFAULT NULL,
  p_stage_progress DECIMAL(5,2) DEFAULT NULL,
  p_estimated_completion TIMESTAMP WITH TIME ZONE DEFAULT NULL
) RETURNS void AS $$
DECLARE
  old_progress DECIMAL(5,2);
  new_progress DECIMAL(5,2);
  significant_progress_change BOOLEAN := false;
BEGIN
  -- Get current progress
  SELECT stage_progress INTO old_progress 
  FROM campaign_processing_status 
  WHERE campaign_id = p_campaign_id;
  
  -- Update processing status
  UPDATE campaign_processing_status SET
    processed_leads = COALESCE(p_processed_leads, processed_leads),
    qualified_leads = COALESCE(p_qualified_leads, qualified_leads),
    error_leads = COALESCE(p_error_leads, error_leads),
    processing_cost = COALESCE(p_processing_cost, processing_cost),
    current_stage = COALESCE(p_current_stage, current_stage),
    stage_progress = COALESCE(p_stage_progress, stage_progress),
    estimated_completion = COALESCE(p_estimated_completion, estimated_completion),
    updated_at = NOW()
  WHERE campaign_id = p_campaign_id
  RETURNING stage_progress INTO new_progress;
  
  -- Check for significant progress change (every 25% or stage change)
  IF p_current_stage IS NOT NULL OR 
     (old_progress IS NOT NULL AND new_progress IS NOT NULL AND 
      (new_progress - old_progress) >= 25.0) THEN
    significant_progress_change := true;
  END IF;
  
  -- Trigger progress webhook for significant changes
  IF significant_progress_change THEN
    PERFORM execute_campaign_lifecycle_webhook(
      p_campaign_id,
      'progress_update',
      jsonb_build_object(
        'processed_leads', p_processed_leads,
        'qualified_leads', p_qualified_leads,
        'error_leads', p_error_leads,
        'processing_cost', p_processing_cost,
        'current_stage', p_current_stage,
        'old_progress', old_progress,
        'new_progress', new_progress,
        'estimated_completion', p_estimated_completion
      )
    );
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS campaign_creation_webhook ON campaigns;
CREATE TRIGGER campaign_creation_webhook
  AFTER INSERT ON campaigns
  FOR EACH ROW
  EXECUTE FUNCTION trigger_campaign_creation_webhook();

DROP TRIGGER IF EXISTS campaign_status_webhook ON campaigns;
CREATE TRIGGER campaign_status_webhook
  AFTER UPDATE OF status ON campaigns
  FOR EACH ROW
  EXECUTE FUNCTION trigger_campaign_status_webhook();

-- Campaign monitoring dashboard view
CREATE OR REPLACE VIEW campaign_lifecycle_dashboard AS
SELECT 
  c.id as campaign_id,
  c.name as campaign_name,
  c.status as campaign_status,
  c.user_id,
  c.created_at as campaign_created,
  
  -- Processing status
  cps.status as processing_status,
  cps.total_leads,
  cps.processed_leads,
  cps.qualified_leads,
  cps.error_leads,
  cps.processing_cost,
  cps.current_stage,
  cps.stage_progress,
  cps.started_at as processing_started,
  cps.completed_at as processing_completed,
  cps.estimated_completion,
  
  -- Progress calculations
  CASE 
    WHEN cps.total_leads > 0 THEN ROUND((cps.processed_leads::DECIMAL / cps.total_leads) * 100, 2)
    ELSE 0 
  END as completion_percentage,
  
  CASE 
    WHEN cps.qualified_leads > 0 AND cps.processed_leads > 0 
    THEN ROUND((cps.qualified_leads::DECIMAL / cps.processed_leads) * 100, 2)
    ELSE 0 
  END as qualification_rate,
  
  -- Recent lifecycle events
  (
    SELECT COUNT(*) 
    FROM campaign_lifecycle_log cll 
    WHERE cll.campaign_id = c.id 
      AND cll.created_at > NOW() - INTERVAL '24 hours'
  ) as recent_events_count,
  
  -- Last webhook status
  (
    SELECT cll.webhook_sent
    FROM campaign_lifecycle_log cll 
    WHERE cll.campaign_id = c.id 
    ORDER BY cll.created_at DESC 
    LIMIT 1
  ) as last_webhook_successful

FROM campaigns c
LEFT JOIN campaign_processing_status cps ON c.id = cps.campaign_id
ORDER BY c.created_at DESC;

-- Function to get campaign processing summary
CREATE OR REPLACE FUNCTION get_campaign_processing_summary(p_campaign_id INTEGER DEFAULT NULL)
RETURNS TABLE (
  total_campaigns INTEGER,
  active_campaigns INTEGER,
  completed_campaigns INTEGER,
  error_campaigns INTEGER,
  total_processing_cost DECIMAL(10,4),
  avg_completion_time INTERVAL,
  webhook_success_rate DECIMAL(5,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER as total_campaigns,
    COUNT(*) FILTER (WHERE cps.status IN ('pending', 'processing'))::INTEGER as active_campaigns,
    COUNT(*) FILTER (WHERE cps.status = 'completed')::INTEGER as completed_campaigns,
    COUNT(*) FILTER (WHERE cps.status = 'error')::INTEGER as error_campaigns,
    COALESCE(SUM(cps.processing_cost), 0) as total_processing_cost,
    AVG(cps.completed_at - cps.started_at) as avg_completion_time,
    CASE 
      WHEN COUNT(cll.webhook_sent) > 0 
      THEN ROUND(
        (COUNT(*) FILTER (WHERE cll.webhook_sent = true)::DECIMAL / 
         COUNT(cll.webhook_sent)) * 100, 2
      )
      ELSE 0 
    END as webhook_success_rate
  FROM campaigns c
  LEFT JOIN campaign_processing_status cps ON c.id = cps.campaign_id
  LEFT JOIN campaign_lifecycle_log cll ON c.id = cll.campaign_id
  WHERE (p_campaign_id IS NULL OR c.id = p_campaign_id);
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT ALL ON campaign_lifecycle_log TO postgres, authenticated;
GRANT ALL ON campaign_processing_status TO postgres, authenticated;
GRANT SELECT ON campaign_lifecycle_dashboard TO postgres, authenticated;

-- Set default webhook configuration
-- ALTER DATABASE SET app.campaign_lifecycle_webhook_url = 'https://your-domain.com/api/webhooks/campaign-lifecycle';

COMMENT ON TABLE campaign_lifecycle_log IS 'Tracks all campaign lifecycle events and webhook executions';
COMMENT ON TABLE campaign_processing_status IS 'Real-time campaign processing status and progress tracking';
COMMENT ON FUNCTION execute_campaign_lifecycle_webhook IS 'Executes campaign lifecycle webhooks with comprehensive payload';
COMMENT ON FUNCTION update_campaign_progress IS 'Updates campaign processing progress and triggers progress webhooks';
COMMENT ON VIEW campaign_lifecycle_dashboard IS 'Comprehensive dashboard view of campaign processing status';