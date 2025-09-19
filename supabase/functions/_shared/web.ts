// deno-lint-ignore-file no-explicit-any
// Website accessibility check for Supabase Edge Functions (Deno)
// Returns status and final URL if accessible (200–399). No fake fallbacks.

export type WebCheck = {
  ok: boolean;
  status: number | null;
  finalUrl?: string;
  redirected?: boolean;
  error?: string;
};

export async function checkWebsiteAccessible(url: string, timeoutMs = 10000): Promise<WebCheck> {
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(url, { method: "GET", redirect: "follow", signal: controller.signal });
    clearTimeout(id);

    const ok = res.status >= 200 && res.status < 400;
    return {
      ok,
      status: res.status,
      finalUrl: res.url,
      redirected: res.redirected,
    };
  } catch (e) {
    const msg = (e && typeof e === "object" && "message" in (e as any)) ? (e as any).message : String(e);
    return { ok: false, status: null, error: msg };
  }
}
