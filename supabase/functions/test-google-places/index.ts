import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("GOOGLE_PLACES_API_KEY");

    console.log(`🔑 API Key present: ${apiKey ? "YES" : "NO"}`);
    if (apiKey) {
      console.log(`🔑 API Key prefix: ${apiKey.substring(0, 10)}...`);
    }

    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error: "Google Places API key not configured",
          envVars: Object.keys(Deno.env.toObject()),
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    // Test Google Places API with a simple query
    const testQuery = "coffee shop in Seattle, WA";
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(
      testQuery
    )}&key=${apiKey}`;

    console.log(`🔍 Testing Google Places API with query: ${testQuery}`);

    const response = await fetch(url);
    const data = await response.json();

    console.log(`📊 Google Places Response Status: ${data.status}`);
    console.log(`📊 Results Count: ${data.results?.length || 0}`);

    if (data.error_message) {
      console.log(`⚠️ Error Message: ${data.error_message}`);
    }

    return new Response(
      JSON.stringify({
        success: data.status === "OK",
        googlePlacesStatus: data.status,
        errorMessage: data.error_message || null,
        resultsCount: data.results?.length || 0,
        firstResult: data.results?.[0]
          ? {
              name: data.results[0].name,
              address: data.results[0].formatted_address,
              rating: data.results[0].rating,
            }
          : null,
        rawResponse: data,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("❌ Test error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : null,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
