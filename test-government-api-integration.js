/**
 * Test script for government API integration in enhanced lead discovery
 */

const EnhancedLeadDiscovery = require("./modules/enhanced-lead-discovery");

async function testGovernmentAPIIntegration() {
  console.log(
    "🧪 Testing Government API Integration in Enhanced Lead Discovery"
  );

  // Initialize with test API keys (you'll need to add real keys for full testing)
  const apiKeys = {
    foursquare: {
      clientId: process.env.FOURSQUARE_CLIENT_ID || "test_client_id",
      clientSecret:
        process.env.FOURSQUARE_CLIENT_SECRET || "test_client_secret",
    },
    hunterIO: process.env.HUNTER_IO_API_KEY || null,
    neverBounce: process.env.NEVERBOUNCE_API_KEY || null,
  };

  const discovery = new EnhancedLeadDiscovery(apiKeys);

  // Test business data
  const testBusinesses = [
    {
      name: "Apple Inc",
      address: "1 Apple Park Way, Cupertino, CA 95014",
      phone: "(408) 996-1010",
      website: "https://www.apple.com",
      rating: 4.5,
      user_ratings_total: 1500,
    },
    {
      name: "Red Cross",
      address: "2025 E Street NW, Washington, DC 20006",
      phone: "(202) 303-4498",
      website: "https://www.redcross.org",
      rating: 4.2,
      user_ratings_total: 800,
    },
  ];

  try {
    console.log("\n🚀 Running enhanced discovery pipeline...");
    const results = await discovery.discoverAndValidateLeads(testBusinesses, {
      budgetLimit: 10.0,
      qualityThreshold: 60,
      maxResults: 2,
    });

    console.log("\n📊 Results Summary:");
    console.log(`- Total processed: ${results.totalProcessed}`);
    console.log(`- Qualified leads: ${results.leads.length}`);
    console.log(`- Total cost: $${results.totalCost.toFixed(2)}`);

    console.log("\n📈 Quality Metrics:");
    console.log(JSON.stringify(results.qualityMetrics, null, 2));

    console.log("\n🔍 Detailed Results:");
    results.leads.forEach((lead, index) => {
      console.log(`\n--- Lead ${index + 1}: ${lead.name} ---`);
      console.log(`Confidence Score: ${lead.finalConfidenceScore}`);
      console.log(`Stage: ${lead.stage}`);

      if (lead.registryValidation) {
        console.log("Government Validation:");
        console.log(
          `- State Registration: ${lead.registryValidation.registeredInAnyState}`
        );
        console.log(
          `- Federal Registration: ${lead.registryValidation.registeredFederally}`
        );
        console.log(`- Nonprofit: ${lead.registryValidation.isNonprofit}`);
      }

      if (lead.foursquareData) {
        console.log(
          `Foursquare Places Found: ${
            lead.foursquareData.found
              ? lead.foursquareData.places?.length || 0
              : 0
          }`
        );
      }
    });

    console.log("\n📊 API Usage Stats:");
    console.log(JSON.stringify(results.usageStats, null, 2));
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    console.error(error.stack);
  }
}

// Run the test
testGovernmentAPIIntegration().catch(console.error);
