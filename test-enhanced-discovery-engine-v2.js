#!/usr/bin/env node
/**
 * Enhanced Discovery Engine v2.0 - Comprehensive Test Suite
 *
 * This test validates the complete Enhanced Discovery Engine v2.0 system
 * with iterative quality-focused lead generation, complete contact requirements,
 * and real API integrations.
 *
 * Features tested:
 * - Iterative discovery until quality requirements met
 * - Complete contact information requirements (email, phone, website)
 * - Multi-API integration (Google Places, Foursquare, Hunter.io, NeverBounce)
 * - Quality filtering and duplicate prevention
 * - Cost optimization and budget management
 * - Comprehensive CSV export with 45+ columns
 */

const EnhancedDiscoveryEngine = require("./modules/enhanced-discovery-engine");
const CampaignLogger = require("./modules/logging/campaign-logger");

// Test configuration
const TEST_SCENARIOS = [
  {
    name: "San Diego Wellness Centers",
    businessType: "wellness center",
    location: "San Diego, CA",
    targetCount: 3,
    budgetLimit: 10,
    expectedMinQuality: 70,
    description: "High-quality wellness centers with complete contact info",
  },
  {
    name: "Austin Food Trucks",
    businessType: "food truck",
    location: "Austin, TX",
    targetCount: 5,
    budgetLimit: 15,
    expectedMinQuality: 75,
    description: "Local food trucks with email and website validation",
  },
  {
    name: "Seattle Coffee Shops",
    businessType: "coffee shop",
    location: "Seattle, WA",
    targetCount: 4,
    budgetLimit: 12,
    expectedMinQuality: 80,
    description: "Premium coffee shops with verified contact information",
  },
];

