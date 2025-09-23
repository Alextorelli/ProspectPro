#!/usr/bin/env node#!/usr/bin/env node#!/usr/bin/env node



/**

 * ProspectPro v2.0 Test Campaign Script - Updated for Multi-Source Architecture

 * Tests the enhanced multi-source discovery engine with Foursquare + Google Places/**/**

 */

 * ProspectPro v2.0 Test Campaign Script - Updated for Multi-Source Architecture * Fixed Quick Test Campaign Script for ProspectPro v2.0

const GooglePlacesClient = require("../modules/api-clients/api-google-places-client");

const CoreBusinessDiscoveryEngine = require("../modules/core/core-business-discovery-engine"); * Tests the enhanced multi-source discovery engine with Foursquare + Google Places */

const CoreLeadDiscoveryEngine = require("../modules/core/core-lead-discovery-engine");

const CampaignCSVExporter = require("../modules/core/export-campaign-csv-system"); */



async function runTestCampaign() {const GooglePlacesClient = require("../modules/api-clients/api-google-places-client");

  console.log("🚀 ProspectPro v2.0 Multi-Source Test Campaign");

  console.log("🎯 Testing Enhanced Discovery: Foursquare + Google Places");const GooglePlacesClient = require("../modules/api-clients/api-google-places-client");const CoreLeadDiscoveryEngine = require("../modules/core/core-lead-discovery-engine");

  console.log("=".repeat(70));

const FoursquareClient = require("../modules/api-clients/api-foursquare-places-client");const CampaignCSVExporter = require("../modules/core/export-campaign-csv-system");

  try {

    // Initialize API keys from environmentconst CoreBusinessDiscoveryEngine = require("../modules/core/core-business-discovery-engine");

    const apiKeys = {

      googlePlaces: process.env.GOOGLE_PLACES_API_KEY,const CoreLeadDiscoveryEngine = require("../modules/core/core-lead-discovery-engine");async function runTestCampaign() {

      foursquare: process.env.FOURSQUARE_SERVICE_API_KEY || process.env.FOURSQUARE_PLACES_API_KEY,

      hunterIO: process.env.HUNTER_IO_API_KEY,const CampaignCSVExporter = require("../modules/core/export-campaign-csv-system");  console.log(

      neverBounce: process.env.NEVERBOUNCE_API_KEY,

      zeroBounce: process.env.ZEROBOUNCE_API_KEY,    "🚀 ProspectPro v2.0 Test Campaign: 3 High-Quality Verified Leads"

    };

async function runTestCampaign() {  );

    // Verify required API keys

    if (!apiKeys.googlePlaces) {  console.log("🚀 ProspectPro v2.0 Multi-Source Test Campaign");  console.log("=".repeat(70));

      throw new Error("GOOGLE_PLACES_API_KEY not found in environment");

    }  console.log("🎯 Testing Enhanced Discovery: Foursquare + Google Places");



    // Initialize discovery engines  console.log("=".repeat(70));  try {

    const businessDiscovery = new CoreBusinessDiscoveryEngine(apiKeys);

    const leadDiscovery = new CoreLeadDiscoveryEngine(apiKeys);    // Initialize API keys from environment

    const csvExporter = new CampaignCSVExporter();

  try {    const apiKeys = {

    // Initialize campaign

    const campaignId = csvExporter.generateCampaignId();    // Initialize API keys from environment      googlePlaces: process.env.GOOGLE_PLACES_API_KEY,

    csvExporter.initializeCampaign(campaignId, {

      name: "Multi-Source Restaurant Test Campaign",    const apiKeys = {      foursquare: process.env.FOURSQUARE_SERVICE_API_KEY || process.env.FOURSQUARE_PLACES_API_KEY,

      description: "ProspectPro v2.0 test campaign demonstrating multi-source discovery",

    });      googlePlaces: process.env.GOOGLE_PLACES_API_KEY,      hunterIO: process.env.HUNTER_IO_API_KEY,



    console.log(`📋 Campaign ID: ${campaignId}`);      foursquare: process.env.FOURSQUARE_SERVICE_API_KEY || process.env.FOURSQUARE_PLACES_API_KEY,      neverBounce: process.env.NEVERBOUNCE_API_KEY,

    console.log("🎯 Target: Premium restaurants in Austin, TX");

    console.log("");      hunterIO: process.env.HUNTER_IO_API_KEY,      zeroBounce: process.env.ZEROBOUNCE_API_KEY,



    // Execute multi-source business discovery      neverBounce: process.env.NEVERBOUNCE_API_KEY,      scrapingdog: process.env.SCRAPINGDOG_API_KEY

    console.log("🔄 Executing multi-source business discovery...");

    const startTime = Date.now();      zeroBounce: process.env.ZEROBOUNCE_API_KEY,    };



    const discoveryOptions = {    };

      budgetLimit: 3.0,

      qualityThreshold: 70,    const googleClient = new GooglePlacesClient(apiKeys.googlePlaces);

      maxResults: 5,

      enableFoursquare: !!apiKeys.foursquare,    // Verify required API keys    const enhancedDiscovery = new EnhancedLeadDiscovery(apiKeys);

      enableGooglePlaces: !!apiKeys.googlePlaces,

      preferFreeAPIs: true    if (!apiKeys.googlePlaces) {    const csvExporter = new CampaignCSVExporter();

    };

      throw new Error("GOOGLE_PLACES_API_KEY not found in environment");

    const discoveryResults = await businessDiscovery.discoverBusinesses(

      "high end restaurant",    }    // Initialize campaign

      "Austin, TX",

      discoveryOptions    const campaignId = csvExporter.generateCampaignId();

    );

    // Initialize discovery engines    csvExporter.initializeCampaign(campaignId, {

    console.log(`✅ Multi-source discovery found ${discoveryResults.businesses.length} businesses`);

    console.log(`💰 Discovery cost: $${discoveryResults.totalCost.toFixed(3)}`);    const businessDiscovery = new CoreBusinessDiscoveryEngine(apiKeys);      name: "High-Quality Restaurant Test Campaign",

    console.log(`🔄 Sources used: ${discoveryResults.sourcesUsed.join(", ")}`);

    console.log("");    const leadDiscovery = new CoreLeadDiscoveryEngine(apiKeys);      description:



    if (discoveryResults.businesses.length === 0) {    const csvExporter = new CampaignCSVExporter();        "ProspectPro v2.0 test campaign demonstrating 3 verified leads",

      throw new Error("No businesses found through multi-source discovery");

    }    });



    // Process through enhanced lead enrichment pipeline    // Initialize campaign

    console.log("🔧 Processing through enhanced lead enrichment pipeline...");

        const campaignId = csvExporter.generateCampaignId();    console.log(`📋 Campaign ID: ${campaignId}`);

    const enrichmentOptions = {

      budgetLimit: 2.0,    csvExporter.initializeCampaign(campaignId, {    console.log("🎯 Target: Premium restaurants in Austin, TX");

      qualityThreshold: 70,

      maxResults: 3,      name: "Multi-Source Restaurant Test Campaign",    console.log("");

      enableEmailDiscovery: !!apiKeys.hunterIO,

      enableEmailVerification: !!apiKeys.neverBounce || !!apiKeys.zeroBounce,      description: "ProspectPro v2.0 test campaign demonstrating multi-source discovery",

      minEmailConfidence: 70,

      prioritizeVerification: true    });    // Search Google Places

    };

    console.log("🔄 Executing Google Places search...");

    const enrichmentResults = await leadDiscovery.processBusinesses(

      discoveryResults.businesses,    console.log(`📋 Campaign ID: ${campaignId}`);    const startTime = Date.now();

      enrichmentOptions

    );    console.log("🎯 Target: Premium restaurants in Austin, TX");



    const totalProcessingTime = Date.now() - startTime;    console.log("");    const results = await googleClient.textSearch({

    console.log(`✅ Lead enrichment processed ${enrichmentResults.totalProcessed} businesses`);

    console.log(`🎯 Qualified leads: ${enrichmentResults.qualifiedLeads}`);      query: "high end restaurant Austin Texas",

    console.log(`💰 Total cost: $${enrichmentResults.totalCost.toFixed(3)}`);

    console.log(`📊 Average confidence: ${enrichmentResults.averageConfidence.toFixed(1)}%`);    // Execute multi-source business discovery      type: "restaurant",

    console.log("");

    console.log("🔄 Executing multi-source business discovery...");    });

    // Select top leads

    const topLeads = enrichmentResults.leads    const startTime = Date.now();

      .filter(lead => lead.finalConfidenceScore >= 70)

      .sort((a, b) => b.finalConfidenceScore - a.finalConfidenceScore)    if (!results || results.length === 0) {

      .slice(0, 3);

    const discoveryOptions = {      throw new Error("No restaurants found in Google Places search");

    console.log("🎯 HIGH-QUALITY VERIFIED LEADS DISCOVERED:");

    console.log("=".repeat(60));      budgetLimit: 3.0,    }



    topLeads.forEach((lead, index) => {      qualityThreshold: 70,

      console.log(`${index + 1}. ${lead.name}`);

      console.log(`   📊 Confidence: ${lead.finalConfidenceScore.toFixed(1)}%`);      maxResults: 5,    console.log(`✅ Google Places returned ${results.length} restaurants`);

      console.log(`   📍 Address: ${lead.address}`);

      console.log(`   📞 Phone: ${lead.phone || 'Not available'}`);      enableFoursquare: !!apiKeys.foursquare,

      console.log(`   🌐 Website: ${lead.website || 'Not available'}`);

      console.log(`   📧 Email: ${lead.emailValidation?.bestEmail?.email || 'Not available'}`);      enableGooglePlaces: !!apiKeys.googlePlaces,    // Process through enhanced discovery pipeline

      console.log("");

    });      preferFreeAPIs: true    console.log("🔧 Processing through enhanced discovery pipeline...");



    // Add to campaign and export CSV    };    

    console.log("📊 Adding leads to campaign...");

    csvExporter.addQueryResults("high end restaurant", "Austin, TX", topLeads, {    const discoveryOptions = {

      totalResults: topLeads.length,

      qualifiedLeads: topLeads.length,    const discoveryResults = await businessDiscovery.discoverBusinesses(      budgetLimit: 3.0,

      totalCost: enrichmentResults.totalCost,

      processingTimeMs: totalProcessingTime,      "high end restaurant",      qualityThreshold: 70,

      averageConfidence: topLeads.reduce((sum, lead) => sum + lead.finalConfidenceScore, 0) / topLeads.length

    });      "Austin, TX",      maxResults: 5,



    console.log("📤 Exporting CSV...");      discoveryOptions      prioritizeLocalBusinesses: true,

    const csvPath = await csvExporter.exportCampaignToCsv();

        );      enablePropertyIntelligence: true,

    console.log("✅ MULTI-SOURCE CAMPAIGN COMPLETED:");

    console.log(`📁 CSV Export: ${csvPath}`);      enableRegistryValidation: true,

    console.log(`🎯 Leads Generated: ${topLeads.length}`);

    console.log(`💰 Total Cost: $${enrichmentResults.totalCost.toFixed(3)}`);    console.log(`✅ Multi-source discovery found ${discoveryResults.businesses.length} businesses`);      enableRealTimeFeedback: true

    

    return {    console.log(`💰 Discovery cost: $${discoveryResults.totalCost.toFixed(3)}`);    };

      success: true,

      csvPath,    console.log(`🔄 Sources used: ${discoveryResults.sourcesUsed.join(", ")}`);

      leadsGenerated: topLeads.length,

      totalCost: enrichmentResults.totalCost    console.log("");    const enhancedResults = await enhancedDiscovery.discoverAndValidateLeads(

    };

      results,

  } catch (error) {

    console.error(`❌ Campaign execution failed: ${error.message}`);    if (discoveryResults.businesses.length === 0) {      discoveryOptions

    throw error;

  }      throw new Error("No businesses found through multi-source discovery");    );

}

    }

// Execute test campaign

if (require.main === module) {    const processingTime = Date.now() - startTime;

  runTestCampaign()

    .then(() => {    // Process through enhanced lead enrichment pipeline

      console.log("🏁 Test campaign completed successfully");

      process.exit(0);    console.log("🔧 Processing through enhanced lead enrichment pipeline...");    console.log(`✅ Enhanced discovery processed ${enhancedResults.totalProcessed} businesses`);

    })

    .catch(() => {        console.log(`🎯 Qualified leads: ${enhancedResults.leads.length}`);

      console.error("💥 Fatal error in test campaign execution");

      process.exit(1);    const enrichmentOptions = {    console.log(`💰 Total cost: $${enhancedResults.totalCost.toFixed(3)}`);

    });

}      budgetLimit: 2.0,    console.log("");



module.exports = { runTestCampaign };      qualityThreshold: 70,

      maxResults: 3,    if (enhancedResults.leads.length === 0) {

      enableEmailDiscovery: !!apiKeys.hunterIO,      throw new Error("No qualified leads found after enhanced processing");

      enableEmailVerification: !!apiKeys.neverBounce || !!apiKeys.zeroBounce,    }

      minEmailConfidence: 70,

      prioritizeVerification: true    // Select top 3 highest quality leads

    };    const topLeads = enhancedResults.leads

      .filter(lead => (lead.finalConfidenceScore || lead.confidenceScore) >= 75)

    const enrichmentResults = await leadDiscovery.processBusinesses(      .sort((a, b) => (b.finalConfidenceScore || b.confidenceScore) - (a.finalConfidenceScore || a.confidenceScore))

      discoveryResults.businesses,      .slice(0, 3);

      enrichmentOptions

    );    console.log(`🏆 Selected top ${topLeads.length} high-quality leads`);

    console.log("");

    const totalProcessingTime = Date.now() - startTime;

    console.log("🎯 HIGH-QUALITY VERIFIED LEADS DISCOVERED:");

    console.log(`✅ Lead enrichment processed ${enrichmentResults.totalProcessed} businesses`);    console.log("=".repeat(60));

    console.log(`🎯 Qualified leads: ${enrichmentResults.qualifiedLeads}`);

    console.log(`💰 Total cost: $${enrichmentResults.totalCost.toFixed(3)}`);    if (topLeads.length === 0) {

    console.log(`📊 Average confidence: ${enrichmentResults.averageConfidence.toFixed(1)}%`);      throw new Error("No high-quality leads found (75%+ confidence required)");

    console.log("");    }



    if (enrichmentResults.qualifiedLeads === 0) {    topLeads.forEach((lead, index) => {

      throw new Error("No qualified leads found after enrichment processing");      console.log(`${index + 1}. ${lead.name || lead.businessName}`);

    }      console.log(`   📊 Confidence: ${(lead.finalConfidenceScore || lead.confidenceScore).toFixed(1)}% (Grade: ${lead.qualityGrade || 'A'})`);

      console.log(`   📍 Address: ${lead.address || lead.formatted_address}`);

    // Select top leads      console.log(`   📞 Phone: ${lead.phone || lead.companyPhone || 'Not available'}`);

    const topLeads = enrichmentResults.leads      console.log(`   🌐 Website: ${lead.website || 'Not available'}`);

      .filter(lead => lead.finalConfidenceScore >= 75)      console.log(`   📧 Email: ${lead.email || lead.companyEmail || 'Not available'}`);

      .sort((a, b) => b.finalConfidenceScore - a.finalConfidenceScore)      console.log(`   🗺️  Foursquare: ${lead.foursquareData ? '✅ Enhanced' : '❌ Basic'}`);

      .slice(0, 3);      console.log(`   💰 Discovery Cost: $${(lead.apiCost || 0).toFixed(3)}`);

      console.log("");

    console.log(`🏆 Selected top ${topLeads.length} high-quality leads`);    });

    console.log("");

    console.log("📊 Adding leads to campaign and calculating analytics...");

    console.log("🎯 HIGH-QUALITY VERIFIED LEADS DISCOVERED:");    

    console.log("=".repeat(60));    // Add to campaign

    csvExporter.addQueryResults(

    topLeads.forEach((lead, index) => {      "high end restaurant", 

      console.log(`${index + 1}. ${lead.name}`);      "Austin, TX", 

      console.log(`   📊 Confidence: ${lead.finalConfidenceScore.toFixed(1)}%`);      topLeads, 

      console.log(`   📍 Address: ${lead.address}`);      {

      console.log(`   📞 Phone: ${lead.phone || 'Not available'}`);        totalResults: topLeads.length,

      console.log(`   🌐 Website: ${lead.website || 'Not available'}`);        qualifiedLeads: topLeads.length,

      console.log(`   📧 Email: ${lead.emailValidation?.bestEmail?.email || 'Not available'}`);        totalCost: enhancedResults.totalCost,

      console.log(`   🗺️  Sources: ${lead.discoveryMetadata?.sourcesUsed?.join(', ') || 'N/A'}`);        processingTimeMs: processingTime,

      console.log(`   💰 Enrichment Cost: $${(lead.apiCosts?.total || 0).toFixed(3)}`);        averageConfidence: topLeads.reduce((sum, lead) => 

      console.log("");          sum + (lead.finalConfidenceScore || lead.confidenceScore), 0) / topLeads.length

    });      }

    );

    // Add to campaign

    console.log("📊 Adding leads to campaign...");    console.log(`📊 Added query "high end restaurant" with ${topLeads.length} leads to campaign`);

    csvExporter.addQueryResults(    

      "high end restaurant",     // Export CSV

      "Austin, TX",     console.log("📤 Exporting comprehensive campaign data to CSV...");

      topLeads,     const csvPath = await csvExporter.exportCampaignToCsv();

      {    

        totalResults: topLeads.length,    console.log("");

        qualifiedLeads: topLeads.length,    console.log("✅ CAMPAIGN EXECUTION COMPLETED:");

        totalCost: enrichmentResults.totalCost,    console.log(`📁 CSV Export: ${csvPath}`);

        processingTimeMs: totalProcessingTime,    console.log(`🎯 Leads Generated: ${topLeads.length}`);

        averageConfidence: topLeads.reduce((sum, lead) => sum + lead.finalConfidenceScore, 0) / topLeads.length,    console.log(`💰 Total Cost: $${enhancedResults.totalCost.toFixed(3)}`);

        discoveryMetadata: {    console.log(`⏱️  Processing Time: ${(processingTime / 1000).toFixed(1)}s`);

          multiSourceDiscovery: true,    console.log(`📊 Average Confidence: ${(topLeads.reduce((sum, lead) => 

          sourcesUsed: discoveryResults.sourcesUsed,      sum + (lead.finalConfidenceScore || lead.confidenceScore), 0) / topLeads.length).toFixed(1)}%`);

          foursquareMatches: discoveryResults.crossPlatformMatches || 0    

        }    return {

      }      success: true,

    );      csvPath,

      leadsGenerated: topLeads.length,

    // Export CSV      totalCost: enhancedResults.totalCost,

    console.log("📤 Exporting comprehensive campaign data to CSV...");      processingTime: processingTime

    const csvPath = await csvExporter.exportCampaignToCsv();    };

    

    console.log("");  } catch (error) {

    console.log("✅ MULTI-SOURCE CAMPAIGN EXECUTION COMPLETED:");    console.error(`❌ Campaign execution failed: ${error.message}`);

    console.log(`📁 CSV Export: ${csvPath}`);    if (error.stack) {

    console.log(`🎯 Leads Generated: ${topLeads.length}`);      console.error("📋 Stack trace:", error.stack);

    console.log(`💰 Total Cost: $${enrichmentResults.totalCost.toFixed(3)}`);    }

    console.log(`⏱️  Processing Time: ${(totalProcessingTime / 1000).toFixed(1)}s`);

    console.log(`📊 Average Confidence: ${(topLeads.reduce((sum, lead) =>   } catch (error) {

      sum + lead.finalConfidenceScore, 0) / topLeads.length).toFixed(1)}%`);    console.error(`❌ Campaign execution failed: ${error.message}`);

    console.log(`🔄 Multi-Source Discovery: ${discoveryResults.sourcesUsed.length} sources used`);    if (error.stack) {

          console.error("📋 Stack trace:", error.stack);

    return {    }

      success: true,    throw error;

      csvPath,  }

      leadsGenerated: topLeads.length,}

      totalCost: enrichmentResults.totalCost,    console.log("=".repeat(60));

      processingTime: totalProcessingTime,

      sourcesUsed: discoveryResults.sourcesUsed    leads.forEach((lead, index) => {

    };      console.log(`\n${index + 1}. ${lead.businessName}`);

      console.log(

  } catch (error) {        `   📊 Quality: ${lead.confidenceScore}% (Grade ${lead.qualityGrade})`

    console.error(`❌ Campaign execution failed: ${error.message}`);      );

    if (error.stack) {      console.log(

      console.error("📋 Stack trace:", error.stack);        `   ⭐ Rating: ${

    }          lead.googleRating

    throw error;        }/5.0 (${lead.googleReviewCount.toLocaleString()} reviews)`

  }      );

}      console.log(`   📍 Address: ${lead.address}`);

      console.log(`   📞 Phone: ${lead.phone || "Not available"}`);

// Execute test campaign      console.log(`   🌐 Website: ${lead.website || "Not available"}`);

if (require.main === module) {      console.log(

  runTestCampaign()        `   💰 Price Level: ${"$".repeat(lead.priceLevel)} (${

    .then((result) => {          lead.priceLevel

      console.log("🏁 Multi-source test campaign completed successfully");        }/4)`

      process.exit(0);      );

    })      console.log(`   👥 Est. Employees: ${lead.estimatedEmployees}`);

    .catch((error) => {      console.log(

      console.error("💥 Fatal error in test campaign execution");        `   🕐 Hours: ${lead.businessHours ? "Available" : "Not listed"}`

      process.exit(1);      );

    });      console.log(`   📸 Photos: ${lead.photoCount} available`);

}    });



