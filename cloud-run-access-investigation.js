#!/usr/bin/env node
// Cloud Run Service Access Investigation

console.log("🔍 CLOUD RUN SERVICE ACCESS INVESTIGATION");
console.log("=========================================");
console.log("");

console.log("📊 CURRENT SITUATION:");
console.log("======================");
console.log("✅ Cloud Build: Successful deployment");
console.log("✅ Trigger: Working correctly");
console.log("❌ Service Access: 'Page not found' error");
console.log("🌐 URL: prospectpro-184492422840.us-central1.run.app");
console.log("");

console.log("🔍 POTENTIAL ROOT CAUSES:");
console.log("==========================");
console.log("");

console.log("1️⃣ APPLICATION STARTUP ISSUES:");
console.log("   • Container may be failing to start properly");
console.log("   • Application may be crashing after container start");
console.log("   • Port binding issues (app vs Cloud Run expectations)");
console.log("   • Environment variable configuration problems");
console.log("");

console.log("2️⃣ CLOUD RUN CONFIGURATION:");
console.log("   • Port mapping issues (container vs service)");
console.log("   • CPU allocation insufficient");
console.log("   • Memory limits causing crashes");
console.log("   • Timeout settings too aggressive");
console.log("");

console.log("3️⃣ APPLICATION CONFIGURATION:");
console.log("   • ALLOW_DEGRADED_START may be causing issues");
console.log("   • Missing required environment variables");
console.log("   • Database connection failures");
console.log("   • API key loading from Supabase Vault failures");
console.log("");

console.log("🚨 IMMEDIATE INVESTIGATION STEPS:");
console.log("==================================");
console.log("");

console.log("STEP 1: Check Cloud Run Service Logs");
console.log("   • Go to Cloud Run console");
console.log("   • Select 'prospectpro' service");
console.log("   • View 'Logs' tab");
console.log("   • Look for container startup errors");
console.log("");

console.log("STEP 2: Verify Service Configuration");
console.log("   • Check port configuration (should be 3100)");
console.log("   • Verify CPU and memory allocation");
console.log("   • Check environment variables");
console.log("   • Validate service URL routing");
console.log("");

console.log("STEP 3: Test Health Endpoints");
console.log("   • Try: /health endpoint");
console.log("   • Try: /diag endpoint");
console.log("   • Check if any endpoint responds");
console.log("");

console.log("🔧 LIKELY FIXES:");
console.log("=================");
console.log("");

console.log("MOST PROBABLE: Application Startup Issue");
console.log("   • Check if ALLOW_DEGRADED_START=true is causing problems");
console.log("   • Verify Supabase connection in production");
console.log("   • Check if vault loading is blocking startup");
console.log("");

console.log("CONFIGURATION FIX: Port Binding");
console.log("   • Ensure app listens on PORT environment variable");
console.log("   • Verify Cloud Run passes correct PORT value");
console.log("   • Check if HOST=0.0.0.0 is properly set");
console.log("");

console.log("DEBUGGING COMMANDS:");
console.log("   # Check Cloud Run service status");
console.log("   gcloud run services describe prospectpro --region=us-central1");
console.log("");
console.log("   # View recent logs");
console.log("   gcloud logging read 'resource.type=cloud_run_revision'");
console.log("");

console.log("🎯 NEXT ACTION:");
console.log("================");
console.log("1. Check Cloud Run logs immediately");
console.log("2. Look for container startup errors");
console.log("3. Verify environment variable configuration");
console.log("4. Test application health endpoints");
console.log("");

console.log("⚠️ This is likely a container startup or configuration issue!");
console.log("The build succeeds but the app doesn't start properly.");
