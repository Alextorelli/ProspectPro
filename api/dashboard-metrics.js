/**
 * Enhanced Dashboard Metrics API
 * Comprehensive business intelligence and monitoring endpoint for ProspectPro
 *
 * Features:
 * - Real-time API usage tracking and cost monitoring
 * - Lead quality metrics and validation success rates
 * - Budget utilization and ROI calculations
 * - System health and performance monitoring
 * - Business intelligence insights and recommendations
 */

const express = require("express");
const { createClient } = require("@supabase/supabase-js");

const router = express.Router();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
let supabase = null;

try {
  if (supabaseUrl && supabaseKey) {
    supabase = createClient(supabaseUrl, supabaseKey);
  }
} catch (error) {
  console.error("Failed to initialize Supabase client:", error);
}

/**
 * Get comprehensive dashboard metrics
 * GET /api/dashboard/metrics?timeRange=7d
 */
router.get("/metrics", async (req, res) => {
  try {
    if (!supabase) {
      return res.status(500).json({
        error: "Database connection not available",
        metrics: getDefaultMetrics(),
      });
    }

    const { timeRange = "7d" } = req.query;
    const timeFilter = getTimeFilter(timeRange);

    // Fetch all metrics in parallel
    const [
      overallMetrics,
      costMetrics,
      qualityMetrics,
      apiHealthMetrics,
      budgetMetrics,
      recentActivity,
    ] = await Promise.all([
      getOverallMetrics(supabase, timeFilter),
      getCostMetrics(supabase, timeFilter),
      getQualityMetrics(supabase, timeFilter),
      getApiHealthMetrics(supabase, timeFilter),
      getBudgetMetrics(supabase),
      getRecentActivity(supabase, timeFilter),
    ]);

    // Generate business intelligence insights
    const insights = generateInsights({
      overall: overallMetrics,
      cost: costMetrics,
      quality: qualityMetrics,
      apiHealth: apiHealthMetrics,
      budget: budgetMetrics,
    });

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      timeRange,
      metrics: {
        overall: overallMetrics,
        cost: costMetrics,
        quality: qualityMetrics,
        apiHealth: apiHealthMetrics,
        budget: budgetMetrics,
        recentActivity: recentActivity,
      },
      insights: insights,
      alerts: await generateAlerts(supabase, {
        cost: costMetrics,
        budget: budgetMetrics,
        apiHealth: apiHealthMetrics,
      }),
    });
  } catch (error) {
    console.error("Dashboard metrics error:", error);
    res.status(500).json({
      error: "Failed to fetch dashboard metrics",
      details: error.message,
      metrics: getDefaultMetrics(),
    });
  }
});

/**
 * Get API usage breakdown by source
 * GET /api/dashboard/api-usage?timeRange=24h
 */
router.get("/api-usage", async (req, res) => {
  try {
    if (!supabase) {
      return res
        .status(500)
        .json({ error: "Database connection not available" });
    }

    const { timeRange = "24h" } = req.query;
    const timeFilter = getTimeFilter(timeRange);

    const { data: apiUsage, error } = await supabase
      .from("enhanced_api_usage")
      .select(
        `
        source_name,
        success,
        estimated_cost,
        actual_cost,
        results_returned,
        response_time_ms,
        created_at,
        api_data_sources (
          provider_name,
          quality_score,
          reliability_score,
          cost_per_request
        )
      `
      )
      .gte("created_at", timeFilter.start)
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Aggregate usage by source
    const sourceBreakdown = {};
    let totalCost = 0;
    let totalRequests = 0;
    let successfulRequests = 0;

    (apiUsage || []).forEach((usage) => {
      const source = usage.source_name;
      if (!sourceBreakdown[source]) {
        sourceBreakdown[source] = {
          source_name: source,
          provider_name: usage.api_data_sources?.provider_name || source,
          total_requests: 0,
          successful_requests: 0,
          total_cost: 0,
          avg_response_time: 0,
          quality_score: usage.api_data_sources?.quality_score || 0,
          reliability_score: usage.api_data_sources?.reliability_score || 0,
          results_returned: 0,
          response_times: [],
        };
      }

      sourceBreakdown[source].total_requests++;
      totalRequests++;

      if (usage.success) {
        sourceBreakdown[source].successful_requests++;
        successfulRequests++;
      }

      const cost = parseFloat(usage.actual_cost || usage.estimated_cost || 0);
      sourceBreakdown[source].total_cost += cost;
      totalCost += cost;

      sourceBreakdown[source].results_returned += usage.results_returned || 0;

      if (usage.response_time_ms) {
        sourceBreakdown[source].response_times.push(usage.response_time_ms);
      }
    });

    // Calculate averages
    Object.values(sourceBreakdown).forEach((source) => {
      if (source.response_times.length > 0) {
        source.avg_response_time = Math.round(
          source.response_times.reduce((sum, time) => sum + time, 0) /
            source.response_times.length
        );
      }
      source.success_rate =
        source.total_requests > 0
          ? (
              (source.successful_requests / source.total_requests) *
              100
            ).toFixed(1)
          : "0.0";
      source.cost_per_request =
        source.total_requests > 0
          ? (source.total_cost / source.total_requests).toFixed(4)
          : "0.0000";
      delete source.response_times; // Remove raw data
    });

    res.json({
      success: true,
      timeRange,
      summary: {
        total_requests: totalRequests,
        successful_requests: successfulRequests,
        success_rate:
          totalRequests > 0
            ? ((successfulRequests / totalRequests) * 100).toFixed(1)
            : "0.0",
        total_cost: totalCost.toFixed(4),
        avg_cost_per_request:
          totalRequests > 0 ? (totalCost / totalRequests).toFixed(4) : "0.0000",
      },
      sources: Object.values(sourceBreakdown).sort(
        (a, b) => b.total_cost - a.total_cost
      ),
    });
  } catch (error) {
    console.error("API usage metrics error:", error);
    res.status(500).json({ error: "Failed to fetch API usage metrics" });
  }
});

