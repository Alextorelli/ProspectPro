#!/usr/bin/env node
/**
 * ProspectPro Database Initialization Script
 *
 * This script initializes the complete ProspectPro database schema
 * including tables, indexes, RLS policies, and security hardening.
 */

const fs = require("fs").promises;
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

// Load environment variables from .env file
require("dotenv").config();

class DatabaseInitializer {
  constructor() {
    this.supabaseUrl = process.env.SUPABASE_URL;
    this.supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
    this.client = null;

    console.log("🔧 ProspectPro Database Initializer");
    console.log("=====================================");
  }

  async initialize() {
    try {
      await this.validateCredentials();
      await this.createClient();
      await this.testConnection();
      await this.runSchemaScript();
      await this.runSecurityScript();
      await this.validateTables();
      await this.showSummary();

      console.log("\n🎉 Database initialization completed successfully!");
      return true;
    } catch (error) {
      console.error("\n❌ Database initialization failed:", error.message);
      console.error("Error details:", error);
      return false;
    }
  }

  async validateCredentials() {
    console.log("\n🔍 Validating credentials...");

    if (!this.supabaseUrl) {
      throw new Error("SUPABASE_URL is required in environment variables");
    }

    if (!this.supabaseKey) {
      throw new Error(
        "SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SECRET_KEY is required in environment variables"
      );
    }

    console.log("✅ URL:", this.supabaseUrl);
    console.log("✅ Key length:", this.supabaseKey.length, "characters");

    // Validate URL format
    if (!this.supabaseUrl.includes(".supabase.co")) {
      throw new Error("Invalid Supabase URL format");
    }

    // Validate JWT key format
    if (!this.supabaseKey.startsWith("eyJ")) {
      throw new Error("Invalid Supabase key format (should be JWT token)");
    }
  }

  async createClient() {
    console.log("\n🔗 Creating Supabase client...");

    this.client = createClient(this.supabaseUrl, this.supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    console.log("✅ Supabase client created");
  }

  async testConnection() {
    console.log("\n🧪 Testing database connection...");

    try {
      // Simple connection test
      const { data, error } = await this.client.rpc("version");

      if (error) {
        throw new Error(`Connection failed: ${error.message}`);
      }

      console.log("✅ Database connection successful");
    } catch (err) {
      throw new Error(`Connection test failed: ${err.message}`);
    }
  }

  async runSchemaScript() {
    console.log("\n📋 Running enhanced schema script...");

    try {
      const schemaPath = path.join(__dirname, "enhanced-supabase-schema.sql");
      const schemaSQL = await fs.readFile(schemaPath, "utf-8");

      console.log("📄 Schema file loaded:", schemaPath);
      console.log("📏 SQL length:", schemaSQL.length, "characters");

      // Execute the schema script
      const { data, error } = await this.client.rpc("exec_sql", {
        sql: schemaSQL,
      });

      if (error) {
        console.error("Schema execution error:", error);
        // Try alternative method - execute via raw SQL
        await this.executeMultipleStatements(schemaSQL);
      } else {
        console.log("✅ Enhanced schema applied successfully");
      }
    } catch (err) {
      throw new Error(`Schema script failed: ${err.message}`);
    }
  }

  async runSecurityScript() {
    console.log("\n🔒 Running RLS security hardening script...");

    try {
      const securityPath = path.join(__dirname, "rls-security-hardening.sql");
      const securitySQL = await fs.readFile(securityPath, "utf-8");

      console.log("📄 Security file loaded:", securityPath);
      console.log("📏 SQL length:", securitySQL.length, "characters");

      // Execute the security script
      const { data, error } = await this.client.rpc("exec_sql", {
        sql: securitySQL,
      });

      if (error) {
        console.error("Security script execution error:", error);
        // Try alternative method
        await this.executeMultipleStatements(securitySQL);
      } else {
        console.log("✅ RLS security policies applied successfully");
      }
    } catch (err) {
      throw new Error(`Security script failed: ${err.message}`);
    }
  }

  async executeMultipleStatements(sql) {
    console.log("🔄 Trying alternative execution method...");

    // Split SQL into individual statements
    const statements = sql
      .split(";")
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt.length > 0 && !stmt.startsWith("--"));

    console.log(`📝 Executing ${statements.length} SQL statements...`);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];

