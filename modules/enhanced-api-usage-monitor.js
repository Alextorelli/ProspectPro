/**
 * Enhanced API Usage Monitoring System
 * Real-time tracking, cost calculation, rate limiting, and budget controls
 *
 * Features:
 * - Real-time API usage tracking for all data sources
 * - Automatic cost calculation and attribution
 * - Rate limiting and quota management
 * - Budget controls and automated alerts
 * - Quality scoring and performance monitoring
 * - Historical analytics and trend analysis
 */

const { createClient } = require("@supabase/supabase-js");

class EnhancedApiUsageMonitor {
  constructor(options = {}) {
    this.supabaseUrl = process.env.SUPABASE_URL;
    this.supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

    this.supabase = null;
    if (this.supabaseUrl && this.supabaseKey) {
      try {
        this.supabase = createClient(this.supabaseUrl, this.supabaseKey);
      } catch (error) {
        console.error(
          "Failed to initialize Supabase for API monitoring:",
          error
        );
      }
    }

    // Configuration
    this.config = {
      enableRealTimeTracking: options.enableRealTimeTracking !== false,
      enableBudgetControls: options.enableBudgetControls !== false,
      enableQualityScoring: options.enableQualityScoring !== false,
      alertThresholds: {
        budgetWarning: options.budgetWarningThreshold || 75,
        budgetCritical: options.budgetCriticalThreshold || 90,
        apiFailureRate: options.apiFailureThreshold || 20,
        responseTimeWarning: options.responseTimeWarning || 5000,
      },
    };

    // Cache for API source configurations
    this.apiSources = new Map();
    this.budgetCache = null;
    this.rateLimits = new Map();

    console.log("🔧 Enhanced API Usage Monitor initialized");
  }

