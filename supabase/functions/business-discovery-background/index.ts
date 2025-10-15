import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  createUsageLogger,
  UsageLogContext,
  UsageLogger,
} from "../_shared/api-usage.ts";
import type { AuthenticatedRequestContext } from "../_shared/edge-auth.ts";
import {
  authenticateRequest,
  corsHeaders,
  handleCORS,
} from "../_shared/edge-auth.ts";

// Background Task Business Discovery with Tiered Enrichment + Multi-Source Discovery
// ProspectPro v4.3 - October 2025
// - Google Places + Foursquare discovery with Census targeting
// - Tier-aware enrichment pipeline with Hunter.io + NeverBounce
// - Rich verification metadata persisted for UI + exports

// Type declarations for EdgeRuntime
declare const EdgeRuntime: {
  waitUntil(promise: Promise<unknown>): void;
};

type TierKey = "BASE" | "PROFESSIONAL" | "ENTERPRISE";

type DataSource =
  | "google_places"
  | "google_place_details"
  | "foursquare"
  | "cached_reuse";

interface TierSettings {
  key: TierKey;
  name: string;
  pricePerLead: number;
  orchestratorTier: "starter" | "professional" | "enterprise" | "compliance";
  maxCostPerLead: number;
  includes: {
    verifyEmails: boolean;
    personEnrichment: boolean;
    apolloEnrichment: boolean;
  };
}

const ENRICHMENT_TIERS: Record<TierKey, TierSettings> = {
  BASE: {
    key: "BASE",
    name: "Base",
    pricePerLead: 0.15,
    orchestratorTier: "starter",
    maxCostPerLead: 0.5,
    includes: {
      verifyEmails: false, // Generic company email only
      personEnrichment: false,
      apolloEnrichment: false,
    },
  },
  PROFESSIONAL: {
    key: "PROFESSIONAL",
    name: "Professional",
    pricePerLead: 0.45,
    orchestratorTier: "professional",
    maxCostPerLead: 1.5,
    includes: {
      verifyEmails: true, // Professional email discovery & verification
      personEnrichment: false,
      apolloEnrichment: false,
    },
  },
  ENTERPRISE: {
    key: "ENTERPRISE",
    name: "Enterprise",
    pricePerLead: 2.5,
    orchestratorTier: "enterprise",
    maxCostPerLead: 7.5,
    includes: {
      verifyEmails: true,
      personEnrichment: true, // Executive contact enrichment
      apolloEnrichment: true, // Full compliance verification
    },
  },
};

interface BusinessDiscoveryRequest {
  businessType: string;
  location: string;
  keywords?: string[] | string;
  searchRadius?: string;
  expandGeography?: boolean;
  maxResults?: number;
  budgetLimit?: number;
  minConfidenceScore?: number;
  sessionUserId?: string;
  tierKey?: TierKey;
  tierName?: string;
  tierPrice?: number;
  options?: {
    tradeAssociation?: boolean;
    professionalLicense?: boolean;
    chamberVerification?: boolean;
    apolloDiscovery?: boolean;
  };
  userEmail?: string;
}

interface RequestSnapshot {
  requestedAt: string;
  requestHash: string;
  payload: {
    businessType: string;
    location: string;
    keywords: string[];
    searchRadius?: string;
    expandGeography: boolean;
    maxResults: number;
    budgetLimit: number;
    minConfidenceScore: number;
    tierKey: TierKey;
    tierName: string;
    options: {
      tradeAssociation: boolean;
      professionalLicense: boolean;
      chamberVerification: boolean;
      apolloDiscovery: boolean;
    };
  };
}

interface JobConfig {
  campaignId: string;
  businessType: string;
  location: string;
  keywords: string[];
  searchRadius?: string;
  expandGeography: boolean;
  maxResults: number;
  budgetLimit: number;
  minConfidenceScore: number;
  userId?: string;
  sessionUserId?: string;
  jobId?: string;
  campaignHash: string;
  tier: TierSettings;
  options: {
    tradeAssociation: boolean;
    professionalLicense: boolean;
    chamberVerification: boolean;
    apolloDiscovery: boolean;
  };
  requestSnapshot: RequestSnapshot;
}

interface UserDeduplicationContext {
  userId: string | null;
  sessionUserId: string | null;
  campaignHash: string;
  isAuthenticated: boolean;
}

type DedupSupabaseClient = Pick<ReturnType<typeof createClient>, "from">;

interface DeduplicationStats {
  total: number;
  filtered: number;
  fresh: number;
}

interface BusinessData {
  name?: string;
  businessName?: string;
  formatted_address?: string;
  address?: string;
  formatted_phone_number?: string;
  phone?: string;
  website?: string;
  place_id?: string;
  rating?: number;
  user_ratings_total?: number;
  source?: DataSource;
  data_enriched?: boolean;
  foursquare_data?: Record<string, unknown>;
}

interface CachedLeadSnapshot {
  businessName?: string | null;
  address?: string | null;
  phone?: string | null;
  website?: string | null;
  email?: string | null;
  confidenceScore?: number | null;
  validationCost?: number | null;
  enrichmentData?: Record<string, unknown> | null;
  sourceCampaignId?: string | null;
  cachedAt?: string | null;
}

interface DiscoveredBusiness extends BusinessData {
  source: DataSource;
  cachedLead?: CachedLeadSnapshot;
}

interface FoursquarePlace {
  fsq_id: string;
  name: string;
  location?: {
    address?: string;
    locality?: string;
    admin_district?: string;
    region?: string;
    postcode?: string;
    country?: string;
  };
  contact?: {
    phone?: string;
  };
  website?: string;
  rating?: number;
  stats?: {
    total_tips?: number;
  };
}

interface ScoredLead {
  businessName: string;
  address: string;
  phone: string;
  website: string;
  email: string;
  optimizedScore: number;
  validationCost: number;
  dataSources: string[];
  enhancementData: {
    verificationSources: string[];
    emails?: Array<{
      email: string;
      confidence?: number;
      verified?: boolean;
      type?: string;
      firstName?: string;
      lastName?: string;
      position?: string;
    }>;
    processingMetadata: {
      totalCost: number;
      validationCost: number;
      enrichmentCost: number;
      totalConfidenceBoost: number;
      processingStrategy: string;
      servicesUsed: string[];
      servicesSkipped: string[];
      enrichmentTier: string;
      enrichmentCostBreakdown?: Record<string, number>;
      emailStatus?: "verified" | "unconfirmed" | "not_found";
      verifiedEmail?: string;
      unverifiedEmail?: string;
      reuseCampaignId?: string | null;
      reusedFromCacheAt?: string | null;
    };
  };
}

const STATE_NAME_VARIANTS: Record<string, string[]> = {
  AL: ["alabama"],
  AK: ["alaska"],
  AZ: ["arizona"],
  AR: ["arkansas"],
  CA: ["california"],
  CO: ["colorado"],
  CT: ["connecticut"],
  DE: ["delaware"],
  FL: ["florida"],
  GA: ["georgia"],
  HI: ["hawaii"],
  ID: ["idaho"],
  IL: ["illinois"],
  IN: ["indiana"],
  IA: ["iowa"],
  KS: ["kansas"],
  KY: ["kentucky"],
  LA: ["louisiana"],
  ME: ["maine"],
  MD: ["maryland"],
  MA: ["massachusetts"],
  MI: ["michigan"],
  MN: ["minnesota"],
  MS: ["mississippi"],
  MO: ["missouri"],
  MT: ["montana"],
  NE: ["nebraska"],
  NV: ["nevada"],
  NH: ["new hampshire"],
  NJ: ["new jersey"],
  NM: ["new mexico"],
  NY: ["new york"],
  NC: ["north carolina"],
  ND: ["north dakota"],
  OH: ["ohio"],
  OK: ["oklahoma"],
  OR: ["oregon"],
  PA: ["pennsylvania"],
  RI: ["rhode island"],
  SC: ["south carolina"],
  SD: ["south dakota"],
  TN: ["tennessee"],
  TX: ["texas"],
  UT: ["utah"],
  VT: ["vermont"],
  VA: ["virginia"],
  WA: ["washington"],
  WV: ["west virginia"],
  WI: ["wisconsin"],
  WY: ["wyoming"],
  DC: ["district of columbia", "washington dc", "dc"],
};

const US_STATE_CODES = new Set(Object.keys(STATE_NAME_VARIANTS));

const STATE_NAME_TO_CODE = Object.entries(STATE_NAME_VARIANTS).reduce(
  (acc, [code, names]) => {
    for (const name of names) {
      acc[name] = code;
    }
    return acc;
  },
  {} as Record<string, string>
);

const STATE_NAME_ENTRIES = Object.entries(STATE_NAME_TO_CODE).sort(
  (a, b) => b[0].length - a[0].length
);

function extractStateCodeFromText(value?: string | null): string | undefined {
  if (!value) return undefined;
  const upper = value.toUpperCase();
  const abbreviationMatch = upper.match(/\b([A-Z]{2})\b/);
  if (abbreviationMatch) {
    const candidate = abbreviationMatch[1];
    if (US_STATE_CODES.has(candidate)) {
      return candidate;
    }
  }

  const normalized = value.toLowerCase();
  for (const [name, code] of STATE_NAME_ENTRIES) {
    if (normalized.includes(name)) {
      return code;
    }
  }

  return undefined;
}

function resolveStateForLead(
  lead: ScoredLead,
  config: JobConfig
): string | undefined {
  const candidates = [lead.address, config.location];
  for (const candidate of candidates) {
    const state = extractStateCodeFromText(candidate ?? undefined);
    if (state) {
      return state;
    }
  }
  return undefined;
}

interface CensusIntelligence {
  total_establishments: number;
  density_score: number;
  optimization: {
    search_radius: number;
    expected_results: number;
    api_efficiency_score: number;
    confidence_multiplier: number;
  };
  geographic_data: {
    state: string;
    county: string | null;
    raw_location: string;
    fallback?: boolean;
  };
}

const DEFAULT_OPTIONS = {
  tradeAssociation: false,
  professionalLicense: false,
  chamberVerification: false,
  apolloDiscovery: false,
};

const GOOGLE_TEXT_SEARCH_COST = 0.032;
const GOOGLE_DETAILS_COST = 0.017;
const FOURSQUARE_SEARCH_COST = 0;