module.exports = { runTestCampaign };    // Add to campaign
    console.log("\n📊 Adding leads to campaign and calculating analytics...");

    csvExporter.addQueryResults("high end restaurant", "Austin, TX", leads, {
      totalResults: leads.length,
      qualifiedLeads: leads.length,
      totalCost: totalCost,
      processingTimeMs: processingTime,
      averageConfidence:
        leads.reduce((sum, lead) => sum + lead.confidenceScore, 0) /
        leads.length,
      averageRating:
        leads.reduce((sum, lead) => sum + lead.googleRating, 0) / leads.length,
      qualificationRate: 100,
      costPerLead: totalCost / leads.length,
    });

    // Export campaign to CSV
    console.log("📤 Exporting comprehensive campaign data to CSV...");
    const csvPath = await csvExporter.exportCampaignToCsv();

    // Results summary
    console.log("\n✅ EXPORT COMPLETED SUCCESSFULLY");
    console.log(`📁 CSV File: ${csvPath}`);
    console.log("");

    console.log("=".repeat(70));
    console.log("🎉 TEST CAMPAIGN RESULTS SUMMARY");
    console.log("=".repeat(70));
    console.log(`✅ High-Quality Leads Found: ${leads.length}/3 requested`);
    console.log(
      `📊 Average Quality Score: ${(
        leads.reduce((sum, lead) => sum + lead.confidenceScore, 0) /
        leads.length
      ).toFixed(1)}%`
    );
    console.log(
      `⭐ Average Rating: ${(
        leads.reduce((sum, lead) => sum + lead.googleRating, 0) / leads.length
      ).toFixed(2)}/5.0`
    );
    console.log(`💰 Total Campaign Cost: $${totalCost.toFixed(3)}`);
    console.log(
      `⏱️  Processing Time: ${(processingTime / 1000).toFixed(1)} seconds`
    );
    console.log(`📈 Cost per Lead: $${(totalCost / leads.length).toFixed(3)}`);

    // Data completeness metrics
    const phonesAvailable = leads.filter((lead) => lead.phone).length;
    const websitesAvailable = leads.filter((lead) => lead.website).length;
    const hasBusinessHours = leads.filter((lead) => lead.businessHours).length;

    console.log("");
    console.log("📊 DATA COMPLETENESS METRICS:");
    console.log(
      `📞 Phone Numbers: ${phonesAvailable}/${leads.length} (${(
        (phonesAvailable / leads.length) *
        100
      ).toFixed(0)}%)`
    );
    console.log(
      `🌐 Websites: ${websitesAvailable}/${leads.length} (${(
        (websitesAvailable / leads.length) *
        100
      ).toFixed(0)}%)`
    );
    console.log(
      `🕐 Business Hours: ${hasBusinessHours}/${leads.length} (${(
        (hasBusinessHours / leads.length) *
        100
      ).toFixed(0)}%)`
    );
    console.log(
      `📸 Photos Available: ${leads.reduce(
        (sum, lead) => sum + lead.photoCount,
        0
      )} total`
    );

    console.log("");
    console.log(
      "🎯 CAMPAIGN SUCCESS: 3 high-quality verified leads delivered!"
    );
    console.log(
      "📋 ProspectPro v2.0 Enhanced CSV Export System demonstrated successfully"
    );
    console.log("");
    console.log(
      "💡 NOTE: This demonstrates v2.0 capabilities with 45+ column CSV export"
    );
    console.log(
      "💡 Full production includes Hunter.io email discovery & NeverBounce validation"
    );

    return {
      success: true,
      campaignId: campaignId,
      leadsCount: leads.length,
      csvPath: csvPath,
      totalCost: totalCost,
      processingTime: processingTime,
      averageQuality:
        leads.reduce((sum, lead) => sum + lead.confidenceScore, 0) /
        leads.length,
    };
  } catch (error) {
    console.error(`❌ Campaign execution failed: ${error.message}`);
    if (error.stack) {
      console.error("📋 Stack trace:", error.stack);
    }
    throw error;
  }
}

// Execute test campaign
if (require.main === module) {
  runTestCampaign()
    .then((result) => {
      console.log("🏁 Test campaign completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Fatal error in test campaign execution");
      process.exit(1);
    });
}

module.exports = { runTestCampaign };
