import {
  BusinessLead,
  ConfidenceBucket,
  DashboardStats,
  LeadFilter,
} from "../types";

export const CONFIDENCE_BUCKETS: Record<
  ConfidenceBucket,
  { min: number; max: number; label: string }
> = {
  high: { min: 80, max: 100, label: "High (≥80%)" },
  medium: { min: 60, max: 79, label: "Medium (60-79%)" },
  low: { min: 0, max: 59, label: "Low (<60%)" },
};

const normalizeDate = (value?: string) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const getDateRangePreset = (
  days: number
): { start: string; end: string } => {
  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() - days);
  return {
    start: start.toISOString(),
    end: now.toISOString(),
  };
};

export const applyLeadFilters = (
  leads: BusinessLead[],
  filters: LeadFilter
): BusinessLead[] => {
  if (!leads.length) {
    return leads;
  }

  return leads.filter((lead) => {
    const { confidenceBucket, validationStatuses, enrichmentTier, dateRange } =
      filters;

    if (confidenceBucket) {
      const bucket = CONFIDENCE_BUCKETS[confidenceBucket];
      const score = lead.confidence_score ?? 0;
      if (score < bucket.min || score > bucket.max) {
        return false;
      }
    }

    if (validationStatuses?.length) {
      if (!validationStatuses.includes(lead.validation_status)) {
        return false;
      }
    }

    if (enrichmentTier) {
      const normalizedFilter = enrichmentTier.toLowerCase();
      const leadTier = (
        lead.enrichment_tier ||
        lead.enrichment_data?.enrichmentTier ||
        ""
      ).toLowerCase();

      if (!leadTier || leadTier !== normalizedFilter) {
        return false;
      }
    }

    if (dateRange) {
      const createdAt = normalizeDate(lead.created_at);
      const start = normalizeDate(dateRange.start);
      const end = normalizeDate(dateRange.end);

      if (createdAt && start && end) {
        if (createdAt < start || createdAt > end) {
          return false;
        }
      }
    }

    return true;
  });
};

export const calculateDashboardStats = (
  leads: BusinessLead[],
  campaignCount: number
): DashboardStats => {
  if (!leads.length) {
    return {
      totalLeads: 0,
      qualifiedLeads: 0,
      totalCampaigns: campaignCount,
      averageConfidence: 0,
    };
  }

  const totalConfidence = leads.reduce(
    (sum, lead) => sum + (lead.confidence_score ?? 0),
    0
  );

  const qualifiedLeads = leads.filter(
    (lead) => (lead.confidence_score ?? 0) >= 80
  );

  return {
    totalLeads: leads.length,
    qualifiedLeads: qualifiedLeads.length,
    totalCampaigns: campaignCount,
    averageConfidence: Math.round((totalConfidence / leads.length) * 10) / 10,
  };
};
