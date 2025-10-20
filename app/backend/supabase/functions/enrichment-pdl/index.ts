import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  authenticateRequest,
  corsHeaders,
  handleCORS,
} from "../_shared/edge-auth.ts";
import { API_SECRETS, createVaultClient } from "../_shared/vault-client.ts";

interface PdlCompanyRequest {
  businessName?: string;
  domain?: string;
  website?: string;
  linkedin?: string;
  location?: string;
  ticker?: string;
}

interface PdlPersonRequest {
  firstName?: string;
  lastName?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  linkedin?: string;
  company?: string;
  title?: string;
  location?: string;
}

interface PdlSearchRequest {
  company?: string;
  titleKeywords?: string[];
  location?: string;
  minimumLikelihood?: number;
  size?: number;
}

interface EnrichmentRequestPayload {
  lookupType?: "company" | "person" | "auto" | "company_and_person";
  businessName?: string;
  domain?: string;
  website?: string;
  linkedin?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  ticker?: string;
  person?: PdlPersonRequest;
  search?: PdlSearchRequest;
  minimumLikelihood?: number;
  size?: number;
  tier?: string;
  tierKey?: string;
}

interface PdlCompanyResponse {
  status: number;
  success: boolean;
  enriched: boolean;
  data: Record<string, unknown> | null;
  warnings?: string[];
}

interface PdlPersonResponse {
  status: number;
  success: boolean;
  enriched: boolean;
  data: Record<string, unknown> | null;
  likelihood?: number;
  warnings?: string[];
  matchesReturned?: number;
}

interface EdgeResponseBody {
  success: boolean;
  requestId: string;
  lookupType: "company" | "person" | "company_and_person" | "none";
  company?: PdlCompanyResponse;
  person?: PdlPersonResponse;
  durationMs: number;
  tier?: string;
  errors?: string[];
}

const PEOPLE_DATA_LABS_BASE_URL = "https://api.peopledatalabs.com/v5";
const DEFAULT_MINIMUM_LIKELIHOOD = 0.8;
const DEFAULT_SEARCH_SIZE = 3;

class PeopleDataLabsClient {
  private readonly apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private get headers(): HeadersInit {
    return {
      "Content-Type": "application/json",
      "User-Agent": "ProspectPro/1.0 (enrichment-pdl)",
    };
  }

  async enrichCompany(payload: PdlCompanyRequest): Promise<PdlCompanyResponse> {
    const params = new URLSearchParams({ api_key: this.apiKey });

    if (payload.domain) params.set("domain", payload.domain);
    if (payload.website) params.set("website", payload.website);
    if (payload.businessName) params.set("name", payload.businessName);
    if (payload.linkedin) params.set("profile", payload.linkedin);
    if (payload.location) params.set("location", payload.location);
    if (payload.ticker) params.set("ticker", payload.ticker);

    if (params.keys().next().value === "api_key") {
      throw new Error(
        "People Data Labs company enrichment requires at least one of domain, website, name, linkedin, location, or ticker"
      );
    }

    const url = `${PEOPLE_DATA_LABS_BASE_URL}/company/enrich?${params.toString()}`;
    const response = await fetch(url, {
      method: "GET",
      headers: this.headers,
    });

    const data = (await response.json()) as Record<string, unknown> | null;
    const success = response.ok && Boolean((data as { name?: string })?.name);

    return {
      status: response.status,
      success,
      enriched: success,
      data,
      warnings: success
        ? undefined
        : [
            typeof data?.["error"] === "string"
              ? (data["error"] as string)
              : "Company enrichment did not return a match",
          ],
    };
  }

