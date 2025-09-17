#!/usr/bin/env node

/**
 * Railway Webhook Setup Validator
 *
 * Validates Railway webhook configuration and tests webhook processing
 * for ProspectPro deployment monitoring system.
 */

const crypto = require("crypto");
const { createClient } = require("@supabase/supabase-js");

class RailwayWebhookValidator {
  constructor() {
    this.results = {
      environment: {},
      webhook_config: {},
      database: {},
      server: {},
      overall: "pending",
    };
  }

  /**
   * Main validation orchestrator
   */
  async runValidation() {
    console.log("🔍 ProspectPro Railway Webhook Setup Validator");
    console.log("=".repeat(60));
    console.log("");

    try {
      await this.validateEnvironmentVariables();
      await this.validateWebhookConfiguration();
      await this.validateDatabaseSchema();
      await this.validateServerEndpoints();

      this.generateValidationReport();
    } catch (error) {
      console.error("🔥 Critical validation error:", error.message);
      this.results.overall = "failed";
    }

    return this.results;
  }

  /**
   * Validate required environment variables
   */
  async validateEnvironmentVariables() {
    console.log("📋 Step 1: Validating Environment Variables");
    console.log("-".repeat(40));

    const requiredVars = {
      SUPABASE_URL: "Supabase project URL",
      SUPABASE_SECRET_KEY: "Supabase service role key (preferred)",
      RAILWAY_WEBHOOK_SECRET:
        "Railway webhook secret for signature verification",
    };

    const optionalVars = {
      SUPABASE_SERVICE_ROLE_KEY: "Alternative Supabase service role key",
      SUPABASE_ANON_KEY: "Supabase anonymous key (fallback)",
      PERSONAL_ACCESS_TOKEN: "Admin access token for deployment dashboard",
      ENABLE_WEBHOOK_MONITORING: "Enable webhook processing",
    };

    let requiredCount = 0;
    let optionalCount = 0;

    // Check required variables
    for (const [key, description] of Object.entries(requiredVars)) {
      const value = process.env[key];
      const isSet = !!value;

      console.log(
        `  ${isSet ? "✅" : "❌"} ${key}: ${isSet ? "Set" : "MISSING"}`
      );
      if (!isSet) {
        console.log(`      ${description}`);
      } else if (key.includes("SECRET") || key.includes("KEY")) {
        console.log(
          `      Value: ${value.substring(0, 8)}...${value.substring(
            value.length - 4
          )}`
        );
      }

      this.results.environment[key] = {
        required: true,
        set: isSet,
        description,
      };
      if (isSet) requiredCount++;
    }

    console.log("");

    // Check optional variables
    for (const [key, description] of Object.entries(optionalVars)) {
      const value = process.env[key];
      const isSet = !!value;

      console.log(
        `  ${isSet ? "✅" : "⚠️ "} ${key}: ${
          isSet ? "Set" : "Not set"
        } (optional)`
      );
      if (
        isSet &&
        (key.includes("SECRET") || key.includes("KEY") || key.includes("TOKEN"))
      ) {
        console.log(
          `      Value: ${value.substring(0, 8)}...${value.substring(
            value.length - 4
          )}`
        );
      }

      this.results.environment[key] = {
        required: false,
        set: isSet,
        description,
      };
      if (isSet) optionalCount++;
    }

    console.log("");
    console.log(
      `📊 Environment Summary: ${requiredCount}/${
        Object.keys(requiredVars).length
      } required, ${optionalCount}/${Object.keys(optionalVars).length} optional`
    );

    // Special validation for Supabase keys
    const hasSupabaseAuth =
      process.env.SUPABASE_SECRET_KEY ||
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_ANON_KEY;

    if (!hasSupabaseAuth) {
      console.log("⚠️  Warning: No Supabase authentication key found");
      console.log(
        "   At least one of: SUPABASE_SECRET_KEY, SUPABASE_SERVICE_ROLE_KEY, or SUPABASE_ANON_KEY required"
      );
    }

    console.log("");
  }

