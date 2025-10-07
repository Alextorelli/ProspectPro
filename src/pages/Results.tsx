import React from "react";
import { useCampaignStore } from "../stores/campaignStore";
import { exportLeadsToCsv } from "../utils/exportLeadsToCsv";

export const Results: React.FC = () => {
  const { leads, currentCampaign } = useCampaignStore();

  const handleExport = (format: "csv" | "json") => {
    if (!leads.length) {
      return;
    }

    if (format === "csv") {
      exportLeadsToCsv(leads, {
        fileName: `prospects-vault-secured-${
          new Date().toISOString().split("T")[0]
        }.csv`,
      });
    } else {
      const blob = new Blob([JSON.stringify(leads, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `prospects-vault-secured-${
        new Date().toISOString().split("T")[0]
      }.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Results</h1>
          <p className="mt-1 text-sm text-gray-500">
            {leads.length} leads found •{" "}
            {leads.filter((l) => l.confidence_score >= 70).length} qualified
          </p>
        </div>

        {leads.length > 0 && (
          <div className="flex space-x-3">
            <button
              onClick={() => handleExport("csv")}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              📊 Export CSV
            </button>
            <button
              onClick={() => handleExport("json")}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              📄 Export JSON
            </button>
          </div>
        )}
      </div>

      {/* Campaign Summary */}
      {currentCampaign && (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Progressive Enrichment Results
            </h3>
            {currentCampaign.vault_secured && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                🔐 Vault Secured
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-5">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {currentCampaign.leads_found}
              </div>
              <div className="text-sm text-gray-500">Total Found</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {currentCampaign.leads_qualified}
              </div>
              <div className="text-sm text-gray-500">Qualified</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {currentCampaign.leads_validated}
              </div>
              <div className="text-sm text-gray-500">Validated</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {currentCampaign.tier_used || "Professional"}
              </div>
              <div className="text-sm text-gray-500">Tier Used</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                ${currentCampaign.total_cost.toFixed(2)}
              </div>
              <div className="text-sm text-gray-500">Total Cost</div>
            </div>
          </div>

          {/* Cache Performance Display */}
          {currentCampaign.cache_performance && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h4 className="text-sm font-medium text-gray-900 mb-3">
                🚀 90-Day Intelligent Cache Performance
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-green-50 p-3 rounded-lg text-center">
                  <div className="text-lg font-bold text-green-600">
                    {currentCampaign.cache_performance.cache_hit_ratio.toFixed(
                      1
                    )}
                    %
                  </div>
                  <div className="text-xs text-gray-600">Cache Hit Ratio</div>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg text-center">
                  <div className="text-lg font-bold text-blue-600">
                    {currentCampaign.cache_performance.cache_hits}
                  </div>
                  <div className="text-xs text-gray-600">Cache Hits</div>
                </div>
                <div className="bg-yellow-50 p-3 rounded-lg text-center">
                  <div className="text-lg font-bold text-yellow-600">
                    {currentCampaign.cache_performance.cache_misses}
                  </div>
                  <div className="text-xs text-gray-600">Cache Misses</div>
                </div>
                <div className="bg-green-50 p-3 rounded-lg text-center">
                  <div className="text-lg font-bold text-green-600">
                    ${currentCampaign.cache_performance.cost_savings.toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-600">Cost Savings</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Results Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {leads.length === 0 ? (
          <div className="text-center py-12">
            <span className="text-4xl">🔍</span>
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No results yet
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Start a discovery campaign to find business leads.
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
                {leads.map((lead) => (
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
                              href={lead.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
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
      </div>
    </div>
  );
};
