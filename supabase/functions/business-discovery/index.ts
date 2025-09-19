// deno-lint-ignore-file no-explicit-any
// @ts-nocheck
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { json, error } from "../_shared/response.ts";
import { textSearch } from "../_shared/google-places.ts";

/* Contract:
Input: { query: string, location?: string, radiusMeters?: number, budgetCents?: number }
Output: { ok: true, results: PlaceResult[], meta } OR { error }
Zero Fake Data: Calls Google Places. No fabricated results. Returns empty on ZERO_RESULTS.
*/

serve(async (req: Request) => {
  if (req.method !== "POST") return new Response("Not Found", { status: 404 });

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return error("Invalid JSON body", 400);
  }

  const { query, location, radiusMeters, budgetCents } = body ?? {};
  if (!query || typeof query !== "string" || query.trim().length < 2) {
    return error("'query' is required and must be a non-empty string", 400);
  }

  // Basic budget check — a text search costs ~ $0.032
  const cents = Number.isFinite(budgetCents) ? budgetCents : null;
  if (cents !== null && cents < 4) { // < $0.04 insufficient for a single text search + overhead
    return error("Budget too low for discovery search", 402, { requiredMinCents: 4 });
  }

  try {
    // Support either lat,lng or a human-readable location by folding into query
    const looksLikeLatLng = typeof location === "string" && /^-?\d+\.?\d*,\s*-?\d+\.?\d*$/.test(location);
    const qStr = typeof location === "string" && !looksLikeLatLng
      ? `${String(query)} in ${location}`
      : String(query);

    const resp = await textSearch({
      query: qStr,
      location: looksLikeLatLng ? location : undefined,
      radiusMeters: Number.isFinite(radiusMeters) ? radiusMeters : undefined,
      language: "en",
    });

    // Never fabricate: if not ok or ZERO_RESULTS, return empty list with meta
    if (!resp.ok) {
      return json({ ok: false, results: [], status: resp.status, meta: resp.meta });
    }

    return json({ ok: true, results: resp.results, meta: resp.meta, nextPageToken: resp.nextPageToken });
  } catch (e) {
    return error(`Discovery failed: ${e?.message ?? e}`, 500);
  }
});
