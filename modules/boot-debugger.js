/**
 * ProspectPro Boot Phase Debugging System
 * Provides granular startup instrumentation and diagnostic reporting
 */

class BootPhaseDebugger {
  constructor() {
    this.phases = new Map();
    this.startTime = Date.now();
    this.currentPhase = null;
    this.bootId = `boot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log(`🚦 BOOT[${this.bootId}] Starting application boot sequence`);
  }

  /**
   * Start a new boot phase with timing and description
   * @param {string} name - Unique phase identifier
   * @param {string} description - Human readable description
   * @returns {Object} Phase context object
   */
  startPhase(name, description) {
    const now = Date.now();
    
    // End current phase if one is active
    if (this.currentPhase && !this.currentPhase.ended) {
      console.warn(`⚠️ BOOT[${this.getRelativeTime(now)}ms] Auto-ending incomplete phase: ${this.currentPhase.name}`);
      this.endPhase(false, new Error('Phase auto-ended due to new phase start'));
    }
    
    this.currentPhase = {
      name,
      description,
      startTime: now,
      relativeMs: now - this.startTime,
      bootId: this.bootId,
      ended: false
    };
    
    console.log(`🚦 BOOT[${this.currentPhase.relativeMs}ms] Starting: ${name} - ${description}`);
    return { ...this.currentPhase };
  }

  /**
   * End the current boot phase with success/failure status
   * @param {boolean} success - Whether the phase completed successfully
   * @param {Error|null} error - Error object if phase failed
   * @returns {Object|null} Completed phase object
   */
  endPhase(success = true, error = null) {
    if (!this.currentPhase) {
      console.warn('⚠️ BOOT endPhase called but no active phase');
      return null;
    }
    
    const now = Date.now();
    const duration = now - this.currentPhase.startTime;
    
    const phase = {
      ...this.currentPhase,
      endTime: now,
      duration,
      success,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : null,
      ended: true
    };
    
    this.phases.set(phase.name, phase);
    
    const status = success ? '✅' : '❌';
    const totalTime = now - this.startTime;
    console.log(`${status} BOOT[${totalTime}ms] Completed: ${phase.name} (${duration}ms)`);
    
    if (!success && error) {
      console.error(`   💥 Error Details: ${error.message}`);
      if (error.stack) {
        console.error(`   📋 Stack: ${error.stack.split('\n').slice(0, 3).join('\n   ')}`);
      }
    }
    
    this.currentPhase = null;
    return phase;
  }

  /**
   * Force end any active phase (for cleanup)
   * @param {string} reason - Reason for force ending
   */
  forceEndCurrentPhase(reason = 'Force ended') {
    if (this.currentPhase) {
      this.endPhase(false, new Error(reason));
    }
  }

  /**
   * Get relative time from boot start
   * @param {number} timestamp - Optional timestamp (defaults to now)
   * @returns {number} Milliseconds since boot started
   */
  getRelativeTime(timestamp = Date.now()) {
    return timestamp - this.startTime;
  }

  /**
   * Get comprehensive phase report
   * @returns {Object} Complete boot analysis report
   */
  getPhaseReport() {
    const totalTime = Date.now() - this.startTime;
    const phases = Array.from(this.phases.values());
    const failed = phases.filter(p => !p.success);
    const successful = phases.filter(p => p.success);
    
    // Calculate timing statistics
    const durations = phases.map(p => p.duration).filter(d => d > 0);
    const avgDuration = durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;
    const maxDuration = durations.length > 0 ? Math.max(...durations) : 0;
    const minDuration = durations.length > 0 ? Math.min(...durations) : 0;
    
    return {
      bootId: this.bootId,
      bootStartTime: new Date(this.startTime).toISOString(),
      totalBootTime: totalTime,
      phaseCount: phases.length,
      successfulPhases: successful.length,
      failedPhases: failed.length,
      successRate: phases.length > 0 ? Math.round((successful.length / phases.length) * 100) : 0,
      currentPhase: this.currentPhase ? {
        name: this.currentPhase.name,
        running: true,
        duration: Date.now() - this.currentPhase.startTime
      } : null,
      timing: {
        average: Math.round(avgDuration),
        maximum: maxDuration,
        minimum: minDuration,
        totalPhaseTime: durations.reduce((a, b) => a + b, 0)
      },
      phases: phases.sort((a, b) => a.startTime - b.startTime),
      failed: failed.map(f => ({
        name: f.name,
        error: f.error?.message,
        duration: f.duration,
        relativeTime: f.relativeMs
      })),
      performance: {
        bootEfficiency: phases.length > 0 ? Math.round((durations.reduce((a, b) => a + b, 0) / totalTime) * 100) : 0,
        overhead: totalTime - durations.reduce((a, b) => a + b, 0)
      }
    };
  }

  /**
   * Log a comprehensive final boot report
   */
  logFinalReport() {
    const report = this.getPhaseReport();
    
    console.log(`\n📊 BOOT COMPLETE [${this.bootId}]`);
    console.log(`   ⏱️  Total Time: ${report.totalBootTime}ms`);
    console.log(`   🔢 Phases: ${report.phaseCount} (${report.successfulPhases} success, ${report.failedPhases} failed)`);
    console.log(`   📈 Success Rate: ${report.successRate}%`);
    console.log(`   ⚡ Efficiency: ${report.performance.bootEfficiency}% (${report.performance.overhead}ms overhead)`);
    
    if (report.failed.length > 0) {
      console.error(`   ❌ Failed Phases: ${report.failed.map(f => f.name).join(', ')}`);
      report.failed.forEach(f => {
        console.error(`      • ${f.name}: ${f.error} (${f.duration}ms @ ${f.relativeTime}ms)`);
      });
    }
    
    if (report.timing.maximum > 5000) {
      console.warn(`   🐌 Slow Phase Alert: Maximum phase duration ${report.timing.maximum}ms exceeds 5s threshold`);
    }
    
    console.log(`\n`);
    return report;
  }

  /**
   * Get a summary status for health checks
   * @returns {Object} Health check compatible status
   */
  getHealthStatus() {
    const report = this.getPhaseReport();
    return {
      status: report.failedPhases > 0 ? 'degraded' : 'healthy',
      bootId: this.bootId,
      totalBootTime: report.totalBootTime,
      successRate: report.successRate,
      failedPhases: report.failedPhases,
      currentPhase: report.currentPhase
    };
  }

  /**
   * Add a milestone marker (for significant events)
   * @param {string} milestone - Milestone description
   * @param {Object} metadata - Additional metadata
   */
  addMilestone(milestone, metadata = {}) {
    const now = Date.now();
    console.log(`🎯 BOOT[${this.getRelativeTime(now)}ms] Milestone: ${milestone}`);
    
    // Store milestone if needed for reporting
    if (!this.milestones) this.milestones = [];
    this.milestones.push({
      milestone,
      timestamp: now,
      relativeTime: this.getRelativeTime(now),
      metadata
    });
  }
}

module.exports = { BootPhaseDebugger };