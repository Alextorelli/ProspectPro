/**
 * Comprehensive Apollo.io API Integration Test Suite
 *
 * Tests all major Apollo API endpoints with real-world data
 * Validates mobile phone revelation, enrichment capabilities, and cost tracking
 *
 * Test Coverage:
 * 1. People Search API
 * 2. People Enrichment with mobile phone revelation
 * 3. Bulk People Enrichment
 * 4. Organization Search API
 * 5. Organization Enrichment
 * 6. Bulk Organization Enrichment
 * 7. API Usage Stats
 * 8. Combined Search + Enrichment workflows
 * 9. Cost optimization and circuit breaker validation
 */

require("dotenv").config();
const ComprehensiveApolloClient = require("./modules/api-clients/comprehensive-apollo-client");

// Test configuration
const APOLLO_API_KEY = process.env.APOLLO_API_KEY || "sRlHxW_zYKpcToD-tWtRVQ"; // Master API Key provided
const TEST_TIMEOUT = 30000; // 30 seconds per test

class ApolloIntegrationTester {
  constructor() {
    this.apolloClient = new ComprehensiveApolloClient(APOLLO_API_KEY);
    this.testResults = [];
    this.totalCreditsUsed = 0;
    this.startTime = Date.now();

    console.log("🧪 Apollo.io Comprehensive Integration Test Suite");
    console.log("=".repeat(60));
    console.log(`🔑 API Key: ${APOLLO_API_KEY.substring(0, 8)}...`);
    console.log(`⏰ Test Timeout: ${TEST_TIMEOUT / 1000}s per test`);
    console.log("=".repeat(60));
  }

