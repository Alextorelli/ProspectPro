#!/usr/bin/env node
/**
 * ProspectPro Deployment Audit
 * Comprehensive check of deployment readiness and potential issues
 */

const fs = require("fs");
const path = require("path");

console.log("🔍 ProspectPro Deployment Audit");
console.log("================================");

let issues = [];
let warnings = [];
let successes = [];

// Check server configuration
function checkServerConfig() {
  console.log("\n📡 Checking Server Configuration...");

  try {
    const serverPath = path.join(__dirname, "..", "server.js");
    const serverContent = fs.readFileSync(serverPath, "utf8");

    // Check for proper binding
    if (serverContent.includes("0.0.0.0")) {
      successes.push("✅ Server binds to 0.0.0.0 (Railway compatible)");
    } else {
      issues.push("❌ Server not binding to 0.0.0.0 (Railway requirement)");
    }

    // Check for global error handlers
    if (
      serverContent.includes("unhandledRejection") &&
      serverContent.includes("uncaughtException")
    ) {
      successes.push("✅ Global error handlers present");
    } else {
      issues.push("❌ Missing global error handlers");
    }

    // Check for heartbeat
    if (serverContent.includes("Heartbeat")) {
      successes.push("✅ Heartbeat logging enabled");
    } else {
      warnings.push("⚠️ No heartbeat logging found");
    }

    // Check default port
    if (
      serverContent.includes("PORT || 3000") ||
      serverContent.includes("PORT || 8080")
    ) {
      const portMatch = serverContent.match(/PORT \|\| (\d+)/);
      if (portMatch) {
        const defaultPort = portMatch[1];
        if (defaultPort === "3000") {
          successes.push("✅ Default port is 3000 (Railway preferred)");
        } else if (defaultPort === "8080") {
          warnings.push("⚠️ Default port is 8080 (consider 3000 for Railway)");
        }
      }
    }
  } catch (error) {
    issues.push(`❌ Failed to read server.js: ${error.message}`);
  }
}

// Check Railway configuration
function checkRailwayConfig() {
  console.log("\n🚂 Checking Railway Configuration...");

  try {
    const railwayPath = path.join(__dirname, "..", "railway.json");
    if (!fs.existsSync(railwayPath)) {
      warnings.push("⚠️ No railway.json found");
      return;
    }

    const railwayContent = JSON.parse(fs.readFileSync(railwayPath, "utf8"));

    // Check healthcheck path
    const webPlugin = railwayContent.plugins?.find((p) => p.type === "web");
    if (webPlugin?.config?.deploy?.healthcheckPath === "/health") {
      successes.push("✅ Health check endpoint configured");
    } else {
      issues.push("❌ Health check endpoint not configured");
    }

    // Check required variables
    const variables = railwayContent.variables || {};
    const requiredVars = [
      "SUPABASE_URL",
      "SUPABASE_SERVICE_ROLE_KEY",
      "GOOGLE_PLACES_API_KEY",
    ];

    requiredVars.forEach((varName) => {
      if (variables[varName] && variables[varName].required) {
        successes.push(`✅ ${varName} marked as required`);
      } else {
        issues.push(`❌ ${varName} not marked as required in railway.json`);
      }
    });

    // Check PORT default
    if (variables.PORT && variables.PORT.default === "3000") {
      successes.push("✅ Railway PORT default is 3000");
    } else if (variables.PORT && variables.PORT.default === "8080") {
      warnings.push("⚠️ Railway PORT default is 8080 (consider 3000)");
    }
  } catch (error) {
    issues.push(`❌ Failed to parse railway.json: ${error.message}`);
  }
}

// Check package.json
function checkPackageConfig() {
  console.log("\n📦 Checking Package Configuration...");

  try {
    const packagePath = path.join(__dirname, "..", "package.json");
    const packageContent = JSON.parse(fs.readFileSync(packagePath, "utf8"));

    // Check start script
    if (
      packageContent.scripts &&
      packageContent.scripts.start === "node server.js"
    ) {
      successes.push("✅ Start script points to server.js");
    } else {
      issues.push("❌ Start script incorrect or missing");
    }

    // Check Node.js version
    if (packageContent.engines && packageContent.engines.node) {
      successes.push(
        `✅ Node.js version specified: ${packageContent.engines.node}`
      );
    } else {
      warnings.push("⚠️ Node.js version not specified in engines");
    }

    // Check critical dependencies
    const criticalDeps = [
      "express",
      "@supabase/supabase-js",
      "@googlemaps/google-maps-services-js",
    ];
    const deps = {
      ...packageContent.dependencies,
      ...packageContent.devDependencies,
    };

    criticalDeps.forEach((dep) => {
      if (deps[dep]) {
        successes.push(`✅ ${dep} dependency present`);
      } else {
        issues.push(`❌ Missing critical dependency: ${dep}`);
      }
    });
  } catch (error) {
    issues.push(`❌ Failed to read package.json: ${error.message}`);
  }
}

