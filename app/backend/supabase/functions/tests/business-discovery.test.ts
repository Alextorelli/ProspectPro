import {
  assertEquals,
  assertExists,
} from "https://deno.land/std@0.208.0/assert/mod.ts";

const BASE =
  Deno.env.get("SUPABASE_FUNCTION_BASE_URL") ??
  "http://127.0.0.1:54321/functions/v1";
const JWT = Deno.env.get("SUPABASE_SESSION_JWT") ?? "";
const APIKEY =
  Deno.env.get("SUPABASE_ANON_KEY") ??
  Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ??
  "";
const DEV_BYPASS = Deno.env.get("EDGE_AUTH_DEV_BYPASS") === "1";

if (!JWT) {
  throw new Error(
    "SUPABASE_SESSION_JWT is required for this test suite. Export it before running."
  );
}

if (!APIKEY) {
  throw new Error(
    "Supabase anon or publishable key is required. Source scripts/test-env.local.sh first."
  );
}

const resolveSessionUserId = (jwt: string): string => {
  try {
    const payload = jwt.split(".")[1];
    if (!payload) return "";
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    const decoded = JSON.parse(atob(padded));
    const sub = decoded?.sub;
    return typeof sub === "string" ? sub : "";
  } catch (_error) {
    return "";
  }
};

const sessionUserId = resolveSessionUserId(JWT) || "test_session_123";

const authHeaders = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${JWT}`,
  apikey: APIKEY,
  ...(DEV_BYPASS ? { "x-prospect-session": "dev" } : {}),
};

Deno.test("Business Discovery Background - Basic Response", async () => {
  const res = await fetch(`${BASE}/business-discovery-background`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      businessType: "coffee shop",
      location: "Seattle, WA",
      maxResults: 1,
      tierKey: "BASE",
      sessionUserId,
    }),
  });

  assertEquals(res.status, 200);
  const data = await res.json();
  assertExists(data);
});

Deno.test("Enrichment Orchestrator - Auth Required", async () => {
  const res = await fetch(`${BASE}/enrichment-orchestrator`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: APIKEY,
    },
    body: JSON.stringify({ email: "test@example.com" }),
  });

  // Consume the response body to avoid leak warnings
  await res.text();
  assertEquals(res.status, 401);
});
