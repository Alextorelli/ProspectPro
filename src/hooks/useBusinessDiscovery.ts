import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  ENRICHMENT_TIERS,
  ensureSession,
  getSessionToken,
  supabase,
} from "../lib/supabase";
import { useCampaignStore } from "../stores/campaignStore";
import type {
  BusinessDiscoveryResponse,
  BusinessLead,
  CampaignConfig,
  CampaignResult,
} from "../types";

type LegacyLeadPayload = {
  businessName?: string;
  address?: string;
  phone?: string;
  website?: string;
  email?: string;
  optimizedScore?: number;
  validationCost?: number;
  enhancementData?: {
    verificationSources?: string[];
    emails?: Array<Record<string, unknown>>;
    processingMetadata?: Record<string, unknown>;
  };
  emails?: Array<Record<string, unknown>>;
  dataSources?: string[];
};

type LegacyDiscoveryRaw = {
  success?: boolean;
  campaignId?: string;
  leads?: LegacyLeadPayload[];
  results?: {
    totalFound?: number;
    qualified?: number;
  };
  optimization?: {
    totalCost?: number;
    processingTime?: string;
  };
  metadata?: {
    timestamp?: string;
    version?: string;
  };
  requirements?: {
    businessType?: string;
    location?: string;
    targetLeads?: number;
  };
  error?: string;
};

type NormalizedLegacyEmail = {
  email: string;
  confidence: number;
  verified: boolean;
  type?: string;
  firstName?: string;
  lastName?: string;
  position?: string;
};

type LegacyDiscoveryMeta = {
  leads: BusinessLead[];
  campaign: CampaignResult;
};

type DiscoveryResultWithLegacy = BusinessDiscoveryResponse & {
  __legacyMeta?: LegacyDiscoveryMeta;
};

const normalizeLegacyEmails = (
  input?: Array<Record<string, unknown>>
): NormalizedLegacyEmail[] => {
  if (!Array.isArray(input)) {
    return [];
  }

  const emails: NormalizedLegacyEmail[] = [];

  for (const entry of input) {
    const email = typeof entry.email === "string" ? entry.email : null;
    if (!email) continue;

    emails.push({
      email,
      confidence: typeof entry.confidence === "number" ? entry.confidence : 0,
      verified: Boolean(entry.verified),
      type: typeof entry.type === "string" ? entry.type : undefined,
      firstName:
        typeof entry.firstName === "string" ? entry.firstName : undefined,
      lastName: typeof entry.lastName === "string" ? entry.lastName : undefined,
      position: typeof entry.position === "string" ? entry.position : undefined,
    });
  }

  return emails;
};

const createLegacyLead = (
  lead: LegacyLeadPayload,
  campaignId: string,
  tierName: string
): BusinessLead => {
  const idGenerator = () =>
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `legacy-${campaignId}-${Math.random().toString(36).slice(2, 11)}`;

  return {
    id: idGenerator(),
    campaign_id: campaignId,
    business_name: lead.businessName ?? "Unknown business",
    address: lead.address,
    phone: lead.phone,
    website: lead.website,
    email: lead.email,
    confidence_score: lead.optimizedScore ?? 0,
    validation_status: "validated",
    created_at: new Date().toISOString(),
    cost_to_acquire: lead.validationCost ?? 0,
    data_sources:
      lead.enhancementData?.verificationSources ?? lead.dataSources ?? [],
    enrichment_tier: tierName,
    vault_secured: true,
    enrichment_data: {
      emails: normalizeLegacyEmails(
        (lead.emails as Array<Record<string, unknown>> | undefined) ??
          (lead.enhancementData?.emails as
            | Array<Record<string, unknown>>
            | undefined)
      ),
      verificationSources: lead.enhancementData?.verificationSources ?? [],
      processingMetadata: lead.enhancementData?.processingMetadata,
      dataSources: lead.dataSources,
    },
  };
};

