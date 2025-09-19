// deno-lint-ignore-file no-explicit-any
// Scrapingdog wrapper for Supabase Edge Functions (Deno)
// Free tier may exist; otherwise ~$0.002/request. No fake data.

export type ScrapeResponse = {
  ok: boolean;
  status: number | null;
  html?: string;
  error?: string;
  meta: { costUsdEstimate: number; fetchedAt: string };
};

export async function scrapeHtml(url: string): Promise<ScrapeResponse> {
  const apiKey = (globalThis as any)?.Deno?.env?.get?.("SCRAPINGDOG_API_KEY");
  if (!apiKey) {
    return {
      ok: false,
      status: null,
      error: "Missing SCRAPINGDOG_API_KEY",
      meta: { costUsdEstimate: 0, fetchedAt: new Date().toISOString() },
    };
  }

  const endpoint = `https://api.scrapingdog.com/scrape?api_key=${apiKey}&url=${encodeURIComponent(url)}`;
  try {
    const res = await fetch(endpoint, { method: "GET" });
    const text = await res.text();
    const ok = res.status >= 200 && res.status < 400;
    return {
      ok,
      status: res.status,
      html: ok ? text : undefined,
      error: ok ? undefined : `Scraping failed with status ${res.status}`,
      meta: { costUsdEstimate: 0.002, fetchedAt: new Date().toISOString() },
    };
  } catch (e) {
    const msg = (e && typeof e === "object" && "message" in (e as any)) ? (e as any).message : String(e);
    return {
      ok: false,
      status: null,
      error: msg,
      meta: { costUsdEstimate: 0.002, fetchedAt: new Date().toISOString() },
    };
  }
}
