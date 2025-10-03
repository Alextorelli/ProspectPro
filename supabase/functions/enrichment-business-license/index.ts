// enrichment-business-license v1.0
// Business License Lookup API integration for license verification
// Cost: $0.03 per request
// Coverage: All 50 US states

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const BUSINESS_LICENSE_API_BASE = "https://apis.licenselookup.org/api/v1";

// In-memory cache (1 hour expiry for license data)
const licenseCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION_MS = 90 * 24 * 60 * 60 * 1000; // 90 days (licenses don't change often)

interface BusinessLicenseRequest {
  action:
    | "searchCompany"
    | "searchLicense"
    | "searchOwner"
    | "searchNPI"
    | "searchPPP";

  // Common parameters
  state?: string;

  // Company search parameters
  companyName?: string;

  // License search parameters
  licenseNumber?: string;

  // Owner search parameters
  firstName?: string;
  lastName?: string;

  // NPI search parameters
  npi?: string;

  // PPP search parameters
  borrowerName?: string;
}

interface CachedLicenseData {
  id: string;
  agencyCode: string;
  licensingBoard: string;
  agencyName: string;
  licenseTypeCode: string;
  licenseType: string;
  specialtyCode?: string;
  specialty?: string;
  licenseNumber: string;
  address1: string;
  address2?: string;
  city: string;
  county: string;
  state: string;
  zipCode: string;
  normalizedFilingDate?: string;
  expirationDate?: string;
  currentStatus?: string;
}

serve(async (req) => {
  // CORS headers
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers":
          "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    // Parse request
    const requestData: BusinessLicenseRequest = await req.json();
    const { action } = requestData;

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Retrieve API key from Supabase Vault
    const { data: secretData, error: secretError } = await supabase.rpc(
      "vault_decrypt_secret",
      {
        secret_name: "BUSINESS_LICENSE_LOOKUP_API_KEY",
      }
    );

    if (secretError || !secretData) {
      console.error(
        "Failed to retrieve Business License API key:",
        secretError
      );
      return new Response(
        JSON.stringify({
          error: "API key not configured",
          details: secretError?.message,
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    const apiKey = secretData;

    // Route to appropriate endpoint
    let result;
    switch (action) {
      case "searchCompany":
        result = await searchCompany(apiKey, requestData);
        break;
      case "searchLicense":
        result = await searchLicense(apiKey, requestData);
        break;
      case "searchOwner":
        result = await searchOwner(apiKey, requestData);
        break;
      case "searchNPI":
        result = await searchNPI(apiKey, requestData);
        break;
      case "searchPPP":
        result = await searchPPP(apiKey, requestData);
        break;
      default:
        return new Response(
          JSON.stringify({
            error: "Invalid action",
            validActions: [
              "searchCompany",
              "searchLicense",
              "searchOwner",
              "searchNPI",
              "searchPPP",
            ],
          }),
          {
            status: 400,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
          }
        );
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error("Business License Lookup error:", error);
    return new Response(
      JSON.stringify({
        error: "Business License Lookup failed",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
});

// Search by company name
async function searchCompany(apiKey: string, params: BusinessLicenseRequest) {
  const { state, companyName, firstName, lastName } = params;

  if (!state || !companyName) {
    return { error: "Missing required parameters: state, companyName" };
  }

  // Check cache
  const cacheKey = `company:${state}:${companyName}:${firstName || ""}:${
    lastName || ""
  }`;
  const cached = licenseCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION_MS) {
    console.log("✅ Business License cache hit:", cacheKey);
    return { ...cached.data, cached: true };
  }

  // Build URL
  const url = new URL(`${BUSINESS_LICENSE_API_BASE}/business/company`);
  url.searchParams.append("state", state.toUpperCase());
  url.searchParams.append("company", companyName);
  if (firstName) url.searchParams.append("firstname", firstName);
  if (lastName) url.searchParams.append("lastname", lastName);

  // Make API request
  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      accessToken: apiKey,
    },
  });

  if (!response.ok) {
    return {
      error: "Business License API request failed",
      status: response.status,
      statusText: response.statusText,
    };
  }

  const data = await response.json();

  // Process results
  const result = {
    action: "searchCompany",
    state,
    companyName,
    found: data && Array.isArray(data) && data.length > 0,
    results: data || [],
    resultCount: Array.isArray(data) ? data.length : 0,
    cost: 0.03,
    cached: false,
  };

  // Cache results
  licenseCache.set(cacheKey, { data: result, timestamp: Date.now() });

  return result;
}

// Search by license number
async function searchLicense(apiKey: string, params: BusinessLicenseRequest) {
  const { state, licenseNumber } = params;

  if (!state || !licenseNumber) {
    return { error: "Missing required parameters: state, licenseNumber" };
  }

  // Check cache
  const cacheKey = `license:${state}:${licenseNumber}`;
  const cached = licenseCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION_MS) {
    console.log("✅ License cache hit:", cacheKey);
    return { ...cached.data, cached: true };
  }

  // Build URL
  const url = new URL(`${BUSINESS_LICENSE_API_BASE}/business/license`);
  url.searchParams.append("state", state.toUpperCase());
  url.searchParams.append("license_number", licenseNumber);

  // Make API request
  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      accessToken: apiKey,
    },
  });

  if (!response.ok) {
    return {
      error: "License API request failed",
      status: response.status,
      statusText: response.statusText,
    };
  }

  const data = await response.json();

  // Process results
  const result = {
    action: "searchLicense",
    state,
    licenseNumber,
    found: !!data,
    data: data || null,
    cost: 0.03,
    cached: false,
  };

  // Cache results
  licenseCache.set(cacheKey, { data: result, timestamp: Date.now() });

  return result;
}

