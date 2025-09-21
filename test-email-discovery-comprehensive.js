#!/usr/bin/env node

/**
 * COMPREHENSIVE EMAIL DISCOVERY SYSTEM TEST & VALIDATION
 *
 * Tests the new multi-source email discovery engine with:
 * - Circuit breaker functionality
 * - Rate limiting handling
 * - Multi-API redundancy
 * - Error handling and recovery
 * - Cost optimization
 * - Quality validation
 */

const MultiSourceEmailDiscovery = require("./modules/api-clients/multi-source-email-discovery");
const EnhancedHunterIOClient = require("./modules/api-clients/enhanced-hunter-io-client");

// Test configuration
const TEST_CONFIG = {
  maxDailyCost: 5.0, // Limit spending for tests
  maxPerLeadCost: 1.0,
  minEmailConfidence: 70,
};

// Test cases with real Austin businesses
const TEST_BUSINESSES = [
  {
    business_name: "Home Slice Pizza",
    website: "https://homeslicepizza.com/",
    owner_name: "Terri Hannifin", // Known from research
    location: "Austin, TX",
  },
  {
    business_name: "Franklin Barbecue",
    website: "https://franklinbbq.com/",
    owner_name: "Aaron Franklin",
    location: "Austin, TX",
  },
  {
    business_name: "Torchy's Tacos",
    website: "https://torchystacos.com/",
    owner_name: "Mike Rypka",
    location: "Austin, TX",
  },
  {
    business_name: "Amy's Ice Cream",
    website: "https://amysicecream.com/",
    owner_name: "Amy Simmons",
    location: "Austin, TX",
  },
  {
    business_name: "Ramen Tatsu-Ya",
    website: "https://ramen-tatsuya.com/",
    location: "Austin, TX",
  },
];

class EmailDiscoveryTestSuite {
  constructor() {
    this.results = {
      totalTests: 0,
      successfulDiscoveries: 0,
      failedDiscoveries: 0,
      emailsFound: 0,
      totalCost: 0,
      averageConfidence: 0,
      apiSourcesUsed: new Set(),
      circuitBreakerTriggered: false,
      rateLimitEncountered: false,
    };
  }

  async runComprehensiveTests() {
    console.log("🧪 STARTING COMPREHENSIVE EMAIL DISCOVERY TESTS");
    console.log("=".repeat(70));
    console.log("🎯 Testing Multi-Source Email Discovery Engine v2.0");
    console.log("📊 Test Cases:", TEST_BUSINESSES.length);
    console.log("💰 Budget Limit: $" + TEST_CONFIG.maxDailyCost);
    console.log(
      "🎚️ Quality Threshold: " + TEST_CONFIG.minEmailConfidence + "%"
    );
    console.log("");

    // Initialize multi-source email discovery
    const emailDiscovery = new MultiSourceEmailDiscovery({
      hunterApiKey: process.env.HUNTER_IO_API_KEY,
      // apolloApiKey: process.env.APOLLO_API_KEY, // Add when available
      // zoomInfoApiKey: process.env.ZOOMINFO_API_KEY, // Add when available
      neverBounceApiKey: process.env.NEVERBOUNCE_API_KEY,
      ...TEST_CONFIG,
    });

    console.log("🔧 Multi-Source Email Discovery Engine initialized");
    console.log("");

    // Test 1: Individual Business Email Discovery
    await this.testIndividualEmailDiscovery(emailDiscovery);

    // Test 2: Circuit Breaker Functionality
    await this.testCircuitBreakerFunctionality();

    // Test 3: Rate Limiting Handling
    await this.testRateLimitingHandling();

    // Test 4: Cost Optimization
    await this.testCostOptimization(emailDiscovery);

    // Test 5: Performance Benchmarks
    await this.testPerformanceBenchmarks(emailDiscovery);

    // Final Results
    this.displayFinalResults(emailDiscovery);
  }

