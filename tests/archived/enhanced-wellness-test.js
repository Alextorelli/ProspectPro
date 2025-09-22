#!/usr/bin/env node

/**
 * Enhanced San Diego Wellness Business Test with Quality Requirements
 * Uses Enhanced Discovery Engine v2.0 with iterative quality-focused lead generation
 * Ensures we get qualified leads with complete contact information
 */

process.env.SKIP_AUTH_IN_DEV = "true";

const EnhancedDiscoveryEngine = require("./modules/enhanced-discovery-engine");
const CampaignLogger = require("./modules/logging/campaign-logger");

async function runEnhancedWellnessTest() {
  console.log("🌿 ProspectPro v2.0 Enhanced Wellness Business Test");
  console.log("🚀 Using Enhanced Discovery Engine v2.0");
  console.log(
    "🎯 Requirement: Find qualified leads with complete contact info"
  );
  console.log("📋 Must have: Business name, address, phone, website, email");
  console.log("🔄 Iterative discovery until requirements met");
  console.log("=".repeat(70));

  try {
    // Initialize API keys
    const apiKeys = {
      googlePlaces: process.env.GOOGLE_PLACES_API_KEY,
      foursquare:
        process.env.FOURSQUARE_SERVICE_API_KEY ||
        process.env.FOURSQUARE_PLACES_API_KEY,
      hunterIO: process.env.HUNTER_IO_API_KEY,
      neverBounce: process.env.NEVERBOUNCE_API_KEY,
      zeroBounce: process.env.ZEROBOUNCE_API_KEY,
      scrapingdog: process.env.SCRAPINGDOG_API_KEY,
    };

    console.log("🔑 API Configuration Check:");
    Object.entries(apiKeys).forEach(([key, value]) => {
      console.log(`   ${key}: ${value ? "✅ Configured" : "❌ Missing"}`);
    });
    console.log("");

    // Initialize Enhanced Discovery Engine v2.0
    const discoveryEngine = new EnhancedDiscoveryEngine(apiKeys);
    const campaignLogger = new CampaignLogger();

    // Test configuration
    const testConfig = {
      businessType: "wellness center",
      location: "San Diego, CA",
      targetCount: 3,
      budgetLimit: 10,
      requireCompleteContacts: true,
      minConfidenceScore: 70,
    };

    console.log("📊 Test Configuration:");
    console.log(`   Business Type: ${testConfig.businessType}`);
    console.log(`   Location: ${testConfig.location}`);
    console.log(`   Target Leads: ${testConfig.targetCount}`);
    console.log(`   Budget Limit: $${testConfig.budgetLimit}`);
    console.log(
      `   Complete Contacts Required: ${testConfig.requireCompleteContacts}`
    );
    console.log(`   Minimum Confidence: ${testConfig.minConfidenceScore}%`);
    console.log("");

    const startTime = Date.now();

    // Generate campaign ID for tracking
    const campaignId = `wellness_test_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    console.log(`🆔 Campaign ID: ${campaignId}`);
    console.log("🚀 Starting Enhanced Discovery Engine v2.0...");
    console.log("");

    // Use Enhanced Discovery Engine v2.0 for iterative quality-focused discovery
    const discoveryResult = await discoveryEngine.discoverQualifiedLeads(
      testConfig
    );

    const processingTime = Date.now() - startTime;

    // Log successful campaign completion using available method
    const wellnessCampaignData = {
      campaignId,
      businessType: testConfig.businessType,
      location: testConfig.location,
      targetCount: testConfig.targetCount,
      businesses: discoveryResult.qualified.map((lead) => ({
        name: lead.businessName,
        address: lead.address,
        phone: lead.phone,
        website: lead.website,
        email: lead.email,
        confidenceScore: lead.confidenceScore,
        qualityGrade:
          lead.confidenceScore >= 80
            ? "A"
            : lead.confidenceScore >= 70
            ? "B"
            : lead.confidenceScore >= 60
            ? "C"
            : "D",
      })),
      estimatedCost: discoveryResult.totalCost,
      duration: processingTime,
    };

    campaignLogger.logCampaignResults(wellnessCampaignData).catch((err) => {
      console.warn("Wellness test campaign logging failed:", err.message);
    });

    console.log("🎉 Discovery Complete!");
    console.log("=".repeat(50));
    console.log(`📊 RESULTS SUMMARY:`);
    console.log(
      `   Qualified Leads Found: ${discoveryResult.qualified.length}`
    );
    console.log(`   Total Businesses Processed: ${discoveryResult.totalFound}`);
    console.log(
      `   Qualification Rate: ${(
        (discoveryResult.qualified.length / discoveryResult.totalFound) *
        100
      ).toFixed(1)}%`
    );
    console.log(`   Average Confidence: ${discoveryResult.averageConfidence}%`);
    console.log(`   Total Cost: $${discoveryResult.totalCost.toFixed(4)}`);
    console.log(`   Cost per Lead: $${discoveryResult.costPerLead.toFixed(4)}`);
    console.log(`   Processing Time: ${(processingTime / 1000).toFixed(1)}s`);
    console.log(
      `   Iterations Completed: ${discoveryResult.iterationsCompleted}`
    );
    console.log("");

    // Validate complete contact requirements
    let contactValidation = {
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

    console.log("📞 CONTACT COMPLETENESS VALIDATION:");
    console.log(
      `   📧 With Email: ${contactValidation.withEmail}/${
        discoveryResult.qualified.length
      } (${(
        (contactValidation.withEmail / discoveryResult.qualified.length) *
        100
      ).toFixed(1)}%)`
    );
    console.log(
      `   📱 With Phone: ${contactValidation.withPhone}/${
        discoveryResult.qualified.length
      } (${(
        (contactValidation.withPhone / discoveryResult.qualified.length) *
        100
      ).toFixed(1)}%)`
    );
    console.log(
      `   🌐 With Website: ${contactValidation.withWebsite}/${
        discoveryResult.qualified.length
      } (${(
        (contactValidation.withWebsite / discoveryResult.qualified.length) *
        100
      ).toFixed(1)}%)`
    );
    console.log(
      `   ✅ Complete Contacts: ${contactValidation.completeContacts}/${
        discoveryResult.qualified.length
      } (${(
        (contactValidation.completeContacts /
          discoveryResult.qualified.length) *
        100
      ).toFixed(1)}%)`
    );
    console.log("");

    // Display detailed results for each qualified lead
    console.log("📋 QUALIFIED LEADS DETAILED BREAKDOWN:");
    console.log("=".repeat(50));

    discoveryResult.qualified.forEach((lead, index) => {
      console.log(`\n🏢 Lead ${index + 1}: ${lead.businessName}`);
      console.log(`📍 Address: ${lead.address}`);
      console.log(`📞 Phone: ${lead.phone || "❌ Missing"}`);
      console.log(`🌐 Website: ${lead.website || "❌ Missing"}`);
      console.log(`📧 Email: ${lead.email || "❌ Missing"}`);
      console.log(`🎯 Confidence Score: ${lead.confidenceScore}%`);
      console.log(`📊 Pre-validation Score: ${lead.preValidationScore}%`);
      console.log(`📈 Data Completeness: ${lead.dataCompleteness}%`);
      if (lead.sources) {
        console.log(`🔗 Sources: ${lead.sources.join(", ")}`);
      }

      // Quality indicators
      const hasCompleteContacts = lead.email && lead.phone && lead.website;
      console.log(
        `✅ Quality Status: ${
          hasCompleteContacts ? "COMPLETE CONTACT INFO" : "INCOMPLETE"
        }`
      );
    });

    console.log("");
    console.log("=".repeat(70));

    // Final validation
    const success =
      discoveryResult.qualified.length >= testConfig.targetCount &&
      contactValidation.completeContacts >= testConfig.targetCount;

    if (success) {
      console.log("🎊 TEST PASSED!");
      console.log(
        `✅ Found ${discoveryResult.qualified.length}/${testConfig.targetCount} qualified leads`
      );
      console.log(
        `✅ Complete contact info: ${contactValidation.completeContacts}/${testConfig.targetCount} leads`
      );
      console.log(
        `💰 Cost efficiency: $${discoveryResult.costPerLead.toFixed(
          4
        )} per lead`
      );
      console.log("🚀 Enhanced Discovery Engine v2.0 is working perfectly!");
    } else {
      console.log("❌ TEST FAILED");
      console.log(
        `❌ Found ${discoveryResult.qualified.length}/${testConfig.targetCount} qualified leads`
      );
      console.log(
        `❌ Complete contact info: ${contactValidation.completeContacts}/${testConfig.targetCount} leads`
      );
      console.log("⚠️ Need to adjust search parameters or quality thresholds");
    }

    return {
      success,
      leadsFound: discoveryResult.qualified.length,
      targetLeads: testConfig.targetCount,
      completeContacts: contactValidation.completeContacts,
      totalCost: discoveryResult.totalCost,
      processingTime: processingTime / 1000,
      campaignId,
    };
  } catch (error) {
    console.error("❌ Enhanced Wellness Test Failed:");
    console.error("Error:", error.message);
    console.error("Stack:", error.stack);

    return {
      success: false,
      error: error.message,
      leadsFound: 0,
      targetLeads: 3,
      completeContacts: 0,
      totalCost: 0,
      processingTime: 0,
    };
  }
}

// Run test if called directly
if (require.main === module) {
  runEnhancedWellnessTest()
    .then((result) => {
      if (result.success) {
        console.log("\n🎉 Enhanced Wellness Test completed successfully!");
        process.exit(0);
      } else {
        console.log("\n💥 Enhanced Wellness Test failed!");
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error("💥 Test execution failed:", error);
      process.exit(1);
    });
}

module.exports = runEnhancedWellnessTest;
