#!/usr/bin/env node

/**
 * Fixed Production Pipeline Test Campaign
 * Forces complete validation pipeline: Google Places → Foursquare → Hunter.io → NeverBounce
 */

process.env.SKIP_AUTH_IN_DEV = "true";

const EnhancedLeadDiscovery = require("./modules/enhanced-lead-discovery");
const GooglePlacesClient = require("./modules/api-clients/google-places");
const CampaignCSVExporter = require("./modules/campaign-csv-exporter");

async function runFullPipelineTest() {
  console.log("🚀 ProspectPro v2.0 Full Pipeline Test Campaign");
  console.log("🎯 Target: 3 High-Quality Leads with Complete Validation");
  console.log(
    "📋 Pipeline: Google Places → Foursquare → Hunter.io → NeverBounce"
  );
  console.log("=".repeat(75));

  try {
    // Initialize with ALL API keys properly configured
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

    console.log("🔑 API Keys Configuration:");
    console.log(
      `   Google Places: ${
        apiKeys.googlePlaces ? "✅ Configured" : "❌ Missing"
      }`
    );
    console.log(
      `   Foursquare: ${apiKeys.foursquare ? "✅ Configured" : "❌ Missing"}`
    );
    console.log(
      `   Hunter.io: ${apiKeys.hunterIO ? "✅ Configured" : "❌ Missing"}`
    );
    console.log(
      `   NeverBounce: ${apiKeys.neverBounce ? "✅ Configured" : "❌ Missing"}`
    );
    console.log("");

    const googleClient = new GooglePlacesClient(apiKeys.googlePlaces);
    const enhancedDiscovery = new EnhancedLeadDiscovery(apiKeys);
    const csvExporter = new CampaignCSVExporter();

    // Initialize campaign
    const campaignId = csvExporter.generateCampaignId();
    csvExporter.initializeCampaign(campaignId, {
      name: "Full Pipeline Test Campaign",
      description:
        "Complete validation pipeline test with Foursquare + Hunter.io",
    });

    console.log(`📋 Campaign ID: ${campaignId}`);
    console.log("🔍 Searching for pizza restaurants in Austin, TX...");
    console.log("");

    const startTime = Date.now();

    // Step 1: Google Places search
    console.log("🔍 Step 1: Google Places Business Discovery...");
    const googleResults = await googleClient.textSearch({
      query: "pizza restaurant Austin Texas",
      type: "restaurant",
    });

    if (!googleResults || googleResults.length === 0) {
      throw new Error("No businesses found in Google Places search");
    }

    console.log(
      `✅ Google Places: ${googleResults.length} pizza restaurants found`
    );

    // Step 2: Enhanced Discovery Pipeline (with aggressive settings to force all APIs)
    console.log("🔧 Step 2: Enhanced Multi-Source Validation Pipeline...");

    const discoveryOptions = {
      budgetLimit: 5.0, // Higher budget to allow full validation
      qualityThreshold: 60, // Lower threshold to process more businesses
      maxResults: 5, // Process top 5 to get 3 high-quality
      prioritizeLocalBusinesses: true,
      enablePropertyIntelligence: true,
      enableRegistryValidation: true,
      enableRealTimeFeedback: true,
      // Force all enrichment APIs to run
      forceEnrichment: true,
      minimumPreValidationScore: 30, // Lower threshold to force processing
    };

    console.log("📊 Discovery Options:");
    console.log(`   Budget Limit: $${discoveryOptions.budgetLimit}`);
    console.log(`   Quality Threshold: ${discoveryOptions.qualityThreshold}%`);
    console.log(`   Max Results: ${discoveryOptions.maxResults}`);
    console.log(`   Force Enrichment: ${discoveryOptions.forceEnrichment}`);
    console.log("");

    const enhancedResults = await enhancedDiscovery.discoverAndValidateLeads(
      googleResults,
      discoveryOptions
    );

    const processingTime = Date.now() - startTime;

    console.log("");
    console.log("📊 PIPELINE EXECUTION RESULTS:");
    console.log(`   Total Processed: ${enhancedResults.totalProcessed}`);
    console.log(`   Qualified Leads: ${enhancedResults.leads.length}`);
    console.log(`   Total Cost: $${enhancedResults.totalCost.toFixed(3)}`);
    console.log(`   Processing Time: ${(processingTime / 1000).toFixed(1)}s`);
    console.log("");

    // Verify pipeline completeness
    let foursquareEnriched = 0;
    let hunterIoEnriched = 0;
    let neverBounceValidated = 0;
    let ownerDetected = 0;

    enhancedResults.leads.forEach((lead, index) => {
      console.log(`${index + 1}. ${lead.name || lead.businessName}`);
      console.log(
        `   📊 Confidence: ${
          lead.finalConfidenceScore || lead.confidenceScore
        }% (${lead.qualityGrade || "N/A"})`
      );
      console.log(`   📍 Address: ${lead.address || lead.formatted_address}`);
      console.log(
        `   📞 Phone: ${lead.phone || lead.companyPhone || "Not available"}`
      );
      console.log(`   🌐 Website: ${lead.website || "Not available"}`);

      // Check pipeline completeness
      if (lead.foursquareData || lead.foursquareId) {
        foursquareEnriched++;
        console.log(
          `   🗺️  Foursquare: ✅ Enriched (ID: ${
            lead.foursquareId || "Available"
          })`
        );
      } else {
        console.log(`   🗺️  Foursquare: ❌ Not enriched`);
      }

      if (lead.email || lead.companyEmail) {
        hunterIoEnriched++;
        console.log(
          `   📧 Hunter.io: ✅ Email discovered (${
            lead.email || lead.companyEmail
          })`
        );

        if (
          lead.ownerEmail ||
          (lead.ownerName && lead.ownerName !== lead.name)
        ) {
          ownerDetected++;
          console.log(
            `   👤 Owner: ✅ Detected - ${lead.ownerName} (${
              lead.ownerConfidence || 0
            }%)`
          );
        } else {
          console.log(`   👤 Owner: ❌ Not detected`);
        }
      } else {
        console.log(`   📧 Hunter.io: ❌ No email discovered`);
      }

      if (lead.emailValidation || lead.validation?.email?.isValid) {
        neverBounceValidated++;
        console.log(
          `   ✅ NeverBounce: Email validated (${
            lead.validation?.email?.confidence || 0
          }%)`
        );
      } else {
        console.log(`   ✅ NeverBounce: ❌ Not validated`);
      }

      console.log(
        `   💰 Cost: $${(lead.apiCost || lead.totalCost || 0).toFixed(3)}`
      );
      console.log("");
    });

    // Pipeline completeness analysis
    console.log("=".repeat(75));
    console.log("📊 PIPELINE COMPLETENESS ANALYSIS");
    console.log("=".repeat(75));
    console.log(
      `🗺️  Foursquare Enrichment: ${foursquareEnriched}/${
        enhancedResults.leads.length
      } (${Math.round(
        (foursquareEnriched / enhancedResults.leads.length) * 100
      )}%)`
    );
    console.log(
      `📧 Hunter.io Email Discovery: ${hunterIoEnriched}/${
        enhancedResults.leads.length
      } (${Math.round(
        (hunterIoEnriched / enhancedResults.leads.length) * 100
      )}%)`
    );
    console.log(
      `👤 Owner Detection: ${ownerDetected}/${
        enhancedResults.leads.length
      } (${Math.round((ownerDetected / enhancedResults.leads.length) * 100)}%)`
    );
    console.log(
      `✅ NeverBounce Validation: ${neverBounceValidated}/${
        enhancedResults.leads.length
      } (${Math.round(
        (neverBounceValidated / enhancedResults.leads.length) * 100
      )}%)`
    );
    console.log("");

    // Quality analysis
    const highQualityLeads = enhancedResults.leads
      .filter(
        (lead) => (lead.finalConfidenceScore || lead.confidenceScore) >= 75
      )
      .sort(
        (a, b) =>
          (b.finalConfidenceScore || b.confidenceScore) -
          (a.finalConfidenceScore || a.confidenceScore)
      )
      .slice(0, 3);

    if (highQualityLeads.length > 0) {
      console.log("🎯 TOP HIGH-QUALITY LEADS (75%+ Confidence):");
      console.log("-".repeat(60));
      highQualityLeads.forEach((lead, index) => {
        console.log(`${index + 1}. ${lead.name || lead.businessName}`);
        console.log(
          `   Quality: ${(
            lead.finalConfidenceScore || lead.confidenceScore
          ).toFixed(1)}%`
        );
        console.log(
          `   Complete Data: ${
            lead.phone && lead.website && (lead.email || lead.companyEmail)
              ? "✅"
              : "⚠️"
          }`
        );
      });
      console.log("");

      // Add to campaign and export
      console.log("📤 Exporting campaign with enhanced pipeline results...");

      csvExporter.addQueryResults(
        "pizza restaurant full pipeline",
        "Austin, TX",
        highQualityLeads,
        {
          totalResults: highQualityLeads.length,
          qualifiedLeads: highQualityLeads.length,
          totalCost: enhancedResults.totalCost,
          processingTimeMs: processingTime,
          averageConfidence:
            highQualityLeads.reduce(
              (sum, lead) =>
                sum + (lead.finalConfidenceScore || lead.confidenceScore),
              0
            ) / highQualityLeads.length,
          pipelineCompleteness: {
            foursquareEnrichment:
              (foursquareEnriched / enhancedResults.leads.length) * 100,
            hunterIoDiscovery:
              (hunterIoEnriched / enhancedResults.leads.length) * 100,
            ownerDetection:
              (ownerDetected / enhancedResults.leads.length) * 100,
            neverBounceValidation:
              (neverBounceValidated / enhancedResults.leads.length) * 100,
          },
        }
      );

      const csvPath = await csvExporter.exportCampaignToCsv();

      console.log("✅ EXPORT COMPLETED:");
      console.log(`📁 CSV File: ${csvPath}`);
      console.log("");
    }

    // Final assessment
    console.log("=".repeat(75));
    console.log("🎉 FULL PIPELINE TEST RESULTS");
    console.log("=".repeat(75));

    const pipelineHealth = {
      foursquareWorking: foursquareEnriched > 0,
      hunterIoWorking: hunterIoEnriched > 0,
      ownerDetectionWorking: ownerDetected > 0,
      neverBounceWorking: neverBounceValidated > 0,
    };

    console.log(
      `🗺️  Foursquare Integration: ${
        pipelineHealth.foursquareWorking ? "✅ WORKING" : "❌ FAILING"
      }`
    );
    console.log(
      `📧 Hunter.io Integration: ${
        pipelineHealth.hunterIoWorking ? "✅ WORKING" : "❌ FAILING"
      }`
    );
    console.log(
      `👤 Owner Detection: ${
        pipelineHealth.ownerDetectionWorking ? "✅ WORKING" : "❌ FAILING"
      }`
    );
    console.log(
      `✅ NeverBounce Integration: ${
        pipelineHealth.neverBounceWorking ? "✅ WORKING" : "❌ FAILING"
      }`
    );

    const overallHealth = Object.values(pipelineHealth).filter(Boolean).length;
    console.log("");
    console.log(
      `📊 Pipeline Health: ${overallHealth}/4 components working (${Math.round(
        (overallHealth / 4) * 100
      )}%)`
    );

    if (overallHealth === 4) {
      console.log("🎉 SUCCESS: Complete validation pipeline operational!");
    } else if (overallHealth >= 2) {
      console.log("⚠️  PARTIAL: Some pipeline components need attention");
    } else {
      console.log("❌ FAILURE: Pipeline needs comprehensive debugging");
    }

    return {
      success: overallHealth >= 2,
      pipelineHealth,
      leadsGenerated: highQualityLeads.length,
      totalCost: enhancedResults.totalCost,
      processingTime: processingTime,
    };
  } catch (error) {
    console.error(`❌ Full pipeline test failed: ${error.message}`);
    if (error.stack) {
      console.error("📋 Stack trace:", error.stack);
    }
    throw error;
  }
}

if (require.main === module) {
  runFullPipelineTest()
    .then((result) => {
      if (result.success) {
        console.log("🏁 Full pipeline test completed successfully");
        process.exit(0);
      } else {
        console.log("💥 Full pipeline test failed - debugging required");
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error("💥 Fatal error in pipeline test");
      process.exit(1);
    });
}

module.exports = { runFullPipelineTest };
