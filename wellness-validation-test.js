#!/usr/bin/env node

/**
 * San Diego Wellness Business Single Lead Test
 * Validates ProspectPro v2.0 pipeline with wellness industry focus
 */

process.env.SKIP_AUTH_IN_DEV = "true";

const GooglePlacesClient = require("./modules/api-clients/google-places");
const EnhancedLeadDiscovery = require("./modules/enhanced-lead-discovery");
const CampaignCSVExporter = require("./modules/campaign-csv-exporter");

async function runWellnessValidationTest() {
  console.log("🌿 ProspectPro v2.0 Wellness Business Validation Test");
  console.log("📍 Target: High-quality wellness businesses in San Diego, CA");
  console.log("=".repeat(70));

  try {
    // Initialize API keys
    const apiKeys = {
      googlePlaces: process.env.GOOGLE_PLACES_API_KEY,
      foursquare: process.env.FOURSQUARE_SERVICE_API_KEY || process.env.FOURSQUARE_PLACES_API_KEY,
      hunterIO: process.env.HUNTER_IO_API_KEY,
      neverBounce: process.env.NEVERBOUNCE_API_KEY,
      zeroBounce: process.env.ZEROBOUNCE_API_KEY,
      scrapingdog: process.env.SCRAPINGDOG_API_KEY
    };

    console.log("🔑 API Configuration Check:");
    console.log(`   Google Places: ${apiKeys.googlePlaces ? '✅' : '❌'}`);
    console.log(`   Foursquare: ${apiKeys.foursquare ? '✅' : '❌'}`);
    console.log(`   Hunter.io: ${apiKeys.hunterIO ? '✅' : '❌'}`);
    console.log(`   NeverBounce: ${apiKeys.neverBounce ? '✅' : '❌'}`);
    console.log("");

    const googleClient = new GooglePlacesClient(apiKeys.googlePlaces);
    const enhancedDiscovery = new EnhancedLeadDiscovery(apiKeys);
    const csvExporter = new CampaignCSVExporter();

    // Initialize campaign
    const campaignId = csvExporter.generateCampaignId();
    csvExporter.initializeCampaign(campaignId, {
      name: "San Diego Wellness Validation Test",
      description: "Single lead validation test for wellness business with complete pipeline processing"
    });

    console.log(`📋 Campaign ID: ${campaignId}`);
    console.log("🔍 Searching for wellness businesses...");
    
    const startTime = Date.now();

    // Search for wellness businesses in San Diego
    const results = await googleClient.textSearch({
      query: "wellness center spa massage therapy San Diego California",
      type: "health"
    });

    if (!results || results.length === 0) {
      throw new Error("No wellness businesses found in Google Places search");
    }

    console.log(`✅ Google Places found ${results.length} wellness businesses`);
    
    // Show sample businesses found
    console.log("\n📋 Sample businesses found:");
    results.slice(0, 3).forEach((business, index) => {
      console.log(`   ${index + 1}. ${business.name}`);
      console.log(`      Rating: ${business.rating}/5 (${business.user_ratings_total} reviews)`);
      console.log(`      Address: ${business.formatted_address}`);
    });
    console.log("");

    // Process through enhanced discovery pipeline
    console.log("🔧 Processing through enhanced discovery pipeline...");
    
    const discoveryOptions = {
      budgetLimit: 2.0,  // Lower budget for single lead test
      qualityThreshold: 65,  // Slightly lower threshold for wellness industry
      maxResults: 3,  // Process top 3 to get 1 high-quality lead
      prioritizeLocalBusinesses: true,
      enablePropertyIntelligence: true,
      enableRegistryValidation: true,
      enableRealTimeFeedback: true
    };

    console.log("📊 Discovery Configuration:");
    console.log(`   Budget Limit: $${discoveryOptions.budgetLimit}`);
    console.log(`   Quality Threshold: ${discoveryOptions.qualityThreshold}%`);
    console.log(`   Max Results: ${discoveryOptions.maxResults}`);
    console.log("");

    const enhancedResults = await enhancedDiscovery.discoverAndValidateLeads(
      results,
      discoveryOptions
    );

    const processingTime = Date.now() - startTime;

    console.log("📊 PIPELINE PROCESSING RESULTS:");
    console.log(`   Businesses Processed: ${enhancedResults.totalProcessed}`);
    console.log(`   Qualified Leads: ${enhancedResults.leads.length}`);
    console.log(`   Total Cost: $${enhancedResults.totalCost.toFixed(3)}`);
    console.log(`   Processing Time: ${(processingTime / 1000).toFixed(1)}s`);
    console.log("");

    if (enhancedResults.leads.length === 0) {
      throw new Error("No qualified wellness leads found after enhanced processing");
    }

    // Select the highest quality lead
    const topLead = enhancedResults.leads
      .sort((a, b) => (b.finalConfidenceScore || b.confidenceScore) - (a.finalConfidenceScore || a.confidenceScore))[0];

    console.log("🎯 HIGHEST QUALITY WELLNESS LEAD:");
    console.log("=".repeat(60));
    console.log(`📋 Business: ${topLead.name || topLead.businessName}`);
    console.log(`📊 Confidence Score: ${(topLead.finalConfidenceScore || topLead.confidenceScore).toFixed(1)}%`);
    console.log(`📍 Address: ${topLead.address || topLead.formatted_address}`);
    console.log(`📞 Phone: ${topLead.phone || topLead.companyPhone || 'Not available'}`);
    console.log(`🌐 Website: ${topLead.website || 'Not available'}`);
    console.log(`📧 Email: ${topLead.email || topLead.companyEmail || 'Not available'}`);
    console.log(`🗺️  Foursquare Enhanced: ${topLead.foursquareData ? '✅ Yes' : '❌ No'}`);
    console.log(`👥 Business Category: ${topLead.businessType || topLead.types?.[0] || 'Wellness'}`);
    console.log(`⭐ Google Rating: ${topLead.googleRating || topLead.rating}/5`);
    console.log(`💰 Discovery Cost: $${(topLead.apiCost || 0).toFixed(3)}`);
    console.log("");

    // Pipeline completeness validation
    const pipelineValidation = {
      hasGoogleData: !!(topLead.googlePlaceId || topLead.place_id),
      hasFoursquareData: !!topLead.foursquareData,
      hasEmail: !!(topLead.email || topLead.companyEmail),
      hasWebsite: !!topLead.website,
      hasPhone: !!(topLead.phone || topLead.companyPhone)
    };

    console.log("🔍 PIPELINE COMPLETENESS VALIDATION:");
    console.log(`   Google Places Integration: ${pipelineValidation.hasGoogleData ? '✅' : '❌'}`);
    console.log(`   Foursquare Enhancement: ${pipelineValidation.hasFoursquareData ? '✅' : '❌'}`);
    console.log(`   Hunter.io Email Discovery: ${pipelineValidation.hasEmail ? '✅' : '❌'}`);
    console.log(`   Website Verification: ${pipelineValidation.hasWebsite ? '✅' : '❌'}`);
    console.log(`   Phone Contact: ${pipelineValidation.hasPhone ? '✅' : '❌'}`);
    
    const completenessScore = Object.values(pipelineValidation).filter(Boolean).length;
    console.log(`   Overall Completeness: ${completenessScore}/5 (${Math.round((completenessScore/5)*100)}%)`);
    console.log("");

    // Add to campaign and export
    console.log("📊 Adding lead to campaign...");
    csvExporter.addQueryResults(
      "wellness center spa massage therapy",
      "San Diego, CA",
      [topLead],
      {
        totalResults: 1,
        qualifiedLeads: 1,
        totalCost: enhancedResults.totalCost,
        processingTimeMs: processingTime,
        averageConfidence: topLead.finalConfidenceScore || topLead.confidenceScore,
        pipelineCompleteness: Math.round((completenessScore/5)*100)
      }
    );

    console.log("📤 Exporting campaign to CSV...");
    const csvPath = await csvExporter.exportCampaignToCsv();
    
    console.log("");
    console.log("✅ WELLNESS VALIDATION TEST COMPLETED:");
    console.log("=".repeat(60));
    console.log(`📁 CSV Export: ${csvPath}`);
    console.log(`🎯 Lead Quality: ${(topLead.finalConfidenceScore || topLead.confidenceScore).toFixed(1)}%`);
    console.log(`💰 Cost per Lead: $${enhancedResults.totalCost.toFixed(3)}`);
    console.log(`⏱️  Total Processing: ${(processingTime / 1000).toFixed(1)}s`);
    console.log(`🔧 Pipeline Health: ${completenessScore}/5 components working`);
    console.log("");
    
    if (completenessScore >= 4 && (topLead.finalConfidenceScore || topLead.confidenceScore) >= 70) {
      console.log("🎉 VALIDATION SUCCESS: System ready for production use!");
      return {
        success: true,
        leadQuality: topLead.finalConfidenceScore || topLead.confidenceScore,
        pipelineHealth: completenessScore,
        csvPath: csvPath
      };
    } else {
      console.log("⚠️  VALIDATION WARNING: System needs optimization");
      return {
        success: false,
        leadQuality: topLead.finalConfidenceScore || topLead.confidenceScore,
        pipelineHealth: completenessScore
      };
    }

  } catch (error) {
    console.error(`❌ Wellness validation test failed: ${error.message}`);
    if (error.stack) {
      console.error("📋 Stack trace:", error.stack.split('\n').slice(0, 5).join('\n'));
    }
    throw error;
  }
}

if (require.main === module) {
  runWellnessValidationTest().then((result) => {
    process.exit(result.success ? 0 : 1);
  }).catch(() => {
    process.exit(1);
  });
}

module.exports = { runWellnessValidationTest };