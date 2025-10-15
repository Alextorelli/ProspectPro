import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
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

    // Accept payload to replicate campaign searches
    const payload = await req.json().catch(() => ({} as any));
    const businessType =
      payload.businessType || payload.searchTerms || "coffee shop";
    const searchTerms = payload.searchTerms || businessType;
    const location = payload.location || "Seattle, WA";
    const radiusMiles = Number(payload.radiusMiles ?? 5);

    // Compose a Text Search query matching campaign style: "{terms} in {location}"
    const textQuery = `${searchTerms} in ${location}`;

    const textUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(
      textQuery
    )}&key=${apiKey}`;

    console.log(`🔍 Text Search: ${textQuery}`);

    const textRes = await fetch(textUrl);
    const textData = await textRes.json();
    const textCount = Array.isArray(textData.results)
      ? textData.results.length
      : 0;

    // Try nearby search centered on geocoded location for radiusMiles
    // First geocode the location to lat/lng (using Places textsearch first result as a simple geocode)
    let lat: number | null = null;
    let lng: number | null = null;
    if (textData.results?.[0]?.geometry?.location) {
      lat = textData.results[0].geometry.location.lat;
      lng = textData.results[0].geometry.location.lng;
    }

    let nearbyCount = 0;
    let nearbySample: any[] = [];
    if (lat != null && lng != null) {
      const radiusMeters = Math.max(
        100,
        Math.min(50000, Math.round(radiusMiles * 1609.34))
      );
      const nearbyUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?keyword=${encodeURIComponent(
        businessType
      )}&location=${lat},${lng}&radius=${radiusMeters}&key=${apiKey}`;
      console.log(`📍 Nearby Search @ ${lat},${lng} within ${radiusMeters}m`);
      const nearRes = await fetch(nearbyUrl);
      const nearData = await nearRes.json();
      nearbyCount = Array.isArray(nearData.results)
        ? nearData.results.length
        : 0;
      nearbySample = (nearData.results || [])
        .slice(0, 3)
        .map((r: any) => ({ name: r.name, place_id: r.place_id }));
    }

    const sample = (textData.results || [])
      .slice(0, 3)
      .map((r: any) => ({ name: r.name, place_id: r.place_id }));

    return new Response(
      JSON.stringify({
        success: true,
        inputs: { businessType, searchTerms, location, radiusMiles },
        textSearch: { count: textCount, status: textData.status, sample },
        nearbySearch: { count: nearbyCount, sample: nearbySample },
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
