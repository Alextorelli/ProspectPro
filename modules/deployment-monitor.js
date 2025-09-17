/**
 * ProspectPro Comprehensive Deployment Monitor
 *
 * This module provides extensive monitoring, health checking, and debugging
 * capabilities for Railway deployment and application lifecycle management.
 */

const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");
const { promisify } = require("util");
const execAsync = promisify(exec);

// Enhanced boot debugger with comprehensive monitoring
class ProspectProDeploymentMonitor {
  constructor() {
    this.bootId = `monitor_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    this.startTime = Date.now();
    this.phases = new Map();
    this.healthChecks = new Map();
    this.errorHistory = [];
    this.metrics = {
      bootTime: 0,
      memoryUsage: [],
      cpuUsage: [],
      diskUsage: [],
      networkConnections: [],
      databaseConnections: [],
    };

    // Initialize monitoring
    this.initializeMonitoring();
  }

  initializeMonitoring() {
    console.log(
      `🚦 MONITOR[${this.bootId}] Comprehensive deployment monitoring initiated`
    );

    // Set up periodic health checks
    this.healthCheckInterval = setInterval(() => {
      this.performHealthChecks();
    }, 30000); // Every 30 seconds

    // Memory monitoring
    this.memoryInterval = setInterval(() => {
      this.recordMemoryUsage();
    }, 5000); // Every 5 seconds

    // Process cleanup on exit
    process.on("SIGTERM", () => this.cleanup());
    process.on("SIGINT", () => this.cleanup());
    process.on("uncaughtException", (error) => this.handleCriticalError(error));
    process.on("unhandledRejection", (error) =>
      this.handleCriticalError(error)
    );
  }

  startPhase(phaseName, description = "") {
    const startTime = Date.now();
    const phase = {
      name: phaseName,
      description,
      startTime,
      status: "running",
      duration: null,
      error: null,
      subPhases: [],
    };

    this.phases.set(phaseName, phase);
    console.log(
      `🚦 MONITOR[${this.getElapsedTime()}ms] Starting: ${phaseName} - ${description}`
    );

    return {
      addSubPhase: (subPhaseName, subDescription) => {
        phase.subPhases.push({
          name: subPhaseName,
          description: subDescription,
          timestamp: Date.now(),
          status: "completed",
        });
        console.log(
          `🚦 MONITOR[${this.getElapsedTime()}ms]   ↳ ${subPhaseName}: ${subDescription}`
        );
      },

      complete: (result = null) => {
        phase.status = "completed";
        phase.duration = Date.now() - startTime;
        phase.result = result;
        console.log(
          `✅ MONITOR[${this.getElapsedTime()}ms] Completed: ${phaseName} (${
            phase.duration
          }ms)`
        );
        return phase;
      },

      fail: (error) => {
        phase.status = "failed";
        phase.duration = Date.now() - startTime;
        phase.error = error.message || error;
        this.errorHistory.push({
          phase: phaseName,
          error: error.message || error,
          timestamp: new Date().toISOString(),
          stack: error.stack,
        });
        console.log(
          `❌ MONITOR[${this.getElapsedTime()}ms] Failed: ${phaseName} - ${
            error.message || error
          }`
        );
        return phase;
      },
    };
  }

  async performHealthChecks() {
    const healthCheck = {
      timestamp: Date.now(),
      checks: {},
      overallStatus: "healthy",
    };

    // System health checks
    try {
      healthCheck.checks.memory = await this.checkMemoryHealth();
      healthCheck.checks.disk = await this.checkDiskHealth();
      healthCheck.checks.network = await this.checkNetworkHealth();
      healthCheck.checks.processes = await this.checkProcessHealth();
      healthCheck.checks.environment = await this.checkEnvironmentHealth();
      healthCheck.checks.database = await this.checkDatabaseHealth();
    } catch (error) {
      console.error(`⚠️ Health check failed: ${error.message}`);
      healthCheck.checks.error = error.message;
      healthCheck.overallStatus = "degraded";
    }

    // Determine overall health
    const failedChecks = Object.values(healthCheck.checks).filter(
      (check) =>
        check && typeof check === "object" && check.status === "unhealthy"
    );

    if (failedChecks.length > 0) {
      healthCheck.overallStatus = "unhealthy";
    } else if (failedChecks.length > 1) {
      healthCheck.overallStatus = "degraded";
    }

    this.healthChecks.set(Date.now(), healthCheck);

    // Log significant health changes
    if (healthCheck.overallStatus !== "healthy") {
      console.log(
        `🚨 MONITOR[${this.getElapsedTime()}ms] Health Status: ${
          healthCheck.overallStatus
        }`
      );
    }
  }

  async checkMemoryHealth() {
    const usage = process.memoryUsage();
    const totalMem = require("os").totalmem();
    const freeMem = require("os").freemem();
    const usedMem = totalMem - freeMem;
    const memoryUsagePercent = (usedMem / totalMem) * 100;

    return {
      status:
        memoryUsagePercent > 90
          ? "unhealthy"
          : memoryUsagePercent > 80
          ? "degraded"
          : "healthy",
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024),
      heapTotal: Math.round(usage.heapTotal / 1024 / 1024),
      external: Math.round(usage.external / 1024 / 1024),
      systemMemoryUsage: Math.round(memoryUsagePercent),
      rss: Math.round(usage.rss / 1024 / 1024),
    };
  }

  async checkDiskHealth() {
    try {
      const { stdout } = await execAsync("df -h / | tail -1");
      const diskInfo = stdout.trim().split(/\s+/);
      const usagePercent = parseInt(diskInfo[4]) || 0;

      return {
        status:
          usagePercent > 95
            ? "unhealthy"
            : usagePercent > 85
            ? "degraded"
            : "healthy",
        usage: `${usagePercent}%`,
        available: diskInfo[3] || "unknown",
        total: diskInfo[1] || "unknown",
      };
    } catch (error) {
      return {
        status: "unknown",
        error: error.message,
      };
    }
  }

  async checkNetworkHealth() {
    try {
      // Check if we can resolve DNS
      const { stdout } = await execAsync("nslookup google.com");
      const dnsWorking =
        stdout.includes("Non-authoritative answer") ||
        stdout.includes("Address:");

      // Check network interface
      const { stdout: ifconfig } = await execAsync("ip route show default");
      const hasDefaultRoute = ifconfig.length > 0;

      return {
        status: dnsWorking && hasDefaultRoute ? "healthy" : "unhealthy",
        dns: dnsWorking ? "working" : "failed",
        routing: hasDefaultRoute ? "working" : "failed",
      };
    } catch (error) {
      return {
        status: "unhealthy",
        error: error.message,
      };
    }
  }

  async checkProcessHealth() {
    try {
      const { stdout } = await execAsync("ps aux | wc -l");
      const processCount = parseInt(stdout.trim()) || 0;

      // Check for zombie processes
      const { stdout: zombies } = await execAsync(
        'ps aux | grep -c "<defunct>" || echo "0"'
      );
      const zombieCount = parseInt(zombies.trim()) || 0;

      return {
        status: processCount < 500 && zombieCount < 5 ? "healthy" : "degraded",
        totalProcesses: processCount,
        zombieProcesses: zombieCount,
      };
    } catch (error) {
      return {
        status: "unknown",
        error: error.message,
      };
    }
  }

  async checkEnvironmentHealth() {
    const requiredVars = [
      "SUPABASE_URL",
      "SUPABASE_SECRET_KEY",
      "GOOGLE_PLACES_API_KEY",
      "PORT",
    ];

    const missingVars = requiredVars.filter((varName) => !process.env[varName]);
    const warnings = [];

    // Check for deprecated variables
    if (
      process.env.SUPABASE_SERVICE_ROLE_KEY &&
      !process.env.SUPABASE_SECRET_KEY
    ) {
      warnings.push("Using deprecated SUPABASE_SERVICE_ROLE_KEY");
    }

    return {
      status: missingVars.length === 0 ? "healthy" : "unhealthy",
      missingVariables: missingVars,
      warnings,
      totalEnvVars: Object.keys(process.env).length,
    };
  }

  async checkDatabaseHealth() {
    try {
      if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SECRET_KEY) {
        return {
          status: "unconfigured",
          error: "Database credentials not configured",
        };
      }

      // This would be replaced with actual database connectivity check
      const startTime = Date.now();

      // Simulate database connectivity check
      // In production, this would use the actual Supabase client
      const connectionTime = Date.now() - startTime;

      return {
        status: connectionTime < 5000 ? "healthy" : "degraded",
        connectionTime,
        configured: true,
      };
    } catch (error) {
      return {
        status: "unhealthy",
        error: error.message,
      };
    }
  }

  recordMemoryUsage() {
    const usage = process.memoryUsage();
    const timestamp = Date.now();

    this.metrics.memoryUsage.push({
      timestamp,
      heapUsed: usage.heapUsed,
      heapTotal: usage.heapTotal,
      external: usage.external,
      rss: usage.rss,
    });

    // Keep only last 100 records
    if (this.metrics.memoryUsage.length > 100) {
      this.metrics.memoryUsage.shift();
    }
  }

  getElapsedTime() {
    return Date.now() - this.startTime;
  }

  generateHealthReport() {
    const currentTime = Date.now();
    const uptime = currentTime - this.startTime;
    const completedPhases = Array.from(this.phases.values()).filter(
      (p) => p.status === "completed"
    );
    const failedPhases = Array.from(this.phases.values()).filter(
      (p) => p.status === "failed"
    );
    const latestHealthCheck = Array.from(this.healthChecks.values()).pop();

    return {
      bootId: this.bootId,
      uptime,
      startTime: new Date(this.startTime).toISOString(),
      currentTime: new Date(currentTime).toISOString(),
      phases: {
        total: this.phases.size,
        completed: completedPhases.length,
        failed: failedPhases.length,
        running:
          this.phases.size - completedPhases.length - failedPhases.length,
      },
      healthStatus: latestHealthCheck?.overallStatus || "unknown",
      lastHealthCheck: latestHealthCheck?.timestamp
        ? new Date(latestHealthCheck.timestamp).toISOString()
        : "none",
      errorCount: this.errorHistory.length,
      memoryTrend: this.getMemoryTrend(),
      systemResources: latestHealthCheck?.checks || {},
    };
  }

  getMemoryTrend() {
    if (this.metrics.memoryUsage.length < 2) return "insufficient_data";

    const recent = this.metrics.memoryUsage.slice(-10);
    const first = recent[0];
    const last = recent[recent.length - 1];

    const heapGrowth =
      ((last.heapUsed - first.heapUsed) / first.heapUsed) * 100;

    if (heapGrowth > 20) return "increasing_rapidly";
    if (heapGrowth > 5) return "increasing";
    if (heapGrowth < -5) return "decreasing";
    return "stable";
  }

  handleCriticalError(error) {
    console.error(
      `🚨 CRITICAL ERROR[${this.getElapsedTime()}ms]: ${error.message}`
    );
    console.error(error.stack);

    this.errorHistory.push({
      type: "critical",
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      uptime: this.getElapsedTime(),
    });

    // Generate emergency report
    const emergencyReport = {
      ...this.generateHealthReport(),
      criticalError: {
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
      },
      emergencyShutdown: true,
    };

    // Write emergency report
    const reportPath = path.join(
      process.cwd(),
      `emergency-report-${Date.now()}.json`
    );
    fs.writeFileSync(reportPath, JSON.stringify(emergencyReport, null, 2));
    console.error(`🚨 Emergency report written to: ${reportPath}`);
  }

  cleanup() {
    console.log(
      `🔄 MONITOR[${this.getElapsedTime()}ms] Cleaning up monitoring system...`
    );

    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    if (this.memoryInterval) {
      clearInterval(this.memoryInterval);
    }

    // Generate final report
    const finalReport = this.generateHealthReport();
    const reportPath = path.join(
      process.cwd(),
      `monitor-final-report-${Date.now()}.json`
    );
    fs.writeFileSync(reportPath, JSON.stringify(finalReport, null, 2));
    console.log(`📋 Final monitoring report: ${reportPath}`);
  }

  // Express middleware for health endpoint
  getHealthEndpoint() {
    return (req, res) => {
      const report = this.generateHealthReport();
      const statusCode =
        report.healthStatus === "healthy"
          ? 200
          : report.healthStatus === "degraded"
          ? 206
          : 503;

      res.status(statusCode).json(report);
    };
  }

  // Express middleware for detailed diagnostics
  getDiagnosticsEndpoint() {
    return (req, res) => {
      const fullDiagnostics = {
        ...this.generateHealthReport(),
        phases: Array.from(this.phases.values()),
        errorHistory: this.errorHistory,
        metrics: this.metrics,
        recentHealthChecks: Array.from(this.healthChecks.entries())
          .slice(-10)
          .map(([timestamp, check]) => ({
            timestamp: new Date(timestamp).toISOString(),
            ...check,
          })),
      };

      res.json(fullDiagnostics);
    };
  }
}

// Enhanced logging utilities
class EnhancedLogger {
  constructor(serviceName = "ProspectPro") {
    this.serviceName = serviceName;
    this.logLevel = process.env.LOG_LEVEL || "info";
    this.logLevels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3,
      trace: 4,
    };
  }

  log(level, message, metadata = {}) {
    if (this.logLevels[level] <= this.logLevels[this.logLevel]) {
      const logEntry = {
        timestamp: new Date().toISOString(),
        service: this.serviceName,
        level: level.toUpperCase(),
        message,
        ...metadata,
      };

      // Colorize based on level
      const colors = {
        error: "\x1b[31m",
        warn: "\x1b[33m",
        info: "\x1b[36m",
        debug: "\x1b[35m",
        trace: "\x1b[37m",
      };

      const colorCode = colors[level] || "\x1b[37m";
      const resetCode = "\x1b[0m";

      console.log(
        `${colorCode}[${logEntry.timestamp}] ${logEntry.level}: ${message}${resetCode}`
      );

      if (Object.keys(metadata).length > 0) {
        console.log(
          `${colorCode}${JSON.stringify(metadata, null, 2)}${resetCode}`
        );
      }
    }
  }

  error(message, metadata) {
    this.log("error", message, metadata);
  }
  warn(message, metadata) {
    this.log("warn", message, metadata);
  }
  info(message, metadata) {
    this.log("info", message, metadata);
  }
  debug(message, metadata) {
    this.log("debug", message, metadata);
  }
  trace(message, metadata) {
    this.log("trace", message, metadata);
  }
}

// Railway-specific deployment utilities
class RailwayDeploymentUtils {
  static isRailwayEnvironment() {
    return !!(
      process.env.RAILWAY_ENVIRONMENT || process.env.RAILWAY_PROJECT_ID
    );
  }

  static getRailwayInfo() {
    return {
      projectId: process.env.RAILWAY_PROJECT_ID || "local",
      environment: process.env.RAILWAY_ENVIRONMENT || "development",
      serviceId: process.env.RAILWAY_SERVICE_ID || "local",
      deploymentId: process.env.RAILWAY_DEPLOYMENT_ID || Date.now().toString(),
      region: process.env.RAILWAY_REGION || "local",
    };
  }

  static getDeploymentMetrics() {
    const railwayInfo = this.getRailwayInfo();
    const processInfo = {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      pid: process.pid,
      uptime: process.uptime(),
      cwd: process.cwd(),
    };

    return {
      ...railwayInfo,
      ...processInfo,
      startTime: new Date().toISOString(),
      environment: {
        node: process.version,
        railway: this.isRailwayEnvironment(),
        port: process.env.PORT || 3000,
      },
    };
  }
}

module.exports = {
  ProspectProDeploymentMonitor,
  EnhancedLogger,
  RailwayDeploymentUtils,
};
