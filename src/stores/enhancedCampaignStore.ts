import { create } from "zustand";
import type { BusinessLead, CampaignResult, CampaignStore } from "../types";

interface CampaignActions {
  addCampaign: (campaign: CampaignResult) => void;
  updateCampaign: (
    campaignId: string,
    updates: Partial<CampaignResult>
  ) => void;
  setCurrentCampaign: (campaign: CampaignResult | null) => void;
  setCurrentCampaignId: (campaignId: string | null) => void;
  addLeads: (leads: BusinessLead[]) => void;
  setCampaignLeads: (campaignId: string, leads: BusinessLead[]) => void;
  updateLead: (leadId: string, updates: Partial<BusinessLead>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearLeads: () => void;
  reset: () => void;
  // Enhanced monitoring capabilities
  addJobProgress: (jobId: string, progress: JobProgress) => void;
  updateJobProgress: (jobId: string, updates: Partial<JobProgress>) => void;
  getJobProgress: (jobId: string) => JobProgress | undefined;
  addApiUsageMetric: (metric: ApiUsageMetric) => void;
  getApiUsageStats: () => ApiUsageStats;
  clearOldMetrics: (olderThanDays?: number) => void;
}

interface JobProgress {
  id: string;
  campaignId: string;
  status: "pending" | "processing" | "completed" | "failed";
  progress: number; // 0-100
  currentStage: string;
  startedAt: Date;
  completedAt?: Date;
  estimatedTimeRemaining?: number;
  metrics?: {
    leadsFound: number;
    leadsEnriched: number;
    totalCost: number;
    processingTimeMs: number;
  };
  error?: string;
}

interface ApiUsageMetric {
  id: string;
  campaignId?: string;
  service: string; // 'google_places', 'hunter_io', 'neverbounce', etc.
  operation: string; // 'search', 'details', 'verify', etc.
  cost: number;
  requestCount: number;
  responseTimeMs: number;
  success: boolean;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

interface ApiUsageStats {
  totalCost: number;
  totalRequests: number;
  averageResponseTime: number;
  successRate: number;
  costByService: Record<string, number>;
  requestsByService: Record<string, number>;
  dailySpend: Record<string, number>;
  monthlySpend: Record<string, number>;
}

interface EnhancedCampaignStore extends CampaignStore {
  jobProgress: Record<string, JobProgress>;
  apiUsageMetrics: ApiUsageMetric[];
  lastMetricsCleanup: Date;
}

const createInitialState = (): EnhancedCampaignStore => ({
  campaigns: [],
  currentCampaign: null,
  currentCampaignId: null,
  leads: [],
  isLoading: false,
  error: null,
  jobProgress: {},
  apiUsageMetrics: [],
  lastMetricsCleanup: new Date(),
});

const initialState = createInitialState();

const getCampaignKey = (campaign: CampaignResult): string | null => {
  if (campaign.campaign_id) {
    return campaign.campaign_id;
  }

  const fallbackId = (campaign as { id?: string | number }).id;
  return fallbackId != null ? String(fallbackId) : null;
};

const dedupeCampaigns = (campaigns: CampaignResult[]): CampaignResult[] => {
  const seen = new Set<string>();
  const uniqueCampaigns: CampaignResult[] = [];

  for (const campaign of campaigns) {
    const key = getCampaignKey(campaign);
    if (key === null) {
      uniqueCampaigns.push(campaign);
      continue;
    }

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    uniqueCampaigns.push(campaign);
  }

  return uniqueCampaigns;
};

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
    console.error("⚠️ Unable to sanitize enrichment data payload", error);
    return undefined;
  }
};

const sanitizeLead = (
  lead: BusinessLead | null | undefined,
  fallbackCampaignId: string | null
): BusinessLead | null => {
  if (!lead || lead.id == null) {
    return null;
  }

  const campaignId = lead.campaign_id ?? fallbackCampaignId;

  if (!campaignId) {
    return null;
  }

  const enrichmentData = sanitizeEnrichmentData(lead.enrichment_data);

  return {
    ...lead,
    id: String(lead.id),
    campaign_id: String(campaignId),
    enrichment_data: enrichmentData,
  };
};

const sanitizeLeadCollection = (
  leads: BusinessLead[] | null | undefined,
  fallbackCampaignId: string | null
): BusinessLead[] => {
  if (!Array.isArray(leads)) {
    console.error(
      "⚠️ Enhanced campaign store received a non-array leads payload",
      {
        type: typeof leads,
      }
    );
    return [];
  }

  const sanitized = leads
    .map((lead) => sanitizeLead(lead, fallbackCampaignId))
    .filter((lead): lead is BusinessLead => Boolean(lead));

  if (sanitized.length < leads.length) {
    console.warn(
      "🧹 Filtered invalid leads before updating enhanced campaign store",
      {
        received: leads.length,
        retained: sanitized.length,
      }
    );
  }

  return sanitized;
};

export const useCampaignStore = create<
  EnhancedCampaignStore & CampaignActions
