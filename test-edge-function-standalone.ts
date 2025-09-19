#!/usr/bin/env -S deno run --allow-env --allow-net --allow-read

// Standalone test for Edge Function logic without full Supabase stack
// This tests the business discovery logic directly

interface BusinessDiscoveryRequest {
  query: string;
  location: string;
  radius?: number;
  maxResults?: number;
}

interface BusinessResult {
  name: string;
  address: string;
  phone?: string;
  website?: string;
  rating?: number;
  placeId: string;
  confidence: number;
}

// Load environment variables
async function loadEnv() {
  try {
    const envContent = await Deno.readTextFile(".env");
    const envVars: Record<string, string> = {};
    envContent.split("\n").forEach((line) => {
      const [key, value] = line.split("=");
      if (key && value) {
        envVars[key.trim()] = value.trim();
      }
    });
    return envVars;
  } catch {
    return {};
  }
}

// Simulate the Edge Function logic
async function testBusinessDiscovery(request: BusinessDiscoveryRequest) {
  const { query, location, radius = 5000, maxResults = 20 } = request;

  // Get Google Places API key from environment
  const env = await loadEnv();
  const googleApiKey = env.GOOGLE_PLACES_API_KEY ||
    Deno.env.get("GOOGLE_PLACES_API_KEY");
  if (!googleApiKey) {
    throw new Error("Google Places API key not configured");
  }

  // Call Google Places API for real business data
  const searchQuery = `${query} in ${location}`;
  const placesUrl =
    `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${
      encodeURIComponent(searchQuery)
    }&radius=${radius}&key=${googleApiKey}`;

  console.log(`🔍 Searching for businesses: ${searchQuery}`);

  const placesResponse = await fetch(placesUrl);
  const placesData = await placesResponse.json();

  if (placesData.status !== "OK" && placesData.status !== "ZERO_RESULTS") {
    throw new Error(`Google Places API error: ${placesData.status}`);
  }

  // Transform real API results to our format
  const businesses: BusinessResult[] = (placesData.results || [])
    .slice(0, maxResults)
    .map((place: any) => {
      // Calculate confidence score based on available data quality
      let confidence = 60; // Base confidence
      if (place.rating && place.rating >= 4.0) confidence += 15;
      if (place.user_ratings_total && place.user_ratings_total >= 10) {
        confidence += 10;
      }
      if (place.formatted_address) confidence += 10;
      if (place.website) confidence += 5;

      return {
        name: place.name,
        address: place.formatted_address || "",
        phone: place.formatted_phone_number || undefined,
        website: place.website || undefined,
        rating: place.rating || undefined,
        placeId: place.place_id,
        confidence: Math.min(confidence, 100),
      };
    })
    .filter((business: BusinessResult) => business.confidence >= 70); // Only return high-confidence results

  return {
    query: searchQuery,
    location,
    radius,
    totalFound: placesData.results?.length || 0,
    qualifiedResults: businesses.length,
    businesses,
    timestamp: new Date().toISOString(),
    // Real API usage tracking for cost optimization
    apiCallsMade: 1,
    estimatedCost: 0.032, // Google Places Text Search cost
  };
}

// Test cases
async function runTests() {
  console.log("🎯 ProspectPro Edge Function Standalone Test");
  console.log("================================================\n");

  const testCases = [
    {
      name: "Restaurants in San Francisco",
      request: {
        query: "restaurants",
        location: "San Francisco, CA",
        maxResults: 3,
      },
    },
    {
      name: "Coffee shops in Seattle",
      request: {
        query: "coffee shops",
        location: "Seattle, WA",
        maxResults: 5,
      },
    },
  ];

  for (const testCase of testCases) {
    console.log(`🧪 Testing: ${testCase.name}`);
    console.log("─".repeat(50));

    try {
      const result = await testBusinessDiscovery(testCase.request);

      console.log(
        `✅ Success! Found ${result.qualifiedResults} qualified businesses out of ${result.totalFound} total`,
      );
      console.log(`💰 Estimated cost: $${result.estimatedCost}`);
      console.log(`📊 Results preview:`);

      result.businesses.forEach((business, index) => {
        console.log(
          `   ${
            index + 1
          }. ${business.name} (${business.confidence}% confidence)`,
        );
        console.log(`      📍 ${business.address}`);
        if (business.rating) console.log(`      ⭐ ${business.rating}/5`);
        if (business.website) console.log(`      🌐 ${business.website}`);
        console.log();
      });
    } catch (error) {
      console.log(`❌ Error: ${(error as Error).message}`);
    }

    console.log("\n");
  }
}

if (import.meta.main) {
  await runTests();
}
