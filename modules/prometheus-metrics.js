/**
 * ProspectPro Prometheus Metrics System
 * Comprehensive monitoring for business logic and infrastructure health
 */

const promClient = require('prom-client');

class ProspectProMetrics {
  constructor() {
    // Create custom metrics registry
    this.register = new promClient.Registry();
    
    // Add default Node.js metrics (memory, CPU, GC, etc.)
    promClient.collectDefaultMetrics({ 
      register: this.register,
      prefix: 'prospectpro_nodejs_'
    });
    
    this.initializeCustomMetrics();
    
    console.log('📊 ProspectPro Metrics initialized with Prometheus client');
  }

  initializeCustomMetrics() {
    // HTTP Request metrics
    this.httpRequestDuration = new promClient.Histogram({
      name: 'prospectpro_http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10, 30]
    });

    this.httpRequestTotal = new promClient.Counter({
      name: 'prospectpro_http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code']
    });

    // Supabase Connection metrics
    this.supabaseConnectionDuration = new promClient.Histogram({
      name: 'prospectpro_supabase_connection_duration_seconds',
      help: 'Duration of Supabase connection tests in seconds',
      buckets: [0.1, 0.5, 1, 2, 5, 10, 30]
    });

    this.supabaseConnectionStatus = new promClient.Gauge({
      name: 'prospectpro_supabase_connection_status',
      help: 'Current Supabase connection status (1=connected, 0=disconnected)',
      labelNames: ['auth_mode']
    });

    this.supabaseFailures = new promClient.Counter({
      name: 'prospectpro_supabase_failures_total',
      help: 'Total number of Supabase connection failures',
      labelNames: ['failure_category', 'error_type']
    });

    // API Cost tracking
    this.apiCostTotal = new promClient.Counter({
      name: 'prospectpro_api_cost_total_cents',
      help: 'Total API costs in cents',
      labelNames: ['provider', 'operation', 'campaign_id']
    });

    this.apiRequestsTotal = new promClient.Counter({
      name: 'prospectpro_api_requests_total',
      help: 'Total API requests made to external services',
      labelNames: ['provider', 'status', 'operation']
    });

    this.apiRequestDuration = new promClient.Histogram({
      name: 'prospectpro_api_request_duration_seconds',
      help: 'Duration of external API requests',
      labelNames: ['provider', 'operation'],
      buckets: [0.1, 0.5, 1, 2, 5, 10, 30]
    });

    // Business Discovery metrics
    this.businessesDiscovered = new promClient.Counter({
      name: 'prospectpro_businesses_discovered_total',
      help: 'Total businesses discovered from all sources',
      labelNames: ['source', 'campaign_id']
    });

    this.businessesValidated = new promClient.Counter({
      name: 'prospectpro_businesses_validated_total',
      help: 'Total businesses that passed validation',
      labelNames: ['validation_type', 'result', 'campaign_id']
    });

    this.businessValidationScore = new promClient.Histogram({
      name: 'prospectpro_business_validation_score',
      help: 'Distribution of business validation confidence scores',
      labelNames: ['campaign_id', 'business_type'],
      buckets: [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]
    });

    // Campaign metrics
    this.activeCampaigns = new promClient.Gauge({
      name: 'prospectpro_active_campaigns_current',
      help: 'Number of currently active campaigns',
      labelNames: ['user_id']
    });

    this.campaignCompletionTime = new promClient.Histogram({
      name: 'prospectpro_campaign_completion_seconds',
      help: 'Time taken to complete campaigns',
      labelNames: ['campaign_type', 'business_count_range'],
      buckets: [30, 60, 300, 600, 1800, 3600, 7200, 14400] // 30s to 4h
    });

    this.campaignQualificationRate = new promClient.Histogram({
      name: 'prospectpro_campaign_qualification_rate_percent',
      help: 'Percentage of businesses that qualified in campaigns',
      labelNames: ['campaign_type'],
      buckets: [0, 10, 25, 50, 75, 90, 100]
    });

    // Lead Quality metrics
    this.leadConfidenceScore = new promClient.Histogram({
      name: 'prospectpro_lead_confidence_score',
      help: 'Distribution of lead confidence scores',
      labelNames: ['source', 'business_type'],
      buckets: [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]
    });

