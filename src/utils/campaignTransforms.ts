import type { BusinessLead, CampaignResult } from "../types";

const normalizeCampaignStatus = (
  value: string | null | undefined
): CampaignResult["status"] => {
  switch (value) {
    case "running":
    case "completed":
    case "failed":
    case "cancelled":
      return value;
    default:
      return "completed";
  }
};

const normalizeValidationStatus = (
  value: string | null | undefined
): BusinessLead["validation_status"] => {
  switch (value) {
    case "pending":
    case "validating":
    case "validated":
    case "failed":
      return value;
    default:
      return "validated";
  }
};

const deriveDataSources = (enrichmentData: any): string[] => {
  if (!enrichmentData) {
    return ["google_places"];
  }

  const fromServices = Array.isArray(
    enrichmentData?.processingMetadata?.servicesUsed
  )
    ? enrichmentData.processingMetadata.servicesUsed
    : [];

  const fromSources = Array.isArray(enrichmentData?.verificationSources)
    ? enrichmentData.verificationSources
    : [];

  const dataSources = [...fromServices, ...fromSources].filter(Boolean);
  return dataSources.length > 0 ? dataSources : ["google_places"];
};

const coerceNumber = (value: unknown, fallback = 0): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

interface TransformOptions {
  metrics?: Record<string, any> | null;
}

export interface CampaignTransformResult {
  campaignResult: CampaignResult;
  leads: BusinessLead[];
}

const sanitizeEnrichmentData = (
  value: unknown
): BusinessLead["enrichment_data"] => {
  if (value == null) {
    return undefined;
  }

  if (typeof value !== "object") {
    return undefined;
  }

  try {
    return JSON.parse(JSON.stringify(value)) as BusinessLead["enrichment_data"];
  } catch (error) {
    console.error("⚠️ Unable to sanitize enrichment data in transform", error);
    return undefined;
  }
};

const normalizeLeadIdentifier = (lead: any): string | null => {
  const candidate = lead?.id ?? lead?.lead_id ?? null;

  if (candidate == null) {
    return null;
  }

  return String(candidate);
};

export const transformCampaignData = (
  campaignRecord: any,
  leadsRecords: any[] = [],
  options: TransformOptions = {}
): CampaignTransformResult => {
  if (!campaignRecord) {
    throw new Error("Campaign record is required");
  }

  const metricsAny = options.metrics ?? {};

  const mappedLeads: BusinessLead[] = [];

  for (const rawLead of leadsRecords) {
    const leadId = normalizeLeadIdentifier(rawLead);

    if (leadId == null) {
      console.warn("⚠️ Dropping lead without identifier before hydration", {
        campaignId: campaignRecord.id,
        lead: rawLead,
      });
      continue;
    }

    const lead = rawLead ?? {};
    const enrichmentData = sanitizeEnrichmentData(lead.enrichment_data);
    const rawCost =
      lead.validation_cost ??
      enrichmentData?.processingMetadata?.totalCost ??
      0;

    const tierFromData =
      enrichmentData?.processingMetadata?.enrichmentTier ??
      enrichmentData?.enrichmentTier;

    const campaignId = String(lead.campaign_id ?? campaignRecord.id ?? "");

    if (!campaignId) {
      console.warn("⚠️ Dropping lead without campaign association", {
        campaignId: campaignRecord.id,
        leadId,
      });
      continue;
    }

    mappedLeads.push({
      id: leadId,
      campaign_id: campaignId,
      business_name: lead.business_name ?? "Unknown Business",
      address: lead.address ?? "",
      phone: lead.phone ?? "",
      website: lead.website ?? "",
      email: lead.email ?? "",
      confidence_score: coerceNumber(lead.confidence_score, 0),
      validation_status: normalizeValidationStatus(
        enrichmentData?.validationStatus ?? lead.validation_status
      ),
      created_at: lead.created_at ?? new Date().toISOString(),
      cost_to_acquire: coerceNumber(rawCost, 0),
      data_sources: deriveDataSources(enrichmentData),
      enrichment_tier:
        tierFromData ??
        (metricsAny?.tier as string | undefined) ??
        (metricsAny?.tier_name as string | undefined) ??
        undefined,
      vault_secured: true,
      enrichment_data: enrichmentData,
    });
  }

  const leadsQualified = mappedLeads.filter(
    (lead) => lead.confidence_score >= 70
  ).length;
  const leadsValidated = mappedLeads.filter(
    (lead) => lead.validation_status === "validated"
  ).length;

  const totalFoundRaw = campaignRecord.results_count ?? mappedLeads.length ?? 0;

  const campaignResult: CampaignResult = {
    campaign_id: campaignRecord.id,
    business_type: campaignRecord.business_type ?? undefined,
    location: campaignRecord.location ?? undefined,
    status: normalizeCampaignStatus(campaignRecord.status),
    progress: 100,
    total_cost: coerceNumber(
      campaignRecord.total_cost ?? metricsAny?.total_cost ?? 0,
      0
    ),
    leads_found: coerceNumber(totalFoundRaw, mappedLeads.length),
    leads_qualified: leadsQualified,
    leads_validated: leadsValidated,
    created_at: campaignRecord.created_at ?? new Date().toISOString(),
    completed_at: campaignRecord.updated_at ?? undefined,
    tier_used:
      (metricsAny?.tier as string | undefined) ??
      (metricsAny?.tier_name as string | undefined) ??
      undefined,
    vault_secured: true,
    cache_performance: undefined,
  };

  return {
    campaignResult,
    leads: mappedLeads,
  };
};
