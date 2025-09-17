/**
 * Prometheus Metrics for ProspectPro
 *
 * Comprehensive metrics collection for monitoring ProspectPro performance,
 * Railway webhook processing, and business lead generation efficiency.
 */

const client = require("prom-client");

class ProspectProMetrics {
  constructor() {
    // Create default metrics registry
    this.register = new client.Registry();

    // Add default Node.js metrics
    client.collectDefaultMetrics({ register: this.register });

    // Initialize custom metrics
    this.initializeCustomMetrics();

    console.log("📊 Prometheus metrics initialized");
  }

  /**
   * Initialize ProspectPro-specific metrics
   */
  initializeCustomMetrics() {
    // HTTP request metrics
    this.httpRequestDuration = new client.Histogram({
      name: "prospectpro_http_request_duration_seconds",
      help: "Duration of HTTP requests in seconds",
      labelNames: ["method", "route", "status_code"],
      buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
    });

    this.httpRequestTotal = new client.Counter({
      name: "prospectpro_http_requests_total",
      help: "Total number of HTTP requests",
      labelNames: ["method", "route", "status_code"],
    });

    // Railway webhook metrics
    this.webhookEventsTotal = new client.Counter({
      name: "prospectpro_webhook_events_total",
      help: "Total number of Railway webhook events processed",
      labelNames: ["event_type", "status"],
    });

    this.webhookProcessingDuration = new client.Histogram({
      name: "prospectpro_webhook_processing_duration_seconds",
      help: "Time spent processing Railway webhook events",
      labelNames: ["event_type"],
      buckets: [0.01, 0.1, 0.5, 1, 2, 5],
    });

    // Lead generation metrics
    this.leadDiscoveryTotal = new client.Counter({
      name: "prospectpro_lead_discovery_total",
      help: "Total number of leads discovered",
      labelNames: ["source", "status"],
    });

    this.leadValidationDuration = new client.Histogram({
      name: "prospectpro_lead_validation_duration_seconds",
      help: "Time spent validating leads",
      labelNames: ["validation_type"],
      buckets: [0.1, 0.5, 1, 2, 5, 10, 30],
    });

    this.apiCostTotal = new client.Counter({
      name: "prospectpro_api_cost_total",
      help: "Total API costs incurred (in cents)",
      labelNames: ["api_provider", "operation"],
    });

    // Database metrics
    this.databaseConnectionPool = new client.Gauge({
      name: "prospectpro_database_connection_pool_size",
      help: "Current database connection pool size",
    });

    this.databaseQueryDuration = new client.Histogram({
      name: "prospectpro_database_query_duration_seconds",
      help: "Database query execution time",
      labelNames: ["table", "operation"],
      buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
    });

    // Business metrics
    this.campaignTotal = new client.Counter({
      name: "prospectpro_campaigns_total",
      help: "Total number of campaigns created",
      labelNames: ["status"],
    });

    this.leadQualityScore = new client.Histogram({
      name: "prospectpro_lead_quality_score",
      help: "Distribution of lead quality scores",
      buckets: [10, 20, 30, 40, 50, 60, 70, 80, 90, 100],
    });

    // System health metrics
    this.systemHealth = new client.Gauge({
      name: "prospectpro_system_health",
      help: "Overall system health (1=healthy, 0=unhealthy)",
      labelNames: ["component"],
    });

    this.deploymentInfo = new client.Gauge({
      name: "prospectpro_deployment_info",
      help: "Deployment information",
      labelNames: ["version", "environment", "branch"],
    });

    // Register all metrics
    this.register.registerMetric(this.httpRequestDuration);
    this.register.registerMetric(this.httpRequestTotal);
    this.register.registerMetric(this.webhookEventsTotal);
    this.register.registerMetric(this.webhookProcessingDuration);
    this.register.registerMetric(this.leadDiscoveryTotal);
    this.register.registerMetric(this.leadValidationDuration);
    this.register.registerMetric(this.apiCostTotal);
    this.register.registerMetric(this.databaseConnectionPool);
    this.register.registerMetric(this.databaseQueryDuration);
    this.register.registerMetric(this.campaignTotal);
    this.register.registerMetric(this.leadQualityScore);
    this.register.registerMetric(this.systemHealth);
    this.register.registerMetric(this.deploymentInfo);
  }

  /**
   * Record HTTP request metrics
   */
  recordHttpRequest(method, route, statusCode, duration) {
    this.httpRequestTotal.inc({ method, route, status_code: statusCode });
    this.httpRequestDuration.observe(
      { method, route, status_code: statusCode },
      duration
    );
  }

  /**
   * Record Railway webhook event
   */
  recordWebhookEvent(eventType, status, processingTime) {
    this.webhookEventsTotal.inc({ event_type: eventType, status });
    this.webhookProcessingDuration.observe(
      { event_type: eventType },
      processingTime
    );
  }

  /**
   * Record lead discovery
   */
  recordLeadDiscovery(source, status, count = 1) {
    this.leadDiscoveryTotal.inc({ source, status }, count);
  }

  /**
   * Record lead validation time
   */
  recordLeadValidation(validationType, duration) {
    this.leadValidationDuration.observe(
      { validation_type: validationType },
      duration
    );
  }

  /**
   * Record API cost
   */
  recordApiCost(provider, operation, costInCents) {
    this.apiCostTotal.inc({ api_provider: provider, operation }, costInCents);
  }

  /**
   * Record database query
   */
  recordDatabaseQuery(table, operation, duration) {
    this.databaseQueryDuration.observe({ table, operation }, duration);
  }

