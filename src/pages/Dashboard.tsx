import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CampaignsTable } from "../components/CampaignsTable";
import { LeadDetailsDrawer } from "../components/LeadDetailsDrawer";
import { LeadExplorerGrid } from "../components/LeadExplorerGrid";
import { TabConfig, Tabs } from "../components/Tabs";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import { useCampaignStore } from "../stores/campaignStore";
import { sanitizeLeadCollection } from "../stores/utils/leadSanitizers";
import type { BusinessLead, CampaignResult, LeadFilter } from "../types";
import {
  applyLeadFilters,
  calculateDashboardStats,
  getDateRangePreset,
} from "../utils/leadFilters";

const DATE_PRESETS: Array<{
  label: string;
  value: NonNullable<LeadFilter["datePreset"]>;
  days: number;
}> = [
  { label: "Last 7 days", value: "7d", days: 7 },
  { label: "Last 30 days", value: "30d", days: 30 },
  { label: "Last 90 days", value: "90d", days: 90 },
];

type CampaignFilter = {
  status?: CampaignResult["status"];
  tier?: string;
  datePreset?: NonNullable<LeadFilter["datePreset"]>;
  dateRange?: {
    start: string;
    end: string;
  };
};

type StatsCardTarget = "leads" | "qualified" | "campaigns";

