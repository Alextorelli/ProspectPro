/**
 * Production Test: West Coast SMB Lead Generation
 * Target: High-quality trades and wellness businesses
 * Budget: $5.00 total across multiple metro areas
 */

const fetch = require("node-fetch");

const baseURL = "http://localhost:3000";
const totalBudget = 5.0;

// Test searches across West Coast metros
const testSearches = [
  {
    name: "San Diego Plumbers",
    businessType: "plumber",
    location: "San Diego, CA",
    maxResults: 2,
    budget: 1.0,
    filters: {
      minRating: 4.2,
      minReviews: 20,
    },
  },
  {
    name: "Portland Wellness Studios",
    businessType: "wellness center",
    location: "Portland, OR",
    maxResults: 2,
    budget: 1.0,
    filters: {
      minRating: 4.0,
      minReviews: 15,
    },
  },
  {
    name: "Seattle Massage Therapy",
    businessType: "massage therapist",
    location: "Seattle, WA",
    maxResults: 2,
    budget: 1.0,
    filters: {
      minRating: 4.3,
      minReviews: 10,
    },
  },
  {
    name: "Los Angeles HVAC",
    businessType: "hvac contractor",
    location: "Los Angeles, CA",
    maxResults: 2,
    budget: 1.0,
    filters: {
      minRating: 4.1,
      minReviews: 25,
    },
  },
  {
    name: "San Francisco Beauty Salons",
    businessType: "beauty salon",
    location: "San Francisco, CA",
    maxResults: 2,
    budget: 1.0,
    filters: {
      minRating: 4.0,
      minReviews: 30,
    },
  },
];

