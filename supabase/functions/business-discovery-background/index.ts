import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, handleCORS } from "../_shared/edge-auth.ts";
import {
  createUsageLogger,
  UsageLogContext,
  UsageLogger,
} from "../_shared/api-usage.ts";

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

type DataSource = "google_places" | "google_place_details" | "foursquare";

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
  tier: TierSettings;
  options: {
    tradeAssociation: boolean;
    professionalLicense: boolean;
    chamberVerification: boolean;
    apolloDiscovery: boolean;
  };
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

interface DiscoveredBusiness extends BusinessData {
  source: DataSource;
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
    };
  };
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

  const queryString = [businessType, ...keywords].join(" ").trim() || businessType;
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

function dedupeBusinesses(
  businesses: DiscoveredBusiness[]
): DiscoveredBusiness[] {
  const map = new Map<string, DiscoveredBusiness>();
  for (const business of businesses) {
    const key = `${(
      business.name ||
      business.businessName ||
      ""
    ).toLowerCase()}_${(
      business.formatted_address ||
      business.address ||
      ""
    ).toLowerCase()}`;
    if (!map.has(key)) {
      map.set(key, business);
    } else {
      const existing = map.get(key)!;
      if (
        existing.source === "google_places" &&
        business.source === "google_place_details"
      ) {
        map.set(key, business);
      }
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

    const scores = {
      businessName: businessName ? Math.min(100, businessName.length * 3) : 0,
      address: address ? 100 : 0,
      phone: phone ? 85 : 0,
      website: website ? 80 : 0,
      rating: business.rating ? Math.min(20, business.rating * 4) : 0,
    };

    let totalScore =
      Object.values(scores).reduce((sum, score) => sum + score, 0) /
      Object.values(scores).length;

    if (business.source === "foursquare") {
      totalScore += 8;
    } else if (business.source === "google_place_details") {
      totalScore += 5;
    }

    totalScore = Math.min(100, Math.round(totalScore * this.censusMultiplier));

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

  const body = {
    businessName: lead.businessName,
    domain,
    address: lead.address,
    phone: lead.phone,
    website: lead.website,
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
    return { lead, cost: lead.validationCost, enrichmentCost: 0 };
  }

  const enrichmentData = await response.json();
  type EnrichedEmail = {
    email: string;
    verified?: boolean;
    [key: string]: unknown;
  };

  const emails = (enrichmentData.enrichedData?.emails ?? []) as EnrichedEmail[];

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
  (enrichmentData.processingMetadata?.servicesUsed ?? []).forEach(
    (service: string) => servicesUsed.add(service)
  );

  const enrichmentCost = Number(enrichmentData.totalCost ?? 0);
  const totalCost = lead.validationCost + enrichmentCost;

  const updatedLead: ScoredLead = {
    ...lead,
    email: verifiedEmailValue || "",
    enhancementData: {
      ...lead.enhancementData,
      verificationSources: Array.from(servicesUsed),
      emails,
      processingMetadata: {
        ...lead.enhancementData.processingMetadata,
        totalCost,
        validationCost: lead.validationCost,
        enrichmentCost,
        servicesUsed: Array.from(servicesUsed),
        servicesSkipped:
          enrichmentData.processingMetadata?.servicesSkipped ?? [],
        enrichmentTier: config.tier.name,
        enrichmentCostBreakdown: enrichmentData.costBreakdown ?? undefined,
        emailStatus,
        verifiedEmail: verifiedEmailValue || undefined,
        unverifiedEmail: unverifiedEmailValue || undefined,
      },
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

    const discoveredBusinesses = await discoverBusinesses(
      config,
      censusIntelligence,
      usageLogger,
      {
        campaignId: config.campaignId,
        sessionId: config.sessionUserId ?? config.userId ?? null,
        jobId,
        tierKey: config.tier.key,
        businessQuery: config.businessType,
        locationQuery: config.location,
      }
    );
    const sourcesUsed = Array.from(
      new Set(discoveredBusinesses.map((business) => business.source))
    );

    await supabase
      .from("discovery_jobs")
      .update({
        current_stage: "scoring_businesses",
        progress: 30,
        metrics: {
          businesses_found: discoveredBusinesses.length,
          sources_used: sourcesUsed,
          census_density_score: censusIntelligence?.density_score ?? null,
        },
      })
      .eq("id", jobId);

    const scorer = new QualityScorer({
      maxCostPerBusiness: config.budgetLimit / Math.max(config.maxResults, 1),
      tierName: config.tier.name,
      censusMultiplier: censusIntelligence?.optimization.confidence_multiplier,
    });

    const scoredBusinesses = discoveredBusinesses.map((business) =>
      scorer.scoreBusiness(business)
    );

    const qualifiedLeads = scoredBusinesses
      .filter((lead) => lead.optimizedScore >= config.minConfidenceScore)
      .slice(0, config.maxResults);

    await supabase
      .from("discovery_jobs")
      .update({
        current_stage: "enriching_contacts",
        progress: 50,
        metrics: {
          businesses_found: discoveredBusinesses.length,
          qualified_leads: qualifiedLeads.length,
          sources_used: sourcesUsed,
          census_density_score: censusIntelligence?.density_score ?? null,
        },
      })
      .eq("id", jobId);

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
            businesses_found: discoveredBusinesses.length,
            qualified_leads: qualifiedLeads.length,
            leads_enriched: index + 1,
            total_cost: Number(totalCost.toFixed(3)),
            validation_cost_total: Number(totalValidationCost.toFixed(3)),
            enrichment_cost_total: Number(totalEnrichmentCost.toFixed(3)),
            sources_used: sourcesUsed,
            census_density_score: censusIntelligence?.density_score ?? null,
          },
        })
        .eq("id", jobId);
    }

    await supabase
      .from("discovery_jobs")
      .update({
        current_stage: "storing_results",
        progress: 90,
      })
      .eq("id", jobId);

    const campaignInsert = await supabase
      .from("campaigns")
      .insert({
        id: config.campaignId,
        business_type: config.businessType,
        location: config.location,
        target_count: config.maxResults,
        results_count: enrichedLeads.length,
        total_cost: Number(totalCost.toFixed(3)),
        status: "completed",
        user_id: config.userId,
        session_user_id: config.sessionUserId,
        processing_time_ms: null,
      })
      .select("id")
      .single();

    if (campaignInsert.error) {
      console.warn("Campaign insert warning:", campaignInsert.error.message);
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
      user_id: config.userId,
      session_user_id: config.sessionUserId,
    }));

    if (leadsPayload.length > 0) {
      const leadInsert = await supabase.from("leads").insert(leadsPayload);
      if (leadInsert.error) {
        console.error("Lead insert error:", leadInsert.error.message);
      }
    }

    const averageConfidence = enrichedLeads.length
      ? enrichedLeads.reduce((sum, lead) => sum + lead.optimizedScore, 0) /
        enrichedLeads.length
      : 0;

    await supabase
      .from("discovery_jobs")
      .update({
        status: "completed",
        progress: 100,
        completed_at: new Date().toISOString(),
        results: enrichedLeads,
        metrics: {
          total_found: enrichedLeads.length,
          qualified_leads: qualifiedLeads.length,
          total_cost: Number(totalCost.toFixed(3)),
          validation_cost_total: Number(totalValidationCost.toFixed(3)),
          enrichment_cost_total: Number(totalEnrichmentCost.toFixed(3)),
          avg_confidence: Number(averageConfidence.toFixed(1)),
          tier_key: config.tier.key,
          tier_name: config.tier.name,
          tier_price: config.tier.pricePerLead,
          sources_used: sourcesUsed,
          census_density_score: censusIntelligence?.density_score ?? null,
        },
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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization");
    const globalHeaders: Record<string, string> = authHeader
      ? { Authorization: authHeader }
      : {};
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: globalHeaders },
    });

    const {
      data: { user },
    } = await supabaseClient.auth.getUser();

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

    const tierSettings = getTierSettings(tierKey, tierName);
    const enforcedBudget =
      budgetLimit ?? maxResults * tierSettings.pricePerLead;
    const keywordList = parseKeywords(keywords);

    const jobId = `job_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2, 11)}`;

    // Generate structured campaign ID using database function
    let campaignId: string;
    try {
      const { data: generatedName, error: nameError } = await supabaseClient.rpc(
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
        campaignId = `campaign_${Date.now()}_${Math.random()
          .toString(36)
          .slice(2, 11)}`;
      } else {
        campaignId =
          generatedName ||
          `campaign_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
      }
    } catch (error) {
      console.warn("Campaign name generation error, using fallback:", error);
      campaignId = `campaign_${Date.now()}_${Math.random()
        .toString(36)
        .slice(2, 11)}`;
    }

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
      userId: user?.id,
      sessionUserId: sessionUserId || user?.id,
      tier: tierSettings,
      options: {
        ...DEFAULT_OPTIONS,
        ...options,
      },
    };

    const { error: jobError } = await supabaseClient
      .from("discovery_jobs")
      .insert({
        id: jobId,
        campaign_id: campaignId,
        user_id: user?.id,
        session_user_id: sessionUserId || user?.id,
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

    return new Response(
      JSON.stringify({
        success: true,
        message: "Discovery job created and processing in background",
        jobId,
        campaignId,
        status: "processing",
        estimatedTime: "1-2 minutes",
        realtimeChannel: `discovery_jobs:id=eq.${jobId}`,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
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
