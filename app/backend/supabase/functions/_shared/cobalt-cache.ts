import { CacheManager } from "./cache-manager.ts";

export type CacheStrategy = "cache-only" | "cache-preferred" | "live-refresh";

export interface TierCachePolicy {
  tier: string;
  strategy: CacheStrategy;
  ttlSeconds: number;
  forceLiveLookup: boolean;
}

export interface CobaltCacheLookupParams {
  businessName: string;
  state: string;
  street?: string;
  city?: string;
  postalCode?: string;
  includeUccData?: boolean;
  tier?: string | null;
  cacheVersion?: string;
}

export interface CobaltCacheResult {
  hit: boolean;
  cacheKey: string;
  policy: TierCachePolicy;
  data: Record<string, unknown> | null;
  metadata?: {
    expiresAt: string | null;
    cost?: number | null;
    confidenceScore?: number | null;
    requestParams?: Record<string, unknown> | null;
  };
}

const COBALT_CACHE_COST = 0.9;
const CACHE_VERSION = "v2025-10-15";

const BASE_POLICIES: Record<
  string,
  { strategy: CacheStrategy; defaultTtlDays: number; forceLive: boolean }
> = {
  starter: {
    strategy: "cache-only",
    defaultTtlDays: 90,
    forceLive: false,
  },
  professional: {
    strategy: "cache-preferred",
    defaultTtlDays: 45,
    forceLive: false,
  },
  enterprise: {
    strategy: "live-refresh",
    defaultTtlDays: 21,
    forceLive: true,
  },
  compliance: {
    strategy: "live-refresh",
    defaultTtlDays: 14,
    forceLive: true,
  },
};

function toSeconds(days: number): number {
  return Math.max(Math.round(days * 24 * 60 * 60), 60);
}

function resolveTier(input?: string | null): string {
  if (!input) return "professional";
  const normalized = input.toLowerCase();
  if (normalized.includes("starter")) return "starter";
  if (normalized.includes("professional")) return "professional";
  if (normalized.includes("enterprise")) return "enterprise";
  if (normalized.includes("compliance")) return "compliance";
  return normalized as "starter" | "professional" | "enterprise" | "compliance";
}

function readTtlOverride(tier: string, fallbackDays: number): number {
  const envSeconds = Deno.env.get(
    `COBALT_CACHE_TTL_${tier.toUpperCase()}_SECONDS`
  );
  if (envSeconds) {
    const seconds = Number(envSeconds);
    if (!Number.isNaN(seconds) && seconds > 0) {
      return Math.round(seconds);
    }
  }

  const envDays = Deno.env.get(`COBALT_CACHE_TTL_${tier.toUpperCase()}_DAYS`);
  if (envDays) {
    const days = Number(envDays);
    if (!Number.isNaN(days) && days > 0) {
      return toSeconds(days);
    }
  }

  return toSeconds(fallbackDays);
}

function normalizeName(value: string): string {
  return value.trim().toLowerCase();
}

function normalizeState(value: string): string {
  const trimmed = value.trim().toUpperCase();
  if (trimmed.length === 2) {
    return trimmed;
  }
  return trimmed.slice(0, 2);
}

function normalizePostal(value?: string): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function buildCacheParams(
  params: CobaltCacheLookupParams,
  policy: TierCachePolicy
): Record<string, unknown> {
  return {
    version: CACHE_VERSION,
    tier: policy.tier,
    strategy: policy.strategy,
    businessName: normalizeName(params.businessName),
    state: normalizeState(params.state),
    city: params.city ? normalizeName(params.city) : undefined,
    street: params.street ? normalizeName(params.street) : undefined,
    postalCode: normalizePostal(params.postalCode),
    includeUccData: Boolean(params.includeUccData),
  };
}

export function resolveTierCachePolicy(input?: string | null): TierCachePolicy {
  const tier = resolveTier(input);
  const basePolicy = BASE_POLICIES[tier] ?? BASE_POLICIES.professional;
  const ttlSeconds = readTtlOverride(tier, basePolicy.defaultTtlDays);

  return {
    tier,
    strategy: basePolicy.strategy,
    ttlSeconds,
    forceLiveLookup: basePolicy.forceLive,
  };
}

export class CobaltCache {
  private readonly cacheManager = new CacheManager();

  async lookup(params: CobaltCacheLookupParams): Promise<CobaltCacheResult> {
    const policy = resolveTierCachePolicy(params.tier);
    const cacheParams = buildCacheParams(params, policy);

    const lookup = await this.cacheManager.getCachedResponse<
      Record<string, unknown>
    >({
      requestType: "cobalt_sos",
      params: cacheParams,
    });

    return {
      hit: lookup.hit,
      cacheKey: lookup.cacheKey,
      policy,
      data: lookup.hit ? (lookup.data as Record<string, unknown>) : null,
      metadata: lookup.metadata,
    };
  }

  async store(
    params: CobaltCacheLookupParams,
    response: Record<string, unknown>,
    policy?: TierCachePolicy
  ): Promise<{ cacheKey: string }> {
    const resolvedPolicy = policy ?? resolveTierCachePolicy(params.tier);
    const cacheParams = buildCacheParams(params, resolvedPolicy);

    return await this.cacheManager.storeCachedResponse({
      requestType: "cobalt_sos",
      params: cacheParams,
      response,
      store: {
        ttlSeconds: resolvedPolicy.ttlSeconds,
        cost: COBALT_CACHE_COST,
        confidenceScore:
          typeof response?.["confidenceScore"] === "number"
            ? (response["confidenceScore"] as number)
            : 0,
      },
    });
  }
}
