#!/usr/bin/env node

/**
 * Enhanced San Diego Wellness Business Test with Quality Requirements
 * Ensures we get qualified leads with complete contact information
 */

process.env.SKIP_AUTH_IN_DEV = "true";

const GooglePlacesClient = require("./modules/api-clients/google-places");
const EnhancedLeadDiscovery = require("./modules/enhanced-lead-discovery");
const CampaignCSVExporter = require("./modules/campaign-csv-exporter");

async function runEnhancedWellnessTest() {
  console.log("🌿 ProspectPro v2.0 Enhanced Wellness Business Test");
  console.log(
    "🎯 Requirement: Find qualified leads with complete contact info"
  );
  console.log("📋 Must have: Business name, address, phone, website, email");
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

    const googleClient = new GooglePlacesClient(apiKeys.googlePlaces);
    const enhancedDiscovery = new EnhancedLeadDiscovery(apiKeys);
    const csvExporter = new CampaignCSVExporter();

    // Initialize campaign
    const campaignId = csvExporter.generateCampaignId();
    csvExporter.initializeCampaign(campaignId, {
      name: "Enhanced San Diego Wellness Quality Test",
      description:
        "Quality-focused test ensuring complete contact information for all leads",
    });

    console.log(`📋 Campaign ID: ${campaignId}`);
    console.log(
      "🔍 Starting iterative search for qualified wellness businesses..."
    );

    const startTime = Date.now();
    let allQualifiedLeads = [];
    let totalProcessed = 0;
    let totalCost = 0;
    const targetQualifiedLeads = 3; // We want 3 qualified leads minimum
    const maxAttempts = 5; // Safety limit

    // Different search queries to try
    const searchQueries = [
      "wellness center spa San Diego California",
      "massage therapy clinic San Diego CA",
      "day spa wellness San Diego",
      "holistic wellness center San Diego",
      "medical spa San Diego California",
    ];

    let currentQueryIndex = 0;
    let attemptCount = 0;

    while (
      allQualifiedLeads.length < targetQualifiedLeads &&
      attemptCount < maxAttempts &&
      currentQueryIndex < searchQueries.length
    ) {
      attemptCount++;
      const currentQuery = searchQueries[currentQueryIndex];

      console.log(`\n🔍 Search Attempt ${attemptCount}: "${currentQuery}"`);

      // Search for wellness businesses
      const searchResults = await googleClient.textSearch({
        query: currentQuery,
        type: "health",
      });

      if (!searchResults || searchResults.length === 0) {
        console.log(`   ⚠️ No results found for query: ${currentQuery}`);
        currentQueryIndex++;
        continue;
      }

      console.log(`   ✅ Found ${searchResults.length} potential businesses`);

      // Enhanced discovery options focused on quality
      const discoveryOptions = {
        budgetLimit: 5.0, // Higher budget to allow thorough processing
        qualityThreshold: 70, // Require 70% minimum confidence
        maxResults: Math.min(10, searchResults.length), // Process up to 10 businesses per query
        prioritizeLocalBusinesses: true,
        enablePropertyIntelligence: true,
        enableRegistryValidation: true,
        enableRealTimeFeedback: true,
        // New options for quality focus
        requireEmail: true, // Must have email for qualification
        requireWebsite: true, // Must have accessible website
        minimumPreValidationScore: 60, // Higher pre-validation threshold
      };

      console.log(
        `   📊 Processing up to ${discoveryOptions.maxResults} businesses with 70% quality threshold`
      );

      const enhancedResults = await enhancedDiscovery.discoverAndValidateLeads(
        searchResults,
        discoveryOptions
      );

      totalProcessed += enhancedResults.totalProcessed;
      totalCost += enhancedResults.totalCost;

      console.log(
        `   📈 Results: ${enhancedResults.leads.length} qualified from ${enhancedResults.totalProcessed} processed`
      );
      console.log(`   💰 Query cost: $${enhancedResults.totalCost.toFixed(3)}`);

      // Filter for truly qualified leads (complete contact info)
      const trulyQualifiedLeads = enhancedResults.leads.filter((lead) => {
        const hasName = !!(lead.name || lead.businessName);
        const hasAddress = !!(lead.address || lead.formatted_address);
        const hasPhone = !!(lead.phone || lead.companyPhone);
        const hasWebsite = !!lead.website;
        const hasEmail = !!(lead.email || lead.companyEmail);
        const hasConfidence =
          (lead.finalConfidenceScore || lead.confidenceScore) >= 70;

        return (
          hasName &&
          hasAddress &&
          hasPhone &&
          hasWebsite &&
          hasEmail &&
          hasConfidence
        );
      });

      console.log(
        `   🎯 Truly qualified leads (complete info): ${trulyQualifiedLeads.length}`
      );

      // Add qualified leads that we don't already have (avoid duplicates)
      const newLeads = trulyQualifiedLeads.filter((newLead) => {
        return !allQualifiedLeads.some(
          (existingLead) =>
            (existingLead.name || existingLead.businessName) ===
              (newLead.name || newLead.businessName) ||
            (existingLead.phone || existingLead.companyPhone) ===
              (newLead.phone || newLead.companyPhone)
        );
      });

      allQualifiedLeads = [...allQualifiedLeads, ...newLeads];
      console.log(
        `   📊 Running total qualified leads: ${allQualifiedLeads.length}/${targetQualifiedLeads}`
      );

      if (allQualifiedLeads.length >= targetQualifiedLeads) {
        console.log(
          `   🎉 Target reached! Found ${allQualifiedLeads.length} qualified leads`
        );
        break;
      }

      // Move to next query if current didn't yield enough results
      if (trulyQualifiedLeads.length === 0) {
        currentQueryIndex++;
        console.log(`   ⏭️ Moving to next search query...`);
      }
    }

    const processingTime = Date.now() - startTime;

    console.log("\n" + "=".repeat(70));
    console.log("📊 ENHANCED WELLNESS DISCOVERY RESULTS");
    console.log("=".repeat(70));
    console.log(`🎯 Target Qualified Leads: ${targetQualifiedLeads}`);
    console.log(`✅ Actual Qualified Leads: ${allQualifiedLeads.length}`);
    console.log(`📈 Total Businesses Processed: ${totalProcessed}`);
    console.log(`💰 Total Discovery Cost: $${totalCost.toFixed(3)}`);
    console.log(
      `⏱️ Total Processing Time: ${(processingTime / 1000).toFixed(1)}s`
    );
    console.log(
      `🔍 Search Queries Used: ${currentQueryIndex + 1}/${searchQueries.length}`
    );
    console.log(
      `📊 Success Rate: ${(
        (allQualifiedLeads.length / totalProcessed) *
        100
      ).toFixed(1)}%`
    );

    if (allQualifiedLeads.length === 0) {
      throw new Error(
        "❌ No qualified wellness leads found meeting complete contact requirements"
      );
    }

    // Display qualified leads
    console.log("\n🎯 QUALIFIED WELLNESS LEADS (Complete Contact Info):");
    console.log("=".repeat(60));

    allQualifiedLeads.forEach((lead, index) => {
      console.log(`${index + 1}. ${lead.name || lead.businessName}`);
      console.log(
        `   📊 Confidence: ${(
          lead.finalConfidenceScore || lead.confidenceScore
        ).toFixed(1)}%`
      );
      console.log(`   📍 Address: ${lead.address || lead.formatted_address}`);
      console.log(`   📞 Phone: ${lead.phone || lead.companyPhone}`);
      console.log(`   🌐 Website: ${lead.website}`);
      console.log(`   📧 Email: ${lead.email || lead.companyEmail}`);
      console.log(
        `   🗺️ Foursquare: ${lead.foursquareData ? "✅ Enhanced" : "❌ Basic"}`
      );
      console.log(`   ⭐ Rating: ${lead.rating || lead.googleRating}/5`);
      console.log(`   💰 Cost: $${(lead.apiCost || 0).toFixed(3)}`);
      console.log("");
    });

    // Quality validation
    const qualityMetrics = {
      allHaveEmail: allQualifiedLeads.every(
        (lead) => !!(lead.email || lead.companyEmail)
      ),
      allHavePhone: allQualifiedLeads.every(
        (lead) => !!(lead.phone || lead.companyPhone)
      ),
      allHaveWebsite: allQualifiedLeads.every((lead) => !!lead.website),
      avgConfidence:
        allQualifiedLeads.reduce(
          (sum, lead) =>
            sum + (lead.finalConfidenceScore || lead.confidenceScore),
          0
        ) / allQualifiedLeads.length,
    };

    console.log("🔍 QUALITY VALIDATION RESULTS:");
    console.log(
      `   📧 All have email: ${qualityMetrics.allHaveEmail ? "✅" : "❌"}`
    );
    console.log(
      `   📞 All have phone: ${qualityMetrics.allHavePhone ? "✅" : "❌"}`
    );
    console.log(
      `   🌐 All have website: ${qualityMetrics.allHaveWebsite ? "✅" : "❌"}`
    );
    console.log(
      `   📊 Average confidence: ${qualityMetrics.avgConfidence.toFixed(1)}%`
    );
    console.log("");

    // Add to campaign and export
    console.log("📊 Adding qualified leads to campaign...");

    csvExporter.addQueryResults(
      "enhanced wellness discovery",
      "San Diego, CA",
      allQualifiedLeads,
      {
        totalResults: allQualifiedLeads.length,
        qualifiedLeads: allQualifiedLeads.length,
        totalCost: totalCost,
        processingTimeMs: processingTime,
        averageConfidence: qualityMetrics.avgConfidence,
        qualityMetrics: qualityMetrics,
        searchQueriesUsed: currentQueryIndex + 1,
        successRate: (allQualifiedLeads.length / totalProcessed) * 100,
      }
    );

    console.log("📤 Exporting enhanced campaign to CSV...");
    const csvPath = await csvExporter.exportCampaignToCsv();

    console.log("");
    console.log("✅ ENHANCED WELLNESS TEST COMPLETED:");
    console.log("=".repeat(60));
    console.log(`📁 CSV Export: ${csvPath}`);
    console.log(
      `🎯 Qualified Leads: ${allQualifiedLeads.length}/${targetQualifiedLeads}`
    );
    console.log(
      `💰 Cost per Lead: $${(totalCost / allQualifiedLeads.length).toFixed(3)}`
    );
    console.log(
      `⏱️ Time per Lead: ${(
        processingTime /
        1000 /
        allQualifiedLeads.length
      ).toFixed(1)}s`
    );
    console.log(
      `📊 Overall Quality Score: ${qualityMetrics.avgConfidence.toFixed(1)}%`
    );

    const allQualityCriteriaMet =
      qualityMetrics.allHaveEmail &&
      qualityMetrics.allHavePhone &&
      qualityMetrics.allHaveWebsite &&
      allQualifiedLeads.length >= targetQualifiedLeads;

    if (allQualityCriteriaMet) {
      console.log("🎉 SUCCESS: All quality requirements met!");
      console.log("✅ Ready for production deployment");
      return {
        success: true,
        qualifiedLeads: allQualifiedLeads.length,
        targetMet: true,
        avgQuality: qualityMetrics.avgConfidence,
        csvPath: csvPath,
      };
    } else {
      console.log("⚠️ PARTIAL SUCCESS: Some quality requirements not met");
      return {
        success: false,
        qualifiedLeads: allQualifiedLeads.length,
        targetMet: allQualifiedLeads.length >= targetQualifiedLeads,
        avgQuality: qualityMetrics.avgConfidence,
      };
    }
  } catch (error) {
    console.error(`❌ Enhanced wellness test failed: ${error.message}`);
    if (error.stack) {
      console.error(
        "📋 Stack trace:",
        error.stack.split("\n").slice(0, 5).join("\n")
      );
    }
    throw error;
  }
}

if (require.main === module) {
  runEnhancedWellnessTest()
    .then((result) => {
      process.exit(result.success ? 0 : 1);
    })
    .catch(() => {
      process.exit(1);
    });
}

module.exports = { runEnhancedWellnessTest };
