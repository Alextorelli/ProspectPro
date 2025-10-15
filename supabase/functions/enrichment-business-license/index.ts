import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  authenticateRequest,
  corsHeaders,
  handleCORS,
} from "../_shared/edge-auth.ts";
import { API_SECRETS, createVaultClient } from "../_shared/vault-client.ts";

interface BusinessLicenseRequest {
  businessName: string;
  state?: string;
  licenseNumber?: string;
  professionalType?: string;
  city?: string;
  postalCode?: string;
  includeInactive?: boolean;
  includeUccData?: boolean;
  includeLiveData?: boolean;
  sources?: Array<"cobalt" | "ny_socrata">;
}

interface LicenseRecord {
  source: string;
  licenseNumber?: string;
  status?: string;
  issuedDate?: string;
  expirationDate?: string;
  professionalType?: string;
  issuingAuthority?: string;
  raw: Record<string, unknown>;
}

interface SourceResult {
  provider: string;
  success: boolean;
  responseCode: number;
  records: LicenseRecord[];
  durationMs: number;
  raw?: Record<string, unknown> | null;
  warnings?: string[];
  error?: string;
}

interface EdgeResponseBody {
  success: boolean;
  requestId: string;
  businessName: string;
  state?: string;
  licenseNumber?: string;
  records: LicenseRecord[];
  sources: SourceResult[];
  durationMs: number;
  errors?: string[];
}

const COBALT_BASE_URL =
  Deno.env.get("COBALT_SOS_BASE_URL") ??
  "https://apigateway.cobaltintelligence.com/v1";
const NY_SOC_DATASET = "https://data.ny.gov/resource/bbep-8e5w.json";

function normalizeState(value?: string): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim().toUpperCase();
  if (!trimmed) return undefined;
  if (trimmed.length === 2) return trimmed;
  // Accept full names for common states
  const STATE_MAP: Record<string, string> = {
    CALIFORNIA: "CA",
    NEW_YORK: "NY",
    TEXAS: "TX",
    FLORIDA: "FL",
    WASHINGTON: "WA",
    OREGON: "OR",
    ARIZONA: "AZ",
    COLORADO: "CO",
    NEVADA: "NV",
    GEORGIA: "GA",
    ILLINOIS: "IL",
    MASSACHUSETTS: "MA",
    MICHIGAN: "MI",
    MINNESOTA: "MN",
    NORTH_CAROLINA: "NC",
    SOUTH_CAROLINA: "SC",
    VIRGINIA: "VA",
    DISTRICT_OF_COLUMBIA: "DC",
  };
  return STATE_MAP[trimmed.replace(/\s+/g, "_")] ?? undefined;
}

class StateLicenseLookupService {
  private cobaltApiKey: string | null;
  private socrataAppToken: string | null;

  private constructor(options: {
    cobaltApiKey: string | null;
    socrataAppToken: string | null;
  }) {
    this.cobaltApiKey = options.cobaltApiKey;
    this.socrataAppToken = options.socrataAppToken;
  }

  static async create(): Promise<StateLicenseLookupService> {
    const vault = createVaultClient();

    let cobaltApiKey: string | null = null;
    let socrataAppToken: string | null = null;

    try {
      cobaltApiKey = await vault.getSecret(API_SECRETS.COBALT);
    } catch (error) {
      console.warn(
        "⚠️ Cobalt API key unavailable:",
        error instanceof Error ? error.message : "Unknown error"
      );
    }

    try {
      socrataAppToken = await vault.getSecret("SOCRATA_APP_TOKEN");
    } catch (error) {
      console.warn(
        "ℹ️ Socrata app token not configured:",
        error instanceof Error ? error.message : "Unknown error"
      );
    }

    return new StateLicenseLookupService({ cobaltApiKey, socrataAppToken });
  }

