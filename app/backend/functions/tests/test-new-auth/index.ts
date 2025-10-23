import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  authenticateRequest,
  corsHeaders,
  extractBearerToken,
  getAuthorizationHeader,
  handleCORS,
  type AuthenticatedRequestContext,
} from "../../_shared/edge-auth.ts";

type NormalizedTier = "starter" | "professional" | "enterprise" | "compliance";

type DiagnosticsPayload = Record<string, unknown> & {
  diagnostics?: boolean;
  tier?: string;
  tierKey?: string;
  defaultTier?: string;
  probeTables?: string[];
};

interface TierResolution {
  tier: NormalizedTier;
  tierKey: string;
  source: string;
  originalValue: string | null;
  fallback: {
    tier: NormalizedTier;
    source: "body.defaultTier" | "default";
    originalValue: string | null;
  };
  candidates: Array<{
    source: string;
    value: string | null;
    normalized: NormalizedTier | null;
  }>;
}

const allowedProbeTables = ["campaigns", "leads", "dashboard_exports"] as const;
type AllowedProbeTable = (typeof allowedProbeTables)[number];

const tierAliasMap: Record<string, NormalizedTier> = {
  starter: "starter",
  launch: "starter",
  basic: "starter",
  professional: "professional",
  pro: "professional",
  premium: "professional",
  growth: "professional",
  business: "professional",
  enterprise: "enterprise",
  scale: "enterprise",
  enterprise_plus: "enterprise",
  compliance: "compliance",
  regulated: "compliance",
  compliance_plus: "compliance",
};

function createPreview(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (trimmed.length <= 10) return trimmed;
  return `${trimmed.slice(0, 6)}…${trimmed.slice(-4)}`;
}

function maskSecret(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (trimmed.length <= 8) return "****";
  return `${trimmed.slice(0, 4)}…${trimmed.slice(-4)}`;
}

function extractString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function getNestedString(
  source: Record<string, unknown>,
  path: string[]
): string | null {
  let current: unknown = source;

  for (const segment of path) {
    if (
      typeof current === "object" &&
      current !== null &&
      segment in (current as Record<string, unknown>)
    ) {
      current = (current as Record<string, unknown>)[segment];
    } else {
      return null;
    }
  }

  return extractString(current);
}

function normalizeTierValue(value?: string | null): NormalizedTier | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return null;

  if (normalized in tierAliasMap) {
    return tierAliasMap[normalized];
  }

  for (const [alias, tier] of Object.entries(tierAliasMap)) {
    if (normalized.includes(alias)) {
      return tier;
    }
  }

  if (normalized.startsWith("pro")) return "professional";
  if (normalized.startsWith("ent")) return "enterprise";
  if (normalized.startsWith("comp")) return "compliance";

  return null;
}

function resolveTier(
  headers: Headers,
  payload: DiagnosticsPayload,
  claimTier: unknown
): TierResolution {
  const fallbackCandidate = extractString(payload.defaultTier);
  const fallbackNormalized = normalizeTierValue(fallbackCandidate);
  const fallback = {
    tier: fallbackNormalized ?? "professional",
    source: fallbackNormalized
      ? ("body.defaultTier" as const)
      : ("default" as const),
    originalValue: fallbackNormalized ? fallbackCandidate : null,
  };

  const headerSources: Array<{ source: string; value: string | null }> = [
    {
      source: "header.x-prospectpro-tier",
      value: headers.get("x-prospectpro-tier"),
    },
    {
      source: "header.x-prospectpro-tier-key",
      value: headers.get("x-prospectpro-tier-key"),
    },
    { source: "header.x-prospect-tier", value: headers.get("x-prospect-tier") },
    {
      source: "header.x-prospect-tier-key",
      value: headers.get("x-prospect-tier-key"),
    },
    { source: "header.x-tier", value: headers.get("x-tier") },
    { source: "header.x-tier-key", value: headers.get("x-tier-key") },
    { source: "header.x-plan-tier", value: headers.get("x-plan-tier") },
  ];

  const bodySources: Array<{ source: string; value: string | null }> = [
    { source: "body.tierKey", value: extractString(payload.tierKey) },
    { source: "body.tier", value: extractString(payload.tier) },
    {
      source: "body.plan.tierKey",
      value:
        typeof payload.plan === "object" && payload.plan !== null
          ? getNestedString(payload.plan as Record<string, unknown>, [
              "tierKey",
            ])
          : null,
    },
    {
      source: "body.plan.tier",
      value:
        typeof payload.plan === "object" && payload.plan !== null
          ? getNestedString(payload.plan as Record<string, unknown>, ["tier"])
          : null,
    },
    {
      source: "body.subscription.tierKey",
      value:
        typeof payload.subscription === "object" &&
        payload.subscription !== null
          ? getNestedString(payload.subscription as Record<string, unknown>, [
              "tierKey",
            ])
          : null,
    },
    {
      source: "body.subscription.tier",
      value:
        typeof payload.subscription === "object" &&
        payload.subscription !== null
          ? getNestedString(payload.subscription as Record<string, unknown>, [
              "tier",
            ])
          : null,
    },
    {
      source: "body.campaign.tierKey",
      value:
        typeof payload.campaign === "object" && payload.campaign !== null
          ? getNestedString(payload.campaign as Record<string, unknown>, [
              "tierKey",
            ])
          : null,
    },
    {
      source: "body.campaign.tier",
      value:
        typeof payload.campaign === "object" && payload.campaign !== null
          ? getNestedString(payload.campaign as Record<string, unknown>, [
              "tier",
            ])
          : null,
    },
  ];

  const claimSources: Array<{ source: string; value: string | null }> = [
    { source: "token.claims.tier", value: extractString(claimTier) },
  ];

  const candidates = [...bodySources, ...headerSources, ...claimSources].map(
    ({ source, value }) => ({
      source,
      value,
      normalized: normalizeTierValue(value),
    })
  );

  const match = candidates.find((candidate) => candidate.normalized);

  if (match && match.normalized) {
    return {
      tier: match.normalized,
      tierKey: match.normalized.toUpperCase(),
      source: match.source,
      originalValue: match.value,
      fallback,
      candidates,
    };
  }

  return {
    tier: fallback.tier,
    tierKey: fallback.tier.toUpperCase(),
    source: fallback.source,
    originalValue: fallback.originalValue,
    fallback,
    candidates,
  };
}