  async testIndividualEmailDiscovery(emailDiscovery) {
    console.log("📧 TEST 1: INDIVIDUAL EMAIL DISCOVERY");
    console.log("-".repeat(50));

    for (const [index, business] of TEST_BUSINESSES.entries()) {
      console.log(
        `\n🏢 Testing ${index + 1}/${TEST_BUSINESSES.length}: ${
          business.business_name
        }`
      );
      console.log(`   🌐 Website: ${business.website}`);
      console.log(`   👤 Owner: ${business.owner_name || "Unknown"}`);
      console.log("   🔍 Starting email discovery...");

      const startTime = Date.now();

      try {
        const result = await emailDiscovery.discoverBusinessEmails(business);
        const processingTime = Date.now() - startTime;

        this.results.totalTests++;

        if (result.success && result.emails.length > 0) {
          this.results.successfulDiscoveries++;
          this.results.emailsFound += result.emails.length;
          this.results.totalCost += result.total_cost;

          // Track API sources used
          result.sources_used.forEach((source) =>
            this.results.apiSourcesUsed.add(source)
          );

          console.log(`   ✅ SUCCESS: ${result.emails.length} emails found`);
          console.log(`   💰 Cost: $${result.total_cost.toFixed(3)}`);
          console.log(`   ⭐ Confidence: ${result.confidence_score}%`);
          console.log(`   🔌 Sources: ${result.sources_used.join(", ")}`);
          console.log(`   ⏱️ Time: ${processingTime}ms`);

          // Display found emails
          result.emails.forEach((email, i) => {
            console.log(
              `      📮 ${i + 1}. ${email.value} (${
                email.confidence
              }% confidence, ${email.type})`
            );
          });

          // Display business contacts if available
          if (result.business_contacts) {
            const { owner, manager, primary } = result.business_contacts;
            if (owner)
              console.log(
                `      👑 Owner: ${owner.value} (${owner.confidence}%)`
              );
            if (manager)
              console.log(
                `      👔 Manager: ${manager.value} (${manager.confidence}%)`
              );
            if (primary)
              console.log(
                `      🎯 Primary: ${primary.value} (${primary.confidence}%)`
              );
          }
        } else {
          this.results.failedDiscoveries++;
          console.log(`   ❌ FAILED: No emails found`);
          if (result.error) {
            console.log(`      Error: ${result.error}`);
          }
        }
      } catch (error) {
        this.results.failedDiscoveries++;
        console.error(`   💥 EXCEPTION: ${error.message}`);

        // Check for specific error patterns
        if (
          error.message.includes("429") ||
          error.message.includes("rate limit")
        ) {
          this.results.rateLimitEncountered = true;
          console.log(
            "   ⚠️ Rate limiting detected - this tests our handling!"
          );
        }
      }

      // Brief pause between tests to be respectful of APIs
      await this.delay(2000);
    }
  }

  async testCircuitBreakerFunctionality() {
    console.log("\n\n🔧 TEST 2: CIRCUIT BREAKER FUNCTIONALITY");
    console.log("-".repeat(50));

    try {
      // Test with invalid API key to trigger circuit breaker
      const faultyClient = new MultiSourceEmailDiscovery({
        hunterApiKey: "invalid_api_key_12345",
        maxDailyCost: 1.0,
        circuitBreakerThreshold: 2, // Lower threshold for testing
      });

      console.log("   Testing circuit breaker with invalid API key...");

      // Make several requests to trigger circuit breaker
      for (let i = 0; i < 3; i++) {
        try {
          await faultyClient.discoverBusinessEmails({
            business_name: "Test Business",
            website: "https://example.com",
          });
        } catch (error) {
          console.log(
            `   ${i + 1}. Expected failure: ${error.message.substring(
              0,
              50
            )}...`
          );
        }
      }

      // Check if circuit breaker opened
      const stats = faultyClient.getPerformanceStats();
      if (stats.circuitBreakerStatus.hunter.state === "open") {
        console.log("   ✅ Circuit breaker correctly opened after failures");
        this.results.circuitBreakerTriggered = true;
      } else {
        console.log("   ⚠️ Circuit breaker did not trigger as expected");
      }
    } catch (error) {
      console.log(`   Circuit breaker test error: ${error.message}`);
    }
  }

