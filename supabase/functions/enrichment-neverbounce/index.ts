import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import type { AuthenticatedRequestContext } from "../_shared/edge-auth.ts";
import {
  authenticateRequest,
  corsHeaders,
  handleCORS,
} from "../_shared/edge-auth.ts";
import { API_SECRETS, createVaultClient } from "../_shared/vault-client.ts";

/**
 * NeverBounce Email Verification Edge Function
 * Real-time email validation with quota management
 *
 * Pricing:
 * - Free Tier: 1,000 verifications/month
 * - Paid: $0.008 per verification
 * - Syntax validation: FREE (doesn't count against quota)
 *
 * Features:
 * - Secure vault integration for API keys
 * - Real-time email verification
 * - Batch verification support
 * - Quota tracking
 * - Syntax validation (free)
 * - Confidence scoring
 */

interface NeverBounceRequest {
  action: "verify" | "verify-batch" | "account-info" | "syntax-check";
  email?: string;
  emails?: string[];
  maxCostPerRequest?: number;
  tier?: string;
  tierKey?: string;
}

interface NeverBounceResponse {
  success: boolean;
  action: string;
  data?: Record<string, unknown>;
  cost: number;
  confidence?: number;
  quotaUsed?: number;
  quotaRemaining?: number;
  tier?: string;
  error?: string;
}

