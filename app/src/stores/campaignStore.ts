import { create } from "zustand";
import type { BusinessLead, CampaignResult, CampaignStore } from "../types";
import { sanitizeLeadCollection } from "./utils/leadSanitizers";

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
  ensureUniqueCampaignHistory: () => void;
}

const initialState: CampaignStore = {
  campaigns: [],
  currentCampaign: null,
  currentCampaignId: null,
  leads: [],
  isLoading: false,
  error: null,
};

const getCampaignKey = (campaign: CampaignResult): string | null => {
  if (campaign.campaign_id) {
    return campaign.campaign_id;
  }

  const fallbackId = (campaign as { id?: string | number }).id;
  return fallbackId != null ? String(fallbackId) : null;
};

// Keeps newest campaign entry while removing duplicates by campaign identifier.
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

export const useCampaignStore = create<CampaignStore & CampaignActions>()(
  (set) => ({
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

    setCurrentCampaignId: (campaignId) =>
      set({ currentCampaignId: campaignId }),

    addLeads: (leads) =>
      set((state) => {
        if (!Array.isArray(leads)) {
          console.warn("[campaignStore] addLeads called with non-array", {
            type: typeof leads,
          });
          return state;
        }

        try {
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
        } catch (error) {
          console.error("[campaignStore] addLeads error", {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
          });
          return state;
        }
      }),

    setCampaignLeads: (campaignId, leads) =>
      set((state) => {
        if (!campaignId) {
          console.warn(
            "[campaignStore] setCampaignLeads called without campaignId",
            {
              leadsType: typeof leads,
            }
          );
          return state;
        }

        if (!Array.isArray(leads)) {
          console.warn("[campaignStore] Non-array leads payload ignored", {
            campaignId,
            payload: leads,
          });
          return state;
        }

        try {
          const merged = new Map<string, BusinessLead>();
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

          if (incomingLeads.length === 0 && leads.length > 0) {
            console.warn(
              "[campaignStore] All incoming leads dropped by sanitizer",
              {
                campaignId,
                originalSize: leads.length,
              }
            );
          }

          for (const lead of incomingLeads) {
            merged.set(String(lead.id), lead);
          }

          return { leads: Array.from(merged.values()) };
        } catch (error) {
          console.error("[campaignStore] setCampaignLeads error", {
            campaignId,
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
          });
          return state;
        }
      }),

    updateLead: (leadId, updates) =>
      set((state) => {
        try {
          return {
            leads: state.leads.map((l) =>
              l.id === leadId ? { ...l, ...updates } : l
            ),
          };
        } catch (error) {
          console.error("[campaignStore] updateLead error", {
            leadId,
            error: error instanceof Error ? error.message : String(error),
          });
          return state;
        }
      }),

    setLoading: (loading) => set({ isLoading: loading }),

    setError: (error) => set({ error }),

    clearLeads: () => set({ leads: [] }),

    reset: () => set(initialState),

    ensureUniqueCampaignHistory: () =>
      set((state) => ({
        campaigns: dedupeCampaigns(state.campaigns),
      })),
  })
);
