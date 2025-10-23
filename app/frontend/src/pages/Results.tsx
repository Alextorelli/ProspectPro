import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { useCampaignResults } from "../hooks/useCampaignResults";
import { useCampaignStore } from "../stores/campaignStore";
import { exportLeadsToCsv } from "../utils/exportLeadsToCsv";

const PAGE_SIZE = 25;

const getConfidenceColor = (score: number) => {
  if (score >= 90) return "bg-green-100 text-green-800";
  if (score >= 80) return "bg-blue-100 text-blue-800";
  if (score >= 70) return "bg-yellow-100 text-yellow-800";
  return "bg-red-100 text-red-800";
};

const getValidationStatusColor = (status: string) => {
  switch (status) {
    case "validated":
      return "bg-green-100 text-green-800";
    case "validating":
      return "bg-blue-100 text-blue-800";
    case "pending":
      return "bg-yellow-100 text-yellow-800";
    case "failed":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export const Results: React.FC = () => {
  const location = useLocation();
  const navState = (location.state ?? null) as { campaignId?: string } | null;
  const stateCampaignId = navState?.campaignId;

  const {
    currentCampaign,
    currentCampaignId,
    setCurrentCampaign,
    setCampaignLeads,
  } = useCampaignStore((state) => ({
    currentCampaign: state.currentCampaign,
    currentCampaignId: state.currentCampaignId,
    setCurrentCampaign: state.setCurrentCampaign,
    setCampaignLeads: state.setCampaignLeads,
  }));

  const [page, setPage] = useState(0);
  const campaignId = stateCampaignId ?? currentCampaignId;

  useEffect(() => {
    setPage(0);
  }, [campaignId]);

  const {
    campaign,
    leads,
    totalLeads,
    totalPages,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useCampaignResults(campaignId, { page, pageSize: PAGE_SIZE });
  const lastSyncSignatureRef = useRef<string | null>(null);

  // DIAGNOSTIC: Log raw hook results
  useEffect(() => {
    console.log("[Results] useCampaignResults output:", {
      campaignId,
      campaign: campaign
        ? {
            campaign_id: campaign.campaign_id,
            business_type: campaign.business_type,
            location: campaign.location,
            status: campaign.status,
            leads_found: campaign.leads_found,
            leads_qualified: campaign.leads_qualified,
            hasRawData: !!campaign,
          }
        : null,
      leads: {
        isArray: Array.isArray(leads),
        length: Array.isArray(leads) ? leads.length : "not-array",
        type: typeof leads,
        firstLead:
          Array.isArray(leads) && leads.length > 0
            ? {
                id: leads[0].id,
                campaign_id: leads[0].campaign_id,
                business_name: leads[0].business_name,
                hasPhone: !!leads[0].phone,
                hasEmail: !!leads[0].email,
                hasWebsite: !!leads[0].website,
                confidence_score: leads[0].confidence_score,
              }
            : null,
      },
      totalLeads,
      totalPages,
      isLoading,
      isError,
      error: error ? String(error) : null,
    });
  }, [
    campaign,
    leads,
    totalLeads,
    totalPages,
    isLoading,
    isError,
    error,
    campaignId,
  ]);

  useEffect(() => {
    if (campaign) {
      console.log("[Results] Setting current campaign:", {
        campaign_id: campaign.campaign_id,
        business_type: campaign.business_type,
        location: campaign.location,
        status: campaign.status,
        leads_found: campaign.leads_found,
        leads_qualified: campaign.leads_qualified,
      });
      setCurrentCampaign(campaign);
    }
  }, [campaign, setCurrentCampaign]);

  useEffect(() => {
    if (!campaignId) {
      console.log("[Results] No campaignId, skipping setCampaignLeads");
      return;
    }

    if (!Array.isArray(leads)) {
      console.warn("[Results] Non-array leads from useCampaignResults", {
        campaignId,
        leadsType: typeof leads,
        leadsValue: leads,
      });
      return;
    }

    if (isLoading || isFetching) {
      console.log("[Results] Skipping setCampaignLeads while loading", {
        campaignId,
        isLoading,
        isFetching,
        leadsCount: Array.isArray(leads) ? leads.length : "not-array",
      });
      return;
    }

    const leadSignature = `${campaignId}|${leads.length}|${
      leads[0]?.id ?? "none"
    }|${leads[leads.length - 1]?.id ?? "none"}`;

    if (lastSyncSignatureRef.current === leadSignature) {
      return;
    }

    lastSyncSignatureRef.current = leadSignature;

    console.log("[Results] About to call setCampaignLeads:", {
      campaignId,
      leadsCount: leads.length,
      leadSample: leads.slice(0, 2).map((l) => ({
        id: l.id,
        business_name: l.business_name,
        campaign_id: l.campaign_id,
      })),
    });

    try {
      setCampaignLeads(campaignId, leads);
      console.log("[Results] setCampaignLeads SUCCESS");
    } catch (error) {
      console.error("[Results] setCampaignLeads FAILED", {
        campaignId,
        error: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : undefined,
        leadsLength: Array.isArray(leads) ? leads.length : "not-array",
        leadsSample: Array.isArray(leads) ? leads.slice(0, 1) : null,
      });
    }
  }, [campaignId, isFetching, isLoading, leads, setCampaignLeads]);

  const displayCampaign = campaign ?? currentCampaign;
  const displayLeads = leads;
  const qualifiedCount = useMemo(
    () => displayLeads.filter((lead) => lead.confidence_score >= 70).length,
    [displayLeads]
  );

  const handleExport = (format: "csv" | "json") => {
    if (displayLeads.length === 0) {
      return;
    }

    if (format === "csv") {
      exportLeadsToCsv(displayLeads, {
        fileName: `prospects-vault-secured-${
          new Date().toISOString().split("T")[0]
        }.csv`,
      });
      return;
    }

    const blob = new Blob([JSON.stringify(displayLeads, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `prospects-vault-secured-${
      new Date().toISOString().split("T")[0]
    }.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handlePageChange = (direction: "next" | "prev") => {
    if (direction === "next") {
      setPage((prev) => Math.min(prev + 1, Math.max(totalPages - 1, 0)));
    } else {
      setPage((prev) => Math.max(prev - 1, 0));
    }
  };

  if (!campaignId) {
    return (
      <div className="bg-white shadow rounded-lg p-12 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          No campaign selected
        </h1>
        <p className="text-gray-600">
          Launch a discovery campaign or open a recent campaign from the
          dashboard to review results.
        </p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-red-700">
        <h2 className="text-lg font-semibold mb-2">Unable to load results</h2>
        <p className="text-sm mb-4">
          {error instanceof Error ? error.message : "Unknown error"}
        </p>
        <button
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          onClick={() => refetch()}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Results</h1>
          <p className="mt-1 text-sm text-gray-500">
            {isLoading ? "Loading leads..." : `${totalLeads} leads found`} •{" "}
            {qualifiedCount} qualified on this page
          </p>
        </div>

        {displayLeads.length > 0 && (
          <div className="flex space-x-3">
            <button
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              onClick={() => handleExport("csv")}
            >
              📊 Export CSV
            </button>
            <button
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              onClick={() => handleExport("json")}
            >
              📄 Export JSON
            </button>
          </div>
        )}
      </div>

      {displayCampaign && (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Progressive Enrichment Results
            </h3>
            {displayCampaign.vault_secured && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                🔐 Vault Secured
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-5">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {displayCampaign.leads_found}
              </div>
              <div className="text-sm text-gray-500">Total Found</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {displayCampaign.leads_qualified}
              </div>
              <div className="text-sm text-gray-500">Qualified</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {displayCampaign.leads_validated}
              </div>
              <div className="text-sm text-gray-500">Validated</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {displayCampaign.tier_used || "Professional"}
              </div>
              <div className="text-sm text-gray-500">Tier Used</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                ${displayCampaign.total_cost.toFixed(2)}
              </div>
              <div className="text-sm text-gray-500">Total Cost</div>
            </div>
          </div>

          {displayCampaign.cache_performance && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h4 className="text-sm font-medium text-gray-900 mb-3">
                🚀 90-Day Intelligent Cache Performance
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-green-50 p-3 rounded-lg text-center">
                  <div className="text-lg font-bold text-green-600">
                    {displayCampaign.cache_performance.cache_hit_ratio.toFixed(
                      1
                    )}
                    %
                  </div>
                  <div className="text-xs text-gray-600">Cache Hit Ratio</div>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg text-center">
                  <div className="text-lg font-bold text-blue-600">
                    {displayCampaign.cache_performance.cache_hits}
                  </div>
                  <div className="text-xs text-gray-600">Cache Hits</div>
                </div>
                <div className="bg-yellow-50 p-3 rounded-lg text-center">
                  <div className="text-lg font-bold text-yellow-600">
                    {displayCampaign.cache_performance.cache_misses}
                  </div>
                  <div className="text-xs text-gray-600">Cache Misses</div>
                </div>
                <div className="bg-green-50 p-3 rounded-lg text-center">
                  <div className="text-lg font-bold text-green-600">
                    ${displayCampaign.cache_performance.cost_savings.toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-600">Cost Savings</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="bg-white shadow rounded-lg overflow-hidden">
        {isLoading && displayLeads.length === 0 ? (
          <div className="text-center py-12 text-gray-500">Loading leads…</div>
        ) : displayLeads.length === 0 ? (
          <div className="text-center py-12">
            <span className="text-4xl">🔍</span>
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No results on this page
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Adjust your filters or run a new discovery campaign to see fresh
              results.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Business
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Confidence
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Enrichment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cost
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {displayLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {lead.business_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {lead.address}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {lead.phone && <div>📞 {lead.phone}</div>}
                        {lead.website && (
                          <div>
                            🌐{" "}
                            <a
                              className="text-blue-600 hover:underline"
                              href={lead.website}
                              rel="noopener noreferrer"
                              target="_blank"
                            >
                              {lead.website.replace(/^https?:\/\//, "")}
                            </a>
                          </div>
                        )}
                        {lead.email && <div>📧 {lead.email}</div>}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getConfidenceColor(
                          lead.confidence_score
                        )}`}
                      >
                        {lead.confidence_score}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col space-y-1">
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800">
                          {lead.enrichment_tier || "Professional"}
                        </span>
                        {lead.vault_secured && (
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                            🔐 Vault Secured
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getValidationStatusColor(
                          lead.validation_status
                        )}`}
                      >
                        {lead.validation_status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${lead.cost_to_acquire.toFixed(3)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="text-sm text-gray-600">
              Page {page + 1} of {totalPages}
            </div>
            <div className="space-x-3">
              <button
                className="px-4 py-2 text-sm bg-white border border-gray-300 rounded-md disabled:opacity-40"
                disabled={page === 0}
                onClick={() => handlePageChange("prev")}
              >
                ← Previous
              </button>
              <button
                className="px-4 py-2 text-sm bg-white border border-gray-300 rounded-md disabled:opacity-40"
                disabled={page + 1 >= totalPages}
                onClick={() => handlePageChange("next")}
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