const createLegacyDiscoveryResponse = ({
  legacyData,
  requestConfig,
  tierConfig,
}: {
  legacyData: LegacyDiscoveryRaw;
  requestConfig: CampaignConfig & {
    selectedTier?: keyof typeof ENRICHMENT_TIERS;
  };
  tierConfig: (typeof ENRICHMENT_TIERS)[keyof typeof ENRICHMENT_TIERS];
}): DiscoveryResultWithLegacy => {
  if (!legacyData?.campaignId) {
    throw new Error("Legacy discovery payload missing campaignId");
  }

  const leads = (legacyData.leads ?? []).map((lead) =>
    createLegacyLead(lead, legacyData.campaignId as string, tierConfig.name)
  );

  const totalFound = legacyData.results?.totalFound ?? leads.length;
  const qualified = legacyData.results?.qualified ?? leads.length;
  const totalCost =
    legacyData.optimization?.totalCost ??
    leads.reduce((sum, lead) => sum + (lead.cost_to_acquire ?? 0), 0);
  const timestamp = legacyData.metadata?.timestamp ?? new Date().toISOString();

  const campaign: CampaignResult = {
    campaign_id: legacyData.campaignId,
    business_type:
      requestConfig.business_type ||
      requestConfig.search_terms ||
      legacyData.requirements?.businessType ||
      "",
    location: requestConfig.location || legacyData.requirements?.location || "",
    status: "completed",
    progress: 100,
    total_cost: totalCost,
    leads_found: totalFound,
    leads_qualified: qualified,
    leads_validated: qualified,
    created_at: timestamp,
    completed_at: timestamp,
    tier_used: tierConfig.name,
    vault_secured: true,
  };

  const response: DiscoveryResultWithLegacy = {
    campaign_id: legacyData.campaignId,
    job_id: undefined,
    status: "completed",
    estimated_time: undefined,
    realtime_channel: undefined,
    total_found: totalFound,
    qualified_count: qualified,
    total_cost: totalCost,
    processing_time: legacyData.optimization?.processingTime ?? "< 5s",
    tier_used: tierConfig.name,
    vault_status: "secured",
    businesses: leads,
  };

  response.__legacyMeta = {
    campaign,
    leads,
  };

  return response;
};

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
    setCampaignLeads,
    addCampaign,
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
        console.log("📊 Current user state:", {
          userId: user?.id,
          userEmail: user?.email,
        });

        // Ensure we have a valid session before calling Edge Function
        const hasSession = await ensureSession();
        console.log("🔑 Session check result:", {
          hasSession,
          userId: user?.id,
        });

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
        console.log("🎫 Retrieved session token:", {
          hasToken: !!accessToken,
          tokenLength: accessToken?.length,
          tokenPreview: accessToken
            ? `${accessToken.substring(0, 20)}...${accessToken.substring(
                accessToken.length - 20
              )}`
            : null,
        });

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

        console.log("📤 Calling edge function with:", {
          functionName: "business-discovery-background",
          hasToken: !!accessToken,
          userId: user.id,
          businessType: requestBody.businessType,
          location: requestBody.location,
          maxResults: requestBody.maxResults,
        });

        const { data: rawResponse, error: invokeError } =
          await supabase.functions.invoke("business-discovery-background", {
            body: requestBody,
            headers: {
              "Content-Type": "application/json",
              "x-prospect-session": `Bearer ${accessToken}`,
            },
          });

        const invokeContext = (invokeError as any)?.context;
        let errorPayload: unknown = null;
        if (invokeContext) {
          try {
            const cloned = invokeContext.clone();
            const rawText = await cloned.text();
            try {
              errorPayload = JSON.parse(rawText);
            } catch (_jsonError) {
              errorPayload = rawText;
            }
          } catch (parseError) {
            console.warn("Unable to parse edge error payload", parseError);
          }
        }

        const responseLogPayload = {
          hasData: !!rawResponse,
          hasError: !!invokeError,
          errorDetails: invokeError
            ? {
                message: invokeError.message,
                status: invokeError.status,
                name: invokeError.name,
                statusCode: invokeContext?.status,
                statusText: invokeContext?.statusText,
                payload: errorPayload,
              }
            : null,
          responsePreview: rawResponse
            ? {
                success: rawResponse.success,
                campaignId: rawResponse.campaignId,
                jobId: rawResponse.jobId,
                error: rawResponse.error,
              }
            : null,
        };

        console.log("📥 Edge function response:", responseLogPayload);

        const shouldFallbackToLegacy =
          Boolean(invokeContext?.status === 401) &&
          typeof (responseLogPayload.errorDetails as any)?.payload ===
            "object" &&
          (responseLogPayload.errorDetails as any)?.payload?.message ===
            "Invalid JWT";

        if (shouldFallbackToLegacy) {
          console.warn(
            "⚠️ Falling back to legacy user-aware discovery due to Invalid JWT"
          );

          const legacyResult = await supabase.functions.invoke(
            "business-discovery-user-aware",
            {
              body: {
                ...requestBody,
                // Legacy function expects these identifiers in payload
                sessionUserId: user.id,
                userId: user.id,
              },
              headers: {
                "Content-Type": "application/json",
                // Let Supabase SDK attach Authorization header automatically
              },
            }
          );

          if (legacyResult.error) {
            console.error(
              "❌ Legacy discovery invoke failed:",
              legacyResult.error
            );
            throw new Error(
              legacyResult.error.message ||
                "Legacy discovery fallback failed with unknown error."
            );
          }

          const legacyPayload = legacyResult.data as LegacyDiscoveryRaw | null;

          if (!legacyPayload) {
            throw new Error("Legacy discovery returned no data");
          }

          if (legacyPayload.success === false) {
            throw new Error(
              legacyPayload.error ||
                "Legacy discovery fallback reported failure."
            );
          }

          const immediateResponse = createLegacyDiscoveryResponse({
            legacyData: legacyPayload,
            requestConfig: config,
            tierConfig,
          });

          console.log("✅ Legacy discovery fallback succeeded", {
            campaignId: immediateResponse.campaign_id,
            leadCount: immediateResponse.businesses.length,
          });

          setProgress(100);
          setCurrentStage("Legacy discovery completed ✅");
          return immediateResponse;
        }

        if (invokeError) {
          console.error("❌ Background discovery error:", invokeError);

          if (
            invokeError.message?.includes("JWT") ||
            invokeError.status === 401
          ) {
            await supabase.auth.signOut();
            throw new Error(
              "Your session expired. Please sign back in to run discovery."
            );
          }

          throw new Error(
            invokeError.message ||
              `Edge function request failed: ${invokeError.status ?? 500}`
          );
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
        const transformedData: DiscoveryResultWithLegacy = {
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
      const result = data as DiscoveryResultWithLegacy;
      console.log("✅ Discovery result received:", result);

      if (result.__legacyMeta) {
        const { campaign, leads } = result.__legacyMeta;

        addCampaign(campaign);
        setCurrentCampaign(campaign);
        setCurrentCampaignId(campaign.campaign_id);
        setCampaignLeads(campaign.campaign_id, leads);
        setProgress(100);
        setCurrentStage("Campaign completed! ✅");
        return;
      }

      // For background jobs, we don't create the full campaign record immediately
      // The progress page will handle real-time updates and final campaign creation

      setProgress(100);
      setCurrentStage("Background processing started! 🚀");

      // Navigate to progress page with job ID
      if (result.job_id && result.campaign_id) {
        const jobData = {
          jobId: result.job_id,
          campaignId: result.campaign_id,
          status: result.status || "pending",
          estimatedTime: result.estimated_time,
        };

        console.log("Job started:", jobData);

        // Call the navigation callback if provided
        if (onJobCreated) {
          onJobCreated(jobData);
        }

        setCurrentCampaignId(result.campaign_id);
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
