/**
 * Production-Ready Environment Configuration Loader
 * Loads configuration from GitHub Actions, Supabase Vault, and environment variables
 *
 * Configuration Sources (in priority order):
 * 1. Process environment variables (GitHub Actions, CI/CD)
 * 2. Supabase Vault (for API keys)
 * 3. Local .env file (development only)
 * 4. Production defaults
 */

const path = require("path");
const fs = require("fs");

// Optional Supabase Vault loader (legacy module removed during refactor)
let vaultLoader = null;
const vaultLoaderPath = path.resolve(
  process.cwd(),
  "tooling/supabase/supabase-vault-loader.js"
);

if (fs.existsSync(vaultLoaderPath)) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    vaultLoader = require(vaultLoaderPath);
  } catch (error) {
    console.warn("⚠️ Supabase Vault loader failed to initialise:", error);
  }
}

class EnvironmentLoader {
  constructor() {
    this.configSources = [];
    this.vaultApiKeys = null;
    this.loadEnvironment();
  }

  loadEnvironment() {
    console.log("🔧 ProspectPro Environment Configuration Loader");
    console.log("📍 Loading configuration from multiple sources...\n");

    // 1. Load from .env file (development/local only)
    this.loadDotEnv();

    // 2. Process environment variables (CI/CD, GitHub Actions)
    this.loadProcessEnvironment();

    // 3. Set production defaults if not specified
    this.setProductionDefaults();

    // 4. Validate required configuration
    this.validateConfiguration();

    // 5. Display configuration summary
    this.displayConfigurationSummary();
  }

  /**
   * Load API keys from Supabase Vault
   * @returns {Promise<Object>} API keys object
   */
  async loadApiKeysFromVault() {
    // PRODUCTION/CLOUD RUN: Always use environment variables (no vault)
    if (
      process.env.NODE_ENV === "production" ||
      process.env.K_SERVICE ||
      process.env.CLOUD_RUN_SERVICE ||
      process.env.GOOGLE_CLOUD_PROJECT
    ) {
      console.log(
        "☁️ Production/Cloud Run detected: using direct environment variables"
      );
      console.log("💡 Vault bypassed for Cloud Run compatibility");
      return null; // Force fallback to environment variables
    }

    if (!vaultLoader) {
      console.warn(
        "⚠️ Vault loader not available, using environment variables only"
      );
      return null;
    }

    if (this.vaultApiKeys) {
      return this.vaultApiKeys; // Return cached keys
    }

    try {
      console.log(
        "🔑 Loading API keys from Supabase Vault (local development)..."
      );

      this.vaultApiKeys = await vaultLoader.loadStandardApiKeys();

      if (this.vaultApiKeys) {
        this.configSources.push("🔐 Supabase Vault (API Keys)");
        console.log("✅ API keys loaded from Supabase Vault");
      }

      return this.vaultApiKeys;
    } catch (error) {
      console.warn(
        "⚠️ Failed to load API keys from Supabase Vault:",
        error.message
      );
      return null;
    }
  }

  /**
   * Get API keys with environment variable fallback
   * @returns {Promise<Object>} Combined API keys
   */
  async getApiKeys() {
    const vaultKeys = await this.loadApiKeysFromVault();

    if (!vaultKeys) {
      // Fallback to environment variables only
      console.log("🔑 Using API keys from environment variables");

      const envApiKeys = {
        googlePlaces: process.env.GOOGLE_PLACES_API_KEY,
        foursquare:
          process.env.FOURSQUARE_SERVICE_API_KEY ||
          process.env.FOURSQUARE_PLACES_API_KEY,
        hunterIO: process.env.HUNTER_API_KEY,
        neverBounce: process.env.NEVERBOUNCE_API_KEY,
        zeroBounce: process.env.ZEROBOUNCE_API_KEY,
        apollo: process.env.APOLLO_API_KEY,
        scrapingdog: process.env.SCRAPINGDOG_API_KEY,
        californiaSOSApiKey: process.env.CALIFORNIA_SOS_API_KEY,
        socrata: process.env.SOCRATA_API_KEY,
        socrataToken: process.env.SOCRATA_APP_TOKEN,
        uspto: process.env.USPTO_TSDR_API_KEY,
        personalAccessToken: process.env.PERSONAL_ACCESS_TOKEN,
      };

      // Log which API keys are available
      const availableKeys = Object.entries(envApiKeys)
        .filter(([key, value]) => value && !value.includes("your_"))
        .map(([key]) => key);

      if (availableKeys.length > 0) {
        console.log(
          `✅ Found ${availableKeys.length} API keys in environment variables`
        );
        console.log(`   Available: ${availableKeys.join(", ")}`);
      } else {
        console.warn("⚠️ No API keys found in environment variables");
        if (process.env.ALLOW_DEGRADED_START === "true") {
          console.log("💡 Continuing in webhook-only mode");
        }
      }

      return envApiKeys;
    }

    return vaultKeys;
  }

  loadDotEnv() {
    const envPath = path.join(process.cwd(), ".env");
    if (fs.existsSync(envPath)) {
      require("dotenv").config({ path: envPath });
      this.configSources.push("📄 .env file");
      console.log("✅ Environment template loaded from .env file");
    } else {
      console.log("ℹ️  No .env file found (expected in CI/CD environments)");
    }
  }

