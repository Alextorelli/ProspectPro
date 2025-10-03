#!/usr/bin/env node

/**
 * Cloud Run Deployment Diagnostic Script
 * Identifies common failure patterns for ProspectPro Cloud Run deployments
 */

console.log("🔍 ProspectPro Cloud Run Deployment Diagnostic");
console.log("=".repeat(50));

async function runDiagnostic() {
  // 1. Environment Variable Analysis
  console.log("\n📋 1. Environment Variables Analysis:");

  const criticalVars = {
    NODE_ENV: process.env.NODE_ENV || "❌ MISSING",
    PORT: process.env.PORT || "❌ MISSING (Cloud Run sets this)",
    SUPABASE_URL: process.env.SUPABASE_URL ? "✅ SET" : "❌ MISSING",
    SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY
      ? "✅ SET"
      : "❌ MISSING",
    WEBHOOK_AUTH_TOKEN: process.env.WEBHOOK_AUTH_TOKEN
      ? "✅ SET"
      : "❌ MISSING",
    ALLOW_DEGRADED_START: process.env.ALLOW_DEGRADED_START || "❌ NOT SET",
  };

  Object.entries(criticalVars).forEach(([key, value]) => {
    console.log(`   ${key}: ${value}`);
  });

  // 2. Cloud Run Detection
  console.log("\n🏗️ 2. Cloud Run Environment Detection:");
  const cloudRunIndicators = {
    K_SERVICE: process.env.K_SERVICE ? "✅ DETECTED" : "❌ NOT DETECTED",
    K_REVISION: process.env.K_REVISION ? "✅ DETECTED" : "❌ NOT DETECTED",
    "PORT (Cloud Run)": process.env.PORT ? "✅ SET BY CLOUD RUN" : "❌ NOT SET",
  };

  Object.entries(cloudRunIndicators).forEach(([key, value]) => {
    console.log(`   ${key}: ${value}`);
  });

  // 3. Module Loading Test
  console.log("\n📦 3. Critical Module Loading:");
  const modules = [
    { name: "dotenv", path: "dotenv" },
    { name: "express", path: "express" },
    { name: "environment-loader", path: "./config/environment-loader" },
    { name: "supabase", path: "./config/supabase" },
  ];

  for (const module of modules) {
    try {
      require(module.path);
      console.log(`   ✅ ${module.name}`);
    } catch (error) {
      console.log(`   ❌ ${module.name}: ${error.message}`);
    }
  }

  // 4. Database Connection Test
  console.log("\n🗄️ 4. Database Connection Test:");
  try {
    const { testConnection } = require("./config/supabase");
    const dbResult = await testConnection();
    if (dbResult.success) {
      console.log("   ✅ Database connection successful");
    } else {
      console.log(`   ❌ Database connection failed: ${dbResult.error}`);
    }
  } catch (error) {
    console.log(`   ❌ Database test failed: ${error.message}`);
  }

  // 5. Port Binding Test
  console.log("\n🌐 5. Port Binding Test:");
  try {
    const express = require("express");
    const testApp = express();

    testApp.get("/test", (req, res) => {
      res.json({ status: "ok", timestamp: new Date().toISOString() });
    });

    const testPort = process.env.PORT || 8080;
    const server = testApp.listen(testPort, "0.0.0.0", () => {
      console.log(`   ✅ Successfully bound to port ${testPort} on 0.0.0.0`);
      server.close();
    });

    server.on("error", (error) => {
      console.log(`   ❌ Port binding failed: ${error.message}`);
    });
  } catch (error) {
    console.log(`   ❌ Port binding test failed: ${error.message}`);
  }

  // 6. Common Cloud Run Failure Patterns
  console.log("\n⚠️ 6. Common Failure Pattern Analysis:");

  const failures = [];

  // Missing environment variables
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SECRET_KEY) {
    failures.push(
      "Missing Supabase configuration in Cloud Build substitutions"
    );
  }

  // Missing degraded start
  if (process.env.ALLOW_DEGRADED_START !== "true") {
    failures.push(
      "ALLOW_DEGRADED_START not set to true for Cloud Run stability"
    );
  }

  // PORT not being respected
  if (!process.env.PORT) {
    failures.push(
      "PORT environment variable not set (Cloud Run sets this automatically)"
    );
  }

  if (failures.length === 0) {
    console.log("   ✅ No common failure patterns detected");
  } else {
    failures.forEach((failure) => {
      console.log(`   ❌ ${failure}`);
    });
  }

  // 7. Recommended Fixes
  console.log("\n🔧 7. Recommended Actions:");

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SECRET_KEY) {
    console.log("   📝 Check Cloud Build trigger substitution variables");
    console.log("   📝 Verify _SUPABASE_URL and _SUPABASE_SECRET_KEY are set");
  }

  if (process.env.ALLOW_DEGRADED_START !== "true") {
    console.log("   📝 Add ALLOW_DEGRADED_START=true to Cloud Run environment");
  }

  console.log("   📝 Check Cloud Run deployment logs for specific errors");
  console.log("   📝 Verify container build completed successfully");
  console.log("   📝 Test health endpoint after deployment");

  console.log("\n✅ Diagnostic complete");
}

// Run the diagnostic
runDiagnostic().catch((error) => {
  console.error("❌ Diagnostic failed:", error.message);
  process.exit(1);
});
