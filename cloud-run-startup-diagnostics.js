#!/usr/bin/env node
// Cloud Run Service Startup Diagnostic Plan
// For: https://prospectpro-184492422840.us-central1.run.app

console.log("🔍 CLOUD RUN SERVICE STARTUP DIAGNOSTICS");
console.log("=======================================");
console.log("");

console.log("📊 DEPLOYMENT STATUS:");
console.log("=====================");
console.log("✅ Cloud Build: SUCCESSFUL");
console.log("✅ Deployment: COMPLETED");
console.log(
  "✅ Service URL: https://prospectpro-184492422840.us-central1.run.app"
);
console.log("✅ Revision: prospectpro-00021-fd7");
console.log("✅ Traffic: 100% to latest revision");
console.log("❌ Service Access: Returns 404 'Page not found'");
console.log("");

console.log("🎯 ROOT CAUSE ANALYSIS:");
console.log("=======================");
console.log("When we see 'Page not found' but the service is deployed,");
console.log("this typically indicates one of these issues:");
console.log("");
console.log("1️⃣ APPLICATION STARTUP FAILURE");
console.log("------------------------------");
console.log("• The Node.js process is crashing during startup");
console.log("• Missing critical environment variables");
console.log("• Database connection failures");
console.log("• Uncaught exceptions in startup code");
console.log("");

console.log("2️⃣ PORT BINDING MISMATCH");
console.log("------------------------");
console.log("• Container listening on wrong port (still a possibility)");
console.log("• App using hardcoded port in server.js");
console.log("• App not properly reading process.env.PORT");
console.log("• Health check targeting wrong port");
console.log("");

console.log("3️⃣ ROUTING CONFIGURATION");
console.log("------------------------");
console.log("• Default route not handling root path (/)");
console.log("• Missing Express middleware");
console.log("• Incorrect base path configuration");
console.log("");

console.log("🔬 CLOUD RUN SERVICE LOGS:");
console.log("==========================");
console.log("⚠️ CRITICAL ACTION: Check Cloud Run service logs");
console.log("");
console.log("In Google Cloud Console:");
console.log("1. Go to Cloud Run → Services → prospectpro");
console.log("2. Click the 'LOGS' tab");
console.log("3. Select 'All severity levels'");
console.log("4. Look for startup errors and uncaught exceptions");
console.log("5. Check for port binding messages");
console.log("");

console.log("🔧 SERVER.JS VERIFICATION:");
console.log("==========================");
console.log("We need to check server.js for proper port binding:");
console.log("");
console.log("✅ CORRECT PATTERN:");
console.log("const PORT = process.env.PORT || 3100;"); // Fallback is fine for local
console.log("app.listen(PORT, () => {");
console.log("  console.log(`Server listening on port ${PORT}`);");
console.log("});");
console.log("");
console.log("❌ INCORRECT PATTERN:");
console.log("const PORT = 3100;"); // Hardcoded value
console.log("app.listen(3100, '0.0.0.0', () => {"); // Hardcoded port
console.log("  console.log('Server listening on port 3100');");
console.log("});");
console.log("");

console.log("🛠️ ENVIRONMENT VARIABLES CHECK:");
console.log("===============================");
console.log("Cloud Run automatically sets PORT to 8080 by default.");
console.log("Let's ensure our app correctly reads it:");
console.log("");
console.log("1. Ensure server.js uses process.env.PORT");
console.log("2. Check for any PORT overrides in Dockerfile or startup script");
console.log("3. Verify .env loading doesn't override PORT");
console.log("");

console.log("🎯 DIAGNOSTIC TEST COMMANDS:");
console.log("===========================");
console.log("Run these commands to debug:");
console.log("");
console.log("1. Test direct IP access (bypass DNS):");
console.log("   curl -v http://<cloud-run-ip>:8080/health");
console.log("");
console.log("2. Test alternative paths:");
console.log(
  "   curl -v https://prospectpro-184492422840.us-central1.run.app/health"
);
console.log(
  "   curl -v https://prospectpro-184492422840.us-central1.run.app/diag"
);
console.log(
  "   curl -v https://prospectpro-184492422840.us-central1.run.app/api"
);
console.log("");

console.log("🔍 CODE REVIEW FOCUS:");
console.log("====================");
console.log("1. server.js - Main entry point");
console.log("2. config/environment-loader.js - How env vars are loaded");
console.log("3. Dockerfile - Any CMD or ENTRYPOINT modifications");
console.log("");

console.log("🚀 ACTION PLAN:");
console.log("==============");
console.log("1. Check Cloud Run service logs IMMEDIATELY");
console.log("2. Verify server.js port binding");
console.log("3. Test alternative endpoints (/health, /diag)");
console.log("4. Consider container restart if needed");