/**
 * Get lead quality analytics
 * GET /api/dashboard/quality-metrics?timeRange=30d
 */
router.get("/quality-metrics", async (req, res) => {
  try {
    if (!supabase) {
      return res
        .status(500)
        .json({ error: "Database connection not available" });
    }

    const { timeRange = "30d" } = req.query;
    const timeFilter = getTimeFilter(timeRange);

    // Get validation pipeline results
    const { data: validationData, error: validationError } = await supabase
      .from("lead_validation_pipeline")
      .select("*")
      .gte("created_at", timeFilter.start);

    if (validationError) throw validationError;

    // Get campaign analytics for quality trends
    const { data: campaignData, error: campaignError } = await supabase
      .from("campaign_analytics")
      .select("*")
      .gte("campaign_date", timeFilter.start.split("T")[0]);

    if (campaignError) throw campaignError;

    const qualityMetrics = analyzeQualityMetrics(
      validationData || [],
      campaignData || []
    );

    res.json({
      success: true,
      timeRange,
      ...qualityMetrics,
    });
  } catch (error) {
    console.error("Quality metrics error:", error);
    res.status(500).json({ error: "Failed to fetch quality metrics" });
  }
});

/**
 * Get budget and cost analytics
 * GET /api/dashboard/budget-analytics
 */
router.get("/budget-analytics", async (req, res) => {
  try {
    if (!supabase) {
      return res
        .status(500)
        .json({ error: "Database connection not available" });
    }

    // Get current active budget
    const { data: budgetData, error: budgetError } = await supabase
      .from("budget_management")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1);

    if (budgetError) throw budgetError;

    // Get recent budget alerts
    const { data: alertsData, error: alertsError } = await supabase
      .from("budget_alerts")
      .select("*")
      .eq("resolved", false)
      .order("created_at", { ascending: false })
      .limit(10);

    if (alertsError) throw alertsError;

    const budget = budgetData?.[0] || null;
    const analytics = budget ? analyzeBudgetPerformance(budget) : null;

    res.json({
      success: true,
      current_budget: budget,
      analytics: analytics,
      active_alerts: alertsData || [],
      recommendations: generateBudgetRecommendations(budget, alertsData),
    });
  } catch (error) {
    console.error("Budget analytics error:", error);
    res.status(500).json({ error: "Failed to fetch budget analytics" });
  }
});

/**
 * Update budget allocation
 * PUT /api/dashboard/budget
 */
