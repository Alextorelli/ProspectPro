#!/usr/bin/env node

/**
 * Direct Test Campaign Script for ProspectPro v2.0
 * Executes test campaign for 3 high-quality verified leads
 */

process.env.SKIP_AUTH_IN_DEV = "true"; // Bypass authentication for testing

const EnhancedLeadDiscovery = require("./modules/enhanced-lead-discovery");
const CampaignCSVExporter = require("./modules/campaign-csv-exporter");

async function runTestCampaign() {
  console.log("🚀 Starting Test Campaign for 3 High-Quality Verified Leads");
  console.log("=".repeat(60));

  try {
    // Initialize discovery with API keys
    const apiKeys = {
      hunterIO: process.env.HUNTER_IO_API_KEY,
      neverBounce: process.env.NEVERBOUNCE_API_KEY,
      googlePlaces: process.env.GOOGLE_PLACES_API_KEY,
      zeroBounce: process.env.ZEROBOUNCE_API_KEY,
    };

    const enhancedDiscovery = new EnhancedLeadDiscovery(apiKeys);
    const csvExporter = new CampaignCSVExporter();

    // Start campaign
    const campaignId = csvExporter.generateCampaignId();
    csvExporter.initializeCampaign(campaignId, {
      name: "High-Quality Test Campaign",
      description:
        "Test campaign for 3 verified leads with comprehensive validation",
    });

    console.log(`📋 Campaign ID: ${campaignId}`);

    // Configure search parameters for high-quality leads
    const searchConfig = {
      businessType: "upscale restaurant",
      location: "Austin, TX",
      maxResults: 5, // Search more to get 3 high-quality
      budgetLimit: 2.0,
      minConfidenceScore: 85, // High quality threshold
      requireWebsite: true,
      requireEmail: true,
      searchRadius: 25000, // 25km radius
    };

    console.log("🔍 Search Configuration:");
    console.log(`   Business Type: ${searchConfig.businessType}`);
    console.log(`   Location: ${searchConfig.location}`);
    console.log(`   Min Quality Score: ${searchConfig.minConfidenceScore}%`);
    console.log(`   Requirements: Website + Email mandatory`);
    console.log("");

    // Initialize Google Places client for discovery
    const GooglePlacesClient = require("./modules/api-clients/google-places");
    const googlePlacesClient = new GooglePlacesClient(apiKeys.googlePlaces);

    // Execute discovery
    console.log("🔄 Executing business discovery...");
    const startTime = Date.now();

    // Step 1: Get businesses from Google Places
    const googleResults = await googlePlacesClient.textSearch({
      query: `${searchConfig.businessType} in ${searchConfig.location}`,
      type: "restaurant",
      location: searchConfig.location,
      radius: searchConfig.searchRadius || 25000,
    });

    if (!googleResults || googleResults.length === 0) {
      console.log("❌ No businesses found in Google Places");
      return;
    }

    console.log(
      `🔍 Found ${googleResults.length} businesses from Google Places`
    );

    // Step 2: Enhanced validation and discovery
    const discoveryOptions = {
      budgetLimit: searchConfig.budgetLimit,
      qualityThreshold: searchConfig.minConfidenceScore,
      maxResults: searchConfig.maxResults,
      prioritizeLocalBusinesses: true,
      enablePropertyIntelligence: true,
      enableRegistryValidation: true,
    };

    const results = await enhancedDiscovery.discoverAndValidateLeads(
      googleResults,
      discoveryOptions
    );

    const processingTime = Date.now() - startTime;

    console.log(
      `✅ Discovery completed in ${(processingTime / 1000).toFixed(1)}s`
    );
    console.log("");

    // Filter for highest quality leads
    const highQualityLeads = results
      .filter(
        (business) => business.isQualified && business.confidenceScore >= 85
      )
      .sort((a, b) => b.confidenceScore - a.confidenceScore)
      .slice(0, 3); // Top 3

    const totalCost = results.reduce(
      (sum, business) => sum + (business.apiCost || 0),
      0
    );

    if (highQualityLeads.length === 0) {
      console.log("❌ No leads found meeting high-quality criteria");
      return;
    }

    console.log(`📊 Campaign Results Summary:`);
    console.log(`   Total discovered: ${results.length}`);
    console.log(`   High-quality leads: ${highQualityLeads.length}`);
    console.log(
      `   Success rate: ${(
        (highQualityLeads.length / results.length) *
        100
      ).toFixed(1)}%`
    );
    console.log(`   Total cost: $${totalCost.toFixed(3)}`);
    console.log("");

    // Display lead details
    console.log("🎯 HIGH-QUALITY VERIFIED LEADS:");
    console.log("=".repeat(50));

    highQualityLeads.forEach((lead, index) => {
      console.log(`\n${index + 1}. ${lead.businessName || "N/A"}`);
      console.log(
        `   Quality Score: ${lead.confidenceScore}% (${lead.qualityGrade})`
      );
      console.log(`   Address: ${lead.address || "N/A"}`);
      console.log(`   Phone: ${lead.phone || "N/A"}`);
      console.log(`   Website: ${lead.website || "N/A"}`);
      console.log(`   Email: ${lead.email || "N/A"}`);

      if (lead.ownerName && lead.ownerName !== lead.businessName) {
        console.log(
          `   Owner: ${lead.ownerName} (${lead.ownerConfidence}% confidence)`
        );
        if (lead.ownerEmail) {
          console.log(`   Owner Email: ${lead.ownerEmail}`);
        }
        if (lead.ownerPhone && lead.ownerPhone !== lead.phone) {
          console.log(`   Owner Phone: ${lead.ownerPhone}`);
        }
      }

      // Validation details
      console.log(`   Validations:`);
      console.log(
        `     ✓ Business Name: ${
          lead.validation?.businessName?.isValid ? "Valid" : "Invalid"
        }`
      );
      console.log(
        `     ✓ Website Status: ${
          lead.validation?.website?.isValid ? "Active" : "Inactive"
        } (${lead.validation?.website?.httpStatus || "N/A"})`
      );
      console.log(
        `     ✓ Email Quality: ${
          lead.validation?.email?.isValid ? "Verified" : "Unverified"
        } (${lead.validation?.email?.confidence || 0}%)`
      );
    });

    // Add to campaign and export
    console.log("\n📤 Adding results to campaign and exporting...");

    csvExporter.addQueryResults(
      "upscale restaurant",
      "Austin, TX",
      highQualityLeads,
      {
        totalResults: highQualityLeads.length,
        qualifiedLeads: highQualityLeads.length,
        totalCost: totalCost,
        processingTimeMs: processingTime,
        averageConfidence:
          highQualityLeads.reduce(
            (sum, lead) => sum + lead.confidenceScore,
            0
          ) / highQualityLeads.length,
      }
    );

    // Export campaign
    const exportResults = await csvExporter.exportCampaignToCsv();

    console.log("\n✅ EXPORT COMPLETE");
    console.log(`📁 CSV File: ${exportResults}`);

    // Check if summary and analysis files were created
    const csvPath = exportResults;
    const summaryPath = csvPath.replace(".csv", "-summary.json");
    const analysisPath = csvPath.replace(".csv", "-analysis.json");

    try {
      const summaryExists = await require("fs")
        .promises.access(summaryPath)
        .then(() => true)
        .catch(() => false);
      const analysisExists = await require("fs")
        .promises.access(analysisPath)
        .then(() => true)
        .catch(() => false);

      if (summaryExists) console.log(`📋 Summary: ${summaryPath}`);
      if (analysisExists) console.log(`📊 Analysis: ${analysisPath}`);
    } catch (e) {
      // Files may not exist yet
    }

    // Final summary
    console.log("\n" + "=".repeat(60));
    console.log("🎉 TEST CAMPAIGN SUMMARY");
    console.log("=".repeat(60));
    console.log(
      `✅ High-Quality Leads Found: ${highQualityLeads.length}/3 requested`
    );
    console.log(
      `📊 Average Quality Score: ${(
        highQualityLeads.reduce((sum, lead) => sum + lead.confidenceScore, 0) /
        highQualityLeads.length
      ).toFixed(1)}%`
    );
    console.log(`💰 Total Campaign Cost: $${totalCost.toFixed(3)}`);
    console.log(
      `⏱️  Processing Time: ${(processingTime / 1000).toFixed(1)} seconds`
    );
    console.log(
      `📈 Cost per Lead: $${(totalCost / highQualityLeads.length).toFixed(3)}`
    );

    const websiteValid = highQualityLeads.filter(
      (lead) => lead.validation?.website?.isValid
    ).length;
    const emailValid = highQualityLeads.filter(
      (lead) => lead.validation?.email?.isValid
    ).length;
    const hasOwnerInfo = highQualityLeads.filter(
      (lead) => lead.ownerName && lead.ownerName !== lead.businessName
    ).length;

    console.log(
      `🌐 Websites Verified: ${websiteValid}/${highQualityLeads.length} (${(
        (websiteValid / highQualityLeads.length) *
        100
      ).toFixed(0)}%)`
    );
    console.log(
      `📧 Emails Verified: ${emailValid}/${highQualityLeads.length} (${(
        (emailValid / highQualityLeads.length) *
        100
      ).toFixed(0)}%)`
    );
    console.log(
      `👤 Owner Information: ${hasOwnerInfo}/${highQualityLeads.length} (${(
        (hasOwnerInfo / highQualityLeads.length) *
        100
      ).toFixed(0)}%)`
    );

    if (highQualityLeads.length >= 3) {
      console.log(
        "\n🎯 CAMPAIGN SUCCESS: 3 high-quality verified leads delivered!"
      );
    } else {
      console.log(
        `\n⚠️  PARTIAL SUCCESS: ${highQualityLeads.length}/3 leads met quality criteria`
      );
    }
  } catch (error) {
    console.error("❌ Campaign execution failed:", error.message);
    console.error("Stack trace:", error.stack);
    process.exit(1);
  }
}

// Execute test campaign
if (require.main === module) {
  runTestCampaign()
    .then(() => {
      console.log("\n🏁 Test campaign completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Fatal error:", error);
      process.exit(1);
    });
}

module.exports = { runTestCampaign };
