/**
 * Production-Ready Environment Configuration Loader
 * Loads configuration from GitHub secrets, environment variables, and defaults
 */

const path = require("path");
const fs = require("fs");

class EnvironmentLoader {
  constructor() {
    this.loadEnvironment();
  }

  loadEnvironment() {
    // 1. Load from .env file (template/defaults)
    this.loadDotEnv();

    // 2. Override with GitHub Codespaces secrets (highest priority)
    this.loadGitHubSecrets();

    // 3. Set production defaults if not specified
    this.setProductionDefaults();

    // 4. Validate required configuration
    this.validateConfiguration();
  }

  loadDotEnv() {
    const envPath = path.join(process.cwd(), ".env");
    if (fs.existsSync(envPath)) {
      require("dotenv").config({ path: envPath });
      console.log("✅ Environment template loaded");
    }
  }

  loadGitHubSecrets() {
    // GitHub Codespaces automatically injects these
    const githubSecrets = ["SUPABASE_URL", "SUPABASE_SECRET_KEY"];

    let secretsLoaded = 0;
    githubSecrets.forEach((secret) => {
      if (process.env[secret]) {
        console.log(`✅ GitHub secret loaded: ${secret}`);
        secretsLoaded++;
      }
    });

    if (secretsLoaded > 0) {
      console.log(`✅ ${secretsLoaded} GitHub secrets loaded successfully`);
    }
  }

  setProductionDefaults() {
    // Set production-optimized defaults
    const defaults = {
      NODE_ENV: "production",
      ENABLE_PROMETHEUS_METRICS: "true",
      ENABLE_PERFORMANCE_LOGGING: "true",
      ENABLE_TTL_CACHE: "true",
      ENABLE_BATCH_PROCESSING: "true",
      CACHE_TTL_SECONDS: "3600",
      MAX_CONCURRENT_REQUESTS: "10",
      MIN_CONFIDENCE_SCORE: "85",
    };

    Object.entries(defaults).forEach(([key, value]) => {
      if (!process.env[key]) {
        process.env[key] = value;
        console.log(`✅ Production default set: ${key}=${value}`);
      }
    });
  }

  validateConfiguration() {
    const required = ["SUPABASE_URL", "SUPABASE_SECRET_KEY", "NODE_ENV"];

    const missing = required.filter((key) => !process.env[key]);

    if (missing.length > 0) {
      console.error("❌ Missing required environment variables:", missing);
      if (process.env.ALLOW_DEGRADED_START !== "true") {
        process.exit(1);
      }
    } else {
      console.log("✅ All required environment variables configured");
    }
  }

  // Get environment-specific configuration
  getConfig() {
    const isProduction = process.env.NODE_ENV === "production";
    const isDevelopment = process.env.NODE_ENV === "development";

    return {
      environment: process.env.NODE_ENV,
      isProduction,
      isDevelopment,

      // Database
      supabase: {
        url: process.env.SUPABASE_URL,
        secretKey: process.env.SUPABASE_SECRET_KEY,
      },

      // Performance Settings
      performance: {
        requestTimeout: parseInt(process.env.REQUEST_TIMEOUT) || 30000,
        maxConcurrentRequests:
          parseInt(process.env.MAX_CONCURRENT_REQUESTS) || 10,
        batchSize: parseInt(process.env.BATCH_SIZE) || 25,
        cacheTTL: parseInt(process.env.CACHE_TTL_SECONDS) || 3600,
      },

      // Budget Controls
      budget: {
        dailyLimit: parseFloat(process.env.DAILY_BUDGET_LIMIT) || 100.0,
        defaultLimit: parseFloat(process.env.DEFAULT_BUDGET_LIMIT) || 25.0,
        perLeadLimit: parseFloat(process.env.PER_LEAD_COST_LIMIT) || 2.0,
        alertThreshold: parseFloat(process.env.COST_ALERT_THRESHOLD) || 80.0,
      },

      // Quality Standards
      quality: {
        minConfidenceScore: parseInt(process.env.MIN_CONFIDENCE_SCORE) || 85,
        preValidationThreshold:
          parseInt(process.env.PRE_VALIDATION_THRESHOLD) || 75,
        exportThreshold:
          parseInt(process.env.EXPORT_CONFIDENCE_THRESHOLD) || 90,
      },

      // Feature Flags
      features: {
        enableMetrics: process.env.ENABLE_PROMETHEUS_METRICS === "true",
        enableCaching: process.env.ENABLE_TTL_CACHE === "true",
        enableBatching: process.env.ENABLE_BATCH_PROCESSING === "true",
        enableCircuitBreaker: process.env.ENABLE_CIRCUIT_BREAKER === "true",
        enableCostTracking: process.env.ENABLE_COST_TRACKING === "true",
      },
    };
  }
}

module.exports = EnvironmentLoader;
