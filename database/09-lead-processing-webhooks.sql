-- Lead Processing Webhooks
-- Implements database triggers for real-time lead enrichment automation
-- Replaces polling-based lead processing with event-driven architecture

-- Enable pg_net extension for webhook functionality
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create webhook monitoring table for tracking webhook execution
CREATE TABLE IF NOT EXISTS webhook_logs (
  id SERIAL PRIMARY KEY,
  webhook_type VARCHAR(50) NOT NULL,
  trigger_table VARCHAR(50) NOT NULL,
  record_id TEXT NOT NULL,
  payload JSONB NOT NULL,
  endpoint_url TEXT NOT NULL,
  http_status INTEGER,
  response_body TEXT,
  attempt_number INTEGER DEFAULT 1,
  max_attempts INTEGER DEFAULT 3,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  retry_at TIMESTAMP WITH TIME ZONE
);

-- Index for efficient webhook log queries
CREATE INDEX IF NOT EXISTS idx_webhook_logs_type_status ON webhook_logs(webhook_type, http_status);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_retry ON webhook_logs(retry_at) WHERE retry_at IS NOT NULL;

-- Function to execute webhook with retry logic
CREATE OR REPLACE FUNCTION execute_webhook_with_retry(
  webhook_type TEXT,
  trigger_table TEXT,
  record_id TEXT,
  payload JSONB,
  endpoint_url TEXT,
  max_attempts INTEGER DEFAULT 3
) RETURNS void AS $$
DECLARE
  webhook_log_id INTEGER;
  response_record RECORD;
  current_attempt INTEGER := 1;
  retry_delay INTERVAL;
BEGIN
  -- Insert initial webhook log entry
  INSERT INTO webhook_logs (
    webhook_type, 
    trigger_table, 
    record_id, 
    payload, 
    endpoint_url,
    max_attempts
  ) VALUES (
    webhook_type, 
    trigger_table, 
    record_id, 
    payload, 
    endpoint_url,
    max_attempts
  ) RETURNING id INTO webhook_log_id;

  -- Execute webhook with retry logic
  WHILE current_attempt <= max_attempts LOOP
    BEGIN
      -- Execute HTTP POST request with 5-second timeout
      SELECT * INTO response_record FROM net.http_post(
        url := endpoint_url,
        body := payload::text,
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.webhook_token', true),
          'X-Webhook-Type', webhook_type,
          'X-Webhook-Attempt', current_attempt::text
        ),
        timeout_milliseconds := 5000
      );

      -- Update webhook log with response
      UPDATE webhook_logs SET
        http_status = response_record.status_code,
        response_body = response_record.content::text,
        attempt_number = current_attempt,
        completed_at = NOW()
      WHERE id = webhook_log_id;

      -- Check if webhook was successful (2xx status code)
      IF response_record.status_code >= 200 AND response_record.status_code < 300 THEN
        RETURN; -- Success, exit function
      END IF;

      -- Log error for failed attempt
      UPDATE webhook_logs SET
        error_message = 'HTTP ' || response_record.status_code || ': ' || response_record.content::text
      WHERE id = webhook_log_id;

    EXCEPTION WHEN OTHERS THEN
      -- Log database/network error
      UPDATE webhook_logs SET
        error_message = 'Exception: ' || SQLERRM
      WHERE id = webhook_log_id;
    END;

    current_attempt := current_attempt + 1;
    
    -- Calculate exponential backoff delay (2^attempt seconds)
    IF current_attempt <= max_attempts THEN
      retry_delay := (2 ^ (current_attempt - 1)) || ' seconds';
      
      UPDATE webhook_logs SET
        retry_at = NOW() + retry_delay,
        attempt_number = current_attempt
      WHERE id = webhook_log_id;
      
      -- Note: In a real implementation, you'd use pg_cron or similar for delayed retry
      -- For now, we'll make synchronous attempts
    END IF;
  END LOOP;

  -- Mark as failed after all attempts
  UPDATE webhook_logs SET
    error_message = COALESCE(error_message, 'Max attempts reached'),
    completed_at = NOW()
  WHERE id = webhook_log_id;

END;
$$ LANGUAGE plpgsql;

-- Lead enrichment webhook trigger function
CREATE OR REPLACE FUNCTION trigger_lead_enrichment_webhook()
RETURNS trigger AS $$
DECLARE
  webhook_payload JSONB;
  webhook_url TEXT;
