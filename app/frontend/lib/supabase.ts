import {
  FunctionsHttpError,
  FunctionsRelayError,
} from "@app/backend/functions-js";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_URL ||
  import.meta.env.SUPABASE_URL;

const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  import.meta.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export const SUPABASE_ANON_TOKEN = supabaseAnonKey;

// Helper function to get current session token for Edge Function calls
const SESSION_EXPIRY_BUFFER_SECONDS = 30;

const stripBearerPrefix = (value: string | null | undefined): string | null => {
  if (typeof value !== "string") {
    return value ?? null;
  }
  return value.replace(/^Bearer\s+/i, "").trim();
};

const isSessionExpiring = (expiresAt?: number | null): boolean => {
  if (!expiresAt) {
    return false;
  }
  const now = Math.floor(Date.now() / 1000);
  return expiresAt <= now + SESSION_EXPIRY_BUFFER_SECONDS;
};

export const getSessionToken = async (): Promise<string | null> => {
  const sessionResult = await supabase.auth.getSession();
  let session = sessionResult.data.session;

  if (sessionResult.error) {
    console.error("Error getting session:", sessionResult.error);
    return null;
  }

  if (!session?.access_token || isSessionExpiring(session.expires_at)) {
    const refreshResult = await supabase.auth.refreshSession();
    if (refreshResult.error) {
      console.error("Failed to refresh session:", refreshResult.error);
      return session?.access_token ?? null;
    }
    session = refreshResult.data.session ?? session;
  }

  return stripBearerPrefix(session?.access_token) ?? null;
};

// Helper function to ensure we have a valid session
export const ensureSession = async (): Promise<boolean> => {
  const sessionResult = await supabase.auth.getSession();
  const session = sessionResult.data.session;

  if (sessionResult.error) {
    console.error("Failed to read session:", sessionResult.error);
    return false;
  }

  if (session?.access_token && !isSessionExpiring(session.expires_at)) {
    return true;
  }

  const refreshResult = await supabase.auth.refreshSession();
  if (refreshResult.error) {
    console.error("Failed to refresh session:", refreshResult.error);
    return Boolean(session?.access_token);
  }

  return Boolean(refreshResult.data.session?.access_token);
};

// Edge Functions URL
export const EDGE_FUNCTIONS_URL =
  import.meta.env.VITE_EDGE_FUNCTIONS_URL || `${supabaseUrl}/functions/v1`;

// Edge Function endpoints for vault-secured progressive enrichment
export const EDGE_FUNCTIONS = {
  // Progressive Enrichment Orchestrator (vault-secured)
  ENRICHMENT_ORCHESTRATOR: `${EDGE_FUNCTIONS_URL}/enrichment-orchestrator`,

  // Individual enrichment services (vault-secured)
  ENRICHMENT_BUSINESS_LICENSE: `${EDGE_FUNCTIONS_URL}/enrichment-business-license`,
  ENRICHMENT_PDL: `${EDGE_FUNCTIONS_URL}/enrichment-pdl`,
  ENRICHMENT_HUNTER: `${EDGE_FUNCTIONS_URL}/enrichment-hunter`,
  ENRICHMENT_NEVERBOUNCE: `${EDGE_FUNCTIONS_URL}/enrichment-neverbounce`,

  // Legacy endpoints (for backward compatibility)
  ENHANCED_BUSINESS_DISCOVERY: `${EDGE_FUNCTIONS_URL}/enhanced-business-discovery`,
  LEAD_VALIDATION: `${EDGE_FUNCTIONS_URL}/lead-validation-edge`,
  BUSINESS_DISCOVERY: `${EDGE_FUNCTIONS_URL}/business-discovery-edge`,
  DIAGNOSTICS: `${EDGE_FUNCTIONS_URL}/diag`,
} as const;

// Progressive Enrichment Tiers - Consolidated to 3 Tiers
export const ENRICHMENT_TIERS = {
  BASE: {
    name: "Base",
    price: 0.15, // Essential Business Data
    stages: ["business-verification", "company-data"],
    description:
      "Essential Business Data - Perfect for targeted outreach campaigns",
    features: [
      "Business verification",
      "Company data (name, industry, size)",
      "Phone & address validation",
      "Generic company email",
    ],
    badge: "Most Popular",
    hasOwnershipData: false,
  },
  PROFESSIONAL: {
    name: "Professional",
    price: 0.45, // Enhanced Sales Intelligence
    stages: [
      "business-verification",
      "company-data",
      "email-discovery",
      "email-verification",
    ],
    description:
      "Enhanced Sales Intelligence - Verified contacts for higher conversion rates",
    features: [
      "Everything in Base",
      "Professional email discovery & verification",
      "Email deliverability verification",
      "Enhanced company enrichment",
    ],
    badge: "",
    hasOwnershipData: false,
  },
  ENTERPRISE: {
    name: "Enterprise",
    price: 2.5, // Premium Executive Access
    stages: [
      "business-verification",
      "company-data",
      "email-discovery",
      "email-verification",
      "executive-enrichment",
      "compliance-verification",
    ],
    description:
      "Premium Executive Access - Compliance-grade data with C-suite contacts",
    features: [
      "Everything in Professional",
      "Executive contact enrichment",
      "Full compliance verification",
      "Advanced data validation",
    ],
    badge: "Premium",
    hasOwnershipData: true,
  },
} as const;

