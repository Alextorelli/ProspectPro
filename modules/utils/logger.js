/**
 * Enhanced Logger for ProspectPro Multi-Source Discovery
 * Supports multi-source API logging, cost tracking, and discovery pipeline monitoring
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

    // Multi-source discovery session tracking
    this.sessionStats = {
      multiSourceQueries: 0,
      foursquareHits: 0,
      googleHits: 0,
      crossPlatformMatches: 0,
      costSavings: 0,
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
   * Multi-source discovery logging methods
   */
  multiSourceQueryStart(query, location, sources) {
    if (this.shouldLog("info")) {
      console.log(`🔍 Multi-Source Query: "${query}" in ${location}`);
      console.log(`   📋 Sources: ${sources.join(" + ")}`);
    }
    this.sessionStats.multiSourceQueries++;
  }

  multiSourceQueryResult(
    foursquareCount,
    googleCount,
    mergedCount,
    costSavings
  ) {
    if (this.shouldLog("info")) {
      console.log(
        `   📊 Results: ${foursquareCount} Foursquare + ${googleCount} Google = ${mergedCount} unique`
      );
      if (costSavings > 0) {
        console.log(`   💰 Cost Savings: $${costSavings.toFixed(3)}`);
        this.sessionStats.costSavings += costSavings;
      }
    }

    this.sessionStats.foursquareHits += foursquareCount;
    this.sessionStats.googleHits += googleCount;

    if (foursquareCount > 0 && googleCount > 0) {
      this.sessionStats.crossPlatformMatches++;
    }
  }

  crossPlatformMatch(businessName, sources) {
    if (this.shouldLog("debug")) {
      console.log(`✅ Cross-platform match: ${businessName}`);
      console.log(`   📋 Found in: ${sources.join(", ")}`);
    }
  }

  cacheHit(source, cacheKey) {
    if (this.shouldLog("debug")) {
      console.log(`💾 Cache hit: ${source} - ${cacheKey.substring(0, 50)}...`);
    }
  }

  apiCostTracking(source, cost, totalSessionCost) {
    if (this.shouldLog("debug")) {
      console.log(
        `💳 API Cost: ${source} $${cost.toFixed(
          3
        )} | Session: $${totalSessionCost.toFixed(3)}`
      );
    }
  }

  /**
   * Session statistics reporting
   */
  logSessionStats() {
    if (this.shouldLog("info")) {
      console.log(`📊 Multi-Source Discovery Session Stats:`);
      console.log(`   🔍 Queries: ${this.sessionStats.multiSourceQueries}`);
      console.log(`   📍 Foursquare hits: ${this.sessionStats.foursquareHits}`);
      console.log(`   🔍 Google hits: ${this.sessionStats.googleHits}`);
      console.log(
        `   ✅ Cross-platform matches: ${this.sessionStats.crossPlatformMatches}`
      );
      console.log(
        `   💰 Total cost savings: $${this.sessionStats.costSavings.toFixed(3)}`
      );
    }
  }

  /**
   * Reset session statistics
   */
  resetSessionStats() {
    this.sessionStats = {
      multiSourceQueries: 0,
      foursquareHits: 0,
      googleHits: 0,
      crossPlatformMatches: 0,
      costSavings: 0,
    };
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
