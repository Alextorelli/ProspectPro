/**
 * ProspectPro v4.3 - Supabase Vault Client
 * Secure API key management for Edge Functions
 *
 * Features:
 * - Secure vault integration
 * - Caching for performance
 * - Error handling and fallbacks
 * - Type-safe secret access
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

interface SecretResult {
  secret_key: string;
  decrypted_secret: string | null;
  status:
    | "SUCCESS"
    | "NOT_FOUND"
    | "EMPTY"
    | "PLACEHOLDER"
    | "ACCESS_DENIED"
    | "ERROR";
  error_message: string | null;
}

export class VaultClient {
  private supabase;
  private cache = new Map<string, { value: string; timestamp: number }>();
  private cacheTTL = 60 * 60 * 1000; // 1 hour cache

  constructor(supabaseUrl: string, serviceRoleKey: string) {
    this.supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });
  }

  /**
   * Get a single secret from vault with caching
   */
  async getSecret(secretName: string): Promise<string> {
    // Check cache first
    const cached = this.cache.get(secretName);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.value;
    }

    try {
      const { data, error } = await this.supabase.rpc("vault_decrypt_secret", {
        secret_name: secretName,
      });

      if (error) {
        throw new Error(`Vault error: ${error.message}`);
      }

      if (!data || data.length === 0) {
        throw new Error(`Secret not found: ${secretName}`);
      }

      const result: SecretResult = data[0];

      if (result.status !== "SUCCESS") {
        throw new Error(
          `Secret error: ${result.error_message || result.status}`
        );
      }

      if (!result.decrypted_secret) {
        throw new Error(`Secret value is empty: ${secretName}`);
      }

      // Cache the result
      this.cache.set(secretName, {
        value: result.decrypted_secret,
        timestamp: Date.now(),
      });

      console.log(`✅ Retrieved secret from vault: ${secretName}`);
      return result.decrypted_secret;
    } catch (error) {
      console.error(`❌ Failed to retrieve secret: ${secretName}`, error);

      // Fallback to environment variable as backup
      const envValue = Deno.env.get(secretName);
      if (envValue) {
        console.log(`📋 Using environment fallback for: ${secretName}`);
        return envValue;
      }

      throw new Error(
        `Failed to retrieve secret ${secretName}: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Get multiple secrets in a single vault call
   */
  async getSecrets(secretNames: string[]): Promise<Record<string, string>> {
    const results: Record<string, string> = {};
    const uncachedSecrets: string[] = [];

    // Check cache for each secret
    for (const secretName of secretNames) {
      const cached = this.cache.get(secretName);
      if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
        results[secretName] = cached.value;
      } else {
        uncachedSecrets.push(secretName);
      }
    }

    // If all secrets are cached, return immediately
    if (uncachedSecrets.length === 0) {
      return results;
    }

    try {
      const { data, error } = await this.supabase.rpc(
        "vault_decrypt_multiple_secrets",
        { secret_names: uncachedSecrets }
      );

      if (error) {
        throw new Error(`Vault error: ${error.message}`);
      }

      if (!data || data.length === 0) {
        throw new Error("No secrets retrieved from vault");
      }

      // Process each secret result
      for (const result of data as SecretResult[]) {
        if (result.status === "SUCCESS" && result.decrypted_secret) {
          results[result.secret_key] = result.decrypted_secret;

          // Cache the result
          this.cache.set(result.secret_key, {
            value: result.decrypted_secret,
            timestamp: Date.now(),
          });
        } else {
          // Try environment fallback for failed secrets
          const envValue = Deno.env.get(result.secret_key);
          if (envValue) {
            console.log(
              `📋 Using environment fallback for: ${result.secret_key}`
            );
            results[result.secret_key] = envValue;
          } else {
            console.error(
              `❌ Failed to retrieve secret: ${result.secret_key} - ${result.error_message}`
            );
          }
        }
      }

      console.log(
        `✅ Retrieved ${Object.keys(results).length} secrets from vault`
      );
      return results;
    } catch (error) {
      console.error("❌ Failed to retrieve secrets from vault:", error);

      // Fallback to environment variables for all uncached secrets
      for (const secretName of uncachedSecrets) {
        const envValue = Deno.env.get(secretName);
        if (envValue) {
          console.log(`📋 Using environment fallback for: ${secretName}`);
          results[secretName] = envValue;
        }
      }

      // If we still don't have all secrets, throw error
      const missingSecrets = secretNames.filter((name) => !results[name]);
      if (missingSecrets.length > 0) {
        throw new Error(
          `Failed to retrieve secrets: ${missingSecrets.join(", ")}`
        );
      }

      return results;
    }
  }

  /**
   * Clear cache (useful for testing)
   */
  clearCache(): void {
    this.cache.clear();
  }
}

/**
 * Create vault client instance with new authentication support
 */
export function createVaultClient(): VaultClient {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");

  // Try new secret key format first, then legacy
  let serviceRoleKey =
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ||
    Deno.env.get("SUPABASE_SECRET_KEY") ||
    Deno.env.get("SUPABASE_ANON_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Supabase credentials not configured for vault access");
  }

  // Validate key format
  if (serviceRoleKey.startsWith("sb_secret_")) {
    console.log("✅ Using new secret key format for vault access");
  } else if (serviceRoleKey.startsWith("sb_publishable_")) {
    console.log(
      "⚠️ Using publishable key for vault access (limited permissions)"
    );
  } else if (serviceRoleKey.startsWith("eyJ")) {
    console.log("⚠️ Using legacy JWT key for vault access");
  } else {
    console.warn("❓ Unknown key format for vault access");
  }

  return new VaultClient(supabaseUrl, serviceRoleKey);
}

/**
 * Standard API secrets for ProspectPro enrichment
 * Updated to match actual vault secret names (uppercase with underscores)
 */
export const API_SECRETS = {
  HUNTER_IO: "HUNTER_IO_API_KEY",
  NEVERBOUNCE: "NEVERBOUNCE_API_KEY",
  GOOGLE_PLACES: "GOOGLE_PLACES_API_KEY",
  PEOPLEDATALABS: "PEOPLE_DATA_LABS_API_KEY",
  BUSINESS_LICENSE: "BUSINESS_LICENSE_LOOKUP_API_KEY",
  APOLLO: "APOLLO_API_KEY",
  FOURSQUARE: "FOURSQUARE_API_KEY",
  COBALT: "COBALT_API_KEY",
  FINRA: "FINRA_API_KEY",
  SCRAPINGDOG: "SCRAPINGDOG_API_KEY",
} as const;
