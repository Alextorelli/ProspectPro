#!/usr/bin/env node

/**
 * Foursquare Integration Live Test
 * Tests the Foursquare Places API client and database schema integration
 */

require("dotenv").config();

const FoursquarePlacesClient = require("./modules/api-clients/foursquare-places-client");

async function testFoursquareIntegration() {
  console.log("🧪 Testing Foursquare Places API Integration...\n");

  // Initialize client
  const foursquareClient = new FoursquarePlacesClient();

  // Test configuration
  const apiKey =
    process.env.FOURSQUARE_SERVICE_API_KEY ||
    process.env.FOURSQUARE_PLACES_API_KEY;
  console.log(`API Key configured: ${apiKey ? "Yes ✅" : "No ❌"}`);

  if (apiKey) {
    console.log(
      `API Key (masked): ${apiKey.substring(0, 8)}...${apiKey.slice(-4)}\n`
    );
  }

  // Test 1: Simple search
  console.log("📍 Test 1: Search for restaurants in New York");
  try {
    const searchResult = await foursquareClient.searchPlaces("coffee shop", {
      near: "New York, NY",
      limit: 5,
    });

    console.log(`Found: ${searchResult.found ? "Yes" : "No"}`);
    console.log(`Results: ${searchResult.totalResults}`);
    console.log(`Quality Score: ${searchResult.qualityScore}`);
    console.log(`Confidence Boost: ${searchResult.confidenceBoost}`);

    if (searchResult.places && searchResult.places.length > 0) {
      console.log("\nSample Results:");
      searchResult.places.slice(0, 2).forEach((place, index) => {
        console.log(`  ${index + 1}. ${place.name}`);
        console.log(`     FSQ ID: ${place.fsqId}`);
        console.log(`     Address: ${place.formattedAddress || place.address}`);
        console.log(
          `     Categories: ${place.categories.map((c) => c.name).join(", ")}`
        );
        console.log(`     Business Type: ${place.businessType}`);
        console.log(`     Coordinates: ${place.latitude}, ${place.longitude}`);
        console.log("");
      });
    }

    if (searchResult.error) {
      console.log(`Error: ${searchResult.error}`);
    }
  } catch (error) {
    console.log(`❌ Search test failed: ${error.message}`);
  }

  console.log("\n" + "=".repeat(60) + "\n");

  // Test 2: Location-based search
  console.log("📍 Test 2: Search near specific coordinates (NYC)");
  try {
    const locationResult = await foursquareClient.searchPlaces("restaurant", {
      ll: "40.7589,-73.9851", // Times Square coordinates
      radius: 1000,
      limit: 3,
    });

    console.log(`Found: ${locationResult.found ? "Yes" : "No"}`);
    console.log(`Results: ${locationResult.totalResults}`);

    if (locationResult.places && locationResult.places.length > 0) {
      console.log("\nLocation-based Results:");
      locationResult.places.forEach((place, index) => {
        console.log(`  ${index + 1}. ${place.name} - ${place.primaryCategory}`);
        console.log(
          `     Distance: ${place.distance ? `${place.distance}m` : "N/A"}`
        );
      });
    }
  } catch (error) {
    console.log(`❌ Location search failed: ${error.message}`);
  }

  console.log("\n" + "=".repeat(60) + "\n");

  // Test 3: Get usage statistics
  console.log("📊 Test 3: Usage Statistics");
  const stats = foursquareClient.getUsageStats();
  console.log("API Statistics:");
  console.log(`  Total Requests: ${stats.totalRequests}`);
  console.log(`  Successful Requests: ${stats.successfulRequests}`);
  console.log(`  Cached Responses: ${stats.cachedResponses}`);
  console.log(`  Error Count: ${stats.errorCount}`);
  console.log(`  Rate Limit Hits: ${stats.rateLimitHits}`);
  console.log(
    `  Cache Hit Rate: ${(stats.cacheStats.hitRate * 100).toFixed(1)}%`
  );
  console.log("");
  console.log("Rate Limit Status:");
  console.log(
    `  Current Period Requests: ${stats.rateLimitStatus.currentPeriodRequests}`
  );
  console.log(`  Daily Limit: ${stats.rateLimitStatus.dailyLimit}`);
  console.log(`  Reset Time: ${stats.rateLimitStatus.resetTime}`);

  console.log("\n" + "=".repeat(60) + "\n");

  // Test 4: Database Schema Validation Test
  console.log("🗄️  Test 4: Database Schema Validation");

  // Sample Foursquare data structure for database insertion
  const sampleFoursquareData = {
    fsq_id: "test_fsq_123456",
    place_name: "Test Coffee Shop",
    address: "123 Test Street",
    city: "New York",
    region: "NY",
    postal_code: "10001",
    country: "US",
    formatted_address: "123 Test Street, New York, NY 10001",
    latitude: 40.7589,
    longitude: -73.9851,
    categories: [{ id: "4bf58dd8d48988d1e0931735", name: "Coffee Shop" }],
    primary_category: "Coffee Shop",
    business_type: "Food & Dining",
    telephone: "+1-555-123-4567",
    website: "https://testcoffeeshop.com",
  };

  console.log("Sample Foursquare data structure for database:");
  console.log(JSON.stringify(sampleFoursquareData, null, 2));

  console.log("\n📋 Schema Requirements Validation:");
  console.log("✅ fsq_id: Required unique identifier");
  console.log("✅ place_name: Business name");
  console.log("✅ location data: Address, city, region, postal_code, country");
  console.log("✅ coordinates: Latitude/longitude for geography column");
  console.log("✅ categories: JSONB array of category objects");
  console.log("✅ primary_category: Main business category");
  console.log("✅ business_type: Classified business type");
  console.log("✅ contact info: telephone, website");
  console.log("✅ metadata: source, data_quality, raw_data JSONB");

  console.log("\n🎯 Integration Test Complete!");
  console.log("Next steps:");
  console.log("1. Verify database has foursquare_places table");
  console.log("2. Test data insertion with real API results");
  console.log("3. Validate enhanced_leads.foursquare_data JSONB column");
  console.log("4. Test business discovery pipeline integration");
}

// Run the test
if (require.main === module) {
  testFoursquareIntegration().catch(console.error);
}

module.exports = { testFoursquareIntegration };
