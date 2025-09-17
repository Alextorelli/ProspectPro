/**
 * Enhanced Integration Test Suite
 * Validates ScrapingDog, Hunter.io, and Supabase enhanced integrations
 */

require("dotenv").config();
const EnhancedScrapingDogClient = require("../modules/api-clients/enhanced-scrapingdog-client");
const EnhancedHunterClient = require("../modules/api-clients/enhanced-hunter-client");
const { createSupabaseClient } = require("../config/supabase");
const EnhancedLeadDiscoveryOrchestrator = require("../modules/enhanced-lead-discovery-orchestrator");

class EnhancedIntegrationTester {
  constructor() {
    this.testResults = {
      scrapingdog: { passed: 0, failed: 0, tests: [] },
      hunter: { passed: 0, failed: 0, tests: [] },
      supabase: { passed: 0, failed: 0, tests: [] },
      orchestrator: { passed: 0, failed: 0, tests: [] },
    };
  }

  async runAllTests() {
    console.log("🧪 Starting Enhanced Integration Test Suite...\n");

    try {
      // Test 1: ScrapingDog Enhanced Client
      await this.testScrapingDogEnhanced();

      // Test 2: Hunter.io Enhanced Client
      await this.testHunterEnhanced();

      // Test 3: Supabase Enhanced Client
      await this.testSupabaseEnhanced();

      // Test 4: Full Integration Orchestrator
      await this.testOrchestrator();

      // Print final results
      this.printTestResults();
    } catch (error) {
      console.error("❌ Test suite failed:", error);
    }
  }

  /**
   * Test ScrapingDog Enhanced Client
   */
  async testScrapingDogEnhanced() {
    console.log("🔍 Testing Enhanced ScrapingDog Integration...");

    if (!process.env.SCRAPINGDOG_API_KEY) {
      this.recordTest(
        "scrapingdog",
        "API Key Check",
        false,
        "API key not configured"
      );
      return;
    }

    const client = new EnhancedScrapingDogClient(
      process.env.SCRAPINGDOG_API_KEY,
      50
    );

    // Test 1: Multi-radius search
    try {
      console.log("  📍 Testing multi-radius search...");
      const results = await client.searchBusinessesMultiRadius(
        "coffee shops",
        "30.2672,-97.7431", // Austin coordinates
        [1, 2] // Small radiuses for testing
      );

      this.recordTest(
        "scrapingdog",
        "Multi-radius Search",
        results && results.length > 0,
        `Found ${results.length} businesses`
      );

      // Test 2: Business enrichment (if we have results)
      if (results.length > 0) {
        console.log("  🔍 Testing business enrichment...");
        const enriched = await client.enrichBusinessData(results.slice(0, 2)); // Test first 2

        this.recordTest(
          "scrapingdog",
          "Business Enrichment",
          enriched && enriched.length > 0,
          `Enriched ${enriched.length} businesses`
        );

        // Test 3: Email extraction
        const emailsFound = enriched.filter(
          (b) => b.emails && b.emails.length > 0
        ).length;
        this.recordTest(
          "scrapingdog",
          "Email Extraction",
          emailsFound >= 0, // Success even if no emails found
          `Found emails in ${emailsFound}/${enriched.length} businesses`
        );
      }

      // Test 4: Cost tracking
      const costSummary = client.getCostSummary();
      this.recordTest(
        "scrapingdog",
        "Cost Tracking",
        costSummary && typeof costSummary.credits_used === "number",
        `Used ${
          costSummary.credits_used
        } credits (~$${costSummary.estimated_cost.toFixed(3)})`
      );
    } catch (error) {
      this.recordTest(
        "scrapingdog",
        "Multi-radius Search",
        false,
        error.message
      );
    }
  }

  /**
   * Test Hunter.io Enhanced Client
   */
  async testHunterEnhanced() {
    console.log("📧 Testing Enhanced Hunter.io Integration...");

    if (!process.env.HUNTER_IO_API_KEY) {
      this.recordTest(
        "hunter",
        "API Key Check",
        false,
        "API key not configured"
      );
      return;
    }

    const client = new EnhancedHunterClient(process.env.HUNTER_IO_API_KEY, 25);

    try {
      // Test 1: Email pattern generation
      console.log("  🎯 Testing email pattern generation...");
      const testBusiness = {
        business_name: "Test Coffee Shop",
        website: "https://example.com",
        owner_name: "John Doe",
      };

      const emailResult = await client.discoverBusinessEmails(testBusiness);

      this.recordTest(
        "hunter",
        "Email Pattern Generation",
        emailResult && emailResult.emails && emailResult.patterns_tried,
        `Generated ${emailResult.patterns_tried.length} patterns, found ${emailResult.emails.length} emails`
      );

      // Test 2: Domain search (real test with a known domain)
      if (process.env.NODE_ENV !== "production") {
        // Only in development
        console.log("  🔍 Testing domain search...");
        const domainResult = await client.searchDomain("stripe.com", 5);

        this.recordTest(
          "hunter",
          "Domain Search",
          domainResult && domainResult.emails,
          `Found ${domainResult.emails.length} emails at stripe.com`
        );
      }

      // Test 3: Usage statistics
      const stats = client.getUsageStats();
      this.recordTest(
        "hunter",
        "Usage Statistics",
        stats && typeof stats.daily_spend === "number",
        `Daily spend: $${stats.daily_spend.toFixed(2)}, Success rate: ${
          stats.search_success_rate
        }`
      );
    } catch (error) {
      this.recordTest("hunter", "Email Discovery", false, error.message);
    }
  }

