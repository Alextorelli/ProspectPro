-- Cost Monitoring Webhooks
-- Implements real-time cost tracking and alerting system
-- Replaces polling-based cost monitoring with event-driven alerts

-- Cost threshold configuration table
CREATE TABLE IF NOT EXISTS cost_alert_thresholds (
  id SERIAL PRIMARY KEY,
  threshold_name VARCHAR(100) NOT NULL UNIQUE,
  threshold_type VARCHAR(50) NOT NULL, -- 'daily_spend', 'cost_per_lead', 'rate_limit', 'anomaly'
  threshold_value DECIMAL(10,4) NOT NULL,
  comparison_operator VARCHAR(10) NOT NULL DEFAULT '>', -- '>', '<', '>=', '<=', '='
  is_active BOOLEAN NOT NULL DEFAULT true,
  webhook_url TEXT,
  alert_frequency_minutes INTEGER DEFAULT 60, -- minimum time between alerts
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default cost thresholds
INSERT INTO cost_alert_thresholds (threshold_name, threshold_type, threshold_value, comparison_operator) VALUES
('daily_spend_limit', 'daily_spend', 50.00, '>'),
('cost_per_lead_limit', 'cost_per_lead', 0.25, '>'),
('rate_limit_warning', 'rate_limit', 80.0, '>='), -- 80% of rate limit
('anomaly_spike', 'anomaly', 3.0, '>') -- 3x average spending rate
ON CONFLICT (threshold_name) DO NOTHING;

-- Cost alert history table
CREATE TABLE IF NOT EXISTS cost_alert_history (
  id SERIAL PRIMARY KEY,
  threshold_name VARCHAR(100) NOT NULL,
  threshold_type VARCHAR(50) NOT NULL,
  alert_value DECIMAL(10,4) NOT NULL,
  threshold_value DECIMAL(10,4) NOT NULL,
  api_service VARCHAR(100),
  campaign_id INTEGER,
  time_period VARCHAR(50), -- 'hourly', 'daily', 'real_time'
  alert_data JSONB,
  webhook_sent BOOLEAN DEFAULT false,
  webhook_response TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Index for efficient cost alert queries
CREATE INDEX IF NOT EXISTS idx_cost_alerts_threshold ON cost_alert_history(threshold_name, created_at);
CREATE INDEX IF NOT EXISTS idx_cost_alerts_campaign ON cost_alert_history(campaign_id, created_at);
CREATE INDEX IF NOT EXISTS idx_cost_alerts_service ON cost_alert_history(api_service, created_at);

-- Function to check cost thresholds and trigger alerts
CREATE OR REPLACE FUNCTION check_cost_thresholds_and_alert()
RETURNS trigger AS $$
DECLARE
  threshold_record RECORD;
  daily_spend DECIMAL(10,4);
  hourly_spend DECIMAL(10,4);
  recent_cost_per_lead DECIMAL(10,4);
  last_alert_time TIMESTAMP WITH TIME ZONE;
  webhook_payload JSONB;
  webhook_url TEXT;
BEGIN
  -- Check each active threshold
  FOR threshold_record IN 
    SELECT * FROM cost_alert_thresholds WHERE is_active = true
  LOOP
    -- Check if we need to throttle alerts (minimum frequency)
    SELECT MAX(created_at) INTO last_alert_time
    FROM cost_alert_history
    WHERE threshold_name = threshold_record.threshold_name
      AND created_at > NOW() - (threshold_record.alert_frequency_minutes || ' minutes')::INTERVAL;
    
    -- Skip if alert was sent recently
    IF last_alert_time IS NOT NULL THEN
      CONTINUE;
    END IF;
    
    -- Check threshold based on type
    CASE threshold_record.threshold_type
      WHEN 'daily_spend' THEN
        -- Calculate today's total spend
        SELECT COALESCE(SUM(cost), 0) INTO daily_spend
        FROM api_costs
        WHERE DATE(created_at) = CURRENT_DATE;
        
        IF (threshold_record.comparison_operator = '>' AND daily_spend > threshold_record.threshold_value) OR
           (threshold_record.comparison_operator = '>=' AND daily_spend >= threshold_record.threshold_value) OR
           (threshold_record.comparison_operator = '<' AND daily_spend < threshold_record.threshold_value) OR
           (threshold_record.comparison_operator = '<=' AND daily_spend <= threshold_record.threshold_value) OR
           (threshold_record.comparison_operator = '=' AND daily_spend = threshold_record.threshold_value) THEN
          
          -- Trigger daily spend alert
          webhook_payload := jsonb_build_object(
            'alert_type', 'daily_spend_threshold',
            'threshold_name', threshold_record.threshold_name,
            'current_value', daily_spend,
            'threshold_value', threshold_record.threshold_value,
            'comparison_operator', threshold_record.comparison_operator,
            'alert_data', jsonb_build_object(
              'date', CURRENT_DATE,
              'total_daily_spend', daily_spend,
              'api_breakdown', (
                SELECT jsonb_object_agg(api_service, service_spend)
                FROM (
                  SELECT api_service, SUM(cost) as service_spend
                  FROM api_costs
                  WHERE DATE(created_at) = CURRENT_DATE
                  GROUP BY api_service
                ) breakdown
              )
            ),
            'trigger_event', 'cost_threshold_exceeded',
            'trigger_time', NOW()
          );
          
          PERFORM send_cost_alert(threshold_record.threshold_name, 'daily_spend', daily_spend, threshold_record.threshold_value, webhook_payload);
        END IF;
        
      WHEN 'cost_per_lead' THEN
        -- Calculate recent cost per lead (last 10 leads or last hour)
        SELECT 
          CASE WHEN COUNT(*) > 0 THEN SUM(total_cost) / COUNT(*) ELSE 0 END
        INTO recent_cost_per_lead
        FROM (
          SELECT 
            c.campaign_id,
            SUM(ac.cost) as total_cost
          FROM campaigns c
          LEFT JOIN api_costs ac ON ac.campaign_id = c.id
          WHERE c.created_at > NOW() - INTERVAL '1 hour'
            OR c.id IN (
              SELECT id FROM campaigns ORDER BY created_at DESC LIMIT 10
            )
          GROUP BY c.campaign_id
        ) recent_campaigns;
        
        IF (threshold_record.comparison_operator = '>' AND recent_cost_per_lead > threshold_record.threshold_value) THEN
          webhook_payload := jsonb_build_object(
            'alert_type', 'cost_per_lead_threshold',
            'threshold_name', threshold_record.threshold_name,
            'current_value', recent_cost_per_lead,
            'threshold_value', threshold_record.threshold_value,
            'alert_data', jsonb_build_object(
              'recent_cost_per_lead', recent_cost_per_lead,
              'calculation_period', '1 hour or last 10 campaigns',
              'recommendation', 'Review API usage efficiency and lead quality filters'
            ),
            'trigger_event', 'cost_per_lead_threshold_exceeded',
            'trigger_time', NOW()
          );
          
          PERFORM send_cost_alert(threshold_record.threshold_name, 'cost_per_lead', recent_cost_per_lead, threshold_record.threshold_value, webhook_payload);
        END IF;
        
      WHEN 'rate_limit' THEN
        -- Check if approaching rate limits (requires API client integration)
        -- This is a placeholder - actual rate limit checking would integrate with API client metrics
        NULL;
        
      WHEN 'anomaly' THEN
        -- Check for spending anomalies (current hour vs average)
        SELECT COALESCE(SUM(cost), 0) INTO hourly_spend
        FROM api_costs
        WHERE created_at > NOW() - INTERVAL '1 hour';
        
        -- Compare to average hourly spend over last 7 days
        DECLARE
          avg_hourly_spend DECIMAL(10,4);
        BEGIN
          SELECT COALESCE(AVG(hourly_cost), 0) INTO avg_hourly_spend
          FROM (
            SELECT 
              DATE_TRUNC('hour', created_at) as hour,
              SUM(cost) as hourly_cost
            FROM api_costs
            WHERE created_at > NOW() - INTERVAL '7 days'
              AND created_at <= NOW() - INTERVAL '1 hour' -- exclude current hour
            GROUP BY DATE_TRUNC('hour', created_at)
          ) hourly_costs
          WHERE hourly_cost > 0;
          
          -- Alert if current spending is 3x average (or threshold multiplier)
          IF avg_hourly_spend > 0 AND (hourly_spend / avg_hourly_spend) > threshold_record.threshold_value THEN
            webhook_payload := jsonb_build_object(
              'alert_type', 'spending_anomaly',
              'threshold_name', threshold_record.threshold_name,
              'current_value', hourly_spend,
              'average_value', avg_hourly_spend,
              'anomaly_multiplier', ROUND(hourly_spend / avg_hourly_spend, 2),
              'threshold_multiplier', threshold_record.threshold_value,
              'alert_data', jsonb_build_object(
                'current_hourly_spend', hourly_spend,
                'average_hourly_spend', avg_hourly_spend,
                'comparison_period', '7 days',
                'recommendation', 'Investigate unusual API activity or check for runaway processes'
              ),
              'trigger_event', 'spending_anomaly_detected',
              'trigger_time', NOW()
            );
            
            PERFORM send_cost_alert(threshold_record.threshold_name, 'anomaly', hourly_spend, avg_hourly_spend, webhook_payload);
          END IF;
        END;
    END CASE;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to send cost alert webhook
CREATE OR REPLACE FUNCTION send_cost_alert(
  threshold_name TEXT,
  threshold_type TEXT,
  alert_value DECIMAL(10,4),
  threshold_value DECIMAL(10,4),
  webhook_payload JSONB
) RETURNS void AS $$
DECLARE
  webhook_url TEXT;
  response_record RECORD;
  alert_id INTEGER;
BEGIN
  -- Get webhook URL from configuration
  webhook_url := current_setting('app.cost_alert_webhook_url', true);
  
  -- Insert alert record
  INSERT INTO cost_alert_history (
    threshold_name,
    threshold_type,
    alert_value,
    threshold_value,
    alert_data,
    webhook_sent
  ) VALUES (
    threshold_name,
    threshold_type,
    alert_value,
    threshold_value,
    webhook_payload,
    false
  ) RETURNING id INTO alert_id;
  
  -- Send webhook if URL configured
  IF webhook_url IS NOT NULL AND webhook_url != '' THEN
    BEGIN
      SELECT * INTO response_record FROM net.http_post(
        url := webhook_url,
        body := webhook_payload::text,
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.webhook_token', true),
          'X-Webhook-Type', 'cost_alert',
          'X-Alert-ID', alert_id::text
        ),
        timeout_milliseconds := 5000
      );
      
      -- Update alert record with webhook result
      UPDATE cost_alert_history SET
        webhook_sent = (response_record.status_code >= 200 AND response_record.status_code < 300),
        webhook_response = response_record.status_code || ': ' || response_record.content::text
      WHERE id = alert_id;
      
    EXCEPTION WHEN OTHERS THEN
      UPDATE cost_alert_history SET
        webhook_sent = false,
        webhook_response = 'Error: ' || SQLERRM
      WHERE id = alert_id;
    END;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on api_costs INSERT/UPDATE
DROP TRIGGER IF EXISTS api_costs_monitoring_webhook ON api_costs;
CREATE TRIGGER api_costs_monitoring_webhook
  AFTER INSERT OR UPDATE ON api_costs
  FOR EACH ROW
  EXECUTE FUNCTION check_cost_thresholds_and_alert();

-- Cost monitoring summary view
CREATE OR REPLACE VIEW cost_monitoring_summary AS
SELECT 
  -- Current day spending
  (SELECT COALESCE(SUM(cost), 0) FROM api_costs WHERE DATE(created_at) = CURRENT_DATE) as daily_spend,
  
  -- Current hour spending
  (SELECT COALESCE(SUM(cost), 0) FROM api_costs WHERE created_at > NOW() - INTERVAL '1 hour') as hourly_spend,
  
  -- Average cost per lead (last 24 hours)
  (
    SELECT 
      CASE WHEN COUNT(*) > 0 THEN SUM(total_cost) / COUNT(*) ELSE 0 END
    FROM (
      SELECT 
        c.campaign_id,
        SUM(ac.cost) as total_cost
      FROM campaigns c
      LEFT JOIN api_costs ac ON ac.campaign_id = c.id
      WHERE c.created_at > NOW() - INTERVAL '24 hours'
      GROUP BY c.campaign_id
    ) recent_campaigns
  ) as cost_per_lead_24h,
  
  -- Active alerts count
  (SELECT COUNT(*) FROM cost_alert_history WHERE created_at > NOW() - INTERVAL '24 hours' AND resolved_at IS NULL) as active_alerts_count,
  
  -- Top spending API services today
  (
    SELECT jsonb_object_agg(api_service, service_spend)
    FROM (
      SELECT api_service, ROUND(SUM(cost), 4) as service_spend
      FROM api_costs
      WHERE DATE(created_at) = CURRENT_DATE
      GROUP BY api_service
      ORDER BY service_spend DESC
      LIMIT 5
    ) top_services
  ) as top_spending_services_today;

-- Function to manually resolve cost alerts
CREATE OR REPLACE FUNCTION resolve_cost_alert(alert_id INTEGER, resolution_note TEXT DEFAULT NULL)
RETURNS boolean AS $$
BEGIN
  UPDATE cost_alert_history 
  SET 
    resolved_at = NOW(),
    webhook_response = COALESCE(webhook_response || ' | Resolved: ' || resolution_note, 'Resolved: ' || resolution_note)
  WHERE id = alert_id 
    AND resolved_at IS NULL;
    
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function to update cost thresholds
CREATE OR REPLACE FUNCTION update_cost_threshold(
  p_threshold_name VARCHAR(100),
  p_threshold_value DECIMAL(10,4),
  p_is_active BOOLEAN DEFAULT NULL
) RETURNS boolean AS $$
BEGIN
  UPDATE cost_alert_thresholds 
  SET 
    threshold_value = p_threshold_value,
    is_active = COALESCE(p_is_active, is_active),
    updated_at = NOW()
  WHERE threshold_name = p_threshold_name;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT ALL ON cost_alert_thresholds TO postgres, authenticated;
GRANT ALL ON cost_alert_history TO postgres, authenticated;
GRANT SELECT ON cost_monitoring_summary TO postgres, authenticated;

-- Set default webhook configuration
-- ALTER DATABASE SET app.cost_alert_webhook_url = 'https://your-domain.com/api/webhooks/cost-alert';

COMMENT ON TABLE cost_alert_thresholds IS 'Configurable cost monitoring thresholds and alert rules';
COMMENT ON TABLE cost_alert_history IS 'History of all cost alerts triggered by the monitoring system';
COMMENT ON FUNCTION check_cost_thresholds_and_alert IS 'Evaluates cost thresholds and triggers alerts when exceeded';
COMMENT ON FUNCTION send_cost_alert IS 'Sends cost alert webhooks and logs the results';
COMMENT ON VIEW cost_monitoring_summary IS 'Real-time cost monitoring dashboard data';