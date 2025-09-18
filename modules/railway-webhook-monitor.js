/**
 * Railway Webhook Monitor for ProspectPro
 *
 * Provides comprehensive deployment debugging and monitoring through Railway webhooks.
 * Integrates with ProspectPro's 4-branch structure for organized development workflow.
 *
 * Features:
 * - Real-time deployment event processing
 * - Automated debugging recommendations
 * - Build performance tracking
 * - Crash recovery assistance
 * - Database logging and analytics
 * - ProspectPro-specific validation
 */

const crypto = require("crypto");
const { createClient } = require("@supabase/supabase-js");

class RailwayWebhookMonitor {
  constructor(options = {}) {
    this.webhookSecret = process.env.RAILWAY_WEBHOOK_SECRET;
    this.deploymentHistory = [];
    this.failureCount = 0;
    this.lastWebhookTimestamp = null;
    this.buildStartTimes = new Map();

    // Alert thresholds for deployment monitoring
    this.alertThresholds = {
      maxFailedDeployments: 3,
      crashRecoveryTimeMinutes: 5,
      buildTimeWarningMinutes: 10,
      healthCheckTimeoutMs: 15000,
    };

    // Initialize Supabase client for webhook event logging
    this.supabase = null;
    this.initializeSupabaseClient();
  }

  /**
   * Initialize Supabase client with defensive error handling
   */
  initializeSupabaseClient() {
    try {
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseKey =
        process.env.SUPABASE_SECRET_KEY ||
        process.env.SUPABASE_SERVICE_ROLE_KEY ||
        process.env.SUPABASE_ANON_KEY;

      if (supabaseUrl && supabaseKey) {
        this.supabase = createClient(supabaseUrl, supabaseKey);
        console.log("✅ Railway webhook monitor: Supabase logging enabled");
      } else {
        console.warn(
          "⚠️ Railway webhook monitor: Supabase logging disabled (missing credentials)"
        );
      }
    } catch (error) {
      console.error(
        "🔥 Railway webhook monitor: Failed to initialize Supabase client:",
        error.message
      );
      this.supabase = null;
    }
  }

  /**
   * Verify Railway webhook signature for security
   */
  verifyWebhookSignature(payload, signature) {
    if (!this.webhookSecret) {
      console.warn(
        "⚠️ RAILWAY_WEBHOOK_SECRET not configured - webhook verification disabled (development mode)"
      );
      return true; // Allow in development
    }

    if (!signature) {
      console.error("❌ Missing webhook signature header");
      return false;
    }

    try {
      const expectedSignature = crypto
        .createHmac("sha256", this.webhookSecret)
        .update(payload, "utf8")
        .digest("hex");

      const providedSignature = signature.replace("sha256=", "");
      const isValid = crypto.timingSafeEqual(
        Buffer.from(expectedSignature, "hex"),
        Buffer.from(providedSignature, "hex")
      );

      if (!isValid) {
        console.error("❌ Invalid webhook signature from Railway");
      }

      return isValid;
    } catch (error) {
      console.error("🔥 Webhook signature verification failed:", error.message);
      return false;
    }
  }

