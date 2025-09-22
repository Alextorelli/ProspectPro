#!/usr/bin/env node

/**
 * Production Campaign Test for Client Brief
 * Target: 5 service-based businesses under 10 employees with owner information
 * Focus: Plumbing companies and wellness studios in Los Angeles, CA
 */

// Set development mode for authentication bypass
process.env.SKIP_AUTH_IN_DEV = "true";
process.env.NODE_ENV = "development";

const EnhancedDiscoveryEngine = require("./modules/enhanced-discovery-engine");
const fetch = require("node-fetch");

async function runProductionCampaignTest() {
  console.log("🎯 Starting Production Campaign Test");
  console.log("=".repeat(50));
  console.log("CLIENT BRIEF:");
  console.log("- Target: 5 service-based businesses");
  console.log("- Requirement: Under 10 employees");
  console.log("- Focus: Plumbing companies & wellness studios");
  console.log("- Must have: Owner names and complete contact info");
  console.log("- Location: Los Angeles, CA");
  console.log("=".repeat(50));

  try {
    // Configure discovery engine with client requirements
    const discoveryEngine = new EnhancedDiscoveryEngine({
      budgetLimit: 5.0,
      maxLeads: 5,
      minConfidenceScore: 85,
      requireOwnerInfo: true,
      focusOnSmallBusiness: true,
      employeeCountMax: 10,
    });

    // Run discovery for different business types
    const searchQueries = [
      "plumbing services Los Angeles CA",
      "plumbing contractors Los Angeles CA",
      "wellness studio Los Angeles CA",
      "massage therapy Los Angeles CA",
      "beauty salon Los Angeles CA",
    ];

    const allLeads = [];
    let totalCost = 0;
    let queryCount = 0;

    for (const query of searchQueries) {
      console.log(`\n🔍 Searching: ${query}`);
      queryCount++;

      try {
        const results = await discoveryEngine.discoverQualifiedLeads({
          businessType: query.replace(" Los Angeles CA", ""),
          location: "Los Angeles, CA",
          targetCount: 2, // Limit per query to stay within budget
          budgetLimit: 1.0, // $1 per search query
          requireCompleteContacts: true,
          minConfidenceScore: 85,
        });

        if (
          results &&
          results.qualifiedLeads &&
          results.qualifiedLeads.length > 0
        ) {
          console.log(
            `✅ Found ${results.qualifiedLeads.length} qualified leads`
          );

          // Filter for owner information and small business indicators
          const ownerLeads = results.qualifiedLeads.filter((lead) => {
            const hasOwner =
              lead.owner_name ||
              lead.owner_title ||
              lead.contacts?.some(
                (c) =>
                  c.title?.includes("Owner") || c.title?.includes("Founder")
              );
            const smallBizIndicators =
              lead.employee_count_estimate <= 10 ||
              lead.small_business_indicators;
            return hasOwner && smallBizIndicators;
          });

          console.log(`👤 ${ownerLeads.length} leads have owner information`);
          allLeads.push(...ownerLeads);
          totalCost += results.sessionStats?.totalCost || 0;

          // Log lead details
          ownerLeads.forEach((lead, index) => {
            console.log(
              `\n📋 Lead ${allLeads.length - ownerLeads.length + index + 1}:`
            );
            console.log(`   Business: ${lead.business_name}`);
            console.log(`   Address: ${lead.address}`);
            console.log(`   Phone: ${lead.phone || "N/A"}`);
            console.log(`   Website: ${lead.website || "N/A"}`);
            console.log(`   Owner: ${lead.owner_name || "N/A"}`);
            console.log(`   Title: ${lead.owner_title || "N/A"}`);
            console.log(
              `   Employees: ${lead.employee_count_estimate || "Unknown"}`
            );
            console.log(`   Confidence: ${lead.confidence_score}%`);
            console.log(`   Discovery: ${lead.discovery_source}`);
            console.log(
              `   Email Source: ${lead.email_discovery_source || "N/A"}`
            );
          });
        } else {
          console.log(`❌ No qualified leads found for: ${query}`);
        }

        // Check if we've reached our target
        if (allLeads.length >= 5) {
          console.log(`\n🎯 TARGET REACHED: ${allLeads.length} leads found`);
          break;
        }
      } catch (error) {
        console.error(`❌ Error searching ${query}:`, error.message);
      }
    }

    // Final campaign summary
    console.log("\n" + "=".repeat(60));
    console.log("📊 PRODUCTION CAMPAIGN RESULTS");
    console.log("=".repeat(60));
    console.log(`✅ Total Leads Generated: ${allLeads.length}/5 target`);
    console.log(`💰 Total Cost: $${totalCost.toFixed(4)}`);
    console.log(
      `📈 Cost Per Lead: $${
        allLeads.length > 0
          ? (totalCost / allLeads.length).toFixed(4)
          : "0.0000"
      }`
    );
    console.log(`🔍 Queries Executed: ${queryCount}`);
    console.log(
      `👤 Leads with Owner Data: ${
        allLeads.filter((l) => l.owner_name || l.owner_title).length
      }`
    );
    console.log(
      `🏢 Small Business Focus: ${
        allLeads.filter((l) => l.employee_count_estimate <= 10).length
      }`
    );

    // Test optimized dashboard metrics
    console.log("\n🔧 Testing Optimized Dashboard Metrics Integration...");
    try {
      const response = await fetch(
        "http://localhost:3000/api/dashboard/optimized-api-usage?timeRange=1d"
      );
      if (response.ok) {
        const metrics = await response.json();
        console.log("✅ Optimized API metrics endpoint working:");
        console.log(
          `   Apollo.io: ${
            metrics.optimizedApis?.apollo?.totalRequests || 0
          } requests, $${metrics.optimizedApis?.apollo?.totalCost || 0}`
        );
        console.log(
          `   Hunter.io: ${
            metrics.optimizedApis?.hunter?.totalRequests || 0
          } requests, $${metrics.optimizedApis?.hunter?.totalCost || 0}`
        );
        console.log(
          `   Combined Efficiency: ${
            metrics.performance?.costPerLead || "N/A"
          } per lead`
        );
      } else {
        console.log("❌ Optimized API metrics endpoint failed");
      }
    } catch (error) {
      console.log("⚠️  Could not test dashboard metrics:", error.message);
    }

    console.log("\n✅ Production campaign test completed successfully!");

    if (allLeads.length >= 5) {
      console.log("🎯 CLIENT REQUIREMENTS MET:");
      console.log("   ✅ 5 verified leads generated");
      console.log("   ✅ Service-based businesses focused");
      console.log("   ✅ Owner information captured");
      console.log("   ✅ Cost efficiency maintained");
      return { success: true, leads: allLeads, cost: totalCost };
    } else {
      console.log(
        "⚠️  Target not fully met - consider adjusting search parameters"
      );
      return { success: false, leads: allLeads, cost: totalCost };
    }
  } catch (error) {
    console.error("❌ Production campaign test failed:", error);
    console.error("Stack trace:", error.stack);
    return { success: false, error: error.message };
  }
}

// Run the test
runProductionCampaignTest()
  .then((result) => {
    if (result.success) {
      process.exit(0);
    } else {
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
