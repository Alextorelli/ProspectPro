#!/usr/bin/env node
// Manual Cloud Build Trigger Commands

console.log("🚀 MANUAL CLOUD BUILD TRIGGER COMMANDS");
console.log("=======================================");
console.log("");

console.log("📍 CORRECT TRIGGER ID:");
console.log("   ae04dd92-4509-43ee-9f70-da3caf15dbb4");
console.log("");

console.log("🔧 MANUAL TRIGGER COMMANDS:");
console.log("============================");
console.log("");

console.log("Option 1: Manual Trigger via Cloud Console");
console.log("-------------------------------------------");
console.log("Visit: https://console.cloud.google.com/cloud-build/triggers");
console.log("1. Find trigger ae04dd92-4509-43ee-9f70-da3caf15dbb4");
console.log("2. Click 'Run' button");
console.log("3. Select branch: main");
console.log("4. Click 'Run Trigger'");
console.log("");

console.log("Option 2: Manual Trigger via gcloud CLI");
console.log("----------------------------------------");
console.log("Command (if gcloud is installed):");
console.log(
  "gcloud builds triggers run ae04dd92-4509-43ee-9f70-da3caf15dbb4 \\"
);
console.log("  --region=us-central1 \\");
console.log("  --branch=main");
console.log("");

console.log("Option 3: Manual Trigger via REST API");
console.log("--------------------------------------");
console.log(
  "POST https://cloudbuild.googleapis.com/v1/projects/leadgen-471822/locations/us-central1/triggers/ae04dd92-4509-43ee-9f70-da3caf15dbb4:run"
);
console.log('Body: { "branchName": "main" }');
console.log("");

console.log("🔍 VERIFICATION STEPS:");
console.log("======================");
console.log("");
console.log("After triggering, check:");
console.log(
  "1. Build logs: https://console.cloud.google.com/cloud-build/builds"
);
console.log(
  "2. Look for build with trigger ae04dd92-4509-43ee-9f70-da3caf15dbb4"
);
console.log("3. Verify it deploys to Cloud Run service 'prospectpro'");
console.log("4. Test the service URL after deployment completes");
console.log("");

console.log("⚡ EXPECTED RESULT:");
console.log("===================");
console.log("With the correct trigger + our port fixes:");
console.log("• Build should complete in ~2-3 minutes");
console.log("• Container will bind to Cloud Run's dynamic PORT");
console.log("• Health checks should pass");
console.log("• Service should respond correctly (no more 404)");
console.log("");

console.log("🎯 Why This Should Work:");
console.log("=========================");
console.log("✅ Port fixes applied (removed hardcoded PORT=3100)");
console.log("✅ cloudbuild.yaml updated (removed --port=3100)");
console.log("✅ Using correct trigger (connected to live service)");
console.log("✅ All configuration aligned for Cloud Run");
console.log("");

console.log("🚨 CRITICAL: Use trigger ae04dd92-4509-43ee-9f70-da3caf15dbb4!");
console.log("The previous builds were likely going to a different service!");
console.log("");

console.log("📞 IMMEDIATE NEXT STEP:");
console.log("========================");
console.log("Go to Cloud Console and manually run the correct trigger");
console.log("to test our port configuration fixes.");