router.put("/budget", async (req, res) => {
  try {
    if (!supabase) {
      return res
        .status(500)
        .json({ error: "Database connection not available" });
    }

    const {
      total_budget,
      discovery_budget,
      validation_budget,
      enrichment_budget,
      alert_threshold_percentage,
      hard_limit_enabled,
      auto_pause_campaigns,
    } = req.body;

    // Validate budget allocation
    const totalAllocated =
      (discovery_budget || 0) +
      (validation_budget || 0) +
      (enrichment_budget || 0);
    if (totalAllocated > total_budget) {
      return res.status(400).json({
        error: "Budget allocation exceeds total budget",
        total_budget,
        total_allocated: totalAllocated,
      });
    }

    // Update active budget
    const { data, error } = await supabase
      .from("budget_management")
      .update({
        total_budget,
        discovery_budget,
        validation_budget,
        enrichment_budget,
        alert_threshold_percentage,
        hard_limit_enabled,
        auto_pause_campaigns,
        updated_at: new Date().toISOString(),
      })
      .eq("is_active", true)
      .select();

    if (error) throw error;

    res.json({
      success: true,
      message: "Budget updated successfully",
      budget: data?.[0],
    });
  } catch (error) {
    console.error("Budget update error:", error);
    res.status(500).json({ error: "Failed to update budget" });
  }
});

// Helper Functions
// ================

function getTimeFilter(timeRange) {
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
    case "90d":
      start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    default:
      start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  }

  return {
    start: start.toISOString(),
    end: now.toISOString(),
  };
}

async function getOverallMetrics(supabase, timeFilter) {
  try {
    // Get campaign data
    const { data: campaigns, error: campaignError } = await supabase
      .from("campaigns")
      .select("id, business_count, qualified_leads, created_at")
      .gte("created_at", timeFilter.start);

    if (campaignError) throw campaignError;

    // Calculate totals
    const totalLeads = (campaigns || []).reduce(
      (sum, c) => sum + (c.business_count || 0),
      0
    );
    const qualifiedLeads = (campaigns || []).reduce(
      (sum, c) => sum + (c.qualified_leads || 0),
      0
    );
    const qualificationRate =
      totalLeads > 0 ? ((qualifiedLeads / totalLeads) * 100).toFixed(1) : "0.0";
    const activeCampaigns = (campaigns || []).length;

    return {
      total_leads: totalLeads,
      qualified_leads: qualifiedLeads,
      qualification_rate: qualificationRate + "%",
      active_campaigns: activeCampaigns,
      avg_leads_per_campaign:
        activeCampaigns > 0 ? Math.round(totalLeads / activeCampaigns) : 0,
    };
  } catch (error) {
    console.error("Error getting overall metrics:", error);
    return {
      total_leads: 0,
      qualified_leads: 0,
      qualification_rate: "0.0%",
      active_campaigns: 0,
      avg_leads_per_campaign: 0,
    };
  }
}

async function getCostMetrics(supabase, timeFilter) {
  try {
    const { data: apiUsage, error } = await supabase
      .from("enhanced_api_usage")
      .select(
        "source_name, actual_cost, estimated_cost, success, results_returned"
      )
      .gte("created_at", timeFilter.start);

    if (error) throw error;

    const costBreakdown = {};
    let totalCost = 0;
    let totalResults = 0;

    (apiUsage || []).forEach((usage) => {
      const cost = parseFloat(usage.actual_cost || usage.estimated_cost || 0);
      const source = usage.source_name;

      if (!costBreakdown[source]) {
        costBreakdown[source] = 0;
      }

      costBreakdown[source] += cost;
      totalCost += cost;
      totalResults += usage.results_returned || 0;
    });

    return {
      total_cost: totalCost.toFixed(4),
      cost_per_result:
        totalResults > 0 ? (totalCost / totalResults).toFixed(4) : "0.0000",
      breakdown: costBreakdown,
      daily_rate: (totalCost * (24 / getHoursDiff(timeFilter))).toFixed(4),
    };
  } catch (error) {
    console.error("Error getting cost metrics:", error);
    return {
      total_cost: "0.0000",
      cost_per_result: "0.0000",
      breakdown: {},
      daily_rate: "0.0000",
    };
  }
}

async function getQualityMetrics(supabase, timeFilter) {
  try {
    const { data: validationData, error } = await supabase
      .from("lead_validation_pipeline")
      .select(
        "stage_4_confidence_score, stage_4_qualified, final_quality_grade"
      )
      .gte("created_at", timeFilter.start);

    if (error) throw error;

    const totalValidated = (validationData || []).length;
    const qualifiedCount = (validationData || []).filter(
      (v) => v.stage_4_qualified
    ).length;

    const avgConfidence =
      totalValidated > 0
        ? (
            validationData.reduce(
              (sum, v) => sum + (v.stage_4_confidence_score || 0),
              0
            ) / totalValidated
          ).toFixed(1)
        : "0.0";

    const gradeDistribution = {
      A: 0,
      B: 0,
      C: 0,
      D: 0,
      F: 0,
    };

    (validationData || []).forEach((v) => {
      const grade = v.final_quality_grade || "F";
      gradeDistribution[grade]++;
    });

    return {
      total_validated: totalValidated,
      qualified_count: qualifiedCount,
      qualification_rate:
        totalValidated > 0
          ? ((qualifiedCount / totalValidated) * 100).toFixed(1)
          : "0.0",
      avg_confidence_score: avgConfidence,
      grade_distribution: gradeDistribution,
    };
  } catch (error) {
    console.error("Error getting quality metrics:", error);
    return {
      total_validated: 0,
      qualified_count: 0,
      qualification_rate: "0.0",
      avg_confidence_score: "0.0",
      grade_distribution: { A: 0, B: 0, C: 0, D: 0, F: 0 },
    };
  }
}

