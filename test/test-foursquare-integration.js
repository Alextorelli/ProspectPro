// Test script for Foursquare API integration
require("dotenv").config();
const FoursquarePlacesClient = require("../ProspectPro/modules/api-clients/foursquare-places-client");

const serviceApiKey = process.env.FOURSQUARE_SERVICE_API_KEY;
if (!serviceApiKey) {
  console.error("Foursquare SERVICE_API_KEY missing. Check .env file.");
  process.exit(1);
}
const client = new FoursquarePlacesClient();

async function testSearch() {
  try {
    const result = await client.searchPlaces("Starbucks", {
      near: "San Francisco, CA",
      limit: 3,
    });
    console.log("Foursquare search result:", JSON.stringify(result, null, 2));
    if (result.found && result.places.length > 0) {
      console.log("✅ Foursquare API integration successful.");
    } else {
      console.log("⚠️ No results found, check credentials and API limits.");
    }
  } catch (err) {
    console.error("❌ Foursquare API integration failed:", err.message);
  }
}

testSearch();
