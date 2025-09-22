#!/usr/bin/env node
/**
 * ProspectPro Campaign Launcher
 * Quick way to launch campaigns with different configurations
 */

const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (prompt) =>
  new Promise((resolve) => rl.question(prompt, resolve));

console.log("🎯 ProspectPro Campaign Launcher");
console.log("==============================");
console.log();

// Predefined campaign templates
const campaignTemplates = {
  1: {
    name: "Client Brief: Plumbing + Wellness (San Diego)",
    config: {
      businessType: "plumbing company",
      location: "San Diego, CA",
      maxResults: 5,
      budgetLimit: 2.5,
      minConfidenceScore: 80,
      additionalQueries: [
        "wellness studio San Diego",
        "beauty salon San Diego",
      ],
    },
  },
  2: {
    name: "Small Plumbing Companies (West Coast)",
    config: {
      businessType: "plumber",
      location: "Los Angeles, CA",
      maxResults: 10,
      budgetLimit: 5.0,
      minConfidenceScore: 75,
    },
  },
  3: {
    name: "Wellness Studios (Major Cities)",
    config: {
      businessType: "wellness studio",
      location: "Seattle, WA",
      maxResults: 8,
      budgetLimit: 4.0,
      minConfidenceScore: 80,
      additionalQueries: ["yoga studio", "massage therapy"],
    },
  },
  4: {
    name: "Beauty Services (Local)",
    config: {
      businessType: "beauty salon",
      location: "Portland, OR",
      maxResults: 6,
      budgetLimit: 3.0,
      minConfidenceScore: 85,
    },
  },
  5: {
    name: "Custom Campaign",
    config: null, // Will prompt for custom values
  },
};

async function main() {
  try {
    // Check if server is running
    console.log("🔍 Checking server status...");

    try {
      const response = await fetch("http://localhost:3000/health");
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }
      const health = await response.json();
      console.log(`✅ Server status: ${health.status}`);
    } catch (serverError) {
      console.log("❌ ProspectPro server not responding");
      console.log("   Please run: npm start");
      console.log("   Then try this script again");
      process.exit(1);
    }

    console.log();
    console.log("📋 Available Campaign Templates:");
    console.log("-------------------------------");

    for (const [key, template] of Object.entries(campaignTemplates)) {
      console.log(`${key}. ${template.name}`);
      if (template.config) {
        console.log(
          `   • ${template.config.maxResults} leads, ${template.config.location}, $${template.config.budgetLimit} budget`
        );
      }
    }

    console.log();
    const choice = await question("Select campaign template (1-5): ");

    const selectedTemplate = campaignTemplates[choice];
    if (!selectedTemplate) {
      console.log("❌ Invalid selection");
      process.exit(1);
    }

    let campaignConfig;

    if (choice === "5") {
      // Custom campaign
      console.log();
      console.log("🔧 Custom Campaign Configuration:");

      const businessType = await question(
        'Business type (e.g., "plumbing company"): '
      );
      const location = await question('Location (e.g., "San Diego, CA"): ');
      const maxResults = parseInt(await question("Max results (e.g., 5): "));
      const budgetLimit = parseFloat(
        await question("Budget limit (e.g., 2.50): ")
      );
      const minConfidenceScore = parseInt(
        await question("Min confidence score (e.g., 80): ")
      );

      campaignConfig = {
        businessType,
        location,
        maxResults,
        budgetLimit,
        minConfidenceScore,
        requireCompleteContacts: true,
      };
    } else {
      campaignConfig = selectedTemplate.config;
    }

    console.log();
    console.log(`🚀 Launching: ${selectedTemplate.name}`);
    console.log("=".repeat(selectedTemplate.name.length + 12));
    console.log();
    console.log("📊 Campaign Configuration:");
    console.log(`   Business Type: ${campaignConfig.businessType}`);
    console.log(`   Location: ${campaignConfig.location}`);
    console.log(`   Max Results: ${campaignConfig.maxResults}`);
    console.log(`   Budget Limit: $${campaignConfig.budgetLimit}`);
    console.log(`   Min Confidence: ${campaignConfig.minConfidenceScore}%`);
    if (campaignConfig.additionalQueries) {
      console.log(
        `   Additional Searches: ${campaignConfig.additionalQueries.join(", ")}`
      );
    }

    console.log();
    const confirm = await question("Launch this campaign? (y/N): ");

    if (confirm.toLowerCase() !== "y") {
      console.log("Campaign cancelled");
      process.exit(0);
    }

    // Launch the campaign
    console.log();
    console.log("🔄 Launching campaign...");
    console.log("This may take 30-60 seconds...");
    console.log();

    const startTime = Date.now();

    try {
      const response = await fetch(
        "http://localhost:3000/api/business-discovery/discover-businesses",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...campaignConfig,
            requireCompleteContacts: true,
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Campaign failed: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      const duration = Date.now() - startTime;

      // Display results
      console.log("✅ Campaign Completed Successfully!");
      console.log("==================================");
      console.log();

      console.log("📈 Campaign Results:");
      console.log(`   Campaign ID: ${result.campaignId}`);
      console.log(`   Processing Time: ${(duration / 1000).toFixed(1)}s`);
      console.log(`   Businesses Found: ${result.results.totalFound}`);
      console.log(`   Qualified Leads: ${result.results.qualified}`);
      console.log(`   Success Rate: ${result.results.qualificationRate}`);
      console.log(
        `   Average Confidence: ${result.results.averageConfidence.toFixed(1)}%`
      );
      console.log();

      console.log("💰 Cost Breakdown:");
      console.log(`   Total Cost: $${result.costs.totalCost.toFixed(3)}`);
      console.log(`   Cost per Lead: $${result.costs.costPerLead.toFixed(3)}`);
      console.log(
        `   Budget Used: ${(
          (result.costs.totalCost / campaignConfig.budgetLimit) *
          100
        ).toFixed(1)}%`
      );
      console.log();

      if (result.leads && result.leads.length > 0) {
        console.log("🎯 Qualified Leads Found:");
        console.log("========================");

        result.leads.forEach((lead, index) => {
          console.log(`${index + 1}. ${lead.businessName}`);
          console.log(`   📧 ${lead.email || "Email not found"}`);
          console.log(`   📞 ${lead.phone || "Phone not found"}`);
          console.log(`   📍 ${lead.address || "Address not found"}`);
          console.log(`   🌐 ${lead.website || "Website not found"}`);
          console.log(`   📊 Confidence: ${lead.confidenceScore}%`);
          console.log();
        });

        console.log("📥 Export Options:");
        console.log(
          `   CSV Export: curl http://localhost:3000/api/campaigns/export/${result.campaignId}`
        );
        console.log(`   Dashboard: http://localhost:3000/admin-dashboard.html`);
      } else {
        console.log("⚠️  No qualified leads found");
        console.log(
          "   Try adjusting search criteria or lowering confidence threshold"
        );
      }
    } catch (campaignError) {
      console.log("❌ Campaign failed:", campaignError.message);
      console.log();
      console.log("💡 Common fixes:");
      console.log("   • Check that Google Places API key is configured");
      console.log("   • Verify API key has billing enabled");
      console.log("   • Try a different location or business type");
      console.log("   • Run: node verify-setup.js");
    }
  } catch (error) {
    console.error("❌ Launcher failed:", error.message);
  } finally {
    rl.close();
  }
}

// Run the launcher
main().catch(console.error);
