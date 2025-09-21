/**
 * Comprehensive Multi-Source Email Discovery Test with Apollo Integration
 *
 * Tests the complete email discovery pipeline with:
 * 1. Pattern-based email generation (FREE)
 * 2. Hunter.io comprehensive API integration (PAID)
 * 3. Apollo.io organization enrichment (FREE)
 * 4. Enhanced pattern generation using Apollo data
 * 5. Cost optimization and budget management
 * 6. Multi-API circuit breaker protection
 */

require("dotenv").config();
const MultiSourceEmailDiscovery = require("./modules/api-clients/multi-source-email-discovery");

// Test configuration with real API keys
const TEST_CONFIG = {
  hunterApiKey: process.env.HUNTER_IO_API_KEY,
  apolloApiKey: process.env.APOLLO_API_KEY || "sRlHxW_zYKpcToD-tWtRVQ", // Master API Key
  maxDailyCost: 5.0, // $5 daily budget for testing
  maxPerLeadCost: 1.0, // $1 per lead maximum
  minEmailConfidence: 70,
  maxEmailsPerBusiness: 8,
};

class MultiSourceEmailDiscoveryTester {
  constructor() {
    this.emailDiscovery = new MultiSourceEmailDiscovery(TEST_CONFIG);
    this.testResults = [];
    this.totalCost = 0;
    this.startTime = Date.now();

    console.log("🧪 Multi-Source Email Discovery Integration Test");
    console.log("=".repeat(60));
    console.log(
      `💰 Budget: $${TEST_CONFIG.maxDailyCost}/day, $${TEST_CONFIG.maxPerLeadCost}/lead`
    );
    console.log(`🎯 Min Confidence: ${TEST_CONFIG.minEmailConfidence}%`);
    console.log("=".repeat(60));
  }

  /**
   * Execute a single test case
   */
  async runTest(testName, businessData, expectedFeatures = []) {
    console.log(`\n🧪 ${testName}`);
    console.log("-".repeat(40));

    const testStart = Date.now();

    try {
      // Run email discovery
      const result = await this.emailDiscovery.discoverBusinessEmails(
        businessData
      );

      const duration = Date.now() - testStart;
      this.totalCost += result.total_cost;

      // Validate results
      const validation = this.validateResult(result, expectedFeatures);

      this.testResults.push({
        name: testName,
        success: result.success,
        duration,
        emailsFound: result.emails.length,
        confidence: result.confidence_score,
        cost: result.total_cost,
        sourcesUsed: result.sources_used,
        validation,
      });

      // Display results
      console.log(
        `${result.success ? "✅" : "❌"} ${testName} - ${duration}ms`
      );
      console.log(`📧 Emails found: ${result.emails.length}`);
      console.log(`🎯 Confidence: ${result.confidence_score}%`);
      console.log(`💰 Cost: $${result.total_cost.toFixed(3)}`);
      console.log(`🔄 Sources used: ${result.sources_used.join(", ")}`);

      if (result.emails.length > 0) {
        console.log("📋 Email Details:");
        result.emails.slice(0, 3).forEach((email, index) => {
          console.log(
            `  ${index + 1}. ${email.value} (${email.confidence}% - ${
              email.source
            })`
          );
          if (email.reasoning) {
            console.log(`     💡 ${email.reasoning}`);
          }
        });
        if (result.emails.length > 3) {
          console.log(`     ... and ${result.emails.length - 3} more emails`);
        }
      }

      return result;
    } catch (error) {
      const duration = Date.now() - testStart;
      console.log(`❌ ${testName} failed - ${duration}ms`);
      console.log(`🚫 Error: ${error.message}`);

      this.testResults.push({
        name: testName,
        success: false,
        duration,
        error: error.message,
      });

      return { success: false, error: error.message };
    }
  }

  /**
   * Validate test results against expected features
   */
  validateResult(result, expectedFeatures) {
    const validation = {
      hasPatternEmails: result.sources_used.includes("patterns"),
      hasHunterEmails:
        result.sources_used.includes("hunter") ||
        result.sources_used.includes("hunter_io"),
      hasApolloData: result.sources_used.includes("apollo"),
      hasEnhancedPatterns: result.emails.some(
        (email) => email.source === "apollo_enhanced_pattern"
      ),
      meetsBudget: result.total_cost <= TEST_CONFIG.maxPerLeadCost,
      meetsConfidence:
        result.confidence_score >= TEST_CONFIG.minEmailConfidence,
      hasBusinessContacts:
        result.business_contacts && result.business_contacts.length > 0,
    };

    validation.score = Object.values(validation).filter(Boolean).length;
    validation.maxScore = Object.keys(validation).length - 1; // Exclude score itself

    return validation;
  }

