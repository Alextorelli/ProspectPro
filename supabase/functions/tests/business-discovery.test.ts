import {
  assertEquals,
  assertExists,
} from "https://deno.land/std@0.208.0/assert/mod.ts";

const LOCAL_SUPABASE_URL = "http://localhost:54321/functions/v1";

Deno.test("Business Discovery Background - Basic Response", async () => {
  const response = await fetch(
    `${LOCAL_SUPABASE_URL}/business-discovery-background`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ businessType: "test", location: "test" }),
    }
  );

  assertEquals(response.status, 200);
  const data = await response.json();
  assertExists(data);
});

Deno.test("Enrichment Orchestrator - Auth Required", async () => {
  const response = await fetch(
    `${LOCAL_SUPABASE_URL}/enrichment-orchestrator`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ campaign_id: "test" }),
    }
  );

  assertEquals(response.status, 401);
});
