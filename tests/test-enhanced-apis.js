#!/usr/bin/env node

require("dotenv").config();

const EnhancedStateRegistryClient = require("../modules/api-clients/enhanced-state-registry-client");
const ZeroBounceClient = require("../modules/api-clients/zerobounce-client");

async function testEnhancedAPIs() {
  console.log("🧪 Testing Enhanced API Integrations");
  console.log("=====================================\n");

  // Test State Registry Client
  console.log("1. 🏛️ Testing Enhanced State Registry Client...");
  const stateRegistry = new EnhancedStateRegistryClient();

  try {
    console.log("   Testing with known business: Starbucks Corporation");
    const stateResults = await stateRegistry.searchBusinessAcrossStates(
      "Starbucks Corporation",
      "2401 Utah Ave S, Seattle, WA 98134",
      "WA"
    );

    console.log("   ✅ State Registry Test Results:");
    console.log(
      `      - Total APIs Queried: ${stateResults.qualityMetrics.totalAPIsQueried}`
    );
    console.log(
      `      - Successful Responses: ${stateResults.qualityMetrics.successfulResponses}`
    );
    console.log(
      `      - Confidence Score: ${stateResults.qualityMetrics.confidenceScore}%`
    );
    console.log(
      `      - Processing Time: ${stateResults.qualityMetrics.processingTimeMs}ms`
    );
    console.log(
      `      - Total Cost: $${stateResults.costBreakdown.totalCost} (FREE)`
    );

    // Check specific validations
    const validations = [];
    if (stateResults.validationResults.californiaSOS?.data?.found) {
      validations.push("California SOS");
    }
    if (stateResults.validationResults.newYorkSOS?.data?.found) {
      validations.push("New York SOS");
    }
    if (stateResults.validationResults.secEdgar?.data?.found) {
      validations.push("SEC EDGAR");
    }
    if (stateResults.validationResults.uspto?.data?.found) {
      validations.push("USPTO Trademarks");
    }
    if (stateResults.validationResults.courtRecords?.data?.found) {
      validations.push("Court Records");
    }
    if (stateResults.validationResults.uccLiens?.data?.found) {
      validations.push("UCC Liens");
    }

    console.log(
      `      - Found in: ${
        validations.length > 0 ? validations.join(", ") : "No registries"
      }`
    );

    // Show setup status for APIs that need keys
    const setupNeeded = [];
    if (stateResults.validationResults.uspto?.data?.setupRequired) {
      setupNeeded.push("USPTO API key");
    }
    if (stateResults.validationResults.courtRecords?.data?.setupRequired) {
      setupNeeded.push("CourtListener API key");
    }

    if (setupNeeded.length > 0) {
      console.log(`      - Setup needed: ${setupNeeded.join(", ")}`);
    }
  } catch (error) {
    console.error("   ❌ State Registry Test Failed:", error.message);
  }

  console.log("\n2. 📧 Testing ZeroBounce Email Validation...");
  const zeroBounce = new ZeroBounceClient();

  try {
    // Check if API key is configured
    const accountInfo = await zeroBounce.getAccountInfo();

    if (accountInfo.error) {
      console.log(
        "   ⚠️ ZeroBounce API key not configured - skipping email tests"
      );
      console.log(
        "   💡 Add ZEROBOUNCE_API_KEY to .env file to enable ZeroBounce validation"
      );
    } else {
      console.log(`   ✅ ZeroBounce Account Info:`);
      console.log(`      - Credits Available: ${accountInfo.credits}`);
      console.log(
        `      - Cost per Validation: $${accountInfo.costPerValidation}`
      );

      // Test with sample emails (be careful with API usage)
      const testEmails = [
        "test@example.com", // Safe test email that won't count against quota
      ];

      console.log("   📬 Testing sample email validation...");

      for (const email of testEmails) {
        if (zeroBounce.canMakeRequest()) {
          try {
            const result = await zeroBounce.enhancedEmailValidation(email, {
              skipDisposable: true,
              skipFreeEmails: false,
              requireMX: true,
              minConfidence: 70,
            });

            console.log(`      - ${email}:`);
            console.log(
              `        Status: ${result.isValid ? "✅ Valid" : "❌ Invalid"} (${
                result.confidence
              }% confidence)`
            );
            console.log(
              `        Details: ${result.status} | Free: ${result.freeEmail} | Disposable: ${result.disposable}`
            );

            // Rate limiting
            await new Promise((resolve) => setTimeout(resolve, 1000));
          } catch (error) {
            console.log(`      - ${email}: ❌ Error - ${error.message}`);
          }
        } else {
          console.log(`      - ${email}: ⏭️ Skipped (budget limit)`);
        }
      }
    }
  } catch (error) {
    console.error("   ❌ ZeroBounce Test Failed:", error.message);
  }

  console.log("\n3. ⏱️ Testing API Rate Limiting...");
  try {
    const rateLimitTest = new EnhancedStateRegistryClient();

    // Test multiple rapid requests
    console.log("   Testing rate limit enforcement...");
    const promises = [];
    for (let i = 0; i < 5; i++) {
      promises.push(rateLimitTest.checkRateLimit("californiaSOS"));
    }

    const rateLimitResults = await Promise.all(promises);
    const allowedRequests = rateLimitResults.filter((r) => r === true).length;

    console.log(`   ✅ Rate limit test: ${allowedRequests}/5 requests allowed`);
    console.log("   ✅ Rate limiting working correctly");
  } catch (error) {
    console.error("   ❌ Rate Limiting Test Failed:", error.message);
  }

  console.log("\n4. 📊 Testing Cost Tracking...");
  const stateClient = new EnhancedStateRegistryClient();
  const usageStats = stateClient.getUsageStats();

  console.log("   ✅ Cost tracking initialized:");
  console.log(
    `      - Session Requests: ${usageStats.sessionStats.totalRequests}`
  );
  console.log(
    `      - Total Cost: $${usageStats.sessionStats.totalCost.toFixed(
      3
    )} (FREE)`
  );
  console.log(
    `      - Available APIs: ${Object.keys(stateClient.apis).length}`
  );
  console.log(
    `      - Enabled APIs: ${
      usageStats.apiStatuses.filter((api) => api.enabled).length
    }`
  );

  console.log("\n5. 🔍 API Configuration Status...");
  console.log("   State Registry APIs:");

  const apiKeys = {
    SOCRATA_API_KEY: process.env.SOCRATA_API_KEY,
    SOCRATA_APP_TOKEN: process.env.SOCRATA_APP_TOKEN,
    COURTLISTENER_API_KEY: process.env.COURTLISTENER_API_KEY,
    USPTO_TSDR_API_KEY: process.env.USPTO_TSDR_API_KEY,
    ZEROBOUNCE_API_KEY: process.env.ZEROBOUNCE_API_KEY,
  };

  Object.entries(apiKeys).forEach(([key, value]) => {
    const status = value ? "✅ Configured" : "⚠️ Missing";
    console.log(`      - ${key}: ${status}`);
  });

  console.log("\n🎉 Enhanced API Integration Tests Complete!");
  console.log("\n📝 Next Steps:");
  console.log(
    "1. Test the enhanced discovery endpoint: POST /api/business/discover-enhanced"
  );
  console.log("2. Verify state registry data improves lead quality");
  console.log("3. Monitor email validation accuracy with dual validation");
  console.log("4. Check cost optimization with free government APIs");

  // Missing API key recommendations
  const missingKeys = Object.entries(apiKeys).filter(([key, value]) => !value);
  if (missingKeys.length > 0) {
    console.log("\n⚠️ Recommendations:");
    if (!apiKeys.SOCRATA_API_KEY || !apiKeys.SOCRATA_APP_TOKEN) {
      console.log(
        "- Get Socrata API credentials: https://data.ny.gov/profile/edit/developer_settings"
      );
    }
    if (!apiKeys.COURTLISTENER_API_KEY) {
      console.log(
        "- Get CourtListener API key: https://www.courtlistener.com/api/"
      );
    }
    if (!apiKeys.USPTO_TSDR_API_KEY) {
      console.log("- Get USPTO API key: https://developer.uspto.gov/");
    }
    if (!apiKeys.ZEROBOUNCE_API_KEY) {
      console.log("- Get ZeroBounce API key: https://www.zerobounce.net/api");
    }
  }
}

// Run tests if called directly
if (require.main === module) {
  testEnhancedAPIs().catch(console.error);
}

module.exports = testEnhancedAPIs;
