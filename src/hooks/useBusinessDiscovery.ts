import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  EDGE_FUNCTIONS_URL,
  ENRICHMENT_TIERS,
  SUPABASE_ANON_TOKEN,
  ensureSession,
  getSessionToken,
} from "../lib/supabase";
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
  const { user } = useAuth();
  const {
    setLoading,
    setError,
    clearLeads,
    setCurrentCampaign,
    setCurrentCampaignId,
  } = useCampaignStore();
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

      // Reset any existing campaign context before starting a new discovery
      clearLeads();
      setCurrentCampaign(null);
      setCurrentCampaignId(null);

      try {
        console.log("🚀 Starting user-aware business discovery:", config);

        // Ensure we have a valid session before calling Edge Function
        const hasSession = await ensureSession();
        if (!hasSession || !user?.id) {
          throw new Error("Please sign in to run a discovery campaign.");
        }

        // Determine enrichment tier
        const tier = config.selectedTier || "PROFESSIONAL";
        const tierConfig = ENRICHMENT_TIERS[tier];
        const keywordList = config.keywords
          ? config.keywords
              .split(",")
              .map((value) => value.trim())
              .filter(Boolean)
          : undefined;

        const discoveryOptions = {
          tradeAssociation: config.trade_association ?? false,
          professionalLicense: config.professional_license ?? false,
          chamberVerification: config.chamber_verification ?? false,
          apolloDiscovery: tier === "ENTERPRISE",
        };

        setCurrentStage(
          `Using ${tierConfig.name} tier ($${tierConfig.price}/lead)`
        );
        setProgress(20);

        const accessToken = await getSessionToken();

        const billingContext = {
          tier,
          tierName: tierConfig.name,
          unitPrice: tierConfig.price,
          estimatedBudget: config.max_results * tierConfig.price,
          currency: "USD",
        };

        // Call background task business discovery with authentication
        const requestBody = {
          businessType: config.business_type || config.search_terms,
          location: config.location,
          keywords: keywordList,
          searchRadius: config.search_radius,
          expandGeography: config.expand_geography,
          maxResults: config.max_results,
          budgetLimit: config.max_results * tierConfig.price,
          minConfidenceScore: config.min_confidence_score || 50,
          tierKey: tier,
          tierName: tierConfig.name,
          tierPrice: tierConfig.price,
          options: discoveryOptions,
          sessionUserId: user.id,
          userId: user.id,
          billingContext,
        };

        if (!accessToken) {
          throw new Error(
            "Unable to read session token. Please sign in again."
          );
        }

        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          apikey: SUPABASE_ANON_TOKEN,
          "X-Prospect-Session": accessToken,
        };

        const response = await fetch(
          `${EDGE_FUNCTIONS_URL}/business-discovery-background`,
          {
            method: "POST",
            headers,
            body: JSON.stringify(requestBody),
          }
        );

        const rawResponse = await response.json().catch(() => ({}));

        if (!response.ok) {
          console.error("❌ Background discovery error:", rawResponse);
          const message =
            typeof rawResponse?.error === "string"
              ? rawResponse.error
              : typeof rawResponse?.message === "string"
              ? rawResponse.message
              : `Edge function request failed: ${response.status}`;
          throw new Error(message);
        }

        if (!rawResponse?.success) {
          const fallbackMessage =
            typeof rawResponse?.error === "string"
              ? rawResponse.error
              : "No data returned from background discovery";
          throw new Error(fallbackMessage);
        }

        console.log("✅ Background discovery response:", rawResponse);

        // For background tasks, we get jobId and campaignId immediately
        // The actual processing happens in the background
        const transformedData: BusinessDiscoveryResponse = {
          campaign_id: rawResponse.campaignId,
          job_id: rawResponse.jobId, // New: job ID for tracking progress
          status: rawResponse.status, // New: processing status
          estimated_time: rawResponse.estimatedTime, // New: estimated completion time
          realtime_channel: rawResponse.realtimeChannel, // New: for real-time updates
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

        setCurrentCampaignId(data.campaign_id);
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