  async enrichPerson(payload: PdlPersonRequest): Promise<PdlPersonResponse> {
    const params = new URLSearchParams({ api_key: this.apiKey });

    if (payload.email) params.set("email", payload.email);
    if (payload.linkedin) params.set("profile", payload.linkedin);
    if (payload.phone) params.set("phone", payload.phone);
    if (payload.firstName) params.set("first_name", payload.firstName);
    if (payload.lastName) params.set("last_name", payload.lastName);
    if (payload.fullName) params.set("name", payload.fullName);
    if (payload.company) params.set("company", payload.company);
    if (payload.title) params.set("title", payload.title);
    if (payload.location) params.set("location", payload.location);

    if (params.keys().next().value === "api_key") {
      throw new Error(
        "People Data Labs person enrichment requires an email, profile, phone, or (first+last+company)"
      );
    }

    const url = `${PEOPLE_DATA_LABS_BASE_URL}/person/enrich?${params.toString()}`;
    const response = await fetch(url, {
      method: "GET",
      headers: this.headers,
    });

    const data = (await response.json()) as Record<string, unknown> | null;
    const likelihood = (data as { likelihood?: number })?.likelihood;
    const success =
      response.ok && Boolean((data as { status?: number })?.status !== 404);

    return {
      status: response.status,
      success,
      enriched: success && Boolean(data && Object.keys(data).length > 0),
      data,
      likelihood: typeof likelihood === "number" ? likelihood : undefined,
      warnings: success
        ? undefined
        : [
            typeof data?.["error"] === "string"
              ? (data["error"] as string)
              : "Person enrichment did not return a match",
          ],
    };
  }

  async searchPerson(payload: PdlSearchRequest): Promise<PdlPersonResponse> {
    if (!payload.company && !payload.titleKeywords?.length) {
      throw new Error(
        "People Data Labs person search requires at least a company or title filter"
      );
    }

    const minimumLikelihood =
      typeof payload.minimumLikelihood === "number"
        ? payload.minimumLikelihood
        : DEFAULT_MINIMUM_LIKELIHOOD;
    const size = payload.size ?? DEFAULT_SEARCH_SIZE;

    const filters: Array<Record<string, unknown>> = [];

    if (payload.company) {
      filters.push({ term: { job_company_name: payload.company } });
    }

    if (payload.titleKeywords && payload.titleKeywords.length > 0) {
      const titleFilters = payload.titleKeywords.map((keyword) => ({
        wildcard: { job_title: `*${keyword}*` },
      }));
      filters.push({ bool: { should: titleFilters, minimum_should_match: 1 } });
    }

    if (payload.location) {
      filters.push({ term: { location_country: payload.location } });
    }

    const body = {
      api_key: this.apiKey,
      size,
      minimum_likelihood: minimumLikelihood,
      query: {
        bool: {
          must: filters,
        },
      },
    };

    const response = await fetch(`${PEOPLE_DATA_LABS_BASE_URL}/person/search`, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify(body),
    });

    const data = (await response.json()) as Record<string, unknown> | null;
    const matches = Array.isArray((data as { data?: unknown[] })?.data)
      ? ((data as { data?: unknown[] }).data as unknown[])
      : [];

    const topMatch =
      matches.length > 0 ? (matches[0] as Record<string, unknown>) : null;
    const likelihood = (topMatch as { likelihood?: number })?.likelihood;

    return {
      status: response.status,
      success: response.ok,
      enriched: matches.length > 0,
      data: topMatch,
      likelihood: typeof likelihood === "number" ? likelihood : undefined,
      matchesReturned: matches.length,
      warnings:
        matches.length === 0
          ? ["People Data Labs search returned no matches for supplied filters"]
          : undefined,
    };
  }
}

let cachedClient: PeopleDataLabsClient | null = null;

async function getClient(): Promise<PeopleDataLabsClient> {
  if (cachedClient) {
    return cachedClient;
  }

  const vaultClient = createVaultClient();
  const apiKey = await vaultClient.getSecret(API_SECRETS.PEOPLEDATALABS);
  if (!apiKey) {
    throw new Error(
      "People Data Labs API key not configured in vault or environment"
    );
  }

  cachedClient = new PeopleDataLabsClient(apiKey);
  return cachedClient;
}

