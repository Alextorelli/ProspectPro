/**
 * Phase 2-3 Integration Test
 * Tests batching, caching, and modular registry validation
 */

const EnhancedLeadDiscovery = require("./modules/enhanced-lead-discovery");
const { globalCache } = require("./modules/utils/cache");
const { batchProcessor } = require("./modules/utils/batch-processor");

async function testPhase2And3Integration() {
  console.log(
    "\n🧪 Testing Phase 2-3 Integration: Batching, Caching & Modular Registry Validation\n"
  );

  const startTime = Date.now();

  try {
    // Initialize enhanced lead discovery with minimal API keys
    const leadDiscovery = new EnhancedLeadDiscovery({
      // Note: These would be real API keys in production
      googlePlaces: process.env.GOOGLE_PLACES_API_KEY || null,
      hunterIO: process.env.HUNTER_IO_API_KEY || null,
      neverBounce: process.env.NEVERBOUNCE_API_KEY || null,
    });

    console.log(
      "✅ Enhanced Lead Discovery initialized with modular registry engine"
    );

    // Test data for Phase 2-3 validation
    const testBusinesses = [
      {
        name: "Tech Startup Inc",
        website: "https://google.com",
        address: "123 Main St, San Francisco, CA",
        state: "CA",
        emailDiscovery: {
          emails: ["info@example.com", "contact@example.com"],
        },
      },
      {
        name: "NY Wellness Center LLC",
        website: "https://microsoft.com",
        address: "456 Broadway, New York, NY",
        state: "NY",
        emailDiscovery: {
          emails: ["hello@wellness.com"],
        },
      },
      {
        name: "Community Foundation",
        website: "https://github.com",
        address: "789 Oak Ave, Austin, TX",
        state: "TX",
        category: "nonprofit organization",
      },
    ];

    console.log("\n🔍 Phase 2 Testing: Batching & Caching Systems");
    console.log("=".repeat(50));

    // Test batch email verification
    console.log("\n📧 Testing Batch Email Verification:");
    const testEmails = [
      "test@example.com",
      "info@google.com",
      "contact@microsoft.com",
    ];

    try {
      // Mock NeverBounce client for testing
      const mockNeverBounceClient = {
        verifyEmailBatch: async (emails) => {
          console.log(
            `   📬 Mock verifying ${emails.length} emails: ${emails.join(", ")}`
          );
          return emails.map((email) => ({
            email,
            isDeliverable: true,
            confidence: 85,
            cost: 0.008,
          }));
        },
      };

      const emailResults = await batchProcessor.batchEmailVerification(
        testEmails,
        mockNeverBounceClient
      );
      console.log(
        `   ✅ Batch email verification completed: ${emailResults.length} results`
      );
      console.log(
        `   📊 Results: ${emailResults
          .map((r) => `${r.email}(${r.confidence}%)`)
          .join(", ")}`
      );
    } catch (error) {
      console.log(`   ⚠️ Email batch test failed: ${error.message}`);
    }

    // Test batch website scraping
    console.log("\n🌐 Testing Batch Website Scraping:");
    const testWebsites = [
      "https://google.com",
      "https://microsoft.com",
      "https://github.com",
    ];

    try {
      const websiteResults = await batchProcessor.batchWebsiteScraping(
        testWebsites
      );
      console.log(
        `   ✅ Batch website scraping completed: ${websiteResults.length} results`
      );
      websiteResults.forEach((result, i) => {
        console.log(
          `   🌐 ${testWebsites[i]}: ${
            result.isAccessible ? "✅ Accessible" : "❌ Failed"
          } (${result.responseTime || "unknown"}ms)`
        );
      });
    } catch (error) {
      console.log(`   ⚠️ Website batch test failed: ${error.message}`);
    }

    // Test global cache functionality
    console.log("\n💾 Testing Global Cache System:");
    globalCache.set(
      "test_key",
      { data: "test_value", timestamp: Date.now() },
      5000
    );
    const cachedValue = globalCache.get("test_key");
    console.log(`   ✅ Cache test: ${cachedValue ? "SUCCESS" : "FAILED"}`);

    const cacheStats = globalCache.getStats();
    console.log(`   📊 Cache statistics: ${JSON.stringify(cacheStats)}`);

    console.log("\n🏛️ Phase 3 Testing: Modular Registry Validation");
    console.log("=".repeat(50));

    // Test registry validation engine
    for (const business of testBusinesses) {
      console.log(`\n🔍 Testing registry validation for: ${business.name}`);

      try {
        const registryResult = await leadDiscovery.validateBusinessRegistration(
          business
        );

        console.log(`   🏛️ Registry validation completed:`);
        console.log(
          `   📋 Providers used: ${
            registryResult.providersUsed?.join(", ") || "none"
          }`
        );
        console.log(`   🎯 Confidence: ${registryResult.confidence}%`);
        console.log(
          `   📊 Registered: ${
            registryResult.registeredInAnyState ? "YES" : "NO"
          }`
        );
        console.log(
          `   🏢 Nonprofit: ${registryResult.isNonprofit ? "YES" : "NO"}`
        );
        console.log(
          `   💼 Public company: ${
            registryResult.isPublicCompany ? "YES" : "NO"
          }`
        );

        if (registryResult.errors && registryResult.errors.length > 0) {
          console.log(`   ⚠️ Errors: ${registryResult.errors.length}`);
        }
      } catch (error) {
        console.log(`   ❌ Registry validation failed: ${error.message}`);
      }
    }

    // Test integrated lead processing pipeline
    console.log("\n🔄 Testing Integrated Processing Pipeline:");
    console.log("=".repeat(50));

    try {
      // Process one business through the full Stage 3 validation pipeline
      const testBusiness = testBusinesses[0];
      console.log(`\n⚡ Running Stage 3 validation for: ${testBusiness.name}`);

      const stage3Result = await leadDiscovery.stage3_Validation(testBusiness);

      console.log("   ✅ Stage 3 validation completed");
      console.log(
        `   🌐 Website validation: ${
          stage3Result.websiteValidation?.isAccessible ? "PASS" : "FAIL"
        }`
      );
      console.log(
        `   📧 Email validation: ${
          stage3Result.emailValidation?.deliverableCount || 0
        } deliverable emails`
      );
      console.log(
        `   💰 Processing cost: $${(stage3Result.processingCost || 0).toFixed(
          4
        )}`
      );
    } catch (error) {
      console.log(`   ❌ Integrated pipeline test failed: ${error.message}`);
    }

    // Display comprehensive statistics
    console.log("\n📊 System Statistics:");
    console.log("=".repeat(50));

    try {
      const systemStats = leadDiscovery.getSystemStats();

      if (systemStats.registryEngine) {
        console.log("\n🏛️ Registry Engine:");
        console.log(
          `   Validations run: ${
            systemStats.registryEngine.validationsRun || 0
          }`
        );
        console.log(
          `   Cache hit rate: ${
            systemStats.registryEngine.cacheHitRate || "0%"
          }`
        );
        console.log(`   Errors: ${systemStats.registryEngine.errors || 0}`);
      }

      if (systemStats.batchProcessor) {
        console.log("\n⚡ Batch Processor:");
        console.log(
          `   Email batches: ${systemStats.batchProcessor.emailBatches || 0}`
        );
        console.log(
          `   Website batches: ${
            systemStats.batchProcessor.websiteBatches || 0
          }`
        );
      }

      if (systemStats.globalCache) {
        console.log("\n💾 Global Cache:");
        console.log(`   Hits: ${systemStats.globalCache.hits || 0}`);
        console.log(`   Misses: ${systemStats.globalCache.misses || 0}`);
        console.log(`   Size: ${systemStats.globalCache.size || 0} entries`);
      }
    } catch (error) {
      console.log(`   ⚠️ Statistics collection failed: ${error.message}`);
    }

    const duration = Date.now() - startTime;
    console.log(`\n🎉 Phase 2-3 Integration Test completed in ${duration}ms`);
    console.log("\n✅ Key improvements implemented:");
    console.log("   • Pattern emails are now quality-neutral (Phase 2)");
    console.log("   • Batch processing for email verification (Phase 2)");
    console.log("   • Batch processing for website validation (Phase 2)");
    console.log("   • Global TTL cache with cleanup (Phase 2)");
    console.log("   • Modular registry validation engine (Phase 3)");
    console.log("   • Geographic provider routing (Phase 3)");
    console.log("   • Confidence scoring and error handling (Phase 3)");
  } catch (error) {
    console.error("❌ Integration test failed:", error.message);
    console.error("Stack trace:", error.stack);
  }
}

// Run the test
if (require.main === module) {
  testPhase2And3Integration().catch(console.error);
}

module.exports = { testPhase2And3Integration };
