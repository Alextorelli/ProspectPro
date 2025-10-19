import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import type { BusinessLead, CampaignResult } from "../types";
import { transformCampaignData } from "../utils/campaignTransforms";

interface UseCampaignResultsOptions {
  page?: number;
  pageSize?: number;
  enabled?: boolean;
}

interface CampaignResultsQuery {
  campaign: CampaignResult | null;
  leads: BusinessLead[];
  count: number;
}

export const useCampaignResults = (
  campaignId: string | undefined | null,
  options: UseCampaignResultsOptions = {}
) => {
  const { user } = useAuth();
  const pageSize = Math.max(options.pageSize ?? 50, 1);
  const page = Math.max(options.page ?? 0, 0);
  const enabled = Boolean(options.enabled ?? true);

  const query = useQuery<CampaignResultsQuery>({
    queryKey: [
      "campaign-results",
      user?.id ?? "anonymous",
      campaignId ?? "none",
      page,
      pageSize,
    ],
    enabled: Boolean(user?.id) && Boolean(campaignId) && enabled,
    staleTime: 60 * 1000,
    queryFn: async () => {
      if (!user?.id || !campaignId) {
        console.log("[useCampaignResults] Early exit: no user or campaignId", {
          hasUser: !!user?.id,
          campaignId,
        });
        return { campaign: null, leads: [], count: 0 };
      }

      console.log("[useCampaignResults] Fetching campaign:", {
        campaignId,
        userId: user.id,
        page,
        pageSize,
      });

      const { data: campaignRecord, error: campaignError } = await supabase
        .from("campaigns")
        .select(
          "id,business_type,location,status,total_cost,results_count,created_at,updated_at"
        )
        .eq("id", campaignId)
        .eq("user_id", user.id)
        .maybeSingle();

      console.log("[useCampaignResults] Campaign query result:", {
        campaignId,
        hasCampaignRecord: !!campaignRecord,
        campaignError: campaignError ? String(campaignError.message) : null,
        campaignData: campaignRecord
          ? {
              id: campaignRecord.id,
              business_type: campaignRecord.business_type,
              location: campaignRecord.location,
              status: campaignRecord.status,
              results_count: campaignRecord.results_count,
            }
          : null,
      });

      if (campaignError) {
        console.error("[useCampaignResults] Campaign fetch error:", {
          campaignId,
          error: campaignError,
          message: campaignError.message,
          details: campaignError.details,
          hint: campaignError.hint,
        });
        throw campaignError;
      }

      if (!campaignRecord) {
        console.warn("[useCampaignResults] No campaign found:", {
          campaignId,
          userId: user.id,
        });
        return { campaign: null, leads: [], count: 0 };
      }

      const rangeStart = page * pageSize;
      const rangeEnd = rangeStart + pageSize - 1;

      console.log("[useCampaignResults] Fetching leads:", {
        campaignId,
        userId: user.id,
        rangeStart,
        rangeEnd,
      });

      const {
        data: leadsData,
        error: leadsError,
        count,
      } = await supabase
        .from("leads")
        .select(
          "id,campaign_id,business_name,address,phone,website,email,confidence_score,validation_cost,enrichment_data,created_at",
          { count: "exact" }
        )
        .eq("campaign_id", campaignId)
        .eq("user_id", user.id)
        .order("confidence_score", { ascending: false })
        .range(rangeStart, rangeEnd);

      console.log("[useCampaignResults] Leads query result:", {
        campaignId,
        hasLeadsData: !!leadsData,
        leadsIsArray: Array.isArray(leadsData),
        leadsCount: Array.isArray(leadsData) ? leadsData.length : "not-array",
        totalCount: count,
        leadsError: leadsError ? String(leadsError.message) : null,
        firstLead:
          Array.isArray(leadsData) && leadsData.length > 0
            ? {
                id: leadsData[0].id,
                campaign_id: leadsData[0].campaign_id,
                business_name: leadsData[0].business_name,
                confidence_score: leadsData[0].confidence_score,
              }
            : null,
      });

      if (leadsError) {
        console.error("[useCampaignResults] Leads fetch error:", {
          campaignId,
          error: leadsError,
          message: leadsError.message,
          details: leadsError.details,
          hint: leadsError.hint,
        });
        throw leadsError;
      }

      if (!Array.isArray(leadsData)) {
        console.warn("[useCampaignResults] Non-array leads response", {
          campaignId,
          typeofData: typeof leadsData,
          raw: leadsData,
        });
        const fallbackResult = transformCampaignData(campaignRecord, [], {});
        return {
          campaign: fallbackResult.campaignResult,
          leads: [],
          count: count ?? 0,
        };
      }

      console.log("[useCampaignResults] About to transform data:", {
        campaignId,
        campaignRecordId: campaignRecord.id,
        leadsDataLength: leadsData.length,
      });

      let transformedData;
      try {
        transformedData = transformCampaignData(campaignRecord, leadsData, {});
        console.log("[useCampaignResults] Transform SUCCESS:", {
          campaignId,
          hasCampaignResult: !!transformedData.campaignResult,
          leadsIsArray: Array.isArray(transformedData.leads),
          leadsLength: Array.isArray(transformedData.leads)
            ? transformedData.leads.length
            : "not-array",
        });
      } catch (transformError) {
        console.error("[useCampaignResults] Transform error", {
          campaignId,
          error:
            transformError instanceof Error
              ? transformError.message
              : String(transformError),
          errorStack:
            transformError instanceof Error ? transformError.stack : undefined,
          leadsDataType: typeof leadsData,
          leadsDataLength: Array.isArray(leadsData)
            ? leadsData.length
            : "not-array",
        });
        const fallbackResult = transformCampaignData(campaignRecord, [], {});
        return {
          campaign: fallbackResult.campaignResult,
          leads: [],
          count: count ?? 0,
        };
      }

      const { campaignResult, leads } = transformedData;

      if (!Array.isArray(leads)) {
        console.error(
          "[useCampaignResults] Transform returned non-array leads",
          {
            campaignId,
            transformedLeadsType: typeof leads,
          }
        );
        return {
          campaign: campaignResult,
          leads: [],
          count: count ?? 0,
        };
      }

      console.log("[useCampaignResults] Returning final result:", {
        campaignId,
        campaign: {
          campaign_id: campaignResult.campaign_id,
          status: campaignResult.status,
          leads_found: campaignResult.leads_found,
          leads_qualified: campaignResult.leads_qualified,
        },
        leadsCount: leads.length,
        totalCount: count,
      });

      return {
        campaign: campaignResult,
        leads: leads,
        count: count ?? 0,
      };
    },
  });

  const totalLeads = query.data?.count ?? 0;
  const totalPages = totalLeads > 0 ? Math.ceil(totalLeads / pageSize) : 0;

  return {
    campaign: query.data?.campaign ?? null,
    leads: query.data?.leads ?? [],
    totalLeads,
    totalPages,
    page,
    pageSize,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
};
