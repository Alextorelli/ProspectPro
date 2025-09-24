#!/usr/bin/env node
/**
 * Advanced Cloud Run Troubleshooting
 * Deep dive into potential issues preventing successful startup
 */

console.log('🔧 ADVANCED CLOUD RUN TROUBLESHOOTING');
console.log('=====================================');
console.log('');

console.log('📋 DEPLOYMENT TROUBLESHOOTING CHECKLIST');
console.log('=======================================');

console.log('');
console.log('1️⃣ CONTAINER STARTUP ANALYSIS');
console.log('------------------------------');
console.log('❓ Is the container starting at all?');
console.log('❓ Is Node.js process crashing immediately?');
console.log('❓ Are environment variables being set correctly?');
console.log('❓ Is the application binding to the correct port?');
console.log('');
console.log('✅ FIXED: Added ALLOW_DEGRADED_START=true to prevent exits');
console.log('✅ FIXED: Enhanced logging for startup diagnostics');
console.log('✅ FIXED: Improved error handling in server.js');
console.log('');

console.log('2️⃣ DOCKERFILE ANALYSIS');
console.log('----------------------');
console.log('Current Dockerfile configuration:');
console.log('- Base image: node:20-alpine ✅');
console.log('- Working directory: /app ✅');
console.log('- Environment: NODE_ENV=production ✅');
console.log('- Environment: ALLOW_DEGRADED_START=true ✅');
console.log('- Host binding: 0.0.0.0 ✅');
console.log('- User: node (non-root) ✅');
console.log('- Command: node server.js ✅');
console.log('');

console.log('3️⃣ PORT BINDING INVESTIGATION');
console.log('-----------------------------');
console.log('Cloud Run provides PORT environment variable (usually 8080)');
console.log('Our server.js uses: process.env.PORT || 3100');
console.log('This should work correctly! ✅');
console.log('');

console.log('4️⃣ POTENTIAL ROOT CAUSES');
console.log('-------------------------');
console.log('');
console.log('🔍 MOST LIKELY CAUSES:');
console.log('');
console.log('A) Missing Dependencies in Container');
console.log('   - Check if all npm packages are installed');
console.log('   - Verify node_modules is properly built');
console.log('   - Ensure no native dependencies are missing');
console.log('');

console.log('B) File System Issues');
console.log('   - Public directory not copied to container');
console.log('   - Static files missing from Docker image');
console.log('   - File permissions preventing access');
console.log('');

console.log('C) Startup Script Execution Issues');
console.log('   - Node.js version compatibility');
console.log('   - ES module vs CommonJS issues');
console.log('   - Circular dependency problems');
console.log('');

console.log('D) Cloud Run Configuration');
console.log('   - Service account permissions');
console.log('   - Memory/CPU limits too restrictive');
console.log('   - Timeout issues during startup');
console.log('');

console.log('5️⃣ DEBUGGING COMMANDS FOR CLOUD CONSOLE');
console.log('=========================================');
console.log('');
console.log('Open Google Cloud Console and run:');
console.log('');
console.log('gcloud run services describe prospectpro \\');
console.log('  --region=us-central1 \\');
console.log('  --format="get(status)"');
console.log('');
console.log('gcloud logging read \\');
console.log('  "resource.type=cloud_run_revision AND resource.labels.service_name=prospectpro" \\');
console.log('  --limit=50 \\');
console.log('  --format=json');
console.log('');

console.log('6️⃣ IMMEDIATE ACTION PLAN');
console.log('=========================');
console.log('');
console.log('STEP 1: Check Cloud Run Logs');
console.log('  → Look for container startup errors');
console.log('  → Check for Node.js process crashes');
console.log('  → Verify port binding messages');
console.log('');
console.log('STEP 2: Verify Build Completion');
console.log('  → Check Cloud Build history');
console.log('  → Ensure Docker image was pushed successfully');
console.log('  → Verify no build errors occurred');
console.log('');
console.log('STEP 3: Test Local Container');
console.log('  → docker build -t test-prospectpro .');
console.log('  → docker run -p 8080:8080 -e PORT=8080 test-prospectpro');
console.log('  → curl http://localhost:8080/health');
console.log('');
console.log('STEP 4: Simplify Deployment');
console.log('  → Create minimal test endpoint');
console.log('  → Remove all external dependencies temporarily');
console.log('  → Deploy bare minimum working container');
console.log('');

console.log('7️⃣ EMERGENCY FIXES TO TRY');
console.log('===========================');
console.log('');
console.log('A) Create Ultra-Simple Test Service:');
console.log('   const express = require("express");');
console.log('   const app = express();');
console.log('   app.get("/", (req, res) => res.send("WORKING!"));');
console.log('   app.listen(process.env.PORT || 8080);');
console.log('');
console.log('B) Add Verbose Startup Logging:');
console.log('   console.log("🚀 Container starting...");');
console.log('   console.log("📦 Node version:", process.version);');
console.log('   console.log("🌍 Environment:", process.env.NODE_ENV);');
console.log('   console.log("🔌 Port:", process.env.PORT);');
console.log('');
console.log('C) Test Port Binding Explicitly:');
console.log('   const PORT = process.env.PORT || 8080;');
console.log('   app.listen(PORT, "0.0.0.0", () => {');
console.log('     console.log(`✅ Server running on port ${PORT}`);');
console.log('   });');
console.log('');

console.log('🎯 NEXT STEPS PRIORITY');
console.log('======================');
console.log('1. Check Cloud Run service logs IMMEDIATELY');
console.log('2. Verify Cloud Build completed successfully'); 
console.log('3. Test container locally if possible');
console.log('4. Deploy simplified version if needed');
console.log('5. Gradually add complexity back');
console.log('');
console.log('💡 The 404 response suggests the container is not starting');
console.log('   at all, rather than a routing or configuration issue.');
console.log('   Focus on basic container startup first!');
