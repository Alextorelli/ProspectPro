import {
  createClient,
  type SupabaseClient,
} from "https://esm.sh/@supabase/supabase-js@2.38.0";

export interface CacheLookupOptions {
  requestType: string;
  params: Record<string, unknown>;
}

export interface CacheStoreOptions {
  ttlSeconds: number;
  cost?: number;
  confidenceScore?: number;
}

export interface CacheMetadata {
  expiresAt: string | null;
  cost?: number | null;
  confidenceScore?: number | null;
  requestParams?: Record<string, unknown> | null;
}

export type CacheLookupResult<T> =
  | {
      hit: true;
      cacheKey: string;
      data: T;
      metadata: CacheMetadata;
    }
  | {
      hit: false;
      cacheKey: string;
      metadata?: CacheMetadata;
    };

const SUPABASE_HEADER = "ProspectPro-Edge-Cache";
let cachedClient: SupabaseClient | null = null;

function resolveSupabaseEnv(variableNames: string[], label: string): string {
  for (const name of variableNames) {
    const value = Deno.env.get(name);
    if (value) {
      return value;
    }
  }

  throw new Error(`Missing required environment variable for ${label}`);
}

function getServiceRoleClient(): SupabaseClient {
  if (cachedClient) {
    return cachedClient;
  }

  const supabaseUrl = resolveSupabaseEnv(
    ["EDGE_SUPABASE_URL", "SUPABASE_URL"],
    "Supabase URL"
  );
  const serviceRoleKey = resolveSupabaseEnv(
    ["EDGE_SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_SERVICE_ROLE_KEY"],
    "Supabase service role key"
  );

  cachedClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: {
        "X-Client-Info": SUPABASE_HEADER,
      },
    },
  });

  return cachedClient;
}

function normalizeValue(value: unknown): unknown {
  if (value === null || value === undefined) {
    return undefined;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length === 0 ? undefined : trimmed;
  }

  if (Array.isArray(value)) {
    const normalizedArray = value
      .map((entry) => normalizeValue(entry))
      .filter((entry) => entry !== undefined);

    return normalizedArray.length > 0 ? normalizedArray : undefined;
  }

  if (typeof value === "object") {
    const normalized: Record<string, unknown> = {};
    const keys = Object.keys(value as Record<string, unknown>).sort();

    for (const key of keys) {
      const normalizedEntry = normalizeValue(
        (value as Record<string, unknown>)[key]
      );

      if (normalizedEntry !== undefined) {
        normalized[key] = normalizedEntry;
      }
    }

    return Object.keys(normalized).length > 0 ? normalized : undefined;
  }

  return value;
}

function normalizeParams(
  params: Record<string, unknown>
): Record<string, unknown> {
  const normalized: Record<string, unknown> = {};
  const keys = Object.keys(params).sort();

  for (const key of keys) {
    const normalizedValue = normalizeValue(params[key]);
    if (normalizedValue !== undefined) {
      normalized[key] = normalizedValue;
    }
  }

  return normalized;
}

export class CacheManager {
  private readonly supabase: SupabaseClient;
  private readonly tableName: string;

  constructor(tableName = "enrichment_cache") {
    this.tableName = tableName;
    this.supabase = getServiceRoleClient();
  }

  private async generateCacheKey(
    requestType: string,
    params: Record<string, unknown>
  ): Promise<string> {
    const normalized = normalizeParams(params);
    const { data, error } = await this.supabase.rpc("generate_cache_key", {
      p_request_type: requestType,
      p_params: normalized,
    });

    if (error) {
      throw new Error(
        `Failed to generate cache key for ${requestType}: ${error.message}`
      );
    }

    const cacheKey = typeof data === "string" ? data : null;

    if (!cacheKey) {
      throw new Error("Cache key generation returned empty value");
    }

    return cacheKey;
  }

  async getCachedResponse<T>(
    options: CacheLookupOptions
  ): Promise<CacheLookupResult<T>> {
    const normalizedParams = normalizeParams(options.params);
    const cacheKey = await this.generateCacheKey(
      options.requestType,
      normalizedParams
    );

    const { data, error } = await this.supabase.rpc("get_cached_response", {
      p_request_type: options.requestType,
      p_params: normalizedParams,
    });

    if (error) {
      console.warn("Cache lookup failed", {
        requestType: options.requestType,
        error: error.message,
      });
      return { hit: false, cacheKey };
    }

    if (!data) {
      return { hit: false, cacheKey };
    }

    const { data: record, error: recordError } = await this.supabase
      .from(this.tableName)
      .select("expires_at, cost, confidence_score, request_params")
      .eq("cache_key", cacheKey)
      .limit(1)
      .maybeSingle();

    if (recordError) {
      console.warn("Failed to load cache metadata", {
        requestType: options.requestType,
        error: recordError.message,
      });
    }

    return {
      hit: true,
      cacheKey,
      data: data as T,
      metadata: {
        expiresAt: record?.expires_at ?? null,
        cost: record?.cost ?? null,
        confidenceScore: record?.confidence_score ?? null,
        requestParams: (record?.request_params ?? null) as Record<
          string,
          unknown
        > | null,
      },
    };
  }

  async storeCachedResponse<T>(
    options: CacheLookupOptions & { response: T; store: CacheStoreOptions }
  ): Promise<{ cacheKey: string }> {
    const normalizedParams = normalizeParams(options.params);
    const ttlSeconds = Math.max(options.store.ttlSeconds, 60);

    const { data, error } = await this.supabase.rpc("store_cached_response", {
      p_request_type: options.requestType,
      p_params: normalizedParams,
      p_response: options.response as unknown as Record<string, unknown>,
      p_cost: options.store.cost ?? 0,
      p_confidence_score: options.store.confidenceScore ?? 0,
      p_ttl: `${ttlSeconds} seconds`,
    });

    if (error) {
      throw new Error(
        `Failed to store cache entry for ${options.requestType}: ${error.message}`
      );
    }

    const cacheKey = typeof data === "string" ? data : null;

    if (!cacheKey) {
      throw new Error("Cache store operation did not return cache key");
    }

    return { cacheKey };
  }
}