function buildLocationString(
  payload: EnrichmentRequestPayload
): string | undefined {
  const parts: string[] = [];
  if (payload.city) parts.push(payload.city);
  if (payload.state) parts.push(payload.state);
  if (payload.country) parts.push(payload.country);
  if (parts.length === 0) return undefined;
  return parts.join(", ");
}

serve(async (req) => {
  const cors = handleCORS(req);
  if (cors) return cors;

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({
        success: false,
        error: "Method not allowed. Use POST with a JSON payload.",
      }),
      {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  try {
    await authenticateRequest(req);
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to authenticate request",
      }),
      {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  let payload: EnrichmentRequestPayload;
  try {
    payload = (await req.json()) as EnrichmentRequestPayload;
  } catch (_error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "Invalid JSON payload",
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  const requestId = crypto.randomUUID();
  const startedAt = performance.now();
  const errors: string[] = [];

  try {
    const client = await getClient();

    const lookupType = payload.lookupType ?? "auto";
    const location = buildLocationString(payload);

    let companyResponse: PdlCompanyResponse | undefined;
    let personResponse: PdlPersonResponse | undefined;
    let companyMatched = false;
    let personMatched = false;

    const shouldRunCompany =
      lookupType === "company" ||
      lookupType === "auto" ||
      lookupType === "company_and_person";
    const shouldRunPerson =
      lookupType === "person" ||
      lookupType === "auto" ||
      lookupType === "company_and_person";

    if (shouldRunCompany) {
      try {
        companyResponse = await client.enrichCompany({
          businessName: payload.businessName,
          domain: payload.domain,
          website: payload.website,
          linkedin: payload.linkedin,
          location,
          ticker: payload.ticker,
        });

        companyMatched = companyResponse.success;
      } catch (error) {
        errors.push(
          error instanceof Error
            ? `Company enrichment failed: ${error.message}`
            : "Company enrichment failed"
        );
      }
    }

    if (shouldRunPerson) {
      try {
        const personPayload = payload.person;
        if (personPayload && Object.keys(personPayload).length > 0) {
          personResponse = await client.enrichPerson({
            ...personPayload,
            company: personPayload.company ?? payload.businessName,
            location: personPayload.location ?? location,
          });
        } else if (payload.search || payload.businessName) {
          const searchRequest: PdlSearchRequest = {
            company: payload.search?.company ?? payload.businessName,
            titleKeywords: payload.search?.titleKeywords ?? [
              "Owner",
              "Founder",
              "Chief Executive Officer",
              "Principal",
            ],
            location: payload.search?.location ?? payload.state,
            minimumLikelihood:
              payload.search?.minimumLikelihood ?? payload.minimumLikelihood,
            size: payload.search?.size ?? payload.size,
          };

          personResponse = await client.searchPerson(searchRequest);
        } else {
          errors.push(
            "Person enrichment skipped: no person details or search configuration provided"
          );
        }

        personMatched = Boolean(personResponse?.success);
      } catch (error) {
        errors.push(
          error instanceof Error
            ? `Person enrichment failed: ${error.message}`
            : "Person enrichment failed"
        );
      }
    }

    const durationMs = Math.round(performance.now() - startedAt);

    const resolvedLookup: EdgeResponseBody["lookupType"] = companyMatched
      ? personMatched
        ? "company_and_person"
        : "company"
      : personMatched
      ? "person"
      : "none";

    const responseBody: EdgeResponseBody = {
      success: companyMatched || personMatched,
      requestId,
      lookupType: resolvedLookup,
      company: companyResponse,
      person: personResponse,
      tier: payload.tier,
      durationMs,
      errors: errors.length > 0 ? errors : undefined,
    };

    return new Response(JSON.stringify(responseBody), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    errors.push(
      error instanceof Error
        ? error.message
        : "Unexpected People Data Labs error"
    );

    return new Response(
      JSON.stringify({
        success: false,
        requestId,
        lookupType: "none",
        durationMs: Math.round(performance.now() - startedAt),
        errors,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