const coerceNumber = (value: unknown, fallback = 0): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeDateValue = (value?: string) => {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const applyCampaignFilters = (
  campaigns: CampaignResult[],
  filters: CampaignFilter
): CampaignResult[] => {
  if (!campaigns.length) {
    return campaigns;
  }

  return campaigns.filter((campaign) => {
    const { status, tier, dateRange } = filters;

    if (status && campaign.status !== status) {
      return false;
    }

    if (tier) {
      const normalizedTier = tier.toLowerCase();
      const campaignTier = (campaign.tier_used || "").toLowerCase();
      if (!campaignTier || campaignTier !== normalizedTier) {
        return false;
      }
    }

    if (dateRange) {
      const createdAt = normalizeDateValue(campaign.created_at);
      const start = normalizeDateValue(dateRange.start);
      const end = normalizeDateValue(dateRange.end);

      if (createdAt && start && end) {
        if (createdAt < start || createdAt > end) {
          return false;
        }
      }
    }

    return true;
  });
};

const normalizeCampaignStatus = (value: unknown): CampaignResult["status"] => {
  if (value === "completed" || value === "failed" || value === "cancelled") {
    return value;
  }

  if (value === "running") {
    return "running";
  }

  return "running";
};

const mapCampaignRecord = (record: any): CampaignResult | null => {
  if (!record) {
    return null;
  }

  const campaignIdentifier = record.campaign_id ?? record.id;

  if (!campaignIdentifier) {
    console.warn("[Dashboard] Ignoring campaign without identifier", record);
    return null;
  }

  const status = normalizeCampaignStatus(record.status);
  const leadsFound = coerceNumber(
    record.leads_found ?? record.results_count,
    0
  );
  const leadsQualified = coerceNumber(record.leads_qualified, 0);
  const leadsValidated = coerceNumber(
    record.leads_validated ?? record.leads_qualified,
    leadsQualified
  );

  const progressValue = (() => {
    if (typeof record.progress === "number") {
      return Math.min(100, Math.max(0, record.progress));
    }

    if (status === "completed") {
      return 100;
    }

    return leadsFound > 0 ? 80 : 0;
  })();

  const parsedCreatedAt =
    typeof record.created_at === "string"
      ? record.created_at
      : new Date().toISOString();

  const parsedCompletedAt =
    typeof record.completed_at === "string" ? record.completed_at : undefined;

  const cachePerformance =
    record.cache_performance && typeof record.cache_performance === "object"
      ? record.cache_performance
      : undefined;

  return {
    id: typeof record.id === "string" ? record.id : undefined,
    campaign_id: String(campaignIdentifier),
    business_type:
      typeof record.business_type === "string"
        ? record.business_type
        : undefined,
    location: typeof record.location === "string" ? record.location : undefined,
    status,
    progress: progressValue,
    total_cost: coerceNumber(record.total_cost, 0),
    results_count:
      record.results_count != null
        ? coerceNumber(record.results_count, 0)
        : undefined,
    leads_found: leadsFound,
    leads_qualified: leadsQualified,
    leads_validated: leadsValidated,
    created_at: parsedCreatedAt,
    completed_at: parsedCompletedAt,
    error_message:
      typeof record.error_message === "string"
        ? record.error_message
        : undefined,
    tier_used:
      typeof record.tier_used === "string" ? record.tier_used : undefined,
    vault_secured:
      typeof record.vault_secured === "boolean"
        ? record.vault_secured
        : status === "completed"
        ? true
        : undefined,
    cache_performance: cachePerformance,
  } satisfies CampaignResult;
};

const isCampaignResult = (
  value: CampaignResult | null
): value is CampaignResult => value !== null;

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const { campaigns: storeCampaigns, leads: storeLeads } = useCampaignStore();

  const [campaignCollection, setCampaignCollection] =
    useState<CampaignResult[]>(storeCampaigns);
  const [leadCollection, setLeadCollection] =
    useState<BusinessLead[]>(storeLeads);
  const [campaignsLoading, setCampaignsLoading] = useState(true);
  const [leadsLoading, setLeadsLoading] = useState(true);
  const [campaignError, setCampaignError] = useState<string | null>(null);
  const [leadsError, setLeadsError] = useState<string | null>(null);
  const [leadFilters, setLeadFilters] = useState<LeadFilter>({});
  const [campaignFilters, setCampaignFilters] = useState<CampaignFilter>({});
  const [selectedLead, setSelectedLead] = useState<BusinessLead | null>(null);
  const [activeTab, setActiveTab] = useState<string>("leads");
  const [activeDatePreset, setActiveDatePreset] =
    useState<LeadFilter["datePreset"]>();
  const [activeCampaignDatePreset, setActiveCampaignDatePreset] =
    useState<CampaignFilter["datePreset"]>();

  useEffect(() => {
    if (storeCampaigns.length) {
      setCampaignCollection(storeCampaigns);
    }
  }, [storeCampaigns]);

  useEffect(() => {
    if (storeLeads.length) {
      setLeadCollection(storeLeads);
    }
  }, [storeLeads]);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user?.id) {
      setCampaignCollection([]);
      setCampaignsLoading(false);
      setCampaignError(null);
      return;
    }

    let isCancelled = false;

    const fetchCampaigns = async () => {
      setCampaignsLoading(true);
      try {
        const { data, error } = await supabase
          .from("campaigns")
          .select(
            "id,business_type,location,status,total_cost,results_count,created_at,updated_at"
          )
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (isCancelled) {
          return;
        }

        if (error) {
          console.error("[Dashboard] campaign fetch error", error);
          setCampaignError(error.message);
          return;
        }

        const mappedCampaigns = Array.isArray(data)
          ? data.map(mapCampaignRecord).filter(isCampaignResult)
          : [];

        setCampaignCollection(mappedCampaigns);
        setCampaignError(null);
      } catch (error) {
        if (isCancelled) {
          return;
        }
        console.error("[Dashboard] campaign fetch unexpected error", error);
        setCampaignError(
          error instanceof Error ? error.message : "Failed to load campaigns"
        );
      } finally {
        if (!isCancelled) {
          setCampaignsLoading(false);
        }
      }
    };

    fetchCampaigns();

    return () => {
      isCancelled = true;
    };
  }, [authLoading, user?.id]);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user?.id) {
      setLeadCollection([]);
      setLeadsLoading(false);
      setLeadsError(null);
      return;
    }

    let isCancelled = false;

    const fetchLeads = async () => {
      setLeadsLoading(true);
      try {
        const { data, error } = await supabase
          .from("leads")
          .select(
            "id,campaign_id,business_name,address,phone,website,email,confidence_score,validation_cost,enrichment_data,created_at"
          )
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (isCancelled) {
          return;
        }

        if (error) {
          console.error("[Dashboard] lead fetch error", error);
          setLeadsError(error.message);
          return;
        }

        const sanitized = sanitizeLeadCollection(
          (data as any[]) ?? [],
          null,
          "dashboard leads fetch"
        );
        setLeadCollection(sanitized);
        setLeadsError(null);
      } catch (error) {
        if (isCancelled) {
          return;
        }
        console.error("[Dashboard] lead fetch unexpected error", error);
        setLeadsError(
          error instanceof Error ? error.message : "Failed to load leads"
        );
      } finally {
        if (!isCancelled) {
          setLeadsLoading(false);
        }
      }
    };

    fetchLeads();

    return () => {
      isCancelled = true;
    };
  }, [authLoading, user?.id]);

  useEffect(() => {
    if (!leadCollection.length) {
      setSelectedLead(null);
    }
  }, [leadCollection.length]);

  const filteredLeads = useMemo(
    () => applyLeadFilters(leadCollection, leadFilters),
    [leadCollection, leadFilters]
  );

  const filteredCampaigns = useMemo(
    () => applyCampaignFilters(campaignCollection, campaignFilters),
    [campaignCollection, campaignFilters]
  );

  const stats = useMemo(
    () => calculateDashboardStats(leadCollection, campaignCollection.length),
    [leadCollection, campaignCollection.length]
  );

  const campaignTierOptions = useMemo(() => {
    const tiers = new Set<string>();
    for (const campaign of campaignCollection) {
      if (campaign.tier_used) {
        tiers.add(campaign.tier_used);
      }
    }
    return Array.from(tiers).sort((a, b) => a.localeCompare(b));
  }, [campaignCollection]);

  const enrichmentOptions = useMemo(() => {
    const tiers = new Set<string>();
    for (const lead of leadCollection) {
      const tier =
        lead.enrichment_tier || lead.enrichment_data?.enrichmentTier || "";
      if (tier) {
        tiers.add(tier);
      }
    }
    return Array.from(tiers).sort((a, b) => a.localeCompare(b));
  }, [leadCollection]);

  const applyDatePresetFilter = (preset: (typeof DATE_PRESETS)[number]) => {
    const range = getDateRangePreset(preset.days);
    setLeadFilters((current) => ({
      ...current,
      datePreset: preset.value,
      dateRange: range,
    }));
    setActiveDatePreset(preset.value);
  };

  const removeDatePresetFilter = () => {
    setLeadFilters((current) => {
      const { datePreset: _preset, dateRange: _range, ...rest } = current;
      return rest;
    });
    setActiveDatePreset(undefined);
  };

  const handleClearFilters = () => {
    setLeadFilters({});
    setActiveDatePreset(undefined);
  };

  const applyCampaignDatePreset = (preset: (typeof DATE_PRESETS)[number]) => {
    const range = getDateRangePreset(preset.days);
    setCampaignFilters((current) => ({
      ...current,
      datePreset: preset.value,
      dateRange: range,
    }));
    setActiveCampaignDatePreset(preset.value);
  };

  const removeCampaignDatePreset = () => {
    setCampaignFilters((current) => {
      const { datePreset: _preset, dateRange: _range, ...rest } = current;
      return rest;
    });
    setActiveCampaignDatePreset(undefined);
  };

  const handleClearCampaignFilters = () => {
    setCampaignFilters({});
    setActiveCampaignDatePreset(undefined);
  };

  const handleStatsCardClick = (target: StatsCardTarget) => {
    if (target === "campaigns") {
      setActiveTab("campaigns");
      return;
    }

    setActiveTab("leads");

    if (target === "qualified") {
      setLeadFilters((current) => ({
        ...current,
        confidenceBucket: "high",
      }));
    }
  };

  const tabs: TabConfig[] = [
    {
      id: "leads",
      label: "Lead Explorer",
      badge: filteredLeads.length,
      icon: (
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
      ),
      content: (
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                <span className="font-medium text-gray-700 dark:text-gray-200">
                  Tier
                </span>
                <select
                  className="block w-44 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-sm"
                  value={leadFilters.enrichmentTier || ""}
                  onChange={(event) =>
                    setLeadFilters((current) => ({
                      ...current,
                      enrichmentTier: event.target.value || undefined,
                    }))
                  }
                >
                  <option value="">All tiers</option>
                  {enrichmentOptions.map((tier) => (
                    <option key={tier} value={tier}>
                      {tier}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {DATE_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() =>
                    activeDatePreset === preset.value
                      ? removeDatePresetFilter()
                      : applyDatePresetFilter(preset)
                  }
                  className={`px-3 py-2 text-xs font-medium rounded-md border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900 ${
                    activeDatePreset === preset.value
                      ? "border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-900/40 dark:text-blue-200"
                      : "border-gray-300 text-gray-600 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
                  }`}
                >
                  {preset.label}
                </button>
              ))}

              <button
                type="button"
                onClick={handleClearFilters}
                className="ml-auto px-3 py-2 text-xs font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              >
                Clear filters
              </button>
            </div>
          </div>

          <LeadExplorerGrid
            leads={filteredLeads}
            onRowClick={(lead) => setSelectedLead(lead)}
            isLoading={leadsLoading}
          />
        </div>
      ),
    },
    {
      id: "campaigns",
      label: "Campaigns",
      badge: filteredCampaigns.length,
      icon: (
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
          />
        </svg>
      ),
      content: (
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                <span className="font-medium text-gray-700 dark:text-gray-200">
                  Status
                </span>
                <select
                  className="block w-44 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-sm"
                  value={campaignFilters.status || ""}
                  onChange={(event) => {
                    const value = event.target.value as
                      | CampaignResult["status"]
                      | "";
                    setCampaignFilters((current) => ({
                      ...current,
                      status: value
                        ? (value as CampaignResult["status"])
                        : undefined,
                    }));
                  }}
                >
                  <option value="">All statuses</option>
                  <option value="running">Running</option>
                  <option value="completed">Completed</option>
                  <option value="failed">Failed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </label>

              <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                <span className="font-medium text-gray-700 dark:text-gray-200">
                  Tier
                </span>
                <select
                  className="block w-44 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-sm"
                  value={campaignFilters.tier || ""}
                  onChange={(event) =>
                    setCampaignFilters((current) => ({
                      ...current,
                      tier: event.target.value || undefined,
                    }))
                  }
                  disabled={campaignTierOptions.length === 0}
                >
                  <option value="">All tiers</option>
                  {campaignTierOptions.map((tier) => (
                    <option key={tier} value={tier}>
                      {tier}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {DATE_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() =>
                    activeCampaignDatePreset === preset.value
                      ? removeCampaignDatePreset()
                      : applyCampaignDatePreset(preset)
                  }
                  className={`px-3 py-2 text-xs font-medium rounded-md border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900 ${
                    activeCampaignDatePreset === preset.value
                      ? "border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-900/40 dark:text-blue-200"
                      : "border-gray-300 text-gray-600 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
                  }`}
                >
                  {preset.label}
                </button>
              ))}

              <button
                type="button"
                onClick={handleClearCampaignFilters}
                className="ml-auto px-3 py-2 text-xs font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              >
                Clear filters
              </button>
            </div>
          </div>

          <CampaignsTable
            campaigns={filteredCampaigns}
            onRowClick={(campaign: CampaignResult) =>
              navigate(`/campaign?id=${campaign.campaign_id}`)
            }
            isLoading={campaignsLoading}
          />
        </div>
      ),
    },
    {
      id: "insights",
      label: "Insights",
      content: (
        <div className="text-center py-16 text-gray-500 dark:text-gray-400">
          Analytics and trends are coming soon.
        </div>
      ),
    },
  ];

  const combinedError = campaignError ?? leadsError;

  if (authLoading || (campaignsLoading && leadsLoading)) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Loading dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-8 text-center">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Sign in to view your dashboard
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Create an account or sign in to access campaign analytics and lead
          history.
        </p>
      </div>
    );
  }

  if (combinedError) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <div className="flex">
          <div className="text-red-500 dark:text-red-400 text-xl mr-3">⚠️</div>
          <div>
            <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
              Error loading dashboard
            </h3>
            <p className="text-sm text-red-700 dark:text-red-300 mt-1">
              {combinedError}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Monitor lead quality, campaign performance, and enrichment progress.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <button
          type="button"
          onClick={() => handleStatsCardClick("leads")}
          className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5 text-left hover:shadow transition-shadow"
        >
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Total Leads
          </div>
          <div className="mt-2 text-3xl font-semibold text-gray-900 dark:text-gray-100">
            {stats.totalLeads}
          </div>
          <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Avg confidence: {stats.averageConfidence}%
          </div>
        </button>

        <button
          type="button"
          onClick={() => handleStatsCardClick("qualified")}
          className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5 text-left hover:shadow transition-shadow"
        >
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Qualified Leads
          </div>
          <div className="mt-2 text-3xl font-semibold text-green-600 dark:text-green-400">
            {stats.qualifiedLeads}
          </div>
          <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Confidence ≥ 80%
          </div>
        </button>

        <button
          type="button"
          onClick={() => handleStatsCardClick("campaigns")}
          className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5 text-left hover:shadow transition-shadow"
        >
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Active Campaigns
          </div>
          <div className="mt-2 text-3xl font-semibold text-blue-600 dark:text-blue-400">
            {campaignCollection.length}
          </div>
          <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Showing {filteredCampaigns.length} campaigns
          </div>
        </button>
      </div>

      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onChange={setActiveTab}
        keyboardNavigation
        ariaLabel="Dashboard navigation tabs"
      />

      <LeadDetailsDrawer
        lead={selectedLead}
        isOpen={Boolean(selectedLead)}
        onClose={() => setSelectedLead(null)}
      />
    </div>
  );
};

export default Dashboard;
