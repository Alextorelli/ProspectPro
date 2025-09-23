#!/usr/bin/env node

/**
 * ProspectPro Enhanced Option B1 Test
 * Validates the workflow output implementation without triggering actual workflow
 */

const fs = require("fs");
const path = require("path");

console.log("🧪 ProspectPro Enhanced Option B1 Test Suite");
console.log("=============================================");

function testFileStructure() {
  console.log("\n📁 Testing file structure...");

  const requiredFiles = [
    ".github/workflows/generate-dotenv.yml",
    "scripts/pull-env-from-secrets.js",
    "scripts/init-prod-server.sh",
    "scripts/check-env-readiness.js",
  ];

  let allFound = true;

  for (const file of requiredFiles) {
    const fullPath = path.join(process.cwd(), file);
    if (fs.existsSync(fullPath)) {
      console.log(`✅ ${file}`);
    } else {
      console.log(`❌ ${file} - MISSING`);
      allFound = false;
    }
  }

  return allFound;
}

function testWorkflowContent() {
  console.log("\n🔧 Testing workflow configuration...");

  const workflowPath = path.join(
    process.cwd(),
    ".github/workflows/generate-dotenv.yml"
  );

  if (!fs.existsSync(workflowPath)) {
    console.log("❌ Workflow file not found");
    return false;
  }

  const content = fs.readFileSync(workflowPath, "utf8");

  const expectedPatterns = [
    "repository_dispatch",
    "generate_dotenv",
    "ENV_CONTENT",
    "SUPABASE_URL",
    "SUPABASE_SECRET_KEY",
    "production-environment",
  ];

  let allFound = true;

  for (const pattern of expectedPatterns) {
    if (content.includes(pattern)) {
      console.log(`✅ Contains: ${pattern}`);
    } else {
      console.log(`❌ Missing: ${pattern}`);
      allFound = false;
    }
  }

  return allFound;
}

function testScriptContent() {
  console.log("\n📜 Testing puller script content...");

  const scriptPath = path.join(
    process.cwd(),
    "scripts/pull-env-from-secrets.js"
  );

  if (!fs.existsSync(scriptPath)) {
    console.log("❌ Puller script not found");
    return false;
  }

  const content = fs.readFileSync(scriptPath, "utf8");

  const expectedPatterns = [
    "Enhanced Option B1",
    "GHP_TOKEN",
    "triggerWorkflow",
    "waitForWorkflowCompletion",
    "extractEnvironment",
    "saveEnvironmentFile",
    "workflow outputs",
  ];

  let allFound = true;

  for (const pattern of expectedPatterns) {
    if (content.includes(pattern)) {
      console.log(`✅ Contains: ${pattern}`);
    } else {
      console.log(`❌ Missing: ${pattern}`);
      allFound = false;
    }
  }

  return allFound;
}

function testPackageScripts() {
  console.log("\n📦 Testing package.json scripts...");

  const packagePath = path.join(process.cwd(), "package.json");

  if (!fs.existsSync(packagePath)) {
    console.log("❌ package.json not found");
    return false;
  }

  const pkg = JSON.parse(fs.readFileSync(packagePath, "utf8"));

  const expectedScripts = ["prod:init", "prod:setup-env", "prod:check"];

  let allFound = true;

  for (const script of expectedScripts) {
    if (pkg.scripts && pkg.scripts[script]) {
      console.log(`✅ Script: ${script}`);
    } else {
      console.log(`❌ Missing script: ${script}`);
      allFound = false;
    }
  }

  return allFound;
}

function testRemovedFiles() {
  console.log("\n🗑️  Testing removed outdated files...");

  const shouldNotExist = [
    "setup-production.sh",
    "scripts/configure-api-keys.js",
  ];

  let allRemoved = true;

  for (const file of shouldNotExist) {
    const fullPath = path.join(process.cwd(), file);
    if (!fs.existsSync(fullPath)) {
      console.log(`✅ ${file} - correctly removed`);
    } else {
      console.log(`❌ ${file} - still exists (should be removed)`);
      allRemoved = false;
    }
  }

  return allRemoved;
}

// Run all tests
async function main() {
  const tests = [
    testFileStructure,
    testWorkflowContent,
    testScriptContent,
    testPackageScripts,
    testRemovedFiles,
  ];

  let allPassed = true;

  for (const test of tests) {
    if (!test()) {
      allPassed = false;
    }
  }

  console.log("\n" + "=".repeat(45));

  if (allPassed) {
    console.log("🎉 ALL TESTS PASSED!");
    console.log("✅ Enhanced Option B1 implementation is ready");
    console.log("🚀 Ready for production deployment");
    console.log("\nNext steps:");
    console.log("1. Set GHP_TOKEN environment variable");
    console.log("2. Run: npm run prod:init");
    console.log("3. Verify environment generation works");
  } else {
    console.log("❌ SOME TESTS FAILED");
    console.log("⚠️  Please fix the issues above before proceeding");
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main };
