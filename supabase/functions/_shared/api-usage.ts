import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export interface UsageLogContext {
  campaignId?: string | null;
  sessionId?: string | null;
  jobId?: string | null;
  tierKey?: string | null;
  businessQuery?: string | null;
  locationQuery?: string | null;
}

export interface UsageLogParams extends Partial<UsageLogContext> {
  sourceName: string;
  endpoint?: string;
  httpMethod?: string;
  requestParams?: Record<string, unknown> | null;
  queryType?: "discovery" | "enrichment" | "validation" | "internal";
  responseCode?: number | null;
  responseTimeMs?: number | null;
  resultsReturned?: number | null;
  success?: boolean;
  errorMessage?: string | null;
  estimatedCost?: number | null;
  actualCost?: number | null;
  billingCategory?: "free_tier" | "paid_usage" | "overage" | null;
  dataQualityScore?: number | null;
  usefulResults?: number | null;
  cacheHit?: boolean;
  rateLimited?: boolean;
  retryCount?: number;
  requestId?: string;
}

export interface UsageLogger {
  log: (entry: UsageLogParams) => Promise<void>;
}

interface SupabaseUsageInsert {
  campaign_id: string | null;
  session_id: string | null;
  request_id: string;
  source_name: string;
  endpoint: string | null;
  http_method: string;
  request_params: Record<string, unknown> | null;
  query_type: string | null;
  business_query: string | null;
  location_query: string | null;
  response_code: number | null;
  response_time_ms: number | null;
  results_returned: number | null;
  success: boolean | null;
  error_message: string | null;
  estimated_cost: number | null;
  actual_cost: number | null;
  cost_currency: string;
  billing_category: string | null;
  data_quality_score: number | null;
  useful_results: number | null;
  cache_hit: boolean;
  rate_limited: boolean;
  retry_count: number;
}

const UUID_REGEX =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;

function isValidUUID(value?: string | null): value is string {
  return typeof value === "string" && UUID_REGEX.test(value.trim());
}

function roundCost(value: number | null | undefined): number | null {
  if (typeof value !== "number" || Number.isNaN(value)) return null;
  return Math.round(value * 10000) / 10000;
}

function sanitizePayload(
  input: Record<string, unknown> | null | undefined
): Record<string, unknown> | null {
  if (!input) return null;

  try {
    return JSON.parse(
      JSON.stringify(input, (_, value) => {
        if (typeof value === "string" && value.length > 512) {
          return `${value.slice(0, 509)}…`;
        }
        return value;
      })
    );
  } catch (_error) {
    return null;
  }
}

function buildInsertPayload(
  baseContext: UsageLogContext,
  entry: UsageLogParams
): SupabaseUsageInsert {
  const merged = { ...baseContext, ...entry };
  const requestId = entry.requestId ?? crypto.randomUUID();
  const campaignId = isValidUUID(merged.campaignId) ? merged.campaignId : null;
  const sessionId = merged.sessionId ?? merged.jobId ?? null;

  const estimatedCost = roundCost(entry.estimatedCost);
  const actualCost = roundCost(entry.actualCost ?? entry.estimatedCost ?? null);
  const billingCategory =
    entry.billingCategory ?? (actualCost && actualCost > 0 ? "paid_usage" : "free_tier");

  return {
    campaign_id: campaignId,
    session_id: sessionId ?? null,
    request_id: requestId,
    source_name: entry.sourceName,
    endpoint: entry.endpoint ?? null,
    http_method: entry.httpMethod ?? "GET",
    request_params: sanitizePayload(entry.requestParams),
    query_type: entry.queryType ?? null,
    business_query: merged.businessQuery ?? entry.businessQuery ?? null,
    location_query: merged.locationQuery ?? entry.locationQuery ?? null,
    response_code: entry.responseCode ?? null,
    response_time_ms: entry.responseTimeMs ?? null,
    results_returned: entry.resultsReturned ?? null,
    success: typeof entry.success === "boolean" ? entry.success : null,
    error_message: entry.errorMessage ?? null,
    estimated_cost: estimatedCost,
    actual_cost: actualCost,
    cost_currency: "USD",
    billing_category: billingCategory,
    data_quality_score: entry.dataQualityScore ?? null,
    useful_results: entry.usefulResults ?? entry.resultsReturned ?? null,
    cache_hit: entry.cacheHit ?? false,
    rate_limited:
      entry.rateLimited ?? (typeof entry.responseCode === "number" && entry.responseCode === 429),
    retry_count: entry.retryCount ?? 0,
  };
}

export function createUsageLogger(
  supabaseUrl: string,
  serviceRoleKey: string,
  baseContext: UsageLogContext = {}
): UsageLogger {
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return {
    async log(entry: UsageLogParams) {
      try {
        const payload = buildInsertPayload(baseContext, entry);
        const { error } = await supabase.from("enhanced_api_usage").insert(payload);
        if (error) {
          console.error("📉 API usage logging error:", error.message);
        }
      } catch (error) {
        console.error("📉 API usage logging failed:", error);
      }
    },
  };
}