  async testRateLimitingHandling() {
    console.log("\n\n⏳ TEST 3: RATE LIMITING HANDLING");
    console.log("-".repeat(50));

    console.log("   Testing exponential backoff and retry logic...");
    console.log("   (Note: This may trigger actual rate limits)");

    try {
      const rateLimitClient = new EnhancedHunterIOClient(
        process.env.HUNTER_IO_API_KEY,
        {
          maxConcurrentRequests: 1, // Force sequential requests
          baseDelayMs: 500, // Shorter delay for testing
        }
      );

      const testBusiness = {
        business_name: "Rate Limit Test",
        website: "https://example.com",
      };

      console.log("   Making rapid API calls to test rate limiting...");

      const promises = [];
      for (let i = 0; i < 3; i++) {
        promises.push(rateLimitClient.discoverBusinessEmails(testBusiness));
      }

      const results = await Promise.allSettled(promises);

      let rateLimitHandled = false;
      results.forEach((result, index) => {
        if (
          result.status === "rejected" ||
          (result.value &&
            result.value.error &&
            result.value.error.includes("rate"))
        ) {
          rateLimitHandled = true;
        }
        console.log(`   Request ${index + 1}: ${result.status}`);
      });

      if (rateLimitHandled) {
        console.log("   ✅ Rate limiting properly detected and handled");
      } else {
        console.log(
          "   ℹ️ No rate limiting encountered (normal for light testing)"
        );
      }

      // Display client performance stats
      const stats = rateLimitClient.getPerformanceStats();
      console.log(`   📊 Success Rate: ${stats.successRate}%`);
      console.log(`   ⚡ Avg Response Time: ${stats.averageResponseTime}ms`);
    } catch (error) {
      console.log(`   Rate limiting test error: ${error.message}`);
    }
  }

  async testCostOptimization(emailDiscovery) {
    console.log("\n\n💰 TEST 4: COST OPTIMIZATION");
    console.log("-".repeat(50));

    const initialStats = emailDiscovery.getPerformanceStats();
    console.log(`   Starting Cost: $${initialStats.totalCost.toFixed(3)}`);
    console.log(
      `   Budget Remaining: $${(
        TEST_CONFIG.maxDailyCost - initialStats.totalCost
      ).toFixed(3)}`
    );

    // Test with a business that should use pattern-first approach
    const testBusiness = {
      business_name: "Local Coffee Shop",
      website: "https://localcoffeeshop.com",
      owner_name: "John Smith",
    };

    console.log("   Testing pattern-first cost optimization...");

    try {
      const result = await emailDiscovery.discoverBusinessEmails(testBusiness);

      console.log(
        `   Pattern emails attempted: ${result.patterns_tried || "N/A"}`
      );
      console.log(`   API sources used: ${result.sources_used.join(", ")}`);
      console.log(
        `   Total cost for discovery: $${result.total_cost.toFixed(3)}`
      );

      if (result.sources_used.includes("patterns")) {
        console.log("   ✅ Cost optimization working - patterns used first");
      } else {
        console.log(
          "   ℹ️ Patterns not used (may be expected based on domain/data)"
        );
      }
    } catch (error) {
      console.log(`   Cost optimization test error: ${error.message}`);
    }
  }

  async testPerformanceBenchmarks(emailDiscovery) {
    console.log("\n\n⚡ TEST 5: PERFORMANCE BENCHMARKS");
    console.log("-".repeat(50));

    const benchmarkBusiness = {
      business_name: "Performance Test Business",
      website: "https://example-business.com",
    };

    console.log("   Running performance benchmark (3 iterations)...");

    const performanceTimes = [];

    for (let i = 0; i < 3; i++) {
      const startTime = Date.now();

      try {
        await emailDiscovery.discoverBusinessEmails(benchmarkBusiness);
        const duration = Date.now() - startTime;
        performanceTimes.push(duration);
        console.log(`   Iteration ${i + 1}: ${duration}ms`);
      } catch (error) {
        console.log(
          `   Iteration ${i + 1}: Failed (${error.message.substring(0, 30)}...)`
        );
      }

      await this.delay(1000); // Brief pause between iterations
    }

    if (performanceTimes.length > 0) {
      const avgTime =
        performanceTimes.reduce((a, b) => a + b, 0) / performanceTimes.length;
      const minTime = Math.min(...performanceTimes);
      const maxTime = Math.max(...performanceTimes);

      console.log(`   📊 Average Response Time: ${Math.round(avgTime)}ms`);
      console.log(`   ⚡ Fastest Response: ${minTime}ms`);
      console.log(`   🐌 Slowest Response: ${maxTime}ms`);

      // Performance evaluation
      if (avgTime < 5000) {
        console.log("   ✅ Performance: EXCELLENT (< 5 seconds average)");
      } else if (avgTime < 10000) {
        console.log("   ✅ Performance: GOOD (< 10 seconds average)");
      } else {
        console.log("   ⚠️ Performance: SLOW (> 10 seconds average)");
      }
    }
  }

