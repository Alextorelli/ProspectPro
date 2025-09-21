/**
 * Targeted Apollo.io Integration Test
 *
 * Specifically tests Apollo organization enrichment with budget allocation
 * for API calls and validates the enhanced email pattern generation
 */

require("dotenv").config();
const MultiSourceEmailDiscovery = require("./modules/api-clients/multi-source-email-discovery");

// Configuration that encourages API usage
const APOLLO_TEST_CONFIG = {
  hunterApiKey: process.env.HUNTER_IO_API_KEY,
  apolloApiKey: process.env.APOLLO_API_KEY || "sRlHxW_zYKpcToD-tWtRVQ",
  maxDailyCost: 10.0, // Higher budget to allow API calls
  maxPerLeadCost: 2.0, // Higher per-lead budget
  minEmailConfidence: 50, // Lower threshold to see more results
  maxEmailsPerBusiness: 15, // Allow more emails

  // Force API usage by reducing pattern confidence
  circuitBreakerThreshold: 10, // Higher threshold
};

async function testApolloIntegration() {
  console.log("🎯 Targeted Apollo.io Integration Test");
  console.log("=".repeat(50));

  const discovery = new MultiSourceEmailDiscovery(APOLLO_TEST_CONFIG);

  // Test cases that should trigger Apollo enrichment
  const testCases = [
    {
      name: "Salesforce (Technology)",
      data: {
        business_name: "Salesforce",
        website: "https://salesforce.com",
        industry: "Technology",
      },
    },
    {
      name: "Stripe (Fintech)",
      data: {
        business_name: "Stripe",
        website: "https://stripe.com",
        industry: "Financial Technology",
      },
    },
    {
      name: "GitHub (Developer Tools)",
      data: {
        business_name: "GitHub",
        website: "https://github.com",
        industry: "Software Development",
      },
    },
  ];

  let totalResults = [];

  for (const testCase of testCases) {
    console.log(`\n🧪 Testing: ${testCase.name}`);
    console.log("-".repeat(30));

    try {
      // Manually test Apollo Organization Intelligence first
      console.log("🏢 Step 1: Apollo Organization Intelligence");
      const apolloIntelligence =
        await discovery.apolloClient.getOrganizationIntelligence(
          testCase.data.website.replace("https://", "").replace("http://", "")
        );

      if (apolloIntelligence.success) {
        console.log(
          `✅ Apollo Intelligence: ${apolloIntelligence.confidence}% confidence`
        );
        console.log(
          `🏢 Company: ${
            apolloIntelligence.intelligence.apolloData?.name || "Unknown"
          }`
        );
        console.log(
          `👥 Employees: ${
            apolloIntelligence.intelligence.apolloData?.employees || "Unknown"
          }`
        );
        console.log(
          `📧 Generated patterns: ${apolloIntelligence.intelligence.emails.length}`
        );

        // Show recommendations
        if (apolloIntelligence.recommendNextSteps?.length > 0) {
          console.log("💡 Recommendations:");
          apolloIntelligence.recommendNextSteps.forEach((rec, i) => {
            console.log(
              `  ${i + 1}. ${rec.action} via ${rec.service} (${rec.priority})`
            );
          });
        }
      }

      // Now test full discovery pipeline
      console.log("\n🔄 Step 2: Full Discovery Pipeline");
      const result = await discovery.discoverBusinessEmails(testCase.data);

      console.log(`${result.success ? "✅" : "❌"} Discovery Result:`);
      console.log(`  📧 Emails: ${result.emails.length}`);
      console.log(`  🎯 Confidence: ${result.confidence_score}%`);
      console.log(`  💰 Cost: $${result.total_cost.toFixed(3)}`);
      console.log(`  🔄 Sources: ${result.sources_used.join(", ")}`);

      // Show email breakdown by source
      const emailsBySource = {};
      result.emails.forEach((email) => {
        if (!emailsBySource[email.source]) {
          emailsBySource[email.source] = [];
        }
        emailsBySource[email.source].push(email);
      });

      console.log("\n📊 Email Sources:");
      Object.entries(emailsBySource).forEach(([source, emails]) => {
        console.log(`  ${source}: ${emails.length} emails`);
        // Show sample emails from each source
        emails.slice(0, 2).forEach((email) => {
          console.log(`    - ${email.value} (${email.confidence}%)`);
          if (email.reasoning) {
            console.log(`      💡 ${email.reasoning}`);
          }
        });
      });

      totalResults.push({
        name: testCase.name,
        result,
        apolloIntelligence: apolloIntelligence.success
          ? apolloIntelligence
          : null,
      });
    } catch (error) {
      console.log(`❌ Test failed: ${error.message}`);
      totalResults.push({
        name: testCase.name,
        error: error.message,
      });
    }
  }

  // Final analysis
  console.log("\n" + "=".repeat(50));
  console.log("📊 APOLLO INTEGRATION ANALYSIS");
  console.log("=".repeat(50));

  const successfulTests = totalResults.filter(
    (r) => r.result && r.result.success
  ).length;
  const apolloUsageTests = totalResults.filter(
    (r) => r.result && r.result.sources_used.includes("apollo")
  ).length;
  const totalEmails = totalResults.reduce(
    (sum, r) => sum + (r.result?.emails?.length || 0),
    0
  );
  const totalCost = totalResults.reduce(
    (sum, r) => sum + (r.result?.total_cost || 0),
    0
  );

  console.log(`✅ Successful Tests: ${successfulTests}/${totalResults.length}`);
  console.log(`🏢 Apollo Usage: ${apolloUsageTests} tests used Apollo data`);
  console.log(`📧 Total Emails: ${totalEmails}`);
  console.log(`💰 Total Cost: $${totalCost.toFixed(3)}`);

  // Apollo-specific analysis
  const apolloIntelligenceTests = totalResults.filter(
    (r) => r.apolloIntelligence
  ).length;
  console.log(
    `🧠 Apollo Intelligence: ${apolloIntelligenceTests} tests retrieved organization data`
  );

  if (apolloIntelligenceTests > 0) {
    console.log("🎯 Apollo Organization Enrichment: FUNCTIONAL");
  } else {
    console.log("⚠️ Apollo Organization Enrichment: LIMITED");
  }

  // Discovery engine stats
  const engineStats = discovery.stats;
  console.log("\n📈 Engine Performance:");
  console.log(`  Total Requests: ${engineStats.totalRequests}`);
  console.log(
    `  Success Rate: ${(
      (engineStats.successfulRequests / engineStats.totalRequests) *
      100
    ).toFixed(1)}%`
  );
  console.log(`  Apollo Usage: ${engineStats.apiUsage.apollo}`);
  console.log(`  Pattern Generation: ${engineStats.apiUsage.patterns}`);

  console.log("\n🚀 APOLLO INTEGRATION TEST COMPLETE");
  console.log("=".repeat(50));

  return {
    successRate: (successfulTests / totalResults.length) * 100,
    apolloUsage: apolloUsageTests,
    totalCost,
    apolloFunctional: apolloIntelligenceTests > 0,
  };
}

// Run the test
if (require.main === module) {
  testApolloIntegration()
    .then((results) => {
      console.log("\n🎯 Final Results:");
      console.log(`  Success Rate: ${results.successRate.toFixed(1)}%`);
      console.log(
        `  Apollo Functional: ${results.apolloFunctional ? "YES" : "NO"}`
      );
      console.log(`  Total Cost: $${results.totalCost.toFixed(3)}`);
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Test failed:", error);
      process.exit(1);
    });
}

module.exports = testApolloIntegration;