  /**
   * Record campaign creation
   */
  recordCampaign(status) {
    this.campaignTotal.inc({ status });
  }

  /**
   * Record lead quality score
   */
  recordLeadQuality(score) {
    this.leadQualityScore.observe(score);
  }

  /**
   * Set system health status
   */
  setSystemHealth(component, healthy) {
    this.systemHealth.set({ component }, healthy ? 1 : 0);
  }

  /**
   * Set deployment information
   */
  setDeploymentInfo(version, environment, branch) {
    this.deploymentInfo.set({ version, environment, branch }, 1);
  }

  /**
   * Update database connection pool size
   */
  updateConnectionPoolSize(size) {
    this.databaseConnectionPool.set(size);
  }

  /**
   * Get metrics for Prometheus endpoint
   */
  async getMetrics() {
    return await this.register.metrics();
  }

  /**
   * Get metrics summary for admin dashboard
   */
  getMetricsSummary() {
    return {
      httpRequests: {
        total: this.getCounterValue(this.httpRequestTotal),
        avgDuration: this.getHistogramAverage(this.httpRequestDuration),
      },
      webhooks: {
        total: this.getCounterValue(this.webhookEventsTotal),
        avgProcessingTime: this.getHistogramAverage(
          this.webhookProcessingDuration
        ),
      },
      leads: {
        discovered: this.getCounterValue(this.leadDiscoveryTotal),
        avgQualityScore: this.getHistogramAverage(this.leadQualityScore),
      },
      api: {
        totalCost: this.getCounterValue(this.apiCostTotal),
      },
      system: {
        health: this.getGaugeValue(this.systemHealth),
        connectionPool: this.getGaugeValue(this.databaseConnectionPool),
      },
    };
  }

  /**
   * Helper: Get counter value
   */
  getCounterValue(counter) {
    try {
      const metric = this.register.getSingleMetric(counter.name);
      return metric
        ? metric.get().values.reduce((sum, m) => sum + m.value, 0)
        : 0;
    } catch {
      return 0;
    }
  }

  /**
   * Helper: Get histogram average
   */
  getHistogramAverage(histogram) {
    try {
      const metric = this.register.getSingleMetric(histogram.name);
      if (!metric) return 0;

      const values = metric.get().values;
      const sum =
        values.find((v) => v.metricName?.endsWith("_sum"))?.value || 0;
      const count =
        values.find((v) => v.metricName?.endsWith("_count"))?.value || 0;

      return count > 0 ? sum / count : 0;
    } catch {
      return 0;
    }
  }

  /**
   * Helper: Get gauge value
   */
  getGaugeValue(gauge) {
    try {
      const metric = this.register.getSingleMetric(gauge.name);
      return metric ? metric.get().values[0]?.value || 0 : 0;
    } catch {
      return 0;
    }
  }

  /**
   * Reset all metrics (for testing)
   */
  reset() {
    this.register.clear();
    this.initializeCustomMetrics();
  }

  /**
   * Create Express middleware for automatic HTTP metrics collection
   */
  createHttpMiddleware() {
    return (req, res, next) => {
      const startTime = Date.now();

      res.on("finish", () => {
        const duration = (Date.now() - startTime) / 1000;
        const route = req.route ? req.route.path : req.path;
        this.recordHttpRequest(req.method, route, res.statusCode, duration);
      });

      next();
    };
  }

  recordSupabaseConnection(success, duration) {
    console.log(
      `📊 Metrics: Supabase connection ${
        success ? "success" : "failed"
      } (${duration}ms)`
    );
    // Implementation for Supabase connection tracking
    if (this.httpRequestDuration) {
      this.httpRequestDuration.observe(
        { operation: "supabase_connect" },
        duration / 1000
      );
    }
  }

  recordError(errorType, component, severity, error) {
    console.log(
      `📊 Metrics: Error recorded - ${errorType} in ${component} (${severity}):`,
      error?.message || error
    );
    // Implementation for error tracking
    if (this.httpRequestsTotal) {
      this.httpRequestsTotal.inc({
        method: "ERROR",
        route: errorType,
        status_code: 500,
      });
    }
  }
}

// Global metrics instance
let globalMetrics = null;

/**
 * Get or create global metrics instance
 */
function getMetrics() {
  if (!globalMetrics) {
    globalMetrics = new ProspectProMetrics();
  }
  return globalMetrics;
}

/**
 * Initialize metrics for ProspectPro
 */
function initializeMetrics() {
  const metrics = getMetrics();

  // Set initial deployment info
  metrics.setDeploymentInfo(
    process.env.npm_package_version || "1.0.0",
    process.env.NODE_ENV || "development",
    process.env.RAILWAY_GIT_BRANCH || "main"
  );

  // Set initial system health
  metrics.setSystemHealth("server", true);

  return metrics;
}

/**
 * Get HTTP metrics middleware for Express
 */
function getHttpMetricsMiddleware() {
  const metrics = getMetrics();

  return (req, res, next) => {
    const start = Date.now();

    res.on("finish", () => {
      const duration = Date.now() - start;
      const labels = {
        method: req.method,
        route: req.route?.path || req.path,
        status_code: res.statusCode,
      };

      // Record HTTP request metrics
      if (metrics.httpRequestsTotal) {
        metrics.httpRequestsTotal.inc(labels);
      }

      if (metrics.httpRequestDuration) {
        metrics.httpRequestDuration.observe(labels, duration / 1000);
      }
    });

    next();
  };
}

module.exports = {
  ProspectProMetrics,
  getMetrics,
  initializeMetrics,
  getHttpMetricsMiddleware,
};
