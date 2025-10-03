import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ProgressDisplay } from "../components/ProgressDisplay";
import { useBusinessDiscovery } from "../hooks/useBusinessDiscovery";
import { useCampaignStore } from "../stores/campaignStore";
import type { BusinessLead } from "../types";

export const Campaign: React.FC = () => {
  const navigate = useNavigate();
  const { currentCampaign, leads } = useCampaignStore();
  const { isDiscovering, progress, currentStage, cacheStats, error } =
    useBusinessDiscovery();
  const [showResults, setShowResults] = useState(false);

  // Show results when campaign completes
  useEffect(() => {
    if (
      currentCampaign &&
      currentCampaign.status === "completed" &&
      leads.length > 0
    ) {
      setShowResults(true);
    }
  }, [currentCampaign, leads]);

  // If no campaign is running, redirect to discovery
  useEffect(() => {
    if (!isDiscovering && !currentCampaign) {
      navigate("/discovery");
    }
  }, [isDiscovering, currentCampaign, navigate]);

  const exportToCsv = () => {
    if (!leads.length) return;

    // CSV headers - let me confirm these columns with you first
    const headers = [
      "Business Name",
      "Address",
      "Phone",
      "Website",
      "Email",
      "Confidence Score",
      "Validation Status",
      "Cost to Acquire",
      "Data Sources",
      "Enrichment Tier",
    ];

    // Convert leads to CSV format
    const csvContent = [
      headers.join(","),
      ...leads.map((lead: BusinessLead) =>
        [
          `"${lead.business_name || ""}"`,
          `"${lead.address || ""}"`,
          `"${lead.phone || ""}"`,
          `"${lead.website || ""}"`,
          `"${lead.email || ""}"`,
          lead.confidence_score || 0,
          `"${lead.validation_status || ""}"`,
          `$${(lead.cost_to_acquire || 0).toFixed(2)}`,
          `"${(lead.data_sources || []).join("; ")}"`,
          `"${lead.enrichment_tier || ""}"`,
        ].join(",")
      ),
    ].join("\n");

    // Download CSV file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `campaign-${currentCampaign?.campaign_id || Date.now()}-results.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
              onClick={() => navigate("/discovery")}
              className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Back to Discovery
            </button>
            {showResults && (
              <button
                onClick={exportToCsv}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
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
            isDiscovering={isDiscovering}
            progress={progress}
            currentStage={currentStage}
            cacheStats={cacheStats}
          />
        </div>
      )}

      {/* Campaign Summary */}
      {currentCampaign && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Campaign Summary
          </h2>
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

      {/* Results Table */}
      {showResults && leads.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Campaign Results
              </h2>
              <div className="text-sm text-gray-500">
                {leads.length} leads found
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
                {leads.map((lead: BusinessLead) => (
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
                              href={lead.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:text-blue-600"
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
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
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
      {showResults && leads.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
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
              onClick={() => navigate("/discovery")}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Start New Campaign
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