function parseKeywords(input?: string[] | string): string[] {
  if (!input) return [];
  if (Array.isArray(input)) {
    return input.map((value) => value.trim()).filter(Boolean);
  }
  return input
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

async function createStableHash(payload: unknown): Promise<string> {
  try {
    if (!payload) {
      return `${Date.now().toString(36)}${Math.random()
        .toString(36)
        .slice(2, 11)}`;
    }

    if (typeof crypto === "undefined" || !crypto?.subtle) {
      return `${Date.now().toString(36)}${Math.random()
        .toString(36)
        .slice(2, 11)}`;
    }

    const encoder = new TextEncoder();
    const encoded = encoder.encode(JSON.stringify(payload));
    const buffer = await crypto.subtle.digest("SHA-256", encoded);
    return Array.from(new Uint8Array(buffer))
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
  } catch (error) {
    console.warn("Hash generation failed", error);
    return `${Date.now().toString(36)}${Math.random()
      .toString(36)
      .slice(2, 11)}`;
  }
}

function getTierSettings(
  tierKey?: TierKey,
  fallbackName?: string
): TierSettings {
  if (tierKey && ENRICHMENT_TIERS[tierKey]) {
    return ENRICHMENT_TIERS[tierKey];
  }

  if (fallbackName) {
    const match = (Object.values(ENRICHMENT_TIERS) as TierSettings[]).find(
      (tier) => tier.name.toLowerCase() === fallbackName.toLowerCase()
    );
    if (match) return match;
  }

  return ENRICHMENT_TIERS.BASE; // Changed from PROFESSIONAL to BASE as default
}

// --------------------
// Census Intelligence
// --------------------

class CensusAPIClient {
  private apiKey: string;
  private baseURL: string;
  private cache = new Map<string, { data: unknown; timestamp: number }>();
  private cacheTTL = 24 * 60 * 60 * 1000;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.baseURL = "https://api.census.gov/data";
  }

  async getBusinessDensity(
    businessType: string,
    location: string
  ): Promise<CensusIntelligence> {
    const naicsCode = this.mapBusinessTypeToNAICS(businessType);
    const geoData = this.parseLocation(location);

    const censusData = await this.fetchCountyBusinessPatterns({
      naics: naicsCode,
      state: geoData.state,
      county: geoData.county,
    });

    return this.calculateDensityMetrics(censusData, geoData, location);
  }

  private async fetchCountyBusinessPatterns({
    naics,
    state,
    county,
  }: {
    naics: string;
    state: string;
    county: string | null;
  }) {
    const cacheKey = `cbp_${naics}_${state}_${county ?? "all"}`;
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.data as unknown[];
    }

    const url = `${this.baseURL}/2021/cbp?get=ESTAB,EMP,NAICS2017_LABEL&for=state:${state}&NAICS2017=${naics}&key=${this.apiKey}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Census API error: ${response.status}`);
    }

    const data = (await response.json()) as unknown[];
    this.cache.set(cacheKey, { data, timestamp: Date.now() });
    return data;
  }

  private calculateDensityMetrics(
    censusData: unknown[],
    geoData: {
      state: string;
      county: string | null;
      raw_location: string;
      fallback?: boolean;
    },
    rawLocation: string
  ): CensusIntelligence {
    if (!Array.isArray(censusData) || censusData.length < 2) {
      return this.getDefaultOptimization(
        rawLocation,
        geoData.state,
        geoData.county
      );
    }

    const businessData = censusData.slice(1) as [
      string,
      string,
      string,
      string
    ][];
    let totalEstablishments = 0;
    let totalEmployment = 0;

    for (const row of businessData) {
      const [estab, emp] = row;
      totalEstablishments += parseInt(estab) || 0;
      totalEmployment += parseInt(emp) || 0;
    }

    const densityScore = Math.min(totalEstablishments / 750, 100);
    const confidenceMultiplier =
      totalEstablishments > 750 ? 1.3 : totalEstablishments > 250 ? 1.15 : 1;
    const expectedResults = Math.max(Math.round(totalEstablishments * 0.04), 5);

    return {
      total_establishments: totalEstablishments,
      density_score: densityScore,
      optimization: {
        search_radius: this.calculateOptimalRadius(densityScore),
        expected_results: Math.min(expectedResults, 40),
        api_efficiency_score: Math.round(densityScore),
        confidence_multiplier: confidenceMultiplier,
      },
      geographic_data: geoData,
    };
  }

  private getDefaultOptimization(
    rawLocation: string,
    state: string,
    county: string | null
  ): CensusIntelligence {
    return {
      total_establishments: 250,
      density_score: 25,
      optimization: {
        search_radius: 25,
        expected_results: 12,
        api_efficiency_score: 45,
        confidence_multiplier: 1,
      },
      geographic_data: {
        state,
        county,
        raw_location: rawLocation,
        fallback: true,
      },
    };
  }

  private mapBusinessTypeToNAICS(businessType: string): string {
    const naicsMapping: Record<string, string> = {
      accounting: "5412",
      cpa: "5412",
      legal: "5411",
      electrician: "238210",
      contractor: "23",
      restaurant: "7225",
      cafe: "722515",
      medical: "621",
      dental: "6212",
      retail: "44",
      spa: "8121",
      salon: "8121",
      consulting: "5416",
      marketing: "5418",
      real: "531",
      hvac: "238220",
    };

    const lower = businessType.toLowerCase();
    for (const [key, code] of Object.entries(naicsMapping)) {
      if (lower.includes(key)) return code;
    }
    return "00";
  }

  private parseLocation(location: string) {
    const stateMatch = location.match(/\b([A-Z]{2})\b/);
    const stateCode = stateMatch ? this.getStateFIPSCode(stateMatch[1]) : "06";
    return {
      state: stateCode,
      county: null,
      raw_location: location,
    };
  }

  private getStateFIPSCode(stateAbbr: string): string {
    const stateCodes: Record<string, string> = {
      AL: "01",
      AK: "02",
      AZ: "04",
      AR: "05",
      CA: "06",
      CO: "08",
      CT: "09",
      DE: "10",
      FL: "12",
      GA: "13",
      HI: "15",
      ID: "16",
      IL: "17",
      IN: "18",
      IA: "19",
      KS: "20",
      KY: "21",
      LA: "22",
      ME: "23",
      MD: "24",
      MA: "25",
      MI: "26",
      MN: "27",
      MS: "28",
      MO: "29",
      MT: "30",
      NE: "31",
      NV: "32",
      NH: "33",
      NJ: "34",
      NM: "35",
      NY: "36",
      NC: "37",
      ND: "38",
      OH: "39",
      OK: "40",
      OR: "41",
      PA: "42",
      RI: "44",
      SC: "45",
      SD: "46",
      TN: "47",
      TX: "48",
      UT: "49",
      VT: "50",
      VA: "51",
      WA: "53",
      WV: "54",
      WI: "55",
      WY: "56",
    };
    return stateCodes[stateAbbr.toUpperCase()] || "06";
  }

  private calculateOptimalRadius(densityScore: number): number {
    if (densityScore > 60) return 5;
    if (densityScore > 30) return 10;
    if (densityScore > 10) return 20;
    return 35;
  }
}

async function fetchCensusIntelligence(
  businessType: string,
  location: string
): Promise<CensusIntelligence | null> {
  const censusKey = Deno.env.get("CENSUS_API_KEY");
  if (!censusKey) return null;

  try {
    const client = new CensusAPIClient(censusKey);
    return await client.getBusinessDensity(businessType, location);
  } catch (error) {
    console.warn("Census intelligence unavailable:", error);
    return null;
  }
}

// --------------------
// Discovery Providers
// --------------------

async function searchGooglePlaces(
  businessType: string,
  location: string,
  keywords: string[],
  maxResults: number,
  usageLogger?: UsageLogger,
  usageContext?: UsageLogContext
): Promise<DiscoveredBusiness[]> {
  const apiKey = Deno.env.get("GOOGLE_PLACES_API_KEY");
  if (!apiKey) throw new Error("Google Places API key not configured");

  const keywordSuffix = keywords.length > 0 ? ` ${keywords.join(" ")}` : "";
  const query = `${businessType}${keywordSuffix} in ${location}`;
  const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(
    query
  )}&key=${apiKey}`;

  const requestParams = {
    query,
    businessType,
    location,
    keywordCount: keywords.length,
    maxResults,
  };

  let textResponse: Response | null = null;
  let data: Record<string, unknown> = {};
  const searchStarted = performance.now();

  try {
    textResponse = await fetch(searchUrl);
    data = await textResponse.json();
  } catch (error) {
    await usageLogger?.log({
      sourceName: "google_places",
      endpoint: "textsearch",
      httpMethod: "GET",
      requestParams,
      queryType: "discovery",
      responseCode: textResponse?.status ?? null,
      responseTimeMs: Math.round(performance.now() - searchStarted),
      success: false,
      errorMessage: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }

  const searchElapsed = Math.round(performance.now() - searchStarted);

  if (data.status !== "OK") {
    await usageLogger?.log({
      sourceName: "google_places",
      endpoint: "textsearch",
      httpMethod: "GET",
      requestParams,
      queryType: "discovery",
      responseCode: textResponse.status,
      responseTimeMs: searchElapsed,
      success: false,
      errorMessage:
        (data.error_message as string | undefined) || (data.status as string),
      estimatedCost: GOOGLE_TEXT_SEARCH_COST,
      actualCost: 0,
    });
    throw new Error(`Google Places API failed: ${data.status}`);
  }

  const results = (data.results as BusinessData[]).slice(0, maxResults * 2);

  await usageLogger?.log({
    sourceName: "google_places",
    endpoint: "textsearch",
    httpMethod: "GET",
    requestParams,
    queryType: "discovery",
    responseCode: textResponse.status,
    responseTimeMs: searchElapsed,
    resultsReturned: results.length,
    usefulResults: results.length,
    success: true,
    estimatedCost: GOOGLE_TEXT_SEARCH_COST,
    actualCost: GOOGLE_TEXT_SEARCH_COST,
    ...usageContext,
  });

  const enriched: DiscoveredBusiness[] = [];

  for (const business of results) {
    if (!business.place_id) {
      enriched.push({ ...business, source: "google_places" });
      continue;
    }

    const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${business.place_id}&fields=formatted_phone_number,website&key=${apiKey}`;
    const detailStart = performance.now();

    let detailsResponse: Response | null = null;
    let detailsData: {
      result?: {
        formatted_phone_number?: string;
        website?: string;
      };
      [key: string]: unknown;
    } = {};

    try {
      detailsResponse = await fetch(detailsUrl);
      detailsData = await detailsResponse.json();
    } catch (error) {
      await usageLogger?.log({
        sourceName: "google_places",
        endpoint: "details",
        httpMethod: "GET",
        requestParams: {
          placeId: business.place_id,
        },
        queryType: "discovery",
        responseCode: detailsResponse?.status ?? null,
        responseTimeMs: Math.round(performance.now() - detailStart),
        success: false,
        errorMessage: error instanceof Error ? error.message : String(error),
        estimatedCost: GOOGLE_DETAILS_COST,
        actualCost: 0,
      });
      throw error;
    }

    const detailElapsed = Math.round(performance.now() - detailStart);

    const dataEnriched = Boolean(detailsData.result);

    enriched.push({
      ...business,
      formatted_phone_number:
        detailsData.result?.formatted_phone_number ??
        business.formatted_phone_number ??
        "",
      website: detailsData.result?.website ?? business.website ?? "",
      source: dataEnriched ? "google_place_details" : "google_places",
      data_enriched: dataEnriched,
    });

    await usageLogger?.log({
      sourceName: "google_places",
      endpoint: "details",
      httpMethod: "GET",
      requestParams: {
        placeId: business.place_id,
        hasWebsite: Boolean(detailsData.result?.website),
      },
      queryType: "discovery",
      responseCode: detailsResponse.status,
      responseTimeMs: detailElapsed,
      resultsReturned: dataEnriched ? 1 : 0,
      usefulResults: dataEnriched ? 1 : 0,
      success: detailsResponse.ok && dataEnriched,
      estimatedCost: GOOGLE_DETAILS_COST,
      actualCost: detailsResponse.ok && dataEnriched ? GOOGLE_DETAILS_COST : 0,
    });

    // Basic rate limiting to stay under quota
    await new Promise((resolve) => setTimeout(resolve, 80));
  }

  return enriched;
}

