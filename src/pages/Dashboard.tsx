import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import { useCampaignStore } from "../stores/campaignStore";

interface Campaign {
  id: string;
  campaign_id?: string;
  business_type: string;
  location: string;
  status: string;
  results_count: number;
  leads_found?: number;
  leads_qualified?: number;
  total_cost: number;
  created_at: string;
}

export const Dashboard: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const { campaigns: localCampaigns, leads: localLeads } = useCampaignStore();
  const navigate = useNavigate();

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch user-aware campaigns from database
  useEffect(() => {
    const fetchCampaigns = async () => {
      if (authLoading) {
        return;
      }

      if (!user?.id) {
        setCampaigns([]);
        setLoading(false);
        setError(null);
        return;
      }

      try {
        setLoading(true);
        console.log("📊 Fetching campaigns for user:", user.id);

        // Query campaigns scoped to the authenticated user
        const query = supabase
          .from("campaigns")
          .select("*")
          .eq("user_id", user.id);

        const { data, error } = await query.order("created_at", {
          ascending: false,
        });

        if (error) {
          console.error("❌ Error fetching campaigns:", error);
          setError(error.message);
          return;
        }

        console.log("✅ Campaigns loaded:", data?.length || 0);
        setCampaigns(data || []);
      } catch (err) {
        console.error("❌ Unexpected error:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load campaigns"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchCampaigns();
  }, [authLoading, user?.id]);

  // Calculate stats from database campaigns
  const totalCost = campaigns.reduce(
    (sum, campaign) => sum + (campaign.total_cost || 0),
    0
  );
  const totalLeads = campaigns.reduce(
    (sum, campaign) => sum + (campaign.results_count || 0),
    0
  );
  const qualifiedLeads = localLeads.filter(
    (lead) => lead.confidence_score >= 80
  ).length;

  // Fallback to local store data if no database campaigns
  const stats = [
    {
      name: "Total Campaigns",
      value: campaigns.length || localCampaigns.length,
      icon: "🚀",
    },
    { name: "Total Leads", value: totalLeads || localLeads.length, icon: "👥" },
    { name: "Qualified Leads", value: qualifiedLeads, icon: "✅" },
    { name: "Total Cost", value: `$${totalCost.toFixed(2)}`, icon: "💰" },
  ];

  const recentCampaigns =
    campaigns.length > 0 ? campaigns.slice(0, 5) : localCampaigns.slice(0, 5);

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading campaigns...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-8 text-center">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Sign in to view your campaigns
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Create an account or sign in to access saved campaigns and lead history.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <div className="flex">
          <div className="text-red-500 dark:text-red-400 text-xl mr-3">⚠️</div>
          <div>
            <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
              Error loading campaigns
            </h3>
            <p className="text-sm text-red-700 dark:text-red-300 mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Overview of your lead generation campaigns and results
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="bg-white dark:bg-gray-700 overflow-hidden shadow rounded-lg border border-gray-200 dark:border-gray-600"
          >
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-2xl">{stat.icon}</span>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                      {stat.name}
                    </dt>
                    <dd className="text-lg font-medium text-gray-900 dark:text-gray-100">
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
      <div className="bg-white dark:bg-gray-700 shadow rounded-lg border border-gray-200 dark:border-gray-600">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100 mb-4">
            Recent Campaigns
          </h3>
          {recentCampaigns.length === 0 ? (
            <div className="text-center py-8">
              <span className="text-4xl">🔍</span>
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                No campaigns yet
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Get started by creating your first lead discovery campaign.
              </p>
              <div className="mt-6">
                <a
                  href="/discovery"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors"
                >
                  Start Discovery
                </a>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {recentCampaigns.map((campaign: any) => {
                const campaignId = campaign.id || campaign.campaign_id || "";
                const leadsCount =
                  campaign.results_count || campaign.leads_found || 0;
                const qualifiedCount = campaign.leads_qualified || 0;

                return (
                  <div
                    key={campaignId}
                    className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer transition-colors"
                    onClick={() => navigate(`/campaign?id=${campaignId}`)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            campaign.status === "completed"
                              ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200"
                              : campaign.status === "running"
                              ? "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200"
                              : campaign.status === "failed"
                              ? "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200"
                              : "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                          }`}
                        >
                          {campaign.status}
                        </span>
                        <span className="ml-3 text-sm font-weight-medium text-gray-900 dark:text-gray-100">
                          {campaign.business_type} in {campaign.location}
                        </span>
                      </div>
                      <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        {leadsCount} results • {qualifiedCount} qualified • $
                        {campaign.total_cost.toFixed(2)} cost
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(campaign.created_at).toLocaleDateString()}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/campaign?id=${campaignId}`);
                        }}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium transition-colors"
                      >
                        View Details →
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