    this.leadExportsTotal = new promClient.Counter({
      name: 'prospectpro_lead_exports_total',
      help: 'Total number of leads exported',
      labelNames: ['export_format', 'user_id']
    });

    // Error tracking
    this.errorRate = new promClient.Counter({
      name: 'prospectpro_errors_total',
      help: 'Total number of errors by type and component',
      labelNames: ['error_type', 'component', 'severity']
    });

    this.uptime = new promClient.Gauge({
      name: 'prospectpro_uptime_seconds',
      help: 'Application uptime in seconds'
    });

    // Boot phase metrics
    this.bootPhaseCount = new promClient.Counter({
      name: 'prospectpro_boot_phases_total',
      help: 'Total boot phases executed',
      labelNames: ['phase_name', 'status']
    });

    this.bootPhaseDuration = new promClient.Histogram({
      name: 'prospectpro_boot_phase_duration_seconds',
      help: 'Duration of individual boot phases',
      labelNames: ['phase_name'],
      buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10]
    });

    this.bootTotalTime = new promClient.Histogram({
      name: 'prospectpro_boot_total_duration_seconds',
      help: 'Total application boot time',
      buckets: [1, 2, 5, 10, 30, 60, 120]
    });

    // Register all metrics
    const allMetrics = [
      this.httpRequestDuration,
      this.httpRequestTotal,
      this.supabaseConnectionDuration,
      this.supabaseConnectionStatus,
      this.supabaseFailures,
      this.apiCostTotal,
      this.apiRequestsTotal,
      this.apiRequestDuration,
      this.businessesDiscovered,
      this.businessesValidated,
      this.businessValidationScore,
      this.activeCampaigns,
      this.campaignCompletionTime,
      this.campaignQualificationRate,
      this.leadConfidenceScore,
      this.leadExportsTotal,
      this.errorRate,
      this.uptime,
      this.bootPhaseCount,
      this.bootPhaseDuration,
      this.bootTotalTime
    ];

    allMetrics.forEach(metric => this.register.registerMetric(metric));
    console.log(`📈 Registered ${allMetrics.length} custom metrics`);
  }

  // Express middleware for automatic HTTP metrics
  getHttpMetricsMiddleware() {
    return (req, res, next) => {
      const start = Date.now();
      
      // Track uptime
      this.uptime.set(process.uptime());
      
      res.on('finish', () => {
        const duration = (Date.now() - start) / 1000;
        const route = this.normalizeRoute(req.route?.path || req.path || 'unknown');
        const method = req.method;
        const statusCode = res.statusCode.toString();
        
        // Record metrics
        this.httpRequestDuration
          .labels(method, route, statusCode)
          .observe(duration);
        
        this.httpRequestTotal
          .labels(method, route, statusCode)
          .inc();

        // Log slow requests
        if (duration > 5) {
          console.warn(`🐌 Slow request: ${method} ${route} took ${duration.toFixed(2)}s`);
        }
      });
      
      next();
    };
  }

  // Normalize route paths for consistent metrics
  normalizeRoute(path) {
    if (!path || path === 'unknown') return 'unknown';
    
    // Replace dynamic segments with placeholders
    return path
      .replace(/\/[a-f0-9-]{36}/gi, '/:id')  // UUID parameters
      .replace(/\/\d+/g, '/:id')             // Numeric parameters
      .replace(/\?.*$/, '')                  // Remove query strings
      .toLowerCase();
  }

  // Record Supabase connection metrics
  recordSupabaseConnection(duration, success, authMode = 'unknown', failureCategory = null) {
    const durationSeconds = duration / 1000;
    
    this.supabaseConnectionDuration.observe(durationSeconds);
    this.supabaseConnectionStatus.labels(authMode).set(success ? 1 : 0);
    
    if (!success && failureCategory) {
      this.supabaseFailures.labels(failureCategory, 'connection').inc();
    }
    
    console.log(`📊 Supabase metrics: ${success ? 'success' : 'failure'} (${durationSeconds.toFixed(2)}s) [${authMode}]`);
  }

  // Record API costs and requests
  recordApiCost(provider, operation, costCents, campaignId = 'unknown') {
    this.apiCostTotal.labels(provider, operation, campaignId).inc(costCents);
    console.log(`💰 API cost recorded: ${provider}/${operation} = ${costCents} cents [${campaignId}]`);
  }

  recordApiRequest(provider, operation, success, durationMs = null) {
    const status = success ? 'success' : 'failure';
    this.apiRequestsTotal.labels(provider, status, operation).inc();
    
    if (durationMs !== null) {
      this.apiRequestDuration.labels(provider, operation).observe(durationMs / 1000);
    }
  }

  // Record business discovery metrics
  recordBusinessDiscovery(source, count, campaignId = 'unknown') {
    this.businessesDiscovered.labels(source, campaignId).inc(count);
    console.log(`🏢 Businesses discovered: ${count} from ${source} [${campaignId}]`);
  }

  recordBusinessValidation(validationType, result, campaignId = 'unknown') {
    this.businessesValidated.labels(validationType, result, campaignId).inc();
  }

  recordBusinessValidationScore(score, campaignId = 'unknown', businessType = 'unknown') {
    this.businessValidationScore.labels(campaignId, businessType).observe(score);
  }

  // Record campaign metrics
  recordCampaignStart(campaignId, userId = 'unknown') {
    this.activeCampaigns.labels(userId).inc();
    console.log(`🚀 Campaign started: ${campaignId} [user: ${userId}]`);
  }

  recordCampaignComplete(campaignId, userId = 'unknown', durationSeconds, qualificationRate, campaignType = 'standard') {
    this.activeCampaigns.labels(userId).dec();
    
    // Categorize by business count for better insights
    const businessCountRange = this.categorizeBusinessCount(qualificationRate * 100);
    this.campaignCompletionTime.labels(campaignType, businessCountRange).observe(durationSeconds);
    this.campaignQualificationRate.labels(campaignType).observe(qualificationRate * 100);
    
    console.log(`✅ Campaign completed: ${campaignId} (${durationSeconds}s, ${(qualificationRate * 100).toFixed(1)}% qualified)`);
  }

  categorizeBusinessCount(count) {
    if (count <= 10) return '1-10';
    if (count <= 50) return '11-50';
    if (count <= 100) return '51-100';
    if (count <= 500) return '101-500';
    return '500+';
  }

  // Record lead quality and exports
  recordLeadConfidenceScore(score, source = 'unknown', businessType = 'unknown') {
    this.leadConfidenceScore.labels(source, businessType).observe(score);
  }

  recordLeadExport(count, format = 'csv', userId = 'unknown') {
    this.leadExportsTotal.labels(format, userId).inc(count);
    console.log(`📤 Leads exported: ${count} (${format}) [user: ${userId}]`);
  }

  // Record errors with context
  recordError(errorType, component, severity = 'error', error = null) {
    this.errorRate.labels(errorType, component, severity).inc();
    
    if (error && severity === 'critical') {
      console.error(`🔥 Critical error recorded: ${component}/${errorType}:`, error.message);
    }
  }

  // Record boot phase metrics
  recordBootPhase(phaseName, status, durationMs) {
    this.bootPhaseCount.labels(phaseName, status).inc();
    this.bootPhaseDuration.labels(phaseName).observe(durationMs / 1000);
    
    if (status === 'failed') {
      console.error(`❌ Boot phase failed: ${phaseName} (${durationMs}ms)`);
    }
  }

  recordBootComplete(totalBootTimeMs) {
    this.bootTotalTime.observe(totalBootTimeMs / 1000);
    console.log(`🚀 Boot metrics recorded: ${totalBootTimeMs}ms total boot time`);
  }

  // Get metrics for /metrics endpoint
  async getMetrics() {
    try {
      return await this.register.metrics();
    } catch (error) {
      console.error('Failed to generate metrics:', error);
      return '# Error generating metrics\n';
    }
  }

  // Get metrics summary for health checks
  getMetricsSummary() {
    return {
      totalMetrics: this.register._metrics.size || 0,
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    };
  }

  // Reset all metrics (useful for testing)
  reset() {
    this.register.clear();
    this.initializeCustomMetrics();
    console.log('📊 Metrics registry reset');
  }
}

module.exports = { ProspectProMetrics };