  /**
   * Validate webhook configuration and security
   */
  async validateWebhookConfiguration() {
    console.log("🔐 Step 2: Validating Webhook Configuration");
    console.log("-".repeat(40));

    // Check webhook secret
    const webhookSecret = process.env.RAILWAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.log("❌ RAILWAY_WEBHOOK_SECRET not configured");
      console.log(
        "   Webhook signature verification will be disabled in development"
      );
      this.results.webhook_config.secret_configured = false;
    } else {
      console.log("✅ RAILWAY_WEBHOOK_SECRET configured");
      console.log(`   Secret length: ${webhookSecret.length} characters`);
      this.results.webhook_config.secret_configured = true;

      // Test signature generation
      try {
        const testPayload = JSON.stringify({
          type: "test",
          timestamp: Date.now(),
        });
        const signature = crypto
          .createHmac("sha256", webhookSecret)
          .update(testPayload, "utf8")
          .digest("hex");

        console.log("✅ Webhook signature generation working");
        console.log(
          `   Test signature: sha256=${signature.substring(0, 16)}...`
        );
        this.results.webhook_config.signature_generation = true;
      } catch (error) {
        console.log("❌ Webhook signature generation failed:", error.message);
        this.results.webhook_config.signature_generation = false;
      }
    }

    // Check webhook monitoring enabled
    const webhookEnabled = process.env.ENABLE_WEBHOOK_MONITORING !== "false";
    console.log(
      `${webhookEnabled ? "✅" : "❌"} Webhook monitoring: ${
        webhookEnabled ? "Enabled" : "Disabled"
      }`
    );
    this.results.webhook_config.monitoring_enabled = webhookEnabled;

    // Check Railway environment indicators
    const isRailway = !!(
      process.env.RAILWAY_ENVIRONMENT || process.env.RAILWAY_PROJECT_ID
    );
    console.log(
      `${isRailway ? "✅" : "⚠️ "} Railway environment: ${
        isRailway ? "Detected" : "Not detected"
      }`
    );
    this.results.webhook_config.railway_environment = isRailway;

    if (isRailway) {
      console.log(
        `   Project ID: ${process.env.RAILWAY_PROJECT_ID || "Not available"}`
      );
      console.log(
        `   Environment: ${process.env.RAILWAY_ENVIRONMENT || "Not available"}`
      );
    }