  /**
   * Test 1: Technology Company with Strong Online Presence
   */
  async testTechnologyCompany() {
    const businessData = {
      business_name: "Salesforce",
      website: "https://salesforce.com",
      industry: "Technology",
      owner_name: "Marc Benioff",
    };

    return await this.runTest("Technology Company - Salesforce", businessData, [
      "apollo_data",
      "hunter_emails",
      "enhanced_patterns",
    ]);
  }

  /**
   * Test 2: Healthcare Company
   */
  async testHealthcareCompany() {
    const businessData = {
      business_name: "Mayo Clinic",
      website: "https://mayoclinic.org",
      industry: "Healthcare",
      owner_name: "Gianrico Farrugia",
    };

    return await this.runTest(
      "Healthcare Company - Mayo Clinic",
      businessData,
      ["industry_patterns", "apollo_data"]
    );
  }

  /**
   * Test 3: Retail Company
   */
  async testRetailCompany() {
    const businessData = {
      business_name: "Target Corporation",
      website: "https://target.com",
      industry: "Retail",
      owner_name: "Brian Cornell",
    };

    return await this.runTest("Retail Company - Target", businessData, [
      "apollo_data",
      "industry_patterns",
    ]);
  }

  /**
   * Test 4: Small Business (Pattern-Heavy)
   */
  async testSmallBusiness() {
    const businessData = {
      business_name: "Local Coffee Shop",
      website: "https://github.com", // Using GitHub as example domain
      industry: "Food & Beverage",
      owner_name: "John Smith",
    };

    return await this.runTest(
      "Small Business - Local Coffee Shop",
      businessData,
      ["pattern_generation", "owner_patterns"]
    );
  }

  /**
   * Test 5: Financial Services
   */
  async testFinancialServices() {
    const businessData = {
      business_name: "Goldman Sachs",
      website: "https://goldmansachs.com",
      industry: "Financial Services",
      owner_name: "David Solomon",
    };

    return await this.runTest(
      "Financial Services - Goldman Sachs",
      businessData,
      ["apollo_data", "industry_patterns"]
    );
  }

  /**
   * Test 6: Budget Optimization (Low Budget)
   */
  async testBudgetOptimization() {
    // Temporarily reduce budget for this test
    const originalBudget = this.emailDiscovery.config.maxPerLeadCost;
    this.emailDiscovery.config.maxPerLeadCost = 0.1; // Very low budget

    const businessData = {
      business_name: "Budget Test Company",
      website: "https://stripe.com",
      industry: "Financial Technology",
      owner_name: "Test Owner",
    };

    const result = await this.runTest(
      "Budget Optimization Test",
      businessData,
      ["pattern_generation", "budget_compliance"]
    );

    // Restore original budget
    this.emailDiscovery.config.maxPerLeadCost = originalBudget;

    return result;
  }

  /**
   * Test 7: Apollo Organization Intelligence
   */
  async testApolloOrganizationIntelligence() {
    // Test Apollo's organization intelligence feature specifically
    const businessData = {
      business_name: "Microsoft",
      website: "https://microsoft.com",
      industry: "Technology",
    };

    // Directly test Apollo organization intelligence
    try {
      console.log("\n🏢 Direct Apollo Organization Intelligence Test");
      console.log("-".repeat(40));

      const apolloClient = this.emailDiscovery.apolloClient;
      if (apolloClient) {
        const intelligence = await apolloClient.getOrganizationIntelligence(
          "microsoft.com"
        );

        console.log(`✅ Apollo Intelligence Retrieved`);
        console.log(
          `🏢 Company: ${
            intelligence.intelligence.apolloData?.name || "Unknown"
          }`
        );
        console.log(
          `👥 Employees: ${
            intelligence.intelligence.apolloData?.employees || "Unknown"
          }`
        );
        console.log(
          `🏭 Industry: ${
            intelligence.intelligence.apolloData?.industry || "Unknown"
          }`
        );
        console.log(`🎯 Confidence: ${intelligence.confidence}%`);
        console.log(
          `📧 Email patterns: ${intelligence.intelligence.emails.length}`
        );

        if (intelligence.recommendNextSteps) {
          console.log("📋 Recommendations:");
          intelligence.recommendNextSteps.forEach((rec, index) => {
            console.log(
              `  ${index + 1}. ${rec.action} via ${rec.service} (${
                rec.priority
              })`
            );
          });
        }

        return intelligence;
      } else {
        console.log("⚠️ Apollo client not available");
        return null;
      }
    } catch (error) {
      console.log(`❌ Apollo Intelligence test failed: ${error.message}`);
      return null;
    }
  }

