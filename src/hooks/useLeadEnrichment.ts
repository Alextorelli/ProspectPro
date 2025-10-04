import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "../lib/supabase";

export interface EnrichmentConfig {
  businessName: string;
  domain?: string;
  address?: string;
  phone?: string;
  website?: string;
  industry?: string;
  state?: string;

  // Progressive enrichment options
  includeBusinessLicense?: boolean;
  includeCompanyEnrichment?: boolean;
  discoverEmails?: boolean;
  verifyEmails?: boolean;
  includePersonEnrichment?: boolean;
  apolloEnrichment?: boolean;

  // Control parameters
  maxCostPerBusiness?: number;
  minConfidenceScore?: number;
  tier?: "starter" | "professional" | "enterprise" | "compliance";
}

export interface EnrichmentResult {
  success: boolean;
  businessName: string;
  enrichedData: {
    emails?: Array<{
      email: string;
      confidence: number;
      verified: boolean;
      type?: string;
      firstName?: string;
      lastName?: string;
      position?: string;
    }>;
    businessLicense?: {
      isValid: boolean;
      licenseNumber?: string;
      status?: string;
      expirationDate?: string;
      professionalType?: string;
      source: string;
    };
    companyInfo?: {
      name?: string;
      industry?: string;
      size?: string;
      founded?: number;
      revenue?: string;
      website?: string;
      description?: string;
      source: string;
    };
  };
  confidenceScore: number;
  totalCost: number;
  costBreakdown: {
    businessLicenseCost: number;
    companyEnrichmentCost: number;
    hunterCost: number;
    neverBounceCost: number;
    personEnrichmentCost: number;
    apolloCost: number;
    complianceCost: number;
  };
  processingMetadata: {
    servicesUsed: string[];
    servicesSkipped: string[];
    processingTime: number;
    errors: Array<{
      service: string;
      error: string;
    }>;
  };
}

export const useLeadEnrichment = () => {
  const [progress, setProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState<string>("");
  const [enrichedCount, setEnrichedCount] = useState(0);
  const [totalCost, setTotalCost] = useState(0);

  const enrichmentMutation = useMutation({
    mutationFn: async (config: EnrichmentConfig): Promise<EnrichmentResult> => {
      setProgress(10);
      setCurrentStage(`Enriching ${config.businessName}...`);

      try {
        console.log("🔄 Starting enrichment for:", config.businessName);

        // Call enrichment orchestrator
        const { data, error } = await supabase.functions.invoke(
          "enrichment-orchestrator",
          {
            body: {
              businessName: config.businessName,
              domain: config.domain
                ?.replace(/^https?:\/\//, "")
                .replace(/\/$/, ""),
              address: config.address,
              phone: config.phone,
              website: config.website,
              industry: config.industry,
              state: config.state,

              // Progressive enrichment configuration (professional tier)
              includeBusinessLicense: config.includeBusinessLicense ?? true,
              discoverEmails: config.discoverEmails ?? true,
              verifyEmails: config.verifyEmails ?? true,
              includeCompanyEnrichment:
                config.includeCompanyEnrichment ?? false,
              includePersonEnrichment: config.includePersonEnrichment ?? false,
              apolloEnrichment: config.apolloEnrichment ?? false,

              // Budget controls
              maxCostPerBusiness: config.maxCostPerBusiness ?? 0.5,
              minConfidenceScore: config.minConfidenceScore ?? 50,
              tier: config.tier ?? "professional",
            },
          }
        );

        if (error) {
          console.error("❌ Enrichment error:", error);
          throw new Error(`Enrichment failed: ${error.message}`);
        }

        if (!data || !data.success) {
          throw new Error(
            data?.processingMetadata?.errors?.[0]?.error ||
              "Enrichment service returned no data"
          );
        }

        console.log("✅ Enrichment complete:", data);
        setProgress(100);
        setCurrentStage(
          `Found ${data.enrichedData?.emails?.length || 0} emails`
        );

        return data as EnrichmentResult;
      } catch (error) {
        console.error("❌ Enrichment error:", error);
        setCurrentStage("Enrichment failed");
        throw error;
      }
    },
    onSuccess: (data) => {
      setEnrichedCount((prev) => prev + 1);
      setTotalCost((prev) => prev + data.totalCost);
    },
  });

  // Batch enrichment for multiple leads
  const enrichMultipleLeads = async (
    leads: Array<{
      businessName: string;
      website?: string;
      address?: string;
      phone?: string;
    }>,
    config?: Partial<EnrichmentConfig>
  ) => {
    const results: EnrichmentResult[] = [];
    const errors: Array<{ businessName: string; error: string }> = [];

    setProgress(0);
    setEnrichedCount(0);
    setTotalCost(0);

    for (let i = 0; i < leads.length; i++) {
      const lead = leads[i];
      setCurrentStage(
        `Enriching ${i + 1}/${leads.length}: ${lead.businessName}...`
      );
      setProgress(Math.round((i / leads.length) * 100));

      try {
        const result = await enrichmentMutation.mutateAsync({
          businessName: lead.businessName,
          website: lead.website,
          domain: lead.website?.replace(/^https?:\/\//, "").replace(/\/$/, ""),
          address: lead.address,
          phone: lead.phone,
          ...config,
        });
        results.push(result);
      } catch (error) {
        console.error(`❌ Failed to enrich ${lead.businessName}:`, error);
        errors.push({
          businessName: lead.businessName,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    setProgress(100);
    setCurrentStage(`Enriched ${results.length}/${leads.length} leads`);

    return { results, errors };
  };

  const reset = () => {
    setProgress(0);
    setCurrentStage("");
    setEnrichedCount(0);
    setTotalCost(0);
  };

  return {
    enrichLead: enrichmentMutation.mutate,
    enrichLeadAsync: enrichmentMutation.mutateAsync,
    enrichMultipleLeads,
    isEnriching: enrichmentMutation.isPending,
    progress,
    currentStage,
    enrichedCount,
    totalCost,
    error: enrichmentMutation.error,
    data: enrichmentMutation.data,
    reset,
  };
};
