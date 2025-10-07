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

export const transformCampaignData = (
  campaignRecord: any,
  leadsRecords: any[] = [],
  options: TransformOptions = {}
): CampaignTransformResult => {
  if (!campaignRecord) {
    throw new Error("Campaign record is required");
  }

  const metricsAny = options.metrics ?? {};

  const mappedLeads: BusinessLead[] = leadsRecords.map((lead) => {
    const enrichmentData = lead.enrichment_data ?? undefined;
    const rawCost =
      lead.validation_cost ??
      enrichmentData?.processingMetadata?.totalCost ??
      0;

    const tierFromData =
      enrichmentData?.processingMetadata?.enrichmentTier ??
      enrichmentData?.enrichmentTier;

    return {
      id: String(lead.id),
      campaign_id: lead.campaign_id ?? campaignRecord.id,
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
    };
  });

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
