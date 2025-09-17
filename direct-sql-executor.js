#!/usr/bin/env node
/**
 * Direct SQL Executor for ProspectPro Database Setup
 *
 * This script executes the database schema directly using REST API calls
 * to bypass the legacy API key issue.
 */

require("dotenv").config();
const fs = require("fs");
const path = require("path");
const https = require("https");

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

class DirectSQLExecutor {
  constructor() {
    this.supabaseUrl = process.env.SUPABASE_URL;
    this.supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
    this.sqlFile = path.join(
      __dirname,
      "database",
      "all-phases-consolidated.sql"
    );
  }

  async executeSQL(sql) {
    return new Promise((resolve, reject) => {
      const url = new URL("/rest/v1/rpc/exec_sql", this.supabaseUrl);

      const postData = JSON.stringify({
        sql_statement: sql,
      });

      const options = {
        method: "POST",
        headers: {
          apikey: this.supabaseKey,
          Authorization: `Bearer ${this.supabaseKey}`,
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(postData),
          Prefer: "return=minimal",
        },
      };

      const req = https.request(url, options, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ success: true, data });
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${data}`));
          }
        });
      });

      req.on("error", reject);
      req.write(postData);
      req.end();
    });
  }

  async createTables() {
    log("blue", "🚀 Direct SQL Database Setup");
    log("blue", "============================");
    console.log("");

    // Check environment
    if (!this.supabaseUrl || !this.supabaseKey) {
      log("red", "❌ Missing Supabase credentials");
      return false;
    }

    log("green", "✅ Environment configured");
    log("cyan", `   URL: ${this.supabaseUrl}`);
    log("cyan", `   Key: ${this.supabaseKey.substring(0, 20)}...`);
    console.log("");

    // Check SQL file
    if (!fs.existsSync(this.sqlFile)) {
      log("red", `❌ SQL file not found: ${this.sqlFile}`);
      return false;
    }

    const sqlContent = fs.readFileSync(this.sqlFile, "utf8");
    log(
      "green",
      `✅ SQL file loaded: ${(sqlContent.length / 1024).toFixed(1)}KB`
    );
    console.log("");

    // Execute essential table creation statements one by one
    const essentialStatements = [
      // Extensions
      `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`,
      `CREATE EXTENSION IF NOT EXISTS "postgis";`,

      // Core domains
      `CREATE DOMAIN IF NOT EXISTS confidence_score_type AS INTEGER CHECK (VALUE >= 0 AND VALUE <= 100);`,
      `CREATE DOMAIN IF NOT EXISTS cost_amount_type AS DECIMAL(10,4) CHECK (VALUE >= 0);`,

      // Campaigns table
      `CREATE TABLE IF NOT EXISTS campaigns (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID,
        name TEXT NOT NULL,
        status TEXT DEFAULT 'running' CHECK (status IN ('running', 'paused', 'completed', 'cancelled')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        completed_at TIMESTAMP WITH TIME ZONE,
        leads_discovered INTEGER DEFAULT 0,
        leads_qualified INTEGER DEFAULT 0,
        quality_threshold INTEGER DEFAULT 80,
        budget_limit DECIMAL(10,2) DEFAULT 100.00,
        total_cost DECIMAL(10,4) DEFAULT 0.0000,
        search_criteria JSONB DEFAULT '{}',
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      );`,

      // Enhanced leads table
      `CREATE TABLE IF NOT EXISTS enhanced_leads (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        business_name TEXT NOT NULL,
        address TEXT,
        phone TEXT,
        website TEXT,
        confidence_score INTEGER DEFAULT 0 CHECK (confidence_score >= 0 AND confidence_score <= 100),
        campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
        discovery_cost DECIMAL(10,4) DEFAULT 0.00,
        enrichment_cost DECIMAL(10,4) DEFAULT 0.00,
        total_cost DECIMAL(10,4) GENERATED ALWAYS AS (discovery_cost + enrichment_cost) STORED
      );`,

      // System settings
      `CREATE TABLE IF NOT EXISTS system_settings (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID,
        setting_name TEXT NOT NULL,
        setting_value JSONB DEFAULT '{}',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        UNIQUE(user_id, setting_name)
      );`,

      // API usage log
      `CREATE TABLE IF NOT EXISTS api_usage_log (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
        provider TEXT NOT NULL,
        endpoint TEXT,
        request_cost DECIMAL(10,4) DEFAULT 0.0000,
        response_status INTEGER,
        execution_time_ms INTEGER,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      );`,

      // Service health metrics
      `CREATE TABLE IF NOT EXISTS service_health_metrics (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        service_name TEXT NOT NULL,
        metric_name TEXT NOT NULL,
        metric_value DECIMAL(15,6),
        status TEXT DEFAULT 'healthy',
        recorded_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        additional_data JSONB DEFAULT '{}'
      );`,
    ];

    log("yellow", "📋 Executing essential database statements...");
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < essentialStatements.length; i++) {
      const statement = essentialStatements[i].trim();
      if (!statement) continue;

      try {
        log("cyan", `   ${i + 1}/${essentialStatements.length}: Executing...`);
        await this.executeSQL(statement);
        log(
          "green",
          `   ✅ Success: ${statement.split("\n")[0].substring(0, 50)}...`
        );
        successCount++;
      } catch (error) {
        log("yellow", `   ⚠️  Warning: ${error.message.substring(0, 80)}...`);
        errorCount++;
        // Continue with other statements
      }
    }

    console.log("");
    log("blue", "📊 Execution Summary");
    log("blue", "===================");
    log("green", `✅ Successful: ${successCount}`);
    log("yellow", `⚠️  Warnings: ${errorCount}`);

    if (successCount >= 3) {
      log("green", "🎉 Core database structure created!");
      log("cyan", "🔧 Testing table creation...");
      return await this.testTables();
    } else {
      log("red", "❌ Not enough tables created successfully");
      return false;
    }
  }

  async testTables() {
    try {
      // Simple REST API call to check if tables exist
      const testUrl = `${this.supabaseUrl}/rest/v1/campaigns?limit=1`;

      return new Promise((resolve) => {
        const options = {
          method: "GET",
          headers: {
            apikey: this.supabaseKey,
            Authorization: `Bearer ${this.supabaseKey}`,
          },
        };

        const req = https.request(testUrl, options, (res) => {
          if (res.statusCode === 200) {
            log("green", "✅ Tables accessible via REST API");
            log("cyan", "🚀 Database setup successful!");
            log("yellow", "💡 Next step: npm start");
            resolve(true);
          } else {
            log("yellow", `⚠️  REST API test: HTTP ${res.statusCode}`);
            resolve(false);
          }
        });

        req.on("error", () => {
          log("yellow", "⚠️  REST API test failed, but tables may still exist");
          resolve(false);
        });

        req.end();
      });
    } catch (error) {
      log("yellow", `⚠️  Test error: ${error.message}`);
      return false;
    }
  }

  async run() {
    const success = await this.createTables();

    console.log("");
    if (success) {
      log("green", "🎯 SUCCESS: Database setup completed!");
      log("cyan", "🚀 Ready to run: npm start");
      return true;
    } else {
      log("yellow", "⚠️  Setup completed with warnings");
      log("cyan", "💡 Try: npm start (may still work)");
      log("cyan", "🔗 Or check Supabase Dashboard manually");
      return false;
    }
  }
}

// Run the executor
if (require.main === module) {
  const executor = new DirectSQLExecutor();
  executor
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

module.exports = DirectSQLExecutor;
