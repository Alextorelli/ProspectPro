#!/usr/bin/env node
/**
 * ProspectPro Supabase Validation Guide
 *
 * This script shows you exactly what to look for in Supabase Dashboard
 * and provides automated validation of your database setup.
 */

require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

// Console colors
const colors = {
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  magenta: "\x1b[35m",
  reset: "\x1b[0m",
  bold: "\x1b[1m",
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

class SupabaseValidator {
  constructor() {
    this.supabaseUrl = process.env.SUPABASE_URL;
    this.supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
    this.supabase = null;

    // Expected database structure
    this.expectedTables = [
      "campaigns",
      "enhanced_leads",
      "lead_emails",
      "lead_social_profiles",
      "api_usage_log",
      "system_settings",
      "service_health_metrics",
      "campaign_analytics",
      "api_cost_tracking",
      "lead_qualification_metrics",
      "dashboard_exports",
    ];

    this.expectedFunctions = [
      "calculate_lead_quality_score",
      "get_campaign_analytics",
      "get_realtime_dashboard_metrics",
      "leads_within_radius",
      "search_leads_by_name",
      "update_campaign_statistics",
      "validate_rls_security",
    ];
  }

  showDashboardGuide() {
    log("blue", "🎯 Supabase Dashboard Validation Guide");
    log("blue", "=====================================");
    console.log("");

    log("yellow", "📍 1. TABLE EDITOR VALIDATION");
    log("cyan", `   🔗 Go to: ${this.supabaseUrl}/project/default/editor`);
    console.log("");
    console.log("   ✅ You should see these tables:");

    // Core Tables
    log("green", "   📊 CORE TABLES:");
    console.log("   • campaigns - User session tracking");
    console.log("   • enhanced_leads - Main business data");
    console.log("   • lead_emails - Email addresses");
    console.log("   • lead_social_profiles - Social media profiles");
    console.log("");

    // System Tables
    log("green", "   🛠️  SYSTEM TABLES:");
    console.log("   • api_usage_log - API call tracking");
    console.log("   • system_settings - Configuration");
    console.log("   • service_health_metrics - Health monitoring");
    console.log("");

    // Analytics Tables
    log("green", "   📈 ANALYTICS TABLES:");
    console.log("   • campaign_analytics - Campaign performance");
    console.log("   • api_cost_tracking - Cost management");
    console.log("   • lead_qualification_metrics - Quality metrics");
    console.log("   • dashboard_exports - Export history");
    console.log("");

    log("yellow", "📍 2. TABLE STRUCTURE VALIDATION");
    console.log("");
    log("cyan", "   🔍 Click on each table to verify structure:");
    console.log("");

    log("green", "   📋 campaigns table should have:");
    console.log("   • id (uuid, primary key)");
    console.log("   • user_id (uuid, for RLS)");
    console.log("   • name (text)");
    console.log("   • status (text)");
    console.log("   • created_at (timestamptz)");
    console.log("   • budget_limit (decimal)");
    console.log("   • quality_threshold (integer)");
    console.log("");

    log("green", "   📋 enhanced_leads table should have:");
    console.log("   • id (uuid, primary key)");
    console.log("   • campaign_id (uuid, foreign key)");
    console.log("   • business_name (text)");
    console.log("   • address (text)");
    console.log("   • phone (text)");
    console.log("   • website (text)");
    console.log("   • confidence_score (integer 0-100)");
    console.log("   • discovery_cost (decimal)");
    console.log("   • enrichment_cost (decimal)");
    console.log("   • total_cost (computed column)");
    console.log("");

    log("yellow", "📍 3. ROW LEVEL SECURITY (RLS) VALIDATION");
    log(
      "cyan",
      `   🔗 Go to: ${this.supabaseUrl}/project/default/auth/policies`
    );
    console.log("");
    console.log("   ✅ You should see RLS policies for each table:");
    console.log('   • Each table should show "RLS enabled"');
    console.log('   • Policies should mention "auth.uid()"');
    console.log("   • Campaign-based access control policies");
    console.log("");

    log("yellow", "📍 4. FUNCTIONS VALIDATION");
    log(
      "cyan",
      `   🔗 Go to: ${this.supabaseUrl}/project/default/database/functions`
    );
    console.log("");
    console.log("   ✅ You should see these functions:");
    this.expectedFunctions.forEach((func) => {
      console.log(`   • ${func}`);
    });
    console.log("");

    log("yellow", "📍 5. EXTENSIONS VALIDATION");
    log(
      "cyan",
      `   🔗 Go to: ${this.supabaseUrl}/project/default/database/extensions`
    );
    console.log("");
    console.log("   ✅ These extensions should be enabled:");
    console.log("   • uuid-ossp (UUID generation)");
    console.log("   • postgis (Geographic operations)");
    console.log("");

    log("yellow", "📍 6. SQL EDITOR TEST");
    log("cyan", `   🔗 Go to: ${this.supabaseUrl}/project/default/sql`);
    console.log("");
    log("green", "   🧪 Run this test query:");
    console.log("   ```sql");
    console.log(
      "   SELECT COUNT(*) as table_count FROM information_schema.tables"
    );
    console.log("   WHERE table_schema = 'public';");
    console.log("   ```");
    console.log("");
    console.log("   ✅ Should return: table_count ≥ 11");
    console.log("");

    log("green", "   🧪 Test RLS validation function:");
    console.log("   ```sql");
    console.log("   SELECT validate_rls_security();");
    console.log("   ```");
    console.log("");
    console.log("   ✅ Should return JSON with security status");
    console.log("");
  }

  async runAutomatedValidation() {
    log("blue", "🤖 Automated Database Validation");
    log("blue", "================================");
    console.log("");

    // Initialize Supabase client
    if (!this.supabaseUrl || !this.supabaseKey) {
      log("red", "❌ Missing Supabase credentials");
      log(
        "yellow",
        "💡 Check your .env file for SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY"
      );
      return false;
    }

    this.supabase = createClient(this.supabaseUrl, this.supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    log("green", "✅ Supabase client initialized");

    // Test 1: Basic Connection
    log("yellow", "🔍 Test 1: Basic Connection");
    try {
      const { data, error } = await this.supabase
        .from("information_schema.tables")
        .select("table_name")
        .eq("table_schema", "public")
        .limit(1);

      if (error) {
        log("red", `❌ Connection failed: ${error.message}`);
        if (error.message.includes("Legacy API keys")) {
          log(
            "yellow",
            "💡 You may need to execute the SQL manually in Supabase Dashboard"
          );
          log("cyan", `   🔗 ${this.supabaseUrl}/project/default/sql`);
        }
        return false;
      }

      log("green", "✅ Database connection successful");
    } catch (err) {
      log("red", `❌ Connection error: ${err.message}`);
      return false;
    }

    // Test 2: Table Existence
    log("yellow", "🔍 Test 2: Table Existence");
    let foundTables = [];
    let missingTables = [];

    for (const tableName of this.expectedTables) {
      try {
        const { data, error } = await this.supabase
          .from(tableName)
          .select("*")
          .limit(1);

        if (error) {
          if (error.message.includes("does not exist")) {
            missingTables.push(tableName);
            log("red", `   ❌ ${tableName} - Table missing`);
          } else {
            log("yellow", `   ⚠️  ${tableName} - ${error.message}`);
            foundTables.push(tableName);
          }
        } else {
          foundTables.push(tableName);
          log("green", `   ✅ ${tableName} - Table exists and accessible`);
        }
      } catch (err) {
        missingTables.push(tableName);
        log("red", `   ❌ ${tableName} - Error: ${err.message}`);
      }
    }

    // Test 3: RLS Function Test
    log("yellow", "🔍 Test 3: Security Function Test");
    try {
      const { data, error } = await this.supabase.rpc("validate_rls_security");

      if (error) {
        log("yellow", `   ⚠️  RLS validation function: ${error.message}`);
      } else {
        log("green", "   ✅ RLS validation function working");
        if (data && data.rls_enabled_tables) {
          log(
            "cyan",
            `   📊 RLS enabled on ${data.rls_enabled_tables.length} tables`
          );
        }
      }
    } catch (err) {
      log("yellow", `   ⚠️  RLS function test: ${err.message}`);
    }

    // Summary
    console.log("");
    log("blue", "📊 Validation Summary");
    log("blue", "====================");
    log(
      "green",
      `✅ Tables found: ${foundTables.length}/${this.expectedTables.length}`
    );
    if (missingTables.length > 0) {
      log("red", `❌ Missing tables: ${missingTables.length}`);
      log("yellow", "   Missing: " + missingTables.join(", "));
    }

    console.log("");

    if (foundTables.length === this.expectedTables.length) {
      log("green", "🎉 DATABASE SETUP COMPLETE!");
      log("cyan", "🚀 Ready to run: npm start");
      return true;
    } else {
      log("yellow", "⚠️  Partial setup detected");
      log(
        "yellow",
        "💡 You may need to execute the SQL schema in Supabase Dashboard"
      );
      log("cyan", `   🔗 ${this.supabaseUrl}/project/default/sql`);
      return false;
    }
  }

  showManualTestQueries() {
    log("blue", "📋 Manual Test Queries for Supabase SQL Editor");
    log("blue", "==============================================");
    console.log("");

    log("yellow", "🧪 1. Count all tables:");
    console.log("```sql");
    console.log("SELECT COUNT(*) as total_tables");
    console.log("FROM information_schema.tables");
    console.log("WHERE table_schema = 'public';");
    console.log("```");
    console.log("Expected result: total_tables ≥ 11");
    console.log("");

    log("yellow", "🧪 2. List all ProspectPro tables:");
    console.log("```sql");
    console.log("SELECT table_name, table_type");
    console.log("FROM information_schema.tables");
    console.log("WHERE table_schema = 'public'");
    console.log("ORDER BY table_name;");
    console.log("```");
    console.log("Expected: campaigns, enhanced_leads, api_usage_log, etc.");
    console.log("");

    log("yellow", "🧪 3. Check RLS status:");
    console.log("```sql");
    console.log("SELECT tablename, rowsecurity");
    console.log("FROM pg_tables t");
    console.log("JOIN pg_class c ON c.relname = t.tablename");
    console.log("WHERE schemaname = 'public'");
    console.log("ORDER BY tablename;");
    console.log("```");
    console.log("Expected: rowsecurity = true for all tables");
    console.log("");

    log("yellow", "🧪 4. Test security validation function:");
    console.log("```sql");
    console.log("SELECT validate_rls_security();");
    console.log("```");
    console.log("Expected: JSON object with security configuration");
    console.log("");

    log("yellow", "🧪 5. Test table structure (example - campaigns):");
    console.log("```sql");
    console.log("SELECT column_name, data_type, is_nullable");
    console.log("FROM information_schema.columns");
    console.log("WHERE table_name = 'campaigns'");
    console.log("ORDER BY ordinal_position;");
    console.log("```");
    console.log("Expected: id, user_id, name, status, created_at, etc.");
    console.log("");

    log("yellow", "🧪 6. Check installed extensions:");
    console.log("```sql");
    console.log("SELECT extname, extversion");
    console.log("FROM pg_extension");
    console.log("WHERE extname IN ('uuid-ossp', 'postgis');");
    console.log("```");
    console.log("Expected: Both extensions should be listed");
    console.log("");
  }

  run() {
    const args = process.argv.slice(2);

    if (args.includes("--dashboard") || args.includes("--guide")) {
      this.showDashboardGuide();
    } else if (args.includes("--test") || args.includes("--validate")) {
      this.runAutomatedValidation();
    } else if (args.includes("--queries")) {
      this.showManualTestQueries();
    } else {
      log("blue", "🎯 ProspectPro Supabase Validation Helper");
      log("blue", "========================================");
      console.log("");
      log("yellow", "Usage:");
      log(
        "cyan",
        "  --dashboard    Show what to look for in Supabase Dashboard"
      );
      log("cyan", "  --test         Run automated validation tests");
      log(
        "cyan",
        "  --queries      Show manual test queries to run in SQL Editor"
      );
      console.log("");
      log("green", "🎯 Recommended workflow:");
      log("green", "1. Run: --dashboard (see what to check)");
      log("green", "2. Run: --test (automated validation)");
      log("green", "3. Run: --queries (manual SQL tests)");
      console.log("");

      // Quick status check
      if (this.supabaseUrl && this.supabaseKey) {
        log("green", "✅ Environment configured");
        log("cyan", `   🔗 Dashboard: ${this.supabaseUrl}/project/default`);
      } else {
        log("red", "❌ Environment not configured");
        log("yellow", "   Check your .env file for Supabase credentials");
      }
    }
  }
}

// Run the validator
if (require.main === module) {
  const validator = new SupabaseValidator();

  try {
    validator.run();
  } catch (error) {
    log("red", `💥 Error: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

module.exports = SupabaseValidator;
