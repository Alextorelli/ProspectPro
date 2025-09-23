#!/usr/bin/env node

/**
 * ProspectPro Production Environment Puller v2.0
 * Enhanced Option B1: Direct workflow output retrieval
 * Triggers GitHub Actions and retrieves environment via workflow outputs
 */

const fs = require("fs");
const path = require("path");
const https = require("https");

// Configuration
const REPO_OWNER = process.env.GITHUB_REPOSITORY_OWNER || "Alextorelli";
const REPO_NAME = process.env.GITHUB_REPOSITORY_NAME || "ProspectPro";
const GITHUB_TOKEN = process.env.GHP_TOKEN || process.env.GITHUB_TOKEN;
const OUTPUT_PATH = path.join(process.cwd(), ".env");

console.log("🔧 ProspectPro Production Environment Puller v2.0");
console.log("=========================================================");

if (!GITHUB_TOKEN) {
  console.error("❌ No GitHub token found!");
  console.error("   Set GHP_TOKEN environment variable");
  console.error("   Or ensure GHP_TOKEN repository secret is accessible");
  process.exit(1);
}

console.log("📋 Repository:", `${REPO_OWNER}/${REPO_NAME}`);
console.log(
  "🔑 Token source:",
  process.env.GHP_TOKEN ? "GHP_TOKEN" : "GITHUB_TOKEN"
);
console.log("📁 Output path:", OUTPUT_PATH);

