import {
  FunctionsFetchError,
  FunctionsHttpError,
  FunctionsRelayError,
} from "@supabase/functions-js";
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

  return session?.access_token ?? null;
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
) {
  const executeInvoke = async (
    accessToken: string
  ): Promise<EdgeInvokeResult<T>> => {
    const headers = new Headers(options.headers ?? {});
    headers.set("apikey", SUPABASE_ANON_TOKEN);
    headers.set("Authorization", `Bearer ${accessToken.trim()}`);

    let requestBody: BodyInit | undefined;
    if (typeof body !== "undefined") {
      if (!headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
      }
      requestBody = JSON.stringify(body);
    }

    try {
      const response = await fetch(`${EDGE_FUNCTIONS_URL}/${functionName}`, {
        method: "POST",
        headers,
        body: requestBody,
      });

      const relayFlag = response.headers.get("x-relay-error");
      if (relayFlag && relayFlag === "true") {
        const relayError = new FunctionsRelayError(response);
        return {
          data: null,
          error: relayError,
          response: relayError.context,
        };
      }

      if (!response.ok) {
        const httpError = new FunctionsHttpError(response);
        return {
          data: null,
          error: httpError,
          response: httpError.context,
        };
      }

      const contentType =
        response.headers.get("Content-Type")?.split(";")[0].trim() ??
        "text/plain";

      let data: unknown;
      if (contentType === "application/json") {
        data = await response.json();
      } else if (contentType === "application/octet-stream") {
        data = await response.blob();
      } else if (contentType === "text/event-stream") {
        data = response;
      } else if (contentType === "multipart/form-data") {
        data = await response.formData();
      } else {
        data = await response.text();
      }

      return {
        data: data as T,
        error: null,
        response,
      };
    } catch (error) {
      const fetchError = new FunctionsFetchError(error);
      return { data: null, error: fetchError, response: undefined };
    }
  };

  const initialToken = options.token ?? (await getSessionToken());
  if (!initialToken) {
    throw new Error("Unable to determine Supabase session. Please sign in.");
  }

  let result = await executeInvoke(initialToken);

  const isAuthError =
    result.error instanceof FunctionsHttpError &&
    result.error.context?.status === 401;

  if (isAuthError) {
    console.warn(
      "Edge function returned 401. Attempting session refresh and retry."
    );
    const refreshed = await supabase.auth.refreshSession();
    const refreshedToken = refreshed.data.session?.access_token ?? null;

    if (!refreshed.error && refreshedToken && refreshedToken !== initialToken) {
      result = await executeInvoke(refreshedToken);
    }
  }

  return result;
}
