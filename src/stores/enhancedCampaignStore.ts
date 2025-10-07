import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { BusinessLead, CampaignResult, CampaignStore } from "../types";

interface CampaignActions {
  addCampaign: (campaign: CampaignResult) => void;
  updateCampaign: (
    campaignId: string,
    updates: Partial<CampaignResult>
  ) => void;
  setCurrentCampaign: (campaign: CampaignResult | null) => void;
  addLeads: (leads: BusinessLead[]) => void;
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
  dailySpend: Record<string, number>; // ISO date string -> cost
  monthlySpend: Record<string, number>; // YYYY-MM -> cost
}

interface EnhancedCampaignStore extends CampaignStore {
  jobProgress: Record<string, JobProgress>;
  apiUsageMetrics: ApiUsageMetric[];
  lastMetricsCleanup: Date;
}

const initialState: EnhancedCampaignStore = {
  campaigns: [],
  currentCampaign: null,
  leads: [],
  isLoading: false,
  error: null,
  jobProgress: {},
  apiUsageMetrics: [],
  lastMetricsCleanup: new Date(),
};

export const useCampaignStore = create<
  EnhancedCampaignStore & CampaignActions
>()(
  persist(
    (set, get) => ({
      ...initialState,

      addCampaign: (campaign) =>
        set((state) => ({
          campaigns: [campaign, ...state.campaigns],
        })),

      updateCampaign: (campaignId, updates) =>
        set((state) => ({
          campaigns: state.campaigns.map((c) =>
            c.campaign_id === campaignId ? { ...c, ...updates } : c
          ),
          currentCampaign:
            state.currentCampaign?.campaign_id === campaignId
              ? { ...state.currentCampaign, ...updates }
              : state.currentCampaign,
        })),

      setCurrentCampaign: (campaign) => set({ currentCampaign: campaign }),

      addLeads: (leads) =>
        set((state) => ({
          leads: [...state.leads, ...leads],
        })),

      updateLead: (leadId, updates) =>
        set((state) => ({
          leads: state.leads.map((l) =>
            l.id === leadId ? { ...l, ...updates } : l
          ),
        })),

      setLoading: (loading) => set({ isLoading: loading }),

      setError: (error) => set({ error }),

      clearLeads: () => set({ leads: [] }),

      reset: () => set(initialState),

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
        const totalCost = metrics.reduce((sum, m) => sum + m.cost, 0);
        const totalRequests = metrics.reduce(
          (sum, m) => sum + m.requestCount,
          0
        );
        const totalResponseTime = metrics.reduce(
          (sum, m) => sum + m.responseTimeMs,
          0
        );
        const successfulRequests = metrics.filter((m) => m.success).length;

        const costByService: Record<string, number> = {};
        const requestsByService: Record<string, number> = {};
        const dailySpend: Record<string, number> = {};
        const monthlySpend: Record<string, number> = {};

        metrics.forEach((metric) => {
          // By service
          costByService[metric.service] =
            (costByService[metric.service] || 0) + metric.cost;
          requestsByService[metric.service] =
            (requestsByService[metric.service] || 0) + metric.requestCount;

          // By date
          const dateKey = metric.timestamp.toISOString().split("T")[0]; // YYYY-MM-DD
          const monthKey = dateKey.substring(0, 7); // YYYY-MM

          dailySpend[dateKey] = (dailySpend[dateKey] || 0) + metric.cost;
          monthlySpend[monthKey] = (monthlySpend[monthKey] || 0) + metric.cost;
        });

        return {
          totalCost,
          totalRequests,
          averageResponseTime:
            totalRequests > 0 ? totalResponseTime / totalRequests : 0,
          successRate:
            totalRequests > 0 ? successfulRequests / totalRequests : 1,
          costByService,
          requestsByService,
          dailySpend,
          monthlySpend,
        };
      },

      clearOldMetrics: (olderThanDays = 30) =>
        set((state) => {
          const cutoffDate = new Date();
          cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

          return {
            apiUsageMetrics: state.apiUsageMetrics.filter(
              (m) => m.timestamp > cutoffDate
            ),
            lastMetricsCleanup: new Date(),
          };
        }),
    }),
    {
      name: "campaign-store",
      partialize: (state) => ({
        campaigns: state.campaigns,
        leads: state.leads,
        jobProgress: state.jobProgress,
        apiUsageMetrics: state.apiUsageMetrics.slice(0, 1000), // Keep last 1000 metrics
        lastMetricsCleanup: state.lastMetricsCleanup,
      }),
    }
  )
);

// Export types for use in components
export type { ApiUsageMetric, ApiUsageStats, JobProgress };
