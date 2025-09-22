/**
 * Cost Alert Webhook Endpoint
 * Handles real-time cost monitoring alerts from database triggers
 * Integrates with ProspectPro metrics and alerting systems
 */

const express = require("express");
const {
  ProspectProMetrics,
} = require("../../modules/monitoring/prometheus-metrics");
const supabase = require("../../config/supabase");
const logger = require("../../modules/utils/logger");

const router = express.Router();

// Initialize metrics client
const metrics = new ProspectProMetrics();

/**
 * Webhook authentication middleware
 */
function authenticateWebhook(req, res, next) {
  const webhookToken =
    process.env.WEBHOOK_AUTH_TOKEN || process.env.PERSONAL_ACCESS_TOKEN;
  const providedToken = req.headers.authorization?.replace("Bearer ", "");

  if (!webhookToken) {
    logger.warn(
      "🔒 Cost alert webhook authentication disabled - no token configured"
    );
    return next();
  }

  if (!providedToken || providedToken !== webhookToken) {
    logger.warn("❌ Cost alert webhook authentication failed - invalid token");
    return res.status(401).json({
      error: "Unauthorized",
      message: "Invalid webhook authentication token",
    });
  }

  next();
}

/**
 * Cost Alert Webhook Endpoint
 * POST /api/webhooks/cost-alert
 *
 * Triggered by database when cost thresholds are exceeded
 * Processes alerts and integrates with monitoring systems
 */
router.post(
  "/cost-alert",
  express.json({ limit: "1mb" }),
  authenticateWebhook,
  async (req, res) => {
    const startTime = Date.now();
    const {
      alert_type,
      threshold_name,
      current_value,
      threshold_value,
      comparison_operator,
      alert_data,
      trigger_event,
      trigger_time,
    } = req.body;

    const alertId = req.headers["x-alert-id"];

    logger.warn(
      `🚨 Cost alert webhook triggered: ${alert_type} - ${threshold_name}`
    );
    logger.warn(
      `💰 Current: ${current_value}, Threshold: ${threshold_value} (${comparison_operator})`
    );

    try {
      // Acknowledge webhook immediately
      res.status(200).json({
        status: "received",
        alert_id: alertId,
        alert_type,
        threshold_name,
        message: "Cost alert processed",
        timestamp: new Date().toISOString(),
        processing_time_ms: Date.now() - startTime,
      });

      // Process alert based on type
      await processCostAlert({
        alertId,
        alert_type,
        threshold_name,
        current_value,
        threshold_value,
        comparison_operator,
        alert_data,
        trigger_event,
        trigger_time,
      });
    } catch (error) {
      logger.error(`❌ Cost alert webhook processing error:`, error.message);

      if (!res.headersSent) {
        res.status(500).json({
          status: "error",
          alert_id: alertId,
          alert_type,
          error: error.message,
          timestamp: new Date().toISOString(),
          processing_time_ms: Date.now() - startTime,
        });
      }
    }
  }
);

/**
 * Process different types of cost alerts
 */
async function processCostAlert(alertData) {
  const {
    alertId,
    alert_type,
    threshold_name,
    current_value,
    threshold_value,
    alert_data,
  } = alertData;

  try {
    // Update Prometheus metrics
    await updateAlertMetrics(alert_type, current_value, threshold_value);

    switch (alert_type) {
      case "daily_spend_threshold":
        await handleDailySpendAlert(alertData);
        break;

      case "cost_per_lead_threshold":
        await handleCostPerLeadAlert(alertData);
        break;

      case "rate_limit_warning":
        await handleRateLimitAlert(alertData);
        break;

      case "spending_anomaly":
        await handleSpendingAnomalyAlert(alertData);
        break;

      default:
        logger.warn(`⚠️ Unknown alert type: ${alert_type}`);
    }

    // Log successful alert processing
    await logAlertProcessing(
      alertId,
      "processed",
      "Alert successfully processed and metrics updated"
    );
  } catch (error) {
    logger.error(`❌ Failed to process cost alert ${alertId}:`, error.message);
    await logAlertProcessing(
      alertId,
      "error",
      `Processing failed: ${error.message}`
    );
  }
}

/**
 * Handle daily spending limit alerts
 */
async function handleDailySpendAlert(alertData) {
  const { current_value, threshold_value, alert_data } = alertData;

  logger.error(
    `🚨 DAILY SPEND LIMIT EXCEEDED: $${current_value} / $${threshold_value}`
  );

  if (alert_data?.api_breakdown) {
    logger.warn("💸 API Service Breakdown:");
    Object.entries(alert_data.api_breakdown).forEach(([service, cost]) => {
      logger.warn(`   ${service}: $${cost}`);
    });
  }

  // Update metrics
  if (metrics.recordCostAlert) {
    metrics.recordCostAlert("daily_spend", current_value, threshold_value);
  }

  // Potential actions:
  // 1. Disable high-cost API services temporarily
  // 2. Send urgent notifications to administrators
  // 3. Implement spend caps in API clients

  const urgentAlert = current_value > threshold_value * 1.5; // 50% over limit
  if (urgentAlert) {
    logger.error(
      "🚨 URGENT: Daily spend is 50% over limit - consider immediate action"
    );
    // Could integrate with PagerDuty, Slack, etc.
  }
}

/**
 * Handle cost per lead threshold alerts
 */
async function handleCostPerLeadAlert(alertData) {
  const { current_value, threshold_value, alert_data } = alertData;

  logger.error(
    `🚨 COST PER LEAD EXCEEDED: $${current_value} / $${threshold_value}`
  );
  logger.warn(`📊 Calculation period: ${alert_data?.calculation_period}`);
  logger.warn(`💡 Recommendation: ${alert_data?.recommendation}`);

  // Update metrics
  if (metrics.recordCostAlert) {
    metrics.recordCostAlert("cost_per_lead", current_value, threshold_value);
  }

  // Potential actions:
  // 1. Review and tighten pre-qualification filters
  // 2. Analyze API usage efficiency
  // 3. Adjust lead discovery parameters
}

