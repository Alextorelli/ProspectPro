import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useCampaignStore } from "../stores/campaignStore";
import type { CampaignConfig, BusinessDiscoveryResponse } from "../types";

// Use local API endpoint instead of Supabase Edge Function
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3100";
const BUSINESS_DISCOVERY_ENDPOINT = `${API_BASE_URL}/api/business/discover-businesses`;

export const useBusinessDiscovery = () => {
  const { addCampaign, setCurrentCampaign, addLeads, setLoading, setError } =
    useCampaignStore();
  const [progress, setProgress] = useState(0);

  const discoveryMutation = useMutation({
    mutationFn: async (
      config: CampaignConfig
    ): Promise<BusinessDiscoveryResponse> => {
      setLoading(true);
      setError(null);
      setProgress(0);

      try {
        const response = await fetch(BUSINESS_DISCOVERY_ENDPOINT, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            businessType: config.search_terms,
            location: config.location,
            maxResults: config.max_results,
            budgetLimit: config.budget_limit,
            requireCompleteContacts: false,
            minConfidenceScore: config.min_confidence_score,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Discovery failed: ${response.status} ${errorText}`);
        }

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || "Discovery failed");
        }

        // Transform the response to match expected interface
        const transformedData: BusinessDiscoveryResponse = {
          campaign_id: result.campaignId,
          total_found: result.results?.totalFound || 0,
          qualified_count: result.results?.qualified || 0,
          total_cost: result.costs?.totalCost || 0,
          processing_time: result.performance?.processingTime || "0s",
          businesses: (result.leads || []).map((lead: any) => ({
            id: Math.random().toString(36).substr(2, 9),
            business_name: lead.businessName || "Unknown Business",
            address: lead.address,
            phone: lead.phone,
            website: lead.website,
            email: lead.email,
            confidence_score: lead.optimizedScore || 0,
            validation_status: "validated" as const,
            created_at: new Date().toISOString(),
          })),
        };

        return transformedData;
      } catch (error) {
        console.error("Business discovery error:", error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    onSuccess: (data: BusinessDiscoveryResponse) => {
      // Create campaign record
      const campaign = {
        campaign_id: data.campaign_id,
        status: "completed" as const,
        progress: 100,
        total_cost: data.total_cost,
        leads_found: data.total_found,
        leads_qualified: data.qualified_count,
        leads_validated: data.businesses.filter(
          (b: any) => b.validation_status === "validated"
        ).length,
        created_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
      };

      addCampaign(campaign);
      setCurrentCampaign(campaign);
      addLeads(data.businesses);
      setProgress(100);
    },
    onError: (error: any) => {
      setError(error instanceof Error ? error.message : "Discovery failed");
      setProgress(0);
    },
  });

  return {
    startDiscovery: discoveryMutation.mutate,
    isDiscovering: discoveryMutation.isPending,
    progress,
    error: discoveryMutation.error,
    data: discoveryMutation.data,
  };
};
