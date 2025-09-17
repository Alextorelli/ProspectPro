#!/usr/bin/env node
/**
 * ProspectPro Database Initialization - Direct SQL Approach
 *
 * This script provides SQL commands for manual execution in Supabase SQL Editor
 * since legacy API keys are disabled.
 */

const fs = require("fs");
const path = require("path");

const phases = [
  {
    id: 1,
    name: "Foundation Tables",
    file: "01-database-foundation.sql",
    description: "Core infrastructure: campaigns, enhanced_leads",
  },
  {
    id: 2,
    name: "Enrichment Tables",
    file: "02-leads-and-enrichment.sql",
    description: "Lead data: lead_emails, lead_social_profiles",
  },
  {
    id: 3,
    name: "Monitoring Tables",
    file: "03-monitoring-and-analytics.sql",
    description: "Analytics: campaign_analytics, api_cost_tracking",
  },
  {
    id: 4,
    name: "Business Functions",
    file: "04-functions-and-procedures.sql",
    description: "PostgreSQL functions and triggers",
  },
  {
    id: 5,
    name: "Security Policies",
    file: "05-security-and-rls.sql",
    description: "Row Level Security (RLS) policies",
  },
];

console.log("🚀 ProspectPro Database Setup - Manual Execution Guide");
console.log("=====================================================");
console.log("");
console.log("❌ Legacy API keys are disabled in your Supabase project.");
console.log(
  "✅ Use this guide to manually execute database setup in Supabase SQL Editor:"
);
console.log("");
console.log(
  "🌐 Go to: https://app.supabase.com/project/sriycekxdqnesdsgwiuc/sql/new"
);
console.log("");

phases.forEach((phase) => {
  console.log(`📋 PHASE ${phase.id}: ${phase.name}`);
  console.log(`   Description: ${phase.description}`);
  console.log(`   File: ${phase.file}`);

  const filePath = path.join(__dirname, phase.file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, "utf8");
    const lines = content.split("\n").length;
    console.log(`   ✅ Ready to execute (${lines} lines)`);
  } else {
    console.log(`   ❌ File missing: ${phase.file}`);
  }
  console.log("");
});

console.log("🔧 Manual Execution Steps:");
console.log(
  "1. Open Supabase SQL Editor: https://app.supabase.com/project/sriycekxdqnesdsgwiuc/sql/new"
);
console.log("2. For each phase above:");
console.log("   a) Copy entire content from the phase file");
console.log("   b) Paste into SQL Editor");
console.log('   c) Click "Run" button');
console.log("   d) Verify success before proceeding to next phase");
console.log("");
console.log("⚠️  Important: Execute phases in order (1 → 2 → 3 → 4 → 5)");
console.log("");

// Generate consolidated SQL for copy-paste
const allSQLPath = path.join(__dirname, "all-phases-consolidated.sql");
let consolidatedSQL = "";

consolidatedSQL += "-- =====================================================\n";
consolidatedSQL += "-- ProspectPro Complete Database Setup\n";
consolidatedSQL += "-- Execute this entire script in Supabase SQL Editor\n";
consolidatedSQL +=
  "-- =====================================================\n\n";

phases.forEach((phase) => {
  const filePath = path.join(__dirname, phase.file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, "utf8");
    consolidatedSQL += `-- =====================================================\n`;
    consolidatedSQL += `-- PHASE ${phase.id}: ${phase.name}\n`;
    consolidatedSQL += `-- ${phase.description}\n`;
    consolidatedSQL += `-- =====================================================\n\n`;
    consolidatedSQL += content + "\n\n";
  }
});

fs.writeFileSync(allSQLPath, consolidatedSQL);
console.log(`📄 Consolidated SQL created: all-phases-consolidated.sql`);
console.log("   You can copy-paste this entire file into Supabase SQL Editor");
console.log("");
console.log("🎯 After successful execution, run validation:");
console.log(
  "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;"
);
console.log("-- Expected: 11+ tables created");
console.log("");