// Search by owner name
async function searchOwner(apiKey: string, params: BusinessLicenseRequest) {
  const { state, firstName, lastName } = params;

  if (!state || !firstName || !lastName) {
    return { error: "Missing required parameters: state, firstName, lastName" };
  }

  // Check cache
  const cacheKey = `owner:${state}:${firstName}:${lastName}`;
  const cached = licenseCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION_MS) {
    console.log("✅ Owner cache hit:", cacheKey);
    return { ...cached.data, cached: true };
  }

  // Build URL
  const url = new URL(`${BUSINESS_LICENSE_API_BASE}/business/owner`);
  url.searchParams.append("state", state.toUpperCase());
  url.searchParams.append("firstname", firstName);
  url.searchParams.append("lastname", lastName);

  // Make API request
  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      accessToken: apiKey,
    },
  });

  if (!response.ok) {
    return {
      error: "Owner API request failed",
      status: response.status,
      statusText: response.statusText,
    };
  }

  const data = await response.json();

  // Process results
  const result = {
    action: "searchOwner",
    state,
    firstName,
    lastName,
    found: data && Array.isArray(data) && data.length > 0,
    results: data || [],
    resultCount: Array.isArray(data) ? data.length : 0,
    cost: 0.03,
    cached: false,
  };

  // Cache results
  licenseCache.set(cacheKey, { data: result, timestamp: Date.now() });

  return result;
}

// Search healthcare provider by NPI
async function searchNPI(apiKey: string, params: BusinessLicenseRequest) {
  const { npi } = params;

  if (!npi) {
    return { error: "Missing required parameter: npi" };
  }

  // Validate NPI format (10 digits)
  if (!/^\d{10}$/.test(npi)) {
    return { error: "Invalid NPI format (must be 10 digits)" };
  }

  // Check cache
  const cacheKey = `npi:${npi}`;
  const cached = licenseCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION_MS) {
    console.log("✅ NPI cache hit:", cacheKey);
    return { ...cached.data, cached: true };
  }

  // Build URL
  const url = new URL(`${BUSINESS_LICENSE_API_BASE}/doctor/npi`);
  url.searchParams.append("npi", npi);

  // Make API request
  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      accessToken: apiKey,
    },
  });

  if (!response.ok) {
    return {
      error: "NPI API request failed",
      status: response.status,
      statusText: response.statusText,
    };
  }

  const data = await response.json();

  // Process results
  const result = {
    action: "searchNPI",
    npi,
    found: !!data,
    data: data || null,
    cost: 0.03,
    cached: false,
  };

  // Cache results
  licenseCache.set(cacheKey, { data: result, timestamp: Date.now() });

  return result;
}

// Search PPP loan recipients
async function searchPPP(apiKey: string, params: BusinessLicenseRequest) {
  const { borrowerName } = params;

  if (!borrowerName) {
    return { error: "Missing required parameter: borrowerName" };
  }

  // Check cache
  const cacheKey = `ppp:${borrowerName}`;
  const cached = licenseCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION_MS) {
    console.log("✅ PPP cache hit:", cacheKey);
    return { ...cached.data, cached: true };
  }

  // Build URL
  const url = new URL(`${BUSINESS_LICENSE_API_BASE}/ppp/borrower`);
  url.searchParams.append("borrower_name", borrowerName);

  // Make API request
  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      accessToken: apiKey,
    },
  });

  if (!response.ok) {
    return {
      error: "PPP API request failed",
      status: response.status,
      statusText: response.statusText,
    };
  }

  const data = await response.json();

  // Process results
  const result = {
    action: "searchPPP",
    borrowerName,
    found: data && Array.isArray(data) && data.length > 0,
    results: data || [],
    resultCount: Array.isArray(data) ? data.length : 0,
    cost: 0.03,
    cached: false,
  };

  // Cache results
  licenseCache.set(cacheKey, { data: result, timestamp: Date.now() });

  return result;
}

console.log("🔍 Business License Lookup Edge Function v1.0 initialized");
console.log(
  "📊 Endpoints: searchCompany, searchLicense, searchOwner, searchNPI, searchPPP"
);
console.log("💰 Cost: $0.03 per request");
console.log("📦 Cache: 90-day expiration");
