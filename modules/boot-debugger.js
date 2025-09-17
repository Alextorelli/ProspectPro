/**
 * Boot Phase Debugger
 *
 * Comprehensive debugging system for ProspectPro server startup phases.
 * Provides detailed logging, performance monitoring, and error tracking during boot.
 */

class BootPhaseDebugger {
  constructor() {
    this.phases = [];
    this.currentPhase = null;
    this.startTime = Date.now();
    this.errors = [];
    this.warnings = [];
    this.performanceMetrics = {};
  }

  /**
   * Start a new boot phase
   */
  startPhase(phaseId, description) {
    if (this.currentPhase) {
      this.endPhase(this.currentPhase.id);
    }

    this.currentPhase = {
      id: phaseId,
      description,
      startTime: Date.now(),
      status: "running",
    };

    console.log(`🔄 Boot Phase: ${description}`);
    return this.currentPhase;
  }

  /**
   * End current boot phase
   */
  endPhase(phaseId) {
    if (!this.currentPhase || this.currentPhase.id !== phaseId) {
      this.logWarning(
        `Phase mismatch: expected ${phaseId}, got ${this.currentPhase?.id}`
      );
      return;
    }

    const duration = Date.now() - this.currentPhase.startTime;
    this.currentPhase.endTime = Date.now();
    this.currentPhase.duration = duration;
    this.currentPhase.status = "completed";

    this.phases.push({ ...this.currentPhase });
    this.performanceMetrics[phaseId] = duration;

    console.log(
      `✅ Phase completed: ${this.currentPhase.description} (${duration}ms)`
    );
    this.currentPhase = null;
  }

  /**
   * Log error during boot
   */
  logError(phase, error, details = {}) {
    const errorInfo = {
      phase: phase || this.currentPhase?.id || "unknown",
      timestamp: Date.now(),
      error: error.message || error,
      stack: error.stack,
      details,
    };

    this.errors.push(errorInfo);
    console.error(`❌ Boot Error [${errorInfo.phase}]:`, errorInfo.error);

    if (details && Object.keys(details).length > 0) {
      console.error(`   Details:`, details);
    }
  }

  /**
   * Log warning during boot
   */
  logWarning(message, phase = null, details = {}) {
    const warningInfo = {
      phase: phase || this.currentPhase?.id || "unknown",
      timestamp: Date.now(),
      message,
      details,
    };

    this.warnings.push(warningInfo);
    console.warn(`⚠️  Boot Warning [${warningInfo.phase}]:`, message);
  }

  /**
   * Log info message
   */
  logInfo(message, phase = null) {
    const phaseInfo = phase || this.currentPhase?.id || "boot";
    console.log(`ℹ️  [${phaseInfo}] ${message}`);
  }

  /**
   * Track performance metric
   */
  trackMetric(name, value, unit = "ms") {
    this.performanceMetrics[name] = { value, unit, timestamp: Date.now() };
  }

  /**
   * Generate comprehensive boot report
   */
  generateBootReport() {
    const totalBootTime = Date.now() - this.startTime;

    const report = {
      timestamp: new Date().toISOString(),
      totalBootTime,
      phases: this.phases,
      errors: this.errors,
      warnings: this.warnings,
      performanceMetrics: this.performanceMetrics,
      summary: {
        totalPhases: this.phases.length,
        successfulPhases: this.phases.filter((p) => p.status === "completed")
          .length,
        errorCount: this.errors.length,
        warningCount: this.warnings.length,
        averagePhaseTime:
          this.phases.length > 0
            ? this.phases.reduce((sum, p) => sum + (p.duration || 0), 0) /
              this.phases.length
            : 0,
      },
    };

    return report;
  }

  /**
   * Print boot summary
   */
  printBootSummary() {
    const report = this.generateBootReport();

    console.log("\n" + "=".repeat(60));
    console.log("🚀 ProspectPro Boot Summary");
    console.log("=".repeat(60));
    console.log(`Total Boot Time: ${report.totalBootTime}ms`);
    console.log(
      `Phases Completed: ${report.summary.successfulPhases}/${report.summary.totalPhases}`
    );
    console.log(`Errors: ${report.summary.errorCount}`);
    console.log(`Warnings: ${report.summary.warningCount}`);

    if (report.summary.errorCount === 0) {
      console.log("✅ Boot completed successfully");
    } else {
      console.log("❌ Boot completed with errors");
      report.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. [${error.phase}] ${error.error}`);
      });
    }

    if (report.summary.warningCount > 0) {
      console.log("⚠️  Warnings during boot:");
      report.warnings.forEach((warning, index) => {
        console.log(`   ${index + 1}. [${warning.phase}] ${warning.message}`);
      });
    }

    console.log("\n📊 Performance Metrics:");
    Object.entries(report.performanceMetrics).forEach(([metric, data]) => {
      if (typeof data === "object") {
        console.log(`   ${metric}: ${data.value}${data.unit}`);
      } else {
        console.log(`   ${metric}: ${data}ms`);
      }
    });

    console.log("=".repeat(60));
    return report;
  }

  /**
   * Get current status
   */
  getStatus() {
    return {
      currentPhase: this.currentPhase,
      totalPhases: this.phases.length,
      errors: this.errors.length,
      warnings: this.warnings.length,
      uptime: Date.now() - this.startTime,
    };
  }

  /**
   * Handle graceful shutdown
   */
  handleShutdown(signal) {
    console.log(`\n🛑 Shutdown signal received: ${signal}`);

    if (this.currentPhase) {
      this.logWarning(
        `Shutdown during phase: ${this.currentPhase.description}`,
        this.currentPhase.id
      );
      this.endPhase(this.currentPhase.id);
    }

    const report = this.generateBootReport();
    console.log("\n📋 Final Boot Report:");
    console.log(`   Runtime: ${report.totalBootTime}ms`);
    console.log(
      `   Phases: ${report.summary.successfulPhases}/${report.summary.totalPhases}`
    );
    console.log(
      `   Issues: ${report.summary.errorCount} errors, ${report.summary.warningCount} warnings`
    );
  }
}

/**
 * Global boot debugger instance
 */
let globalBootDebugger = null;

/**
 * Get or create global boot debugger
 */
function getBootDebugger() {
  if (!globalBootDebugger) {
    globalBootDebugger = new BootPhaseDebugger();
  }
  return globalBootDebugger;
}

/**
 * Initialize boot debugging for ProspectPro
 */
function initializeBootDebugging() {
  const bootDebug = getBootDebugger();

  // Handle process signals
  process.on("SIGTERM", () => bootDebug.handleShutdown("SIGTERM"));
  process.on("SIGINT", () => bootDebug.handleShutdown("SIGINT"));
  process.on("uncaughtException", (error) => {
    bootDebug.logError("uncaught-exception", error);
    bootDebug.handleShutdown("UNCAUGHT_EXCEPTION");
    process.exit(1);
  });
  process.on("unhandledRejection", (reason, promise) => {
    bootDebug.logError(
      "unhandled-rejection",
      new Error(`Unhandled Promise Rejection: ${reason}`),
      { promise }
    );
  });

  return bootDebug;
}

module.exports = {
  BootPhaseDebugger,
  getBootDebugger,
  initializeBootDebugging,
};
