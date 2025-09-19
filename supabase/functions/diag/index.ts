// Supabase Edge Function: diag
// Returns sanitized diagnostics similar to /diag
// deno-lint-ignore-file no-explicit-any
// @ts-nocheck
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Not Found", { status: 404 });
  }

  // In real use, gather DB health by running lightweight SQL through service bindings
  const now = new Date().toISOString();
  const payload = {
    service: "ProspectPro",
    timestamp: now,
    envKeys: Object.keys((globalThis as any).Deno?.env?.toObject?.() ?? {}).filter((k) =>
      /SUPABASE|GOOGLE|HUNTER|NEVERBOUNCE|SCRAPINGDOG|NODE_ENV/.test(k)
    ),
    status: "ok"
  };

  return new Response(JSON.stringify(payload), {
    headers: { "Content-Type": "application/json" }
  });
});
