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
    console.error("⚠️ Campaign store received a non-array leads payload", {
      type: typeof leads,
    });
    return [];
  }

  const sanitized = leads
    .map((lead) => sanitizeLead(lead, fallbackCampaignId))
    .filter((lead): lead is BusinessLead => Boolean(lead));

  if (sanitized.length < leads.length) {
    console.warn("🧹 Filtered invalid leads before updating campaign store", {
      received: leads.length,
      retained: sanitized.length,
    });
  }

  return sanitized;
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
        leads: state.leads.map((l) =>
          l.id === leadId ? { ...l, ...updates } : l
        ),
      })),

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