function isAllowedProbeTable(value: string): value is AllowedProbeTable {
  return (allowedProbeTables as readonly string[]).includes(value);
}

async function runRlsProbes(
  authContext: AuthenticatedRequestContext,
  payload: DiagnosticsPayload
) {
  if (!payload.diagnostics) return undefined;

  const requestedRaw = Array.isArray(payload.probeTables)
    ? payload.probeTables
        .map((value) => extractString(value))
        .filter((value): value is string => Boolean(value))
    : [];

  const tables = Array.from(
    new Set(requestedRaw.filter(isAllowedProbeTable))
  ).slice(0, 3) as AllowedProbeTable[];

  const probeTables =
    tables.length > 0 ? tables : (["campaigns"] as AllowedProbeTable[]);

  const results: Array<{
    table: AllowedProbeTable;
    status: "ok" | "error";
    rows: number;
    error?: string;
  }> = [];

  for (const table of probeTables) {
    try {
      const { data, error } = await authContext.supabaseClient
        .from(table)
        .select("id")
        .limit(1);

      if (error) {
        results.push({
          table,
          status: "error",
          rows: 0,
          error: error.message,
        });
        continue;
      }

      results.push({
        table,
        status: "ok",
        rows: Array.isArray(data) ? data.length : 0,
      });
    } catch (error) {
      results.push({
        table,
        status: "error",
        rows: 0,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return results;
}

serve(async (req) => {
  const corsResponse = handleCORS(req);
  if (corsResponse) return corsResponse;

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({
        ok: false,
        error: "Method not allowed. Use POST with a JSON payload.",
      }),
      {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  const timestamp = new Date().toISOString();
  const sessionHeader = req.headers.get("x-prospect-session");
  const sessionToken = extractBearerToken(sessionHeader);
  const authorizationHeader = getAuthorizationHeader(req);
  const authorizationToken = extractBearerToken(authorizationHeader);

  const authHeaders = new Headers(req.headers);
  if (sessionToken) {
    authHeaders.set("Authorization", `Bearer ${sessionToken}`);
  }

  let authContext: AuthenticatedRequestContext | null = null;
  let authError: unknown = null;

  try {
    const authRequest = new Request(req.url, {
      method: req.method,
      headers: authHeaders,
    });
    authContext = await authenticateRequest(authRequest);
  } catch (error) {
    authError = error;
  }

  const payload = (await req.json().catch(() => ({}))) as DiagnosticsPayload;
  const tierResolution = resolveTier(
    req.headers,
    payload,
    authContext?.tokenClaims?.tier
  );

  const requestSummary = {
    method: req.method,
    hasAuthorizationHeader: Boolean(authorizationHeader),
    hasApiKeyHeader: req.headers.has("apikey"),
    hasSessionHeader: Boolean(sessionHeader),
    contentType: req.headers.get("content-type") ?? null,
    payloadKeys: Object.keys(payload).slice(0, 12),
    tier: {
      tier: tierResolution.tier,
      tierKey: tierResolution.tierKey,
      source: tierResolution.source,
    },
    authorizationPreview: createPreview(authorizationToken),
    sessionPreview: createPreview(sessionToken),
  };

  if (!authContext) {
    const errorMessage =
      authError instanceof Error ? authError.message : "Authentication failed";
    const diagnostics =
      authError && typeof authError === "object" && "diagnostics" in authError
        ? (authError as { diagnostics?: unknown }).diagnostics ?? null
        : null;

    return new Response(
      JSON.stringify(
        {
          ok: false,
          timestamp,
          error: errorMessage,
          authentication: {
            success: false,
            diagnostics,
          },
          request: requestSummary,
          tier: tierResolution,
        },
        null,
        2
      ),
      {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  const rlsResults = await runRlsProbes(authContext, payload);

  const responseBody = {
    ok: true,
    timestamp,
    request: requestSummary,
    tier: tierResolution,
    authentication: {
      success: true,
      request: {
        userId: authContext.userId,
        email: authContext.email,
        sessionId: authContext.sessionId,
        isAnonymous: authContext.isAnonymous,
        tokenPreview: createPreview(authContext.accessToken),
        tier: tierResolution.tier,
        tierKey: tierResolution.tierKey,
        tierSource: tierResolution.source,
      },
      environment: {
        supabaseUrl: authContext.supabaseUrl,
        publishableTokenPreview: createPreview(authorizationToken),
        serviceRolePreview: maskSecret(authContext.supabaseServiceRoleKey),
      },
      tokenClaims: authContext.tokenClaims,
    },
    diagnostics: {
      diagnosticsRequested: Boolean(payload.diagnostics),
      tierCandidates: tierResolution.candidates,
      sessionHeaderPreview: createPreview(sessionToken),
      rlsProbes: rlsResults,
    },
  };

  return new Response(JSON.stringify(responseBody, null, 2), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
