#!/usr/bin/env node

/**
 * Cloud Run Service Diagnostic
 * Checks the current deployment status and troubleshoots issues
 */

console.log("🔍 ProspectPro Cloud Run Service Diagnostic");
console.log("=" * 50);

async function checkService() {
  const serviceUrls = [
    "https://prospectpro-184492422840.us-central1.run.app",
    "https://prospectpro-uswbuyt7ha-uc.a.run.app",
  ];

  console.log("\n🌐 Testing Service Endpoints:");

  for (const url of serviceUrls) {
    console.log(`\n📍 Testing: ${url}`);

    try {
      // Test different endpoints
      const endpoints = [
        "/health",
        "/diag",
        "/",
        "/api/business/discover-businesses",
      ];

      for (const endpoint of endpoints) {
        try {
          const response = await fetch(url + endpoint, {
            method:
              endpoint === "/api/business/discover-businesses" ? "POST" : "GET",
            headers: { "Content-Type": "application/json" },
            body:
              endpoint === "/api/business/discover-businesses"
                ? JSON.stringify({ businessType: "test", location: "test" })
                : undefined,
            timeout: 10000,
          });

          console.log(
            `   ${endpoint}: ${response.status} ${response.statusText}`
          );

          if (response.status === 200) {
            const text = await response.text();
            console.log(`   ✅ SUCCESS: ${text.substring(0, 100)}...`);
            return; // Found working endpoint
          }
        } catch (error) {
          console.log(`   ${endpoint}: ❌ ${error.message}`);
        }
      }
    } catch (error) {
      console.log(`   ❌ Service unreachable: ${error.message}`);
    }
  }

  console.log("\n🔧 Diagnostic Summary:");
  console.log(
    "   📊 Service Status: Container running but app not responding correctly"
  );
  console.log("   🚨 Likely Issues:");
  console.log("      - Application startup failure");
  console.log("      - Port binding issues");
  console.log("      - Environment variable problems");
  console.log("      - Authentication/authorization blocking");
  console.log("\n💡 Next Steps:");
  console.log("   1. Check Cloud Run logs for startup errors");
  console.log("   2. Verify environment variables are properly set");
  console.log("   3. Test local startup with production-like environment");
  console.log("   4. Check if service requires authentication");
}

// Only run if fetch is available (Node 18+)
if (typeof fetch !== "undefined") {
  checkService().catch(console.error);
} else {
  console.log(
    "⚠️ Node.js version does not support fetch. Use Node 18+ for full diagnostic."
  );
  console.log("\n🔧 Manual Tests:");
  console.log(
    "   curl https://prospectpro-184492422840.us-central1.run.app/health"
  );
  console.log(
    "   curl https://prospectpro-184492422840.us-central1.run.app/diag"
  );
  console.log("   curl https://prospectpro-184492422840.us-central1.run.app/");
}

console.log("\n📋 Latest Deployment Info from Logs:");
console.log("   🏷️  Revision: prospectpro-00089-g67");
console.log(
  "   📦 Image: us-central1-docker.pkg.dev/leadgen-471822/prospectpro/app:ebd102a"
);
console.log("   ⏰ Deployed: 2025-09-30T05:14:13Z");
console.log("   🌐 URLs: https://prospectpro-184492422840.us-central1.run.app");
console.log('   📊 Status: All conditions "True" (should be working)');
