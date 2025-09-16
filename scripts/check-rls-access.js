#!/usr/bin/env node
/**
 * Probes a list of Supabase tables to classify access outcomes (ok / unauthorized / missing / other).
 */
const fetch =
  global.fetch || (async () => (await import("node-fetch")).default)();

(async () => {
  const TABLES = [
    "campaigns",
    "enhanced_leads",
    "lead_emails",
    "lead_social_profiles",
    "api_usage_log",
    "api_cost_tracking",
    "campaign_analytics",
    "system_settings",
    "dashboard_exports",
  ];
  const url = process.env.SUPABASE_URL;
  const key =
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

  if (!url || !key) {
    console.error(
      "❌ Requires SUPABASE_URL and some Supabase key (prefer SUPABASE_SECRET_KEY)."
    );
    process.exit(1);
  }

  async function probe(table) {
    try {
      const resp = await (
        await fetch
      )(`${url}/rest/v1/${table}?select=id&limit=1`, {
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
          Prefer: "count=exact",
        },
      });
      if (resp.status === 200) return { table, status: "ok" };
      if (resp.status === 401 || resp.status === 403)
        return { table, status: "unauthorized", rlsLikely: true };
      if (resp.status === 404) return { table, status: "missing" };
      return {
        table,
        status: "other",
        http: resp.status,
        snippet: (await resp.text()).slice(0, 140),
      };
    } catch (e) {
      return { table, status: "error", error: e.message };
    }
  }

  const results = [];
  for (const t of TABLES) {
    results.push(await probe(t));
  }
  console.log(
    JSON.stringify({ probedAt: new Date().toISOString(), results }, null, 2)
  );
})();