>()((set, get) => ({
  ...initialState,

  addCampaign: (campaign) =>
    set((state) => ({
      campaigns: dedupeCampaigns([campaign, ...state.campaigns]),
    })),

  updateCampaign: (campaignId, updates) =>
    set((state) => ({
      campaigns: dedupeCampaigns(
        state.campaigns.map((c) =>
          c.campaign_id === campaignId ? { ...c, ...updates } : c
        )
      ),
      currentCampaign:
        state.currentCampaign?.campaign_id === campaignId
          ? { ...state.currentCampaign, ...updates }
          : state.currentCampaign,
    })),

  setCurrentCampaign: (campaign) =>
    set({
      currentCampaign: campaign,
      currentCampaignId: campaign?.campaign_id ?? null,
    }),

  setCurrentCampaignId: (campaignId) => set({ currentCampaignId: campaignId }),

  addLeads: (leads) =>
    set((state) => {
      const merged = new Map<string, BusinessLead>();
      const existingLeads = state.leads || [];
      const incomingLeads = sanitizeLeadCollection(leads, null);

      for (const lead of existingLeads) {
        if (lead?.id != null) {
          merged.set(String(lead.id), lead);
        }
      }

      for (const lead of incomingLeads) {
        merged.set(String(lead.id), lead);
      }

      return { leads: Array.from(merged.values()) };
    }),

  setCampaignLeads: (campaignId, leads) =>
    set((state) => {
      const merged = new Map<string, BusinessLead>();

      // Safe iteration - check if leads array exists
      const existingLeads = state.leads || [];
      const incomingLeads = sanitizeLeadCollection(leads, campaignId);

      for (const lead of existingLeads) {
        if (lead?.campaign_id === campaignId) {
          continue;
        }
        if (lead?.id != null) {
          merged.set(String(lead.id), lead);
        }
      }

      for (const lead of incomingLeads) {
        merged.set(String(lead.id), lead);
      }

      return { leads: Array.from(merged.values()) };
    }),

  updateLead: (leadId, updates) =>
    set((state) => ({
      leads: state.leads.map((lead) =>
        lead.id === leadId ? { ...lead, ...updates } : lead
      ),
    })),

  setLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error }),

  clearLeads: () => set({ leads: [] }),

  reset: () => set(createInitialState()),

  // Enhanced monitoring methods
  addJobProgress: (jobId, progress) =>
    set((state) => ({
      jobProgress: {
        ...state.jobProgress,
        [jobId]: progress,
      },
    })),

  updateJobProgress: (jobId, updates) =>
    set((state) => ({
      jobProgress: {
        ...state.jobProgress,
        [jobId]: state.jobProgress[jobId]
          ? { ...state.jobProgress[jobId], ...updates }
          : {
              id: jobId,
              campaignId: "",
              status: "pending" as const,
              progress: 0,
              currentStage: "",
              startedAt: new Date(),
              ...updates,
            },
      },
    })),

  getJobProgress: (jobId) => get().jobProgress[jobId],

  addApiUsageMetric: (metric) =>
    set((state) => ({
      apiUsageMetrics: [metric, ...state.apiUsageMetrics],
    })),

  getApiUsageStats: (): ApiUsageStats => {
    const metrics = get().apiUsageMetrics;
    const totalCost = metrics.reduce((sum, metric) => sum + metric.cost, 0);
    const totalRequests = metrics.reduce(
      (sum, metric) => sum + metric.requestCount,
      0
    );
    const totalResponseTime = metrics.reduce(
      (sum, metric) => sum + metric.responseTimeMs,
      0
    );
    const successfulRequests = metrics.filter(
      (metric) => metric.success
    ).length;

    const costByService: Record<string, number> = {};
    const requestsByService: Record<string, number> = {};
    const dailySpend: Record<string, number> = {};
    const monthlySpend: Record<string, number> = {};

    metrics.forEach((metric) => {
      costByService[metric.service] =
        (costByService[metric.service] || 0) + metric.cost;
      requestsByService[metric.service] =
        (requestsByService[metric.service] || 0) + metric.requestCount;

      const timestamp =
        metric.timestamp instanceof Date
          ? metric.timestamp
          : new Date(metric.timestamp);

      if (Number.isNaN(timestamp.getTime())) {
        return;
      }

      const dateKey = timestamp.toISOString().split("T")[0];
      const monthKey = dateKey.substring(0, 7);

      dailySpend[dateKey] = (dailySpend[dateKey] || 0) + metric.cost;
      monthlySpend[monthKey] = (monthlySpend[monthKey] || 0) + metric.cost;
    });

    return {
      totalCost,
      totalRequests,
      averageResponseTime:
        metrics.length > 0 ? totalResponseTime / metrics.length : 0,
      successRate: metrics.length > 0 ? successfulRequests / metrics.length : 0,
      costByService,
      requestsByService,
      dailySpend,
      monthlySpend,
    };
  },

  clearOldMetrics: (olderThanDays = 30) => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - olderThanDays);

    set((state) => ({
      apiUsageMetrics: state.apiUsageMetrics.filter((metric) => {
        const timestamp =
          metric.timestamp instanceof Date
            ? metric.timestamp
            : new Date(metric.timestamp);

        return Number.isNaN(timestamp.getTime()) ? true : timestamp > cutoff;
      }),
      lastMetricsCleanup: new Date(),
    }));
  },
}));

// Export types for use in components
export type { ApiUsageMetric, ApiUsageStats, JobProgress };