async function searchFoursquare(
  businessType: string,
  location: string,
  keywords: string[],
  maxResults: number,
  usageLogger?: UsageLogger,
  usageContext?: UsageLogContext
): Promise<DiscoveredBusiness[]> {
  const apiKey = Deno.env.get("FOURSQUARE_API_KEY");
  if (!apiKey) {
    return [];
  }

  const queryString =
    [businessType, ...keywords].join(" ").trim() || businessType;
  const limit = Math.min(Math.max(maxResults, 5), 30);
  const params = new URLSearchParams({
    query: queryString,
    near: location,
    limit: limit.toString(),
    fields: "fsq_id,name,location,contact,website,categories,rating,stats",
  });

  const requestParams = {
    query: queryString,
    location,
    limit,
    keywordCount: keywords.length,
  };

  let response: Response | null = null;
  const startedAt = performance.now();

  try {
    response = await fetch(
      `https://api.foursquare.com/v3/places/search?${params}`,
      {
        headers: {
          Authorization: apiKey,
          Accept: "application/json",
        },
      }
    );
  } catch (error) {
    await usageLogger?.log({
      sourceName: "foursquare",
      endpoint: "places.search",
      httpMethod: "GET",
      requestParams,
      queryType: "discovery",
      responseCode: response?.status ?? null,
      responseTimeMs: Math.round(performance.now() - startedAt),
      success: false,
      errorMessage: error instanceof Error ? error.message : String(error),
      estimatedCost: FOURSQUARE_SEARCH_COST,
      actualCost: 0,
    });
    throw error;
  }

  const elapsed = Math.round(performance.now() - startedAt);

  if (!response.ok) {
    await usageLogger?.log({
      sourceName: "foursquare",
      endpoint: "places.search",
      httpMethod: "GET",
      requestParams,
      queryType: "discovery",
      responseCode: response.status,
      responseTimeMs: elapsed,
      success: false,
      errorMessage: `HTTP ${response.status}`,
      estimatedCost: FOURSQUARE_SEARCH_COST,
      actualCost: 0,
    });
    throw new Error(`Foursquare API error: ${response.status}`);
  }

  let payload: { results?: FoursquarePlace[] } = {};
  try {
    payload = await response.json();
  } catch (error) {
    await usageLogger?.log({
      sourceName: "foursquare",
      endpoint: "places.search",
      httpMethod: "GET",
      requestParams,
      queryType: "discovery",
      responseCode: response.status,
      responseTimeMs: elapsed,
      success: false,
      errorMessage: error instanceof Error ? error.message : String(error),
      estimatedCost: FOURSQUARE_SEARCH_COST,
      actualCost: 0,
    });
    throw error;
  }

  const results = Array.isArray(payload.results) ? payload.results : [];

  await usageLogger?.log({
    sourceName: "foursquare",
    endpoint: "places.search",
    httpMethod: "GET",
    requestParams,
    queryType: "discovery",
    responseCode: response.status,
    responseTimeMs: elapsed,
    resultsReturned: results.length,
    usefulResults: results.length,
    success: true,
    estimatedCost: FOURSQUARE_SEARCH_COST,
    actualCost: FOURSQUARE_SEARCH_COST,
    ...usageContext,
  });

  return results.map((place) => ({
    source: "foursquare" as DataSource,
    place_id: place.fsq_id,
    name: place.name,
    formatted_address: formatFoursquareAddress(place.location),
    formatted_phone_number: place.contact?.phone ?? "",
    website: place.website ?? "",
    rating: place.rating ?? 0,
    user_ratings_total: place.stats?.total_tips ?? 0,
    foursquare_data: place as unknown as Record<string, unknown>,
  }));
}

function formatFoursquareAddress(
  location: {
    address?: string;
    locality?: string;
    admin_district?: string;
    postcode?: string;
    country?: string;
  } = {}
): string {
  const parts = [
    location.address,
    location.locality,
    location.admin_district,
    location.postcode,
    location.country,
  ]
    .map((value) => value?.trim())
    .filter(Boolean);
  return parts.join(", ");
}

type BusinessFingerprintSource = {
  name?: string | null;
  businessName?: string | null;
  business_name?: string | null;
  formatted_address?: string | null;
  address?: string | null;
  formatted_phone_number?: string | null;
  phone?: string | null;
  website?: string | null;
  place_id?: string | null;
  source?: DataSource;
};

function normalizeString(value?: string | null): string {
  return value ? value.toLowerCase().replace(/\s+/g, " ").trim() : "";
}

function normalizePhone(value?: string | null): string {
  return value ? value.replace(/\D+/g, "") : "";
}

