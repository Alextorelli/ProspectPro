import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import { useCampaignStore } from "../stores/campaignStore";

interface DatabaseCampaign {
  id: string;
  campaign_id?: string;
  business_type: string;
  location: string;
  status: string;
  results_count: number;
  total_cost: number;
  created_at: string;
}

export const Dashboard: React.FC = () => {
  const { user, sessionUserId } = useAuth();
  const { campaigns: storeCampaigns } = useCampaignStore();
  const navigate = useNavigate();
  const [userCampaigns, setUserCampaigns] = useState<DatabaseCampaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUserCampaigns = async () => {
      try {
        setLoading(true);

        let query = supabase
          .from("campaigns")
          .select("*")
          .order("created_at", { ascending: false });

        if (!user && sessionUserId) {
          query = query.eq("session_user_id", sessionUserId);
        }

        const { data, error } = await query;

        if (error) {
          console.error("Error loading campaigns:", error);
        } else {
          setUserCampaigns(data || []);
        }
      } catch (error) {
        console.error("Failed to load campaigns:", error);
      } finally {
        setLoading(false);
      }
    };

    loadUserCampaigns();
  }, [user, sessionUserId]);

  const allCampaigns = [
    ...userCampaigns.map((c) => ({
      campaign_id: c.campaign_id || c.id,
      business_type: c.business_type,
      location: c.location,
      status: c.status,
      leads_found: c.results_count || 0,
      leads_qualified: c.results_count || 0,
      total_cost: c.total_cost || 0,
      created_at: c.created_at,
    })),
    ...storeCampaigns.filter(
      (sc) =>
        !userCampaigns.some(
          (uc) => (uc.campaign_id || uc.id) === sc.campaign_id
        )
    ),
  ];

  const totalCost = allCampaigns.reduce(
    (sum, campaign) => sum + (campaign.total_cost || 0),
    0
  );
  const totalLeads = allCampaigns.reduce(
    (sum, campaign) => sum + (campaign.leads_found || 0),
    0
  );
  const qualifiedLeads = allCampaigns.reduce(
    (sum, campaign) => sum + (campaign.leads_qualified || 0),
    0
  );

  const stats = [
    { name: "Total Campaigns", value: allCampaigns.length, icon: "��" },
    { name: "Total Leads", value: totalLeads, icon: "👥" },
    { name: "Qualified Leads", value: qualifiedLeads, icon: "✅" },
    { name: "Total Cost", value: `$${totalCost.toFixed(2)}`, icon: "💰" },
  ];

  const recentCampaigns = allCampaigns.slice(0, 10);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading campaigns...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Campaign overview {user && `• ${user.email}`} {!user && "• Anonymous"}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="bg-white overflow-hidden shadow rounded-lg"
          >
            <div className="p-5">
              <div className="flex items-center">
                <span className="text-2xl">{stat.icon}</span>
                <div className="ml-5">
                  <p className="text-sm font-medium text-gray-500">
                    {stat.name}
                  </p>
                  <p className="text-lg font-medium text-gray-900">
                    {stat.value}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium mb-4">Recent Campaigns</h3>
        {recentCampaigns.length === 0 ? (
          <div className="text-center py-8">
            <p>No campaigns yet</p>
            <button
              onClick={() => navigate("/discovery")}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
            >
              Start Discovery
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {recentCampaigns.map((campaign) => (
              <div
                key={campaign.campaign_id}
                onClick={() => navigate(`/campaign?id=${campaign.campaign_id}`)}
                className="p-4 border rounded hover:bg-gray-50 cursor-pointer"
              >
                <div className="flex justify-between">
                  <div>
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        campaign.status === "completed"
                          ? "bg-green-100"
                          : "bg-gray-100"
                      }`}
                    >
                      {campaign.status}
                    </span>
                    <span className="ml-2">
                      {campaign.business_type} in {campaign.location}
                    </span>
                    <p className="text-sm text-gray-500 mt-1">
                      {campaign.leads_found} results • $
                      {campaign.total_cost.toFixed(2)}
                    </p>
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(campaign.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