type EdgeInvokeResult<T> = {
  data: T | null;
  error: any;
  response?: Response;
};

export async function invokeWithSession<T = unknown>(
  functionName: string,
  body: Record<string, unknown> | undefined,
  options: {
    token?: string | null;
    headers?: Record<string, string>;
  } = {}
): Promise<EdgeInvokeResult<T>> {
  const logEdgeAuthFailure = (
    stage: string,
    details: { functionName: string; payload: unknown }
  ) => {
    console.warn(`Edge function auth failure (${stage})`, details);
  };

  const parseErrorPayload = async (response: Response) => {
    try {
      const clone = response.clone();
      const contentType =
        clone.headers.get("Content-Type")?.split(";")[0].trim() ?? "text/plain";

      if (contentType === "application/json") {
        return await clone.json();
      }

      if (contentType === "text/plain") {
        const text = await clone.text();
        return text ? { message: text } : null;
      }

      // Fallback for unhandled response types
      return await clone.text();
    } catch (parseError) {
      console.warn("Failed to parse edge function error payload", parseError);
      return null;
    }
  };

  const resolveAccessToken = async (
    explicitToken?: string | null
  ): Promise<string> => {
    if (typeof explicitToken === "string" && explicitToken.trim().length > 0) {
      const sanitizedExplicit = stripBearerPrefix(explicitToken);
      if (sanitizedExplicit) {
        return sanitizedExplicit;
      }
    }

    const sessionToken = await getSessionToken();
    if (typeof sessionToken === "string" && sessionToken.trim().length > 0) {
      const sanitizedSession = stripBearerPrefix(sessionToken);
      if (sanitizedSession) {
        return sanitizedSession;
      }
    }

    throw new Error("Unable to determine Supabase session. Please sign in.");
  };

  const executeInvoke = async (
    tokenOverride?: string | null
  ): Promise<EdgeInvokeResult<T>> => {
    let accessToken: string | null = null;

    try {
      accessToken = await resolveAccessToken(tokenOverride);
    } catch (tokenError) {
      const normalizedError =
        tokenError instanceof Error
          ? tokenError
          : new Error(String(tokenError));
      return {
        data: null,
        error: normalizedError,
        response: undefined,
      };
    }

    const headerBag = new Headers(options.headers ?? {});
    headerBag.set("apikey", SUPABASE_ANON_TOKEN);
    headerBag.set("Authorization", `Bearer ${accessToken}`);

    const invokeResult = await supabase.functions.invoke<T>(functionName, {
      body,
      headers: Object.fromEntries(headerBag.entries()),
    });

    if (!invokeResult.error) {
      return {
        data: (invokeResult.data ?? null) as T | null,
        error: null,
        response: undefined,
      };
    }

    const error = invokeResult.error;

    if (error instanceof FunctionsRelayError) {
      return {
        data: null,
        error,
        response: error.context,
      };
    }

    if (error instanceof FunctionsHttpError && error.context) {
      const payload = await parseErrorPayload(error.context.clone());
      if (payload) {
        try {
          (error as Error & { payload?: unknown }).payload = payload;
        } catch (_assignError) {
          // Ignore assignment issues when error object is frozen
        }
      }

      if (error.context.status === 401) {
        logEdgeAuthFailure("http", {
          functionName,
          payload: (error as Error & { payload?: unknown }).payload ?? payload,
        });
      }

      return {
        data: null,
        error,
        response: error.context,
      };
    }

    return {
      data: null,
      error,
      response: undefined,
    };
  };

  let result = await executeInvoke(options.token);

  const isAuthError =
    result.error instanceof FunctionsHttpError &&
    result.error.context?.status === 401;

  if (isAuthError) {
    logEdgeAuthFailure("retry_initiated", {
      functionName,
      payload: (result.error as Error & { payload?: unknown }).payload,
    });

    const refreshed = await supabase.auth.refreshSession();

    if (!refreshed.error && refreshed.data.session?.access_token) {
      result = await executeInvoke(refreshed.data.session.access_token);
    }
  }

  if (
    result.error instanceof FunctionsHttpError &&
    result.error.context?.status === 401
  ) {
    logEdgeAuthFailure("retry_failed", {
      functionName,
      payload: (result.error as Error & { payload?: unknown }).payload,
    });
  }

  return result;
}