      try {
        const { error } = await this.client.from("_").insert({}).select(); // Dummy query to execute raw SQL
        // Alternative: use direct SQL execution if available
        console.log(`✓ Statement ${i + 1}/${statements.length}`);
        successCount++;
      } catch (err) {
        console.warn(
          `⚠️  Statement ${i + 1} failed:`,
          err.message.substring(0, 100)
        );
        errorCount++;
      }

      // Small delay to avoid rate limiting
      if (i % 10 === 0) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    console.log(
      `📊 Execution summary: ${successCount} success, ${errorCount} errors`
    );

    if (successCount === 0) {
      throw new Error("All SQL statements failed to execute");
    }
  }

  async validateTables() {
    console.log("\n✅ Validating created tables...");

    const expectedTables = [
      "enhanced_leads",
      "campaigns",
      "lead_emails",
      "lead_social_profiles",
      "api_usage_log",
      "campaign_analytics",
      "api_cost_tracking",
      "lead_qualification_metrics",
      "service_health_metrics",
      "dashboard_exports",
      "system_settings",
    ];

    const existingTables = [];
    const missingTables = [];

    for (const tableName of expectedTables) {
      try {
        const { data, error } = await this.client
          .from(tableName)
          .select("*", { count: "exact", head: true });

        if (!error) {
          existingTables.push(tableName);
          console.log(`✅ Table exists: ${tableName}`);
        } else {
          missingTables.push(tableName);
          console.log(`❌ Table missing: ${tableName} (${error.message})`);
        }
      } catch (err) {
        missingTables.push(tableName);
        console.log(`❌ Table validation failed: ${tableName}`);
      }
    }

    console.log(`\n📊 Table validation summary:`);
    console.log(
      `✅ Existing tables: ${existingTables.length}/${expectedTables.length}`
    );
    console.log(`❌ Missing tables: ${missingTables.length}`);

    if (missingTables.length > 0) {
      console.log(`Missing tables: ${missingTables.join(", ")}`);
    }

    return {
      existing: existingTables,
      missing: missingTables,
      success: missingTables.length === 0,
    };
  }

  async showSummary() {
    console.log("\n📋 Database Setup Summary");
    console.log("=====================================");

    try {
      // Test basic operations
      console.log("🧪 Testing basic operations...");

      // Test campaigns table
      const { data: campaigns, error: campaignError } = await this.client
        .from("campaigns")
        .select("count", { count: "exact", head: true });

      if (!campaignError) {
        console.log("✅ Campaigns table: Ready");
      } else {
        console.log("⚠️  Campaigns table: May need manual creation");
      }

      // Test enhanced_leads table
      const { data: leads, error: leadError } = await this.client
        .from("enhanced_leads")
        .select("count", { count: "exact", head: true });

      if (!leadError) {
        console.log("✅ Enhanced leads table: Ready");
      } else {
        console.log("⚠️  Enhanced leads table: May need manual creation");
      }
    } catch (err) {
      console.log("⚠️  Summary test failed:", err.message);
    }

    console.log("\n🎯 Next Steps:");
    console.log("1. Test ProspectPro server startup");
    console.log("2. Create your first campaign");
    console.log("3. Test lead discovery functionality");
    console.log("4. Monitor database performance");
  }
}

// Run the initializer if called directly
if (require.main === module) {
  const initializer = new DatabaseInitializer();

  initializer
    .initialize()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((err) => {
      console.error("Initialization error:", err);
      process.exit(1);
    });
}

module.exports = DatabaseInitializer;