  /**
   * Main webhook processing endpoint
   */
  async processWebhook(req, res) {
    try {
      const signature =
        req.headers["x-railway-signature"] ||
        req.headers["x-railway-webhook-signature"];

      // Support raw body for signature; Express route uses express.raw()
      let payloadString;
      if (Buffer.isBuffer(req.body)) {
        payloadString = req.body.toString("utf8");
      } else if (typeof req.body === "string") {
        payloadString = req.body;
      } else {
        // Fallback serialization (may not match original JSON exactly)
        payloadString = JSON.stringify(req.body || {});
      }

      // Verify webhook authenticity (HMAC) or fallback to token
      const token =
        req.query.token || req.headers["x-railway-token"] || "";
      const hasValidSignature = this.verifyWebhookSignature(
        payloadString,
        signature
      );
      const tokenAllowed =
        !!this.webhookSecret && token && token === this.webhookSecret;
      if (!hasValidSignature && !tokenAllowed) {
        return res.status(401).json({ error: "Unauthorized webhook" });
      }

      // Parse JSON payload
      let event;
      try {
        event = typeof payloadString === "string" ? JSON.parse(payloadString) : {};
      } catch (e) {
        console.error("❌ Invalid JSON payload in webhook:", e.message);
        return res.status(400).json({ error: "Invalid JSON payload" });
      }
      const eventType = event.type;

      // Update last webhook timestamp
      this.lastWebhookTimestamp = new Date().toISOString();

      console.log(`🚂 Railway Webhook Received: ${eventType}`, {
        projectId: event.project?.id,
        environmentId: event.environment?.id,
        deploymentId: event.deployment?.id,
        timestamp: this.lastWebhookTimestamp,
      });

      // Process the webhook event
      await this.handleWebhookEvent(event);

  // Log event to database for analytics (idempotent)
  await this.logWebhookEvent(event, payloadString);

      res.status(200).json({
        status: "processed",
        eventType,
        timestamp: this.lastWebhookTimestamp,
        deploymentId: event.deployment?.id,
      });
    } catch (error) {
      console.error("🔥 Webhook processing failed:", error);
      res.status(500).json({
        error: "Webhook processing failed",
        message: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Route webhook events to appropriate handlers
   */
  async handleWebhookEvent(event) {
    const { type, deployment, project, environment, service } = event;

    try {
      switch (type) {
        case "deployment.success":
          await this.handleDeploymentSuccess(deployment, project, environment);
          break;

        case "deployment.failed":
          await this.handleDeploymentFailure(deployment, project, environment);
          break;

        case "deployment.crashed":
          await this.handleDeploymentCrash(deployment, project, environment);
          break;

        case "deployment.building":
          await this.handleDeploymentBuilding(deployment, project, environment);
          break;

        case "service.disconnected":
          await this.handleServiceDisconnected(service, event);
          break;

        case "service.connected":
          await this.handleServiceConnected(service, event);
          break;

        case "deployment.queued":
          await this.handleDeploymentQueued(deployment, project, environment);
          break;

        case "deployment.deploying":
          await this.handleDeploymentDeploying(
            deployment,
            project,
            environment
          );
          break;

        default:
          console.log(`ℹ️ Unhandled Railway webhook event: ${type}`);
      }
    } catch (error) {
      console.error(`🔥 Error handling webhook event ${type}:`, error.message);
    }
  }

  /**
   * Handle successful deployment with validation
   */
  async handleDeploymentSuccess(deployment, project, environment) {
    const buildTime = this.calculateBuildTime(deployment);
    const deployInfo = {
      id: deployment.id,
      status: "success",
      createdAt: deployment.createdAt,
      finishedAt: deployment.finishedAt,
      url: deployment.url,
      buildTime,
      branch: deployment.meta?.branch || "main",
    };

    console.log("✅ Deployment Success:", {
      ...deployInfo,
      buildTimeSeconds: buildTime ? Math.round(buildTime / 1000) : null,
    });

    // Reset failure counter on success
    this.resetFailureCounter();

    // Clean up build tracking
    if (deployment.id && this.buildStartTimes.has(deployment.id)) {
      this.buildStartTimes.delete(deployment.id);
    }

    // Store deployment info in history
    this.addDeploymentToHistory({
      ...deployInfo,
      timestamp: Date.now(),
      type: "success",
    });

    // Validate deployment health
    if (deployment.url) {
      await this.validateDeployment(deployment.url);
    }

    // Generate success metrics
    await this.logDeploymentMetrics(deployInfo, "success");
  }

  /**
   * Handle deployment failure with detailed analysis
   */
  async handleDeploymentFailure(deployment, project, environment) {
    const buildTime = this.calculateBuildTime(deployment);
    const failureInfo = {
      id: deployment.id,
      status: "failed",
      createdAt: deployment.createdAt,
      finishedAt: deployment.finishedAt,
      buildLogs: deployment.buildLogs,
      error: deployment.error || "Build failed without specific error",
      buildTime,
      branch: deployment.meta?.branch || "main",
    };

    console.error("❌ Deployment Failed:", {
      ...failureInfo,
      buildTimeSeconds: buildTime ? Math.round(buildTime / 1000) : null,
      errorSummary: this.extractErrorSummary(failureInfo.error),
    });

    // Track consecutive failures
    this.incrementFailureCounter();

    // Clean up build tracking
    if (deployment.id && this.buildStartTimes.has(deployment.id)) {
      this.buildStartTimes.delete(deployment.id);
    }

    // Store failure info in history
    this.addDeploymentToHistory({
      ...failureInfo,
      timestamp: Date.now(),
      type: "failure",
    });

    // Generate debugging recommendations
    const debuggingSteps = this.generateDebuggingSteps(failureInfo);
    console.log("🔧 Debugging Recommendations:", debuggingSteps);

    // Check if failure threshold exceeded
    await this.checkFailureThreshold();

    // Log failure metrics
    await this.logDeploymentMetrics(failureInfo, "failure");
  }

  /**
   * Handle application crash with recovery guidance
   */
  async handleDeploymentCrash(deployment, project, environment) {
    const crashInfo = {
      id: deployment.id,
      status: "crashed",
      createdAt: deployment.createdAt,
      crashTime: deployment.crashedAt || new Date().toISOString(),
      crashLogs: deployment.crashLogs,
      restartCount: deployment.restartCount || 0,
      exitCode: deployment.exitCode,
    };

    console.error("💥 Application Crashed:", {
      ...crashInfo,
      timeSinceStart: this.getTimeSinceDeployment(deployment.createdAt),
      autoRestarting: deployment.restartCount > 0,
    });

    // Store crash info in history
    this.addDeploymentToHistory({
      ...crashInfo,
      timestamp: Date.now(),
      type: "crash",
    });

    // Generate crash recovery recommendations
    const recoverySteps = this.generateCrashRecoverySteps(crashInfo);
    console.log("🚑 Recovery Recommendations:", recoverySteps);

    // Log crash metrics
    await this.logDeploymentMetrics(crashInfo, "crash");
  }

  /**
   * Handle deployment building event
   */
  async handleDeploymentBuilding(deployment, project, environment) {
    const buildInfo = {
      id: deployment.id,
      startTime: deployment.createdAt,
      branch: deployment.meta?.branch || "main",
      commit: deployment.meta?.commitSha?.substring(0, 7) || "unknown",
    };

    console.log("🏗️ Build Started:", buildInfo);

    // Track build start time for duration calculation
    this.buildStartTimes.set(deployment.id, Date.now());

    // Set build timeout warning
    setTimeout(() => {
      if (this.isBuildStillRunning(deployment.id)) {
        console.warn(
          `⏰ Build Warning: Build ${deployment.id} taking longer than ${this.alertThresholds.buildTimeWarningMinutes} minutes`
        );
      }
    }, this.alertThresholds.buildTimeWarningMinutes * 60 * 1000);
  }

  /**
   * Handle deployment queued event
   */
  async handleDeploymentQueued(deployment, project, environment) {
    console.log("⏳ Deployment Queued:", {
      id: deployment.id,
      branch: deployment.meta?.branch || "main",
      queuedAt: deployment.createdAt,
    });
  }

  /**
   * Handle deployment deploying event
   */
  async handleDeploymentDeploying(deployment, project, environment) {
    console.log("🚀 Deployment Starting:", {
      id: deployment.id,
      branch: deployment.meta?.branch || "main",
      deployingAt: new Date().toISOString(),
    });
  }

  /**
   * Handle service disconnected event
   */
  async handleServiceDisconnected(service, event) {
    console.warn("🔌 Service Disconnected:", {
      serviceId: service?.id || event.service?.id,
      disconnectedAt: new Date().toISOString(),
      reason: event.reason || "Unknown",
    });
  }

  /**
   * Handle service connected event
   */
  async handleServiceConnected(service, event) {
    console.log("🔌 Service Connected:", {
      serviceId: service?.id || event.service?.id,
      connectedAt: new Date().toISOString(),
    });
  }

  /**
   * Validate deployment health after successful deployment
   */
  async validateDeployment(deploymentUrl) {
    if (!deploymentUrl) {
      console.warn("⚠️ No deployment URL provided for validation");
      return;
    }

    try {
      console.log("🔍 Validating deployment health:", deploymentUrl);

      // Test health endpoint with timeout
      const healthController = new AbortController();
      const healthTimeout = setTimeout(
        () => healthController.abort(),
        this.alertThresholds.healthCheckTimeoutMs
      );

      try {
        const healthResponse = await fetch(`${deploymentUrl}/health`, {
          signal: healthController.signal,
          headers: { "User-Agent": "ProspectPro-Railway-Webhook-Monitor" },
        });

        clearTimeout(healthTimeout);

        if (healthResponse.ok) {
          const healthData = await healthResponse.json();
          console.log("✅ Health check passed:", {
            status: healthData.status,
            database: healthData.database?.status,
            uptime: healthData.uptime,
          });
        } else {
          console.warn(
            `⚠️ Health check returned status ${healthResponse.status}`
          );
        }
      } catch (healthError) {
        clearTimeout(healthTimeout);
        if (healthError.name === "AbortError") {
          console.warn("⏰ Health check timed out");
        } else {
          console.warn("⚠️ Health check failed:", healthError.message);
        }
      }

      // Test diagnostic endpoint with timeout
      const diagController = new AbortController();
      const diagTimeout = setTimeout(
        () => diagController.abort(),
        this.alertThresholds.healthCheckTimeoutMs
      );

      try {
        const diagResponse = await fetch(`${deploymentUrl}/diag`, {
          signal: diagController.signal,
          headers: { "User-Agent": "ProspectPro-Railway-Webhook-Monitor" },
        });

        clearTimeout(diagTimeout);

        if (diagResponse.ok) {
          const diagData = await diagResponse.json();
          console.log("📊 Diagnostic check passed:", {
            status: diagData.status,
            database: diagData.database?.status,
            boot: diagData.boot?.status,
            deployment: diagData.deployment?.status,
          });
        } else {
          console.warn(
            `⚠️ Diagnostic check returned status ${diagResponse.status}`
          );
        }
      } catch (diagError) {
        clearTimeout(diagTimeout);
        if (diagError.name === "AbortError") {
          console.warn("⏰ Diagnostic check timed out");
        } else {
          console.warn("⚠️ Diagnostic check failed:", diagError.message);
        }
      }
    } catch (error) {
      console.error("🔥 Post-deployment validation failed:", error.message);
    }
  }

  /**
   * Generate debugging recommendations based on failure patterns
   */
  generateDebuggingSteps(failureInfo) {
    const steps = [];
    const logs = (
      failureInfo.buildLogs ||
      failureInfo.error ||
      ""
    ).toLowerCase();

    // Analyze common failure patterns
    if (
      logs.includes("module not found") ||
      logs.includes("cannot find module")
    ) {
      steps.push("📦 Check package.json dependencies: npm install");
      steps.push("🔍 Verify all imported modules exist in node_modules");
      steps.push("🧹 Clear npm cache: npm cache clean --force");
    }

    if (logs.includes("syntax error") || logs.includes("unexpected token")) {
      steps.push("🔍 Run ESLint locally: npm run lint");
      steps.push("📝 Check recent commits for syntax issues");
      steps.push("🔧 Validate JavaScript syntax in changed files");
    }

    if (logs.includes("out of memory") || logs.includes("heap out of memory")) {
      steps.push("💾 Build process ran out of memory");
      steps.push(
        "📊 Consider optimizing build process or requesting more memory"
      );
      steps.push("🔍 Check for memory leaks in build scripts");
    }

    if (logs.includes("timeout") || logs.includes("timed out")) {
      steps.push("⏰ Build or API calls timed out");
      steps.push("🌐 Check network connectivity to external APIs");
      steps.push("🔑 Verify environment variables are set correctly");
    }

    if (logs.includes("permission denied") || logs.includes("access denied")) {
      steps.push("🔐 Permission issue detected");
      steps.push("🔑 Check Railway environment variables and secrets");
      steps.push("📁 Verify file system permissions");
    }

    if (logs.includes("port") && logs.includes("in use")) {
      steps.push("🚪 Port conflict detected");
      steps.push("⚙️ Railway should handle port assignment automatically");
      steps.push("🔍 Check if multiple processes are starting");
    }

    // ProspectPro-specific debugging steps
    steps.push("");
    steps.push("🔧 ProspectPro-Specific Debugging:");
    steps.push("git branch -a  # Verify Railway deploys from main branch");
    steps.push("git checkout debugging");
    steps.push("node debug/scripts/deployment-readiness.js");
    steps.push("node debug/scripts/validate-environment.js");
    steps.push("git checkout instructions");
    steps.push("# Review docs/troubleshooting/database-troubleshooting.md");

    // Branch-specific recommendations
    if (failureInfo.branch !== "main") {
      steps.push("");
      steps.push(
        `⚠️ Deployment from branch '${failureInfo.branch}' (not main)`
      );
      steps.push("🔄 Ensure Railway is configured to deploy from main branch");
      steps.push(
        "git checkout main && git merge your-branch && git push origin main"
      );
    }

    return steps.filter((step) => step.length > 0);
  }

  /**
   * Generate crash recovery recommendations
   */
  generateCrashRecoverySteps(crashInfo) {
    const steps = [];
    const logs = (crashInfo.crashLogs || "").toLowerCase();

    // Analyze crash patterns
    if (logs.includes("eaddrinuse")) {
      steps.push(
        "🚪 Port already in use (Railway should handle this automatically)"
      );
      steps.push("🔍 Check if multiple processes are starting");
      steps.push("⚙️ Verify Railway service configuration");
    }

    if (logs.includes("connection refused") || logs.includes("econnrefused")) {
      steps.push("🔌 Database connection refused");
      steps.push("🔑 Check SUPABASE_URL and SUPABASE_SECRET_KEY");
      steps.push("🌐 Verify Supabase service is online");
      steps.push(
        "git checkout debugging && node debug/scripts/validate-environment.js"
      );
    }

    if (logs.includes("out of memory") || logs.includes("heap")) {
      steps.push("💾 Memory exhaustion detected");
      steps.push("📊 Application may need more memory or optimization");
      steps.push("🔍 Check for memory leaks in lead processing");
    }

    if (logs.includes("enotfound") || logs.includes("network")) {
      steps.push("🌐 Network connectivity issue");
      steps.push("🔍 Check external API endpoints");
      steps.push("🔑 Verify API keys and network configuration");
    }

    if (crashInfo.exitCode) {
      steps.push(`🔢 Exit code: ${crashInfo.exitCode}`);
      if (crashInfo.exitCode === 1)
        steps.push("💥 General error - check application logs");
      if (crashInfo.exitCode === 2) steps.push("🔧 Misuse of shell command");
      if (crashInfo.exitCode === 126) steps.push("🚫 Command not executable");
      if (crashInfo.exitCode === 127) steps.push("❓ Command not found");
    }

    // ProspectPro-specific recovery steps
    steps.push("");
    steps.push("🚑 ProspectPro Recovery Steps:");
    steps.push("git checkout debugging");
    steps.push("node debug/scripts/validate-environment.js");
    steps.push("node debug/scripts/check-rls-access.js");
    steps.push("curl https://your-app.railway.app/health");
    steps.push("# Review Railway dashboard logs for detailed crash info");
    steps.push("git checkout instructions");
    steps.push("# Review docs/troubleshooting/ for specific error patterns");

    if (crashInfo.restartCount > 0) {
      steps.push("");
      steps.push(`🔄 Auto-restart count: ${crashInfo.restartCount}`);
      steps.push("Railway is attempting automatic recovery");
    }

    return steps.filter((step) => step.length > 0);
  }

  /**
   * Log webhook events to database for analytics
   */
  async logWebhookEvent(event, rawPayloadString = null) {
    if (!this.supabase) return;

    try {
      // Compute idempotency key: prefer deployment ID; else hash of key fields
      const idempotencyKey =
        event?.deployment?.id ||
        crypto
          .createHash("sha256")
          .update(
            [
              event?.type || "",
              rawPayloadString || JSON.stringify(event || {}),
            ].join("|"),
            "utf8"
          )
          .digest("hex");

      const upsertRow = {
        event_type: event.type,
        deployment_id: event.deployment?.id || null,
        project_id: event.project?.id || null,
        environment_id: event.environment?.id || null,
        event_data: event,
        processed_at: new Date().toISOString(),
        idempotency_key: idempotencyKey,
      };

      const { error } = await this.supabase
        .from("railway_webhook_logs")
        .upsert(upsertRow, { onConflict: "idempotency_key" });

      if (error) {
        console.warn("⚠️ Failed to log webhook to database:", error.message);
      }
    } catch (error) {
      console.warn("⚠️ Database logging error:", error.message);
    }
  }

  /**
   * Log deployment metrics for analytics
   */
  async logDeploymentMetrics(deploymentInfo, status) {
    if (!this.supabase) return;

    try {
      const { error } = await this.supabase.from("deployment_metrics").insert({
        deployment_id: deploymentInfo.id,
        status,
        build_time_ms: deploymentInfo.buildTime,
        branch: deploymentInfo.branch,
        created_at: deploymentInfo.createdAt,
        finished_at: deploymentInfo.finishedAt,
        error_summary:
          status === "failure"
            ? this.extractErrorSummary(deploymentInfo.error)
            : null,
        recorded_at: new Date().toISOString(),
      });

      if (error) {
        console.warn("⚠️ Failed to log deployment metrics:", error.message);
      }
    } catch (error) {
      console.warn("⚠️ Deployment metrics logging error:", error.message);
    }
  }

  /**
   * Get comprehensive deployment status for debugging dashboard
   */
  getDeploymentStatus() {
    return {
      recentDeployments: this.deploymentHistory.slice(0, 10),
      failureCount: this.getRecentFailureCount(),
      consecutiveFailures: this.failureCount,
      averageBuildTime: this.calculateAverageBuildTime(),
      lastSuccessfulDeployment: this.getLastSuccessfulDeployment(),
      lastFailedDeployment: this.getLastFailedDeployment(),
      systemHealth: this.getSystemHealthStatus(),
      buildMetrics: this.getBuildMetrics(),
      webhookStatus: {
        configured: !!this.webhookSecret,
        lastEventReceived: this.lastWebhookTimestamp,
        totalEventsProcessed: this.deploymentHistory.length,
        activeBuilds: this.buildStartTimes.size,
      },
    };
  }

  /**
   * Helper methods for deployment tracking and analytics
   */
  calculateBuildTime(deployment) {
    if (deployment.createdAt && deployment.finishedAt) {
      return new Date(deployment.finishedAt) - new Date(deployment.createdAt);
    }

    // Check if we tracked the start time
    if (deployment.id && this.buildStartTimes.has(deployment.id)) {
      return Date.now() - this.buildStartTimes.get(deployment.id);
    }

    return null;
  }

  addDeploymentToHistory(deployment) {
    this.deploymentHistory.unshift(deployment);

    // Keep only the last 50 deployments in memory
    if (this.deploymentHistory.length > 50) {
      this.deploymentHistory = this.deploymentHistory.slice(0, 50);
    }
  }

  resetFailureCounter() {
    this.failureCount = 0;
  }

  incrementFailureCounter() {
    this.failureCount = (this.failureCount || 0) + 1;
  }

  getRecentFailureCount() {
    const last24Hours = Date.now() - 24 * 60 * 60 * 1000;
    return this.deploymentHistory.filter(
      (d) => d.type === "failure" && d.timestamp > last24Hours
    ).length;
  }

  calculateAverageBuildTime() {
    const buildsWithTime = this.deploymentHistory
      .filter((d) => d.buildTime && d.buildTime > 0)
      .slice(0, 10);

    if (buildsWithTime.length === 0) return null;

    const totalTime = buildsWithTime.reduce((sum, d) => sum + d.buildTime, 0);
    return Math.round(totalTime / buildsWithTime.length); // milliseconds
  }

  getLastSuccessfulDeployment() {
    return this.deploymentHistory.find((d) => d.type === "success");
  }

  getLastFailedDeployment() {
    return this.deploymentHistory.find((d) => d.type === "failure");
  }

  getBuildMetrics() {
    const recent = this.deploymentHistory.slice(0, 20);
    const successful = recent.filter((d) => d.type === "success");
    const failed = recent.filter((d) => d.type === "failure");

    return {
      totalDeployments: recent.length,
      successfulDeployments: successful.length,
      failedDeployments: failed.length,
      successRate:
        recent.length > 0
          ? Math.round((successful.length / recent.length) * 100)
          : 0,
      averageSuccessfulBuildTime: this.calculateAverageTimeForType(successful),
      fastestBuild: this.getFastestBuild(successful),
      slowestBuild: this.getSlowestBuild(successful),
    };
  }

  calculateAverageTimeForType(deployments) {
    const withTime = deployments.filter((d) => d.buildTime && d.buildTime > 0);
    if (withTime.length === 0) return null;

    const total = withTime.reduce((sum, d) => sum + d.buildTime, 0);
    return Math.round(total / withTime.length);
  }

  getFastestBuild(deployments) {
    const withTime = deployments.filter((d) => d.buildTime && d.buildTime > 0);
    if (withTime.length === 0) return null;

    return Math.min(...withTime.map((d) => d.buildTime));
  }

  getSlowestBuild(deployments) {
    const withTime = deployments.filter((d) => d.buildTime && d.buildTime > 0);
    if (withTime.length === 0) return null;

    return Math.max(...withTime.map((d) => d.buildTime));
  }

  getSystemHealthStatus() {
    const recentDeployments = this.deploymentHistory.slice(0, 5);

    if (recentDeployments.length === 0) return "unknown";

    const successRate =
      recentDeployments.filter((d) => d.type === "success").length /
      recentDeployments.length;

    if (this.failureCount >= 3) return "critical";
    if (successRate >= 0.8) return "healthy";
    if (successRate >= 0.6) return "degraded";
    return "critical";
  }

  isBuildStillRunning(deploymentId) {
    return (
      this.buildStartTimes.has(deploymentId) &&
      !this.deploymentHistory.some(
        (d) =>
          d.id === deploymentId &&
          (d.type === "success" || d.type === "failure" || d.type === "crash")
      )
    );
  }

  async checkFailureThreshold() {
    if (this.failureCount >= this.alertThresholds.maxFailedDeployments) {
      console.error(
        `🚨 CRITICAL ALERT: ${this.failureCount} consecutive deployment failures detected`
      );
      console.error("🔧 Recommended actions:");
      console.error("   1. Review recent commits for breaking changes");
      console.error("   2. Check Railway environment variables");
      console.error("   3. Validate Supabase database connection");
      console.error("   4. Run deployment readiness check");
    }
  }

  extractErrorSummary(error) {
    if (!error) return null;

    const errorStr = typeof error === "string" ? error : JSON.stringify(error);

    // Extract key error information
    const lines = errorStr.split("\n");
    const relevantLines = lines
      .filter(
        (line) =>
          line.includes("Error:") ||
          line.includes("error") ||
          line.includes("failed") ||
          line.includes("Module not found") ||
          line.includes("SyntaxError")
      )
      .slice(0, 3);

    return relevantLines.join(" | ") || errorStr.substring(0, 200);
  }

  getTimeSinceDeployment(createdAt) {
    if (!createdAt) return null;

    const deployTime = new Date(createdAt);
    const now = new Date();
    const diffMs = now - deployTime;

    const minutes = Math.floor(diffMs / (1000 * 60));
    if (minutes < 60) return `${minutes}m`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ${minutes % 60}m`;

    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  }
}

module.exports = RailwayWebhookMonitor;
