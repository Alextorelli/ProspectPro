// deno-lint-ignore-file no-explicit-any
// Google Places REST client for Supabase Edge Functions (Deno)
// Zero Fake Data: never fabricate results; propagate errors

export type PlacesTextSearchParams = {
  query: string;
  location?: string; // e.g., "32.7157,-117.1611" (lat,lng) — optional
  radiusMeters?: number; // e.g., 30000
  language?: string; // e.g., "en"
};

export type PlaceResult = {
  placeId: string;
  name: string;
  formattedAddress?: string;
  types?: string[];
  rating?: number;
  userRatingsTotal?: number;
  businessStatus?: string;
  lat?: number;
  lng?: number;
  // NOTE: No phone/website here — requires a separate Place Details call which costs extra
};

export type PlacesSearchResponse = {
  ok: boolean;
  status: string;
  results: PlaceResult[];
  rawStatus?: string;
  nextPageToken?: string;
  meta: {
    query: string;
    costUsdEstimate: number; // rough estimate: $0.032 per text search
    rateLimited?: boolean;
    fetchedAt: string;
  };
};

const PLACES_TEXTSEARCH_ENDPOINT =
  "https://maps.googleapis.com/maps/api/place/textsearch/json";

export async function textSearch(params: PlacesTextSearchParams): Promise<PlacesSearchResponse> {
  const apiKey = (globalThis as any)?.Deno?.env?.get?.("GOOGLE_PLACES_API_KEY");
  if (!apiKey) {
    throw new Error("Missing GOOGLE_PLACES_API_KEY in environment");
  }

  const q = new URLSearchParams({ query: params.query, key: apiKey });
  if (params.location) q.set("location", params.location);
  if (params.radiusMeters && Number.isFinite(params.radiusMeters))
    q.set("radius", String(params.radiusMeters));
  if (params.language) q.set("language", params.language);

  const url = `${PLACES_TEXTSEARCH_ENDPOINT}?${q.toString()}`;
  const res = await fetch(url, { method: "GET" });
  const data = await res.json();

  const status = data?.status ?? "UNKNOWN_ERROR";
  if (!res.ok || status !== "OK") {
    // Common statuses: ZERO_RESULTS, OVER_QUERY_LIMIT, REQUEST_DENIED, INVALID_REQUEST
    const rateLimited = status === "OVER_QUERY_LIMIT";
    return {
      ok: false,
      status: status,
      results: [],
      rawStatus: status,
      nextPageToken: undefined,
      meta: {
        query: params.query,
        costUsdEstimate: 0.032, // count a search attempt even if zero results; adjust upstream if needed
        rateLimited,
        fetchedAt: new Date().toISOString(),
      },
    };
  }

  const results: PlaceResult[] = (data?.results ?? []).map((r: any) => ({
    placeId: r.place_id,
    name: r.name,
    formattedAddress: r.formatted_address,
    types: r.types,
    rating: r.rating,
    userRatingsTotal: r.user_ratings_total,
    businessStatus: r.business_status,
    lat: r.geometry?.location?.lat,
    lng: r.geometry?.location?.lng,
  }));

  return {
    ok: true,
    status: status,
    results,
    nextPageToken: data?.next_page_token,
    meta: {
      query: params.query,
      costUsdEstimate: 0.032,
      rateLimited: false,
      fetchedAt: new Date().toISOString(),
    },
  };
}
