import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { ENRICHMENT_TIERS, ensureSession, supabase } from "../lib/supabase";
import { useCampaignStore } from "../stores/campaignStore";
import type { BusinessDiscoveryResponse, CampaignConfig } from "../types";

export const useBusinessDiscovery = (
  onJobCreated?: (jobData: {
    jobId: string;
    campaignId: string;
    status: string;
    estimatedTime?: number;
  }) => void
) => {
  const { sessionUserId } = useAuth();
  const { setLoading, setError } = useCampaignStore();
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

        // Call background task business discovery with authentication
        const { data, error } = await supabase.functions.invoke(
          "business-discovery-background",
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
          console.error("❌ Background discovery error:", error);
          throw new Error(`Discovery failed: ${error.message}`);
        }

        if (!data || !data.success) {
          throw new Error("No data returned from background discovery");
        }

        console.log("✅ Background discovery response:", data);

        // For background tasks, we get jobId and campaignId immediately
        // The actual processing happens in the background
        const transformedData: BusinessDiscoveryResponse = {
          campaign_id: data.campaignId,
          job_id: data.jobId, // New: job ID for tracking progress
          status: data.status, // New: processing status
          estimated_time: data.estimatedTime, // New: estimated completion time
          realtime_channel: data.realtimeChannel, // New: for real-time updates
          total_found: 0, // Will be updated via real-time
          qualified_count: 0, // Will be updated via real-time
          total_cost: 0, // Will be updated via real-time
          processing_time: "< 100ms", // Immediate response
          tier_used: tierConfig.name,
          cache_performance: undefined,
          vault_status: "secured",
          census_intelligence: undefined,
          businesses: [], // Will be populated via real-time updates
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
    onSuccess: (data: BusinessDiscoveryResponse) => {
      console.log("✅ Background job created:", data);

      // For background jobs, we don't create the full campaign record immediately
      // The progress page will handle real-time updates and final campaign creation

      setProgress(100);
      setCurrentStage("Background processing started! 🚀");

      // Navigate to progress page with job ID
      if (data.job_id && data.campaign_id) {
        const jobData = {
          jobId: data.job_id,
          campaignId: data.campaign_id,
          status: data.status || "pending",
          estimatedTime: data.estimated_time,
        };

        console.log("Job started:", jobData);

        // Call the navigation callback if provided
        if (onJobCreated) {
          onJobCreated(jobData);
        }
      }
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
