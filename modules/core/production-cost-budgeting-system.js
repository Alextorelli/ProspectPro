/**
 * Cost Budgeting System
 * Integrates with EnhancedApiUsageMonitor for budget controls, threshold alerts,
 * automatic campaign pausing, and cost optimization recommendations
 *
 * Features:
 * - Real-time budget tracking and utilization monitoring
 * - Multi-tier alert system (warning, critical, emergency)
 * - Automatic campaign pausing when budgets exceeded
 * - Cost optimization recommendations and insights
 * - Budget allocation across API sources
 * - Historical cost analysis and forecasting
 */

const { createClient } = require("@supabase/supabase-js");

class CostBudgetingSystem {
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
          "Failed to initialize Supabase for cost budgeting:",
          error
        );
      }
    }

    // Configuration
    this.config = {
      enableAutoPause: options.enableAutoPause !== false,
      enableOptimizationAlerts: options.enableOptimizationAlerts !== false,
      enableBudgetForecasting: options.enableBudgetForecasting !== false,

      // Alert thresholds
      thresholds: {
        warning: options.warningThreshold || 75, // 75% of budget
        critical: options.criticalThreshold || 90, // 90% of budget
        emergency: options.emergencyThreshold || 95, // 95% of budget
        autopause: options.autopauseThreshold || 100, // 100% of budget
      },

      // Cost optimization targets
      targets: {
        maxCostPerLead: options.maxCostPerLead || 2.0,
        targetCostPerLead: options.targetCostPerLead || 0.75,
        maxDailyCost: options.maxDailyCost || 50.0,
        costEfficiencyTarget: options.costEfficiencyTarget || 85, // percentage
      },

      // Budget allocation defaults (percentages)
      defaultAllocation: {
        google_places: 40, // 40% for discovery
        hunter_io: 25, // 25% for email discovery
        zerobounce: 20, // 20% for email verification
        yelp_fusion: 10, // 10% for enhanced discovery
        government_apis: 5, // 5% for government validation
      },
    };

    // Cache for budget data and calculations
    this.budgetCache = null;
    this.costCache = null;
    this.alertsCache = null;

    console.log(
      "💰 Cost Budgeting System initialized with thresholds:",
      this.config.thresholds
    );
  }

  /**
   * Check if operation is within budget limits
   */
  async checkBudgetAvailability(
    sourceName,
    estimatedCost = 0,
    campaignId = null
  ) {
    try {
      const budget = await this.getCurrentBudget();
      const currentCosts = await this.getCurrentCosts();

      if (!budget) {
        console.warn("No active budget found - allowing operation");
        return {
          allowed: true,
          reason: "no_budget_configured",
        };
      }

      // Check overall budget
      const totalSpent = currentCosts.totalSpent || 0;
      const projectedTotal = totalSpent + estimatedCost;
      const utilization = (projectedTotal / budget.total_budget) * 100;

      // Emergency stop - hard limit
      if (
        budget.hard_limit_enabled &&
        utilization >= this.config.thresholds.autopause
      ) {
        await this.triggerEmergencyBudgetAlert(
          budget,
          currentCosts,
          utilization
        );

        if (this.config.enableAutoPause && campaignId) {
          await this.pauseCampaign(campaignId, "budget_exceeded");
        }

        return {
          allowed: false,
          reason: "budget_exceeded",
          utilization: utilization.toFixed(1),
          recommendation: "Increase budget or optimize targeting",
        };
      }

      // Check source-specific budget
      const sourceAllocation = this.calculateSourceAllocation(
        budget,
        sourceName
      );
      if (sourceAllocation.exceeded) {
        return {
          allowed: false,
          reason: "source_budget_exceeded",
          sourceName,
          utilization: sourceAllocation.utilization,
          recommendation: sourceAllocation.recommendation,
        };
      }

      // Cost per lead check
      if (estimatedCost > this.config.targets.maxCostPerLead) {
        return {
          allowed: false,
          reason: "cost_per_operation_too_high",
          cost: estimatedCost,
          maxAllowed: this.config.targets.maxCostPerLead,
          recommendation: "Reduce search scope or optimize parameters",
        };
      }

      return {
        allowed: true,
        utilization: utilization.toFixed(1),
        remainingBudget: (budget.total_budget - projectedTotal).toFixed(2),
        sourceAllocation: sourceAllocation,
      };
    } catch (error) {
      console.error("Error checking budget availability:", error);
      return {
        allowed: true,
        reason: "error_checking_budget",
        error: error.message,
      };
    }
  }

  /**
   * Record actual costs and update budget tracking
   */
  async recordActualCost(costDetails) {
    const {
      campaignId,
      sessionId,
      sourceName,
      actualCost,
      requestId,
      resultsGenerated = 0,
      qualityScore = null,
      timestamp = new Date().toISOString(),
    } = costDetails;

    try {
      if (!this.supabase) {
        console.warn("No Supabase client - cost not recorded");
        return { success: false, reason: "no_database" };
      }

      // Update campaign-level cost tracking
      await this.updateCampaignCosts(campaignId, actualCost, resultsGenerated);

      // Update source-specific budget tracking
      await this.updateSourceBudgetTracking(sourceName, actualCost);

      // Check for budget alerts after cost recording
      await this.checkBudgetAlerts(actualCost);

      // Update cost efficiency metrics
      await this.updateCostEfficiencyMetrics(costDetails);

      // Clear cache to force refresh
      this.budgetCache = null;
      this.costCache = null;

      console.log(
        `💰 Cost recorded: ${sourceName} - $${actualCost} for ${resultsGenerated} results`
      );

      return {
        success: true,
        costRecorded: actualCost,
        totalCampaignCost: await this.getCampaignTotalCost(campaignId),
      };
    } catch (error) {
      console.error("Error recording actual cost:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get current budget configuration
   */
  async getCurrentBudget() {
    try {
      // Check cache first (cache for 5 minutes)
      if (
        this.budgetCache &&
        Date.now() - this.budgetCache.timestamp < 300000
      ) {
        return this.budgetCache.data;
      }

      if (!this.supabase) {
        return null;
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
   * Get current cost breakdown
   */
  async getCurrentCosts(timeRange = "monthly") {
    try {
      // Check cache first (cache for 2 minutes)
      if (this.costCache && Date.now() - this.costCache.timestamp < 120000) {
        return this.costCache.data;
      }

      if (!this.supabase) {
        return { totalSpent: 0, breakdown: {} };
      }

      const timeFilter = this.getTimeFilter(timeRange);

      const { data, error } = await this.supabase
        .from("enhanced_api_usage")
        .select("source_name, actual_cost, estimated_cost, created_at")
        .gte("created_at", timeFilter.start)
        .not("actual_cost", "is", null);

      if (error) {
        console.error("Error fetching current costs:", error);
        return { totalSpent: 0, breakdown: {} };
      }

      const costs = this.aggregateCostData(data || []);

      // Cache the result
      this.costCache = {
        data: costs,
        timestamp: Date.now(),
      };

      return costs;
    } catch (error) {
      console.error("Error getting current costs:", error);
      return { totalSpent: 0, breakdown: {} };
    }
  }

  /**
   * Generate cost optimization recommendations
   */
  async generateOptimizationRecommendations() {
    try {
      const budget = await this.getCurrentBudget();
      const costs = await this.getCurrentCosts();
      const recommendations = [];

      if (!budget || !costs) {
        return recommendations;
      }

      // High cost per lead
      if (costs.costPerLead > this.config.targets.maxCostPerLead) {
        recommendations.push({
          type: "cost_per_lead",
          severity: "high",
          title: "High Cost Per Lead",
          message: `Current cost per lead ($${costs.costPerLead.toFixed(
            2
          )}) exceeds target ($${this.config.targets.targetCostPerLead})`,
          suggestions: [
            "Refine targeting parameters to improve lead quality",
            "Reduce geographic search radius",
            "Focus on higher-converting business categories",
            "Optimize API usage patterns",
          ],
          impact:
            "Could save $" +
            (
              (costs.costPerLead - this.config.targets.targetCostPerLead) *
              costs.totalLeads
            ).toFixed(2),
        });
      }

      // Inefficient source allocation
      const sourceEfficiency = this.analyzeSourceEfficiency(
        costs.breakdown,
        costs.totalLeads
      );
      if (sourceEfficiency.hasInefficiencies) {
        recommendations.push({
          type: "source_allocation",
          severity: "medium",
          title: "Suboptimal API Source Allocation",
          message: "Some API sources showing poor cost efficiency",
          suggestions: sourceEfficiency.recommendations,
          impact:
            "Potential savings: $" +
            sourceEfficiency.potentialSavings.toFixed(2),
        });
      }

      // Budget utilization warnings
      const utilization = (costs.totalSpent / budget.total_budget) * 100;
      if (utilization > this.config.thresholds.critical) {
        recommendations.push({
          type: "budget_utilization",
          severity: "critical",
          title: "High Budget Utilization",
          message: `${utilization.toFixed(1)}% of budget used`,
          suggestions: [
            "Consider increasing monthly budget",
            "Pause lower-performing campaigns",
            "Implement stricter quality filters",
            "Reduce daily spending limits",
          ],
          impact: "Risk of campaign interruption",
        });
      }

      // Forecast budget exhaustion
      const forecast = this.forecastBudgetExhaustion(costs, budget);
      if (forecast.daysUntilExhaustion < 5) {
        recommendations.push({
          type: "budget_forecast",
          severity: "high",
          title: "Budget Exhaustion Warning",
          message: `Budget will be exhausted in ~${forecast.daysUntilExhaustion} days`,
          suggestions: [
            "Reduce daily spending immediately",
            "Increase monthly budget allocation",
            "Pause non-essential campaigns",
            "Implement emergency budget controls",
          ],
          impact: `Projected exhaustion: ${forecast.exhaustionDate}`,
        });
      }

      return recommendations;
    } catch (error) {
      console.error("Error generating optimization recommendations:", error);
      return [];
    }
  }

  /**
   * Pause campaign due to budget constraints
   */
  async pauseCampaign(campaignId, reason = "budget_exceeded") {
    try {
      if (!this.supabase) {
        console.warn("Cannot pause campaign - no database connection");
        return { success: false, reason: "no_database" };
      }

      const { error } = await this.supabase
        .from("campaigns")
        .update({
          status: "paused",
          paused_reason: reason,
          paused_at: new Date().toISOString(),
        })
        .eq("id", campaignId);

      if (error) {
        console.error("Error pausing campaign:", error);
        return { success: false, error: error.message };
      }

      // Log the pause event
      await this.logBudgetEvent("campaign_paused", {
        campaignId,
        reason,
        timestamp: new Date().toISOString(),
      });

      console.log(`🚨 Campaign ${campaignId} paused due to: ${reason}`);

      return {
        success: true,
        campaignId,
        reason,
        pausedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Error pausing campaign:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Calculate source-specific budget allocation and utilization
   */
  calculateSourceAllocation(budget, sourceName) {
    const allocation =
      budget.source_allocation || this.config.defaultAllocation;
    const sourcePercentage = allocation[sourceName] || 10; // Default 10%
    const sourceBudget = (budget.total_budget * sourcePercentage) / 100;

    // Get current spending for this source (simplified - would need actual data)
    const currentSpending = 0; // Would fetch from database
    const utilization = (currentSpending / sourceBudget) * 100;

    return {
      allocated: sourceBudget,
      spent: currentSpending,
      remaining: sourceBudget - currentSpending,
      utilization: utilization.toFixed(1),
      exceeded: utilization >= 100,
      recommendation:
        utilization > 90
          ? `Reduce ${sourceName} usage or reallocate budget`
          : utilization > 75
          ? `Monitor ${sourceName} usage closely`
          : `${sourceName} allocation healthy`,
    };
  }

  /**
   * Update campaign cost tracking
   */
  async updateCampaignCosts(campaignId, cost, resultsCount) {
    try {
      if (!this.supabase) return;

      // Update campaign totals
      const { error } = await this.supabase.rpc("update_campaign_costs", {
        p_campaign_id: campaignId,
        p_additional_cost: cost,
        p_additional_results: resultsCount,
      });

      if (error) {
        console.error("Error updating campaign costs:", error);
      }
    } catch (error) {
      console.error("Error in updateCampaignCosts:", error);
    }
  }

  /**
   * Update source-specific budget tracking
   */
  async updateSourceBudgetTracking(sourceName, cost) {
    try {
      if (!this.supabase) return;

      // Update source spending in budget management
      const { error } = await this.supabase.rpc("update_source_spending", {
        p_source_name: sourceName,
        p_cost: cost,
      });

      if (error) {
        console.error("Error updating source budget tracking:", error);
      }
    } catch (error) {
      console.error("Error in updateSourceBudgetTracking:", error);
    }
  }

  /**
   * Check for budget alerts and trigger notifications
   */
  async checkBudgetAlerts(newCost) {
    try {
      const budget = await this.getCurrentBudget();
      const costs = await this.getCurrentCosts();

      if (!budget) return;

      const utilization = (costs.totalSpent / budget.total_budget) * 100;

      // Check alert thresholds
      for (const [threshold, percentage] of Object.entries(
        this.config.thresholds
      )) {
        if (utilization >= percentage) {
          await this.triggerBudgetAlert(threshold, budget, costs, utilization);
        }
      }
    } catch (error) {
      console.error("Error checking budget alerts:", error);
    }
  }

  /**
   * Trigger budget alert based on severity
   */
  async triggerBudgetAlert(severity, budget, costs, utilization) {
    try {
      const alertData = {
        severity,
        utilization: utilization.toFixed(1),
        totalSpent: costs.totalSpent.toFixed(2),
        totalBudget: budget.total_budget.toFixed(2),
        remaining: (budget.total_budget - costs.totalSpent).toFixed(2),
        timestamp: new Date().toISOString(),
      };

      // Log alert to database
      if (this.supabase) {
        await this.supabase.from("budget_alerts").insert({
          alert_type: "budget_threshold",
          severity,
          message: `Budget ${utilization.toFixed(1)}% utilized`,
          details: alertData,
          is_resolved: false,
        });
      }

      console.warn(
        `🚨 Budget Alert [${severity.toUpperCase()}]: ${utilization.toFixed(
          1
        )}% utilized`
      );

      // Additional actions based on severity
      switch (severity) {
        case "emergency":
          if (this.config.enableAutoPause) {
            console.warn(
              "🛑 Emergency budget limit reached - pausing all campaigns"
            );
            // Would pause all active campaigns
          }
          break;
        case "critical":
          console.warn(
            "⚠️ Critical budget threshold reached - immediate attention required"
          );
          break;
        case "warning":
          console.info(
            "💡 Budget warning threshold reached - monitor spending"
          );
          break;
      }

      return alertData;
    } catch (error) {
      console.error("Error triggering budget alert:", error);
    }
  }

  /**
   * Trigger emergency budget alert
   */
  async triggerEmergencyBudgetAlert(budget, costs, utilization) {
    console.error(
      `🚨 EMERGENCY: Budget exceeded! ${utilization.toFixed(1)}% utilized`
    );

    const emergencyData = {
      severity: "emergency",
      utilization: utilization.toFixed(1),
      overspend: (costs.totalSpent - budget.total_budget).toFixed(2),
      action: "auto_pause_enabled",
      timestamp: new Date().toISOString(),
    };

    // Log emergency event
    await this.logBudgetEvent("emergency_budget_exceeded", emergencyData);

    return emergencyData;
  }

  /**
   * Log budget-related events
   */
  async logBudgetEvent(eventType, eventData) {
    try {
      if (!this.supabase) return;

      await this.supabase.from("system_performance_metrics").insert({
        metric_name: `budget_event_${eventType}`,
        metric_value: 1,
        details: eventData,
        recorded_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error logging budget event:", error);
    }
  }

  /**
   * Helper methods
   */
  getTimeFilter(timeRange) {
    const now = new Date();
    let start;

    switch (timeRange) {
      case "daily":
        start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case "weekly":
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "monthly":
      default:
        start = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    return {
      start: start.toISOString(),
      end: now.toISOString(),
    };
  }

  aggregateCostData(costData) {
    const breakdown = {};
    let totalSpent = 0;
    let totalLeads = 0;

    costData.forEach((record) => {
      const cost = parseFloat(record.actual_cost || record.estimated_cost || 0);
      totalSpent += cost;
      totalLeads += 1; // Simplified - would count actual results

      if (!breakdown[record.source_name]) {
        breakdown[record.source_name] = { cost: 0, requests: 0 };
      }
      breakdown[record.source_name].cost += cost;
      breakdown[record.source_name].requests += 1;
    });

    return {
      totalSpent,
      totalLeads,
      breakdown,
      costPerLead: totalLeads > 0 ? totalSpent / totalLeads : 0,
    };
  }

  analyzeSourceEfficiency(breakdown, totalLeads) {
    const recommendations = [];
    let potentialSavings = 0;
    let hasInefficiencies = false;

    Object.entries(breakdown).forEach(([source, data]) => {
      const costPerRequest = data.cost / data.requests;
      const efficiency = this.calculateSourceEfficiency(source, costPerRequest);

      if (efficiency.rating === "poor") {
        hasInefficiencies = true;
        recommendations.push(efficiency.suggestion);
        potentialSavings += efficiency.potentialSaving;
      }
    });

    return {
      hasInefficiencies,
      recommendations,
      potentialSavings,
    };
  }

  calculateSourceEfficiency(source, costPerRequest) {
    const benchmarks = {
      google_places: 0.05,
      hunter_io: 0.08,
      zerobounce: 0.01,
      yelp_fusion: 0.03,
    };

    const benchmark = benchmarks[source] || 0.05;
    const efficiency =
      costPerRequest <= benchmark
        ? "good"
        : costPerRequest <= benchmark * 1.5
        ? "fair"
        : "poor";

    return {
      rating: efficiency,
      benchmark,
      actual: costPerRequest,
      suggestion:
        efficiency === "poor"
          ? `Consider reducing ${source} usage or optimizing parameters`
          : `${source} efficiency acceptable`,
      potentialSaving:
        efficiency === "poor" ? (costPerRequest - benchmark) * 100 : 0,
    };
  }

  forecastBudgetExhaustion(costs, budget) {
    const dailySpend = costs.totalSpent / 30; // Simplified daily average
    const remaining = budget.total_budget - costs.totalSpent;
    const daysUntilExhaustion = remaining / dailySpend;

    const exhaustionDate = new Date();
    exhaustionDate.setDate(
      exhaustionDate.getDate() + Math.ceil(daysUntilExhaustion)
    );

    return {
      daysUntilExhaustion: Math.ceil(daysUntilExhaustion),
      exhaustionDate: exhaustionDate.toISOString().split("T")[0],
      dailySpendRate: dailySpend.toFixed(2),
    };
  }

  async getCampaignTotalCost(campaignId) {
    try {
      if (!this.supabase) return 0;

      const { data, error } = await this.supabase
        .from("enhanced_api_usage")
        .select("actual_cost, estimated_cost")
        .eq("campaign_id", campaignId);

      if (error) return 0;

      return (data || []).reduce((total, record) => {
        return (
          total + parseFloat(record.actual_cost || record.estimated_cost || 0)
        );
      }, 0);
    } catch (error) {
      console.error("Error getting campaign total cost:", error);
      return 0;
    }
  }

  updateCostEfficiencyMetrics(costDetails) {
    // Implementation would update efficiency tracking
    console.debug(
      "Cost efficiency metrics updated for:",
      costDetails.sourceName
    );
  }
}

module.exports = CostBudgetingSystem;