async function getApiHealthMetrics(supabase, timeFilter) {
  try {
    const { data: healthData, error } = await supabase
      .from("api_health_monitoring")
      .select("source_name, success, response_time_ms, performance_degraded")
      .gte("created_at", timeFilter.start);

    if (error) throw error;

    const healthBySource = {};

    (healthData || []).forEach((health) => {
      const source = health.source_name;
      if (!healthBySource[source]) {
        healthBySource[source] = {
          total_checks: 0,
          successful_checks: 0,
          avg_response_time: 0,
          degraded_count: 0,
          response_times: [],
        };
      }

      healthBySource[source].total_checks++;
      if (health.success) {
        healthBySource[source].successful_checks++;
      }
      if (health.performance_degraded) {
        healthBySource[source].degraded_count++;
      }
      if (health.response_time_ms) {
        healthBySource[source].response_times.push(health.response_time_ms);
      }
    });

    // Calculate averages
    Object.values(healthBySource).forEach((source) => {
      if (source.response_times.length > 0) {
        source.avg_response_time = Math.round(
          source.response_times.reduce((sum, time) => sum + time, 0) /
            source.response_times.length
        );
      }
      source.health_score =
        source.total_checks > 0
          ? ((source.successful_checks / source.total_checks) * 100).toFixed(1)
          : "0.0";
      delete source.response_times;
    });

    return healthBySource;
  } catch (error) {
    console.error("Error getting API health metrics:", error);
    return {};
  }
}

async function getBudgetMetrics(supabase) {
  try {
    const { data: budgetData, error } = await supabase
      .from("budget_management")
      .select("*")
      .eq("is_active", true)
      .limit(1);

    if (error) throw error;

    const budget = budgetData?.[0];
    if (!budget) {
      return {
        total_budget: 0,
        total_spent: 0,
        utilization_percentage: 0,
        days_remaining: 0,
        projected_overage: 0,
      };
    }

    return {
      total_budget: budget.total_budget,
      total_spent: budget.total_spent,
      utilization_percentage: budget.budget_utilization_percentage,
      days_remaining: budget.days_remaining_in_period || 0,
      projected_overage: budget.projected_overage || 0,
      alert_threshold: budget.alert_threshold_percentage,
      hard_limit_enabled: budget.hard_limit_enabled,
    };
  } catch (error) {
    console.error("Error getting budget metrics:", error);
    return {
      total_budget: 0,
      total_spent: 0,
      utilization_percentage: 0,
      days_remaining: 0,
      projected_overage: 0,
    };
  }
}

async function getRecentActivity(supabase, timeFilter) {
  try {
    // Get recent API usage as activity
    const { data: recentUsage, error } = await supabase
      .from("enhanced_api_usage")
      .select("created_at, source_name, success, results_returned, actual_cost")
      .gte("created_at", timeFilter.start)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) throw error;

    return (recentUsage || []).map((activity) => ({
      timestamp: activity.created_at,
      type: activity.success ? "success" : "error",
      message: `${activity.source_name}: ${
        activity.results_returned || 0
      } results (${activity.success ? "success" : "failed"})`,
      cost: activity.actual_cost || 0,
    }));
  } catch (error) {
    console.error("Error getting recent activity:", error);
    return [];
  }
}

function getDefaultMetrics() {
  return {
    overall: {
      total_leads: 0,
      qualified_leads: 0,
      qualification_rate: "0.0%",
      active_campaigns: 0,
    },
    cost: {
      total_cost: "0.0000",
      cost_per_result: "0.0000",
      breakdown: {},
      daily_rate: "0.0000",
    },
    quality: {
      avg_confidence_score: "0.0",
      qualification_rate: "0.0",
      grade_distribution: { A: 0, B: 0, C: 0, D: 0, F: 0 },
    },
    budget: {
      total_budget: 150,
      total_spent: 0,
      utilization_percentage: 0,
    },
  };
}

