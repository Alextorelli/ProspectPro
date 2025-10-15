import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  CobaltCache,
  resolveTierCachePolicy,
  type TierCachePolicy,
} from "../_shared/cobalt-cache.ts";
import {
  authenticateRequest,
  corsHeaders,
  extractBearerToken,
  getAuthorizationHeader,
  handleCORS,
} from "../_shared/edge-auth.ts";

interface CobaltRequest {
  businessName: string;
  state?: string;
  liveData?: boolean;
  includeUccData?: boolean;
  street?: string;
  city?: string;
  postalCode?: string;
  retryId?: string;
  campaignId?: string;
  jobId?: string;
  sessionUserId?: string;
  tier?: string;
  tierKey?: string;
}

interface CobaltResponse {
  success: boolean;
  status: number;
  data: Record<string, unknown> | null;
  durationMs: number;
  pollAttempts: number;
  attemptedLiveLookup: boolean;
  usedCache: boolean;
  cacheMetadata?: {
    cacheKey?: string;
    tier: string;
    strategy: string;
    expiresAt?: string | null;
    refreshedAt?: string | null;
    fallbackUsed?: boolean;
  };
  error?: string;
}

const FALLBACK_BASE_URL = "https://apigateway.cobaltintelligence.com/v1";
const POLL_INTERVAL_MS = 4000;
const MAX_POLL_ATTEMPTS = 6;

const cobaltCache = new CobaltCache();

function resolveTierPolicyFromRequest(
  request: CobaltRequest,
  req: Request
): TierCachePolicy {
  const headerTier =
    req.headers.get("x-prospectpro-tier") ??
    req.headers.get("x-prospectpro-tier-key");
  const tierInput = request.tier ?? request.tierKey ?? headerTier;
  const policy = resolveTierCachePolicy(tierInput);
  request.tier = policy.tier;
  request.tierKey = policy.tier.toUpperCase();
  return policy;
}

function normalizeState(value?: string): string | null {
  if (!value) return null;
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) return null;
  return trimmed.slice(0, 2);
}

function buildQuery(params: CobaltRequest): URLSearchParams {
  const query = new URLSearchParams();
  query.set("searchQuery", params.businessName);

  const state = normalizeState(params.state);
  if (state) {
    query.set("state", state);
  }

  if (params.street) {
    query.set("street", params.street);
  }
  if (params.city) {
    query.set("city", params.city);
  }
  if (params.postalCode) {
    query.set("zip", params.postalCode);
  }

  if (typeof params.includeUccData === "boolean") {
    query.set("uccData", params.includeUccData ? "true" : "false");
  }

  if (typeof params.liveData === "boolean") {
    query.set("liveData", params.liveData ? "true" : "false");
  }

  if (params.retryId) {
    query.set("retryId", params.retryId);
  }

  return query;
}

function shouldPoll(data: Record<string, unknown> | null): boolean {
  if (!data) return false;
  if ((data as { failed?: boolean }).failed) return false;
  if ((data as { completed?: boolean }).completed) return false;
  return Boolean((data as { retryId?: string }).retryId);
}