  loadProcessEnvironment() {
    // Check for GitHub Actions / CI/CD injected variables
    const cicdVars = [
      "SUPABASE_URL",
      "SUPABASE_SECRET_KEY",
      "BUILD_TIMESTAMP",
      "BUILD_COMMIT",
      "BUILD_BRANCH",
    ];

    let cicdCount = 0;
    cicdVars.forEach((varName) => {
      if (process.env[varName] && !process.env[varName].includes("your_")) {
        cicdCount++;
      }
    });

    if (cicdCount >= 2) {
      this.configSources.push("🏭 GitHub Actions / CI/CD");
      console.log(`✅ ${cicdCount} variables loaded from CI/CD environment`);

      if (process.env.BUILD_TIMESTAMP) {
        console.log(`📅 Build: ${process.env.BUILD_TIMESTAMP}`);
      }
      if (process.env.BUILD_COMMIT) {
        console.log(`📋 Commit: ${process.env.BUILD_COMMIT?.substring(0, 8)}`);
      }
    }

    // Check for direct environment variables
    const envVars = ["SUPABASE_URL", "SUPABASE_SECRET_KEY"];
    let envCount = 0;
    envVars.forEach((varName) => {
      if (process.env[varName] && !process.env[varName].includes("your_")) {
        envCount++;
      }
    });

    if (envCount > 0 && cicdCount < 2) {
      this.configSources.push("🌍 Process Environment");
      console.log(`✅ ${envCount} variables loaded from process environment`);
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
      ENABLE_COST_TRACKING: "true",
      ENABLE_CIRCUIT_BREAKER: "true",
    };

    let defaultsSet = 0;
    Object.entries(defaults).forEach(([key, value]) => {
      if (!process.env[key]) {
        process.env[key] = value;
        defaultsSet++;
      }
    });

    if (defaultsSet > 0) {
      this.configSources.push("⚙️  Production Defaults");
      console.log(`✅ ${defaultsSet} production defaults applied`);
    }
  }

  validateConfiguration() {
    const required = ["SUPABASE_URL", "SUPABASE_SECRET_KEY", "NODE_ENV"];
    const missing = required.filter(
      (key) => !process.env[key] || process.env[key].includes("your_")
    );

    console.log("\n🔍 Configuration Validation:");

    if (missing.length > 0) {
      console.error("❌ Missing required environment variables:", missing);
      console.error("\n💡 Solutions:");
      console.error(
        "   🔧 Production: Ensure GitHub repository secrets are configured"
      );
      console.error("   🛠️  Development: Add real values to .env file");
      console.error("   📋 Secrets needed: SUPABASE_URL, SUPABASE_SECRET_KEY");

      if (process.env.ALLOW_DEGRADED_START !== "true") {
        console.error(
          "\n❌ Set ALLOW_DEGRADED_START=true to continue without full configuration"
        );
        process.exit(1);
      } else {
        console.warn(
          "⚠️  Continuing in degraded mode without complete configuration"
        );
      }
    } else {
      console.log("✅ All required environment variables configured");
    }

    // Validate Supabase configuration
    const supabaseUrl = process.env.SUPABASE_URL;
    if (supabaseUrl && !supabaseUrl.includes("your_")) {
      if (supabaseUrl.includes("supabase.co")) {
        console.log("✅ Supabase URL format validated");
      } else {
        console.warn("⚠️  Supabase URL format may be incorrect");
      }
    }
  }

  displayConfigurationSummary() {
    console.log("\n📊 Configuration Sources Summary:");
    this.configSources.forEach((source) => {
      console.log(`   ${source}`);
    });

    console.log("\n🎯 Runtime Configuration:");
    console.log(`   Environment: ${process.env.NODE_ENV}`);
    console.log(`   Port: ${process.env.PORT || 3000}`);
    console.log(
      `   Degraded Mode Allowed: ${
        process.env.ALLOW_DEGRADED_START === "true" ? "Yes" : "No"
      }`
    );

    if (
      process.env.SUPABASE_URL &&
      !process.env.SUPABASE_URL.includes("your_")
    ) {
      const url = process.env.SUPABASE_URL;
      console.log(`   Supabase: ${url.substring(0, 30)}...`);
    }

    // Show vault configuration expectation
    console.log("\n🔑 API Keys Expected from Supabase Vault:");
    const expectedVaultKeys = [
      "GOOGLE_PLACES_API_KEY",
      "HUNTER_IO_API_KEY",
      "NEVERBOUNCE_API_KEY",
      "APOLLO_API_KEY",
      "FOURSQUARE_SERVICE_API_KEY",
      "PERSONAL_ACCESS_TOKEN",
    ];
    expectedVaultKeys.forEach((key) => {
      console.log(`   📝 ${key}`);
    });

    console.log("\n" + "=".repeat(50) + "\n");
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

      // Build information (from CI/CD)
      build: {
        timestamp: process.env.BUILD_TIMESTAMP,
        commit: process.env.BUILD_COMMIT,
        branch: process.env.BUILD_BRANCH,
        actor: process.env.BUILD_ACTOR,
      },
    };
  }
}

module.exports = EnvironmentLoader;
