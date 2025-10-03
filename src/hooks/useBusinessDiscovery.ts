import { createClient } from "@supabase/supabase-js";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { ENRICHMENT_TIERS } from "../lib/supabase";
import { useCampaignStore } from "../stores/campaignStore";
import type { BusinessDiscoveryResponse, CampaignConfig } from "../types";

// Supabase configuration with current anon key
const supabaseUrl = "https://sriycekxdqnesdsgwiuc.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNyaXljZWt4ZHFuZXNkc2d3aXVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5NjU3ODksImV4cCI6MjA3MzU0MTc4OX0.Rx_1Hjz2eayKie0RpPB28i7_683ZwhVJ_5Eu_rzTWpI";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const useBusinessDiscovery = () => {
  const { addCampaign, setCurrentCampaign, addLeads, setLoading, setError } =
    useCampaignStore();
  const [progress, setProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState<string>("");
  const [cacheStats, setCacheStats] = useState<any>(null);

  const discoveryMutation = useMutation({
    mutationFn: async (
      config: CampaignConfig & { selectedTier?: keyof typeof ENRICHMENT_TIERS }
    ): Promise<BusinessDiscoveryResponse> => {
      setLoading(true);
      setError(null);
      setProgress(10);
      setCurrentStage("Initializing progressive enrichment...");

      try {
        console.log(
          "🚀 Starting vault-secured progressive enrichment:",
          config
        );

        // Determine enrichment tier
        const tier = config.selectedTier || "PROFESSIONAL";
        const tierConfig = ENRICHMENT_TIERS[tier];

        setCurrentStage(
          `Using ${tierConfig.name} tier ($${tierConfig.price}/lead)`
        );
        setProgress(20);

        // Call progressive enrichment orchestrator with vault-secured API access
        const { data, error } = await supabase.functions.invoke(
          "enrichment-orchestrator",
          {
            body: {
              action: "progressive_enrichment",
              business_type: config.search_terms,
              location: config.location,
              max_results: config.max_results,
              tier: tier.toLowerCase(),
              stages: tierConfig.stages,
              budget_limit: config.max_results * tierConfig.price,
              min_confidence_score: config.min_confidence_score || 70,
              cache_strategy: "90_day_intelligent", // Use 90-day intelligent caching
              require_complete_contacts:
                config.include_email_validation || false,
              chamber_verification: config.chamber_verification ?? true,
              professional_licensing: config.professional_license ?? true,
              trade_associations: config.trade_association ?? true,
            },
            headers: {
              Authorization: `Bearer ${supabaseAnonKey}`,
              apikey: supabaseAnonKey,
            },
          }
        );

        if (error) {
          console.error("❌ Progressive enrichment error:", error);
          throw new Error(`Enrichment failed: ${error.message}`);
        }

        if (!data) {
          throw new Error("No data returned from progressive enrichment");
        }

        console.log("✅ Progressive enrichment response:", data);

        // Update progress based on stages completed
        if (data.stage_progress) {
          setProgress(30 + data.stage_progress * 50);
          setCurrentStage(data.current_stage || "Processing...");
        }

        // Capture cache performance stats
        if (data.cache_stats) {
          setCacheStats(data.cache_stats);
          console.log("📊 Cache performance:", data.cache_stats);
        }

        setProgress(90);
        setCurrentStage("Finalizing results...");

        // Transform the vault-secured enrichment response
        const transformedData: BusinessDiscoveryResponse = {
          campaign_id:
            data.campaign_id || Math.random().toString(36).substr(2, 9),
          total_found: data.total_found || 0,
          qualified_count: data.qualified_count || 0,
          total_cost: data.total_cost || config.max_results * tierConfig.price,
          processing_time: data.processing_time || "0ms",
          tier_used: tierConfig.name,
          cache_performance: data.cache_stats,
          vault_status: data.vault_status || "secured",
          census_intelligence: data.census_intelligence || undefined,
          businesses: (data.enriched_leads || data.leads || []).map(
            (lead: any) => ({
              id: lead.id || Math.random().toString(36).substr(2, 9),
              business_name:
                lead.business_name || lead.businessName || "Unknown Business",
              address: lead.address,
              phone: lead.phone,
              website: lead.website,
              email: lead.email,
              confidence_score:
                lead.confidence_score || lead.optimizedScore || 0,
              validation_status: "validated" as const,
              created_at: new Date().toISOString(),
              cost_to_acquire: lead.cost_to_acquire || tierConfig.price,
              data_sources: lead.data_sources || ["vault_secured_apis"],
              enrichment_tier: tierConfig.name,
              vault_secured: true,
            })
          ),
        };

        setProgress(100);
        setCurrentStage("Complete! 🎉");
        return transformedData;
      } catch (error) {
        console.error("❌ Progressive enrichment error:", error);
        setCurrentStage("Failed ❌");
        throw error;
      } finally {
        setLoading(false);
      }
    },
    onSuccess: (data: BusinessDiscoveryResponse) => {
      // Create campaign record with vault-secured enrichment data
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
        error instanceof Error ? error.message : "Progressive enrichment failed"
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
