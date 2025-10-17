import {
  assertEquals,
  assertExists,
} from "https://deno.land/std@0.208.0/assert/mod.ts";

const FUNCTION_BASE_URL =
  Deno.env.get("SUPABASE_FUNCTION_BASE_URL") ??
  "http://localhost:54321/functions/v1";

// Get auth token for authenticated requests (if available)
const SUPABASE_ANON_KEY =
  Deno.env.get("SUPABASE_ANON_KEY") ??
  Deno.env.get("VITE_SUPABASE_ANON_KEY") ??
  "";
const SUPABASE_SESSION_JWT = Deno.env.get("SUPABASE_SESSION_JWT") ?? "";

const serverAvailable = await (async () => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 1500);

  try {
    // Any response (even 404) means the server is reachable; connection errors fail the check.
    await fetch(`${FUNCTION_BASE_URL}/__healthcheck`, {
      method: "GET",
      signal: controller.signal,
    });
    return true;
  } catch (_error) {
    console.warn(
      `Skipping edge function tests because ${FUNCTION_BASE_URL} is not reachable. ` +
        "Run 'npm run edge:serve -- <function-slug>' in another terminal or set SUPABASE_FUNCTION_BASE_URL to a deployed endpoint."
    );
    return false;
  } finally {
    clearTimeout(timeout);
  }
})();

if (!SUPABASE_SESSION_JWT && serverAvailable) {
  console.warn(
    "⚠️  SUPABASE_SESSION_JWT not set. Authenticated tests will be skipped.\n" +
      "   To run authenticated tests, set SUPABASE_SESSION_JWT environment variable.\n" +
      "   Get a session token from the browser console after signing in to the app."
  );
}

Deno.test({
  name: "Business Discovery Background - Basic Response",
  ignore: !serverAvailable || !SUPABASE_SESSION_JWT,
  fn: async () => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    
    // Add authentication headers if available
    if (SUPABASE_SESSION_JWT) {
      headers["Authorization"] = `Bearer ${SUPABASE_SESSION_JWT}`;
    }
    if (SUPABASE_ANON_KEY) {
      headers["apikey"] = SUPABASE_ANON_KEY;
    }

    const response = await fetch(
      `${FUNCTION_BASE_URL}/business-discovery-background`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          businessType: "coffee shop",
          location: "Seattle, WA",
          maxResults: 1,
          tierKey: "PROFESSIONAL",
          sessionUserId: "test_session_deno",
        }),
      }
    );

    assertEquals(response.status, 200);
    const data = await response.json();
    assertExists(data);
  },
});

Deno.test({
  name: "Enrichment Orchestrator - Auth Required",
  ignore: !serverAvailable,
  fn: async () => {
    // Test without auth headers - should return 401
    const response = await fetch(
      `${FUNCTION_BASE_URL}/enrichment-orchestrator`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaign_id: "test" }),
      }
    );

    // Consume the response body to avoid leak warnings
    await response.text();
    assertEquals(response.status, 401);
  },
});
