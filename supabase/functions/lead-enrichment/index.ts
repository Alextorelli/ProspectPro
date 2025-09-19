// Supabase Edge Function: lead-enrichment
// deno-lint-ignore-file no-explicit-any
// @ts-nocheck
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { json, error } from "../_shared/response.ts";
import { checkWebsiteAccessible } from "../_shared/web.ts";
import { scrapeHtml } from "../_shared/scrapingdog.ts";
import { domainSearch } from "../_shared/hunter.ts";
import { verifyEmail } from "../_shared/neverbounce.ts";

/* Contract:
Input: { lead: { name?: string; website?: string; email?: string; phone?: string }, budgetCents?: number }
Output: {
  ok: true,
  lead: { name, website, email, phone },
  validation: { website: { ok, status }, email?: { value, verdict, confidence } },
  meta: { costs: { scrapingdogUsd?: number, hunterUsd?: number, neverbounceUsd?: number }, totalUsd: number }
} or { error }
Zero Fake Data: Never fabricate fields. Only return real checks and discoveries.
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
  const centsBudget = Number.isFinite(budgetCents) ? budgetCents : null;
  const usdBudget = centsBudget !== null ? centsBudget / 100 : Infinity;
  const costs = { scrapingdogUsd: 0, hunterUsd: 0, neverbounceUsd: 0 } as Record<string, number>;

  const outLead = {
    name: typeof lead.name === "string" ? lead.name : null,
    website: typeof lead.website === "string" ? lead.website : null,
    email: typeof lead.email === "string" ? lead.email : null,
    phone: typeof lead.phone === "string" ? lead.phone : null,
  } as Record<string, string | null>;

  const validation: any = {};

  // 1) Website accessibility check (free except your HTTP cost)
  if (outLead.website) {
    const web = await checkWebsiteAccessible(outLead.website, 10000);
    validation.website = { ok: web.ok, status: web.status ?? null };
    if (!web.ok) {
      // Do not proceed with scraping/hunter if website is inaccessible
      return json({ ok: true, lead: outLead, validation, meta: { costs, totalUsd: 0 } });
    }
  }

  // 2) Optional scraping (placeholder: we only fetch HTML to ensure domain exists)
  if (outLead.website && isFinite(usdBudget)) {
    if ((costs.scrapingdogUsd + 0.002) <= usdBudget) {
      const scrape = await scrapeHtml(outLead.website);
      if (scrape.ok) costs.scrapingdogUsd += scrape.meta.costUsdEstimate;
      // We do not parse emails from HTML here to keep it simple and cost-safe
    }
  }

  // Helper: extract domain from website
  const domain = (() => {
    try {
      if (!outLead.website) return null;
      const u = new URL(outLead.website);
      return u.hostname?.replace(/^www\./, "");
    } catch {
      return null;
    }
  })();

  // 3) If no email present, try Hunter.io domain search (budget-aware)
  if (!outLead.email && domain && isFinite(usdBudget)) {
    const nextCost = costs.hunterUsd + 0.04;
    if (nextCost <= usdBudget) {
      const h = await domainSearch(domain);
      if (h.ok && h.emails.length > 0) {
        // Pick the highest-confidence email
        const best = [...h.emails].sort((a, b) => (b.confidence ?? 0) - (a.confidence ?? 0))[0];
        outLead.email = best?.value ?? outLead.email;
        costs.hunterUsd += h.meta.costUsdEstimate;
      }
    }
  }

  // 4) Verify email via NeverBounce (≥80% to be considered deliverable)
  if (outLead.email && isFinite(usdBudget)) {
    const nextCost = costs.neverbounceUsd + 0.008;
    if (nextCost <= usdBudget) {
      const nb = await verifyEmail(outLead.email);
      if (nb.ok) {
        validation.email = {
          value: outLead.email,
          verdict: nb.verdict,
          confidence: nb.confidence,
          isDeliverable: nb.isDeliverable === true && (nb.confidence ?? 0) >= 80,
        };
        costs.neverbounceUsd += nb.meta.costUsdEstimate;
      }
    }
  }

  const totalUsd = Object.values(costs).reduce((a, b) => a + (typeof b === "number" ? b : 0), 0);
  return json({ ok: true, lead: outLead, validation, meta: { costs, totalUsd } });
});