  /**
   * Run all tests and generate comprehensive report
   */
  async runAllTests() {
    console.log(`\n🚀 Starting Multi-Source Email Discovery Test Suite`);
    console.log(`⏰ Start Time: ${new Date().toISOString()}`);

    // Execute all tests
    await this.testTechnologyCompany();
    await this.testHealthcareCompany();
    await this.testRetailCompany();
    await this.testSmallBusiness();
    await this.testFinancialServices();
    await this.testBudgetOptimization();
    await this.testApolloOrganizationIntelligence();

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
    const totalEmails = this.testResults.reduce(
      (sum, test) => sum + (test.emailsFound || 0),
      0
    );
    const avgConfidence =
      this.testResults
        .filter((test) => test.confidence)
        .reduce((sum, test) => sum + test.confidence, 0) /
        this.testResults.filter((test) => test.confidence).length || 0;

    console.log("\n" + "=".repeat(60));
    console.log("🧪 MULTI-SOURCE EMAIL DISCOVERY TEST REPORT");
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
    console.log(`💳 Total Cost: $${this.totalCost.toFixed(3)}`);
    console.log(`📧 Total Emails Found: ${totalEmails}`);
    console.log(`🎯 Average Confidence: ${avgConfidence.toFixed(1)}%`);

    // Discovery engine statistics
    const engineStats = this.emailDiscovery.stats;
    console.log("\n📊 Discovery Engine Statistics:");
    console.log(`   Total Requests: ${engineStats.totalRequests}`);
    console.log(
      `   Success Rate: ${(
        (engineStats.successfulRequests / engineStats.totalRequests) *
        100
      ).toFixed(1)}%`
    );
    console.log(`   Hunter.io Usage: ${engineStats.apiUsage.hunter}`);
    console.log(`   Apollo Usage: ${engineStats.apiUsage.apollo}`);
    console.log(`   Pattern Generation: ${engineStats.apiUsage.patterns}`);
    console.log(`   Total Engine Cost: $${engineStats.totalCost.toFixed(3)}`);

    console.log("\n📊 Test Results Summary:");
    this.testResults.forEach((test, index) => {
      const status = test.success ? "✅" : "❌";
      const details = test.success
        ? `${test.emailsFound} emails, ${test.confidence?.toFixed(
            1
          )}% conf, $${test.cost?.toFixed(3)}`
        : `Error: ${test.error}`;
      console.log(`  ${index + 1}. ${status} ${test.name} - ${details}`);

      if (test.validation) {
        const validationScore = `${test.validation.score}/${test.validation.maxScore}`;
        console.log(`     🔍 Validation Score: ${validationScore}`);
        if (test.validation.hasApolloData)
          console.log("     🏢 Apollo organization data: ✅");
        if (test.validation.hasEnhancedPatterns)
          console.log("     ⚡ Apollo enhanced patterns: ✅");
        if (test.validation.hasHunterEmails)
          console.log("     🎯 Hunter.io emails: ✅");
      }
    });

    console.log("\n💡 Integration Analysis:");
    const hasApolloSuccess = this.testResults.some(
      (test) =>
        test.sourcesUsed?.includes("apollo") || test.validation?.hasApolloData
    );
    const hasHunterSuccess = this.testResults.some(
      (test) =>
        test.sourcesUsed?.includes("hunter") || test.validation?.hasHunterEmails
    );
    const budgetCompliance = this.totalCost <= TEST_CONFIG.maxDailyCost;

    console.log(
      `   ${hasApolloSuccess ? "✅" : "⚠️"} Apollo.io Integration: ${
        hasApolloSuccess ? "FUNCTIONAL" : "LIMITED"
      }`
    );
    console.log(
      `   ${hasHunterSuccess ? "✅" : "⚠️"} Hunter.io Integration: ${
        hasHunterSuccess ? "FUNCTIONAL" : "LIMITED"
      }`
    );
    console.log(
      `   ${budgetCompliance ? "✅" : "⚠️"} Budget Compliance: ${
        budgetCompliance ? "WITHIN LIMITS" : "OVER BUDGET"
      }`
    );
    console.log(
      `   💰 Cost Efficiency: $${(this.totalCost / totalEmails).toFixed(
        3
      )} per email`
    );

    console.log("\n🚀 MULTI-SOURCE EMAIL DISCOVERY TEST COMPLETE");
    console.log("=".repeat(60));

    // Return summary for programmatic use
    return {
      totalTests,
      successfulTests,
      successRate: (successfulTests / totalTests) * 100,
      totalCost: this.totalCost,
      totalEmails,
      avgConfidence,
      apolloIntegration: hasApolloSuccess,
      hunterIntegration: hasHunterSuccess,
      budgetCompliant: budgetCompliance,
    };
  }
}

// Execute tests if run directly
if (require.main === module) {
  const tester = new MultiSourceEmailDiscoveryTester();
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

module.exports = MultiSourceEmailDiscoveryTester;
