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
        return { campaign: null, leads: [], count: 0 };
      }

      const { data: campaignRecord, error: campaignError } = await supabase
        .from("campaigns")
        .select(
          "id,business_type,location,status,total_cost,results_count,created_at,updated_at"
        )
        .eq("id", campaignId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (campaignError) {
        throw campaignError;
      }

      if (!campaignRecord) {
        return { campaign: null, leads: [], count: 0 };
      }

      const rangeStart = page * pageSize;
      const rangeEnd = rangeStart + pageSize - 1;

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

      if (leadsError) {
        throw leadsError;
      }

      const safeLeadsData = Array.isArray(leadsData) ? leadsData : [];

      if (!Array.isArray(leadsData)) {
        console.error("⚠️ Supabase returned a non-array leads payload", {
          campaignId,
          receivedType: typeof leadsData,
        });
      }

      const { campaignResult, leads } = transformCampaignData(
        campaignRecord,
        safeLeadsData
      );

      return {
        campaign: campaignResult,
        leads,
        count: count ?? leads.length,
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
