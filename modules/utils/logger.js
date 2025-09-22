/**
 * Simple Logger for ProspectPro
 * Reduces terminal noise and provides configurable logging levels
 */

class Logger {
  constructor() {
    this.level = process.env.LOG_LEVEL || "info";
    this.levels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3,
    };
  }

  shouldLog(level) {
    return this.levels[level] <= this.levels[this.level];
  }

  error(message, ...args) {
    if (this.shouldLog("error")) {
      console.error(`❌ ERROR: ${message}`, ...args);
    }
  }

  warn(message, ...args) {
    if (this.shouldLog("warn")) {
      console.warn(`⚠️ WARN: ${message}`, ...args);
    }
  }

  info(message, ...args) {
    if (this.shouldLog("info")) {
      console.log(`ℹ️ INFO: ${message}`, ...args);
    }
  }

  debug(message, ...args) {
    if (this.shouldLog("debug")) {
      console.log(`🔍 DEBUG: ${message}`, ...args);
    }
  }

  /**
   * Batch processing helpers for campaign operations
   */
  batchStart(operation, count) {
    if (this.shouldLog("info")) {
      console.log(`🚀 Starting ${operation} for ${count} items...`);
    }
  }

  batchComplete(operation, processed, qualified = null) {
    if (this.shouldLog("info")) {
      const result =
        qualified !== null
          ? `${qualified}/${processed} qualified`
          : `${processed} processed`;
      console.log(`✅ ${operation} complete: ${result}`);
    }
  }

  /**
   * Email qualification filtering logger
   */
  emailFilterLog(business, hasEmail, hasVerified, sources, confidence) {
    if (this.shouldLog("debug")) {
      const name = business.name || business.businessName || "Unknown";
      const email = business.email || business.companyEmail || "none";
      const sourceInfo = Array.isArray(sources)
        ? sources.join(", ")
        : sources || "unknown";

      console.log(`📧 Email Filter - ${name}:`);
      console.log(
        `   Email: ${email} | Has: ${hasEmail} | Verified: ${hasVerified}`
      );
      console.log(`   Sources: ${sourceInfo} | Confidence: ${confidence}%`);
    }
  }

  progress(current, total, operation = "Processing") {
    if (
      this.shouldLog("info") &&
      current % Math.max(1, Math.floor(total / 10)) === 0
    ) {
      const percent = ((current / total) * 100).toFixed(0);
      console.log(`📈 ${operation}: ${current}/${total} (${percent}%)`);
    }
  }
}

// Singleton instance
const logger = new Logger();

module.exports = logger;