async function runProductionTest() {
  console.log("🚀 STARTING WEST COAST SMB PRODUCTION TEST");
  console.log("==========================================");
  console.log(`Target: High-quality trades & wellness businesses`);
  console.log(`Budget: $${totalBudget.toFixed(2)}`);
  console.log(`Expected: 8-10 qualified leads across 5 metro areas`);
  console.log("");

  const allResults = [];
  let totalCost = 0;
  let totalLeads = 0;
  let qualifiedLeads = 0;

  // Test server connectivity first
  try {
    console.log("🔍 Testing server connectivity...");
    const healthCheck = await fetch(`${baseURL}/health`);
    if (!healthCheck.ok) {
      throw new Error(`Server health check failed: ${healthCheck.status}`);
    }
    console.log("✅ Server is healthy and ready");
    console.log("");
  } catch (error) {
    console.error("❌ Server connectivity failed:", error.message);
    console.log("Please ensure the server is running with: node server.js");
    return;
  }

  // Run each search sequentially for budget control
  for (let i = 0; i < testSearches.length; i++) {
    const search = testSearches[i];

    console.log(`\n🔍 SEARCH ${i + 1}/5: ${search.name}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`Location: ${search.location}`);
    console.log(`Type: ${search.businessType}`);
    console.log(`Budget: $${search.budget.toFixed(2)}`);
    console.log(
      `Quality: ${search.filters.minRating}+ stars, ${search.filters.minReviews}+ reviews`
    );

    try {
      const searchPayload = {
        businessType: search.businessType,
        location: search.location,
        maxResults: search.maxResults,
        radius: 25000, // 25km radius
        budget: search.budget,
        filters: search.filters,
        enrichmentOptions: {
          includeEmails: true,
          includeOwnerInfo: true,
          validateWebsite: true,
          verifyEmails: true,
          includeRegistryData: true,
        },
      };

      console.log("⚡ Sending API request...");
      const startTime = Date.now();

      const response = await fetch(`${baseURL}/api/business/discover`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(searchPayload),
        timeout: 60000, // 60 second timeout
      });

      const processingTime = Date.now() - startTime;

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ API Error ${response.status}: ${errorText}`);
        continue;
      }

      const result = await response.json();
      console.log(`⏱️  Processing time: ${processingTime}ms`);

      // Parse results
      const businesses = result.businesses || [];
      const searchCost = parseFloat(result.totalCost || 0);
      const searchQualified = businesses.filter(
        (b) => b.confidence >= 80
      ).length;

      console.log(`📊 Results:`);
      console.log(`   • Found: ${businesses.length} businesses`);
      console.log(`   • Qualified (80%+): ${searchQualified}`);
      console.log(`   • Cost: $${searchCost.toFixed(3)}`);
      console.log(`   • Campaign ID: ${result.campaignId || "N/A"}`);

      // Store results
      allResults.push({
        searchName: search.name,
        location: search.location,
        businesses,
        cost: searchCost,
        qualified: searchQualified,
        campaignId: result.campaignId,
      });

      totalCost += searchCost;
      totalLeads += businesses.length;
      qualifiedLeads += searchQualified;

      // Show sample businesses
      if (businesses.length > 0) {
        console.log("\n📋 Sample Results:");
        businesses.slice(0, 2).forEach((business, idx) => {
          console.log(`   ${idx + 1}. ${business.name || "Unnamed Business"}`);
          console.log(`      📍 ${business.address || "No address"}`);
          console.log(
            `      ⭐ ${business.rating || "No rating"} (${
              business.user_ratings_total || 0
            } reviews)`
          );
          console.log(`      🌐 ${business.website || "No website"}`);
          console.log(`      📧 ${business.email || "No email found"}`);
          console.log(
            `      👤 ${business.owner_name || "Owner not identified"}`
          );
          console.log(`      💯 Confidence: ${business.confidence || 0}%`);
          console.log(`      💰 Cost: $${(business.cost || 0).toFixed(3)}`);
        });
      }

      // Budget check
      if (totalCost >= totalBudget * 0.9) {
        console.log(
          `\n⚠️  Approaching budget limit ($${totalCost.toFixed(
            2
          )}/$${totalBudget.toFixed(2)})`
        );
        console.log("Stopping searches to stay within budget.");
        break;
      }

      // Delay between searches for rate limiting
      if (i < testSearches.length - 1) {
        console.log("\n⏸️  Waiting 3 seconds before next search...");
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    } catch (error) {
      console.error(`❌ Search failed: ${error.message}`);
      continue;
    }
  }

  // Final summary
  console.log("\n\n🎯 PRODUCTION TEST RESULTS");
  console.log("═══════════════════════════════════════════════════");
  console.log(`✅ Total searches completed: ${allResults.length}/5`);
  console.log(`✅ Total businesses found: ${totalLeads}`);
  console.log(`✅ Qualified leads (80%+): ${qualifiedLeads}`);
  console.log(`✅ Total cost: $${totalCost.toFixed(3)}`);
  console.log(
    `✅ Cost per qualified lead: $${
      qualifiedLeads > 0 ? (totalCost / qualifiedLeads).toFixed(3) : "0.000"
    }`
  );
  console.log(
    `✅ Budget utilization: ${((totalCost / totalBudget) * 100).toFixed(1)}%`
  );

  // Show best results
  const allBusinesses = allResults.flatMap((r) => r.businesses);
  const topQualified = allBusinesses
    .filter((b) => b.confidence >= 80)
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 5);

  if (topQualified.length > 0) {
    console.log("\n🏆 TOP QUALIFIED LEADS:");
    topQualified.forEach((business, idx) => {
      console.log(`${idx + 1}. ${business.name}`);
      console.log(`   📍 ${business.address}`);
      console.log(`   👤 ${business.owner_name || "Owner TBD"}`);
      console.log(`   📧 ${business.email || "Email TBD"}`);
      console.log(`   💯 ${business.confidence}% confidence`);
      console.log(`   🏷️  ${business.business_type || "Type TBD"}`);
    });
  }

  // Campaign export instructions
  if (allResults.length > 0 && allResults[0].campaignId) {
    console.log("\n📤 EXPORT INSTRUCTIONS:");
    console.log("To export these results to CSV:");
    allResults.forEach((result, idx) => {
      if (result.campaignId) {
        console.log(
          `${idx + 1}. curl "http://localhost:3000/api/campaigns/${
            result.campaignId
          }/export?format=csv&minConfidence=70"`
        );
      }
    });
  }

  console.log("\n✅ Production test completed successfully!");
}

// Handle uncaught errors
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

// Run the test
if (require.main === module) {
  runProductionTest().catch((error) => {
    console.error("Production test failed:", error);
    process.exit(1);
  });
}

module.exports = { runProductionTest };