  /**
   * Track API request start
   */
  async trackApiRequest(requestDetails) {
    const {
      campaignId,
      sessionId,
      sourceName,
      endpoint,
      httpMethod = "GET",
      requestParams = {},
      queryType = "discovery",
      businessQuery = "",
      locationQuery = "",
    } = requestDetails;

    const requestId = `req_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    const startTime = Date.now();

    try {
      // Check rate limits before processing
      const rateLimitCheck = await this.checkRateLimit(sourceName);
      if (!rateLimitCheck.allowed) {
        console.warn(`Rate limit exceeded for ${sourceName}:`, rateLimitCheck);
        return {
          requestId,
          blocked: true,
          reason: "rate_limit_exceeded",
          retryAfter: rateLimitCheck.retryAfter,
        };
      }

      // Check budget limits
      if (this.config.enableBudgetControls) {
        const budgetCheck = await this.checkBudgetLimit(sourceName);
        if (!budgetCheck.allowed) {
          console.warn(`Budget limit exceeded for ${sourceName}:`, budgetCheck);
          return {
            requestId,
            blocked: true,
            reason: "budget_limit_exceeded",
            budgetUtilization: budgetCheck.utilization,
          };
        }
      }

      // Get API source configuration
      const apiSource = await this.getApiSourceConfig(sourceName);
      const estimatedCost = this.calculateEstimatedCost(
        apiSource,
        requestParams
      );

      // Record request start
      if (this.supabase && this.config.enableRealTimeTracking) {
        await this.supabase.from("enhanced_api_usage").insert({
          campaign_id: campaignId,
          session_id: sessionId,
          request_id: requestId,
          source_name: sourceName,
          endpoint,
          http_method: httpMethod,
          request_params: requestParams,
          query_type: queryType,
          business_query: businessQuery,
          location_query: locationQuery,
          estimated_cost: estimatedCost,
          response_code: null, // Will be updated on completion
          success: false, // Will be updated on completion
        });
      }

      return {
        requestId,
        startTime,
        estimatedCost,
        blocked: false,
      };
    } catch (error) {
      console.error("Error tracking API request:", error);
      return {
        requestId,
        startTime: Date.now(),
        estimatedCost: 0,
        blocked: false,
        error: error.message,
      };
    }
  }

  /**
   * Track API request completion
   */
  async trackApiResponse(requestId, responseDetails) {
    const {
      responseCode,
      responseTimeMs,
      resultsReturned = 0,
      success = false,
      errorMessage = null,
      actualCost = null,
      dataQualityScore = null,
      usefulResults = null,
      cacheHit = false,
      rateLimited = false,
      retryCount = 0,
    } = responseDetails;

    try {
      if (!this.supabase || !this.config.enableRealTimeTracking) {
        return { success: false, reason: "tracking_disabled" };
      }

      // Calculate final cost if not provided
      let finalCost = actualCost;
      if (finalCost === null) {
        const { data: requestData } = await this.supabase
          .from("enhanced_api_usage")
          .select("source_name, estimated_cost, request_params")
          .eq("request_id", requestId)
          .single();

        if (requestData) {
          const apiSource = await this.getApiSourceConfig(
            requestData.source_name
          );
          finalCost = this.calculateActualCost(
            apiSource,
            requestData.request_params,
            resultsReturned
          );
        } else {
          finalCost = 0;
        }
      }

      // Update request record
      const updateData = {
        response_code: responseCode,
        response_time_ms: responseTimeMs,
        results_returned: resultsReturned,
        success,
        error_message: errorMessage,
        actual_cost: finalCost,
        data_quality_score: dataQualityScore,
        useful_results: usefulResults || resultsReturned,
        cache_hit: cacheHit,
        rate_limited: rateLimited,
        retry_count: retryCount,
      };

      const { error } = await this.supabase
        .from("enhanced_api_usage")
        .update(updateData)
        .eq("request_id", requestId);

      if (error) {
        console.error("Error updating API usage record:", error);
      }

      // Update rate limit tracking
      await this.updateRateLimit(requestId, success);

      // Update budget tracking
      if (this.config.enableBudgetControls) {
        await this.updateBudgetUsage(requestId, finalCost);
      }

      // Check for alerts
      await this.checkAndTriggerAlerts(requestId, responseDetails);

      // Update API health monitoring
      await this.updateApiHealthMetrics(requestId, responseDetails);

      return {
        success: true,
        finalCost,
        requestId,
      };
    } catch (error) {
      console.error("Error tracking API response:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Check rate limits for API source
   */
  async checkRateLimit(sourceName) {
    try {
      const apiSource = await this.getApiSourceConfig(sourceName);
      const now = Date.now();
      const windowSize = 60000; // 1 minute window

      // Get current usage in window
      if (!this.supabase) {
        return { allowed: true };
      }

      const windowStart = new Date(now - windowSize).toISOString();
      const { data, error } = await this.supabase
        .from("enhanced_api_usage")
        .select("id")
        .eq("source_name", sourceName)
        .gte("created_at", windowStart);

      if (error) {
        console.error("Error checking rate limit:", error);
        return { allowed: true }; // Allow if we can't check
      }

      const currentRequests = (data || []).length;
      const rateLimit = apiSource?.rate_limit || 1000; // Default high limit

      if (currentRequests >= rateLimit) {
        return {
          allowed: false,
          currentRequests,
          rateLimit,
          retryAfter: Math.ceil(windowSize / 1000),
        };
      }

      return {
        allowed: true,
        currentRequests,
        rateLimit,
        remaining: rateLimit - currentRequests,
      };
    } catch (error) {
      console.error("Rate limit check error:", error);
      return { allowed: true }; // Allow on error
    }
  }

  /**
   * Check budget limits
   */
  async checkBudgetLimit(sourceName) {
    try {
      if (!this.config.enableBudgetControls || !this.supabase) {
        return { allowed: true };
      }

      // Get current budget
      const budget = await this.getCurrentBudget();
      if (!budget) {
        return { allowed: true };
      }

      // Check if hard limit is enabled and budget exceeded
      if (
        budget.hard_limit_enabled &&
        budget.budget_utilization_percentage >= 100
      ) {
        return {
          allowed: false,
          reason: "hard_limit_exceeded",
          utilization: budget.budget_utilization_percentage,
        };
      }

      // Check source-specific budget if available
      const sourceField = `${sourceName.replace(/[^a-z0-9_]/gi, "_")}_budget`;
      if (budget[sourceField]) {
        const sourceSpentField = `${sourceName.replace(
          /[^a-z0-9_]/gi,
          "_"
        )}_spent`;
        const sourceSpent = budget[sourceSpentField] || 0;
        const sourceUtilization = (sourceSpent / budget[sourceField]) * 100;

        if (sourceUtilization >= 100) {
          return {
            allowed: false,
            reason: "source_budget_exceeded",
            sourceUtilization,
          };
        }
      }

      return {
        allowed: true,
        utilization: budget.budget_utilization_percentage,
      };
    } catch (error) {
      console.error("Budget limit check error:", error);
      return { allowed: true }; // Allow on error
    }
  }

  /**
   * Get API source configuration
   */
  async getApiSourceConfig(sourceName) {
    try {
      // Check cache first
      if (this.apiSources.has(sourceName)) {
        return this.apiSources.get(sourceName);
      }

      if (!this.supabase) {
        return this.getDefaultApiSourceConfig(sourceName);
      }

      const { data, error } = await this.supabase
        .from("api_data_sources")
        .select("*")
        .eq("source_name", sourceName)
        .single();

      if (error || !data) {
        console.warn(
          `API source config not found for ${sourceName}, using defaults`
        );
        return this.getDefaultApiSourceConfig(sourceName);
      }

      // Cache the result
      this.apiSources.set(sourceName, data);
      return data;
    } catch (error) {
      console.error("Error getting API source config:", error);
      return this.getDefaultApiSourceConfig(sourceName);
    }
  }

  /**
   * Calculate estimated cost for request
   */
  calculateEstimatedCost(apiSource, requestParams) {
    if (!apiSource || !apiSource.cost_per_request) {
      return 0;
    }

    const baseCost = parseFloat(apiSource.cost_per_request) || 0;

    // Adjust cost based on request parameters
    let multiplier = 1;

    if (requestParams.maxResults) {
      // Some APIs charge per result requested
      if (apiSource.cost_model === "per_result") {
        multiplier = Math.min(requestParams.maxResults, 50); // Cap at 50
      }
    }

    return baseCost * multiplier;
  }

  /**
   * Calculate actual cost based on results
   */
  calculateActualCost(apiSource, requestParams, resultsReturned) {
    if (!apiSource || !apiSource.cost_per_request) {
      return 0;
    }

    const baseCost = parseFloat(apiSource.cost_per_request) || 0;

    switch (apiSource.cost_model) {
      case "per_result":
        return baseCost * (resultsReturned || 0);
      case "per_request":
      default:
        return baseCost;
    }
  }

  /**
   * Get current active budget
   */
  async getCurrentBudget() {
    try {
      if (!this.supabase) {
        return null;
      }

      // Check cache first (cache for 5 minutes)
      if (
        this.budgetCache &&
        Date.now() - this.budgetCache.timestamp < 300000
      ) {
        return this.budgetCache.data;
      }

      const { data, error } = await this.supabase
        .from("budget_management")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1);

      if (error) {
        console.error("Error fetching budget:", error);
        return null;
      }

      const budget = data?.[0] || null;

      // Cache the result
      this.budgetCache = {
        data: budget,
        timestamp: Date.now(),
      };

      return budget;
    } catch (error) {
      console.error("Error getting current budget:", error);
      return null;
    }
  }

  /**
   * Update budget usage
   */
  async updateBudgetUsage(requestId, cost) {
    try {
      if (!this.supabase || !cost || cost <= 0) {
        return;
      }

      // Get request details to determine source
      const { data: requestData } = await this.supabase
        .from("enhanced_api_usage")
        .select("source_name, campaign_id, query_type")
        .eq("request_id", requestId)
        .single();

      if (!requestData) {
        return;
      }

      // Update budget totals
      const { error } = await this.supabase.rpc("update_budget_usage", {
        p_source_name: requestData.source_name,
        p_cost: cost,
        p_query_type: requestData.query_type,
      });

      if (error) {
        console.error("Error updating budget usage:", error);
      }

      // Clear budget cache to force refresh
      this.budgetCache = null;
    } catch (error) {
      console.error("Error in updateBudgetUsage:", error);
    }
  }

  /**
   * Update API health metrics
   */
  async updateApiHealthMetrics(requestId, responseDetails) {
    try {
      if (!this.supabase) {
        return;
      }

      const { data: requestData } = await this.supabase
        .from("enhanced_api_usage")
        .select("source_name, response_time_ms, success")
        .eq("request_id", requestId)
        .single();

      if (!requestData) {
        return;
      }

      const performanceDegraded =
        requestData.response_time_ms >
        this.config.alertThresholds.responseTimeWarning;
      const requiresAttention = !requestData.success || performanceDegraded;

      // Insert health monitoring record
      await this.supabase.from("api_health_monitoring").insert({
        source_name: requestData.source_name,
        check_type: "automated",
        response_time_ms: requestData.response_time_ms,
        status_code: responseDetails.responseCode,
        success: requestData.success,
        performance_degraded: performanceDegraded,
        requires_attention: requiresAttention,
        issues_detected: requiresAttention ? ["performance_issue"] : [],
      });
    } catch (error) {
      console.error("Error updating API health metrics:", error);
    }
  }

  /**
   * Check and trigger alerts
   */
  async checkAndTriggerAlerts(requestId, responseDetails) {
    try {
      if (!this.supabase) {
        return;
      }

      const alerts = [];

      // Check response time alert
      if (
        responseDetails.responseTimeMs >
        this.config.alertThresholds.responseTimeWarning
      ) {
        alerts.push({
          type: "performance",
          severity: "warning",
          title: "Slow API Response",
          message: `Response time ${responseDetails.responseTimeMs}ms exceeds threshold`,
        });
      }

      // Check error rate (simplified - would need more data in production)
      if (!responseDetails.success) {
        alerts.push({
          type: "api_error",
          severity: "warning",
          title: "API Request Failed",
          message:
            responseDetails.errorMessage ||
            "API request failed without specific error",
        });
      }

      // Log alerts (in production, would trigger notifications)
      if (alerts.length > 0) {
        console.warn("API Monitoring Alerts:", alerts);
      }
    } catch (error) {
      console.error("Error checking alerts:", error);
    }
  }

  /**
   * Update rate limit tracking
   */
  async updateRateLimit(requestId, success) {
    const now = Date.now();
    // Implementation would track rate limits per source
    // For now, just log the activity
    console.debug(`Rate limit update for ${requestId}: success=${success}`);
  }

  /**
   * Get default API source configuration
   */
  getDefaultApiSourceConfig(sourceName) {
    const defaults = {
      google_places: {
        cost_per_request: 0.032,
        cost_model: "per_request",
        quality_score: 85,
        reliability_score: 95,
        rate_limit: 1000,
      },
      yelp_fusion: {
        cost_per_request: 0.0,
        cost_model: "per_request",
        quality_score: 80,
        reliability_score: 90,
        rate_limit: 5000,
      },
      zerobounce: {
        cost_per_request: 0.008,
        cost_model: "per_request",
        quality_score: 95,
        reliability_score: 95,
        rate_limit: 100,
      },
      hunter_io: {
        cost_per_request: 0.04,
        cost_model: "per_request",
        quality_score: 85,
        reliability_score: 90,
        rate_limit: 50,
      },
    };

    return (
      defaults[sourceName] || {
        cost_per_request: 0.01,
        cost_model: "per_request",
        quality_score: 50,
        reliability_score: 50,
        rate_limit: 100,
      }
    );
  }

  /**
   * Get usage analytics for time period
   */
  async getUsageAnalytics(timeRange = "24h", sourceName = null) {
    try {
      if (!this.supabase) {
        return { error: "Database not available" };
      }

      const timeFilter = this.getTimeFilter(timeRange);
      let query = this.supabase
        .from("enhanced_api_usage")
        .select("*")
        .gte("created_at", timeFilter.start);

      if (sourceName) {
        query = query.eq("source_name", sourceName);
      }

      const { data, error } = await query.order("created_at", {
        ascending: false,
      });

      if (error) {
        return { error: error.message };
      }

      return this.aggregateUsageData(data || []);
    } catch (error) {
      console.error("Error getting usage analytics:", error);
      return { error: error.message };
    }
  }

  /**
   * Aggregate usage data for analytics
   */
  aggregateUsageData(usageData) {
    const summary = {
      totalRequests: usageData.length,
      successfulRequests: 0,
      totalCost: 0,
      avgResponseTime: 0,
      sourceBreakdown: {},
      hourlyTrend: {},
    };

    const responseTimes = [];

    usageData.forEach((usage) => {
      // Success tracking
      if (usage.success) {
        summary.successfulRequests++;
      }

      // Cost tracking
      const cost = parseFloat(usage.actual_cost || usage.estimated_cost || 0);
      summary.totalCost += cost;

      // Response time tracking
      if (usage.response_time_ms) {
        responseTimes.push(usage.response_time_ms);
      }

      // Source breakdown
      const source = usage.source_name;
      if (!summary.sourceBreakdown[source]) {
        summary.sourceBreakdown[source] = {
          requests: 0,
          successful: 0,
          cost: 0,
          avgResponseTime: 0,
          responseTimes: [],
        };
      }

      summary.sourceBreakdown[source].requests++;
      if (usage.success) {
        summary.sourceBreakdown[source].successful++;
      }
      summary.sourceBreakdown[source].cost += cost;
      if (usage.response_time_ms) {
        summary.sourceBreakdown[source].responseTimes.push(
          usage.response_time_ms
        );
      }

      // Hourly trend
      const hour = new Date(usage.created_at).getHours();
      if (!summary.hourlyTrend[hour]) {
        summary.hourlyTrend[hour] = { requests: 0, cost: 0 };
      }
      summary.hourlyTrend[hour].requests++;
      summary.hourlyTrend[hour].cost += cost;
    });

    // Calculate averages
    summary.successRate =
      summary.totalRequests > 0
        ? ((summary.successfulRequests / summary.totalRequests) * 100).toFixed(
            2
          )
        : "0.00";

    if (responseTimes.length > 0) {
      summary.avgResponseTime = Math.round(
        responseTimes.reduce((sum, time) => sum + time, 0) /
          responseTimes.length
      );
    }

    // Calculate source averages
    Object.values(summary.sourceBreakdown).forEach((source) => {
      source.successRate =
        source.requests > 0
          ? ((source.successful / source.requests) * 100).toFixed(2)
          : "0.00";

      if (source.responseTimes.length > 0) {
        source.avgResponseTime = Math.round(
          source.responseTimes.reduce((sum, time) => sum + time, 0) /
            source.responseTimes.length
        );
      }
      delete source.responseTimes; // Clean up
    });

    summary.totalCost = parseFloat(summary.totalCost.toFixed(4));

    return summary;
  }

  /**
   * Get time filter for queries
   */
  getTimeFilter(timeRange) {
    const now = new Date();
    let start;

    switch (timeRange) {
      case "1h":
        start = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case "24h":
        start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case "7d":
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "30d":
        start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }

    return {
      start: start.toISOString(),
      end: now.toISOString(),
    };
  }
}

module.exports = EnhancedApiUsageMonitor;
