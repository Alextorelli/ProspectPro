// deno-lint-ignore-file no-explicit-any
// @ts-nocheck
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { json, error } from "../_shared/response.ts";

/* Contract:
Input: { query: string, location?: string, budgetCents?: number }
Output: { ok: true, results: [] } OR { error }
Note: This is a stub. Real implementation will call Google Places and validators.
*/

serve(async (req: Request) => {
  if (req.method !== "POST") return new Response("Not Found", { status: 404 });

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return error("Invalid JSON body", 400);
  }

  const { query, location, budgetCents } = body ?? {};
  if (!query || typeof query !== "string" || query.trim().length < 2) {
    return error("'query' is required and must be a non-empty string", 400);
  }

  // Placeholder to verify deployment path end-to-end without fake data generation
  // We DO NOT fabricate businesses; this simply echoes parameters.
  const meta = {
    received: { query, location: location ?? null, budgetCents: Number.isFinite(budgetCents) ? budgetCents : null },
    message: "business-discovery stub reachable",
  };

  return json({ ok: true, results: [], meta });
});