async function requestCobalt(
  baseUrl: string,
  apiKey: string,
  params: CobaltRequest
): Promise<{ data: Record<string, unknown> | null; status: number }> {
  const query = buildQuery(params);
  const url = `${baseUrl.replace(/\/$/, "")}/search?${query.toString()}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
  });

  let payload: Record<string, unknown> | null = null;
  try {
    payload = (await response.json()) as Record<string, unknown>;
  } catch (_error) {
    payload = null;
  }

  return { data: payload, status: response.status };
}

async function executeCobaltLookup(
  apiKey: string,
  params: CobaltRequest,
  policy: TierCachePolicy
): Promise<CobaltResponse> {
  const baseUrl = Deno.env.get("COBALT_SOS_BASE_URL") ?? FALLBACK_BASE_URL;

  const startedAt = Date.now();
  let attempts = 0;
  const shouldForceLive = policy.forceLiveLookup || params.liveData === true;
  const attemptedLiveLookup = shouldForceLive || Boolean(params.liveData);

  let currentParams: CobaltRequest = {
    ...params,
    liveData: shouldForceLive ? true : params.liveData,
  };
  let lastResponse = await requestCobalt(baseUrl, apiKey, currentParams);
  attempts += 1;

  while (attempts <= MAX_POLL_ATTEMPTS && shouldPoll(lastResponse.data)) {
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
    const retryId =
      (lastResponse.data as { retryId?: string })?.retryId ?? undefined;

    if (!retryId) {
      break;
    }

    currentParams = {
      ...currentParams,
      retryId,
      liveData: currentParams.liveData ?? true,
    };

    const retryResponse = await requestCobalt(baseUrl, apiKey, currentParams);
    lastResponse = retryResponse;
    attempts += 1;
  }

  const durationMs = Date.now() - startedAt;
  const data = lastResponse.data;
  const status = lastResponse.status;

  const usedCache = Boolean((data as { usedCache?: boolean })?.usedCache);

  return {
    success: status >= 200 && status < 500,
    status,
    data,
    durationMs,
    pollAttempts: attempts,
    attemptedLiveLookup,
    usedCache,
  };
}

serve(async (req) => {
  const corsResponse = handleCORS(req);
  if (corsResponse) return corsResponse;

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({
        success: false,
        error: "Method not allowed. Use POST with a JSON payload.",
      }),
      {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  const authHeader = getAuthorizationHeader(req);
  const bearer = extractBearerToken(authHeader);
  const serviceRoleKey =
    Deno.env.get("EDGE_SUPABASE_SERVICE_ROLE_KEY") ??
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ??
    "";
  const supabaseUrl =
    Deno.env.get("EDGE_SUPABASE_URL") ?? Deno.env.get("SUPABASE_URL") ?? "";

  if (!bearer || !supabaseUrl) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "Missing authentication header",
      }),
      {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  if (bearer !== serviceRoleKey) {
    try {
      await authenticateRequest(req);
    } catch (authError) {
      console.error("Cobalt enrichment auth failure", authError);
      return new Response(
        JSON.stringify({
          success: false,
          error:
            authError instanceof Error
              ? authError.message
              : "Authentication failed",
        }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  }

  let requestData: CobaltRequest;
  try {
    requestData = (await req.json()) as CobaltRequest;
  } catch (_parseError) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "Invalid JSON payload",
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  if (!requestData.businessName || !requestData.state) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "businessName and state are required",
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  const cobaltKey = Deno.env.get("COBALT_INTELLIGENCE_API_KEY");
  if (!cobaltKey) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "Cobalt API key is not configured",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  try {
    const tierPolicy = resolveTierPolicyFromRequest(requestData, req);

    const cacheLookup = await cobaltCache.lookup({
      businessName: requestData.businessName,
      state: requestData.state,
      street: requestData.street,
      city: requestData.city,
      postalCode: requestData.postalCode,
      includeUccData: requestData.includeUccData,
      tier: tierPolicy.tier,
    });

    const shouldReturnCachedOnly =
      cacheLookup.hit &&
      cacheLookup.data &&
      cacheLookup.policy.strategy !== "live-refresh" &&
      requestData.liveData !== true;

    if (shouldReturnCachedOnly) {
      const responsePayload: CobaltResponse = {
        success: true,
        status: 200,
        data: cacheLookup.data,
        durationMs: 0,
        pollAttempts: 0,
        attemptedLiveLookup: false,
        usedCache: true,
        cacheMetadata: {
          cacheKey: cacheLookup.cacheKey,
          tier: cacheLookup.policy.tier,
          strategy: cacheLookup.policy.strategy,
          expiresAt: cacheLookup.metadata?.expiresAt ?? null,
          refreshedAt: null,
          fallbackUsed: false,
        },
      };

      return new Response(
        JSON.stringify({
          ...responsePayload,
          timestamp: new Date().toISOString(),
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    let liveResult: CobaltResponse | null = null;
    let liveError: unknown = null;

    try {
      liveResult = await executeCobaltLookup(
        cobaltKey,
        requestData,
        cacheLookup.policy
      );
    } catch (error) {
      liveError = error;
    }

    if (liveResult && liveResult.success && liveResult.data) {
      const storeResult = await cobaltCache.store(
        {
          businessName: requestData.businessName,
          state: requestData.state,
          street: requestData.street,
          city: requestData.city,
          postalCode: requestData.postalCode,
          includeUccData: requestData.includeUccData,
          tier: cacheLookup.policy.tier,
        },
        liveResult.data,
        cacheLookup.policy
      );

      const expiresAt = new Date(
        Date.now() + cacheLookup.policy.ttlSeconds * 1000
      ).toISOString();

      const responsePayload: CobaltResponse = {
        ...liveResult,
        usedCache: false,
        cacheMetadata: {
          cacheKey: storeResult.cacheKey,
          tier: cacheLookup.policy.tier,
          strategy: cacheLookup.policy.strategy,
          expiresAt,
          refreshedAt: new Date().toISOString(),
          fallbackUsed: cacheLookup.hit,
        },
      };

      return new Response(
        JSON.stringify({
          ...responsePayload,
          timestamp: new Date().toISOString(),
        }),
        {
          status: responsePayload.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (cacheLookup.hit && cacheLookup.data) {
      const responsePayload: CobaltResponse = {
        success: true,
        status: liveResult?.status ?? 200,
        data: cacheLookup.data,
        durationMs: liveResult?.durationMs ?? 0,
        pollAttempts: liveResult?.pollAttempts ?? 0,
        attemptedLiveLookup: true,
        usedCache: true,
        cacheMetadata: {
          cacheKey: cacheLookup.cacheKey,
          tier: cacheLookup.policy.tier,
          strategy: cacheLookup.policy.strategy,
          expiresAt: cacheLookup.metadata?.expiresAt ?? null,
          refreshedAt: null,
          fallbackUsed: true,
        },
        error:
          liveResult?.error ??
          (liveError instanceof Error ? liveError.message : undefined),
      };

      return new Response(
        JSON.stringify({
          ...responsePayload,
          timestamp: new Date().toISOString(),
        }),
        {
          status: responsePayload.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (liveResult) {
      return new Response(
        JSON.stringify({
          ...liveResult,
          timestamp: new Date().toISOString(),
        }),
        {
          status: liveResult.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    throw liveError ?? new Error("Cobalt lookup failed without response");
  } catch (error) {
    console.error("Cobalt enrichment error", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