    console.log("");
  }

  /**
   * Validate database schema for webhook logging
   */
  async validateDatabaseSchema() {
    console.log("🗄️  Step 3: Validating Database Schema");
    console.log("-".repeat(40));

    try {
      // Create Supabase client
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseKey =
        process.env.SUPABASE_SECRET_KEY ||
        process.env.SUPABASE_SERVICE_ROLE_KEY ||
        process.env.SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey) {
        console.log("❌ Cannot test database: Missing Supabase credentials");
        this.results.database.connection = false;
        return;
      }

      const supabase = createClient(supabaseUrl, supabaseKey);

      // Test connection
      const { data, error } = await supabase
        .from("campaigns")
        .select("id")
        .limit(1);

      if (error) {
        console.log("❌ Database connection failed:", error.message);
        this.results.database.connection = false;
        return;
      }

      console.log("✅ Database connection successful");
      this.results.database.connection = true;

      // Check required webhook tables
      const webhookTables = [
        "railway_webhook_logs",
        "deployment_metrics",
        "deployment_failures",
      ];

      for (const tableName of webhookTables) {
        try {
          const { data, error } = await supabase
            .from(tableName)
            .select("id")
            .limit(1);

          if (error && error.code === "PGRST116") {
            console.log(`❌ Table missing: ${tableName}`);
            this.results.database[`table_${tableName}`] = false;
          } else {
            console.log(`✅ Table exists: ${tableName}`);
            this.results.database[`table_${tableName}`] = true;
          }
        } catch (tableError) {
          console.log(
            `❌ Error checking table ${tableName}:`,
            tableError.message
          );
          this.results.database[`table_${tableName}`] = false;
        }
      }

      // Check webhook analytics functions
      const analyticsFunctions = [
        "get_deployment_health_summary",
        "analyze_deployment_failures",
      ];

      for (const functionName of analyticsFunctions) {
        try {
          const { data, error } = await supabase.rpc(
            functionName.replace("()", "")
          );

          if (error && error.code === "PGRST202") {
            console.log(`❌ Function missing: ${functionName}`);
            this.results.database[`function_${functionName}`] = false;
          } else {
            console.log(`✅ Function exists: ${functionName}`);
            this.results.database[`function_${functionName}`] = true;
          }
        } catch (funcError) {
          console.log(
            `❌ Error checking function ${functionName}:`,
            funcError.message
          );
          this.results.database[`function_${functionName}`] = false;
        }
      }
    } catch (error) {
      console.log("🔥 Database validation error:", error.message);
      this.results.database.error = error.message;
    }

    console.log("");
  }

  /**
   * Validate server webhook endpoints
   */
  async validateServerEndpoints() {
    console.log("🌐 Step 4: Validating Server Endpoints");
    console.log("-".repeat(40));

    const port = process.env.PORT || 3000;
    const baseUrl = `http://localhost:${port}`;

    // Test if server is running
    try {
      const response = await this.makeRequest(`${baseUrl}/health`);

      if (response.ok) {
        const healthData = await response.json();
        console.log("✅ Server is running and healthy");
        console.log(`   Status: ${healthData.status}`);
        console.log(`   Uptime: ${healthData.supabase?.durationMs || "N/A"}ms`);
        this.results.server.health = true;
      } else {
        console.log("❌ Server health check failed:", response.status);
        this.results.server.health = false;
      }
    } catch (error) {
      console.log(
        "❌ Cannot reach server (may not be running):",
        error.message
      );
      console.log('   Run "npm start" or "node server.js" to start the server');
      this.results.server.health = false;
    }

    // Test webhook endpoint (if server is running)
    if (this.results.server.health) {
      try {
        const testWebhookPayload = {
          type: "deployment.success",
          deployment: { id: "test-deployment-id" },
          project: { id: "test-project-id" },
        };

        const response = await this.makeRequest(`${baseUrl}/railway-webhook`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(testWebhookPayload),
        });

        if (response.status === 200) {
          console.log("✅ Webhook endpoint responding");
          this.results.server.webhook_endpoint = true;
        } else if (response.status === 401) {
          console.log(
            "✅ Webhook endpoint responding (signature verification active)"
          );
          this.results.server.webhook_endpoint = true;
        } else {
          console.log("⚠️  Webhook endpoint returned:", response.status);
          this.results.server.webhook_endpoint = false;
        }
      } catch (error) {
        console.log("❌ Webhook endpoint test failed:", error.message);
        this.results.server.webhook_endpoint = false;
      }

      // Test deployment status endpoint (if we have admin token)
      const adminToken = process.env.PERSONAL_ACCESS_TOKEN;
      if (adminToken) {
        try {
          const response = await this.makeRequest(
            `${baseUrl}/deployment-status?token=${adminToken}`
          );

          if (response.ok) {
            const statusData = await response.json();
            console.log("✅ Deployment status dashboard accessible");
            console.log(
              `   Webhook events processed: ${
                statusData.webhookStatus?.totalEventsProcessed || 0
              }`
            );
            this.results.server.deployment_dashboard = true;
          } else {
            console.log(
              "❌ Deployment status dashboard failed:",
              response.status
            );
            this.results.server.deployment_dashboard = false;
          }
        } catch (error) {
          console.log("❌ Deployment dashboard test failed:", error.message);
          this.results.server.deployment_dashboard = false;
        }
      } else {
        console.log(
          "⚠️  Cannot test deployment dashboard (no PERSONAL_ACCESS_TOKEN)"
        );
        this.results.server.deployment_dashboard = null;
      }
    }

    console.log("");
  }

  /**
   * Generate comprehensive validation report
   */
  generateValidationReport() {
    console.log("📊 Validation Summary Report");
    console.log("=".repeat(60));

    // Calculate overall status
    const criticalFailed =
      !this.results.database.connection || !this.results.server.health;
    const hasWarnings =
      !this.results.webhook_config.secret_configured ||
      !this.results.environment.RAILWAY_WEBHOOK_SECRET?.set;

    if (criticalFailed) {
      this.results.overall = "failed";
      console.log("❌ VALIDATION FAILED - Critical issues found");
    } else if (hasWarnings) {
      this.results.overall = "warning";
      console.log("⚠️  VALIDATION PASSED WITH WARNINGS");
    } else {
      this.results.overall = "passed";
      console.log("✅ VALIDATION PASSED - Railway webhook monitoring ready");
    }

    console.log("");
    console.log("📋 Detailed Results:");

    // Environment variables summary
    const envRequired = Object.values(this.results.environment).filter(
      (v) => v.required && v.set
    ).length;
    const envTotal = Object.values(this.results.environment).filter(
      (v) => v.required
    ).length;

    console.log(
      `   Environment Variables: ${envRequired}/${envTotal} required configured`
    );

    // Database summary
    const dbTables = Object.keys(this.results.database)
      .filter((k) => k.startsWith("table_"))
      .filter((k) => this.results.database[k]).length;

    console.log(`   Database Schema: ${dbTables}/3 webhook tables found`);

    // Server endpoints summary
    const serverOk =
      this.results.server.health && this.results.server.webhook_endpoint;
    console.log(
      `   Server Endpoints: ${serverOk ? "Operational" : "Issues found"}`
    );

    // Recommendations
    console.log("");
    console.log("🔧 Recommendations:");

    if (!this.results.environment.RAILWAY_WEBHOOK_SECRET?.set) {
      console.log(
        "   1. Configure RAILWAY_WEBHOOK_SECRET for secure webhook processing"
      );
      console.log(
        "      - Generate secret in Railway dashboard > Settings > Webhooks"
      );
    }

    if (!this.results.database.connection) {
      console.log("   2. Fix database connection issues");
      console.log("      - Verify SUPABASE_URL and authentication keys");
      console.log("      - Run: node database/database-master-setup.js");
    }

    if (!this.results.server.health) {
      console.log("   3. Start the ProspectPro server");
      console.log("      - Run: npm start (or node server.js)");
      console.log("      - Verify server starts without errors");
    }

    if (dbTables < 3) {
      console.log("   4. Deploy missing database schema");
      console.log("      - Run: node database/database-master-setup.js");
      console.log(
        "      - Check Phase 3: Monitoring and Analytics Infrastructure"
      );
    }

    console.log("");
    console.log("📖 Next Steps:");
    console.log("   - Fix any issues identified above");
    console.log("   - Deploy to Railway if not already deployed");
    console.log("   - Configure Railway webhook in dashboard");
    console.log("   - Test webhook processing with a deployment");

    console.log("");
    console.log("📚 Documentation:");
    console.log(
      "   - Full setup guide: docs/webhooks/railway-webhook-setup-guide.md"
    );
    console.log("   - Troubleshooting: git checkout instructions");

    return this.results;
  }

  /**
   * Helper method for HTTP requests with timeout
   */
  async makeRequest(url, options = {}) {
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

// Run validation if called directly
if (require.main === module) {
  const validator = new RailwayWebhookValidator();
  validator
    .runValidation()
    .then((results) => {
      if (results.overall === "failed") {
        process.exit(1);
      } else if (results.overall === "warning") {
        process.exit(2);
      } else {
        process.exit(0);
      }
    })
    .catch((error) => {
      console.error("🔥 Validation crashed:", error);
      process.exit(1);
    });
}

module.exports = RailwayWebhookValidator;
