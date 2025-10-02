import { createClient } from "@supabase/supabase-js";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useCampaignStore } from "../stores/campaignStore";
import type { BusinessDiscoveryResponse, CampaignConfig } from "../types";

// Supabase configuration
const supabaseUrl = "https://sriycekxdqnesdsgwiuc.supabase.co";
const supabaseAnonKey = "sb_publishable_GaGUGZiy1Q6ncO7kUZqAVA_SFuCyYaM";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
      setProgress(10);

      try {
        console.log("🚀 Starting business discovery with config:", config);

        const { data, error } = await supabase.functions.invoke(
          "business-discovery-optimized",
          {
            body: {
              businessType: config.search_terms,
              location: config.location,
              maxResults: config.max_results,
              budgetLimit: config.budget_limit,
              requireCompleteContacts: false,
              minConfidenceScore: config.min_confidence_score,
              apolloDiscovery: config.include_email_validation,
              chamberVerification: true,
              professionalLicensing: true,
              tradeAssociations: true,
            },
          }
        );

        if (error) {
          console.error("Edge Function error:", error);
          throw new Error(`Discovery failed: ${error.message}`);
        }

        if (!data) {
          throw new Error("No data returned from discovery");
        }

        console.log("✅ Discovery response:", data);
        setProgress(80);

        // Transform the response to match expected interface
        const transformedData: BusinessDiscoveryResponse = {
          campaign_id:
            data.campaignId || Math.random().toString(36).substr(2, 9),
          total_found: data.results?.totalFound || 0,
          qualified_count: data.results?.qualified || 0,
          total_cost: data.costs?.totalCost || 0,
          processing_time: data.performance?.processingTime || "0s",
          businesses: (data.leads || []).map((lead: any) => ({
            id: Math.random().toString(36).substr(2, 9),
            business_name: lead.businessName || "Unknown Business",
            address: lead.address,
            phone: lead.phone,
            website: lead.website,
            email: lead.email,
            confidence_score: lead.optimizedScore || lead.confidenceScore || 0,
            validation_status: "validated" as const,
            created_at: new Date().toISOString(),
          })),
        };

        setProgress(100);
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