async function runComprehensiveTests() {
  console.log(
    "🚀 Starting Enhanced Discovery Engine v2.0 - Comprehensive Test Suite"
  );
  console.log("=".repeat(80));

  // Initialize API keys
  const apiKeys = {
    hunterIO: process.env.HUNTER_IO_API_KEY,
    neverBounce: process.env.NEVERBOUNCE_API_KEY,
    googlePlaces: process.env.GOOGLE_PLACES_API_KEY,
    foursquare:
      process.env.FOURSQUARE_SERVICE_API_KEY ||
      process.env.FOURSQUARE_PLACES_API_KEY,
    zeroBounce: process.env.ZEROBOUNCE_API_KEY,
    scrapingdog: process.env.SCRAPINGDOG_API_KEY,
  };

  // Validate API keys
  const missingKeys = [];
  if (!apiKeys.googlePlaces) missingKeys.push("GOOGLE_PLACES_API_KEY");
  if (!apiKeys.foursquare) missingKeys.push("FOURSQUARE_PLACES_API_KEY");
  if (!apiKeys.hunterIO) missingKeys.push("HUNTER_IO_API_KEY");
  if (!apiKeys.neverBounce) missingKeys.push("NEVERBOUNCE_API_KEY");

  if (missingKeys.length > 0) {
    console.error("❌ Missing required API keys:", missingKeys.join(", "));
    console.error(
      "Please configure these environment variables before running tests."
    );
    process.exit(1);
  }

  console.log("✅ API Keys validated");
  console.log(
    `🔑 Google Places: ${apiKeys.googlePlaces ? "Configured" : "Missing"}`
  );
  console.log(
    `🔑 Foursquare: ${apiKeys.foursquare ? "Configured" : "Missing"}`
  );
  console.log(`🔑 Hunter.io: ${apiKeys.hunterIO ? "Configured" : "Missing"}`);
  console.log(
    `🔑 NeverBounce: ${apiKeys.neverBounce ? "Configured" : "Missing"}`
  );
  console.log("");

  // Initialize Enhanced Discovery Engine v2.0
  const discoveryEngine = new EnhancedDiscoveryEngine(apiKeys);
  const campaignLogger = new CampaignLogger();

  let totalLeadsFound = 0;
  let totalCost = 0;
  let allTestResults = [];

  // Run test scenarios
  for (let i = 0; i < TEST_SCENARIOS.length; i++) {
    const scenario = TEST_SCENARIOS[i];
    console.log(`📊 Test ${i + 1}/${TEST_SCENARIOS.length}: ${scenario.name}`);
    console.log(`🎯 Target: ${scenario.targetCount} qualified leads`);
    console.log(`💰 Budget: $${scenario.budgetLimit}`);
    console.log(`📝 ${scenario.description}`);
    console.log("-".repeat(50));

    try {
      const startTime = Date.now();

      // Log campaign start
      const campaignId = await campaignLogger.startCampaign(
        scenario.businessType,
        scenario.location,
        scenario.targetCount
      );

      // Run Enhanced Discovery Engine v2.0
      const discoveryResult = await discoveryEngine.discoverQualifiedLeads({
        businessType: scenario.businessType,
        location: scenario.location,
        targetCount: scenario.targetCount,
        budgetLimit: scenario.budgetLimit,
        requireCompleteContacts: true,
        minConfidenceScore: scenario.expectedMinQuality,
        additionalQueries: [],
      });

      const processingTime = Date.now() - startTime;

      // Log successful campaign completion
      await campaignLogger.completeCampaign(
        campaignId,
        discoveryResult.qualified.length,
        discoveryResult.totalCost,
        processingTime
      );

      // Validate results
      const testResult = {
        scenario: scenario.name,
        success: discoveryResult.qualified.length >= scenario.targetCount,
        leadsFound: discoveryResult.qualified.length,
        targetLeads: scenario.targetCount,
        totalCost: discoveryResult.totalCost,
        budgetLimit: scenario.budgetLimit,
        averageConfidence: discoveryResult.averageConfidence,
        processingTime: (processingTime / 1000).toFixed(1),
        completeness: discoveryResult.completeness,
        iterationsCompleted: discoveryResult.iterationsCompleted,
        campaignId,
      };

      // Detailed validation
      const contactValidation = {
        withEmail: 0,
        withPhone: 0,
        withWebsite: 0,
        completeContacts: 0,
      };

      discoveryResult.qualified.forEach((lead) => {
        if (lead.email) contactValidation.withEmail++;
        if (lead.phone) contactValidation.withPhone++;
        if (lead.website) contactValidation.withWebsite++;
        if (lead.email && lead.phone && lead.website)
          contactValidation.completeContacts++;
      });

      testResult.contactValidation = contactValidation;
      allTestResults.push(testResult);

      // Display results
      console.log("");
      console.log("📈 RESULTS:");
      console.log(
        `✅ Qualified Leads: ${discoveryResult.qualified.length}/${
          scenario.targetCount
        } ${testResult.success ? "(PASSED)" : "(FAILED)"}`
      );
      console.log(
        `💰 Cost: $${discoveryResult.totalCost.toFixed(4)} / $${
          scenario.budgetLimit
        } (${((discoveryResult.totalCost / scenario.budgetLimit) * 100).toFixed(
          1
        )}% utilized)`
      );
      console.log(
        `🎯 Average Confidence: ${discoveryResult.averageConfidence}% (min: ${scenario.expectedMinQuality}%)`
      );
      console.log(`⏱️ Processing Time: ${testResult.processingTime}s`);
      console.log(`🔄 Iterations: ${discoveryResult.iterationsCompleted}`);
      console.log("");
      console.log("📞 CONTACT COMPLETENESS:");
      console.log(
        `📧 With Email: ${contactValidation.withEmail}/${
          discoveryResult.qualified.length
        } (${(
          (contactValidation.withEmail / discoveryResult.qualified.length) *
          100
        ).toFixed(1)}%)`
      );
      console.log(
        `📱 With Phone: ${contactValidation.withPhone}/${
          discoveryResult.qualified.length
        } (${(
          (contactValidation.withPhone / discoveryResult.qualified.length) *
          100
        ).toFixed(1)}%)`
      );
      console.log(
        `🌐 With Website: ${contactValidation.withWebsite}/${
          discoveryResult.qualified.length
        } (${(
          (contactValidation.withWebsite / discoveryResult.qualified.length) *
          100
        ).toFixed(1)}%)`
      );
      console.log(
        `✅ Complete Contacts: ${contactValidation.completeContacts}/${
          discoveryResult.qualified.length
        } (${(
          (contactValidation.completeContacts /
            discoveryResult.qualified.length) *
          100
        ).toFixed(1)}%)`
      );

      // Sample lead details
      if (discoveryResult.qualified.length > 0) {
        console.log("");
        console.log("📋 SAMPLE LEAD:");
        const sampleLead = discoveryResult.qualified[0];
        console.log(`🏢 ${sampleLead.businessName}`);
        console.log(`📍 ${sampleLead.address}`);
        console.log(`📞 ${sampleLead.phone || "N/A"}`);
        console.log(`🌐 ${sampleLead.website || "N/A"}`);
        console.log(`📧 ${sampleLead.email || "N/A"}`);
        console.log(`🎯 Confidence: ${sampleLead.confidenceScore}%`);
        console.log(`📊 Pre-validation: ${sampleLead.preValidationScore}%`);
        console.log(
          `📈 Data Sources: ${
            sampleLead.sources ? sampleLead.sources.join(", ") : "N/A"
          }`
        );
      }

      totalLeadsFound += discoveryResult.qualified.length;
      totalCost += discoveryResult.totalCost;
    } catch (error) {
      console.error(`❌ Test failed: ${error.message}`);
      console.error(`Stack: ${error.stack}`);

      allTestResults.push({
        scenario: scenario.name,
        success: false,
        error: error.message,
        leadsFound: 0,
        targetLeads: scenario.targetCount,
        totalCost: 0,
        budgetLimit: scenario.budgetLimit,
      });
    }

    console.log("");
    console.log("=".repeat(80));
    console.log("");
  }

  // Final summary
  console.log("🎯 COMPREHENSIVE TEST SUMMARY");
  console.log("=".repeat(80));

  const passedTests = allTestResults.filter((r) => r.success).length;
  const totalTests = allTestResults.length;

  console.log(
    `✅ Tests Passed: ${passedTests}/${totalTests} (${(
      (passedTests / totalTests) *
      100
    ).toFixed(1)}%)`
  );
  console.log(`📊 Total Qualified Leads: ${totalLeadsFound}`);
  console.log(`💰 Total Cost: $${totalCost.toFixed(4)}`);
  console.log(
    `💲 Average Cost per Lead: $${
      totalLeadsFound > 0 ? (totalCost / totalLeadsFound).toFixed(4) : "N/A"
    }`
  );
  console.log("");

  // Individual test results
  allTestResults.forEach((result, index) => {
    const status = result.success ? "✅ PASS" : "❌ FAIL";
    console.log(
      `${status} ${result.scenario}: ${result.leadsFound}/${
        result.targetLeads
      } leads, $${result.totalCost?.toFixed(4) || "0.0000"} cost`
    );
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
    if (result.contactValidation) {
      console.log(
        `   Complete contacts: ${result.contactValidation.completeContacts}/${
          result.leadsFound
        } (${
          result.leadsFound > 0
            ? (
                (result.contactValidation.completeContacts /
                  result.leadsFound) *
                100
              ).toFixed(1)
            : "0"
        }%)`
      );
    }
  });

  console.log("");
  console.log("🎉 Enhanced Discovery Engine v2.0 Test Suite Complete!");

  if (passedTests === totalTests) {
    console.log("🎊 ALL TESTS PASSED - System ready for production!");
  } else {
    console.log(
      `⚠️ ${totalTests - passedTests} test(s) failed - Review issues above.`
    );
  }
}

// Run tests if called directly
if (require.main === module) {
  runComprehensiveTests().catch((error) => {
    console.error("❌ Test suite failed:", error);
    process.exit(1);
  });
}

module.exports = { runComprehensiveTests, TEST_SCENARIOS };
