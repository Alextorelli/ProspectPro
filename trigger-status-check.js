#!/usr/bin/env node
// Cloud Build Trigger Status Check
// Trigger: projects/leadgen-471822/locations/us-central1/triggers/ae04dd92-4509-43ee-9f70-da3caf15dbb4

console.log("🔍 CLOUD BUILD TRIGGER STATUS CHECK");
console.log("====================================");
console.log("");

console.log("📍 TRIGGER DETAILS:");
console.log("===================");
console.log(
  "Full Path: projects/leadgen-471822/locations/us-central1/triggers/ae04dd92-4509-43ee-9f70-da3caf15dbb4"
);
console.log("Trigger ID: ae04dd92-4509-43ee-9f70-da3caf15dbb4");
console.log("Project: leadgen-471822");
console.log("Region: us-central1");
console.log("");

console.log("🔗 DIRECT CONSOLE LINKS:");
console.log("=========================");
console.log("");

console.log("Trigger Details & Configuration:");
console.log(
  "https://console.cloud.google.com/cloud-build/triggers/edit/ae04dd92-4509-43ee-9f70-da3caf15dbb4?project=leadgen-471822&region=us-central1"
);
console.log("");

console.log("Trigger Build History:");
console.log(
  "https://console.cloud.google.com/cloud-build/builds?project=leadgen-471822&region=us-central1&query=trigger_id%3D%22ae04dd92-4509-43ee-9f70-da3caf15dbb4%22"
);
console.log("");

console.log("All Cloud Build Triggers:");
console.log(
  "https://console.cloud.google.com/cloud-build/triggers?project=leadgen-471822&region=us-central1"
);
console.log("");

console.log("Recent Cloud Builds (All):");
console.log(
  "https://console.cloud.google.com/cloud-build/builds?project=leadgen-471822&region=us-central1"
);
console.log("");

console.log("⚡ QUICK ACTIONS:");
console.log("=================");
console.log("");

console.log("1. VERIFY TRIGGER EXISTS:");
console.log("   Visit the trigger details link above");
console.log("   Check if the trigger is properly configured");
console.log("   Verify it points to the correct GitHub repo");
console.log("");

console.log("2. CHECK RECENT BUILDS:");
console.log("   Look at build history for this specific trigger");
console.log("   See if any builds have run recently");
console.log("   Check build status and logs");
console.log("");

console.log("3. MANUAL TRIGGER:");
console.log("   If trigger exists, click 'Run' button");
console.log("   Select 'main' branch");
console.log("   Monitor build progress");
console.log("");

console.log("4. VERIFY DEPLOYMENT:");
console.log("   After build completes, check Cloud Run service");
console.log("   Test the service URL");
console.log("   Check if port fixes resolved the issue");
console.log("");

console.log("🎯 EXPECTED BEHAVIOR:");
console.log("======================");
console.log("");
console.log("If this is the correct trigger:");
console.log("✅ Should show GitHub repo connection");
console.log("✅ Should have cloudbuild.yaml configuration");
console.log("✅ Should deploy to 'prospectpro' Cloud Run service");
console.log("✅ Should use our recent port binding fixes");
console.log("");

console.log("📊 DIAGNOSIS QUESTIONS:");
console.log("========================");
console.log("");
console.log("When you check the trigger:");
console.log("• Does it exist and show as enabled?");
console.log("• Is it connected to Alextorelli/ProspectPro repo?");
console.log("• Does it trigger on main branch pushes?");
console.log("• Are there recent builds in the history?");
console.log("• Does it deploy to the correct Cloud Run service?");
console.log("");

console.log("🚨 CRITICAL SUCCESS FACTORS:");
console.log("=============================");
console.log("With our recent fixes + correct trigger:");
console.log("• Container should bind to Cloud Run's dynamic PORT");
console.log("• No more hardcoded port conflicts");
console.log("• Service should respond correctly");
console.log("• 'Page not found' error should be resolved");
console.log("");

console.log("Click the links above to investigate the trigger status!");