// API Request Helper
function makeRequest(options) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            resolve({ raw_data: data });
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });
    req.on("error", reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

// Step 1: Trigger workflow
async function triggerWorkflow() {
  console.log("\n🚀 Triggering environment generation workflow...");

  const options = {
    hostname: "api.github.com",
    port: 443,
    path: `/repos/${REPO_OWNER}/${REPO_NAME}/dispatches`,
    method: "POST",
    headers: {
      Authorization: `token ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "ProspectPro-Environment-Puller",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      event_type: "generate_dotenv",
      client_payload: {
        trigger_source: "production_deployment",
        timestamp: new Date().toISOString(),
      },
    }),
  };

  await makeRequest(options);
  console.log("✅ Workflow triggered successfully");
}

// Step 2: Find latest workflow run
async function findWorkflowRun() {
  console.log("\n🔍 Finding latest workflow run...");

  const options = {
    hostname: "api.github.com",
    port: 443,
    path: `/repos/${REPO_OWNER}/${REPO_NAME}/actions/workflows/generate-dotenv.yml/runs?per_page=10&status=completed`,
    method: "GET",
    headers: {
      Authorization: `token ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "ProspectPro-Environment-Puller",
    },
  };

  const response = await makeRequest(options);

  if (!response.workflow_runs || response.workflow_runs.length === 0) {
    throw new Error("No completed workflow runs found");
  }

  const latestRun = response.workflow_runs[0];
  console.log("✅ Found workflow run:", latestRun.id);
  console.log("   Status:", latestRun.status);
  console.log("   Conclusion:", latestRun.conclusion);
  console.log("   Created:", latestRun.created_at);

  return latestRun;
}

// Step 3: Wait for workflow completion
async function waitForWorkflowCompletion() {
  console.log("\n⏳ Waiting for workflow completion...");

  const maxWaitTime = 300; // 5 minutes
  const checkInterval = 10; // 10 seconds
  let waitTime = 0;

  while (waitTime < maxWaitTime) {
    try {
      const run = await findWorkflowRun();

      if (run.status === "completed") {
        if (run.conclusion === "success") {
          console.log("✅ Workflow completed successfully");
          return run;
        } else {
          throw new Error(`Workflow failed with conclusion: ${run.conclusion}`);
        }
      }

      console.log(`   Still running... (${waitTime}/${maxWaitTime}s)`);
      await new Promise((resolve) => setTimeout(resolve, checkInterval * 1000));
      waitTime += checkInterval;
    } catch (error) {
      if (waitTime === 0) {
        // First attempt, might just need to wait for workflow to start
        console.log("   Workflow starting, waiting...");
        await new Promise((resolve) =>
          setTimeout(resolve, checkInterval * 1000)
        );
        waitTime += checkInterval;
        continue;
      }
      throw error;
    }
  }

  throw new Error("Workflow timeout - exceeded maximum wait time");
}

// Step 4: Extract environment from workflow artifacts
async function extractEnvironment(runId) {
  console.log("\n🔧 Extracting environment from workflow artifacts...");

  // Get workflow artifacts
  const artifactsOptions = {
    hostname: "api.github.com",
    port: 443,
    path: `/repos/${REPO_OWNER}/${REPO_NAME}/actions/runs/${runId}/artifacts`,
    method: "GET",
    headers: {
      Authorization: `token ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "ProspectPro-Environment-Puller",
    },
  };

  const artifactsResponse = await makeRequest(artifactsOptions);

  if (
    !artifactsResponse.artifacts ||
    artifactsResponse.artifacts.length === 0
  ) {
    throw new Error("No artifacts found for workflow run");
  }

  // Find the environment artifact
  const envArtifact = artifactsResponse.artifacts.find(
    (a) => a.name === "production-environment-config"
  );

  if (!envArtifact) {
    console.log(
      "Available artifacts:",
      artifactsResponse.artifacts.map((a) => a.name)
    );
    throw new Error("production-environment-config artifact not found");
  }

  console.log("✅ Found production-environment-config artifact");

  // Download the artifact
  const downloadOptions = {
    hostname: "api.github.com",
    port: 443,
    path: `/repos/${REPO_OWNER}/${REPO_NAME}/actions/artifacts/${envArtifact.id}/zip`,
    method: "GET",
    headers: {
      Authorization: `token ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "ProspectPro-Environment-Puller",
    },
  };

  return new Promise((resolve, reject) => {
    const req = https.request(downloadOptions, (res) => {
      if (res.statusCode === 302) {
        // Follow redirect for artifact download
        const downloadUrl = res.headers.location;
        console.log(
          "📥 Downloading artifact from:",
          downloadUrl.substring(0, 50) + "..."
        );

        https
          .get(downloadUrl, (zipRes) => {
            const chunks = [];
            zipRes.on("data", (chunk) => chunks.push(chunk));
            zipRes.on("end", () => {
              const zipBuffer = Buffer.concat(chunks);
              // Extract .env content from zip
              extractEnvFromZip(zipBuffer).then(resolve).catch(reject);
            });
          })
          .on("error", reject);
      } else {
        reject(
          new Error(`Failed to download artifact: HTTP ${res.statusCode}`)
        );
      }
    });
    req.on("error", reject);
    req.end();
  });
}

// Helper to extract .env content from zip buffer
function extractEnvFromZip(zipBuffer) {
  return new Promise((resolve, reject) => {
    try {
      // Use Node.js built-in to handle the zip
      const fs = require("fs");
      const path = require("path");
      const { execSync } = require("child_process");

      // Save zip to temp file
      const tempZipPath = "/tmp/env-artifact.zip";
      const tempExtractPath = "/tmp/env-extract";

      fs.writeFileSync(tempZipPath, zipBuffer);

      // Create extraction directory
      if (fs.existsSync(tempExtractPath)) {
        execSync(`rm -rf ${tempExtractPath}`);
      }
      fs.mkdirSync(tempExtractPath, { recursive: true });

      // Extract zip using system unzip
      execSync(`unzip -q ${tempZipPath} -d ${tempExtractPath}`);

      // Find .env file in extracted content
      const extractedFiles = fs.readdirSync(tempExtractPath);
      console.log("📁 Extracted files:", extractedFiles);

      let envContent = null;

      // Look for .env file
      if (extractedFiles.includes(".env")) {
        envContent = fs.readFileSync(
          path.join(tempExtractPath, ".env"),
          "utf8"
        );
      } else if (extractedFiles.includes("production-env-config.env")) {
        envContent = fs.readFileSync(
          path.join(tempExtractPath, "production-env-config.env"),
          "utf8"
        );
      } else {
        // Check if there's a subdirectory
        for (const file of extractedFiles) {
          const fullPath = path.join(tempExtractPath, file);
          if (fs.statSync(fullPath).isDirectory()) {
            const subFiles = fs.readdirSync(fullPath);
            if (subFiles.includes(".env")) {
              envContent = fs.readFileSync(path.join(fullPath, ".env"), "utf8");
              break;
            }
            if (subFiles.includes("production-env-config.env")) {
              envContent = fs.readFileSync(
                path.join(fullPath, "production-env-config.env"),
                "utf8"
              );
              break;
            }
          }
        }
      }

      // Cleanup temp files
      try {
        fs.unlinkSync(tempZipPath);
        execSync(`rm -rf ${tempExtractPath}`);
      } catch (e) {
        console.warn("⚠️ Could not cleanup temp files:", e.message);
      }

      if (envContent) {
        console.log("✅ Successfully extracted .env content from artifact");
        console.log("📏 Content size:", envContent.length, "bytes");
        resolve(envContent);
      } else {
        reject(new Error("No .env file found in extracted artifact"));
      }
    } catch (error) {
      reject(new Error(`Failed to extract .env from zip: ${error.message}`));
    }
  });
}

// Step 5: Save environment file
function saveEnvironmentFile(envContent) {
  console.log("\n💾 Saving environment file...");

  if (!envContent || typeof envContent !== "string") {
    throw new Error("Invalid environment content received");
  }

  // Ensure content has proper line endings
  const normalizedContent = envContent.replace(/\r\n/g, "\n").trim() + "\n";

  fs.writeFileSync(OUTPUT_PATH, normalizedContent, "utf8");

  console.log("✅ Environment file saved successfully");
  console.log("📍 Location:", OUTPUT_PATH);
  console.log("📏 Size:", fs.statSync(OUTPUT_PATH).size, "bytes");

  // Show preview of first few lines (without sensitive data)
  const lines = normalizedContent.split("\n").slice(0, 5);
  console.log("\n📋 Environment Preview:");
  lines.forEach((line) => {
    if (line.trim()) {
      const key = line.split("=")[0];
      console.log(`   ${key}=***`);
    }
  });
}

// Main execution
async function main() {
  try {
    console.log(
      "\n🎯 Starting Production Environment Generation - Workflow Artifacts"
    );

    // Step 1: Trigger the workflow
    await triggerWorkflow();

    // Step 2: Wait for workflow completion
    const workflowRun = await waitForWorkflowCompletion();

    // Step 3: Extract environment content from artifacts
    const envContent = await extractEnvironment(workflowRun.id);

    // Step 4: Save environment file
    saveEnvironmentFile(envContent);

    console.log("\n🎉 SUCCESS: Production environment ready!");
    console.log("=========================================================");
    console.log("✅ Environment file generated from workflow artifacts");
    console.log("🚀 Ready for production server initialization");
  } catch (error) {
    console.error("\n❌ FAILURE: Environment generation failed");
    console.error("=========================================================");
    console.error("Error:", error.message);
    console.error("\nProduction Requirements:");
    console.error("1. GitHub token with repo permissions (GHP_TOKEN)");
    console.error("2. Repository secrets: SUPABASE_URL, SUPABASE_SECRET_KEY");
    console.error("3. Workflow must export ENV_CONTENT output");
    console.error("4. No fallback options in production mode");
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { main, triggerWorkflow, waitForWorkflowCompletion };
