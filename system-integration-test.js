#!/usr/bin/env node

/**
 * ProspectPro v2.0 System Integration Test
 * Comprehensive validation of all enhanced components
 */

process.env.SKIP_AUTH_IN_DEV = "true";

async function runSystemIntegrationTest() {
  console.log("🚀 ProspectPro v2.0 System Integration Test");
  console.log("=".repeat(70));
  console.log("📋 Testing: Complete pipeline with all enhancements");
  console.log("");

  const testResults = {
    moduleLoading: false,
    apiConfiguration: false,
    pipelineExecution: false,
    csvExport: false,
    dataQuality: false,
  };

  try {
    // Test 1: Module Loading
    console.log("🔧 Test 1: Enhanced Module Loading...");

    const GooglePlacesClient = require("./modules/api-clients/google-places");
    const EnhancedLeadDiscovery = require("./modules/enhanced-lead-discovery");
    const CampaignCSVExporter = require("./modules/campaign-csv-exporter");
    const FoursquareClient = require("./modules/api-clients/foursquare-places-client");
    const HunterIOClient = require("./modules/api-clients/hunter-io");

    console.log("   ✅ Google Places Client loaded");
    console.log("   ✅ Enhanced Lead Discovery loaded");
    console.log("   ✅ Campaign CSV Exporter loaded");
    console.log("   ✅ Foursquare Places Client loaded");
    console.log("   ✅ Hunter.io Client loaded");
    testResults.moduleLoading = true;
    console.log("");

    // Test 2: API Configuration
    console.log("🔑 Test 2: API Key Configuration...");

    const apiKeys = {
      googlePlaces: process.env.GOOGLE_PLACES_API_KEY,
      foursquare:
        process.env.FOURSQUARE_SERVICE_API_KEY ||
        process.env.FOURSQUARE_PLACES_API_KEY,
      hunterIO: process.env.HUNTER_IO_API_KEY,
      neverBounce: process.env.NEVERBOUNCE_API_KEY,
    };

    let configuredCount = 0;
    Object.entries(apiKeys).forEach(([key, value]) => {
      if (value) {
        console.log(`   ✅ ${key}: Configured`);
        configuredCount++;
      } else {
        console.log(`   ❌ ${key}: Missing`);
      }
    });

    testResults.apiConfiguration = configuredCount >= 2; // At least Google + one other
    console.log(
      `   📊 Configuration Status: ${configuredCount}/4 APIs configured`
    );
    console.log("");

    if (configuredCount < 2) {
      console.log("⚠️  Insufficient API configuration for full testing");
      console.log("   Continuing with available APIs...");
    }

    // Test 3: Pipeline Execution (Quick test)
    console.log("⚡ Test 3: Pipeline Execution Test...");

    const googleClient = new GooglePlacesClient(apiKeys.googlePlaces);
    const enhancedDiscovery = new EnhancedLeadDiscovery(apiKeys);

    // Quick search test
    const startTime = Date.now();
    const testResults_search = await googleClient.textSearch({
      query: "restaurant Austin Texas",
      maxResults: 3,
    });

    if (testResults_search && testResults_search.length > 0) {
      console.log(
        `   ✅ Google Places: Found ${testResults_search.length} businesses`
      );

      // Quick pipeline test with 1 business
      const pipelineOptions = {
        budgetLimit: 0.5,
        maxResults: 1,
        qualityThreshold: 60,
      };

      const enhancedResults = await enhancedDiscovery.discoverAndValidateLeads(
        [testResults_search[0]],
        pipelineOptions
      );

      const executionTime = Date.now() - startTime;

      console.log(
        `   ✅ Enhanced Pipeline: Processed ${enhancedResults.totalProcessed} business`
      );
      console.log(
        `   ✅ Results: ${enhancedResults.leads.length} qualified leads`
      );
      console.log(`   ✅ Cost: $${enhancedResults.totalCost.toFixed(3)}`);
      console.log(
        `   ✅ Execution Time: ${(executionTime / 1000).toFixed(1)}s`
      );

      testResults.pipelineExecution = true;

      // Test 4: CSV Export
      console.log("");
      console.log("📄 Test 4: CSV Export System...");

      const csvExporter = new CampaignCSVExporter();
      const campaignId = csvExporter.generateCampaignId();

      csvExporter.initializeCampaign(campaignId, {
        name: "System Integration Test",
        description: "Automated validation of enhanced CSV export system",
      });

      if (enhancedResults.leads.length > 0) {
        csvExporter.addQueryResults(
          "restaurant integration test",
          "Austin, TX",
          enhancedResults.leads,
          {
            totalResults: enhancedResults.leads.length,
            totalCost: enhancedResults.totalCost,
            processingTimeMs: executionTime,
          }
        );

        const csvPath = await csvExporter.exportCampaignToCsv();
        console.log("   ✅ Campaign initialized");
        console.log("   ✅ Query results added");
        console.log(`   ✅ CSV exported: ${typeof csvPath}`);

        testResults.csvExport = true;

        // Test 5: Data Quality Validation
        console.log("");
        console.log("🔍 Test 5: Data Quality Validation...");

        const testLead = enhancedResults.leads[0];
        const qualityChecks = {
          hasBusinessName: !!(testLead.name || testLead.businessName),
          hasAddress: !!(testLead.address || testLead.formatted_address),
          hasGooglePlaceId: !!(testLead.googlePlaceId || testLead.place_id),
          hasConfidenceScore: !!(
            testLead.finalConfidenceScore || testLead.confidenceScore
          ),
          hasDataSources: !!testLead.allDataSources,
        };

        let qualityScore = 0;
        Object.entries(qualityChecks).forEach(([check, passed]) => {
          console.log(
            `   ${passed ? "✅" : "❌"} ${check}: ${
              passed ? "Valid" : "Missing"
            }`
          );
          if (passed) qualityScore++;
        });

        console.log(
          `   📊 Data Quality Score: ${qualityScore}/5 (${Math.round(
            (qualityScore / 5) * 100
          )}%)`
        );

        // Check for fake data patterns
        const businessName = testLead.name || testLead.businessName || "";
        const address = testLead.address || testLead.formatted_address || "";

        const fakeDataPatterns = [
          /fake|test|sample|demo/i,
          /123 main st|456 elm st/i,
          /\(555\)|555-|000-/,
          /business llc|company inc/i,
        ];

        const hasFakeData = fakeDataPatterns.some(
          (pattern) => pattern.test(businessName) || pattern.test(address)
        );

        if (!hasFakeData && qualityScore >= 4) {
          console.log("   ✅ Zero fake data validation: PASSED");
          testResults.dataQuality = true;
        } else {
          console.log("   ⚠️  Data quality needs improvement");
        }
      } else {
        console.log("   ⚠️  No leads to test CSV export");
      }
    } else {
      console.log("   ❌ Google Places search failed");
    }

    // Final Results
    console.log("");
    console.log("=".repeat(70));
    console.log("📊 SYSTEM INTEGRATION TEST RESULTS");
    console.log("=".repeat(70));

    const testCategories = [
      ["Module Loading", testResults.moduleLoading],
      ["API Configuration", testResults.apiConfiguration],
      ["Pipeline Execution", testResults.pipelineExecution],
      ["CSV Export", testResults.csvExport],
      ["Data Quality", testResults.dataQuality],
    ];

    let passedTests = 0;
    testCategories.forEach(([category, passed]) => {
      console.log(
        `${passed ? "✅" : "❌"} ${category}: ${passed ? "PASSED" : "FAILED"}`
      );
      if (passed) passedTests++;
    });

    const overallScore = Math.round(
      (passedTests / testCategories.length) * 100
    );
    console.log("");
    console.log(
      `🎯 Overall System Health: ${passedTests}/${testCategories.length} tests passed (${overallScore}%)`
    );

    if (overallScore >= 80) {
      console.log("🎉 ProspectPro v2.0 system integration: SUCCESS");
      console.log("✅ System ready for production deployment");
      return { success: true, score: overallScore };
    } else if (overallScore >= 60) {
      console.log("⚠️  ProspectPro v2.0 system integration: PARTIAL SUCCESS");
      console.log("🔧 Some components need optimization");
      return { success: false, score: overallScore, level: "partial" };
    } else {
      console.log("❌ ProspectPro v2.0 system integration: FAILED");
      console.log("🚨 System needs comprehensive debugging");
      return { success: false, score: overallScore, level: "failed" };
    }
  } catch (error) {
    console.error(`💥 System integration test failed: ${error.message}`);
    if (error.stack) {
      console.error(
        "Stack trace:",
        error.stack.split("\n").slice(0, 5).join("\n")
      );
    }
    return { success: false, error: error.message };
  }
}

if (require.main === module) {
  runSystemIntegrationTest().then((result) => {
    process.exit(result.success ? 0 : 1);
  });
}

module.exports = { runSystemIntegrationTest };
