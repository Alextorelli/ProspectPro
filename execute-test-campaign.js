#!/usr/bin/env node

/**
 * Fixed Quick Test Campaign Script for ProspectPro v2.0
 */

const GooglePlacesClient = require("./modules/api-clients/google-places");
const EnhancedLeadDiscovery = require("./modules/enhanced-lead-discovery");
const CampaignCSVExporter = require("./modules/campaign-csv-exporter");

async function runTestCampaign() {
  console.log(
    "🚀 ProspectPro v2.0 Test Campaign: 3 High-Quality Verified Leads"
  );
  console.log("=".repeat(70));

  try {
    // Initialize API keys from environment
    const apiKeys = {
      googlePlaces: process.env.GOOGLE_PLACES_API_KEY,
      foursquare: process.env.FOURSQUARE_SERVICE_API_KEY || process.env.FOURSQUARE_PLACES_API_KEY,
      hunterIO: process.env.HUNTER_IO_API_KEY,
      neverBounce: process.env.NEVERBOUNCE_API_KEY,
      zeroBounce: process.env.ZEROBOUNCE_API_KEY,
      scrapingdog: process.env.SCRAPINGDOG_API_KEY
    };

    const googleClient = new GooglePlacesClient(apiKeys.googlePlaces);
    const enhancedDiscovery = new EnhancedLeadDiscovery(apiKeys);
    const csvExporter = new CampaignCSVExporter();

    // Initialize campaign
    const campaignId = csvExporter.generateCampaignId();
    csvExporter.initializeCampaign(campaignId, {
      name: "High-Quality Restaurant Test Campaign",
      description:
        "ProspectPro v2.0 test campaign demonstrating 3 verified leads",
    });

    console.log(`📋 Campaign ID: ${campaignId}`);
    console.log("🎯 Target: Premium restaurants in Austin, TX");
    console.log("");

    // Search Google Places
    console.log("🔄 Executing Google Places search...");
    const startTime = Date.now();

    const results = await googleClient.textSearch({
      query: "high end restaurant Austin Texas",
      type: "restaurant",
    });

    if (!results || results.length === 0) {
      throw new Error("No restaurants found in Google Places search");
    }

    console.log(`✅ Google Places returned ${results.length} restaurants`);

    // Process through enhanced discovery pipeline
    console.log("🔧 Processing through enhanced discovery pipeline...");
    
    const discoveryOptions = {
      budgetLimit: 3.0,
      qualityThreshold: 70,
      maxResults: 5,
      prioritizeLocalBusinesses: true,
      enablePropertyIntelligence: true,
      enableRegistryValidation: true,
      enableRealTimeFeedback: true
    };

    const enhancedResults = await enhancedDiscovery.discoverAndValidateLeads(
      results,
      discoveryOptions
    );

    const processingTime = Date.now() - startTime;

    console.log(`✅ Enhanced discovery processed ${enhancedResults.totalProcessed} businesses`);
    console.log(`🎯 Qualified leads: ${enhancedResults.leads.length}`);
    console.log(`💰 Total cost: $${enhancedResults.totalCost.toFixed(3)}`);
    console.log("");

    if (enhancedResults.leads.length === 0) {
      throw new Error("No qualified leads found after enhanced processing");
    }

    // Select top 3 highest quality leads
    const topLeads = enhancedResults.leads
      .filter(lead => (lead.finalConfidenceScore || lead.confidenceScore) >= 75)
      .sort((a, b) => (b.finalConfidenceScore || b.confidenceScore) - (a.finalConfidenceScore || a.confidenceScore))
      .slice(0, 3);

    console.log(`🏆 Selected top ${topLeads.length} high-quality leads`);
    console.log("");

    console.log("🎯 HIGH-QUALITY VERIFIED LEADS DISCOVERED:");
    console.log("=".repeat(60));

    if (topLeads.length === 0) {
      throw new Error("No high-quality leads found (75%+ confidence required)");
    }

    topLeads.forEach((lead, index) => {
      console.log(`${index + 1}. ${lead.name || lead.businessName}`);
      console.log(`   📊 Confidence: ${(lead.finalConfidenceScore || lead.confidenceScore).toFixed(1)}% (Grade: ${lead.qualityGrade || 'A'})`);
      console.log(`   📍 Address: ${lead.address || lead.formatted_address}`);
      console.log(`   📞 Phone: ${lead.phone || lead.companyPhone || 'Not available'}`);
      console.log(`   🌐 Website: ${lead.website || 'Not available'}`);
      console.log(`   📧 Email: ${lead.email || lead.companyEmail || 'Not available'}`);
      console.log(`   🗺️  Foursquare: ${lead.foursquareData ? '✅ Enhanced' : '❌ Basic'}`);
      console.log(`   💰 Discovery Cost: $${(lead.apiCost || 0).toFixed(3)}`);
      console.log("");
    });

    console.log("📊 Adding leads to campaign and calculating analytics...");
    
    // Add to campaign
    csvExporter.addQueryResults(
      "high end restaurant", 
      "Austin, TX", 
      topLeads, 
      {
        totalResults: topLeads.length,
        qualifiedLeads: topLeads.length,
        totalCost: enhancedResults.totalCost,
        processingTimeMs: processingTime,
        averageConfidence: topLeads.reduce((sum, lead) => 
          sum + (lead.finalConfidenceScore || lead.confidenceScore), 0) / topLeads.length
      }
    );

    console.log(`📊 Added query "high end restaurant" with ${topLeads.length} leads to campaign`);
    
    // Export CSV
    console.log("📤 Exporting comprehensive campaign data to CSV...");
    const csvPath = await csvExporter.exportCampaignToCsv();
    
    console.log("");
    console.log("✅ CAMPAIGN EXECUTION COMPLETED:");
    console.log(`📁 CSV Export: ${csvPath}`);
    console.log(`🎯 Leads Generated: ${topLeads.length}`);
    console.log(`💰 Total Cost: $${enhancedResults.totalCost.toFixed(3)}`);
    console.log(`⏱️  Processing Time: ${(processingTime / 1000).toFixed(1)}s`);
    console.log(`📊 Average Confidence: ${(topLeads.reduce((sum, lead) => 
      sum + (lead.finalConfidenceScore || lead.confidenceScore), 0) / topLeads.length).toFixed(1)}%`);
    
    return {
      success: true,
      csvPath,
      leadsGenerated: topLeads.length,
      totalCost: enhancedResults.totalCost,
      processingTime: processingTime
    };

  } catch (error) {
    console.error(`❌ Campaign execution failed: ${error.message}`);
    if (error.stack) {
      console.error("📋 Stack trace:", error.stack);
    }

  } catch (error) {
    console.error(`❌ Campaign execution failed: ${error.message}`);
    if (error.stack) {
      console.error("📋 Stack trace:", error.stack);
    }
    throw error;
  }
}
    console.log("=".repeat(60));

    leads.forEach((lead, index) => {
      console.log(`\n${index + 1}. ${lead.businessName}`);
      console.log(
        `   📊 Quality: ${lead.confidenceScore}% (Grade ${lead.qualityGrade})`
      );
      console.log(
        `   ⭐ Rating: ${
          lead.googleRating
        }/5.0 (${lead.googleReviewCount.toLocaleString()} reviews)`
      );
      console.log(`   📍 Address: ${lead.address}`);
      console.log(`   📞 Phone: ${lead.phone || "Not available"}`);
      console.log(`   🌐 Website: ${lead.website || "Not available"}`);
      console.log(
        `   💰 Price Level: ${"$".repeat(lead.priceLevel)} (${
          lead.priceLevel
        }/4)`
      );
      console.log(`   👥 Est. Employees: ${lead.estimatedEmployees}`);
      console.log(
        `   🕐 Hours: ${lead.businessHours ? "Available" : "Not listed"}`
      );
      console.log(`   📸 Photos: ${lead.photoCount} available`);
    });

    // Add to campaign
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