function normalizeWebsite(value?: string | null): string {
  if (!value) return "";
  const normalized = value.toLowerCase().trim();
  const withoutProtocol = normalized.replace(/^https?:\/\//, "");
  const withoutWww = withoutProtocol.replace(/^www\./, "");
  return withoutWww.split("/")[0];
}

function createBusinessFingerprint(source: BusinessFingerprintSource): string {
  const name = normalizeString(
    source.business_name ?? source.businessName ?? source.name ?? ""
  );
  const address = normalizeString(
    source.address ?? source.formatted_address ?? ""
  );
  const phone = normalizePhone(
    source.phone ?? source.formatted_phone_number ?? ""
  );
  const website = normalizeWebsite(source.website ?? "");

  if (name && address) {
    return `${name}::${address}`;
  }

  if (name && phone) {
    return `${name}::${phone}`;
  }

  if (website) {
    return `domain::${website}`;
  }

  if (phone) {
    return `phone::${phone}`;
  }

  if (name) {
    return `name::${name}`;
  }

  return "";
}

const FINGERPRINT_HEALTH_SAMPLE_LIMIT = 3;

const makeFingerprintKey = (
  fingerprint: string,
  userId: string | null,
  sessionUserId: string | null
) => `${fingerprint}::${userId ?? ""}::${sessionUserId ?? ""}`;

function normalizeIdentifierValue(raw: string): string {
  if (!raw) return "";
  try {
    if (typeof globalThis.btoa === "function") {
      const bytes = new TextEncoder().encode(raw);
      let binary = "";
      const chunkSize = 0x8000; // Avoid call stack overflow on large strings
      for (let index = 0; index < bytes.length; index += chunkSize) {
        const slice = bytes.subarray(index, index + chunkSize);
        binary += String.fromCharCode(...slice);
      }
      return globalThis.btoa(binary).replace(/[^A-Za-z0-9]/g, "");
    }
  } catch (error) {
    console.warn("Identifier encoding failed", error);
  }
  return raw.replace(/\s+/g, "_").slice(0, 128);
}

function createDedupIdentifierFromSource(
  source: BusinessFingerprintSource
): string {
  const fingerprint = createBusinessFingerprint(source);
  if (fingerprint) {
    return normalizeIdentifierValue(fingerprint);
  }

  const fallback = `${normalizeString(
    source.business_name ?? source.businessName ?? source.name ?? ""
  )}|${normalizeString(
    source.address ?? source.formatted_address ?? ""
  )}|${normalizePhone(
    source.phone ?? source.formatted_phone_number ?? ""
  )}|${normalizeWebsite(source.website ?? "")}`;

  if (!fallback.trim()) {
    return "";
  }

  return normalizeIdentifierValue(fallback);
}

async function filterAlreadyServedBusinesses(
  supabase: DedupSupabaseClient,
  businesses: DiscoveredBusiness[],
  context: UserDeduplicationContext
): Promise<{ filtered: DiscoveredBusiness[]; stats: DeduplicationStats }> {
  const baselineStats: DeduplicationStats = {
    total: businesses.length,
    filtered: 0,
    fresh: businesses.length,
  };

  if (!businesses.length) {
    return { filtered: businesses, stats: baselineStats };
  }

  if (!context.campaignHash || (!context.userId && !context.sessionUserId)) {
    return { filtered: businesses, stats: baselineStats };
  }

  const identifiers = businesses.map((business) =>
    createDedupIdentifierFromSource({
      businessName: business.businessName ?? business.name ?? "",
      address: business.address ?? business.formatted_address ?? "",
      phone: business.phone ?? business.formatted_phone_number ?? "",
      website: business.website ?? "",
      source: business.source,
    })
  );

  const lookupIdentifiers = identifiers.filter((value) => Boolean(value));
  if (!lookupIdentifiers.length) {
    return { filtered: businesses, stats: baselineStats };
  }

  let query = supabase
    .from("user_campaign_results")
    .select("business_identifier")
    .eq("campaign_hash", context.campaignHash)
    .in("business_identifier", lookupIdentifiers);

  if (context.userId) {
    query = query.eq("user_id", context.userId);
  } else if (context.sessionUserId) {
    query = query.eq("session_user_id", context.sessionUserId);
  } else {
    return { filtered: businesses, stats: baselineStats };
  }

  const { data, error } = await query;

  if (error) {
    console.warn("User deduplication lookup failed", error.message);
    return { filtered: businesses, stats: baselineStats };
  }

  const servedIdentifiers = new Set(
    (data ?? []).map((row: { business_identifier: string }) => {
      return row.business_identifier;
    })
  );

  if (!servedIdentifiers.size) {
    return { filtered: businesses, stats: baselineStats };
  }

  const freshBusinesses = businesses.filter((_business, index) => {
    const identifier = identifiers[index];
    if (!identifier) return true;
    return !servedIdentifiers.has(identifier);
  });

  const stats: DeduplicationStats = {
    total: businesses.length,
    filtered: businesses.length - freshBusinesses.length,
    fresh: freshBusinesses.length,
  };

  console.log(
    "🔄 User deduplication",
    JSON.stringify({
      userId: context.userId,
      sessionUserId: context.sessionUserId,
      campaignHash: context.campaignHash,
      stats,
    })
  );

  return { filtered: freshBusinesses, stats };
}

type UserCampaignResultInsert = {
  campaign_hash: string;
  business_identifier: string;
  campaign_id: string;
  business_name: string;
  business_address: string;
  user_id?: string;
  session_user_id?: string;
};

async function recordServedBusinesses(
  supabase: DedupSupabaseClient,
  leads: ScoredLead[],
  context: UserDeduplicationContext,
  campaignId: string
): Promise<number> {
  if (!leads.length) {
    return 0;
  }

  if (!context.campaignHash || (!context.userId && !context.sessionUserId)) {
    return 0;
  }

  const records: UserCampaignResultInsert[] = [];
  for (const lead of leads) {
    const identifier = createDedupIdentifierFromSource({
      businessName: lead.businessName,
      address: lead.address,
      phone: lead.phone,
      website: lead.website,
    });

    if (!identifier) {
      continue;
    }

    const record: UserCampaignResultInsert = {
      campaign_hash: context.campaignHash,
      business_identifier: identifier,
      campaign_id: campaignId,
      business_name: lead.businessName,
      business_address: lead.address,
    };

    if (context.userId) {
      record.user_id = context.userId;
    } else if (context.sessionUserId) {
      record.session_user_id = context.sessionUserId;
    }

    records.push(record);
  }

  if (!records.length) {
    return 0;
  }

  const { error } = await (
    supabase as unknown as {
      from: (table: string) => {
        insert: (
          values: UserCampaignResultInsert[],
          options?: { ignoreDuplicates?: boolean }
        ) => Promise<{ error: { message: string } | null }>;
      };
    }
  )
    .from("user_campaign_results")
    .insert(records, { ignoreDuplicates: true });

  if (error) {
    console.warn("Failed to record deduplicated businesses", error.message);
    return 0;
  }

  return records.length;
}

type FingerprintClient = Pick<ReturnType<typeof createClient>, "from">;

async function leadFingerprintExists(
  client: FingerprintClient,
  {
    fingerprint,
    userId,
    sessionUserId,
  }: {
    fingerprint: string;
    userId: string | null;
    sessionUserId: string | null;
  }
): Promise<boolean> {
  if (!fingerprint) {
    return false;
  }

  if (userId) {
    const { count, error } = await client
      .from("lead_fingerprints")
      .select("id", { count: "exact", head: true })
      .eq("fingerprint", fingerprint)
      .eq("user_id", userId);

    if (error) {
      console.warn("leadFingerprintExists user check failed:", error.message);
    } else if ((count ?? 0) > 0) {
      return true;
    }
  }

  if (sessionUserId) {
    const { count, error } = await client
      .from("lead_fingerprints")
      .select("id", { count: "exact", head: true })
      .eq("fingerprint", fingerprint)
      .eq("session_user_id", sessionUserId);

    if (error) {
      console.warn(
        "leadFingerprintExists session check failed:",
        error.message
      );
    } else if ((count ?? 0) > 0) {
      return true;
    }
  }

  return false;
}

function dedupeBusinesses(
  businesses: DiscoveredBusiness[]
): DiscoveredBusiness[] {
  const map = new Map<string, DiscoveredBusiness>();
  let fallbackIndex = 0;

  for (const business of businesses) {
    const fingerprint = createBusinessFingerprint(business);
    const key = fingerprint
      ? fingerprint
      : business.place_id
      ? `place::${business.place_id}`
      : `fallback::${fallbackIndex++}`;

    if (!map.has(key)) {
      map.set(key, business);
      continue;
    }

    const existing = map.get(key)!;
    const existingHasWebsite = Boolean(existing.website);
    const candidateHasWebsite = Boolean(business.website);
    const existingHasPhone = Boolean(
      existing.formatted_phone_number || existing.phone
    );
    const candidateHasPhone = Boolean(
      business.formatted_phone_number || business.phone
    );

    const candidateIsDetailsUpgrade =
      existing.source === "google_places" &&
      business.source === "google_place_details";

    const candidateHasMoreData =
      candidateHasWebsite && !existingHasWebsite
        ? true
        : candidateHasPhone && !existingHasPhone
        ? true
        : false;

    if (candidateIsDetailsUpgrade || candidateHasMoreData) {
      map.set(key, business);
    }
  }
  return Array.from(map.values());
}

// --------------------
// Quality Scorer
// --------------------

class QualityScorer {
  private maxCostPerBusiness: number;
  private tierName: string;
  private censusMultiplier: number;

  constructor(options: {
    maxCostPerBusiness: number;
    tierName: string;
    censusMultiplier?: number;
  }) {
    this.maxCostPerBusiness = options.maxCostPerBusiness;
    this.tierName = options.tierName;
    this.censusMultiplier = options.censusMultiplier ?? 1;
  }

  scoreBusiness(business: DiscoveredBusiness): ScoredLead {
    const businessName = business.name || business.businessName || "";
    const address = business.formatted_address || business.address || "";
    const phone = business.formatted_phone_number || business.phone || "";
    const website = business.website || "";

    let totalScore = 0;

    if (businessName) {
      totalScore += 20;
    }

    if (address) {
      totalScore += 35;
    } else {
      totalScore -= 10;
    }

    if (phone) {
      totalScore += 15;
    }

    if (website) {
      totalScore += 15;
    }

    if (!phone && !website) {
      totalScore -= 5;
    }

    if (business.rating) {
      totalScore += Math.min(15, business.rating * 3);
    }

    if (business.user_ratings_total && business.user_ratings_total > 25) {
      totalScore += 5;
    }

    if (business.data_enriched) {
      totalScore += 5;
    }

    if (business.source === "foursquare") {
      totalScore += 6;
    } else if (business.source === "google_place_details") {
      totalScore += 4;
    }

    totalScore = Math.max(0, totalScore);
    totalScore = Math.min(100, Math.round(totalScore * this.censusMultiplier));

    if (business.source === "cached_reuse" && business.cachedLead) {
      const cached = business.cachedLead;
      const enrichment = (cached.enrichmentData ?? {}) as Record<
        string,
        unknown
      >;
      const cachedVerification = Array.isArray(enrichment.verificationSources)
        ? (enrichment.verificationSources as unknown[]).map((value) =>
            String(value)
          )
        : [];
      const cachedDataSources = Array.isArray(enrichment.dataSources)
        ? (enrichment.dataSources as unknown[]).map((value) => String(value))
        : [];
      const cachedEmails = Array.isArray(enrichment.emails)
        ? (enrichment.emails as ScoredLead["enhancementData"]["emails"])
        : undefined;
      const cachedProcessing = (enrichment.processingMetadata ?? {}) as Record<
        string,
        unknown
      >;

      const combinedSources = new Set<string>([
        "cached_reuse",
        ...cachedVerification,
        ...cachedDataSources,
      ]);

      const servicesUsed = Array.from(
        new Set<string>([
          "cached_reuse",
          ...cachedVerification,
          ...cachedDataSources,
          ...(Array.isArray(cachedProcessing.servicesUsed)
            ? (cachedProcessing.servicesUsed as unknown[]).map((value) =>
                String(value)
              )
            : []),
        ])
      );

      const validationCost =
        typeof cached.validationCost === "number"
          ? cached.validationCost
          : typeof cachedProcessing?.validationCost === "number"
          ? (cachedProcessing.validationCost as number)
          : 0.02;

      const finalProcessingMetadata: ScoredLead["enhancementData"]["processingMetadata"] & {
        reuseCampaignId?: string | null;
        reusedFromCacheAt?: string | null;
      } = {
        totalCost:
          typeof cachedProcessing.totalCost === "number"
            ? (cachedProcessing.totalCost as number)
            : validationCost,
        validationCost,
        enrichmentCost:
          typeof cachedProcessing.enrichmentCost === "number"
            ? (cachedProcessing.enrichmentCost as number)
            : 0,
        totalConfidenceBoost:
          typeof cachedProcessing.totalConfidenceBoost === "number"
            ? (cachedProcessing.totalConfidenceBoost as number)
            : 0,
        processingStrategy: "cached_reuse",
        servicesUsed,
        servicesSkipped: Array.isArray(cachedProcessing.servicesSkipped)
          ? (cachedProcessing.servicesSkipped as unknown[]).map((value) =>
              String(value)
            )
          : [],
        enrichmentTier:
          typeof cachedProcessing.enrichmentTier === "string"
            ? (cachedProcessing.enrichmentTier as string)
            : this.tierName,
        enrichmentCostBreakdown: (cachedProcessing.enrichmentCostBreakdown ??
          undefined) as Record<string, number> | undefined,
        emailStatus:
          typeof cachedProcessing.emailStatus === "string" &&
          ["verified", "unconfirmed", "not_found"].includes(
            cachedProcessing.emailStatus as string
          )
            ? (cachedProcessing.emailStatus as
                | "verified"
                | "unconfirmed"
                | "not_found")
            : "verified",
        verifiedEmail:
          typeof cachedProcessing.verifiedEmail === "string"
            ? (cachedProcessing.verifiedEmail as string)
            : undefined,
        unverifiedEmail:
          typeof cachedProcessing.unverifiedEmail === "string"
            ? (cachedProcessing.unverifiedEmail as string)
            : undefined,
        reuseCampaignId: cached.sourceCampaignId ?? null,
        reusedFromCacheAt: cached.cachedAt ?? null,
      };

      return {
        businessName: cached.businessName || businessName,
        address: cached.address || address,
        phone: cached.phone || phone,
        website: cached.website || website,
        email: cached.email || "",
        optimizedScore:
          typeof cached.confidenceScore === "number"
            ? cached.confidenceScore
            : totalScore,
        validationCost,
        dataSources: Array.from(combinedSources),
        enhancementData: {
          verificationSources: Array.from(combinedSources),
          emails: cachedEmails,
          processingMetadata: finalProcessingMetadata,
        },
      };
    }

    const initialSources = new Set<string>();
    initialSources.add(business.source);
    if (business.data_enriched) {
      initialSources.add("google_places_details_api");
    }

    return {
      businessName,
      address,
      phone,
      website,
      email: "",
      optimizedScore: totalScore,
      validationCost: 0.02,
      dataSources: Array.from(initialSources),
      enhancementData: {
        verificationSources: Array.from(initialSources),
        processingMetadata: {
          totalCost: 0.02,
          validationCost: 0.02,
          enrichmentCost: 0,
          totalConfidenceBoost: 0,
          processingStrategy: "basic",
          servicesUsed: Array.from(initialSources),
          servicesSkipped: [],
          enrichmentTier: this.tierName,
          emailStatus: "not_found",
        },
      },
    };
  }
}

// --------------------
// Enrichment Pipeline
// --------------------

async function enrichLead(
  lead: ScoredLead,
  config: JobConfig
): Promise<{ lead: ScoredLead; cost: number; enrichmentCost: number }> {
  if (
    lead.enhancementData?.processingMetadata?.processingStrategy ===
    "cached_reuse"
  ) {
    return { lead, cost: lead.validationCost, enrichmentCost: 0 };
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) {
    return { lead, cost: lead.validationCost, enrichmentCost: 0 };
  }

  const url = `${supabaseUrl}/functions/v1/enrichment-orchestrator`;
  const domain = lead.website
    ? lead.website.replace(/^https?:\/\//, "").replace(/\/.*$/, "")
    : undefined;

  const maxCostPerBusiness = Math.max(
    config.tier.maxCostPerLead,
    config.budgetLimit / Math.max(config.maxResults, 1)
  );

  const stateCode = resolveStateForLead(lead, config);

  const body = {
    businessName: lead.businessName,
    domain,
    address: lead.address,
    phone: lead.phone,
    website: lead.website,
    state: stateCode,
    discoverEmails: true,
    verifyEmails: config.tier.includes.verifyEmails,
    includePersonEnrichment: config.tier.includes.personEnrichment,
    apolloEnrichment:
      config.tier.includes.apolloEnrichment || config.options.apolloDiscovery,
    includeBusinessLicense: true,
    includeCompanyEnrichment: true,
    maxCostPerBusiness,
    minConfidenceScore: config.minConfidenceScore,
    tier: config.tier.orchestratorTier,
    campaignId: config.campaignId,
    jobId: config.jobId,
    sessionUserId: config.sessionUserId,
    userId: config.userId,
    tierKey: config.tier.key,
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    console.warn("Enrichment orchestrator returned non-OK response", {
      status: response.status,
      statusText: response.statusText,
    });
    return { lead, cost: lead.validationCost, enrichmentCost: 0 };
  }

  type EnrichedEmail = {
    email: string;
    verified?: boolean;
    [key: string]: unknown;
  };

  type EnrichmentPayload = {
    totalCost?: number;
    costBreakdown?: Record<string, unknown>;
    enrichedData?: {
      emails?: EnrichedEmail[];
    };
    processingMetadata?: {
      servicesUsed?: string[];
      servicesSkipped?: string[];
    };
  };

  let enrichmentPayload: EnrichmentPayload | null = null;
  try {
    const rawBody = await response.text();
    if (!rawBody || !rawBody.trim()) {
      console.warn("Enrichment orchestrator returned empty body", {
        status: response.status,
      });
      return { lead, cost: lead.validationCost, enrichmentCost: 0 };
    }
    enrichmentPayload = JSON.parse(rawBody) as EnrichmentPayload;
  } catch (parseError) {
    console.error("Failed to parse enrichment orchestrator response", {
      error:
        parseError instanceof Error ? parseError.message : String(parseError),
      status: response.status,
    });
    return { lead, cost: lead.validationCost, enrichmentCost: 0 };
  }

  const emails = enrichmentPayload?.enrichedData?.emails ?? [];

  const normalizeDomain = (value?: string) =>
    value ? value.toLowerCase().replace(/^www\./, "") : "";

  const normalizedDomain = normalizeDomain(domain);

  const emailMatchesCorporateDomain = (emailAddress?: string) => {
    if (!emailAddress || !normalizedDomain) return false;
    const parts = emailAddress.split("@");
    if (parts.length !== 2) return false;
    const emailDomain = normalizeDomain(parts[1]);
    if (!emailDomain) return false;
    return (
      emailDomain === normalizedDomain ||
      emailDomain.endsWith(`.${normalizedDomain}`)
    );
  };

  const corporateEmails = normalizedDomain
    ? emails.filter((entry: EnrichedEmail) =>
        emailMatchesCorporateDomain(entry.email)
      )
    : emails;

  const verifiedCorporate = corporateEmails.find(
    (entry: EnrichedEmail) => entry.verified
  );

  let verifiedEmailEntry = verifiedCorporate;
  if (!verifiedEmailEntry && !normalizedDomain) {
    verifiedEmailEntry = emails.find((entry: EnrichedEmail) => entry.verified);
  }

  const unverifiedCorporate = corporateEmails.find(
    (entry: EnrichedEmail) => entry.email && !entry.verified
  );

  const fallbackCandidate =
    unverifiedCorporate ||
    corporateEmails[0] ||
    emails.find((entry: EnrichedEmail) => entry.email && !entry.verified) ||
    emails[0];

  let emailStatus: "verified" | "unconfirmed" | "not_found" = "not_found";
  let verifiedEmailValue = "";
  let unverifiedEmailValue = "";

  if (verifiedEmailEntry?.email) {
    emailStatus = "verified";
    verifiedEmailValue = verifiedEmailEntry.email;
  } else if (fallbackCandidate?.email) {
    emailStatus = "unconfirmed";
    unverifiedEmailValue = fallbackCandidate.email;
  }

  const servicesUsed = new Set<string>(
    lead.enhancementData.verificationSources
  );
  (enrichmentPayload?.processingMetadata?.servicesUsed ?? []).forEach(
    (service: string) => servicesUsed.add(service)
  );

  const enrichmentCost = Number(enrichmentPayload?.totalCost ?? 0);
  const totalCost = lead.validationCost + enrichmentCost;

  const enrichmentCostBreakdown = (() => {
    const breakdown = enrichmentPayload?.costBreakdown;
    if (!breakdown || typeof breakdown !== "object") return undefined;
    const numericEntries = Object.entries(breakdown).reduce(
      (acc, [key, value]) => {
        const numericValue = Number(value);
        if (Number.isFinite(numericValue)) {
          acc[key] = numericValue;
        }
        return acc;
      },
      {} as Record<string, number>
    );
    return Object.keys(numericEntries).length > 0 ? numericEntries : undefined;
  })();

  const processingMetadataCast = {
    ...lead.enhancementData.processingMetadata,
    totalCost,
    validationCost: lead.validationCost,
    enrichmentCost,
    servicesUsed: Array.from(servicesUsed),
    servicesSkipped: [
      ...(enrichmentPayload?.processingMetadata?.servicesSkipped ?? []),
    ],
    enrichmentTier: config.tier.name,
    enrichmentCostBreakdown,
    emailStatus,
    verifiedEmail: verifiedEmailValue || undefined,
    unverifiedEmail: unverifiedEmailValue || undefined,
  };

  const updatedLead: ScoredLead = {
    ...lead,
    email: verifiedEmailValue || "",
    enhancementData: {
      ...lead.enhancementData,
      verificationSources: Array.from(servicesUsed),
      emails,
      processingMetadata: processingMetadataCast,
    },
  };

  return {
    lead: updatedLead,
    cost: totalCost,
    enrichmentCost,
  };
}

// --------------------
// Discovery Workflow
// --------------------

async function discoverBusinesses(
  config: JobConfig,
  census: CensusIntelligence | null,
  usageLogger?: UsageLogger,
  usageContext?: UsageLogContext
): Promise<DiscoveredBusiness[]> {
  const googleResults = await searchGooglePlaces(
    config.businessType,
    config.location,
    config.keywords,
    config.maxResults,
    usageLogger,
    {
      ...usageContext,
      businessQuery: config.businessType,
      locationQuery: config.location,
      tierKey: config.tier.key,
    }
  );

  const results: DiscoveredBusiness[] = [...googleResults];

  const shouldQueryFoursquare =
    googleResults.length < config.maxResults * 1.2 || config.expandGeography;
  if (shouldQueryFoursquare) {
    const foursquareResults = await searchFoursquare(
      config.businessType,
      config.location,
      config.keywords,
      Math.max(
        config.maxResults - googleResults.length,
        Math.ceil(config.maxResults / 2)
      ),
      usageLogger,
      {
        ...usageContext,
        businessQuery: config.businessType,
        locationQuery: config.location,
        tierKey: config.tier.key,
      }
    );
    results.push(...foursquareResults);
  }

  const deduped = dedupeBusinesses(results);

  if (
    census &&
    census.optimization.expected_results > deduped.length &&
    config.expandGeography
  ) {
    const expandedResults = await searchFoursquare(
      config.businessType,
      census.geographic_data.raw_location,
      config.keywords,
      Math.min(census.optimization.expected_results, config.maxResults * 2),
      usageLogger,
      {
        ...usageContext,
        businessQuery: config.businessType,
        locationQuery: census.geographic_data.raw_location,
        tierKey: config.tier.key,
      }
    );
    deduped.push(...expandedResults);
  }

  return dedupeBusinesses(deduped).slice(0, config.maxResults * 2);
}

async function processDiscoveryJob(
  jobId: string,
  config: JobConfig,
  supabaseUrl: string,
  supabaseServiceKey: string
) {
  console.log(`🚀 Background job ${jobId} started`);

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const usageLogger = createUsageLogger(supabaseUrl, supabaseServiceKey, {
    campaignId: config.campaignId,
    sessionId: config.sessionUserId ?? config.userId ?? null,
    jobId,
    tierKey: config.tier.key,
    businessQuery: config.businessType,
    locationQuery: config.location,
  });
  config.jobId = jobId;

  const userDedupContext: UserDeduplicationContext = {
    userId: config.userId ?? null,
    sessionUserId: config.sessionUserId ?? null,
    campaignHash: config.campaignHash,
    isAuthenticated: Boolean(config.userId),
  };

  let deduplicationStats: DeduplicationStats = {
    total: 0,
    filtered: 0,
    fresh: 0,
  };
  let dedupRecordsPersisted = 0;

  try {
    const initialCampaignPayload = {
      id: config.campaignId,
      business_type: config.businessType,
      location: config.location,
      target_count: config.maxResults,
      results_count: 0,
      total_cost: 0,
      status: "processing",
      campaign_hash: config.campaignHash,
      user_id: config.userId ?? null,
      session_user_id: config.sessionUserId ?? null,
      budget_limit: config.budgetLimit ?? null,
      min_confidence_score: config.minConfidenceScore ?? null,
    };

    const { error: initialCampaignError } = await supabase
      .from("campaigns")
      .upsert(initialCampaignPayload, { onConflict: "id" });

    if (initialCampaignError) {
      console.warn(
        "Initial campaign upsert warning:",
        initialCampaignError.message
      );
    }
  } catch (campaignInitError) {
    console.warn("Initial campaign upsert failed:", campaignInitError);
  }

  try {
    const { error: snapshotError } = await supabase
      .from("campaign_request_snapshots")
      .insert({
        campaign_id: config.campaignId,
        user_id: config.userId,
        session_user_id: config.sessionUserId,
        request_hash: config.requestSnapshot.requestHash,
        request_payload: config.requestSnapshot.payload,
      });

    if (snapshotError) {
      console.warn(
        "Campaign request snapshot insert warning:",
        snapshotError.message
      );
    }
  } catch (snapshotException) {
    console.warn("Campaign request snapshot insert failed:", snapshotException);
  }

  const historicalFingerprints = new Set<string>();

  try {
    if (config.userId) {
      const { data: priorFingerprints, error: fingerprintsError } =
        await supabase
          .from("lead_fingerprints")
          .select("fingerprint")
          .eq("user_id", config.userId)
          .order("created_at", { ascending: false })
          .limit(5000);

      if (fingerprintsError) {
        console.warn(
          "Unable to load fingerprint ledger for duplicate suppression:",
          fingerprintsError.message
        );
      } else {
        for (const row of priorFingerprints ?? []) {
          if (row?.fingerprint) {
            historicalFingerprints.add(row.fingerprint);
          }
        }
      }
    }

    if (historicalFingerprints.size === 0 && config.userId) {
      const { data: legacyLeads, error: legacyLeadsError } = await supabase
        .from("leads")
        .select("business_name,address,phone,website")
        .eq("user_id", config.userId)
        .order("created_at", { ascending: false })
        .limit(1000);

      if (legacyLeadsError) {
        console.warn(
          "Legacy lead lookup failed for duplicate suppression:",
          legacyLeadsError.message
        );
      } else {
        const legacyRows = (legacyLeads ?? []) as Array<{
          business_name?: string | null;
          address?: string | null;
          phone?: string | null;
          website?: string | null;
        }>;

        for (const lead of legacyRows) {
          const fingerprint = createBusinessFingerprint(lead);
          if (fingerprint) {
            historicalFingerprints.add(fingerprint);
          }
        }
      }
    }
  } catch (historyError) {
    console.warn("Historical fingerprint lookup failed:", historyError);
  }

  try {
    await supabase
      .from("discovery_jobs")
      .update({
        status: "processing",
        started_at: new Date().toISOString(),
        current_stage: "discovering_businesses",
        progress: 10,
      })
      .eq("id", jobId);

    const censusIntelligence = await fetchCensusIntelligence(
      config.businessType,
      config.location
    );

    let historicalFilteredCount = 0;
    let totalRawDiscovered = 0;
    let cachedReuseCount = 0;
    const seenFingerprints = new Set<string>();
    const uniqueBusinesses: DiscoveredBusiness[] = [];
    const sourcesUsedSet = new Set<DataSource>();
    const maxBufferedResults = Math.max(
      config.maxResults * 10,
      config.maxResults + 20
    );

    const addUniqueBusinesses = (businesses: DiscoveredBusiness[]): number => {
      let added = 0;
      for (const business of businesses) {
        if (uniqueBusinesses.length >= maxBufferedResults) {
          break;
        }

        const fingerprint = createBusinessFingerprint(business);
        if (fingerprint && historicalFingerprints.has(fingerprint)) {
          historicalFilteredCount += 1;
          continue;
        }

        const fallbackKey =
          fingerprint ||
          business.place_id ||
          `${business.source ?? "unknown"}:${normalizeString(
            business.businessName ?? business.name ?? ""
          )}`;

        if (fallbackKey && seenFingerprints.has(fallbackKey)) {
          continue;
        }

        if (fallbackKey) {
          seenFingerprints.add(fallbackKey);
        }
        if (fingerprint) {
          seenFingerprints.add(fingerprint);
        }

        uniqueBusinesses.push(business);
        if (business.source) {
          sourcesUsedSet.add(business.source);
        }
        added += 1;
      }
      return added;
    };

    const hydrateFromCachedLeads = async (): Promise<number> => {
      try {
        const maxCached = Math.max(config.maxResults * 6, 30);
        const { data, error } = await supabase
          .from("leads")
          .select(
            `id,business_name,address,phone,website,email,confidence_score,validation_cost,enrichment_data,created_at,campaign_id,campaign:campaigns!inner(user_id,business_type,location,status)`
          )
          .eq("campaigns.business_type", config.businessType)
          .eq("campaigns.location", config.location)
          .eq("campaigns.status", "completed")
          .neq("campaigns.user_id", config.userId)
          .order("confidence_score", { ascending: false })
          .limit(maxCached);

        if (error) {
          console.warn(
            "Cached lead lookup failed, continuing with live discovery:",
            error.message
          );
          return 0;
        }

        if (!data || data.length === 0) {
          return 0;
        }

        let added = 0;
        for (const row of data) {
          const enrichment = (row.enrichment_data ?? {}) as Record<
            string,
            unknown
          >;
          const processingMetadata =
            (enrichment?.processingMetadata as
              | Record<string, unknown>
              | undefined) ?? {};

          const cachedBusiness: DiscoveredBusiness = {
            source: "cached_reuse",
            name:
              typeof row.business_name === "string"
                ? row.business_name
                : undefined,
            businessName:
              typeof row.business_name === "string"
                ? row.business_name
                : undefined,
            formatted_address:
              typeof row.address === "string" ? row.address : undefined,
            address: typeof row.address === "string" ? row.address : undefined,
            formatted_phone_number:
              typeof row.phone === "string" ? row.phone : undefined,
            phone: typeof row.phone === "string" ? row.phone : undefined,
            website: typeof row.website === "string" ? row.website : undefined,
            place_id:
              typeof (processingMetadata as Record<string, unknown>)
                ?.placeId === "string"
                ? ((processingMetadata as Record<string, unknown>)
                    .placeId as string)
                : typeof (enrichment?.placeId as string | undefined) ===
                  "string"
                ? (enrichment.placeId as string)
                : undefined,
            rating:
              typeof (processingMetadata as Record<string, unknown>)?.rating ===
              "number"
                ? ((processingMetadata as Record<string, unknown>)
                    .rating as number)
                : typeof enrichment?.rating === "number"
                ? (enrichment.rating as number)
                : undefined,
            user_ratings_total:
              typeof (processingMetadata as Record<string, unknown>)
                ?.ratingsCount === "number"
                ? ((processingMetadata as Record<string, unknown>)
                    .ratingsCount as number)
                : typeof enrichment?.userRatingsTotal === "number"
                ? (enrichment.userRatingsTotal as number)
                : undefined,
            data_enriched: true,
            cachedLead: {
              businessName: row.business_name,
              address: row.address,
              phone: row.phone,
              website: row.website,
              email: row.email,
              confidenceScore: row.confidence_score,
              validationCost: row.validation_cost,
              enrichmentData: enrichment,
              sourceCampaignId: row.campaign_id,
              cachedAt: row.created_at,
            },
          };

          const fingerprint = createBusinessFingerprint(cachedBusiness);
          if (fingerprint && historicalFingerprints.has(fingerprint)) {
            historicalFilteredCount += 1;
            continue;
          }

          const fallbackKey =
            fingerprint ||
            cachedBusiness.place_id ||
            `${cachedBusiness.source}:${normalizeString(
              cachedBusiness.businessName ?? ""
            )}`;

          if (fallbackKey && seenFingerprints.has(fallbackKey)) {
            continue;
          }

          if (fallbackKey) {
            seenFingerprints.add(fallbackKey);
          }
          if (fingerprint) {
            seenFingerprints.add(fingerprint);
          }

          uniqueBusinesses.push(cachedBusiness);
          sourcesUsedSet.add("cached_reuse");
          cachedReuseCount += 1;
          added += 1;

          if (uniqueBusinesses.length >= maxBufferedResults) {
            break;
          }
        }

        totalRawDiscovered += data.length;

        if (added > 0) {
          console.log(
            `♻️ Reused ${added} cached leads from prior campaigns for ${config.businessType} in ${config.location}`
          );
        }

        return added;
      } catch (cacheError) {
        console.warn(
          "Cached lead reuse failed, continuing with live discovery:",
          cacheError
        );
        return 0;
      }
    };

    const runDiscoveryPass = async (
      overrides: Partial<Pick<JobConfig, "maxResults" | "expandGeography">> = {}
    ): Promise<number> => {
      const requestedMaxResults = Math.max(
        Math.round(overrides.maxResults ?? config.maxResults),
        config.maxResults
      );
      const cappedMaxResults = Math.min(
        requestedMaxResults,
        maxBufferedResults
      );

      const searchConfig: JobConfig = {
        ...config,
        ...overrides,
        maxResults: cappedMaxResults,
        expandGeography: overrides.expandGeography ?? config.expandGeography,
      };

      const results = await discoverBusinesses(
        searchConfig,
        censusIntelligence,
        usageLogger,
        {
          campaignId: config.campaignId,
          sessionId: config.sessionUserId ?? config.userId ?? null,
          jobId,
          tierKey: config.tier.key,
          businessQuery: searchConfig.businessType,
          locationQuery: searchConfig.location,
        }
      );

      totalRawDiscovered += results.length;
      return addUniqueBusinesses(results);
    };

    await hydrateFromCachedLeads();

    if (uniqueBusinesses.length < config.maxResults) {
      await runDiscoveryPass();
    }

    if (uniqueBusinesses.length < config.maxResults) {
      const expansionPlan: Array<{
        maxResults: number;
        expandGeography?: boolean;
      }> = [
        { maxResults: config.maxResults * 2 },
        { maxResults: config.maxResults * 3 },
        { maxResults: config.maxResults * 4 },
        { maxResults: config.maxResults * 5, expandGeography: true },
        { maxResults: config.maxResults * 6, expandGeography: true },
        { maxResults: config.maxResults * 8, expandGeography: true },
        { maxResults: config.maxResults * 10, expandGeography: true },
      ];

      for (const step of expansionPlan) {
        await runDiscoveryPass(step);

        if (
          uniqueBusinesses.length >= config.maxResults ||
          uniqueBusinesses.length >= maxBufferedResults
        ) {
          break;
        }
      }
    }

    if (historicalFilteredCount > 0) {
      console.log(
        `ℹ️ Suppressed ${historicalFilteredCount} previously delivered businesses for user ${config.userId}`
      );
    }

    const sourcesUsed = Array.from(sourcesUsedSet);

    let businessesForScoring = uniqueBusinesses;
    deduplicationStats = {
      total: uniqueBusinesses.length,
      filtered: 0,
      fresh: uniqueBusinesses.length,
    };

    try {
      const dedupResult = await filterAlreadyServedBusinesses(
        supabase,
        uniqueBusinesses,
        userDedupContext
      );
      businessesForScoring = dedupResult.filtered;
      deduplicationStats = dedupResult.stats;
    } catch (dedupError) {
      console.warn("User deduplication filter failed", dedupError);
    }

    await supabase
      .from("discovery_jobs")
      .update({
        current_stage: "scoring_businesses",
        progress: 30,
        metrics: {
          businesses_found: uniqueBusinesses.length,
          fresh_after_dedup: businessesForScoring.length,
          raw_candidates: totalRawDiscovered,
          previously_delivered_filtered: historicalFilteredCount,
          user_dedup_filtered: deduplicationStats.filtered,
          user_dedup_total: deduplicationStats.total,
          user_dedup_fresh: deduplicationStats.fresh,
          sources_used: sourcesUsed,
          census_density_score: censusIntelligence?.density_score ?? null,
          cached_reuse_count: cachedReuseCount,
        },
      })
      .eq("id", jobId);

    const scorer = new QualityScorer({
      maxCostPerBusiness: config.budgetLimit / Math.max(config.maxResults, 1),
      tierName: config.tier.name,
      censusMultiplier: censusIntelligence?.optimization.confidence_multiplier,
    });

    const scoredBusinesses = businessesForScoring.map((business) =>
      scorer.scoreBusiness(business)
    );

    const qualifiedLeads = scoredBusinesses
      .filter((lead) => lead.optimizedScore >= config.minConfidenceScore)
      .slice(0, config.maxResults);

    const isExhausted = qualifiedLeads.length < config.maxResults;

    const sharedMetrics = {
      businesses_found: uniqueBusinesses.length,
      fresh_after_dedup: businessesForScoring.length,
      qualified_leads: qualifiedLeads.length,
      raw_candidates: totalRawDiscovered,
      previously_delivered_filtered: historicalFilteredCount,
      sources_used: sourcesUsed,
      census_density_score: censusIntelligence?.density_score ?? null,
      exhausted: isExhausted,
      cached_reuse_count: cachedReuseCount,
      user_dedup_filtered: deduplicationStats.filtered,
      user_dedup_total: deduplicationStats.total,
      user_dedup_fresh: deduplicationStats.fresh,
    };

    await supabase
      .from("discovery_jobs")
      .update({
        current_stage: isExhausted ? "exhausted_results" : "enriching_contacts",
        progress: isExhausted ? 80 : 50,
        metrics: sharedMetrics,
      })
      .eq("id", jobId);

    if (isExhausted) {
      console.log(
        `ℹ️ Exhausted unique results for ${config.businessType} in ${config.location} for user ${config.userId}`
      );
    }

    const enrichedLeads: ScoredLead[] = [];
    let totalCost = 0;
    let totalValidationCost = 0;
    let totalEnrichmentCost = 0;

    for (let index = 0; index < qualifiedLeads.length; index += 1) {
      const lead = qualifiedLeads[index];
      try {
        const enrichmentResult = await enrichLead(lead, config);
        enrichedLeads.push(enrichmentResult.lead);
        totalCost += enrichmentResult.cost;
        totalValidationCost +=
          enrichmentResult.lead.enhancementData.processingMetadata
            .validationCost;
        totalEnrichmentCost += enrichmentResult.enrichmentCost;
      } catch (error) {
        console.error(`❌ Enrichment error for ${lead.businessName}:`, error);
        enrichedLeads.push(lead);
        totalCost += lead.validationCost;
        totalValidationCost += lead.validationCost;
      }

      const progress =
        50 +
        Math.floor(((index + 1) / Math.max(qualifiedLeads.length, 1)) * 35);
      await supabase
        .from("discovery_jobs")
        .update({
          progress,
          metrics: {
            ...sharedMetrics,
            leads_enriched: index + 1,
            total_cost: Number(totalCost.toFixed(3)),
            validation_cost_total: Number(totalValidationCost.toFixed(3)),
            enrichment_cost_total: Number(totalEnrichmentCost.toFixed(3)),
          },
        })
        .eq("id", jobId);
    }

    if (!isExhausted) {
      await supabase
        .from("discovery_jobs")
        .update({
          current_stage: "storing_results",
          progress: 90,
        })
        .eq("id", jobId);
    }

    const campaignUpdate = await supabase
      .from("campaigns")
      .update({
        business_type: config.businessType,
        location: config.location,
        target_count: config.maxResults,
        results_count: enrichedLeads.length,
        total_cost: Number(totalCost.toFixed(3)),
        status: "completed",
        processing_time_ms: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", config.campaignId)
      .select("id")
      .single();

    if (campaignUpdate.error) {
      console.warn("Campaign update warning:", campaignUpdate.error.message);
    }

    const leadsPayload = enrichedLeads.map((lead) => ({
      campaign_id: config.campaignId,
      business_name: lead.businessName,
      address: lead.address,
      phone: lead.phone,
      website: lead.website,
      email: lead.email,
      confidence_score: lead.optimizedScore,
      enrichment_data: {
        verificationSources: lead.enhancementData.verificationSources,
        emails: lead.enhancementData.emails,
        processingMetadata: lead.enhancementData.processingMetadata,
        dataSources: lead.dataSources,
      },
      validation_cost: lead.enhancementData.processingMetadata.validationCost,
      user_id: config.userId ?? null,
      session_user_id: config.sessionUserId ?? null,
    }));

    let insertedLeads: Array<{
      id: number;
      business_name?: string | null;
      address?: string | null;
      phone?: string | null;
      website?: string | null;
    }> | null = null;

    if (leadsPayload.length > 0) {
      const leadInsert = await supabase
        .from("leads")
        .insert(leadsPayload)
        .select("id,business_name,address,phone,website");
      if (leadInsert.error) {
        console.error("Lead insert error:", leadInsert.error.message);
      } else {
        insertedLeads = leadInsert.data ?? [];
      }
    }

    if (insertedLeads && insertedLeads.length > 0) {
      type FingerprintRow = {
        fingerprint: string;
        user_id: string | null;
        session_user_id: string | null;
        campaign_id: string;
        lead_id: number;
        business_name: string;
      };

      const fingerprintRows = insertedLeads
        .map((row, index): FingerprintRow | null => {
          const lead = enrichedLeads[index];
          const fingerprint = createBusinessFingerprint({
            business_name: row.business_name ?? lead?.businessName ?? "",
            address: row.address ?? lead?.address ?? "",
            phone: row.phone ?? lead?.phone ?? "",
            website: row.website ?? lead?.website ?? "",
          });

          if (!fingerprint) {
            return null;
          }

          return {
            fingerprint,
            user_id: config.userId ?? null,
            session_user_id: config.sessionUserId ?? null,
            campaign_id: config.campaignId,
            lead_id: row.id,
            business_name: row.business_name ?? lead?.businessName ?? "",
          };
        })
        .filter((row): row is FingerprintRow => Boolean(row));

      if (fingerprintRows.length > 0) {
        const insertedFingerprintKeys = new Set<string>();
        let insertedCount = 0;

        const userFingerprintRows = fingerprintRows.filter((row) =>
          Boolean(row.user_id)
        );

        if (userFingerprintRows.length > 0) {
          const {
            data: insertedUserFingerprints,
            error: userFingerprintInsertError,
          } = await supabase
            .from("lead_fingerprints")
            .upsert(userFingerprintRows, {
              onConflict: "fingerprint,user_id",
              ignoreDuplicates: true,
            })
            .select("fingerprint,user_id,session_user_id");

          if (userFingerprintInsertError) {
            console.warn(
              "Lead fingerprint insert warning (user scope):",
              userFingerprintInsertError.message
            );
          } else if (insertedUserFingerprints) {
            insertedCount += insertedUserFingerprints.length;
            for (const row of insertedUserFingerprints) {
              insertedFingerprintKeys.add(
                makeFingerprintKey(
                  row.fingerprint,
                  row.user_id ?? null,
                  row.session_user_id ?? null
                )
              );
            }
          }
        }

        const sessionFingerprintRows = fingerprintRows.filter(
          (row) => !row.user_id && Boolean(row.session_user_id)
        );

        if (sessionFingerprintRows.length > 0) {
          const {
            data: insertedSessionFingerprints,
            error: sessionFingerprintInsertError,
          } = await supabase
            .from("lead_fingerprints")
            .upsert(sessionFingerprintRows, {
              onConflict: "fingerprint,session_user_id",
              ignoreDuplicates: true,
            })
            .select("fingerprint,user_id,session_user_id");

          if (sessionFingerprintInsertError) {
            console.warn(
              "Lead fingerprint insert warning (session scope):",
              sessionFingerprintInsertError.message
            );
          } else if (insertedSessionFingerprints) {
            insertedCount += insertedSessionFingerprints.length;
            for (const row of insertedSessionFingerprints) {
              insertedFingerprintKeys.add(
                makeFingerprintKey(
                  row.fingerprint,
                  row.user_id ?? null,
                  row.session_user_id ?? null
                )
              );
            }
          }
        }

        const expectedFingerprintWrites = fingerprintRows.length;
        const duplicatesDetected = expectedFingerprintWrites - insertedCount;

        const ledgerSummary = {
          expectedWrites: expectedFingerprintWrites,
          insertedWrites: insertedCount,
          duplicatesDetected,
          userRows: userFingerprintRows.length,
          sessionRows: sessionFingerprintRows.length,
        };

        console.log("🧮 Lead fingerprint ledger summary:", ledgerSummary);

        if (duplicatesDetected > 0) {
          const diagnostics: Array<{
            fingerprint: string;
            userId: string | null;
            sessionUserId: string | null;
            exists: boolean;
          }> = [];

          for (const row of fingerprintRows) {
            if (diagnostics.length >= FINGERPRINT_HEALTH_SAMPLE_LIMIT) {
              break;
            }

            const key = makeFingerprintKey(
              row.fingerprint,
              row.user_id,
              row.session_user_id
            );

            if (insertedFingerprintKeys.has(key)) {
              continue;
            }

            const exists = await leadFingerprintExists(supabase, {
              fingerprint: row.fingerprint,
              userId: row.user_id,
              sessionUserId: row.session_user_id,
            });

            diagnostics.push({
              fingerprint: row.fingerprint,
              userId: row.user_id,
              sessionUserId: row.session_user_id,
              exists,
            });
          }

          console.log("🔍 Fingerprint ledger health check:", {
            summary: ledgerSummary,
            diagnostics,
          });
        }
      }
    }

    try {
      dedupRecordsPersisted = await recordServedBusinesses(
        supabase,
        enrichedLeads,
        userDedupContext,
        config.campaignId
      );
    } catch (dedupInsertError) {
      console.warn("User deduplication recording failed", dedupInsertError);
    }

    const averageConfidence = enrichedLeads.length
      ? enrichedLeads.reduce((sum, lead) => sum + lead.optimizedScore, 0) /
        enrichedLeads.length
      : 0;

    const finalMetrics = {
      ...sharedMetrics,
      total_found: enrichedLeads.length,
      total_cost: Number(totalCost.toFixed(3)),
      validation_cost_total: Number(totalValidationCost.toFixed(3)),
      enrichment_cost_total: Number(totalEnrichmentCost.toFixed(3)),
      avg_confidence: Number(averageConfidence.toFixed(1)),
      tier_key: config.tier.key,
      tier_name: config.tier.name,
      tier_price: config.tier.pricePerLead,
      leads_enriched: enrichedLeads.length,
      cached_reuse_count: cachedReuseCount,
      campaign_hash: config.campaignHash,
      dedup_records_inserted: dedupRecordsPersisted,
    };

    await supabase
      .from("discovery_jobs")
      .update({
        status: "completed",
        current_stage: isExhausted ? "exhausted_results" : "completed",
        progress: 100,
        completed_at: new Date().toISOString(),
        results: enrichedLeads,
        metrics: finalMetrics,
      })
      .eq("id", jobId);

    console.log(
      `✅ Background job ${jobId} completed: ${
        enrichedLeads.length
      } leads, $${totalCost.toFixed(3)}`
    );
  } catch (error) {
    console.error(`❌ Background job ${jobId} failed:`, error);

    await supabase
      .from("discovery_jobs")
      .update({
        status: "failed",
        error: error instanceof Error ? error.message : "Unknown error",
        completed_at: new Date().toISOString(),
      })
      .eq("id", jobId);
  }
}

// --------------------
// MAIN HANDLER
// --------------------

serve(async (req) => {
  const corsResponse = handleCORS(req);
  if (corsResponse) return corsResponse;

  try {
    let authContext: AuthenticatedRequestContext;
    try {
      authContext = await authenticateRequest(req);
    } catch (authError) {
      console.error(
        "❌ Authentication failed for discovery request",
        authError
      );
      const diagnostics =
        authError &&
        typeof authError === "object" &&
        "diagnostics" in (authError as Record<string, unknown>)
          ? (
              authError as {
                diagnostics?: {
                  stage?: string;
                  failureReason?: string;
                  tokenPreview?: string | null;
                  hasSubClaim?: boolean;
                  hasSessionIdClaim?: boolean;
                  claimKeys?: string[];
                  usedServiceFallback?: boolean;
                };
              }
            ).diagnostics ?? null
          : null;
      const sanitizedDiagnostics = diagnostics
        ? {
            stage: diagnostics.stage ?? null,
            failureReason: diagnostics.failureReason ?? null,
            tokenPreview: diagnostics.tokenPreview ?? null,
            hasSubClaim: diagnostics.hasSubClaim ?? null,
            hasSessionIdClaim: diagnostics.hasSessionIdClaim ?? null,
            claimKeys: diagnostics.claimKeys ?? null,
            usedServiceFallback: diagnostics.usedServiceFallback ?? null,
          }
        : undefined;
      return new Response(
        JSON.stringify({
          success: false,
          error:
            authError instanceof Error
              ? authError.message
              : "Authentication failed",
          diagnostics: sanitizedDiagnostics,
        }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const {
      supabaseUrl,
      supabaseServiceRoleKey: supabaseServiceKey,
      user,
    } = authContext;

    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });

    console.log(
      `🔐 Authenticated Supabase session for ${authContext.userId} (${
        authContext.isAnonymous ? "anonymous" : "authenticated"
      })`
    );

    const requestData: BusinessDiscoveryRequest = await req.json();
    const {
      businessType,
      location,
      keywords,
      searchRadius,
      expandGeography = false,
      maxResults = 5,
      budgetLimit,
      minConfidenceScore = 50,
      sessionUserId,
      tierKey,
      tierName,
      options = {},
    } = requestData;

    if (sessionUserId && sessionUserId !== user.id) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Session mismatch detected. Please re-authenticate.",
        }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const tierSettings = getTierSettings(tierKey, tierName);
    const enforcedBudget =
      budgetLimit ?? maxResults * tierSettings.pricePerLead;
    const keywordList = parseKeywords(keywords);

    const resolvedSessionId =
      sessionUserId ??
      authContext.sessionId ??
      (authContext.isAnonymous ? user.id : null);

    const trackingUserId = authContext.isAnonymous ? null : user.id;

    const jobRandomSource =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now().toString(36)}${Math.random()
            .toString(36)
            .slice(2, 11)}`;
    const jobId = `job_${jobRandomSource.replace(/[^A-Za-z0-9]+/g, "")}`;

    const buildUniqueCampaignId = (baseName: string) => {
      const normalizedBase = baseName
        .replace(/[^A-Za-z0-9_]+/g, "_")
        .replace(/_+/g, "_")
        .replace(/^_+|_+$/g, "")
        .toUpperCase();
      const cryptoObj =
        typeof globalThis !== "undefined" && "crypto" in globalThis
          ? (globalThis as { crypto?: Crypto }).crypto
          : undefined;
      const randomSource =
        cryptoObj && typeof cryptoObj.randomUUID === "function"
          ? cryptoObj.randomUUID()
          : `${Math.random().toString(36).slice(2)}${Math.random()
              .toString(36)
              .slice(2)}`;
      const sanitizedRandom = randomSource.replace(/[^A-Za-z0-9]+/g, "");
      const randomSuffix = sanitizedRandom
        .padEnd(8, "0")
        .slice(0, 8)
        .toUpperCase();
      const timestampSuffix = Date.now().toString(36).toUpperCase();
      const trimmedBase = normalizedBase.slice(0, 40);
      const safeBase = trimmedBase.length > 0 ? trimmedBase : "CAMPAIGN";
      return `${safeBase}_${timestampSuffix}_${randomSuffix}`;
    };

    // Generate structured campaign ID using database function
    let campaignId: string;
    try {
      const { data: generatedName, error: nameError } = await adminClient.rpc(
        "generate_campaign_name",
        {
          business_type: businessType,
          location: location,
          user_id: user?.id || null,
        }
      );

      if (nameError) {
        console.warn(
          "Campaign name generation failed, using fallback:",
          nameError
        );
        campaignId = buildUniqueCampaignId(
          `campaign_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`
        );
      } else {
        campaignId = buildUniqueCampaignId(
          generatedName ||
            `campaign_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`
        );
      }
    } catch (error) {
      console.warn("Campaign name generation error, using fallback:", error);
      campaignId = buildUniqueCampaignId(
        `campaign_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`
      );
    }

    const resolvedOptions = {
      ...DEFAULT_OPTIONS,
      ...options,
    };

    const snapshotPayload = {
      businessType,
      location,
      keywords: keywordList,
      searchRadius,
      expandGeography,
      maxResults,
      budgetLimit: enforcedBudget,
      minConfidenceScore,
      tierKey: tierSettings.key,
      tierName: tierSettings.name,
      options: resolvedOptions,
    };
    const requestedAt = new Date().toISOString();
    const requestHash = await createStableHash({
      userId: trackingUserId,
      sessionUserId: resolvedSessionId,
      snapshotPayload,
    });

    const campaignHash = await createStableHash({
      businessType,
      location,
      minConfidenceScore,
    });

    const userDedupContext: UserDeduplicationContext = {
      userId: trackingUserId,
      sessionUserId: resolvedSessionId,
      campaignHash,
      isAuthenticated: !authContext.isAnonymous,
    };

    console.log("🧮 Dedup context", userDedupContext);

    const requestSnapshot: RequestSnapshot = {
      requestedAt,
      requestHash,
      payload: snapshotPayload,
    };

    const jobConfig: JobConfig = {
      campaignId,
      businessType,
      location,
      keywords: keywordList,
      searchRadius,
      expandGeography,
      maxResults,
      budgetLimit: enforcedBudget,
      minConfidenceScore,
      userId: trackingUserId ?? undefined,
      sessionUserId: resolvedSessionId ?? undefined,
      campaignHash,
      tier: tierSettings,
      options: resolvedOptions,
      requestSnapshot,
    };

    const { error: jobError } = await adminClient
      .from("discovery_jobs")
      .insert({
        id: jobId,
        campaign_id: campaignId,
        user_id: trackingUserId,
        session_user_id: resolvedSessionId,
        status: "pending",
        config: {
          ...jobConfig,
          tier: {
            key: tierSettings.key,
            name: tierSettings.name,
            pricePerLead: tierSettings.pricePerLead,
          },
        },
      });

    if (jobError) {
      throw new Error(`Failed to create job: ${jobError.message}`);
    }

    EdgeRuntime.waitUntil(
      processDiscoveryJob(jobId, jobConfig, supabaseUrl, supabaseServiceKey)
    );

    const responsePayload = {
      success: true,
      message: "Discovery job created and processing in background",
      jobId,
      campaignId,
      status: "processing",
      estimatedTime: "1-2 minutes",
      realtimeChannel: `discovery_jobs:id=eq.${jobId}`,
      deduplication: {
        campaignHash,
        mode: trackingUserId ? "user" : "session",
        trackedId: trackingUserId ?? resolvedSessionId,
      },
    };

    return new Response(JSON.stringify(responsePayload), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Cache-Control": "private, max-age=30, must-revalidate",
        ETag: `W/"${jobId}"`,
      },
    });
  } catch (error) {
    console.error("❌ Error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
