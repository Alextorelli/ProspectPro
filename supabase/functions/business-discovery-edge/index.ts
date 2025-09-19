// ProspectPro Business Discovery Edge Function
// Zero fake data policy - all business data from real APIs

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

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

console.log("ProspectPro Business Discovery Edge Function loaded");

Deno.serve(async (req) => {
  // CORS headers for development
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, GET, OPTIONS, DELETE",
        "Access-Control-Allow-Headers":
          "apikey, X-Client-Info, Content-Type, Authorization, Accept, Accept-Language, X-Authorization",
      },
    });
  }

  try {
    const { query, location, radius = 5000, maxResults = 20 }:
      BusinessDiscoveryRequest = await req.json();

    if (!query || !location) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields: query and location",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        },
      );
    }

    // Get Google Places API key from environment
    const googleApiKey = Deno.env.get("GOOGLE_PLACES_API_KEY");
    if (!googleApiKey) {
      return new Response(
        JSON.stringify({ error: "Google Places API key not configured" }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        },
      );
    }

    // Call Google Places API for real business data
    const searchQuery = `${query} in ${location}`;
    const placesUrl =
      `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${
        encodeURIComponent(searchQuery)
      }&radius=${radius}&key=${googleApiKey}`;

    console.log(`Searching for businesses: ${searchQuery}`);

    const placesResponse = await fetch(placesUrl);
    const placesData = await placesResponse.json();

    if (placesData.status !== "OK" && placesData.status !== "ZERO_RESULTS") {
      console.error(
        "Google Places API error:",
        placesData.status,
        placesData.error_message,
      );
      return new Response(
        JSON.stringify({
          error: `Google Places API error: ${placesData.status}`,
          details: placesData.error_message || "No additional details",
          debug: {
            status: placesData.status,
            url: placesUrl.replace(googleApiKey, "***HIDDEN***"),
          },
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        },
      );
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

    const response = {
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

    console.log(
      `Found ${businesses.length} qualified businesses out of ${
        placesData.results?.length || 0
      } total results`,
    );

    return new Response(
      JSON.stringify(response),
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      },
    );
  } catch (error) {
    console.error("Business discovery error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error.message,
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      },
    );
  }
});

/* To test locally:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/business-discovery-edge' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"query":"restaurants","location":"San Francisco, CA","maxResults":5}'

*/