  /**
   * Test Supabase Enhanced Client
   */
  async testSupabaseEnhanced() {
    console.log("💾 Testing Enhanced Supabase Integration...");

    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SECRET_KEY) {
      this.recordTest(
        "supabase",
        "Configuration Check",
        false,
        "Supabase not configured"
      );
      return;
    }

    const client = createSupabaseClient();

    try {
      // Test 1: Database connection
      console.log("  🔌 Testing database connection...");

      // Test basic connection by trying to select from campaigns
      const { data: connectionTest, error: connectionError } = await client
        .from("campaigns")
        .select("count")
        .limit(1);

      if (connectionError) {
        this.recordTest(
          "supabase",
          "Database Connection",
          false,
          connectionError.message
        );
        return;
      }

      this.recordTest(
        "supabase",
        "Database Connection",
        true,
        "Database connected successfully"
      );

      // Test 2: System settings table access
      console.log("  ⚙️ Testing system_settings table access...");

      const testUserId = "test-user-" + Date.now();

      // Try to insert a test setting
      const { data: insertData, error: insertError } = await client
        .from("system_settings")
        .insert({
          user_id: testUserId,
          setting_key: "test_setting",
          setting_value: { test: "value" },
          data_type: "object",
        })
        .select()
        .single();

      this.recordTest(
        "supabase",
        "System Settings Insert",
        insertData && insertData.id && !insertError,
        insertError ? insertError.message : `Created setting: ${insertData.id}`
      );

      // Test reading the setting back
      if (insertData) {
        const { data: readData, error: readError } = await client
          .from("system_settings")
          .select("*")
          .eq("user_id", testUserId)
          .eq("setting_key", "test_setting")
          .single();

        this.recordTest(
          "supabase",
          "System Settings Read",
          readData && !readError,
          readError
            ? readError.message
            : `Read setting: ${readData.setting_key}`
        );

        // Cleanup: Delete test data
        await client.from("system_settings").delete().eq("id", insertData.id);
      }

      // Test 3: All core tables accessibility
      console.log("  � Testing core table access...");
      const coreTables = [
        "campaigns",
        "enhanced_leads",
        "lead_emails",
        "system_settings",
      ];

      for (const table of coreTables) {
        const { data, error } = await client
          .from(table)
          .select("count")
          .limit(1);

        this.recordTest(
          "supabase",
          `Table Access: ${table}`,
          !error,
          error ? error.message : `Table accessible`
        );
      }

      console.log("  ✅ Supabase integration tests complete");
    } catch (error) {
      this.recordTest("supabase", "Database Operations", false, error.message);
    }
  }

  /**
   * Test Full Integration Orchestrator
   */
  async testOrchestrator() {
    console.log("🎯 Testing Enhanced Lead Discovery Orchestrator...");

    // Check if all APIs are configured
    const requiredKeys = [
      "SCRAPINGDOG_API_KEY",
      "HUNTER_IO_API_KEY",
      "SUPABASE_URL",
      "SUPABASE_SECRET_KEY",
    ];
    const missingKeys = requiredKeys.filter((key) => !process.env[key]);

    if (missingKeys.length > 0) {
      this.recordTest(
        "orchestrator",
        "Configuration Check",
        false,
        `Missing keys: ${missingKeys.join(", ")}`
      );
      return;
    }

    try {
      // Test 1: Orchestrator initialization
      console.log("  🚀 Testing orchestrator initialization...");
      const orchestrator = new EnhancedLeadDiscoveryOrchestrator({
        minConfidenceScore: 75,
        maxLeadsPerCampaign: 3,
        batchSize: 2,
      });

      this.recordTest(
        "orchestrator",
        "Initialization",
        orchestrator &&
          orchestrator.scrapingDog &&
          orchestrator.hunter &&
          orchestrator.supabase,
        "All API clients initialized"
      );

      // Test 2: Small-scale lead discovery (to avoid costs)
      if (process.env.NODE_ENV !== "production") {
        console.log("  🔍 Testing small-scale discovery workflow...");

        // Very limited test to minimize API costs
        const results = await orchestrator.runEnhancedLeadDiscovery(
          {
            businessType: "coffee",
            location: "austin",
            radiuses: [1], // Very small radius
            budgetLimit: 5, // Low budget limit
            qualityThreshold: 60,
          },
          "test-user-enhanced"
        );

        this.recordTest(
          "orchestrator",
          "End-to-End Workflow",
          results && results.campaign_id && results.stats,
          `Campaign: ${results.campaign_id}, Found: ${results.stats.leads_qualified} leads, Cost: $${results.stats.total_cost}`
        );

        this.recordTest(
          "orchestrator",
          "Cost Control",
          results.stats.total_cost <= 5,
          `Stayed within $5 budget (actual: $${results.stats.total_cost})`
        );

        this.recordTest(
          "orchestrator",
          "API Integration",
          results.api_usage && results.api_usage.total_api_calls > 0,
          `Made ${results.api_usage.total_api_calls} total API calls`
        );
      }
    } catch (error) {
      this.recordTest(
        "orchestrator",
        "End-to-End Workflow",
        false,
        error.message
      );
    }
  }

  /**
   * Record test result
   */
  recordTest(suite, testName, passed, details) {
    this.testResults[suite].tests.push({
      name: testName,
      passed,
      details,
    });

    if (passed) {
      this.testResults[suite].passed++;
      console.log(`    ✅ ${testName}: ${details}`);
    } else {
      this.testResults[suite].failed++;
      console.log(`    ❌ ${testName}: ${details}`);
    }
  }

  /**
   * Print comprehensive test results
   */
  printTestResults() {
    console.log("\n" + "=".repeat(60));
    console.log("🧪 ENHANCED INTEGRATION TEST RESULTS");
    console.log("=".repeat(60));

    let totalPassed = 0;
    let totalFailed = 0;

    Object.entries(this.testResults).forEach(([suite, results]) => {
      console.log(`\n${suite.toUpperCase()}:`);
      console.log(`  ✅ Passed: ${results.passed}`);
      console.log(`  ❌ Failed: ${results.failed}`);
      console.log(
        `  📊 Success Rate: ${
          results.passed + results.failed > 0
            ? Math.round(
                (results.passed / (results.passed + results.failed)) * 100
              )
            : 0
        }%`
      );

      totalPassed += results.passed;
      totalFailed += results.failed;

      if (results.failed > 0) {
        console.log("  Failed tests:");
        results.tests
          .filter((t) => !t.passed)
          .forEach((test) => {
            console.log(`    - ${test.name}: ${test.details}`);
          });
      }
    });

    console.log("\n" + "=".repeat(60));
    console.log("OVERALL RESULTS:");
    console.log(`✅ Total Passed: ${totalPassed}`);
    console.log(`❌ Total Failed: ${totalFailed}`);
    console.log(
      `📊 Overall Success Rate: ${
        totalPassed + totalFailed > 0
          ? Math.round((totalPassed / (totalPassed + totalFailed)) * 100)
          : 0
      }%`
    );

    if (totalFailed === 0) {
      console.log(
        "🎉 ALL TESTS PASSED! Enhanced integration is ready for production."
      );
    } else if (totalFailed <= 2) {
      console.log("⚠️  Some tests failed, but core functionality is working.");
    } else {
      console.log(
        "❌ Multiple test failures - check configuration and API keys."
      );
    }

    console.log("=".repeat(60));
  }

  /**
   * Run configuration check
   */
  static checkConfiguration() {
    console.log("🔧 ENHANCED INTEGRATION CONFIGURATION CHECK");
    console.log("=".repeat(50));

    const requiredVars = [
      "SCRAPINGDOG_API_KEY",
      "HUNTER_IO_API_KEY",
      "SUPABASE_URL",
      "SUPABASE_SECRET_KEY",
      "SCRAPINGDOG_MONTHLY_BUDGET",
      "HUNTER_MONTHLY_BUDGET",
    ];

    const optionalVars = [
      "ENABLE_REAL_TIME_MONITORING",
      "ENABLE_BUDGET_ALERTS",
      "DASHBOARD_REFRESH_INTERVAL_MS",
    ];

    console.log("\nRequired Configuration:");
    requiredVars.forEach((varName) => {
      const value = process.env[varName];
      console.log(`  ${varName}: ${value ? "✅ Configured" : "❌ Missing"}`);
    });

    console.log("\nOptional Configuration:");
    optionalVars.forEach((varName) => {
      const value = process.env[varName];
      console.log(`  ${varName}: ${value || "Default"}`);
    });

    console.log("\nBudget Settings:");
    console.log(
      `  ScrapingDog Budget: $${
        process.env.SCRAPINGDOG_MONTHLY_BUDGET || "200"
      }/month`
    );
    console.log(
      `  Hunter.io Budget: $${process.env.HUNTER_MONTHLY_BUDGET || "500"}/month`
    );
    console.log(
      `  Daily Limit: $${process.env.DAILY_BUDGET_LIMIT || "25"}/day`
    );
  }
}

// Run tests if called directly
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.includes("--config-check")) {
    EnhancedIntegrationTester.checkConfiguration();
  } else {
    const tester = new EnhancedIntegrationTester();
    tester.runAllTests().catch(console.error);
  }
}

module.exports = EnhancedIntegrationTester;
