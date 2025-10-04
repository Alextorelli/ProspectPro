// ProspectPro v4.2 - Updated Authentication Handler for Edge Functions
// Supports new sb_publishable_ and sb_secret_ API key format
// October 4, 2025 - Complete Migration to New API Keys

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

interface AuthContext {
  supabaseUrl: string;
  apiKey: string;
  keyFormat: "new_publishable" | "new_secret" | "legacy_jwt" | "unknown";
  isValid: boolean;
  client?: any;
}

export class EdgeFunctionAuth {
  private supabaseUrl: string;
  private publishableKey: string;
  private secretKey: string;

  constructor() {
    this.supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    // Try both environment locations
    this.publishableKey =
      Deno.env.get("SUPABASE_ANON_KEY") ||
      Deno.env.get("VITE_SUPABASE_ANON_KEY") ||
      "";
    this.secretKey =
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ||
      Deno.env.get("SUPABASE_SECRET_KEY") ||
      "";
  }

  /**
   * Validate and classify API key format
   */
  validateApiKeyFormat(apiKey: string): {
    format: "new_publishable" | "new_secret" | "legacy_jwt" | "unknown";
    isValid: boolean;
  } {
    // New publishable key format
    if (apiKey.startsWith("sb_publishable_")) {
      return { format: "new_publishable", isValid: apiKey.length > 30 };
    }

    // New secret key format
    if (apiKey.startsWith("sb_secret_")) {
      return { format: "new_secret", isValid: apiKey.length > 20 };
    }

    // Legacy JWT format
    if (apiKey.startsWith("eyJ") && apiKey.length > 100) {
      return { format: "legacy_jwt", isValid: true };
    }

    return { format: "unknown", isValid: false };
  }

  /**
   * Get authentication context for Edge Functions
   */
  getAuthContext(): AuthContext {
    // Check if we have new format keys
    const publishableValidation = this.validateApiKeyFormat(
      this.publishableKey
    );
    const secretValidation = this.validateApiKeyFormat(this.secretKey);

    // Prefer new format keys
    if (
      publishableValidation.isValid &&
      publishableValidation.format === "new_publishable"
    ) {
      return {
        supabaseUrl: this.supabaseUrl,
        apiKey: this.publishableKey,
        keyFormat: "new_publishable",
        isValid: true,
        client: this.createSupabaseClient(this.publishableKey),
      };
    }

    if (secretValidation.isValid && secretValidation.format === "new_secret") {
      return {
        supabaseUrl: this.supabaseUrl,
        apiKey: this.secretKey,
        keyFormat: "new_secret",
        isValid: true,
        client: this.createSupabaseClient(this.secretKey),
      };
    }

    // Fallback to legacy JWT if available
    if (
      publishableValidation.format === "legacy_jwt" &&
      publishableValidation.isValid
    ) {
      console.log("⚠️ Using legacy JWT authentication (consider upgrading)");
      return {
        supabaseUrl: this.supabaseUrl,
        apiKey: this.publishableKey,
        keyFormat: "legacy_jwt",
        isValid: true,
        client: this.createSupabaseClient(this.publishableKey),
      };
    }

    // No valid authentication
    return {
      supabaseUrl: this.supabaseUrl,
      apiKey: "",
      keyFormat: "unknown",
      isValid: false,
    };
  }

  /**
   * Create Supabase client with appropriate key
   */
  private createSupabaseClient(apiKey: string) {
    const validation = this.validateApiKeyFormat(apiKey);

    // For Edge Functions, we typically need service role key for full access
    // But new format publishable keys have limited permissions
    const options = {
      auth: { persistSession: false },
      global: {
        headers: validation.format.startsWith("new_")
          ? {
              apikey: apiKey,
              Authorization: `Bearer ${apiKey}`,
            }
          : {},
      },
    };

    return createClient(this.supabaseUrl, apiKey, options);
  }

  /**
   * Validate request authentication from headers
   */
  validateRequestAuth(request: Request): {
    isValid: boolean;
    apiKey: string;
    keyFormat: string;
    error?: string;
  } {
    // Check Authorization header
    const authHeader = request.headers.get("Authorization");
    const apikeyHeader = request.headers.get("apikey");

    let apiKey = "";

    // Extract API key from Authorization header
    if (authHeader?.startsWith("Bearer ")) {
      apiKey = authHeader.substring(7);
    } else if (apikeyHeader) {
      apiKey = apikeyHeader;
    }

    if (!apiKey) {
      return {
        isValid: false,
        apiKey: "",
        keyFormat: "none",
        error: "No API key provided in Authorization or apikey header",
      };
    }

    const validation = this.validateApiKeyFormat(apiKey);

    return {
      isValid: validation.isValid,
      apiKey: apiKey,
      keyFormat: validation.format,
      error: validation.isValid ? undefined : "Invalid API key format",
    };
  }

  /**
   * Test database connectivity with current auth
   */
  async testDatabaseConnection(): Promise<{
    success: boolean;
    keyFormat: string;
    error?: string;
    hasAccess?: {
      campaigns: boolean;
      leads: boolean;
      dashboard_exports: boolean;
    };
  }> {
    const authContext = this.getAuthContext();

    if (!authContext.isValid || !authContext.client) {
      return {
        success: false,
        keyFormat: authContext.keyFormat,
        error: "No valid authentication available",
      };
    }

    try {
      // Test access to core tables
      const testResults = {
        campaigns: false,
        leads: false,
        dashboard_exports: false,
      };

      // Test campaigns table access
      try {
        const { data, error } = await authContext.client
          .from("campaigns")
          .select("id")
          .limit(1);
        testResults.campaigns = !error;
      } catch (e) {
        console.log("Campaigns access test failed:", e);
      }

      // Test leads table access
      try {
        const { data, error } = await authContext.client
          .from("leads")
          .select("id")
          .limit(1);
        testResults.leads = !error;
      } catch (e) {
        console.log("Leads access test failed:", e);
      }

      // Test dashboard_exports table access
      try {
        const { data, error } = await authContext.client
          .from("dashboard_exports")
          .select("id")
          .limit(1);
        testResults.dashboard_exports = !error;
      } catch (e) {
        console.log("Dashboard exports access test failed:", e);
      }

      const hasAnyAccess = Object.values(testResults).some((access) => access);

      return {
        success: hasAnyAccess,
        keyFormat: authContext.keyFormat,
        hasAccess: testResults,
      };
    } catch (error) {
      return {
        success: false,
        keyFormat: authContext.keyFormat,
        error:
          error instanceof Error ? error.message : "Database connection failed",
      };
    }
  }
}

/**
 * Convenience function to get authenticated Supabase client
 */
export function createAuthenticatedClient(): {
  client: any;
  authContext: AuthContext;
} {
  const auth = new EdgeFunctionAuth();
  const authContext = auth.getAuthContext();

  if (!authContext.isValid) {
    throw new Error(`Invalid authentication: ${authContext.keyFormat}`);
  }

  return {
    client: authContext.client,
    authContext,
  };
}

/**
 * CORS headers for Edge Functions
 */
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
};

/**
 * Handle OPTIONS requests for CORS
 */
export function handleCORS(request: Request): Response | null {
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  return null;
}
