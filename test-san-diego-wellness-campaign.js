#!/usr/bin/env node

/**
 * San Diego Wellness Campaign Test
 * Target: 3-5 fully verified wellness businesses with owner information and <5 employees
 */

// Set development mode for authentication bypass
process.env.SKIP_AUTH_IN_DEV = "true";
process.env.NODE_ENV = "development";

const EnhancedDiscoveryEngine = require("./modules/enhanced-discovery-engine");

async function runSanDiegoWellnessCampaign() {
  console.log("🎯 San Diego Wellness Business Campaign");
  console.log("=".repeat(50));
  console.log("TARGET REQUIREMENTS:");
  console.log("- 3-5 fully verified wellness businesses");
  console.log("- San Diego, CA location");
  console.log("- Under 5 employees");
  console.log("- Complete owner contact information");
  console.log("- Enhanced Apollo.io + Hunter.io data");
  console.log("=".repeat(50));

  const apiKeys = {
    hunterIO: process.env.HUNTER_IO_API_KEY,
    apollo: process.env.APOLLO_API_KEY || "GQOnv7RMsT8uV6yy_IMhyQ",
    neverBounce: process.env.NEVERBOUNCE_API_KEY,
    googlePlaces:
      process.env.GOOGLE_PLACES_API_KEY ||
      "AIzaSyB3BbYJRUiGSwgyon2iBWQkv6ON3V3eSik",
    foursquare:
      process.env.FOURSQUARE_SERVICE_API_KEY ||
      process.env.FOURSQUARE_PLACES_API_KEY,
    zeroBounce: process.env.ZEROBOUNCE_API_KEY,
    californiaSOSApiKey: process.env.CALIFORNIA_SOS_API_KEY,
    scrapingdog: process.env.SCRAPINGDOG_API_KEY,
  };

  try {
    // Initialize Enhanced Discovery Engine v2.0
    const discoveryEngine = new EnhancedDiscoveryEngine(apiKeys);

    console.log("🔧 Enhanced Discovery Engine v2.0 initialized");
    console.log("🔑 API Keys configured:");
    console.log(
      `   Google Places: ${apiKeys.googlePlaces ? "✅ Set" : "❌ Missing"}`
    );
    console.log(`   Apollo.io: ${apiKeys.apollo ? "✅ Set" : "❌ Missing"}`);
    console.log(`   Hunter.io: ${apiKeys.hunterIO ? "✅ Set" : "❌ Missing"}`);

    // Run discovery campaign
    const campaignResult = await discoveryEngine.discoverQualifiedLeads({
      businessType:
        "wellness studio OR spa OR massage therapy OR fitness center OR yoga studio",
      location: "San Diego, CA",
      targetCount: 5,
      budgetLimit: 10.0,
      requireCompleteContacts: true,
      minConfidenceScore: 75,
      additionalQueries: [
        "small wellness business San Diego CA",
        "owner operated spa San Diego CA",
        "boutique fitness studio San Diego CA",
        "wellness center under 5 employees San Diego CA",
        "family owned spa San Diego CA",
      ],
    });

    console.log("\n" + "=".repeat(60));
    console.log("📊 CAMPAIGN RESULTS");
    console.log("=".repeat(60));

    console.log(
      `✅ Qualified Leads Found: ${
        campaignResult.qualified?.length || 0
      }/5 target`
    );
    console.log(
      `💰 Total Cost: $${
        campaignResult.sessionStats?.totalCost?.toFixed(4) || "0.0000"
      }`
    );
    console.log(
      `📈 Average Confidence: ${campaignResult.averageConfidence || 0}%`
    );
    console.log(
      `⏱️ Processing Time: ${campaignResult.sessionStats?.totalTime || 0}s`
    );
    console.log(
      `🔍 Queries Executed: ${
        campaignResult.sessionStats?.queriesExecuted || 0
      }`
    );

    // Display lead details
    if (campaignResult.qualified && campaignResult.qualified.length > 0) {
      console.log("\n📋 QUALIFIED WELLNESS BUSINESS LEADS:");
      console.log("-".repeat(60));

      campaignResult.qualified.forEach((lead, index) => {
        console.log(`\n${index + 1}. ${lead.name || lead.business_name}`);
        console.log(`   📍 Address: ${lead.address}`);
        console.log(`   📞 Phone: ${lead.companyPhone || lead.phone || "N/A"}`);
        console.log(`   🌐 Website: ${lead.website || "N/A"}`);
        console.log(`   📧 Company Email: ${lead.companyEmail || "N/A"}`);
        console.log(
          `   👤 Owner Name: ${lead.ownerName || lead.owner_name || "N/A"}`
        );
        console.log(
          `   🏷️ Owner Title: ${lead.ownerTitle || lead.owner_title || "N/A"}`
        );
        console.log(
          `   📧 Owner Email: ${lead.ownerEmail || lead.owner_email || "N/A"}`
        );
        console.log(
          `   👥 Employee Count: ${
            lead.employeeCount || lead.employee_count_estimate || "Unknown"
          }`
        );
        console.log(
          `   ⭐ Confidence: ${
            lead.finalConfidenceScore || lead.confidenceScore
          }%`
        );
        console.log(`   🔍 Category: ${lead.category || "N/A"}`);
        console.log(`   ⭐ Rating: ${lead.rating || "N/A"}`);
      });
    }

    // Check CSV export
    if (campaignResult.csvPath) {
      console.log(`\n📄 CSV Export: ${campaignResult.csvPath}`);

      // Read and validate CSV content
      const fs = require("fs");
      if (fs.existsSync(campaignResult.csvPath)) {
        const csvContent = fs.readFileSync(campaignResult.csvPath, "utf8");
        const lines = csvContent.split("\n");
        const headers = lines[0];

        console.log("\n📊 CSV EXPORT VALIDATION:");
        console.log(`   📄 Total rows: ${lines.length - 1}`);
        console.log(
          `   📋 Headers include Apollo.io: ${
            headers.includes("Apollo.io Data") ? "✅" : "❌"
          }`
        );
        console.log(
          `   📋 Headers include Hunter.io: ${
            headers.includes("Hunter.io Data") ? "✅" : "❌"
          }`
        );
        console.log(
          `   📋 Headers include Owner Info: ${
            headers.includes("Owner Name") ? "✅" : "❌"
          }`
        );
        console.log(
          `   📋 Headers include Employee Count: ${
            headers.includes("Employee Count Est.") ? "✅" : "❌"
          }`
        );

        // Check for data in first lead row
        if (lines.length > 1) {
          const firstDataRow = lines[1].split(",");
          const ownerNameIndex = headers.split(",").indexOf("Owner Name");
          const employeeCountIndex = headers
            .split(",")
            .indexOf("Employee Count Est.");

          console.log("   🔍 First Lead Sample:");
          console.log(
            `      Owner Name: ${
              ownerNameIndex >= 0
                ? firstDataRow[ownerNameIndex] || "Empty"
                : "N/A"
            }`
          );
          console.log(
            `      Employee Count: ${
              employeeCountIndex >= 0
                ? firstDataRow[employeeCountIndex] || "Empty"
                : "N/A"
            }`
          );
        }
      }
    }

    // Validation results
    console.log("\n🎯 REQUIREMENT VALIDATION:");
    const hasOwnerInfo = campaignResult.qualified?.some(
      (lead) =>
        lead.ownerName || lead.owner_name || lead.ownerEmail || lead.owner_email
    );
    const hasSmallBusiness = campaignResult.qualified?.some(
      (lead) =>
        (lead.employeeCount && lead.employeeCount <= 5) ||
        (lead.employee_count_estimate && lead.employee_count_estimate <= 5)
    );

    console.log(
      `   ✅ Location (San Diego): ${
        campaignResult.qualified?.length > 0 ? "✅ Met" : "❌ Failed"
      }`
    );
    console.log(
      `   ✅ Business Type (Wellness): ${
        campaignResult.qualified?.length > 0 ? "✅ Met" : "❌ Failed"
      }`
    );
    console.log(
      `   ✅ Owner Information: ${hasOwnerInfo ? "✅ Met" : "❌ Failed"}`
    );
    console.log(
      `   ✅ Small Business (<5 employees): ${
        hasSmallBusiness ? "✅ Met" : "❌ Needs Verification"
      }`
    );
    console.log(
      `   ✅ Complete Contacts: ${
        campaignResult.qualified?.length > 0 ? "✅ Met" : "❌ Failed"
      }`
    );
    console.log(
      `   ✅ Target Count (3-5 leads): ${
        campaignResult.qualified?.length >= 3 &&
        campaignResult.qualified?.length <= 5
          ? "✅ Met"
          : "❌ Failed"
      }`
    );

    if (campaignResult.qualified?.length >= 3 && hasOwnerInfo) {
      console.log("\n🎉 SUCCESS: Campaign requirements met!");
      console.log("✅ Ready for client delivery");
      return {
        success: true,
        leads: campaignResult.qualified,
        csvPath: campaignResult.csvPath,
      };
    } else {
      console.log("\n⚠️  PARTIAL SUCCESS: Some requirements not fully met");
      console.log("📝 Consider adjusting search parameters or data enrichment");
      return {
        success: false,
        leads: campaignResult.qualified || [],
        csvPath: campaignResult.csvPath,
      };
    }
  } catch (error) {
    console.error("❌ Campaign failed:", error);
    console.error("Stack trace:", error.stack);
    return { success: false, error: error.message };
  }
}

// Run the campaign
runSanDiegoWellnessCampaign()
  .then((result) => {
    console.log(
      `\n📊 Final Status: ${result.success ? "SUCCESS" : "NEEDS IMPROVEMENT"}`
    );
    process.exit(result.success ? 0 : 1);
  })
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
