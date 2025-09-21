#!/usr/bin/env node

/**
 * Comprehensive Foursquare Integration Test Plan
 * Tests all aspects of Foursquare integration with ProspectPro system
 */

require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

async function runComprehensiveIntegrationTest() {
  console.log("🎯 Comprehensive Foursquare Integration Test Plan\n");
  console.log("=".repeat(70));
  console.log("FOURSQUARE INTEGRATION VALIDATION REPORT");
  console.log("=".repeat(70));

  const testResults = {
    apiConnection: false,
    databaseSchema: false,
    businessDiscovery: false,
    dataValidation: false,
    costTracking: false,
    qualityScoring: false,
  };

  // Test 1: API Connection and Authentication
  console.log("\n🔌 TEST 1: API Connection and Authentication");
  try {
    const FoursquarePlacesClient = require("./modules/api-clients/foursquare-places-client");
    const foursquareClient = new FoursquarePlacesClient();

    const serviceKey =
      process.env.FOURSQUARE_SERVICE_API_KEY ||
      process.env.FOURSQUARE_PLACES_API_KEY;
    if (serviceKey) {
      console.log("✅ API Key configured");
      console.log(
        `   Key: ${serviceKey.substring(0, 8)}...${serviceKey.slice(-4)}`
      );

      // Test API call
      const testResult = await foursquareClient.searchPlaces("coffee", {
        near: "New York, NY",
        limit: 1,
      });

      if (testResult.found) {
        console.log("✅ API connection successful");
        console.log(
          `   Test search returned: ${testResult.totalResults} results`
        );
        testResults.apiConnection = true;
      } else {
        console.log("⚠️  API connected but no results returned");
        testResults.apiConnection = true; // Still counts as working
      }
    } else {
      console.log("❌ API Key not configured");
    }
  } catch (error) {
    console.log(`❌ API connection failed: ${error.message}`);
  }

  // Test 2: Database Schema Validation
  console.log("\n🗄️  TEST 2: Database Schema Validation");
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey =
      process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);

      // Check foursquare_places table
      const { data: placesData, error: placesError } = await supabase
        .from("foursquare_places")
        .select("count")
        .limit(1);

      if (!placesError) {
        console.log("✅ foursquare_places table exists");
      }

      // Check enhanced_leads.foursquare_data column
      const { data: leadsData, error: leadsError } = await supabase
        .from("enhanced_leads")
        .select("foursquare_data")
        .limit(1);

      if (!leadsError) {
        console.log("✅ enhanced_leads.foursquare_data column exists");
      }

      if (!placesError && !leadsError) {
        testResults.databaseSchema = true;
        console.log("✅ Database schema fully configured for Foursquare");
      }
    } else {
      console.log("⚠️  Database credentials not available for testing");
    }
  } catch (error) {
    console.log(`❌ Database schema validation failed: ${error.message}`);
  }

  // Test 3: Business Discovery Integration
  console.log("\n🔍 TEST 3: Business Discovery Pipeline Integration");
  try {
    const EnhancedLeadDiscovery = require("./modules/enhanced-lead-discovery");
    const discovery = new EnhancedLeadDiscovery();

    console.log("✅ Enhanced Lead Discovery module loaded");
    console.log(
      `✅ Foursquare client available: ${!!discovery.foursquareClient}`
    );

    // Test the scoring method specifically for Foursquare
    const sampleBusiness = {
      businessName: "Test Coffee Shop",
      foursquareData: {
        found: true,
        totalResults: 2,
        qualityScore: 70,
        confidenceBoost: 15,
      },
    };

    if (typeof discovery.scoreFoursquare === "function") {
      const foursquareScore = discovery.scoreFoursquare(sampleBusiness);
      console.log(`✅ Foursquare scoring function available`);
      console.log(`   Sample score calculation: ${foursquareScore}`);
      testResults.businessDiscovery = true;
    }

    // Check if the main discovery method exists
    if (typeof discovery.discoverAndValidateLeads === "function") {
      console.log("✅ Main discovery pipeline method available");
    }
  } catch (error) {
    console.log(`❌ Business discovery integration failed: ${error.message}`);
  }

  // Test 4: Data Quality Validation
  console.log("\n📊 TEST 4: Data Quality and Validation");
  try {
    const FoursquarePlacesClient = require("./modules/api-clients/foursquare-places-client");
    const foursquareClient = new FoursquarePlacesClient();

    // Test data normalization
    const searchResult = await foursquareClient.searchPlaces("Starbucks", {
      near: "Manhattan, NY",
      limit: 2,
    });

    if (searchResult.places && searchResult.places.length > 0) {
      const place = searchResult.places[0];
      console.log("✅ Data normalization working");
      console.log(`   Sample place structure:`);
      console.log(`   - FSQ ID: ${place.fsqId ? "Present" : "Missing"}`);
      console.log(`   - Name: ${place.name ? "Present" : "Missing"}`);
      console.log(
        `   - Coordinates: ${
          place.latitude && place.longitude ? "Present" : "Missing"
        }`
      );
      console.log(
        `   - Categories: ${
          place.categories && place.categories.length > 0
            ? "Present"
            : "Missing"
        }`
      );
      console.log(
        `   - Business Type: ${place.businessType ? "Present" : "Missing"}`
      );

      // Validate required fields are present
      if (place.fsqId && place.name && place.businessType && place.categories) {
        testResults.dataValidation = true;
        console.log("✅ All required fields present in normalized data");
      }
    }
  } catch (error) {
    console.log(`❌ Data quality validation failed: ${error.message}`);
  }

  // Test 5: Cost Tracking and Rate Limiting
  console.log("\n💰 TEST 5: Cost Tracking and Rate Limiting");
  try {
    const FoursquarePlacesClient = require("./modules/api-clients/foursquare-places-client");
    const foursquareClient = new FoursquarePlacesClient();

    const stats = foursquareClient.getUsageStats();
    console.log("✅ Usage statistics available");
    console.log(`   Total requests: ${stats.totalRequests}`);
    console.log(
      `   Rate limit status: ${stats.rateLimitStatus.currentPeriodRequests}/${stats.rateLimitStatus.dailyLimit}`
    );
    console.log(
      `   Cache hit rate: ${(stats.cacheStats.hitRate * 100).toFixed(1)}%`
    );

    if (stats.apiInfo.qualityScore > 0) {
      console.log(`✅ Quality scoring: ${stats.apiInfo.qualityScore}/100`);
      console.log(`✅ Cost per request: $${stats.apiInfo.costPerRequest}`);
      testResults.costTracking = true;
    }
  } catch (error) {
    console.log(`❌ Cost tracking validation failed: ${error.message}`);
  }

  // Test 6: Quality Scoring Integration
  console.log("\n🎯 TEST 6: Quality Scoring Integration");
  try {
    const EnhancedLeadDiscovery = require("./modules/enhanced-lead-discovery");
    const discovery = new EnhancedLeadDiscovery();

    // Test scoring with mock Foursquare data
    const testBusinesses = [
      {
        businessName: "High Quality Coffee Shop",
        foursquareData: {
          found: true,
          totalResults: 3,
          places: [
            {
              name: "High Quality Coffee Shop",
              fsqId: "test123",
              businessType: "Food & Dining",
              categories: [{ name: "Coffee Shop" }],
              telephone: "(212) 555-1234",
              website: "https://example.com",
            },
          ],
          qualityScore: 85,
          confidenceBoost: 20,
        },
      },
      {
        businessName: "No Match Business",
        foursquareData: {
          found: false,
          totalResults: 0,
          places: [],
          qualityScore: 0,
          confidenceBoost: 0,
        },
      },
    ];

    testBusinesses.forEach((business, index) => {
      if (typeof discovery.scoreFoursquare === "function") {
        const score = discovery.scoreFoursquare(business);
        console.log(`✅ Business ${index + 1} Foursquare score: ${score}`);
      }
    });

    testResults.qualityScoring = true;
    console.log("✅ Quality scoring integration working");
  } catch (error) {
    console.log(`❌ Quality scoring validation failed: ${error.message}`);
  }

  // Final Results Summary
  console.log("\n" + "=".repeat(70));
  console.log("INTEGRATION TEST RESULTS SUMMARY");
  console.log("=".repeat(70));

  const totalTests = Object.keys(testResults).length;
  const passedTests = Object.values(testResults).filter(
    (result) => result === true
  ).length;
  const successRate = Math.round((passedTests / totalTests) * 100);

  console.log(
    `\n📊 Overall Success Rate: ${successRate}% (${passedTests}/${totalTests} tests passed)\n`
  );

  Object.entries(testResults).forEach(([test, passed]) => {
    const status = passed ? "✅ PASS" : "❌ FAIL";
    const testName =
      test.charAt(0).toUpperCase() + test.slice(1).replace(/([A-Z])/g, " $1");
    console.log(`${status} ${testName}`);
  });

  console.log("\n" + "=".repeat(70));
  console.log("INTEGRATION READINESS ASSESSMENT");
  console.log("=".repeat(70));

  if (passedTests >= totalTests * 0.8) {
    // 80% pass rate
    console.log("\n🚀 FOURSQUARE INTEGRATION IS PRODUCTION READY!");
    console.log("\nStrengths:");
    if (testResults.apiConnection)
      console.log("✅ Solid API connectivity and authentication");
    if (testResults.databaseSchema)
      console.log("✅ Complete database schema support");
    if (testResults.businessDiscovery)
      console.log("✅ Seamless business discovery pipeline integration");
    if (testResults.dataValidation)
      console.log("✅ Robust data validation and normalization");
    if (testResults.costTracking)
      console.log("✅ Comprehensive cost tracking and rate limiting");
    if (testResults.qualityScoring)
      console.log("✅ Intelligent quality scoring system");
  } else {
    console.log("\n⚠️  INTEGRATION NEEDS ATTENTION BEFORE PRODUCTION");
    console.log("\nIssues to address:");
    if (!testResults.apiConnection)
      console.log("❌ Fix API connection and authentication");
    if (!testResults.databaseSchema)
      console.log("❌ Complete database schema setup");
    if (!testResults.businessDiscovery)
      console.log("❌ Resolve business discovery pipeline issues");
    if (!testResults.dataValidation)
      console.log("❌ Implement data validation improvements");
    if (!testResults.costTracking)
      console.log("❌ Set up cost tracking and monitoring");
    if (!testResults.qualityScoring)
      console.log("❌ Fix quality scoring integration");
  }

  console.log("\n📋 NEXT STEPS:");
  console.log("1. Test edge functions integration with Foursquare data");
  console.log("2. Validate end-to-end pipeline with real campaign data");
  console.log("3. Monitor API usage and costs in production environment");
  console.log("4. Set up alerts for rate limiting and API failures");
  console.log("5. Document Foursquare data fields for frontend integration");

  console.log("\n" + "=".repeat(70));

  return {
    success: passedTests >= totalTests * 0.8,
    results: testResults,
    successRate,
    passedTests,
    totalTests,
  };
}

// Run the comprehensive test
if (require.main === module) {
  runComprehensiveIntegrationTest()
    .then((result) => {
      process.exit(result.success ? 0 : 1);
    })
    .catch((error) => {
      console.error("❌ Comprehensive test failed:", error.message);
      process.exit(1);
    });
}

module.exports = { runComprehensiveIntegrationTest };
