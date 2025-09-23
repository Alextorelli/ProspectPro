/**
 * Test Enhanced Multi-Source Discovery Engine
 * Tests the integration of Foursquare + Google Places for cost optimization
 */

require("dotenv").config();
const EnhancedDiscoveryEngine = require("../modules/core/core-business-discovery-engine");

// Mock API keys for testing (real keys should be in .env)
const mockApiKeys = {
  googlePlaces: process.env.GOOGLE_PLACES_API_KEY || "test-google-key",
  foursquare: process.env.FOURSQUARE_SERVICE_API_KEY || "test-foursquare-key",
  hunterIO: process.env.HUNTER_API_KEY || "test-hunter-key",
  neverBounce: process.env.NEVERBOUNCE_API_KEY || "test-neverbounce-key",
};

console.log("🧪 Testing Enhanced Multi-Source Discovery Engine");
console.log("=".repeat(60));

async function testMultiSourceDiscovery() {
  try {
    // Initialize discovery engine
    const discoveryEngine = new EnhancedDiscoveryEngine(mockApiKeys);

    console.log(
      "✅ Discovery Engine initialized with multi-source capabilities"
    );
    console.log(
      "📋 Available sources: Foursquare Places API + Google Places API"
    );
    console.log("");

    // Test configuration
    const testConfig = {
      businessType: "wellness",
      location: "San Diego, CA",
      targetCount: 3,
      budgetLimit: 5.0,
      requireCompleteContacts: true,
      minConfidenceScore: 70,
    };

    console.log(`🎯 Test Configuration:`);
    console.log(`   Business Type: ${testConfig.businessType}`);
    console.log(`   Location: ${testConfig.location}`);
    console.log(`   Target: ${testConfig.targetCount} leads`);
    console.log(`   Budget: $${testConfig.budgetLimit}`);
    console.log(`   Min Confidence: ${testConfig.minConfidenceScore}%`);
    console.log("");

    // Test multi-source discovery methods
    console.log("🔍 Testing individual discovery sources...");

    // Test Foursquare discovery
    try {
      const foursquareResults = await discoveryEngine.discoverViaFoursquare(
        "wellness center",
        "San Diego, CA",
        5
      );
      console.log(
        `✅ Foursquare API test: ${foursquareResults.length} results`
      );
    } catch (error) {
      console.log(`⚠️ Foursquare API test: ${error.message}`);
    }

    // Test Google Places discovery
    try {
      const googleResults = await discoveryEngine.discoverViaGooglePlaces(
        "wellness center",
        "San Diego, CA",
        5
      );
      console.log(`✅ Google Places API test: ${googleResults.length} results`);
    } catch (error) {
      console.log(`⚠️ Google Places API test: ${error.message}`);
    }

    console.log("");
    console.log("🚀 Testing full multi-source discovery pipeline...");
    console.log("-".repeat(60));

    // Run full discovery with cost tracking
    const startTime = Date.now();
    const results = await discoveryEngine.discoverQualifiedLeads(testConfig);
    const endTime = Date.now();

    console.log("");
    console.log("📊 MULTI-SOURCE DISCOVERY RESULTS");
    console.log("=".repeat(60));
    console.log(
      `⏱️  Total Time: ${((endTime - startTime) / 1000).toFixed(1)}s`
    );
    console.log(`🎯 Target Met: ${results.targetMet ? "✅" : "❌"}`);
    console.log(
      `📈 Success Rate: ${results.sessionStats?.successRate?.toFixed(1) || 0}%`
    );
    console.log(`💰 Total Cost: $${results.totalCost?.toFixed(3) || 0}`);
    console.log(`💡 Cost Per Lead: $${results.costPerLead?.toFixed(3) || 0}`);
    console.log("");

    // Source breakdown
    console.log("📋 SOURCE BREAKDOWN:");
    if (discoveryEngine.sourceStats) {
      const { foursquare, google } = discoveryEngine.sourceStats;
      console.log(
        `   Foursquare: ${foursquare.searches} searches, ${
          foursquare.businesses
        } businesses, $${foursquare.cost.toFixed(3)}`
      );
      console.log(
        `   Google Places: ${google.searches} searches, ${
          google.businesses
        } businesses, $${google.cost.toFixed(3)}`
      );

      const estimatedSavings = discoveryEngine.calculateCostSavings();
      console.log(`   💡 Estimated Savings: $${estimatedSavings.toFixed(3)}`);
    }
    console.log("");

    // Quality metrics
    if (results.qualityMetrics) {
      console.log("🎯 QUALITY METRICS:");
      console.log(
        `   All have email: ${
          results.qualityMetrics.allHaveEmail ? "✅" : "❌"
        }`
      );
      console.log(
        `   All have phone: ${
          results.qualityMetrics.allHavePhone ? "✅" : "❌"
        }`
      );
      console.log(
        `   All have website: ${
          results.qualityMetrics.allHaveWebsite ? "✅" : "❌"
        }`
      );
      console.log(
        `   Avg confidence: ${
          results.qualityMetrics.avgConfidence?.toFixed(1) || 0
        }%`
      );
    }
    console.log("");

    // Sample leads
    if (results.leads && results.leads.length > 0) {
      console.log("📋 SAMPLE QUALIFIED LEADS:");
      console.log("-".repeat(60));

      results.leads.slice(0, 3).forEach((lead, index) => {
        const source = lead.source || "unknown";
        const confidence =
          lead.finalConfidenceScore || lead.confidenceScore || 0;
        console.log(
          `${index + 1}. ${
            lead.name || lead.businessName || "Unknown Business"
          }`
        );
        console.log(`   Source: ${source} | Confidence: ${confidence}%`);
        console.log(
          `   Address: ${
            lead.address || lead.formatted_address || "Not available"
          }`
        );
        console.log(
          `   Phone: ${lead.phone || lead.companyPhone || "Not available"}`
        );
        console.log(`   Website: ${lead.website || "Not available"}`);
        console.log(
          `   Email: ${lead.email || lead.companyEmail || "Not available"}`
        );
        console.log("");
      });
    }

    console.log("✅ Multi-source discovery test completed successfully!");
    return results;
  } catch (error) {
    console.error("❌ Multi-source discovery test failed:", error.message);
    console.error(error.stack);
    throw error;
  }
}

// Run the test
if (require.main === module) {
  testMultiSourceDiscovery()
    .then(() => {
      console.log("🎉 All tests passed!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Test failed:", error.message);
      process.exit(1);
    });
}

module.exports = { testMultiSourceDiscovery };