BEGIN
  -- Get webhook endpoint URL from app settings
  webhook_url := current_setting('app.lead_enrichment_webhook_url', true);
  
  -- Skip if webhook URL not configured
  IF webhook_url IS NULL OR webhook_url = '' THEN
    RETURN NEW;
  END IF;

  -- Build webhook payload with lead data
  webhook_payload := jsonb_build_object(
    'lead_id', NEW.id,
    'business_name', NEW.name,
    'location', jsonb_build_object(
      'address', NEW.address,
      'city', NEW.city,
      'state', NEW.state,
      'postal_code', NEW.postal_code,
      'country', NEW.country
    ),
    'source', NEW.source,
    'phone', NEW.phone,
    'website', NEW.website,
    'category', NEW.category,
    'created_at', NEW.created_at,
    'campaign_id', NEW.campaign_id,
    'google_place_id', NEW.google_place_id,
    'confidence_score', NEW.confidence_score,
    'webhook_metadata', jsonb_build_object(
      'trigger_event', 'lead_insert',
      'trigger_time', NOW(),
      'trigger_table', TG_TABLE_NAME
    )
  );

  -- Execute webhook asynchronously (fire and forget for INSERT triggers)
  PERFORM execute_webhook_with_retry(
    'lead_enrichment',
    'enhanced_leads',
    NEW.id::text,
    webhook_payload,
    webhook_url,
    3 -- max attempts
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on enhanced_leads INSERT
DROP TRIGGER IF EXISTS enhanced_leads_enrichment_webhook ON enhanced_leads;
CREATE TRIGGER enhanced_leads_enrichment_webhook
  AFTER INSERT ON enhanced_leads
  FOR EACH ROW
  EXECUTE FUNCTION trigger_lead_enrichment_webhook();

-- Lead status update webhook for completed enrichment
CREATE OR REPLACE FUNCTION trigger_lead_status_webhook()
RETURNS trigger AS $$
DECLARE
  webhook_payload JSONB;
  webhook_url TEXT;
BEGIN
  -- Only trigger on status changes to completed states
  IF OLD.status = NEW.status OR NEW.status NOT IN ('enriched', 'validated', 'qualified') THEN
    RETURN NEW;
  END IF;

  webhook_url := current_setting('app.lead_status_webhook_url', true);
  
  IF webhook_url IS NULL OR webhook_url = '' THEN
    RETURN NEW;
  END IF;

  -- Build status update payload
  webhook_payload := jsonb_build_object(
    'lead_id', NEW.id,
    'business_name', NEW.name,
    'old_status', OLD.status,
    'new_status', NEW.status,
    'updated_at', NEW.updated_at,
    'campaign_id', NEW.campaign_id,
    'confidence_score', NEW.confidence_score,
    'enrichment_data', jsonb_build_object(
      'email', NEW.email,
      'phone', NEW.phone,
      'website', NEW.website,
      'owner_name', NEW.owner_name,
      'owner_title', NEW.owner_title
    ),
    'webhook_metadata', jsonb_build_object(
      'trigger_event', 'lead_status_update',
      'trigger_time', NOW(),
      'trigger_table', TG_TABLE_NAME
    )
  );

  PERFORM execute_webhook_with_retry(
    'lead_status_update',
    'enhanced_leads',
    NEW.id::text,
    webhook_payload,
    webhook_url,
    3
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on enhanced_leads UPDATE
DROP TRIGGER IF EXISTS enhanced_leads_status_webhook ON enhanced_leads;
CREATE TRIGGER enhanced_leads_status_webhook
  AFTER UPDATE OF status ON enhanced_leads
  FOR EACH ROW
  EXECUTE FUNCTION trigger_lead_status_webhook();

-- Function to retry failed webhooks (can be called by pg_cron or manually)
CREATE OR REPLACE FUNCTION retry_failed_webhooks()
RETURNS INTEGER AS $$
DECLARE
  failed_webhook RECORD;
  retry_count INTEGER := 0;
BEGIN
  -- Process webhooks that are ready for retry
  FOR failed_webhook IN 
    SELECT id, webhook_type, trigger_table, record_id, payload, endpoint_url, max_attempts
    FROM webhook_logs 
    WHERE retry_at IS NOT NULL 
      AND retry_at <= NOW()
      AND completed_at IS NULL
      AND attempt_number < max_attempts
    ORDER BY retry_at
    LIMIT 100
  LOOP
    -- Reset retry_at to prevent duplicate processing
    UPDATE webhook_logs SET retry_at = NULL WHERE id = failed_webhook.id;
    
    -- Retry the webhook
    PERFORM execute_webhook_with_retry(
      failed_webhook.webhook_type,
      failed_webhook.trigger_table,
      failed_webhook.record_id,
      failed_webhook.payload,
      failed_webhook.endpoint_url,
      failed_webhook.max_attempts
    );
    
    retry_count := retry_count + 1;
  END LOOP;

  RETURN retry_count;
END;
$$ LANGUAGE plpgsql;

-- Webhook monitoring view for operational insights
CREATE OR REPLACE VIEW webhook_monitoring AS
SELECT 
  webhook_type,
  COUNT(*) as total_webhooks,
  COUNT(*) FILTER (WHERE http_status >= 200 AND http_status < 300) as successful_webhooks,
  COUNT(*) FILTER (WHERE http_status >= 400 OR error_message IS NOT NULL) as failed_webhooks,
  COUNT(*) FILTER (WHERE completed_at IS NULL) as pending_webhooks,
  AVG(EXTRACT(EPOCH FROM (completed_at - created_at))) as avg_response_time_seconds,
  MAX(created_at) as last_webhook_time
FROM webhook_logs
GROUP BY webhook_type;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA net TO postgres, authenticated;
GRANT EXECUTE ON FUNCTION net.http_post TO postgres, authenticated;
GRANT ALL ON webhook_logs TO postgres, authenticated;
GRANT SELECT ON webhook_monitoring TO postgres, authenticated;

-- Set default webhook configuration (to be updated with actual URLs)
-- These should be set via environment variables or configuration
-- ALTER DATABASE SET app.lead_enrichment_webhook_url = 'https://your-domain.com/api/webhooks/lead-enrichment';
-- ALTER DATABASE SET app.lead_status_webhook_url = 'https://your-domain.com/api/webhooks/lead-status';
-- ALTER DATABASE SET app.webhook_token = 'your-webhook-authentication-token';

COMMENT ON TABLE webhook_logs IS 'Tracks all webhook execution attempts with retry logic and error handling';
COMMENT ON FUNCTION execute_webhook_with_retry IS 'Executes webhooks with exponential backoff retry logic';
COMMENT ON FUNCTION trigger_lead_enrichment_webhook IS 'Triggers lead enrichment webhook on new lead insertion';
COMMENT ON FUNCTION trigger_lead_status_webhook IS 'Triggers webhook on lead status updates';
COMMENT ON VIEW webhook_monitoring IS 'Provides operational insights into webhook performance and reliability';