// Check security configuration
function checkSecurityConfig() {
  console.log("\n🔒 Checking Security Configuration...");

  try {
    const securityPath = path.join(
      __dirname,
      "..",
      "modules",
      "security-hardening.js"
    );
    const securityContent = fs.readFileSync(securityPath, "utf8");

    // Check CORS configuration
    if (securityContent.includes("CORS origin check")) {
      successes.push("✅ Enhanced CORS debugging present");
    } else {
      warnings.push(
        "⚠️ Basic CORS configuration (consider enhanced debugging)"
      );
    }

    // Check rate limiting
    if (securityContent.includes("RateLimiterMemory")) {
      successes.push("✅ Rate limiting configured");
    } else {
      issues.push("❌ Rate limiting not configured");
    }
  } catch (error) {
    warnings.push(
      `⚠️ Could not check security configuration: ${error.message}`
    );
  }
}

// Check database configuration
function checkDatabaseConfig() {
  console.log("\n🗄️ Checking Database Configuration...");

  try {
    const supabasePath = path.join(__dirname, "..", "config", "supabase.js");
    const supabaseContent = fs.readFileSync(supabasePath, "utf8");

    // Check key precedence
    if (supabaseContent.includes("SUPABASE_SECRET_KEY")) {
      successes.push("✅ New SUPABASE_SECRET_KEY format supported");
    } else {
      warnings.push("⚠️ Only legacy key formats supported");
    }

    // Check diagnostics
    if (
      supabaseContent.includes("testConnection") &&
      supabaseContent.includes("diagnostics")
    ) {
      successes.push("✅ Enhanced diagnostics available");
    } else {
      warnings.push("⚠️ Basic connection testing only");
    }

    // Check lazy client loading
    if (supabaseContent.includes("getSupabaseClient")) {
      successes.push("✅ Lazy client initialization");
    } else {
      warnings.push(
        "⚠️ Eager client initialization (may cause startup issues)"
      );
    }
  } catch (error) {
    warnings.push(
      `⚠️ Could not check database configuration: ${error.message}`
    );
  }
}

// Check RLS security
function checkRLSSecurity() {
  console.log("\n🛡️ Checking RLS Security...");

  try {
    const rlsPath = path.join(
      __dirname,
      "..",
      "database",
      "rls-security-hardening.sql"
    );
    if (fs.existsSync(rlsPath)) {
      successes.push("✅ RLS security hardening script present");

      const rlsContent = fs.readFileSync(rlsPath, "utf8");
      const policyCount = (rlsContent.match(/CREATE POLICY/g) || []).length;
      const tableCount = (rlsContent.match(/ENABLE ROW LEVEL SECURITY/g) || [])
        .length;

      successes.push(`✅ ${policyCount} security policies defined`);
      successes.push(`✅ ${tableCount} tables with RLS enabled`);

      if (rlsContent.includes("search_path = ''")) {
        successes.push("✅ Security definer functions hardened");
      } else {
        issues.push("❌ Security definer functions not hardened");
      }
    } else {
      issues.push("❌ RLS security hardening script missing");
    }
  } catch (error) {
    warnings.push(`⚠️ Could not check RLS security: ${error.message}`);
  }
}

// Main audit execution
async function runAudit() {
  checkServerConfig();
  checkRailwayConfig();
  checkPackageConfig();
  checkSecurityConfig();
  checkDatabaseConfig();
  checkRLSSecurity();

  console.log("\n📊 Audit Results");
  console.log("================");

  if (successes.length > 0) {
    console.log(`\n✅ Successes (${successes.length}):`);
    successes.forEach((success) => console.log(`   ${success}`));
  }

  if (warnings.length > 0) {
    console.log(`\n⚠️ Warnings (${warnings.length}):`);
    warnings.forEach((warning) => console.log(`   ${warning}`));
  }

  if (issues.length > 0) {
    console.log(`\n❌ Issues (${issues.length}):`);
    issues.forEach((issue) => console.log(`   ${issue}`));
  }

  const score = Math.round(
    (successes.length / (successes.length + warnings.length + issues.length)) *
      100
  );

  console.log("\n🎯 Overall Deployment Readiness");
  console.log("==============================");
  console.log(`Score: ${score}%`);

  if (score >= 90) {
    console.log("🎉 EXCELLENT - Ready for production deployment");
  } else if (score >= 75) {
    console.log("✅ GOOD - Ready with minor optimizations recommended");
  } else if (score >= 60) {
    console.log("⚠️ FAIR - Address warnings before deployment");
  } else {
    console.log("❌ POOR - Critical issues must be fixed");
  }

  if (issues.length > 0) {
    console.log("\n🚨 Action Required:");
    console.log("Fix critical issues before deploying to Railway");
    process.exit(1);
  } else {
    console.log("\n🚀 Ready for deployment!");
    process.exit(0);
  }
}

// Run the audit
runAudit().catch((error) => {
  console.error("❌ Audit failed:", error);
  process.exit(1);
});
