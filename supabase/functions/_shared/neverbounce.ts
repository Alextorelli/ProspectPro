// deno-lint-ignore-file no-explicit-any
// NeverBounce email verification wrapper for Supabase Edge Functions (Deno)

export type NBResult = {
  ok: boolean;
  status: number | null;
  verdict?: string; // valid, invalid, catchall, unknown, disposable
  isDeliverable?: boolean;
  confidence?: number; // 0-100 (approximation if API returns a scaled score)
  error?: string;
  meta: { costUsdEstimate: number; fetchedAt: string };
};

export async function verifyEmail(email: string): Promise<NBResult> {
  const apiKey = (globalThis as any)?.Deno?.env?.get?.("NEVERBOUNCE_API_KEY");
  if (!apiKey) {
    return {
      ok: false,
      status: null,
      error: "Missing NEVERBOUNCE_API_KEY",
      meta: { costUsdEstimate: 0, fetchedAt: new Date().toISOString() },
    };
  }

  // NeverBounce single check v4
  const url = `https://api.neverbounce.com/v4/single/check?key=${apiKey}&email=${encodeURIComponent(email)}`;
  try {
    const res = await fetch(url, { method: "GET" });
    const data = await res.json();
    if (!res.ok || !data) {
      return {
        ok: false,
        status: res.status,
        error: data?.message ?? `NeverBounce error ${res.status}`,
        meta: { costUsdEstimate: 0.008, fetchedAt: new Date().toISOString() },
      };
    }

    // Typical fields: result (valid/invalid/catchall/unknown/disposable), execution_time, etc.
    const verdict = data?.result ?? "unknown";
    const isDeliverable = verdict === "valid";
    // Some NB responses include suggested_confidence; otherwise map result to a simple heuristic
    const confidence = typeof data?.suggested_confidence === "number" ? data.suggested_confidence : (isDeliverable ? 90 : verdict === "catchall" ? 60 : 20);

    return {
      ok: true,
      status: res.status,
      verdict,
      isDeliverable,
      confidence,
      meta: { costUsdEstimate: 0.008, fetchedAt: new Date().toISOString() },
    };
  } catch (e) {
    const msg = (e && typeof e === "object" && "message" in (e as any)) ? (e as any).message : String(e);
    return {
      ok: false,
      status: null,
      error: msg,
      meta: { costUsdEstimate: 0.008, fetchedAt: new Date().toISOString() },
    };
  }
}
