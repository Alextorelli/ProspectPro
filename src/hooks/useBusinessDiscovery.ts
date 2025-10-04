import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { ENRICHMENT_TIERS, ensureSession, supabase } from "../lib/supabase";
import { useCampaignStore } from "../stores/campaignStore";
import type { BusinessDiscoveryResponse, CampaignConfig } from "../types";

export const useBusinessDiscovery = () => {
  const { sessionUserId } = useAuth();
  const { addCampaign, setCurrentCampaign, addLeads, setLoading, setError } =
    useCampaignStore();
  const [progress, setProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState<string>("");
  const [cacheStats] = useState<any>(null);

  const discoveryMutation = useMutation({
    mutationFn: async (
      config: CampaignConfig & { selectedTier?: keyof typeof ENRICHMENT_TIERS }
    ): Promise<BusinessDiscoveryResponse> => {
      setLoading(true);
      setError(null);
      setProgress(10);
      setCurrentStage("Initializing user-aware discovery...");

      try {
        console.log("🚀 Starting user-aware business discovery:", config);
        console.log("👤 Session User ID:", sessionUserId);

        // Ensure we have a valid session before calling Edge Function
        const hasSession = await ensureSession();
        if (!hasSession) {
          throw new Error(
            "Failed to establish authentication session. Please refresh the page."
          );
        }

        // Determine enrichment tier
        const tier = config.selectedTier || "PROFESSIONAL";
        const tierConfig = ENRICHMENT_TIERS[tier];

        setCurrentStage(
          `Using ${tierConfig.name} tier ($${tierConfig.price}/lead)`
        );
        setProgress(20);

        // Call user-aware business discovery with authentication
        const { data, error } = await supabase.functions.invoke(
          "business-discovery-user-aware",
          {
            body: {
              businessType: config.search_terms || config.business_type,
              location: config.location,
              maxResults: config.max_results,
              budgetLimit: config.max_results * tierConfig.price,
              minConfidenceScore: config.min_confidence_score || 50,
              sessionUserId:
                sessionUserId ||
                `session_${Date.now()}_${Math.random()
                  .toString(36)
                  .substr(2, 9)}`,
            },
          }
        );

        if (error) {
          console.error("❌ User-aware discovery error:", error);
          throw new Error(`Discovery failed: ${error.message}`);
        }

        if (!data || !data.success) {
          throw new Error("No data returned from user-aware discovery");
        }

        console.log("✅ User-aware discovery response:", data);

        // Update progress
        setProgress(90);
        setCurrentStage("Finalizing results...");

        // Transform the user-aware discovery response
        const transformedData: BusinessDiscoveryResponse = {
          campaign_id: data.campaignId,
          total_found: data.results?.totalFound || 0,
          qualified_count: data.results?.qualified || 0,
          total_cost:
            data.optimization?.totalCost ||
            config.max_results * tierConfig.price,
          processing_time: data.optimization?.processingTime || "0ms",
          tier_used: tierConfig.name,
          cache_performance: undefined,
          vault_status: "secured",
          census_intelligence: undefined,
          businesses: (data.leads || []).map((lead: any) => ({
            id: Math.random().toString(36).substr(2, 9),
            campaign_id: data.campaignId,
            business_name: lead.businessName || "Unknown Business",
            address: lead.address,
            phone: lead.phone,
            website: lead.website,
            email: lead.email,
            confidence_score: lead.optimizedScore || 0,
            validation_status: "validated" as const,
            created_at: new Date().toISOString(),
            cost_to_acquire: lead.validationCost || tierConfig.price,
            data_sources: lead.enhancementData?.verificationSources || [
              "google_places",
            ],
            enrichment_tier: tierConfig.name,
            vault_secured: true,
          })),
        };

        setProgress(100);
        setCurrentStage("Complete! 🎉");
        return transformedData;
      } catch (error) {
        console.error("❌ User-aware discovery error:", error);
        setCurrentStage("Failed ❌");
        throw error;
      } finally {
        setLoading(false);
      }
    },
    onSuccess: (
      data: BusinessDiscoveryResponse,
      variables: CampaignConfig & {
        selectedTier?: keyof typeof ENRICHMENT_TIERS;
      }
    ) => {
      // Create campaign record with user-aware discovery data
      const campaign = {
        campaign_id: data.campaign_id,
        business_type: variables.business_type || variables.search_terms,
        location: variables.location,
        status: "completed" as const,
        progress: 100,
        total_cost: data.total_cost,
        leads_found: data.total_found,
        leads_qualified: data.qualified_count,
        leads_validated: data.businesses.filter(
          (b: any) => b.validation_status === "validated"
        ).length,
        tier_used: data.tier_used,
        vault_secured: true,
        cache_performance: data.cache_performance,
        created_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
      };

      addCampaign(campaign);
      setCurrentCampaign(campaign);
      addLeads(data.businesses);
      setProgress(100);
      setCurrentStage("Results ready! 🎯");
    },
    onError: (error: any) => {
      setError(
        error instanceof Error ? error.message : "User-aware discovery failed"
      );
      setProgress(0);
      setCurrentStage("Failed ❌");
    },
  });

  return {
    startDiscovery: discoveryMutation.mutate,
    isDiscovering: discoveryMutation.isPending,
    progress,
    currentStage,
    cacheStats,
    error: discoveryMutation.error,
    data: discoveryMutation.data,
  };
};
