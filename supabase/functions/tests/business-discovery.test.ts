import {
  assertEquals,
  assertExists,
} from "https://deno.land/std@0.208.0/assert/mod.ts";

const FUNCTION_BASE_URL =
  Deno.env.get("SUPABASE_FUNCTION_BASE_URL") ??
  "http://localhost:54321/functions/v1";

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

Deno.test({
  name: "Business Discovery Background - Basic Response",
  ignore: !serverAvailable,
  fn: async () => {
    const response = await fetch(
      `${FUNCTION_BASE_URL}/business-discovery-background`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessType: "test", location: "test" }),
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
    const response = await fetch(
      `${FUNCTION_BASE_URL}/enrichment-orchestrator`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaign_id: "test" }),
      }
    );

    assertEquals(response.status, 401);
  },
});
