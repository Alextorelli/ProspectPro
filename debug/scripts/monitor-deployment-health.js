#!/usr/bin/env node

/**
 * Railway Deployment Health Monitor
 *
 * Continuously monitors Railway deployment health and provides
 * real-time analysis of webhook events and deployment patterns.
 */

const { createClient } = require("@supabase/supabase-js");

class RailwayDeploymentMonitor {
  constructor(options = {}) {
    this.baseUrl =
      options.baseUrl || `http://localhost:${process.env.PORT || 3000}`;
    this.adminToken = process.env.PERSONAL_ACCESS_TOKEN;
    this.refreshInterval = options.refreshInterval || 30000; // 30 seconds
    this.isRunning = false;

    // Initialize Supabase client for direct database queries
    this.supabase = null;
    this.initializeSupabase();
  }

  /**
   * Initialize Supabase client
   */
  initializeSupabase() {
    try {
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseKey =
        process.env.SUPABASE_SECRET_KEY ||
        process.env.SUPABASE_SERVICE_ROLE_KEY ||
        process.env.SUPABASE_ANON_KEY;

      if (supabaseUrl && supabaseKey) {
        this.supabase = createClient(supabaseUrl, supabaseKey);
      }
    } catch (error) {
      console.warn("⚠️  Supabase client initialization failed:", error.message);
    }
  }

  /**
   * Start continuous monitoring
   */
  async startMonitoring() {
    console.log("📊 ProspectPro Railway Deployment Monitor");
    console.log("=".repeat(60));
    console.log(`Monitoring URL: ${this.baseUrl}`);
    console.log(`Refresh Interval: ${this.refreshInterval / 1000}s`);
    console.log("Press Ctrl+C to stop monitoring");
    console.log("");

    this.isRunning = true;

    // Initial health check
    await this.performHealthCheck();

    // Set up continuous monitoring
    const monitoringInterval = setInterval(async () => {
      if (!this.isRunning) {
        clearInterval(monitoringInterval);
        return;
      }

      try {
        await this.performHealthCheck();
        await this.analyzeRecentActivity();

        // Add separator between monitoring cycles
        console.log("-".repeat(40));
      } catch (error) {
        console.error("🔥 Monitoring error:", error.message);
      }
    }, this.refreshInterval);

    // Handle graceful shutdown
    process.on("SIGINT", () => {
      console.log("\n📴 Shutting down deployment monitor...");
      this.isRunning = false;
      clearInterval(monitoringInterval);
      process.exit(0);
    });

    // Keep the process alive
    return new Promise((resolve) => {
      process.on("SIGTERM", () => {
        this.isRunning = false;
        resolve();
      });
    });
  }

  /**
   * Perform comprehensive health check
   */
  async performHealthCheck() {
    const timestamp = new Date().toISOString();
    console.log(`🔍 Health Check - ${timestamp}`);

    try {
      // Check server health
      const healthResponse = await this.makeRequest("/health");
      if (healthResponse.ok) {
        const healthData = await healthResponse.json();
        const status =
          healthData.status === "ok"
            ? "✅"
            : healthData.status === "degraded"
            ? "⚠️"
            : "❌";

        console.log(`   Server: ${status} ${healthData.status}`);

        if (healthData.supabase) {
          console.log(
            `   Database: ${healthData.supabase.success ? "✅" : "❌"} ${
              healthData.supabase.authStatus || "unknown"
            }`
          );
          console.log(
            `   Response Time: ${healthData.supabase.durationMs || 0}ms`
          );
        }
      } else {
        console.log(`   Server: ❌ HTTP ${healthResponse.status}`);
      }

      // Check webhook monitoring status
      await this.checkWebhookStatus();
    } catch (error) {
      console.log(`   Server: ❌ Unreachable (${error.message})`);
    }
  }

  /**
   * Check webhook monitoring status
   */
  async checkWebhookStatus() {
    if (!this.adminToken) {
      console.log("   Webhooks: ⚠️  Cannot check (no admin token)");
      return;
    }

    try {
      const statusResponse = await this.makeRequest(
        `/deployment-status?token=${this.adminToken}`
      );

      if (statusResponse.ok) {
        const statusData = await statusResponse.json();

        console.log(
          `   Webhook Events: ${
            statusData.webhookStatus?.totalEventsProcessed || 0
          } processed`
        );
        console.log(
          `   Last Event: ${this.formatTimestamp(
            statusData.webhookStatus?.lastEventReceived
          )}`
        );

        const healthIcon =
          statusData.systemHealth === "healthy"
            ? "✅"
            : statusData.systemHealth === "degraded"
            ? "⚠️"
            : "❌";
        console.log(
          `   System Health: ${healthIcon} ${statusData.systemHealth}`
        );

        if (statusData.consecutiveFailures > 0) {
          console.log(
            `   ⚠️  Consecutive Failures: ${statusData.consecutiveFailures}`
          );
        }

        if (statusData.averageBuildTime) {
          console.log(
            `   Average Build: ${Math.round(
              statusData.averageBuildTime / 1000
            )}s`
          );
        }
      } else {
        console.log(
          `   Webhooks: ❌ Status check failed (${statusResponse.status})`
        );
      }
    } catch (error) {
      console.log(`   Webhooks: ❌ Error: ${error.message}`);
    }
  }

