#!/usr/bin/env node
/**
 * ProspectPro Database Setup with Modern Supabase Integration
 *
 * This script handles database initialization for ProspectPro using the
 * latest Supabase client and modern API key format.
 */

require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

// Configuration
const config = {
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseKey:
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY,
  testMode: process.argv.includes("--test-mode"),
  skipTables: process.argv.includes("--skip-tables"),
};

// Console colors
const colors = {
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  reset: "\x1b[0m",
  bold: "\x1b[1m",
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

class ModernDatabaseSetup {
  constructor() {
    this.supabase = null;
    this.setupResults = {
      connection: false,
      tablesCreated: 0,
      errors: [],
      warnings: [],
    };
  }

  async initialize() {
    log("blue", "🚀 ProspectPro Modern Database Setup");
    log("blue", "=====================================");

    // Validate environment
    if (!config.supabaseUrl || !config.supabaseKey) {
      log("red", "❌ Missing required environment variables:");
      if (!config.supabaseUrl) log("red", "   • SUPABASE_URL");
      if (!config.supabaseKey)
        log("red", "   • SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SECRET_KEY");
      return false;
    }

    // Initialize Supabase client
    try {
      this.supabase = createClient(config.supabaseUrl, config.supabaseKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });
      log("green", "✅ Supabase client initialized");
    } catch (error) {
      log("red", `❌ Failed to initialize Supabase client: ${error.message}`);
      return false;
    }

    return true;
  }

  async testConnection() {
    log("yellow", "🔍 Testing database connection...");

    try {
      // Test with a simple query that works with any Supabase project
      const { data, error } = await this.supabase.rpc("get_schema_version");

      if (error) {
        // If get_schema_version doesn't exist, try another approach
        const { data: healthData, error: healthError } = await this.supabase
          .from("pg_tables")
          .select("tablename")
          .limit(1);

        if (healthError) {
          log("red", `❌ Connection test failed: ${healthError.message}`);
          this.setupResults.errors.push(
            `Connection failed: ${healthError.message}`
          );
          return false;
        }
      }

      log("green", "✅ Database connection successful");
      this.setupResults.connection = true;
      return true;
    } catch (error) {
      log("red", `❌ Connection error: ${error.message}`);
      this.setupResults.errors.push(`Connection error: ${error.message}`);
      return false;
    }
  }

  async checkExistingTables() {
    log("yellow", "📋 Checking existing tables...");

    try {
      const { data, error } = await this.supabase
        .from("information_schema.tables")
        .select("table_name")
        .eq("table_schema", "public")
        .in("table_name", [
          "enhanced_leads",
          "campaigns",
          "api_costs",
          "validation_results",
          "service_health_metrics",
        ]);

      if (error) {
        log(
          "yellow",
          "⚠️ Could not query table information (may be permissions)"
        );
        this.setupResults.warnings.push("Could not check existing tables");
        return [];
      }

      const existingTables = data.map((row) => row.table_name);
      if (existingTables.length > 0) {
        log(
          "green",
          `✅ Found ${existingTables.length} existing ProspectPro tables:`
        );
        existingTables.forEach((table) => log("blue", `   • ${table}`));
      } else {
        log(
          "yellow",
          "📋 No ProspectPro tables found - database ready for setup"
        );
      }

      return existingTables;
    } catch (error) {
      log("yellow", `⚠️ Table check failed: ${error.message}`);
      this.setupResults.warnings.push(`Table check failed: ${error.message}`);
      return [];
    }
  }

  async executeSQLFile(filename) {
    const filePath = path.join(__dirname, filename);

    if (!fs.existsSync(filePath)) {
      log("red", `❌ SQL file not found: ${filename}`);
      return false;
    }

    log("yellow", `📜 Executing SQL file: ${filename}`);

    try {
      const sqlContent = fs.readFileSync(filePath, "utf8");

      // Split SQL content into individual statements
      const statements = sqlContent
        .split(";")
        .map((stmt) => stmt.trim())
        .filter((stmt) => stmt.length > 0 && !stmt.startsWith("--"));

      let successCount = 0;

      for (const statement of statements) {
        try {
          const { error } = await this.supabase.rpc("exec_sql", {
            sql_statement: statement,
          });

          if (error) {
            log("yellow", `⚠️ SQL warning: ${error.message}`);
            this.setupResults.warnings.push(
              `SQL warning in ${filename}: ${error.message}`
            );
          } else {
            successCount++;
          }
        } catch (stmtError) {
          log("yellow", `⚠️ SQL statement failed: ${stmtError.message}`);
          this.setupResults.warnings.push(
            `SQL error in ${filename}: ${stmtError.message}`
          );
        }
      }

      log(
        "green",
        `✅ Executed ${successCount}/${statements.length} SQL statements from ${filename}`
      );
      return true;
    } catch (error) {
      log("red", `❌ Failed to execute SQL file ${filename}: ${error.message}`);
      this.setupResults.errors.push(`SQL execution failed: ${error.message}`);
      return false;
    }
  }

  async setupDatabase() {
    if (config.skipTables) {
      log("yellow", "⏭️  Skipping table creation (--skip-tables flag)");
      return true;
    }

    log("yellow", "🏗️  Setting up database schema...");

    // Try to execute the consolidated schema
    const schemaFiles = [
      "all-phases-consolidated.sql",
      "enhanced-supabase-schema.sql",
    ];

    for (const schemaFile of schemaFiles) {
      if (fs.existsSync(path.join(__dirname, schemaFile))) {
        log("blue", `📋 Using schema file: ${schemaFile}`);
        const success = await this.executeSQLFile(schemaFile);

        if (success) {
          this.setupResults.tablesCreated++;
          return true;
        }
      }
    }

    log(
      "yellow",
      "⚠️ No schema files could be executed - manual setup may be required"
    );
    return false;
  }

  async validateSetup() {
    log("yellow", "🔍 Validating database setup...");

    // Check if we can perform basic operations
    try {
      const { error } = await this.supabase
        .from("campaigns")
        .select("id")
        .limit(1);

      if (error) {
        log("yellow", `⚠️ Table validation warning: ${error.message}`);
        this.setupResults.warnings.push(`Table validation: ${error.message}`);
      } else {
        log("green", "✅ Database tables are accessible");
      }
    } catch (error) {
      log("yellow", `⚠️ Validation error: ${error.message}`);
      this.setupResults.warnings.push(`Validation error: ${error.message}`);
    }

    return true;
  }

  async run() {
    const startTime = Date.now();

    if (!(await this.initialize())) {
      return false;
    }

    if (!(await this.testConnection())) {
      return false;
    }

    await this.checkExistingTables();

    if (!config.testMode) {
      await this.setupDatabase();
      await this.validateSetup();
    }

    // Print summary
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    log("blue", "\n🎯 Database Setup Summary");
    log("blue", "========================");
    log(
      "green",
      `✅ Connection: ${this.setupResults.connection ? "Success" : "Failed"}`
    );
    log("green", `✅ Tables Created: ${this.setupResults.tablesCreated}`);
    log("yellow", `⚠️  Warnings: ${this.setupResults.warnings.length}`);
    log("red", `❌ Errors: ${this.setupResults.errors.length}`);
    log("blue", `⏱️  Duration: ${duration}s`);

    if (this.setupResults.warnings.length > 0) {
      log("yellow", "\nWarnings:");
      this.setupResults.warnings.forEach((warning) =>
        log("yellow", `  • ${warning}`)
      );
    }

    if (this.setupResults.errors.length > 0) {
      log("red", "\nErrors:");
      this.setupResults.errors.forEach((error) => log("red", `  • ${error}`));
    }

    if (config.testMode) {
      log("blue", "\n🧪 Test mode completed - no changes made to database");
    }

    return (
      this.setupResults.connection && this.setupResults.errors.length === 0
    );
  }
}

// Run the setup
if (require.main === module) {
  const setup = new ModernDatabaseSetup();
  setup
    .run()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      log("red", `💥 Fatal error: ${error.message}`);
      console.error(error);
      process.exit(1);
    });
}

module.exports = ModernDatabaseSetup;