class NeverBounceClient {
  private apiKey: string;
  private baseURL = "https://api.neverbounce.com/v4";
  private monthlyQuota = 1000; // Free tier monthly quota
  private costPerVerification = 0.008;
  private cache = new Map();
  private cacheTTL = 7 * 24 * 60 * 60 * 1000; // 7 days

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * FREE: Syntax validation (doesn't count against quota)
   */
  syntaxCheck(email: string): Promise<NeverBounceResponse> {
    // Basic regex validation (completely free, no API call)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = emailRegex.test(email);

    return Promise.resolve({
      success: true,
      action: "syntax-check",
      data: {
        email,
        valid: isValid,
        reason: isValid ? "valid_syntax" : "invalid_syntax",
      },
      cost: 0,
      confidence: isValid ? 50 : 0,
    });
  }

  /**
   * PAID: Single email verification
   * Cost: $0.008 per verification (or uses free quota)
   */
  async verifySingle(email: string): Promise<NeverBounceResponse> {
    // Check cache first
    const cacheKey = `verify_${email}`;
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      console.log(`📦 Using cached verification for ${email}`);
      return { ...cached.data, cost: 0 };
    }

    try {
      const url = `${this.baseURL}/single/check`;
      const body = {
        key: this.apiKey,
        email: email,
        address_info: 1,
        credits_info: 1,
        timeout: 15,
      };

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (data.status !== "success") {
        throw new Error(data.message || "Email verification failed");
      }

      const result: NeverBounceResponse = {
        success: true,
        action: "verify",
        data: {
          email,
          result: data.result,
          flags: data.flags,
          suggested_correction: data.suggested_correction,
          address_info: data.address_info,
          execution_time: data.execution_time,
        },
        cost: this.costPerVerification,
        confidence: this.calculateConfidence(data.result),
        quotaUsed: data.credits_info?.paid_credits_used || 0,
        quotaRemaining: data.credits_info?.free_credits_remaining || 0,
      };

      // Cache the result
      this.cache.set(cacheKey, {
        data: result,
        timestamp: Date.now(),
      });

      return result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * PAID: Batch email verification
   * Cost: $0.008 per verification
   */
  async verifyBatch(emails: string[]): Promise<NeverBounceResponse> {
    const results: Array<Record<string, unknown>> = [];
    let totalCost = 0;
    let totalQuotaUsed = 0;

    console.log(`📧 Verifying batch of ${emails.length} emails`);

    // Verify each email (with rate limiting)
    for (const email of emails) {
      try {
        const result = await this.verifySingle(email);
        results.push({
          email,
          result: result.data?.result,
          confidence: result.confidence,
          cost: result.cost,
        });
        totalCost += result.cost || 0;
        totalQuotaUsed += result.quotaUsed || 0;

        // Rate limiting: 1 second between requests
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Error verifying ${email}:`, error);
        results.push({
          email,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return {
      success: true,
      action: "verify-batch",
      data: {
        total: emails.length,
        verified: results.filter((r) => r.result).length,
        results,
      },
      cost: totalCost,
      quotaUsed: totalQuotaUsed,
    };
  }

  /**
   * Get account information and quota status
   */
  async getAccountInfo(): Promise<NeverBounceResponse> {
    try {
      const url = `${this.baseURL}/account/info`;
      const body = {
        key: this.apiKey,
      };

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (data.status !== "success") {
        throw new Error(data.message || "Failed to get account info");
      }

      return {
        success: true,
        action: "account-info",
        data: {
          credits_info: {
            free_credits_remaining:
              data.credits_info?.free_credits_remaining || 0,
            free_credits_used: data.credits_info?.free_credits_used || 0,
            paid_credits_remaining:
              data.credits_info?.paid_credits_remaining || 0,
            paid_credits_used: data.credits_info?.paid_credits_used || 0,
          },
          job_counts: data.job_counts,
        },
        cost: 0,
        quotaRemaining: data.credits_info?.free_credits_remaining || 0,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Calculate confidence score based on NeverBounce result
   */
  private calculateConfidence(result: string): number {
    const confidenceMap: Record<string, number> = {
      valid: 95,
      accept_all: 70,
      unknown: 50,
      disposable: 20,
      invalid: 0,
    };

    return confidenceMap[result] || 0;
  }
}

serve(async (req) => {
  const corsResponse = handleCORS(req);
  if (corsResponse) return corsResponse;

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({
        success: false,
        error: "Method not allowed. Use POST with a JSON payload.",
        timestamp: new Date().toISOString(),
      }),
      {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  let authContext: AuthenticatedRequestContext;
  try {
    authContext = await authenticateRequest(req);
  } catch (authError) {
    console.error("❌ Authentication failed for NeverBounce enrichment", {
      error: authError instanceof Error ? authError.message : String(authError),
    });
    return new Response(
      JSON.stringify({
        success: false,
        error:
          authError instanceof Error
            ? authError.message
            : "Authentication failed",
        timestamp: new Date().toISOString(),
      }),
      {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  try {
    console.log(
      `✅ NeverBounce Email Verification Edge Function (user: ${authContext.userId})`
    );

    const contentType = req.headers.get("content-type") ?? "";
    if (!contentType.toLowerCase().includes("application/json")) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid content type. Expected application/json payload.",
          timestamp: new Date().toISOString(),
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    let requestData: NeverBounceRequest;
    try {
      requestData = await req.json();
    } catch (parseError) {
      console.error("Invalid JSON payload", parseError);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid JSON payload.",
          timestamp: new Date().toISOString(),
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { action, maxCostPerRequest = 2.0 } = requestData;

    if (!action) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing required field: action",
          timestamp: new Date().toISOString(),
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get NeverBounce API key from vault
    const vaultClient = createVaultClient();
    const neverBounceApiKey = await vaultClient.getSecret(
      API_SECRETS.NEVERBOUNCE
    );

    const neverBounceClient = new NeverBounceClient(neverBounceApiKey);

    let result: NeverBounceResponse;
    switch (action) {
      case "syntax-check": {
        if (!requestData.email) {
          throw new Error("email is required for syntax-check");
        }
        result = await neverBounceClient.syntaxCheck(requestData.email);
        break;
      }
      case "verify": {
        if (!requestData.email) {
          throw new Error("email is required for verify");
        }
        result = await neverBounceClient.verifySingle(requestData.email);
        break;
      }
      case "verify-batch": {
        if (!requestData.emails || requestData.emails.length === 0) {
          throw new Error("emails array is required for verify-batch");
        }
        const estimatedCost = requestData.emails.length * 0.008;
        if (estimatedCost > maxCostPerRequest) {
          throw new Error(
            `Batch verification cost ($${estimatedCost.toFixed(
              2
            )}) exceeds budget limit ($${maxCostPerRequest})`
          );
        }
        result = await neverBounceClient.verifyBatch(requestData.emails);
        break;
      }
      case "account-info": {
        result = await neverBounceClient.getAccountInfo();
        break;
      }
      default: {
        throw new Error(`Unknown action: ${action}`);
      }
    }

    if (result.cost > maxCostPerRequest) {
      console.warn(
        `⚠️ Cost limit exceeded: $${result.cost} > $${maxCostPerRequest}`
      );
    }

    console.log(
      `✅ NeverBounce ${action} completed - Cost: $${
        result.cost
      } - Quota remaining: ${result.quotaRemaining || "N/A"}`
    );

    if (requestData.tier || requestData.tierKey) {
      const normalizedTier = (requestData.tier ?? requestData.tierKey ?? "")
        .toString()
        .toLowerCase();
      result.tier = normalizedTier || undefined;
    }

    return new Response(
      JSON.stringify({
        ...result,
        timestamp: new Date().toISOString(),
        version: "1.0",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("NeverBounce verification error:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
