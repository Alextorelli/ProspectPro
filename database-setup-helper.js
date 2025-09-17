#!/usr/bin/env node
/**
 * ProspectPro Database Setup Helper
 *
 * This script helps you set up the database and test connectivity
 *
 * Usage:
 *   node database-setup-helper.js --copy-sql     # Display SQL to copy
 *   node database-setup-helper.js --test         # Test database after setup
 */

require("dotenv").config();
const fs = require("fs");
const path = require("path");

// Console colors
const colors = {
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  reset: "\x1b[0m",
  bold: "\x1b[1m",
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

class DatabaseSetupHelper {
  constructor() {
    this.sqlFile = path.join(
      __dirname,
      "database",
      "all-phases-consolidated.sql"
    );
  }

  showCopyInstructions() {
    log("blue", "📋 ProspectPro Database Setup - Copy Instructions");
    log("blue", "===============================================");
    log("green", "✅ Supabase SQL Editor is open in your browser");
    log("yellow", "📋 Follow these steps:");
    console.log("");
    console.log("1. 📁 Copy the SQL schema:");
    console.log(`   • File: ${this.sqlFile}`);
    console.log(
      "   • Size: " + (fs.statSync(this.sqlFile).size / 1024).toFixed(1) + "KB"
    );
    console.log("");
    console.log("2. 🗂️  In the Supabase SQL Editor:");
    console.log("   • Clear any existing content");
    console.log("   • Paste the entire schema");
    console.log('   • Click "RUN" to execute');
    console.log("");
    console.log("3. ✅ Verify success:");
    console.log('   • Should see: "Success. No rows returned"');
    console.log("   • Check Table Editor for new tables");
    console.log("");
    log(
      "cyan",
      "💡 Tip: The SQL includes IF NOT EXISTS clauses, so it's safe to re-run"
    );
    console.log("");
    log("yellow", "📄 SQL Content Preview:");
    console.log("─".repeat(60));

    // Show first few lines of SQL
    const sqlContent = fs.readFileSync(this.sqlFile, "utf8");
    const lines = sqlContent.split("\n").slice(0, 15);
    lines.forEach((line) => console.log(line));
    console.log("─".repeat(60));
    console.log(`... (${sqlContent.split("\n").length - 15} more lines) ...`);
    console.log("");

    log(
      "green",
      "🚀 After executing the SQL, run: node database-setup-helper.js --test"
    );
  }

  async testDatabaseSetup() {
    log("blue", "🧪 Testing ProspectPro Database Setup");
    log("blue", "====================================");

    // Test environment variables
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      log("red", "❌ Missing environment variables");
      return false;
    }

    log("green", "✅ Environment variables configured");

    try {
      const { createClient } = require("@supabase/supabase-js");
      const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );

      // Test basic connection with table existence checks
      const tablesToCheck = [
        "enhanced_leads",
        "campaigns",
        "api_costs",
        "validation_results",
        "service_health_metrics",
      ];

      log("yellow", "🔍 Checking database tables...");

      let tablesFound = 0;
      let connectionWorking = false;

      for (const tableName of tablesToCheck) {
        try {
          const { data, error } = await supabase
            .from(tableName)
            .select("*")
            .limit(1);

          if (error) {
            if (error.message.includes("does not exist")) {
              log("yellow", `   ⚠️  ${tableName} - Table does not exist`);
            } else {
              log("red", `   ❌ ${tableName} - Error: ${error.message}`);
            }
          } else {
            log("green", `   ✅ ${tableName} - Table accessible`);
            tablesFound++;
            connectionWorking = true;
          }
        } catch (err) {
          log("red", `   ❌ ${tableName} - Exception: ${err.message}`);
        }
      }

      // Summary
      log("blue", "\n📊 Database Test Summary:");
      log("blue", "========================");

      if (connectionWorking) {
        log("green", `✅ Connection: Working`);
        log("green", `✅ Tables found: ${tablesFound}/${tablesToCheck.length}`);

        if (tablesFound === tablesToCheck.length) {
          log("green", "🎉 Database setup is COMPLETE and working!");
          log("cyan", "🚀 Ready to run: npm start");
          return true;
        } else {
          log("yellow", "⚠️  Partial setup - some tables missing");
          log("yellow", "💡 Re-run the SQL schema in Supabase Editor");
          return false;
        }
      } else {
        log("red", "❌ Database connection failed");
        log("yellow", "💡 Please execute the SQL schema first");
        return false;
      }
    } catch (error) {
      log("red", `❌ Test failed: ${error.message}`);
      return false;
    }
  }

  showSQLContent() {
    log("blue", "📄 ProspectPro Database Schema Content");
    log("blue", "=====================================");

    const sqlContent = fs.readFileSync(this.sqlFile, "utf8");
    console.log(sqlContent);

    log(
      "green",
      "\n✅ Copy the above SQL content and paste it into Supabase SQL Editor"
    );
    log(
      "cyan",
      "🔗 URL: https://sriycekxdqnesdsgwiuc.supabase.co/project/default/sql"
    );
  }

  run() {
    const args = process.argv.slice(2);

    if (args.includes("--copy-sql")) {
      this.showCopyInstructions();
    } else if (args.includes("--show-sql")) {
      this.showSQLContent();
    } else if (args.includes("--test")) {
      this.testDatabaseSetup();
    } else {
      log("blue", "🚀 ProspectPro Database Setup Helper");
      log("blue", "===================================");
      log("yellow", "Usage:");
      log(
        "cyan",
        "  node database-setup-helper.js --copy-sql    # Show copy instructions"
      );
      log(
        "cyan",
        "  node database-setup-helper.js --show-sql    # Display full SQL schema"
      );
      log(
        "cyan",
        "  node database-setup-helper.js --test        # Test database after setup"
      );
      console.log("");
      log("green", "🎯 Recommended workflow:");
      log("green", "1. Run: --copy-sql (get instructions)");
      log("green", "2. Execute SQL in Supabase Dashboard");
      log("green", "3. Run: --test (verify setup)");
    }
  }
}

// Run the helper
if (require.main === module) {
  const helper = new DatabaseSetupHelper();

  try {
    helper.run();
  } catch (error) {
    log("red", `💥 Error: ${error.message}`);
    process.exit(1);
  }
}

module.exports = DatabaseSetupHelper;
