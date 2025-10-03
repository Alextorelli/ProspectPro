import React from "react";
import { useNavigate } from "react-router-dom";
import { useCampaignStore } from "../stores/campaignStore";

export const Dashboard: React.FC = () => {
  const { campaigns, leads } = useCampaignStore();
  const navigate = useNavigate();

  const totalCost = campaigns.reduce(
    (sum, campaign) => sum + campaign.total_cost,
    0
  );
  const totalLeads = leads.length;
  const qualifiedLeads = leads.filter(
    (lead) => lead.confidence_score >= 80
  ).length;
  // Removed unused validatedLeads variable

  const stats = [
    { name: "Total Campaigns", value: campaigns.length, icon: "🚀" },
    { name: "Total Leads", value: totalLeads, icon: "👥" },
    { name: "Qualified Leads", value: qualifiedLeads, icon: "✅" },
    { name: "Total Cost", value: `$${totalCost.toFixed(2)}`, icon: "💰" },
  ];

  const recentCampaigns = campaigns.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Overview of your lead generation campaigns and results
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="bg-white overflow-hidden shadow rounded-lg"
          >
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-2xl">{stat.icon}</span>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {stat.name}
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stat.value}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Campaigns */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Recent Campaigns
          </h3>
          {recentCampaigns.length === 0 ? (
            <div className="text-center py-8">
              <span className="text-4xl">🔍</span>
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No campaigns yet
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by creating your first lead discovery campaign.
              </p>
              <div className="mt-6">
                <a
                  href="/discovery"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Start Discovery
                </a>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {recentCampaigns.map((campaign) => (
                <div
                  key={campaign.campaign_id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() =>
                    navigate(`/campaign?id=${campaign.campaign_id}`)
                  }
                >
                  <div className="flex-1">
                    <div className="flex items-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          campaign.status === "completed"
                            ? "bg-green-100 text-green-800"
                            : campaign.status === "running"
                            ? "bg-blue-100 text-blue-800"
                            : campaign.status === "failed"
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {campaign.status}
                      </span>
                      <span className="ml-3 text-sm font-weight-medium text-gray-900">
                        {campaign.business_type} in {campaign.location}
                      </span>
                    </div>
                    <div className="mt-1 text-sm text-gray-500">
                      {campaign.leads_found} results •{" "}
                      {campaign.leads_qualified} qualified • $
                      {campaign.total_cost.toFixed(2)} cost
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="text-sm text-gray-500">
                      {new Date(campaign.created_at).toLocaleDateString()}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/campaign?id=${campaign.campaign_id}`);
                      }}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      View Details →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
