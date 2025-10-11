import type { BusinessLead } from "../../types";

type LeadLike =
  | BusinessLead
  | (Partial<BusinessLead> & Record<string, unknown>);

type NullableLeadCollection = LeadLike[] | null | undefined;

const ensureString = (value: unknown, fallback = ""): string => {
  return typeof value === "string" ? value : fallback;
};

const ensureOptionalString = (value: unknown): string | undefined => {
  return typeof value === "string" && value.length > 0 ? value : undefined;
};

const ensureNumber = (value: unknown, fallback = 0): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const VALIDATION_STATUSES = new Set<BusinessLead["validation_status"]>([
  "pending",
  "validating",
  "validated",
  "failed",
]);

const sanitizeEnrichmentData = (
  value: unknown
): BusinessLead["enrichment_data"] => {
  if (value == null || typeof value !== "object") {
    return undefined;
  }

  try {
    return JSON.parse(JSON.stringify(value)) as BusinessLead["enrichment_data"];
  } catch (error) {
    console.error("⚠️ Unable to sanitize enrichment data payload", error);
    return undefined;
  }
};

const deriveDataSources = (
  lead: LeadLike,
  enrichmentData: BusinessLead["enrichment_data"]
): string[] => {
  const fromLead = Array.isArray(
    (lead as { data_sources?: unknown }).data_sources
  )
    ? ((lead as { data_sources?: unknown }).data_sources as unknown[])
        .filter((source): source is string => typeof source === "string")
        .map((source) => source.trim())
        .filter((source) => source.length > 0)
    : [];

  const services = Array.isArray(
    enrichmentData?.processingMetadata?.servicesUsed
  )
    ? enrichmentData?.processingMetadata?.servicesUsed ?? []
    : [];
  const verificationSources = Array.isArray(enrichmentData?.verificationSources)
    ? enrichmentData?.verificationSources ?? []
    : [];
  const explicitSources = Array.isArray(enrichmentData?.dataSources)
    ? enrichmentData?.dataSources ?? []
    : [];

  const combined = [
    ...fromLead,
    ...services,
    ...verificationSources,
    ...explicitSources,
  ]
    .filter((source): source is string => typeof source === "string")
    .map((source) => source.trim())
    .filter((source) => source.length > 0);

  if (combined.length === 0) {
    return ["google_places"];
  }

  return Array.from(new Set(combined));
};

const coerceValidationStatus = (
  value: unknown,
  enrichmentData: BusinessLead["enrichment_data"]
): BusinessLead["validation_status"] => {
  if (
    typeof value === "string" &&
    VALIDATION_STATUSES.has(value as BusinessLead["validation_status"])
  ) {
    return value as BusinessLead["validation_status"];
  }

  const enrichmentStatus = enrichmentData?.validationStatus;

  if (
    typeof enrichmentStatus === "string" &&
    VALIDATION_STATUSES.has(
      enrichmentStatus as BusinessLead["validation_status"]
    )
  ) {
    return enrichmentStatus as BusinessLead["validation_status"];
  }

  return "validated";
};

export const sanitizeLead = (
  lead: LeadLike | null | undefined,
  fallbackCampaignId: string | null
): BusinessLead | null => {
  if (!lead || lead.id == null) {
    return null;
  }

  const campaignId = (lead.campaign_id ?? fallbackCampaignId) as string | null;

  if (!campaignId) {
    return null;
  }

  const enrichmentData = sanitizeEnrichmentData(lead.enrichment_data);

  const sanitized: BusinessLead = {
    id: String(lead.id),
    campaign_id: String(campaignId),
    business_name: ensureString(lead.business_name, "Unknown Business"),
    address: ensureString(lead.address),
    phone: ensureString(lead.phone),
    website: ensureString(lead.website),
    email: ensureString(lead.email),
    industry: ensureOptionalString((lead as { industry?: unknown }).industry),
    confidence_score: ensureNumber(lead.confidence_score, 0),
    validation_status: coerceValidationStatus(
      lead.validation_status,
      enrichmentData
    ),
    created_at:
      typeof lead.created_at === "string"
        ? lead.created_at
        : new Date().toISOString(),
    cost_to_acquire: ensureNumber(
      (lead as { cost_to_acquire?: unknown }).cost_to_acquire ??
        (lead as { validation_cost?: unknown }).validation_cost,
      0
    ),
    data_sources: deriveDataSources(lead, enrichmentData),
    enrichment_tier:
      ensureOptionalString(lead.enrichment_tier) ??
      ensureOptionalString(enrichmentData?.enrichmentTier),
    vault_secured:
      typeof lead.vault_secured === "boolean" ? lead.vault_secured : true,
    enrichment_data: enrichmentData,
  };

  return sanitized;
};

export const sanitizeLeadCollection = (
  leads: NullableLeadCollection,
  fallbackCampaignId: string | null,
  context = "campaign store"
): BusinessLead[] => {
  if (!Array.isArray(leads)) {
    console.error(`⚠️ ${context} received a non-array leads payload`, {
      type: typeof leads,
    });
    return [];
  }

  const sanitized = leads
    .map((lead) => sanitizeLead(lead, fallbackCampaignId))
    .filter((lead): lead is BusinessLead => Boolean(lead));

  if (sanitized.length < leads.length) {
    console.warn(`🧹 Filtered invalid leads before updating ${context}`, {
      received: leads.length,
      retained: sanitized.length,
    });
  }

  return sanitized;
};
