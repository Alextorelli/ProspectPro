#!/usr/bin/env node

/**
 * ProspectPro Environment Readiness Checker
 * Validates that all required environment variables and configurations are ready
 */

const fs = require("fs");
const path = require("path");

console.log("🔍 ProspectPro Environment Readiness Check");
console.log("==========================================\n");

// Check if .env file exists and has real values
function checkEnvFile() {
  const envPath = path.join(process.cwd(), ".env");

  if (!fs.existsSync(envPath)) {
    console.log("❌ No .env file found");
    return false;
  }

  const envContent = fs.readFileSync(envPath, "utf8");

  // Check for template values
  const templatePatterns = [
    /your_.*_here/,
    /https:\/\/your-project-ref\.supabase\.co/,
    /your_service_role_key_here/,
  ];

  const hasTemplateValues = templatePatterns.some((pattern) =>
    pattern.test(envContent)
  );

  if (hasTemplateValues) {
    console.log("⚠️  .env file exists but contains template values");
    console.log("   Consider triggering workflow: npm run prod:init");
    return false;
  }

  console.log("✅ .env file exists with real values");
  return true;
}

// Check required environment variables
function checkRequiredVars() {
  require("dotenv").config({
    path: path.join(process.cwd(), ".env"),
    silent: true,
  });

  const requiredVars = ["SUPABASE_URL", "SUPABASE_SECRET_KEY", "NODE_ENV"];

  const missingVars = requiredVars.filter((varName) => !process.env[varName]);

  if (missingVars.length > 0) {
    console.log("❌ Missing required environment variables:");
    missingVars.forEach((varName) => console.log(`   - ${varName}`));
    return false;
  }

  console.log("✅ All required environment variables present");
  return true;
}

// Check if GitHub Actions workflow can be triggered
function checkWorkflowTriggerability() {
  const hasGitHubToken =
    process.env.GHP_SECRET ||
    process.env.GITHUB_TOKEN ||
    process.env.GITHUB_PAT;
  const hasRepoInfo =
    process.env.GITHUB_REPOSITORY_OWNER && process.env.GITHUB_REPOSITORY_NAME;

  if (!hasGitHubToken) {
    console.log(
      "⚠️  No GitHub token found (GHP_SECRET, GITHUB_TOKEN, or GITHUB_PAT)"
    );
    console.log(
      "   Workflow triggering not available - manual .env setup required"
    );
    console.log(
      "   💡 Set GHP_SECRET repository secret or GHP_SECRET environment variable"
    );
    return false;
  }

  if (!hasRepoInfo) {
    console.log(
      "ℹ️  Repository info will use defaults (Alextorelli/ProspectPro)"
    );
  }

  console.log("✅ GitHub Actions workflow can be triggered");
  const tokenSource = process.env.GHP_SECRET
    ? "GHP_SECRET"
    : process.env.GITHUB_TOKEN
    ? "GITHUB_TOKEN"
    : "GITHUB_PAT";
  console.log(`   🔑 Token source: ${tokenSource}`);
  return true;
}

// Check server startup readiness
async function checkServerReadiness() {
  try {
    // Test environment loader (adjust path for scripts directory)
    const EnvironmentLoader = require("../config/environment-loader");
    const envLoader = new EnvironmentLoader();

    console.log("✅ Environment loader working");
    return true;
  } catch (error) {
    console.log("❌ Environment loader failed:", error.message);
    return false;
  }
}

// Main check function
async function performReadinessCheck() {
  const checks = [
    { name: "Environment File", fn: checkEnvFile },
    { name: "Required Variables", fn: checkRequiredVars },
    { name: "Workflow Trigger", fn: checkWorkflowTriggerability },
    { name: "Server Components", fn: checkServerReadiness },
  ];

  let allPassed = true;
  const results = [];

  for (const check of checks) {
    try {
      const result = await check.fn();
      results.push({ name: check.name, passed: result });
      if (!result) allPassed = false;
    } catch (error) {
      console.log(`❌ ${check.name} check failed:`, error.message);
      results.push({ name: check.name, passed: false });
      allPassed = false;
    }
  }

  console.log("\n📊 Readiness Summary:");
  console.log("=====================");

  results.forEach((result) => {
    const status = result.passed ? "✅" : "❌";
    console.log(`${status} ${result.name}`);
  });

  console.log("\n🎯 Recommendations:");
  console.log("===================");

  if (allPassed) {
    console.log("🚀 All systems ready! You can start the production server:");
    console.log(
      "   npm run prod:init-skip-workflow  # Start with existing .env"
    );
    console.log("   npm run prod                     # Direct start");
  } else {
    console.log("🔧 To fix issues:");
    if (!results.find((r) => r.name === "Environment File")?.passed) {
      console.log(
        "   npm run prod:init               # Trigger workflow and start server"
      );
    }
    if (!results.find((r) => r.name === "Required Variables")?.passed) {
      console.log(
        "   # Ensure GitHub Secrets are configured: SUPABASE_URL, SUPABASE_SECRET_KEY"
      );
    }
    if (!results.find((r) => r.name === "Workflow Trigger")?.passed) {
      console.log(
        "   # Set GHP_SECRET environment variable or ensure repository secret is configured"
      );
      console.log("   export GHP_SECRET='your_github_personal_access_token'");
    }
  }

  return allPassed;
}

// Run the check
performReadinessCheck()
  .then((allReady) => {
    process.exit(allReady ? 0 : 1);
  })
  .catch((error) => {
    console.error("❌ Readiness check failed:", error);
    process.exit(1);
  });
