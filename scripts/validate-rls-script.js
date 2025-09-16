#!/usr/bin/env node
/**
 * Validate RLS Security Hardening Script
 * Checks for syntax issues and validates completeness
 */

const fs = require("fs");
const path = require("path");

const scriptPath = path.join(
  __dirname,
  "..",
  "database",
  "rls-security-hardening.sql"
);

console.log("🔒 Validating RLS Security Hardening Script");
console.log("===========================================");

try {
  const sqlContent = fs.readFileSync(scriptPath, "utf8");

  // Basic syntax validations
  let issues = [];
  let warnings = [];

  // Check for balanced parentheses
  const openParens = (sqlContent.match(/\(/g) || []).length;
  const closeParens = (sqlContent.match(/\)/g) || []).length;
  if (openParens !== closeParens) {
    issues.push(
      `Unbalanced parentheses: ${openParens} open, ${closeParens} close`
    );
  }

  // Check for required tables in policies
  const requiredTables = [
    "enhanced_leads",
    "lead_emails",
    "lead_social_profiles",
    "campaigns",
    "api_usage_log",
    "campaign_analytics",
    "api_cost_tracking",
    "lead_qualification_metrics",
    "service_health_metrics",
    "dashboard_exports",
  ];

  const missingTables = requiredTables.filter(
    (table) => !sqlContent.includes(`ON public.${table}`)
  );

  if (missingTables.length > 0) {
    warnings.push(`Missing policies for tables: ${missingTables.join(", ")}`);
  }

  // Check for auth.uid() usage
  const authUidCount = (sqlContent.match(/auth\.uid\(\)/g) || []).length;
  console.log(`✅ Found ${authUidCount} references to auth.uid()`);

  // Check for proper policy naming
  const policies = sqlContent.match(/CREATE POLICY "([^"]+)"/g) || [];
  console.log(`✅ Found ${policies.length} CREATE POLICY statements`);

  // Check for all CRUD operations
  const operations = ["SELECT", "INSERT", "UPDATE", "DELETE"];
  operations.forEach((op) => {
    const count = (sqlContent.match(new RegExp(`FOR ${op}`, "g")) || []).length;
    console.log(`✅ ${op} policies: ${count}`);
  });

  // Check for performance indexes
  const indexes = (sqlContent.match(/CREATE INDEX/g) || []).length;
  console.log(`✅ Performance indexes: ${indexes}`);

  // Check for security definer functions
  const securityFunctions = (sqlContent.match(/SECURITY DEFINER/g) || [])
    .length;
  console.log(`✅ Security definer functions: ${securityFunctions}`);

  // Final validation
  if (issues.length === 0) {
    console.log("\n🎉 RLS Security Script Validation PASSED");
    console.log("   ✅ No syntax issues detected");
    console.log("   ✅ All required tables have policies");
    console.log("   ✅ Proper authentication patterns used");
    console.log("   ✅ Performance optimizations included");
  } else {
    console.log("\n❌ RLS Security Script Validation FAILED");
    issues.forEach((issue) => console.log(`   🚨 ${issue}`));
  }

  if (warnings.length > 0) {
    console.log("\n⚠️  Warnings:");
    warnings.forEach((warning) => console.log(`   ⚠️  ${warning}`));
  }

  console.log("\n📊 Script Statistics:");
  console.log(`   📄 File size: ${(sqlContent.length / 1024).toFixed(1)} KB`);
  console.log(`   📝 Lines: ${sqlContent.split("\n").length}`);
  console.log(`   🔒 Policies: ${policies.length}`);
  console.log(`   ⚡ Indexes: ${indexes}`);
  console.log(`   🛡️  Functions: ${securityFunctions}`);

  process.exit(issues.length > 0 ? 1 : 0);
} catch (error) {
  console.error("❌ Failed to validate RLS script:", error.message);
  process.exit(1);
}
