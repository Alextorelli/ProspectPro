// Test script for Foursquare API integration
require("dotenv").config();
const FoursquarePlacesClient = require("../modules/api-clients/foursquare-places-client");

const serviceKey = process.env.FOURSQUARE_SERVICE_API_KEY;
const placesApiKey = process.env.FOURSQUARE_PLACES_API_KEY;
if (!serviceKey && !placesApiKey) {
  console.error(
    "Foursquare keys missing. Set FOURSQUARE_SERVICE_API_KEY (preferred) or FOURSQUARE_PLACES_API_KEY in your .env."
  );
  process.exit(1);
}
const client = new FoursquarePlacesClient();

async function testSearch() {
  try {
    const result = await client.searchPlaces("Starbucks", {
      ll: "37.7749,-122.4194", // San Francisco coordinates
      limit: 3,
      radius: 5000,
    });
    console.log("Foursquare search result:", JSON.stringify(result, null, 2));
    if (result.found && result.places.length > 0) {
      console.log("✅ Foursquare API search successful.");
      const first = result.places[0];
      if (first?.fsqId) {
        const details = await client.getPlaceDetails(first.fsqId, {});
        console.log(
          "Foursquare details result:",
          JSON.stringify(details, null, 2)
        );
        if (!details.found) {
          throw new Error("Place details not found for returned fsqId");
        }
      }
    } else {
      console.log("⚠️ No results found, check credentials and API limits.");
    }
  } catch (err) {
    console.error("❌ Foursquare API integration failed:", err.message);
  }
}

testSearch();
