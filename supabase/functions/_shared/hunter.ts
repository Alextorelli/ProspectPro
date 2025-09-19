// deno-lint-ignore-file no-explicit-any
// Hunter.io domain search wrapper for Supabase Edge Functions (Deno)

export type HunterEmail = {
  value: string;
  type?: string;
  confidence?: number; // 0-100
  first_name?: string;
  last_name?: string;
  position?: string;
  sources?: { uri: string; extracted_on?: string }[];
};

export type HunterSearchResponse = {
  ok: boolean;
  status: number | null;
  emails: HunterEmail[];
  error?: string;
  meta: { costUsdEstimate: number; fetchedAt: string; rateLimited?: boolean };
};

export async function domainSearch(domain: string): Promise<HunterSearchResponse> {
  const apiKey = (globalThis as any)?.Deno?.env?.get?.("HUNTER_IO_API_KEY");
  if (!apiKey) {
    return {
      ok: false,
      status: null,
      emails: [],
      error: "Missing HUNTER_IO_API_KEY",
      meta: { costUsdEstimate: 0, fetchedAt: new Date().toISOString() },
    };
  }

  const url = `https://api.hunter.io/v2/domain-search?domain=${encodeURIComponent(domain)}&api_key=${apiKey}`;
  try {
    const res = await fetch(url, { method: "GET" });
    const data = await res.json();
    if (!res.ok) {
      const rateLimited = res.status === 429;
      return {
        ok: false,
        status: res.status,
        emails: [],
        error: data?.errors?.[0]?.details ?? `Hunter error ${res.status}`,
        meta: { costUsdEstimate: 0.04, fetchedAt: new Date().toISOString(), rateLimited },
      };
    }
    const emails: HunterEmail[] = data?.data?.emails ?? [];
    return {
      ok: true,
      status: res.status,
      emails,
      meta: { costUsdEstimate: 0.04, fetchedAt: new Date().toISOString() },
    };
  } catch (e) {
    const msg = (e && typeof e === "object" && "message" in (e as any)) ? (e as any).message : String(e);
    return {
      ok: false,
      status: null,
      emails: [],
      error: msg,
      meta: { costUsdEstimate: 0.04, fetchedAt: new Date().toISOString() },
    };
  }
}
