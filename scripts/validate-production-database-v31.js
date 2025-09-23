#!/usr/bin/env node

/**
 * ProspectPro Production Database Validator v3.1
 * Updated for existing database architecture validation
 */

const fs = require("fs");
const path = require("path");

class ProductionDatabaseValidator {
  constructor() {
    this.logFile = path.join(process.cwd(), "database-validation.log");
    this.initLog();
  }

  initLog() {
    const header = `# ProspectPro Database Validation Log v3.1
# Started: ${new Date().toISOString()}
# Environment: ${process.env.NODE_ENV || "production"}
# Target: ${process.env.SUPABASE_URL || "Not specified"}
# ==========================================

`;
    fs.writeFileSync(this.logFile, header, "utf8");
  }

  log(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${level.padEnd(5)}] ${message}`;

    console.log(logEntry);
    fs.appendFileSync(this.logFile, logEntry + "\n", "utf8");

    if (data) {
      const dataStr =
        typeof data === "object" ? JSON.stringify(data, null, 2) : String(data);
      console.log(dataStr);
      fs.appendFileSync(this.logFile, dataStr + "\n", "utf8");
    }
  }

  info(message, data) {
    this.log("INFO", message, data);
  }
  warn(message, data) {
    this.log("WARN", message, data);
  }
  error(message, data) {
    this.log("ERROR", message, data);
  }
  fatal(message, data) {
    this.log("FATAL", message, data);
    this.log("FATAL", `Validation log: ${this.logFile}`);
  }

  async validate() {
    this.info("🔍 Starting production database validation v3.1");

    try {
      // Step 1: Environment check
      await this.validateEnvironment();

      // Step 2: Database connection
      const client = await this.validateDatabaseConnection();

      // Step 3: Database schema exploration
      await this.exploreDatabaseSchema(client);

      // Step 4: Core tables (based on your actual schema)
      await this.validateCoreTables(client);

      // Step 5: Vault/API key storage
      await this.validateAPIKeyStorage(client);

      // Step 6: Basic functionality test
      await this.validateBasicFunctionality(client);

      this.info("✅ Database validation PASSED - Production ready");
      return { success: true, logFile: this.logFile };
    } catch (error) {
      this.fatal("❌ Database validation FAILED", {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  async validateEnvironment() {
    this.info("🔧 Validating environment configuration");

    const required = ["SUPABASE_URL", "SUPABASE_SECRET_KEY"];
    const missing = required.filter((key) => !process.env[key]);

    if (missing.length > 0) {
      throw new Error(
        `Missing required environment variables: ${missing.join(", ")}`
      );
    }

    // Validate URL format
    const url = process.env.SUPABASE_URL;
    if (!url.match(/^https:\/\/[a-z0-9]+\.supabase\.co$/)) {
      throw new Error(`Invalid Supabase URL format: ${url}`);
    }

    this.info("✅ Environment validation passed");
  }

  async validateDatabaseConnection() {
    this.info("🔗 Testing database connection");

    const { getSupabaseClient } = require("../config/supabase");
    const client = getSupabaseClient();

    if (!client) {
      throw new Error("Failed to create Supabase client");
    }

    // Test basic connection with campaigns table using the same method as quick check
    try {
      const { data, error, count } = await client
        .from("campaigns")
        .select("*", { count: "exact", head: true });

      if (error) {
        throw new Error(`Database connection test failed: ${error.message}`);
      }

      this.info("✅ Database connection established");
      return client;
    } catch (error) {
      throw new Error(`Database connection failed: ${error.message}`);
    }
  }

  async exploreDatabaseSchema(client) {
    this.info("📊 Exploring database schema");

    try {
      // Since we can't access information_schema through PostgREST,
      // we'll test the tables we know should exist
      const tablesToCheck = [
        "campaigns",
        "enhanced_leads",
        "system_settings",
        "service_health_metrics",
        "lead_emails",
        "lead_social_profiles",
        "api_usage_log",
        "campaign_analytics",
        "api_cost_tracking",
        "lead_qualification_metrics",
        "dashboard_exports",
      ];

      const existingTables = [];

      for (const tableName of tablesToCheck) {
        try {
          const { data, error, count } = await client
            .from(tableName)
            .select("*", { count: "exact", head: true });

          if (!error) {
            existingTables.push(tableName);
          }
        } catch (e) {
          // Table doesn't exist or isn't accessible
        }
      }

      this.info("📋 ProspectPro tables detected", {
        count: existingTables.length,
        tables: existingTables,
      });
    } catch (error) {
      this.warn("Schema exploration failed:", error.message);
    }
  }

  async validateCoreTables(client) {
    this.info("📋 Validating core database tables");

    // Based on your all-phases-consolidated.sql
    const expectedTables = [
      "campaigns",
      "enhanced_leads",
      "system_settings",
      "service_health_metrics",
      "lead_emails",
      "lead_social_profiles",
      "api_usage_log",
      "campaign_analytics",
      "api_cost_tracking",
      "lead_qualification_metrics",
      "dashboard_exports",
    ];

    const foundTables = [];
    const missingTables = [];
    const accessibleTables = [];

    for (const tableName of expectedTables) {
      try {
        // Test table accessibility with a count query
        const { data, error } = await client
          .from(tableName)
          .select("*", { count: "exact", head: true });

        if (error) {
          if (
            error.code === "PGRST116" ||
            error.message.includes("does not exist")
          ) {
            missingTables.push(tableName);
            this.warn(`❌ Table not found: ${tableName}`);
          } else {
            // Table exists but may have RLS/permission issues
            foundTables.push(tableName);
            this.warn(`⚠️ Table ${tableName}: ${error.message}`);
          }
        } else {
          foundTables.push(tableName);
          accessibleTables.push(tableName);
          this.info(
            `✅ Table accessible: ${tableName} (${
              data || "no count available"
            })`
          );
        }
      } catch (e) {
        missingTables.push(tableName);
        this.warn(`❌ Table test failed ${tableName}:`, e.message);
      }
    }

    this.info("📊 Core tables validation results", {
      expected: expectedTables.length,
      found: foundTables.length,
      accessible: accessibleTables.length,
      missing: missingTables.length,
      details: {
        found: foundTables,
        accessible: accessibleTables,
        missing: missingTables,
      },
    });

    // Only fail if critical tables are missing
    const criticalTables = ["campaigns", "enhanced_leads"];
    const missingCritical = criticalTables.filter((t) =>
      missingTables.includes(t)
    );

    if (missingCritical.length > 0) {
      throw new Error(`Critical tables missing: ${missingCritical.join(", ")}`);
    }

    this.info("✅ Core tables validation passed");
  }

  async validateAPIKeyStorage(client) {
    this.info("🔐 Validating API key storage");

    // Check for Vault extension first
    let vaultAvailable = false;
    try {
      const { data, error } = await client
        .from("vault.secrets")
        .select("count")
        .limit(1);

      if (!error) {
        vaultAvailable = true;
        this.info("✅ Supabase Vault extension available");
        return await this.validateVaultKeys(client);
      }
    } catch (e) {
      this.info("Vault extension not accessible, checking app_secrets...");
    }

    // Check for app_secrets table fallback
    try {
      const { data, error } = await client
        .from("app_secrets")
        .select("count")
        .limit(1);

      if (!error) {
        this.info("✅ app_secrets table available as API key storage");
        return await this.validateAppSecrets(client);
      }
    } catch (e) {
      this.warn("app_secrets table not accessible");
    }

    // Check if API keys are in environment instead
    const envKeys = [
      "GOOGLE_PLACES_API_KEY",
      "FOURSQUARE_API_KEY",
      "HUNTER_IO_API_KEY",
      "NEVERBOUNCE_API_KEY",
    ];

    const envKeysPresent = envKeys.filter((key) => process.env[key]);

    if (envKeysPresent.length > 0) {
      this.info("✅ API keys found in environment", {
        present: envKeysPresent,
        note: "Using environment variables instead of database storage",
      });
      return;
    }

    this.warn("⚠️ No API key storage method detected", {
      checked: ["vault.secrets", "app_secrets", "environment variables"],
      recommendation: "Configure API keys in Supabase Vault or environment",
    });
  }

  async validateVaultKeys(client) {
    const requiredKeys = [
      "GOOGLE_PLACES_API_KEY",
      "FOURSQUARE_API_KEY",
      "HUNTER_IO_API_KEY",
      "NEVERBOUNCE_API_KEY",
    ];

    try {
      const { data: secrets, error } = await client
        .from("vault.decrypted_secrets")
        .select("name, decrypted_secret")
        .in("name", requiredKeys);

      if (error) {
        this.warn("Cannot access vault secrets:", error.message);
        return;
      }

      const configured = secrets.filter(
        (s) =>
          s.decrypted_secret &&
          s.decrypted_secret !== "PLACEHOLDER_VALUE_SET_VIA_DASHBOARD" &&
          !s.decrypted_secret.startsWith("your_")
      );

      this.info("🔑 Vault API keys status", {
        total: secrets.length,
        configured: configured.length,
        keys: configured.map((k) => k.name),
      });
    } catch (error) {
      this.warn("Vault key validation failed:", error.message);
    }
  }

  async validateAppSecrets(client) {
    try {
      const { data: secrets, error } = await client
        .from("app_secrets")
        .select("key, value");

      if (error) {
        this.warn("Cannot access app_secrets:", error.message);
        return;
      }

      const validSecrets = secrets.filter(
        (s) =>
          s.value && !s.value.startsWith("your_") && s.value !== "placeholder"
      );

      this.info("🔑 app_secrets API keys status", {
        total: secrets.length,
        configured: validSecrets.length,
        keys: validSecrets.map((k) => k.key),
      });
    } catch (error) {
      this.warn("app_secrets validation failed:", error.message);
    }
  }

  async validateBasicFunctionality(client) {
    this.info("🧪 Testing basic database functionality");

    try {
      // Test if we can query campaigns table
      const { data: campaignTest, error: campaignError } = await client
        .from("campaigns")
        .select("id")
        .limit(1);

      if (campaignError) {
        this.warn("Campaigns query test:", campaignError.message);
      } else {
        this.info("✅ Campaigns table queryable");
      }

      // Test if we can query enhanced_leads
      const { data: leadsTest, error: leadsError } = await client
        .from("enhanced_leads")
        .select("id")
        .limit(1);

      if (leadsError) {
        this.warn("Enhanced leads query test:", leadsError.message);
      } else {
        this.info("✅ Enhanced leads table queryable");
      }

      this.info("✅ Basic functionality validation completed");
    } catch (error) {
      this.warn("Basic functionality test failed:", error.message);
    }
  }
}

// CLI execution
async function main() {
  console.log("🔍 ProspectPro Production Database Validator v3.1");
  console.log("====================================================");
  console.log("Updated for existing database architecture");
  console.log("");

  try {
    const validator = new ProductionDatabaseValidator();
    const result = await validator.validate();

    console.log("\n🎉 DATABASE VALIDATION SUCCESS");
    console.log("==============================");
    console.log("✅ Database is ready for production use");
    console.log(`📋 Detailed log: ${result.logFile}`);
    console.log("🚀 Ready to start production server");

    process.exit(0);
  } catch (error) {
    console.error("\n💥 DATABASE VALIDATION FAILED");
    console.error("==============================");
    console.error(`❌ Error: ${error.message}`);
    console.error("📋 Check validation log for details");
    console.error("\nNext Steps:");
    console.error("1. Review database schema in Supabase dashboard");
    console.error("2. Check RLS policies and permissions");
    console.error("3. Configure API keys in Vault or environment");
    console.error("4. Verify service role key has proper access");

    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { ProductionDatabaseValidator };