  async lookup(request: BusinessLicenseRequest): Promise<SourceResult[]> {
    const sourcesRequested = request.sources ?? ["cobalt", "ny_socrata"];
    const results: SourceResult[] = [];

    if (sourcesRequested.includes("cobalt") && this.cobaltApiKey) {
      results.push(await this.lookupWithCobalt(request));
    } else if (sourcesRequested.includes("cobalt")) {
      results.push({
        provider: "cobalt_sos",
        success: false,
        responseCode: 503,
        records: [],
        durationMs: 0,
        error: "Cobalt API key not configured",
      });
    }

    const normalizedState = normalizeState(request.state);
    if (sourcesRequested.includes("ny_socrata") && normalizedState === "NY") {
      results.push(await this.lookupNewYorkSocrata(request));
    }

    return results;
  }

  private async lookupWithCobalt(
    request: BusinessLicenseRequest
  ): Promise<SourceResult> {
    const start = performance.now();

    if (!this.cobaltApiKey) {
      return {
        provider: "cobalt_sos",
        success: false,
        responseCode: 503,
        records: [],
        durationMs: 0,
        error: "Cobalt API key not available",
      };
    }

    const params = new URLSearchParams();
    params.set("searchQuery", request.businessName);

    const normalizedState = normalizeState(request.state);
    if (normalizedState) params.set("state", normalizedState.toLowerCase());
    if (request.city) params.set("city", request.city);
    if (request.postalCode) params.set("zip", request.postalCode);
    if (request.includeLiveData ?? true) params.set("liveData", "true");
    if (request.includeUccData ?? false) params.set("uccData", "true");

    const url = `${COBALT_BASE_URL.replace(
      /\/$/,
      ""
    )}/search?${params.toString()}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${this.cobaltApiKey}`,
        "Content-Type": "application/json",
      },
    });

    let payload: Record<string, unknown> | null = null;
    try {
      payload = (await response.json()) as Record<string, unknown>;
    } catch (_error) {
      payload = null;
    }

    const records: LicenseRecord[] = [];
    const entities = Array.isArray(
      (payload as { entities?: unknown[] })?.entities
    )
      ? ((payload as { entities?: unknown[] }).entities as unknown[])
      : [];
    const entity =
      entities.length > 0
        ? (entities[0] as Record<string, unknown>)
        : (payload as { entity?: Record<string, unknown> })?.entity ?? null;

    if (entity && typeof entity === "object") {
      const licenses = Array.isArray(
        (entity as { licenses?: unknown[] }).licenses
      )
        ? ((entity as { licenses?: unknown[] }).licenses as Array<
            Record<string, unknown>
          >)
        : [];

      for (const license of licenses) {
        records.push({
          source: "cobalt_sos",
          licenseNumber:
            typeof license["licenseNumber"] === "string"
              ? (license["licenseNumber"] as string)
              : typeof license["license_number"] === "string"
              ? (license["license_number"] as string)
              : undefined,
          status:
            typeof license["status"] === "string"
              ? (license["status"] as string)
              : undefined,
          issuedDate:
            typeof license["issueDate"] === "string"
              ? (license["issueDate"] as string)
              : typeof license["issuedDate"] === "string"
              ? (license["issuedDate"] as string)
              : undefined,
          expirationDate:
            typeof license["expirationDate"] === "string"
              ? (license["expirationDate"] as string)
              : undefined,
          professionalType:
            typeof license["licenseType"] === "string"
              ? (license["licenseType"] as string)
              : typeof license["profession"] === "string"
              ? (license["profession"] as string)
              : undefined,
          issuingAuthority:
            typeof license["licensingBoard"] === "string"
              ? (license["licensingBoard"] as string)
              : undefined,
          raw: license,
        });
      }

      if (records.length === 0) {
        // fallback to entity level status if available
        records.push({
          source: "cobalt_sos",
          status:
            typeof entity["status"] === "string"
              ? (entity["status"] as string)
              : undefined,
          licenseNumber:
            typeof entity["registrationNumber"] === "string"
              ? (entity["registrationNumber"] as string)
              : undefined,
          issuingAuthority:
            typeof entity["state"] === "string"
              ? (entity["state"] as string)
              : undefined,
          raw: entity,
        });
      }
    }

    return {
      provider: "cobalt_sos",
      success: response.ok,
      responseCode: response.status,
      records,
      raw: payload,
      durationMs: Math.round(performance.now() - start),
      warnings:
        response.ok && records.length === 0
          ? ["Cobalt SOS returned no explicit license records"]
          : undefined,
      error: response.ok
        ? undefined
        : typeof (payload as { error?: string })?.error === "string"
        ? ((payload as { error?: string }).error as string)
        : "Cobalt SOS request failed",
    };
  }

  private async lookupNewYorkSocrata(
    request: BusinessLicenseRequest
  ): Promise<SourceResult> {
    const start = performance.now();
    const params = new URLSearchParams();
    params.set("entity_name", request.businessName.trim().toUpperCase());
    params.set("$limit", "5");

    if (request.licenseNumber)
      params.set("license_number", request.licenseNumber);
    if (request.includeInactive === false)
      params.set("entity_status", "ACTIVE");

    const url = `${NY_SOC_DATASET}?${params.toString()}`;

    const headers: HeadersInit = {
      Accept: "application/json",
    };

    if (this.socrataAppToken) {
      headers["X-App-Token"] = this.socrataAppToken;
    }

    const response = await fetch(url, { method: "GET", headers });

    let payload: unknown = null;
    try {
      payload = await response.json();
    } catch (_error) {
      payload = null;
    }

    const records: LicenseRecord[] = [];

    if (Array.isArray(payload)) {
      for (const item of payload as Array<Record<string, unknown>>) {
        records.push({
          source: "ny_socrata",
          licenseNumber:
            typeof item["license_number"] === "string"
              ? (item["license_number"] as string)
              : undefined,
          status:
            typeof item["entity_status"] === "string"
              ? (item["entity_status"] as string)
              : undefined,
          issuedDate:
            typeof item["initial_registration_date"] === "string"
              ? (item["initial_registration_date"] as string)
              : undefined,
          expirationDate:
            typeof item["license_expiration_date"] === "string"
              ? (item["license_expiration_date"] as string)
              : undefined,
          professionalType:
            typeof item["profession_name"] === "string"
              ? (item["profession_name"] as string)
              : undefined,
          issuingAuthority: "New York Department of State",
          raw: item,
        });
      }
    }

    return {
      provider: "ny_socrata",
      success: response.ok,
      responseCode: response.status,
      records,
      raw: Array.isArray(payload)
        ? { count: payload.length }
        : (payload as Record<string, unknown> | null),
      durationMs: Math.round(performance.now() - start),
      warnings:
        response.ok && records.length === 0
          ? ["New York Socrata dataset returned no matching licenses"]
          : undefined,
      error: response.ok ? undefined : "New York Socrata request failed",
    };
  }
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

  let payload: BusinessLicenseRequest;
  try {
    payload = (await req.json()) as BusinessLicenseRequest;
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

  if (!payload.businessName || typeof payload.businessName !== "string") {
    return new Response(
      JSON.stringify({
        success: false,
        error: "businessName is required",
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
    const service = await StateLicenseLookupService.create();
    const results = await service.lookup(payload);

    const consolidatedRecords = results.flatMap((result) => result.records);

    const responseBody: EdgeResponseBody = {
      success: consolidatedRecords.length > 0,
      requestId,
      businessName: payload.businessName,
      state: normalizeState(payload.state),
      licenseNumber: payload.licenseNumber,
      records: consolidatedRecords,
      sources: results,
      durationMs: Math.round(performance.now() - startedAt),
      errors: results
        .filter((result) => result.error)
        .map((result) => `${result.provider}: ${result.error}`)
        .concat(errors),
    };

    return new Response(JSON.stringify(responseBody), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "State licensing lookup failed";
    errors.push(message);

    return new Response(
      JSON.stringify({
        success: false,
        requestId,
        businessName: payload.businessName,
        state: normalizeState(payload.state),
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
