// Supabase Edge Function: lead-enrichment
// deno-lint-ignore-file no-explicit-any
// @ts-nocheck
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { json, error } from "../_shared/response.ts";

/* Contract:
Input: { lead: { name?: string; website?: string; email?: string; phone?: string }, budgetCents?: number }
Output: { ok: true, lead: {...}, validation: {...}, costCents: number } or { error }
This is a scaffold aligned with zero fake data. It performs only shape checks and echoes input.
*/

serve(async (req: Request) => {
  if (req.method !== "POST") return new Response("Not Found", { status: 404 });

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return error("Invalid JSON body", 400);
  }

  const { lead, budgetCents } = body ?? {};
  if (!lead || typeof lead !== "object") {
    return error("'lead' object is required", 400);
  }

  // Only echo shape; do not fabricate data
  const result = {
    ok: true,
    lead: {
      name: typeof lead.name === "string" ? lead.name : null,
      website: typeof lead.website === "string" ? lead.website : null,
      email: typeof lead.email === "string" ? lead.email : null,
      phone: typeof lead.phone === "string" ? lead.phone : null,
    },
    validation: {
      // Real validators will live here; placeholder booleans reflect presence only
      hasName: !!lead?.name,
      hasWebsite: !!lead?.website,
      hasEmail: !!lead?.email,
      hasPhone: !!lead?.phone,
    },
    budgetCents: Number.isFinite(budgetCents) ? budgetCents : null,
  };

  return json(result);
});