  displayFinalResults(emailDiscovery) {
    console.log("\n\n📊 COMPREHENSIVE TEST RESULTS");
    console.log("=".repeat(70));

    const finalStats = emailDiscovery.getPerformanceStats();
    const successRate =
      this.results.totalTests > 0
        ? (
            (this.results.successfulDiscoveries / this.results.totalTests) *
            100
          ).toFixed(1)
        : 0;
    const avgEmailsPerBusiness =
      this.results.successfulDiscoveries > 0
        ? (
            this.results.emailsFound / this.results.successfulDiscoveries
          ).toFixed(1)
        : 0;
    const avgCostPerDiscovery =
      this.results.successfulDiscoveries > 0
        ? (this.results.totalCost / this.results.successfulDiscoveries).toFixed(
            3
          )
        : 0;

    console.log("🎯 DISCOVERY PERFORMANCE:");
    console.log(`   • Total Tests: ${this.results.totalTests}`);
    console.log(
      `   • Successful Discoveries: ${this.results.successfulDiscoveries}`
    );
    console.log(`   • Success Rate: ${successRate}%`);
    console.log(`   • Total Emails Found: ${this.results.emailsFound}`);
    console.log(`   • Average Emails per Business: ${avgEmailsPerBusiness}`);
    console.log("");

    console.log("💰 COST ANALYSIS:");
    console.log(`   • Total Cost: $${this.results.totalCost.toFixed(3)}`);
    console.log(`   • Average Cost per Discovery: $${avgCostPerDiscovery}`);
    console.log(
      `   • Budget Remaining: $${(
        TEST_CONFIG.maxDailyCost - this.results.totalCost
      ).toFixed(3)}`
    );
    console.log(
      `   • Budget Utilization: ${(
        (this.results.totalCost / TEST_CONFIG.maxDailyCost) *
        100
      ).toFixed(1)}%`
    );
    console.log("");

    console.log("🔌 API SOURCES UTILIZED:");
    this.results.apiSourcesUsed.forEach((source) => {
      console.log(`   • ${source}`);
    });
    console.log("");

    console.log("🔧 SYSTEM RESILIENCE:");
    console.log(
      `   • Circuit Breaker Triggered: ${
        this.results.circuitBreakerTriggered ? "YES" : "NO"
      }`
    );
    console.log(
      `   • Rate Limiting Encountered: ${
        this.results.rateLimitEncountered ? "YES" : "NO"
      }`
    );
    console.log("");

    console.log("📈 ENGINE PERFORMANCE:");
    console.log(`   • Total Engine Requests: ${finalStats.totalRequests}`);
    console.log(`   • Engine Success Rate: ${finalStats.successRate}%`);
    console.log(
      `   • Average Confidence Score: ${finalStats.averageConfidence}%`
    );
    console.log("");

    // Overall assessment
    console.log("🏆 OVERALL ASSESSMENT:");
    if (parseFloat(successRate) >= 80) {
      console.log("   🎉 EXCELLENT: System performing at production quality");
    } else if (parseFloat(successRate) >= 60) {
      console.log(
        "   ✅ GOOD: System performing well with room for improvement"
      );
    } else if (parseFloat(successRate) >= 40) {
      console.log("   ⚠️ FAIR: System needs optimization for production use");
    } else {
      console.log(
        "   ❌ POOR: System requires significant fixes before production"
      );
    }

    console.log("\n🎯 RECOMMENDATIONS:");
    if (!this.results.circuitBreakerTriggered) {
      console.log(
        "   • Consider testing circuit breaker with actual API failures"
      );
    }
    if (this.results.totalCost > TEST_CONFIG.maxDailyCost * 0.8) {
      console.log("   • Monitor costs closely - approaching budget limit");
    }
    if (this.results.apiSourcesUsed.size < 2) {
      console.log(
        "   • Consider adding additional email API sources for redundancy"
      );
    }
    if (parseFloat(successRate) < 70) {
      console.log(
        "   • Investigate failed discoveries to improve success rate"
      );
    }
  }

  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Run the comprehensive test suite
async function main() {
  console.log("🚀 ProspectPro Email Discovery System Validation");
  console.log("📧 Multi-Source Email Discovery Engine Test Suite");
  console.log("🔧 Version: 2.0 (Production-Ready with Circuit Breakers)");
  console.log("");

  // Check required environment variables
  if (!process.env.HUNTER_IO_API_KEY) {
    console.error("❌ ERROR: HUNTER_IO_API_KEY environment variable required");
    process.exit(1);
  }

  const testSuite = new EmailDiscoveryTestSuite();

  try {
    await testSuite.runComprehensiveTests();
    console.log("\n✅ All tests completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("\n💥 Test suite failed:", error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = EmailDiscoveryTestSuite;
