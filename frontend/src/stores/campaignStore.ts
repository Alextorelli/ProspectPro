import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CampaignStore, CampaignResult, BusinessLead } from '../types'

interface CampaignActions {
  addCampaign: (campaign: CampaignResult) => void
  updateCampaign: (campaignId: string, updates: Partial<CampaignResult>) => void
  setCurrentCampaign: (campaign: CampaignResult | null) => void
  addLeads: (leads: BusinessLead[]) => void
  updateLead: (leadId: string, updates: Partial<BusinessLead>) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearLeads: () => void
  reset: () => void
}

const initialState: CampaignStore = {
  campaigns: [],
  currentCampaign: null,
  leads: [],
  isLoading: false,
  error: null,
}

export const useCampaignStore = create<CampaignStore & CampaignActions>()(
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
      
      setCurrentCampaign: (campaign) =>
        set({ currentCampaign: campaign }),
      
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
    }),
    {
      name: 'campaign-store',
      partialize: (state) => ({
        campaigns: state.campaigns,
        leads: state.leads,
      }),
    }
  )
)