#!/usr/bin/env node
/**
 * ProspectPro Database Validation and Setup
 *
 * Alternative approach that works with existing Supabase setup
 * Focuses on validating existing configuration and preparing for database setup
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
  reset: "\x1b[0m",
  bold: "\x1b[1m",
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

class DatabaseValidator {
  constructor() {
    this.config = {
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseKey:
        process.env.SUPABASE_SERVICE_ROLE_KEY ||
        process.env.SUPABASE_SECRET_KEY,
      testMode: process.argv.includes("--test-mode"),
    };

    this.results = {
      configValid: false,
      schemaFilesFound: [],
      setupInstructions: [],
    };
  }

  validateConfiguration() {
    log("blue", "🔍 Validating ProspectPro Database Configuration");
    log("blue", "==============================================");

    // Check environment variables
    if (!this.config.supabaseUrl) {
      log("red", "❌ SUPABASE_URL not found");
      return false;
    }

    if (!this.config.supabaseKey) {
      log("red", "❌ SUPABASE_SERVICE_ROLE_KEY not found");
      return false;
    }

    log("green", "✅ Environment variables configured:");
    log("green", `   • SUPABASE_URL: ${this.config.supabaseUrl}`);
    log(
      "green",
      `   • Service Role Key: ${this.config.supabaseKey.substring(0, 20)}...`
    );

    this.results.configValid = true;
    return true;
  }

  checkSchemaFiles() {
    log("yellow", "📋 Checking database schema files...");

    const schemaFiles = [
      "enhanced-supabase-schema.sql",
      "all-phases-consolidated.sql",
      "01-database-foundation.sql",
      "02-leads-and-enrichment.sql",
      "03-monitoring-and-analytics.sql",
      "04-functions-and-procedures.sql",
      "05-security-and-rls.sql",
    ];

    let foundFiles = 0;

    for (const filename of schemaFiles) {
      const filepath = path.join(__dirname, filename);
      if (fs.existsSync(filepath)) {
        const stats = fs.statSync(filepath);
        log("green", `   ✅ ${filename} (${(stats.size / 1024).toFixed(1)}KB)`);
        this.results.schemaFilesFound.push(filename);
        foundFiles++;
      } else {
        log("yellow", `   ⚠️  ${filename} (not found)`);
      }
    }

    log("blue", `📊 Found ${foundFiles}/${schemaFiles.length} schema files`);
    return foundFiles > 0;
  }

  generateSetupInstructions() {
    log("yellow", "📋 Generating database setup instructions...");

    const instructions = [
      "🎯 ProspectPro Database Setup Instructions",
      "=========================================",
      "",
      "✅ Configuration Status: READY",
      "✅ Schema Files: AVAILABLE",
      "⚠️  Connection: Manual setup required due to Supabase API key format",
      "",
      "📋 Manual Setup Steps:",
      "",
      "1. Open Supabase SQL Editor:",
      `   ${this.config.supabaseUrl.replace("//", "//")}/project/default/sql`,
      "",
      "2. Execute the consolidated schema:",
      "   • Copy content from: database/all-phases-consolidated.sql",
      "   • Paste into Supabase SQL Editor",
      '   • Click "Run" to create all tables',
      "",
      "3. Verify setup by checking these tables were created:",
      "   • enhanced_leads (main business data)",
      "   • campaigns (user sessions)",
      "   • api_costs (cost tracking)",
      "   • validation_results (data quality)",
      "   • service_health_metrics (monitoring)",
      "",
      "4. Alternative: Use Supabase Dashboard:",
      "   • Go to Table Editor in your Supabase project",
      "   • Import the SQL schema through the interface",
      "",
      "💡 After manual setup, run this command to test:",
      "   node database/validate-setup.js --check-tables",
    ];

    this.results.setupInstructions = instructions;

    log("blue", instructions.join("\n"));

    return true;
  }

  createManualSetupGuide() {
    const guideContent = `# ProspectPro Database Manual Setup Guide

## Prerequisites
- ✅ Supabase project: ${this.config.supabaseUrl}
- ✅ Service role key configured
- ✅ Schema files available: ${this.results.schemaFilesFound.length} files

## Quick Setup (Recommended)

### Option 1: Supabase SQL Editor
1. Open: ${this.config.supabaseUrl.replace("//", "//")}/project/default/sql
2. Copy and paste the content from: \`database/all-phases-consolidated.sql\`
3. Click "Run" to execute the complete schema

### Option 2: Individual Phase Files
Execute these files in order:
${this.results.schemaFilesFound.map((f) => `- \`database/${f}\``).join("\n")}

## Tables That Will Be Created

### Core Tables
- **enhanced_leads** - Main business data with confidence scoring
- **campaigns** - User session tracking
- **api_costs** - Cost tracking per API call
- **validation_results** - Data quality validation

### Monitoring Tables  
- **service_health_metrics** - System health monitoring
- **webhook_events** - Webhook processing logs

### Security Features
- **Row Level Security (RLS)** policies on all tables
- **User isolation** with auth.uid() policies
- **Admin access** controls

## Validation

After setup, verify with:
\`\`\`bash
node database/validate-setup.js --check-tables
\`\`\`

## Troubleshooting

### If you see "Legacy API keys are disabled"
This is expected - manually execute the SQL in Supabase Dashboard instead.

### If tables already exist
The SQL includes \`IF NOT EXISTS\` clauses, so it's safe to re-run.

## Next Steps
1. Complete database setup as described above
2. Run: \`npm start\` to test the full application
3. Access: http://localhost:3000/health to verify connectivity

Generated: ${new Date().toISOString()}
`;

    const guidePath = path.join(__dirname, "MANUAL_SETUP_GUIDE.md");
    fs.writeFileSync(guidePath, guideContent);
    log("green", `✅ Manual setup guide created: ${guidePath}`);

    return guidePath;
  }

  run() {
    const startTime = Date.now();

    if (!this.validateConfiguration()) {
      log("red", "❌ Configuration validation failed");
      return false;
    }

    if (!this.checkSchemaFiles()) {
      log("red", "❌ Schema files validation failed");
      return false;
    }

    this.generateSetupInstructions();
    const guidePath = this.createManualSetupGuide();

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    log("blue", "\n🎯 Database Validation Summary");
    log("blue", "==============================");
    log("green", `✅ Configuration: Valid`);
    log(
      "green",
      `✅ Schema files: ${this.results.schemaFilesFound.length} found`
    );
    log("blue", `✅ Setup guide: ${guidePath}`);
    log("blue", `⏱️  Duration: ${duration}s`);

    log("yellow", "\n🎯 Next Steps:");
    log("yellow", "1. Follow the manual setup guide created above");
    log("yellow", "2. Execute the SQL schema in Supabase Dashboard");
    log("yellow", "3. Run: npm start to test the application");

    return true;
  }
}

// Run the validator
if (require.main === module) {
  const validator = new DatabaseValidator();
  const success = validator.run();
  process.exit(success ? 0 : 1);
}

module.exports = DatabaseValidator;
