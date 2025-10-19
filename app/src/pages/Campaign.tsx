import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { EnrichmentButton } from "../components/EnrichmentButton";
import { ProgressDisplay } from "../components/ProgressDisplay";
import { useBusinessDiscovery } from "../hooks/useBusinessDiscovery";
import { useCampaignResults } from "../hooks/useCampaignResults";
import { useCampaignStore } from "../stores/campaignStore";
import type { BusinessLead } from "../types";
import { exportLeadsToCsv } from "../utils/exportLeadsToCsv";

export const Campaign: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const campaignId = searchParams.get("id");
  const {
    currentCampaign,
    campaigns,
    leads,
    setCurrentCampaign,
    setCampaignLeads,
  } = useCampaignStore();
  const { isDiscovering, progress, currentStage, cacheStats, error } =
    useBusinessDiscovery();
  const [showResults, setShowResults] = useState(false);

  const { campaign: hydratedCampaign, leads: remoteLeads } = useCampaignResults(
    campaignId,
    {
      page: 0,
      pageSize: 500,
      enabled: Boolean(campaignId),
    }
  );

  useEffect(() => {
    if (hydratedCampaign) {
      setCurrentCampaign(hydratedCampaign);
    }
  }, [hydratedCampaign, setCurrentCampaign]);

  useEffect(() => {
    if (campaignId && remoteLeads.length > 0) {
      setCampaignLeads(campaignId, remoteLeads);
    }
  }, [campaignId, remoteLeads, setCampaignLeads]);

  // Filter leads for current campaign
  const campaignLeads = currentCampaign
    ? leads.filter((lead) => lead.campaign_id === currentCampaign.campaign_id)
    : [];

  useEffect(() => {
    if (!currentCampaign && campaignId) {
      const matchedCampaign = campaigns.find(
        (campaign) => campaign.campaign_id === campaignId
      );
      if (matchedCampaign) {
        setCurrentCampaign(matchedCampaign);
      }
    }
  }, [campaignId, campaigns, currentCampaign, setCurrentCampaign]);

  useEffect(() => {
    if (campaignLeads.length > 0 || remoteLeads.length > 0) {
      setShowResults(true);
    }
  }, [campaignLeads.length, remoteLeads.length]);

  const exportToCsv = () => {
    if (!campaignLeads.length) return;

    exportLeadsToCsv(campaignLeads, {
      fileName: `campaign-${
        currentCampaign?.campaign_id || Date.now()
      }-results.csv`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Campaign Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Campaign Progress
            </h1>
            <p className="text-gray-600 mt-1">
              {currentCampaign
                ? `Campaign ${currentCampaign.campaign_id}`
                : "Running campaign..."}
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200"
              onClick={() => navigate("/discovery")}
            >
              Back to Discovery
            </button>
            {showResults && (
              <button
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                onClick={exportToCsv}
              >
                Export CSV
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Progress Display */}
      {isDiscovering && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <ProgressDisplay
            cacheStats={cacheStats}
            currentStage={currentStage}
            isDiscovering={isDiscovering}
            progress={progress}
          />
        </div>
      )}

      {/* Campaign Summary */}
      {currentCampaign && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Campaign Summary
            </h2>
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              type="button"
              onClick={() =>
                navigate("/results", {
                  state: { campaignId: currentCampaign.campaign_id },
                })
              }
            >
              View Results
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-sm text-blue-600 font-medium">Status</div>
              <div className="text-lg font-bold text-blue-900 capitalize">
                {currentCampaign.status}
              </div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-sm text-green-600 font-medium">
                Leads Found
              </div>
              <div className="text-lg font-bold text-green-900">
                {currentCampaign.leads_found || 0}
              </div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="text-sm text-yellow-600 font-medium">
                Qualified
              </div>
              <div className="text-lg font-bold text-yellow-900">
                {currentCampaign.leads_qualified || 0}
              </div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-sm text-purple-600 font-medium">
                Total Cost
              </div>
              <div className="text-lg font-bold text-purple-900">
                ${(currentCampaign.total_cost || 0).toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enrichment Section */}
      {currentCampaign && showResults && campaignLeads.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Progressive Enrichment
          </h2>
          <div className="flex items-start justify-between gap-6">
            <div className="flex-1">
              <p className="text-gray-600 mb-4">
                Enrich your leads with verified emails, business license
                validation, and more. Only pay for successful enrichments.
              </p>
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div className="bg-blue-50 p-3 rounded">
                  <div className="font-semibold text-blue-900">
                    {
                      campaignLeads.filter(
                        (l) => l.enrichment_data?.emails?.length
                      ).length
                    }
                  </div>
                  <div className="text-blue-600 text-xs">With Emails</div>
                </div>
                <div className="bg-green-50 p-3 rounded">
                  <div className="font-semibold text-green-900">
                    {
                      campaignLeads.filter(
                        (l) => l.enrichment_data?.neverBounceVerified
                      ).length
                    }
                  </div>
                  <div className="text-green-600 text-xs">Email Verified</div>
                </div>
                <div className="bg-purple-50 p-3 rounded">
                  <div className="font-semibold text-purple-900">
                    {
                      campaignLeads.filter(
                        (l) => l.enrichment_data?.licenseVerified
                      ).length
                    }
                  </div>
                  <div className="text-purple-600 text-xs">
                    License Verified
                  </div>
                </div>
              </div>
            </div>
            <div className="flex-shrink-0">
              <EnrichmentButton
                campaignId={currentCampaign.campaign_id}
                onComplete={() => {
                  // Optionally refresh data or show success message
                  console.log(
                    "Enrichment completed for campaign:",
                    currentCampaign.campaign_id
                  );
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Results Table */}
      {showResults && campaignLeads.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Campaign Results
              </h2>
              <div className="text-sm text-gray-500">
                {campaignLeads.length} leads found
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Business
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact Info
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cost
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {campaignLeads.map((lead: BusinessLead) => (
                  <tr key={lead.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {lead.business_name}
                        </div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {lead.address}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        {lead.phone && (
                          <div className="text-sm text-gray-900">
                            {lead.phone}
                          </div>
                        )}
                        {lead.email && (
                          <div className="text-sm text-blue-600">
                            {lead.email}
                          </div>
                        )}
                        {lead.website && (
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            <a
                              className="hover:text-blue-600"
                              href={lead.website}
                              rel="noopener noreferrer"
                              target="_blank"
                            >
                              {lead.website}
                            </a>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-sm font-medium text-gray-900">
                          {lead.confidence_score}%
                        </div>
                        <div
                          className={`ml-2 w-16 bg-gray-200 rounded-full h-2`}
                        >
                          <div
                            className={`h-2 rounded-full ${
                              lead.confidence_score >= 80
                                ? "bg-green-500"
                                : lead.confidence_score >= 60
                                ? "bg-yellow-500"
                                : "bg-red-500"
                            }`}
                            style={{ width: `${lead.confidence_score}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${(lead.cost_to_acquire || 0).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          lead.validation_status === "validated"
                            ? "bg-green-100 text-green-800"
                            : lead.validation_status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {lead.validation_status || "unknown"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  clipRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  fillRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Campaign Failed
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error instanceof Error ? error.message : String(error)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* No Results State */}
      {showResults && campaignLeads.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No results found
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Try adjusting your search criteria or location.
          </p>
          <div className="mt-6">
            <button
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              onClick={() => navigate("/discovery")}
            >
              Start New Campaign
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