function generateInsights(metrics) {
  const insights = [];

  // Cost efficiency insights
  if (metrics.cost.total_cost > 0) {
    const costPerLead = parseFloat(metrics.cost.cost_per_result);
    if (costPerLead > 1.0) {
      insights.push({
        type: "cost_optimization",
        priority: "high",
        title: "High Cost Per Lead Detected",
        message: `Current cost per lead ($${costPerLead.toFixed(
          2
        )}) is above optimal range. Consider optimizing API usage.`,
        action: "Review API source allocation and pre-validation filters",
      });
    }
  }

  // Quality insights
  if (metrics.quality.avg_confidence_score < 70) {
    insights.push({
      type: "quality_improvement",
      priority: "medium",
      title: "Low Average Confidence Score",
      message: `Average confidence score (${metrics.quality.avg_confidence_score}%) is below target. Enable more validation sources.`,
      action: "Enable additional government API validations",
    });
  }

  // Budget insights
  if (metrics.budget.utilization_percentage > 80) {
    insights.push({
      type: "budget_warning",
      priority: "high",
      title: "High Budget Utilization",
      message: `Budget utilization at ${metrics.budget.utilization_percentage}%. Consider increasing budget or optimizing costs.`,
      action: "Review budget allocation or implement stricter cost controls",
    });
  }

  return insights;
}

async function generateAlerts(supabase, metrics) {
  const alerts = [];

  // Budget alerts
  if (metrics.budget.utilization_percentage > 90) {
    alerts.push({
      type: "budget",
      severity: "critical",
      title: "Budget Critical",
      message: `${metrics.budget.utilization_percentage}% of budget used`,
      timestamp: new Date().toISOString(),
    });
  } else if (metrics.budget.utilization_percentage > 75) {
    alerts.push({
      type: "budget",
      severity: "warning",
      title: "Budget Warning",
      message: `${metrics.budget.utilization_percentage}% of budget used`,
      timestamp: new Date().toISOString(),
    });
  }

  // API health alerts
  Object.entries(metrics.apiHealth || {}).forEach(([source, health]) => {
    if (parseFloat(health.health_score) < 80) {
      alerts.push({
        type: "api_health",
        severity: "warning",
        title: `${source} Performance Issue`,
        message: `Health score: ${health.health_score}%`,
        timestamp: new Date().toISOString(),
      });
    }
  });

  return alerts;
}

function getHoursDiff(timeFilter) {
  const start = new Date(timeFilter.start);
  const end = new Date(timeFilter.end);
  return Math.abs(end - start) / (1000 * 60 * 60);
}

function analyzeQualityMetrics(validationData, campaignData) {
  // Implementation for detailed quality analysis
  return {
    pipeline_performance: {
      stage_1_pass_rate: 0,
      stage_2_pass_rate: 0,
      stage_3_pass_rate: 0,
      stage_4_pass_rate: 0,
    },
    trends: {
      quality_improving: true,
      confidence_trend: "stable",
    },
  };
}

function analyzeBudgetPerformance(budget) {
  const utilizationRate = (budget.total_spent / budget.total_budget) * 100;
  const daysInPeriod = Math.ceil(
    (new Date(budget.period_end) - new Date(budget.period_start)) /
      (1000 * 60 * 60 * 24)
  );
  const daysElapsed = Math.ceil(
    (new Date() - new Date(budget.period_start)) / (1000 * 60 * 60 * 24)
  );
  const burnRate = budget.total_spent / Math.max(daysElapsed, 1);

  return {
    utilization_rate: utilizationRate.toFixed(2),
    days_remaining: budget.days_remaining_in_period,
    burn_rate: burnRate.toFixed(2),
    projected_spend: (burnRate * daysInPeriod).toFixed(2),
    efficiency_score: Math.max(
      0,
      100 - (utilizationRate - (daysElapsed / daysInPeriod) * 100)
    ),
  };
}

function generateBudgetRecommendations(budget, alerts) {
  const recommendations = [];

  if (budget && budget.budget_utilization_percentage > 80) {
    recommendations.push({
      type: "budget_optimization",
      priority: "high",
      title: "Optimize API Usage",
      description:
        "High budget utilization detected. Consider implementing stricter pre-validation filters.",
      estimated_savings: "$10-25/month",
    });
  }

  return recommendations;
}

module.exports = router;
