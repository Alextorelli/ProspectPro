#!/usr/bin/env node
/**
 * Cloud Run Deployment Monitor
 * Monitor the deployment and test endpoints as they become available
 */

const https = require("https");
const CLOUD_RUN_URL = "https://prospectpro-184492422840.us-central1.run.app";

let testCount = 0;
const maxTests = 30; // Test for ~5 minutes (10-second intervals)

console.log("🚀 CLOUD RUN DEPLOYMENT MONITOR");
console.log("================================");
console.log(`📡 Monitoring: ${CLOUD_RUN_URL}`);
console.log(`⏱️  Testing every 10 seconds for up to 5 minutes`);
console.log("");

async function quickHealthCheck() {
  return new Promise((resolve) => {
    testCount++;
    console.log(
      `🔍 Test ${testCount}/${maxTests} - ${new Date().toLocaleTimeString()}`
    );

    const req = https.get(
      `${CLOUD_RUN_URL}/health`,
      { timeout: 5000 },
      (res) => {
        let data = "";

        res.on("data", (chunk) => {
          data += chunk;
        });

        res.on("end", () => {
          const success = res.statusCode >= 200 && res.statusCode < 400;

          if (success) {
            console.log(`✅ SUCCESS! Status: ${res.statusCode}`);
            if (data.length < 300) {
              console.log(`📄 Response: ${data}`);
            }
            resolve(true);
          } else {
            console.log(`❌ Status: ${res.statusCode}`);
            resolve(false);
          }
        });
      }
    );

    req.on("error", (err) => {
      console.log(`❌ Error: ${err.message}`);
      resolve(false);
    });

    req.on("timeout", () => {
      req.destroy();
      console.log(`⏰ Timeout`);
      resolve(false);
    });
  });
}

async function monitor() {
  while (testCount < maxTests) {
    const success = await quickHealthCheck();

    if (success) {
      console.log("");
      console.log("🎉 DEPLOYMENT SUCCESSFUL!");
      console.log("========================");
      console.log(`✅ Application is now responding on ${CLOUD_RUN_URL}`);
      console.log(`🔗 Try these endpoints:`);
      console.log(`   - Health: ${CLOUD_RUN_URL}/health`);
      console.log(`   - Diagnostics: ${CLOUD_RUN_URL}/diag`);
      console.log(`   - Frontend: ${CLOUD_RUN_URL}/`);
      console.log("");
      console.log("Run the full test suite:");
      console.log("node test-cloud-run-fixes.js");
      return;
    }

    if (testCount < maxTests) {
      console.log("⏳ Waiting 10 seconds before next test...");
      console.log("");
      await new Promise((resolve) => setTimeout(resolve, 10000));
    }
  }

  console.log("");
  console.log("⚠️  DEPLOYMENT MONITORING TIMEOUT");
  console.log("=================================");
  console.log(
    "The deployment may still be in progress or there might be an issue."
  );
  console.log("");
  console.log("🔍 Next steps:");
  console.log("1. Check Google Cloud Console for Cloud Build logs");
  console.log("2. Check Cloud Run service logs for startup errors");
  console.log("3. Verify the build completed successfully");
  console.log("4. Run manual tests: node test-cloud-run-fixes.js");
}

// Start monitoring
monitor().catch(console.error);