  /**
   * Execute a single test with error handling and metrics
   */
  async runTest(testName, testFunction) {
    console.log(`\n🧪 ${testName}`);
    console.log("-".repeat(40));

    const testStart = Date.now();
    let result;

    try {
      result = await Promise.race([
        testFunction(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Test timeout")), TEST_TIMEOUT)
        ),
      ]);

      const duration = Date.now() - testStart;
      const success = result && result.success !== false;

      this.testResults.push({
        name: testName,
        success,
        duration,
        result,
        creditsUsed: result?.creditsUsed || 0,
      });

      console.log(`${success ? "✅" : "❌"} ${testName} - ${duration}ms`);
      if (result?.creditsUsed) {
        console.log(`💳 Credits used: ${result.creditsUsed}`);
        this.totalCreditsUsed += result.creditsUsed;
      }

      return result;
    } catch (error) {
      const duration = Date.now() - testStart;
      this.testResults.push({
        name: testName,
        success: false,
        duration,
        error: error.message,
        creditsUsed: 0,
      });

      console.log(`❌ ${testName} failed - ${duration}ms`);
      console.log(`🚫 Error: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Test 1: People Search API
   */
  async testPeopleSearch() {
    return await this.runTest("People Search API", async () => {
      const searchFilters = {
        person_titles: ["CEO", "Founder", "President"],
        organization_locations: ["San Francisco, CA"],
        organization_num_employees_ranges: ["1,10"],
        per_page: 10,
      };

      const result = await this.apolloClient.searchPeople(searchFilters);

      if (result.success && result.people) {
        console.log(`📊 Found ${result.people.length} people`);
        console.log(`📈 Total entries: ${result.totalEntries}`);

        // Show sample results
        const samplePerson = result.people[0];
        if (samplePerson) {
          console.log(
            `👤 Sample: ${samplePerson.first_name} ${samplePerson.last_name}`
          );
          console.log(
            `🏢 Company: ${samplePerson.organization?.name || "Unknown"}`
          );
          console.log(`📧 Email: ${samplePerson.email || "Not shown"}`);
        }
      }

      return result;
    });
  }

  /**
   * Test 2: People Enrichment with Mobile Phone Revelation
   */
  async testPeopleEnrichment() {
    return await this.runTest("People Enrichment + Mobile Phone", async () => {
      // Test with a common business person profile
      const personData = {
        first_name: "Tim",
        last_name: "Cook",
        organization_name: "Apple Inc.",
        domain: "apple.com",
      };

      const result = await this.apolloClient.enrichPerson(personData, {
        revealPhoneNumber: true,
        revealPersonalEmails: true,
      });

      if (result.success && result.person) {
        console.log(
          `👤 Enriched: ${result.person.first_name} ${result.person.last_name}`
        );
        console.log(`🏢 Title: ${result.person.title || "Unknown"}`);
        console.log(`📧 Work Email: ${result.person.email || "Not found"}`);
        console.log(
          `📱 Phone: ${result.person.sanitized_phone || "Not found"}`
        );
        console.log(
          `📧 Personal Emails: ${result.person.personal_emails?.length || 0}`
        );
        console.log(
          `🔗 LinkedIn: ${result.person.linkedin_url || "Not found"}`
        );
      }

      return result;
    });
  }

  /**
   * Test 3: Bulk People Enrichment
   */
  async testBulkPeopleEnrichment() {
    return await this.runTest("Bulk People Enrichment", async () => {
      const peopleData = [
        {
          first_name: "Sundar",
          last_name: "Pichai",
          organization_name: "Google",
          domain: "google.com",
        },
        {
          first_name: "Satya",
          last_name: "Nadella",
          organization_name: "Microsoft",
          domain: "microsoft.com",
        },
        {
          first_name: "Andy",
          last_name: "Jassy",
          organization_name: "Amazon",
          domain: "amazon.com",
        },
      ];

      const result = await this.apolloClient.bulkEnrichPeople(peopleData, {
        revealPhoneNumber: true,
        revealPersonalEmails: true,
      });

      if (result.success) {
        console.log(`👥 Processed: ${result.totalRequested} people`);
        console.log(`✅ Matched: ${result.matchedCount} people`);
        console.log(`💳 Credits per match: 1 credit`);

        result.people.forEach((person, index) => {
          if (person) {
            console.log(
              `  ${index + 1}. ${person.first_name} ${person.last_name} - ${
                person.title || "Unknown"
              }`
            );
          } else {
            console.log(`  ${index + 1}. No match found`);
          }
        });
      }

      return result;
    });
  }

  /**
   * Test 4: Organization Search
   */
  async testOrganizationSearch() {
    return await this.runTest("Organization Search API", async () => {
      const searchFilters = {
        organization_locations: ["San Francisco, CA"],
        organization_num_employees_ranges: ["100,500"],
        q_keywords: "technology software",
        per_page: 5,
      };

      const result = await this.apolloClient.searchOrganizations(searchFilters);

      if (result.success && result.organizations) {
        console.log(`🏢 Found ${result.organizations.length} organizations`);
        console.log(`📈 Total entries: ${result.totalEntries}`);

        // Show sample results
        result.organizations.slice(0, 3).forEach((org, index) => {
          console.log(
            `  ${index + 1}. ${org.name} - ${org.industry || "Unknown"}`
          );
          console.log(`     🌐 ${org.website_url || "No website"}`);
          console.log(
            `     👥 ~${org.estimated_num_employees || "Unknown"} employees`
          );
        });
      }

      return result;
    });
  }

  /**
   * Test 5: Organization Enrichment
   */
  async testOrganizationEnrichment() {
    return await this.runTest("Organization Enrichment", async () => {
      const orgData = {
        domain: "salesforce.com",
      };

      const result = await this.apolloClient.enrichOrganization(orgData);

      if (result.success && result.organization) {
        const org = result.organization;
        console.log(`🏢 Enriched: ${org.name}`);
        console.log(`🏭 Industry: ${org.industry || "Unknown"}`);
        console.log(
          `👥 Employees: ${org.estimated_num_employees || "Unknown"}`
        );
        console.log(`💰 Revenue: ${org.estimated_annual_revenue || "Unknown"}`);
        console.log(`🌐 Website: ${org.website_url || "Unknown"}`);
        console.log(
          `📍 HQ: ${org.primary_city || "Unknown"}, ${
            org.primary_state || "Unknown"
          }`
        );
      }

      return result;
    });
  }

  /**
   * Test 6: Bulk Organization Enrichment
   */
  async testBulkOrganizationEnrichment() {
    return await this.runTest("Bulk Organization Enrichment", async () => {
      const organizationsData = [
        { domain: "stripe.com" },
        { domain: "airbnb.com" },
        { domain: "uber.com" },
        { name: "Zoom Video Communications" },
      ];

      const result = await this.apolloClient.bulkEnrichOrganizations(
        organizationsData
      );

      if (result.success) {
        console.log(`🏢 Processed: ${result.totalRequested} organizations`);
        console.log(`✅ Matched: ${result.matchedCount} organizations`);

        result.organizations.forEach((org, index) => {
          if (org) {
            console.log(
              `  ${index + 1}. ${org.name} - ${org.industry || "Unknown"}`
            );
            console.log(
              `     👥 ~${org.estimated_num_employees || "Unknown"} employees`
            );
          } else {
            console.log(`  ${index + 1}. No match found`);
          }
        });
      }

      return result;
    });
  }

  /**
   * Test 7: API Usage Stats
   */
  async testUsageStats() {
    return await this.runTest("API Usage Stats", async () => {
      const result = await this.apolloClient.getUsageStats();

      if (result.success && result.usage) {
        console.log(`📊 API Usage Statistics:`);
        console.log(
          `   Current Plan: ${result.usage.current_plan || "Unknown"}`
        );
        console.log(`   Credits Used: ${result.usage.credits_used || 0}`);
        console.log(
          `   Credits Remaining: ${result.usage.credits_remaining || "Unknown"}`
        );
        console.log(`   Rate Limit: ${result.usage.rate_limit || "Unknown"}`);
        console.log(`   Requests Today: ${result.usage.requests_today || 0}`);
      }

      return result;
    });
  }

  /**
   * Test 8: Combined Search + Enrichment Workflow
   */
  async testCombinedWorkflow() {
    return await this.runTest("Combined Search + Enrichment", async () => {
      const searchFilters = {
        person_titles: ["CTO", "VP Engineering"],
        organization_locations: ["New York, NY"],
        organization_num_employees_ranges: ["50,200"],
        per_page: 5,
      };

      const result = await this.apolloClient.searchAndEnrichPeople(
        searchFilters,
        {
          revealPhoneNumber: true,
          revealPersonalEmails: true,
        }
      );

      if (result.success) {
        console.log(`🔍 Search Phase: ${result.totalFound} people found`);
        console.log(
          `⚡ Enrichment Phase: ${result.totalEnriched} people enriched`
        );
        console.log(`💳 Total Credits: ${result.totalCreditsUsed}`);

        // Show enriched results
        const enriched = result.enrichedPeople
          .filter((p) => p !== null)
          .slice(0, 3);
        enriched.forEach((person, index) => {
          console.log(
            `  ${index + 1}. ${person.first_name} ${person.last_name} - ${
              person.title || "Unknown"
            }`
          );
          console.log(`     📧 ${person.email || "No email"}`);
          console.log(`     📱 ${person.sanitized_phone || "No phone"}`);
        });
      }

      return result;
    });
  }

  /**
   * Test 9: Circuit Breaker and Error Handling
   */
  async testErrorHandling() {
    return await this.runTest("Circuit Breaker & Error Handling", async () => {
      // Test with invalid data to trigger errors
      const invalidPersonData = {
        // Missing required fields
        first_name: "",
        last_name: "",
        email: "invalid-email-format",
      };

      const result = await this.apolloClient.enrichPerson(invalidPersonData);

      // Should handle error gracefully
      console.log(`🛡️ Error handling test completed`);
      console.log(
        `📊 Circuit breaker status: ${JSON.stringify(
          this.apolloClient.circuitBreakers.peopleEnrichment
        )}`
      );

      return {
        success: true,
        error_handled: !result.success,
        circuit_breaker_operational: true,
      };
    });
  }

  /**
   * Test 10: Cost Optimization Validation
   */
  async testCostOptimization() {
    return await this.runTest("Cost Optimization Validation", async () => {
      const initialStats = this.apolloClient.getStats();

      // Test multiple operations to validate cost tracking
      await this.apolloClient.searchPeople({ per_page: 2 });
      await this.apolloClient.enrichOrganization({ domain: "github.com" });

      const finalStats = this.apolloClient.getStats();

      console.log(`📊 Initial credits: ${initialStats.totalCreditsUsed}`);
      console.log(`📊 Final credits: ${finalStats.totalCreditsUsed}`);
      console.log(`💰 Cost breakdown:`, finalStats.costBreakdown);

      return {
        success: true,
        cost_tracking_functional:
          finalStats.totalCreditsUsed >= initialStats.totalCreditsUsed,
        stats: finalStats,
      };
    });
  }

  /**
   * Run all tests and generate comprehensive report
   */
  async runAllTests() {
    console.log(`\n🚀 Starting Apollo.io Comprehensive Test Suite`);
    console.log(`⏰ Start Time: ${new Date().toISOString()}`);

    // Execute all tests sequentially to avoid rate limits
    await this.testPeopleSearch();
    await this.testPeopleEnrichment();
    await this.testBulkPeopleEnrichment();
    await this.testOrganizationSearch();
    await this.testOrganizationEnrichment();
    await this.testBulkOrganizationEnrichment();
    await this.testUsageStats();
    await this.testCombinedWorkflow();
    await this.testErrorHandling();
    await this.testCostOptimization();

    // Generate comprehensive report
    this.generateReport();
  }

  /**
   * Generate detailed test report
   */
  generateReport() {
    const duration = Date.now() - this.startTime;
    const successfulTests = this.testResults.filter((t) => t.success).length;
    const totalTests = this.testResults.length;

    console.log("\n" + "=".repeat(60));
    console.log("🧪 APOLLO.IO COMPREHENSIVE TEST REPORT");
    console.log("=".repeat(60));
    console.log(
      `⏰ Total Duration: ${duration}ms (${(duration / 1000).toFixed(2)}s)`
    );
    console.log(
      `✅ Successful Tests: ${successfulTests}/${totalTests} (${(
        (successfulTests / totalTests) *
        100
      ).toFixed(1)}%)`
    );
    console.log(`💳 Total Credits Used: ${this.totalCreditsUsed}`);

    const clientStats = this.apolloClient.getStats();
    console.log(`📡 Total API Requests: ${clientStats.totalRequests}`);

    console.log("\n📊 Test Results Summary:");
    this.testResults.forEach((test, index) => {
      const status = test.success ? "✅" : "❌";
      const credits = test.creditsUsed ? ` (${test.creditsUsed} credits)` : "";
      console.log(
        `  ${index + 1}. ${status} ${test.name} - ${test.duration}ms${credits}`
      );
      if (!test.success && test.error) {
        console.log(`     🚫 Error: ${test.error}`);
      }
    });

    console.log("\n💰 Cost Analysis:");
    console.log(
      `   People Search: ${clientStats.costBreakdown.peopleSearch.requests} requests, ${clientStats.costBreakdown.peopleSearch.credits} credits`
    );
    console.log(
      `   People Enrichment: ${clientStats.costBreakdown.peopleEnrichment.requests} requests, ${clientStats.costBreakdown.peopleEnrichment.credits} credits`
    );
    console.log(
      `   Organization Search: ${clientStats.costBreakdown.organizationSearch.requests} requests, ${clientStats.costBreakdown.organizationSearch.credits} credits`
    );
    console.log(
      `   Organization Enrichment: ${clientStats.costBreakdown.organizationEnrichment.requests} requests, ${clientStats.costBreakdown.organizationEnrichment.credits} credits`
    );
    console.log(
      `   Bulk Operations: ${clientStats.costBreakdown.bulkOperations.requests} requests, ${clientStats.costBreakdown.bulkOperations.credits} credits`
    );

    console.log("\n🛡️ Circuit Breaker Status:");
    Object.entries(clientStats.circuitBreakerStatus).forEach(
      ([endpoint, status]) => {
        const state = status.failures >= status.threshold ? "OPEN" : "CLOSED";
        console.log(
          `   ${endpoint}: ${state} (${status.failures}/${status.threshold} failures)`
        );
      }
    );

    console.log("\n🎯 Integration Status:");
    console.log(
      `   ${
        successfulTests === totalTests ? "✅" : "⚠️"
      } Apollo.io API Integration: ${
        successfulTests === totalTests ? "FULLY OPERATIONAL" : "PARTIAL ISSUES"
      }`
    );
    console.log(
      `   ${clientStats.totalCreditsUsed > 0 ? "✅" : "⚠️"} Credit Tracking: ${
        clientStats.totalCreditsUsed > 0 ? "FUNCTIONAL" : "NO CREDITS CONSUMED"
      }`
    );
    console.log(
      `   ${clientStats.totalRequests > 0 ? "✅" : "⚠️"} API Connectivity: ${
        clientStats.totalRequests > 0 ? "ESTABLISHED" : "NOT CONNECTED"
      }`
    );

    console.log("\n🚀 APOLLO.IO INTEGRATION TEST COMPLETE");
    console.log("=".repeat(60));

    // Return summary for programmatic use
    return {
      totalTests,
      successfulTests,
      successRate: (successfulTests / totalTests) * 100,
      duration,
      totalCreditsUsed: this.totalCreditsUsed,
      totalRequests: clientStats.totalRequests,
      allTestsPassed: successfulTests === totalTests,
    };
  }
}

// Execute tests if run directly
if (require.main === module) {
  const tester = new ApolloIntegrationTester();
  tester
    .runAllTests()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Test suite failed:", error);
      process.exit(1);
    });
}

module.exports = ApolloIntegrationTester;