  /**
   * Analyze recent deployment activity
   */
  async analyzeRecentActivity() {
    if (!this.supabase) return;

    try {
      // Get recent webhook events
      const { data: recentEvents, error: eventsError } = await this.supabase
        .from("railway_webhook_logs")
        .select("event_type, deployment_id, processed_at")
        .order("processed_at", { ascending: false })
        .limit(10);

      if (eventsError) {
        console.log("   📊 Activity: Cannot query database");
        return;
      }

      if (!recentEvents || recentEvents.length === 0) {
        console.log("   📊 Activity: No recent webhook events");
        return;
      }

      // Group events by type
      const eventCounts = recentEvents.reduce((acc, event) => {
        acc[event.event_type] = (acc[event.event_type] || 0) + 1;
        return acc;
      }, {});

      console.log("   📊 Recent Activity:");
      Object.entries(eventCounts).forEach(([eventType, count]) => {
        const icon = this.getEventIcon(eventType);
        console.log(`      ${icon} ${eventType}: ${count}`);
      });

      // Check for deployment patterns
      const deploymentEvents = recentEvents.filter((e) =>
        e.event_type.startsWith("deployment.")
      );

      if (deploymentEvents.length > 0) {
        const lastDeployment = deploymentEvents[0];
        const timeSinceLast =
          Date.now() - new Date(lastDeployment.processed_at);
        const hoursSince = Math.floor(timeSinceLast / (1000 * 60 * 60));

        if (hoursSince < 24) {
          console.log(
            `   🕒 Last Deployment: ${hoursSince}h ago (${lastDeployment.event_type})`
          );
        }
      }

      // Check for failure patterns
      const failures = recentEvents.filter(
        (e) =>
          e.event_type === "deployment.failed" ||
          e.event_type === "deployment.crashed"
      );

      if (failures.length > 0) {
        console.log(
          `   ⚠️  Recent Failures: ${failures.length} in last 10 events`
        );
      }
    } catch (error) {
      console.log(`   📊 Activity: Error analyzing data (${error.message})`);
    }
  }

  /**
   * Generate deployment health report
   */
  async generateHealthReport() {
    console.log("📊 Deployment Health Report");
    console.log("=".repeat(60));

    if (!this.supabase) {
      console.log("❌ Cannot generate report: No database connection");
      return;
    }

    try {
      // Get deployment health summary
      const { data: healthSummary, error: healthError } =
        await this.supabase.rpc("get_deployment_health_summary");

      if (healthError || !healthSummary) {
        console.log("❌ Cannot get health summary:", healthError?.message);
        return;
      }

      const summary = healthSummary;

      console.log("📈 Last 24 Hours:");
      console.log(
        `   Total Deployments: ${summary.last_24_hours?.total_deployments || 0}`
      );
      console.log(`   Successful: ${summary.last_24_hours?.successful || 0}`);
      console.log(`   Failed: ${summary.last_24_hours?.failed || 0}`);
      console.log(
        `   Success Rate: ${summary.last_24_hours?.success_rate || 0}%`
      );

      console.log("");
      console.log("🔍 Last Deployment:");
      if (summary.last_deployment) {
        const lastDep = summary.last_deployment;
        console.log(`   Event: ${lastDep.event_type}`);
        console.log(`   Time: ${this.formatTimestamp(lastDep.processed_at)}`);
        console.log(
          `   Status: ${lastDep.success ? "✅ Success" : "❌ Failed"}`
        );
      } else {
        console.log("   No recent deployments found");
      }

      console.log("");
      console.log("⚡ Build Performance:");
      if (summary.build_performance) {
        const perf = summary.build_performance;
        console.log(
          `   Average Build Time: ${Math.round(perf.avg_build_time_ms / 1000)}s`
        );
        console.log(
          `   Fastest Build: ${Math.round(perf.fastest_build_ms / 1000)}s`
        );
        console.log(
          `   Slowest Build: ${Math.round(perf.slowest_build_ms / 1000)}s`
        );
        console.log(`   Total Builds: ${perf.total_successful_builds}`);
      }

      // Recent failures analysis
      if (summary.recent_failures && summary.recent_failures.length > 0) {
        console.log("");
        console.log("❌ Recent Failures:");
        summary.recent_failures.slice(0, 3).forEach((failure, index) => {
          console.log(
            `   ${index + 1}. ${this.formatTimestamp(failure.failed_at)}`
          );
          console.log(`      ID: ${failure.deployment_id}`);
          if (failure.error_details) {
            console.log(
              `      Error: ${failure.error_details.substring(0, 80)}...`
            );
          }
        });
      }
    } catch (error) {
      console.log("🔥 Report generation failed:", error.message);
    }
  }

  /**
   * Get icon for event type
   */
  getEventIcon(eventType) {
    const icons = {
      "deployment.success": "✅",
      "deployment.failed": "❌",
      "deployment.crashed": "💥",
      "deployment.building": "🏗️",
      "deployment.queued": "⏳",
      "deployment.deploying": "🚀",
      "service.connected": "🔌",
      "service.disconnected": "🔌",
    };
    return icons[eventType] || "📊";
  }

  /**
   * Format timestamp for display
   */
  formatTimestamp(timestamp) {
    if (!timestamp) return "Never";

    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;

    return date.toLocaleDateString();
  }

  /**
   * Helper method for HTTP requests with timeout
   */
  async makeRequest(path, options = {}) {
    const url = path.startsWith("http") ? path : `${this.baseUrl}${path}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeout);
      return response;
    } catch (error) {
      clearTimeout(timeout);
      throw error;
    }
  }
}

// Run monitor if called directly
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];

  const monitor = new RailwayDeploymentMonitor();

  if (command === "report") {
    // Generate one-time report
    monitor
      .generateHealthReport()
      .then(() => process.exit(0))
      .catch((error) => {
        console.error("🔥 Report failed:", error);
        process.exit(1);
      });
  } else {
    // Start continuous monitoring
    monitor.startMonitoring().catch((error) => {
      console.error("🔥 Monitoring failed:", error);
      process.exit(1);
    });
  }
}

module.exports = RailwayDeploymentMonitor;
