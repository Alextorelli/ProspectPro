#!/usr/bin/env node

/**
 * REAL API INTEGRATION TEST
 * Tests Hunter.io API integration with actual API calls to validate
 * our circuit breaker and rate limiting improvements
 */

const ComprehensiveHunterClient = require("./modules/api-clients/comprehensive-hunter-client");

async function testRealHunterAPI() {
  console.log("🔥 TESTING REAL HUNTER.IO API INTEGRATION");
  console.log("=".repeat(60));

  // Initialize with production settings
  const hunterClient = new ComprehensiveHunterClient(
    process.env.HUNTER_IO_API_KEY || "7bb2d1f9b5f8af7c1e8bf1736cf51f60eff49bbf",
    {
      maxDailyCost: 2.0, // Limit spending for testing
      maxPerLeadCost: 0.5,
      minEmailConfidence: 75,
      maxConcurrentRequests: 1,
      baseDelay: 1500, // Respectful rate limiting
    }
  );

  console.log(
    "✅ Comprehensive Hunter.io Client initialized for real API testing"
  );
  console.log("");

  // Test with real businesses that should have discoverable emails
  const testBusinesses = [
    {
      business_name: "Stripe",
      website: "https://stripe.com",
    },
    {
      business_name: "Zapier",
      website: "https://zapier.com",
    },
    {
      business_name: "Buffer",
      website: "https://buffer.com",
    },
  ];

  let totalTests = 0;
  let successfulTests = 0;
  let totalCost = 0;

  for (const business of testBusinesses) {
    console.log(`🏢 Testing: ${business.business_name}`);
    console.log(`   🌐 Domain: ${business.website}`);

    totalTests++;

    try {
      const result = await hunterClient.comprehensiveEmailDiscovery(business);

      if (result.success && result.emails && result.emails.length > 0) {
        successfulTests++;
        totalCost += result.cost;

        console.log(`   ✅ SUCCESS: Found ${result.emails.length} emails`);
        console.log(`   💰 Cost: $${result.cost.toFixed(3)}`);
        console.log(`   ⏱️ Time: ${Math.round(result.processing_time)}ms`);
        console.log(`   📧 API Calls: ${result.api_calls_made}`);

        // Show first few emails found
        result.emails.slice(0, 3).forEach((email, i) => {
          console.log(
            `      📮 ${i + 1}. ${email.value} (${
              email.confidence
            }% confidence)`
          );
        });
      } else {
        console.log(`   ⚠️ NO EMAILS FOUND`);
        if (result.error) {
          console.log(`      Error: ${result.error}`);
        }
      }
    } catch (error) {
      console.error(`   ❌ API ERROR: ${error.message}`);

      // Check for specific error types
      if (error.message.includes("429")) {
        console.log(
          "      🔄 Rate limit encountered - this is expected and handled"
        );
      } else if (error.message.includes("401")) {
        console.log("      🔑 API key issue - check authentication");
      }
    }

    console.log("");

    // Brief pause between tests
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  // Performance summary
  console.log("📊 REAL API TEST RESULTS:");
  console.log(`   • Total Tests: ${totalTests}`);
  console.log(`   • Successful: ${successfulTests}`);
  console.log(
    `   • Success Rate: ${((successfulTests / totalTests) * 100).toFixed(1)}%`
  );
  console.log(`   • Total Cost: $${totalCost.toFixed(3)}`);

  // Get client performance stats
  const stats = hunterClient.getPerformanceStats();
  console.log(`   • API Success Rate: ${stats.successRate}%`);
  console.log(`   • Avg Response Time: ${stats.averageResponseTime}ms`);
  console.log(`   • Rate Limited Requests: ${stats.rateLimitedRequests}`);
  console.log(`   • Circuit Breaker State: ${stats.circuitBreakerState}`);

  console.log("");

  if (successfulTests > 0) {
    console.log("🎉 REAL API INTEGRATION: SUCCESS");
    console.log(
      "✅ Hunter.io API is working correctly with our enhanced client"
    );
  } else {
    console.log("⚠️ REAL API INTEGRATION: NEEDS INVESTIGATION");
    console.log("🔍 Check API key, rate limits, and error handling");
  }
}

// Run the test
testRealHunterAPI().catch(console.error);