/**
 * Handle rate limit warning alerts
 */
async function handleRateLimitAlert(alertData) {
  const { current_value, threshold_value, alert_data } = alertData;

  logger.warn(`⚠️ RATE LIMIT WARNING: ${current_value}% of limit reached`);

  // Update metrics
  if (metrics.recordRateLimitWarning) {
    metrics.recordRateLimitWarning(alert_data?.api_service, current_value);
  }

  // Potential actions:
  // 1. Implement request queuing
  // 2. Reduce API call frequency
  // 3. Switch to backup API providers
}

/**
 * Handle spending anomaly alerts
 */
async function handleSpendingAnomalyAlert(alertData) {
  const { current_value, alert_data } = alertData;
  const { average_value, anomaly_multiplier } = alert_data;

  logger.error(
    `🚨 SPENDING ANOMALY DETECTED: ${anomaly_multiplier}x normal rate`
  );
  logger.warn(
    `📈 Current: $${current_value}/hour, Average: $${average_value}/hour`
  );
  logger.warn(`💡 Recommendation: ${alert_data?.recommendation}`);

  // Update metrics
  if (metrics.recordSpendingAnomaly) {
    metrics.recordSpendingAnomaly(
      current_value,
      average_value,
      anomaly_multiplier
    );
  }

  // Potential actions:
  // 1. Check for runaway processes
  // 2. Investigate unusual API activity
  // 3. Temporarily throttle expensive operations

  const severeAnomaly = anomaly_multiplier > 5.0;
  if (severeAnomaly) {
    logger.error("🚨 SEVERE ANOMALY: Consider emergency spend controls");
    // Could automatically trigger emergency limits
  }
}

/**
 * Update Prometheus metrics for alerts
 */
async function updateAlertMetrics(alertType, currentValue, thresholdValue) {
  try {
    // Record alert in metrics system
    if (metrics.costAlertTriggered) {
      metrics.costAlertTriggered.inc({
        alert_type: alertType,
        severity: currentValue > thresholdValue * 1.5 ? "critical" : "warning",
      });
    }

    // Record current cost values
    if (metrics.currentCostGauge) {
      metrics.currentCostGauge.set({ type: alertType }, currentValue);
    }
  } catch (error) {
    logger.warn(`⚠️ Failed to update alert metrics: ${error.message}`);
  }
}

/**
 * Log alert processing results back to database
 */
async function logAlertProcessing(alertId, status, message) {
  try {
    if (!alertId) return;

    const { error } = await supabase
      .getClient()
      .from("cost_alert_history")
      .update({
        webhook_response: `${status}: ${message}`,
        resolved_at: status === "processed" ? new Date().toISOString() : null,
      })
      .eq("id", alertId);

    if (error) {
      logger.warn(
        `⚠️ Failed to update alert ${alertId} status: ${error.message}`
      );
    }
  } catch (error) {
    logger.warn(`⚠️ Failed to log alert processing: ${error.message}`);
  }
}

/**
 * Get current cost monitoring status
 * GET /api/webhooks/cost-alert/status
 */
router.get("/cost-alert/status", async (req, res) => {
  try {
    const { data: summary, error } = await supabase
      .getClient()
      .from("cost_monitoring_summary")
      .select("*")
      .single();

    if (error) throw error;

    const { data: activeAlerts, error: alertsError } = await supabase
      .getClient()
      .from("cost_alert_history")
      .select("*")
      .gte(
        "created_at",
        new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      ) // Last 24 hours
      .is("resolved_at", null)
      .order("created_at", { ascending: false });

    if (alertsError) throw alertsError;

    res.json({
      status: "operational",
      timestamp: new Date().toISOString(),
      cost_summary: summary,
      active_alerts: activeAlerts || [],
      metrics_integration: metrics ? "enabled" : "disabled",
    });
  } catch (error) {
    logger.error("❌ Failed to get cost monitoring status:", error.message);
    res.status(500).json({
      status: "error",
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * Manually resolve cost alert
 * POST /api/webhooks/cost-alert/resolve/:alertId
 */
router.post(
  "/cost-alert/resolve/:alertId",
  express.json(),
  authenticateWebhook,
  async (req, res) => {
    const { alertId } = req.params;
    const { resolution_note } = req.body;

    try {
      const { data, error } = await supabase
        .getClient()
        .rpc("resolve_cost_alert", {
          alert_id: parseInt(alertId),
          resolution_note: resolution_note || "Manually resolved via webhook",
        });

      if (error) throw error;

      if (data) {
        logger.info(`✅ Resolved cost alert ${alertId}`);
        res.json({
          status: "resolved",
          alert_id: alertId,
          resolution_note,
          timestamp: new Date().toISOString(),
        });
      } else {
        res.status(404).json({
          status: "not_found",
          alert_id: alertId,
          message: "Alert not found or already resolved",
        });
      }
    } catch (error) {
      logger.error(`❌ Failed to resolve alert ${alertId}:`, error.message);
      res.status(500).json({
        status: "error",
        alert_id: alertId,
        error: error.message,
      });
    }
  }
);

/**
 * Health check endpoint
 */
router.get("/cost-alert/health", (req, res) => {
  res.json({
    status: "healthy",
    service: "cost-alert-webhook",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    dependencies: {
      supabase: supabase.getClient() ? "connected" : "disconnected",
      metrics: metrics ? "initialized" : "not_initialized",
    },
  });
});

module.exports = router;
