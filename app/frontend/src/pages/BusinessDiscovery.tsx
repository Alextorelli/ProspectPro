import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CollapsibleCard } from "../components/CollapsibleCard";
import {
  GeographicLocation,
  GeographicSelector,
} from "../components/GeographicSelector";
import { MultiSelectBusinessTypes } from "../components/MultiSelectBusinessTypes";
import { ProgressDisplay } from "../components/ProgressDisplay";
import {
  SelectedChips,
  createChipsFromFilters,
} from "../components/SelectedChips";
import { Stepper, type StepConfig } from "../components/Stepper";
import { TierSelector } from "../components/TierSelector";
import { BUSINESS_TYPES_BY_CATEGORY } from "../constants/businessTaxonomy";
import { useAuth } from "../contexts/AuthContext";
import { useBusinessDiscovery } from "../hooks/useBusinessDiscovery";
import { ENRICHMENT_TIERS } from "../lib/supabase";
import { useCampaignStore } from "../stores/campaignStore";
import { exportLeadsToCsv } from "../utils/exportLeadsToCsv";

const DEFAULT_CATEGORY = "Home & Property Services";
const DEFAULT_LOCATION: GeographicLocation = {
  lat: 40.7128,
  lng: -74.006,
  address: "New York, NY",
};
const DEFAULT_RADIUS = 10;

const STEPS: StepConfig[] = [
  { id: "targeting", label: "Targeting", description: "Audience & geography" },
  { id: "setup", label: "Campaign Setup", description: "Tier & quantity" },
  { id: "results", label: "Results", description: "Leads & export" },
];

const getConfidenceColor = (score: number) => {
  if (score >= 90)
    return "border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400 dark:bg-transparent dark:text-emerald-300";
  if (score >= 80)
    return "border border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-400 dark:bg-transparent dark:text-sky-300";
  if (score >= 70)
    return "border border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-400 dark:bg-transparent dark:text-amber-300";
  return "border border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-400 dark:bg-transparent dark:text-rose-300";
};

const getValidationStatusColor = (status?: string) => {
  switch (status) {
    case "validated":
      return "border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400 dark:bg-transparent dark:text-emerald-300";
    case "validating":
      return "border border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-400 dark:bg-transparent dark:text-sky-300";
    case "pending":
      return "border border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-400 dark:bg-transparent dark:text-amber-300";
    case "failed":
      return "border border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-400 dark:bg-transparent dark:text-rose-300";
    default:
      return "border border-gray-200 bg-gray-50 text-gray-700 dark:border-slate-500 dark:bg-transparent dark:text-slate-300";
  }
};

export const BusinessDiscovery: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const handleJobCreated = (jobData: {
    jobId: string;
    campaignId: string;
    status: string;
    estimatedTime?: number;
  }) => {
    console.log("🚀 Job created, navigating to progress page:", jobData);
    navigate(`/campaign/${jobData.campaignId}/progress?jobId=${jobData.jobId}`);
  };

  const {
    startDiscovery,
    isDiscovering,
    progress,
    currentStage,
    cacheStats,
    error,
  } = useBusinessDiscovery(handleJobCreated);

  const defaultBusinessTypes =
    BUSINESS_TYPES_BY_CATEGORY[DEFAULT_CATEGORY] || [];
  const [selectedCategories, setSelectedCategories] = useState<string[]>([
    DEFAULT_CATEGORY,
  ]);
  const [selectedBusinessTypes, setSelectedBusinessTypes] = useState<string[]>(
    defaultBusinessTypes.length > 0 ? [defaultBusinessTypes[0]] : []
  );
  const [keywords, setKeywords] = useState("");
  const [location, setLocation] =
    useState<GeographicLocation>(DEFAULT_LOCATION);
  const [searchRadius, setSearchRadius] = useState<number>(DEFAULT_RADIUS);
  const [expandGeography, setExpandGeography] = useState(false);
  const [numberOfLeads, setNumberOfLeads] = useState(3);
  const [selectedTier, setSelectedTier] =
    useState<keyof typeof ENRICHMENT_TIERS>("BASE");
  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1);

  const currentTierConfig = ENRICHMENT_TIERS[selectedTier];
  const estimatedCost = numberOfLeads * currentTierConfig.price;
  const sliderPercent = ((numberOfLeads - 1) / 9) * 100;

  const { leads, currentCampaign } = useCampaignStore((state) => ({
    leads: state.leads,
    currentCampaign: state.currentCampaign,
  }));
  const setCurrentCampaignInStore = useCampaignStore(
    (state) => state.setCurrentCampaign
  );
  const clearLeadsInStore = useCampaignStore((state) => state.clearLeads);

  const campaignLeads = useMemo(() => {
    if (!currentCampaign) {
      return [];
    }

    return leads.filter(
      (lead) => lead.campaign_id === currentCampaign.campaign_id
    );
  }, [leads, currentCampaign]);

  const qualifiedLeadCount = useMemo(
    () => campaignLeads.filter((lead) => lead.confidence_score >= 70).length,
    [campaignLeads]
  );

  const hasResultsForCurrentCampaign = currentCampaign
    ? campaignLeads.length > 0
    : false;

  useEffect(() => {
    if (hasResultsForCurrentCampaign && activeStep === 2 && !isDiscovering) {
      setActiveStep(3);
    }
  }, [hasResultsForCurrentCampaign, activeStep, isDiscovering]);

  const handleExportResults = () => {
    if (!campaignLeads.length) return;

    exportLeadsToCsv(campaignLeads, {
      fileName: `campaign-${
        currentCampaign?.campaign_id || Date.now()
      }-results.csv`,
    });
  };

  const handleViewCampaign = () => {
    if (!currentCampaign) return;

    navigate(`/campaign?id=${currentCampaign.campaign_id}`);
  };

  const keywordsList = keywords
    .split(",")
    .map((keyword) => keyword.trim())
    .filter((keyword) => keyword.length > 0);
  const keywordsString = keywordsList.join(", ");
  const businessTypesString = selectedBusinessTypes.join(", ");
  const approxCoverage = Math.round(Math.PI * searchRadius * searchRadius);

  const isTargetingValid =
    selectedBusinessTypes.length > 0 && location.address.trim().length > 0;

  // Calculate current step index for Stepper (0-indexed)
  const currentStepIndex = activeStep - 1;

  // Map active filters to chips (must be declared before any early returns to satisfy rules-of-hooks)
  const activeFilterChips = useMemo(() => {
    return createChipsFromFilters({
      categories: selectedCategories,
      location: location.address,
      radius: searchRadius,
      // Add business types as custom chips
    }).concat(
      selectedBusinessTypes.map((type, index) => ({
        id: `type-${index}`,
        label: "Type",
        value: type,
        category: "Business Type",
      }))
    );
  }, [
    selectedCategories,
    location.address,
    searchRadius,
    selectedBusinessTypes,
  ]);

  const handleGeographicChange = (
    updatedLocation: GeographicLocation,
    radius: number
  ) => {
    setLocation(updatedLocation);
    setSearchRadius(radius);
  };

  const handleContinue = () => {
    if (!isTargetingValid) {
      alert("Please select at least one business type and provide a location.");
      return;
    }
    setCurrentCampaignInStore(null);
    clearLeadsInStore();
    setActiveStep(2);
  };

  const handleBackToTargeting = () => {
    setActiveStep(1);
  };

  const handleSearch = () => {
    if (!user) {
      alert("Please sign in to run a discovery campaign.");
      return;
    }

    if (!isTargetingValid) {
      setActiveStep(1);
      alert("Please complete targeting details before running the campaign.");
      return;
    }

    const config = {
      search_terms: `${businessTypesString}${
        keywordsString ? ` ${keywordsString}` : ""
      }`.trim(),
      location: location.address.trim(),
      business_type: businessTypesString,
      budget_limit: estimatedCost,
      max_results: numberOfLeads,
      include_email_validation:
        selectedTier === "PROFESSIONAL" || selectedTier === "ENTERPRISE",
      include_website_validation: true,
      min_confidence_score: 70,
      chamber_verification: true,
      trade_association: true,
      professional_license: true,
      keywords: keywordsString,
      search_radius: `${searchRadius} miles`,
      expand_geography: expandGeography,
      selectedTier,
    };

    console.log("🚀 Starting campaign:", config);
    startDiscovery(config);
  };

  const selectedBusinessTypesPreview = selectedBusinessTypes.length
    ? (() => {
        const preview = selectedBusinessTypes.slice(0, 5).join(", ");
        const remaining = selectedBusinessTypes.length - 5;
        return remaining > 0 ? `${preview} +${remaining} more` : preview;
      })()
    : "No business types selected";

  const summaryItems = [
    {
      label: "Business categories",
      value:
        selectedCategories.length > 0
          ? selectedCategories.join(", ")
          : "No categories selected",
    },
    {
      label: "Business types",
      value: selectedBusinessTypesPreview,
    },
    {
      label: "Keywords",
      value: keywordsString.length > 0 ? keywordsString : "None",
    },
    {
      label: "Location",
      value: location.address,
    },
    {
      label: "Radius",
      value: `${searchRadius} miles`,
    },
    {
      label: "Geography",
      value: expandGeography ? "Auto-expand enabled" : "Stay within radius",
    },
    {
      label: "Coverage",
      value: `~${approxCoverage} square miles`,
    },
  ];

  if (authLoading) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center justify-center space-x-3 text-gray-600 dark:text-slate-300">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          <span>Loading your workspace…</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
          Sign in required
        </h1>
        <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">
          Create an account or sign in to launch new campaigns and access
          verified leads.
        </p>
      </div>
    );
  }

  const handleRemoveFilterChip = (chipId: string) => {
    if (chipId.startsWith("type-")) {
      const index = parseInt(chipId.split("-")[1]);
      setSelectedBusinessTypes((prev) => prev.filter((_, i) => i !== index));
    } else if (chipId === "location") {
      setLocation(DEFAULT_LOCATION);
    } else if (chipId === "radius") {
      setSearchRadius(DEFAULT_RADIUS);
    } else if (chipId.startsWith("category-")) {
      const index = parseInt(chipId.split("-")[1]);
      setSelectedCategories((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const handleClearAllFilters = () => {
    setSelectedCategories([DEFAULT_CATEGORY]);
    setSelectedBusinessTypes(
      defaultBusinessTypes.length > 0 ? [defaultBusinessTypes[0]] : []
    );
    setLocation(DEFAULT_LOCATION);
    setSearchRadius(DEFAULT_RADIUS);
    setKeywords("");
  };

  // Update step status based on validation
  const stepsWithStatus: StepConfig[] = STEPS.map((step, index) => ({
    ...step,
    status:
      index < currentStepIndex
        ? "completed"
        : index === currentStepIndex
        ? "active"
        : index === 1 && !isTargetingValid
        ? "error"
        : "pending",
  }));

  return (
    <div className="space-y-6">
      {/* Active Filter Chips */}
      {activeFilterChips.length > 0 && (
        <SelectedChips
          showTooltips
          ariaLabel="Active discovery filters"
          chips={activeFilterChips}
          maxVisible={6}
          onClearAll={handleClearAllFilters}
          onRemove={handleRemoveFilterChip}
        />
      )}

      <div className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="border-b border-gray-200 px-6 py-4 dark:border-slate-700">
          <Stepper
            allowBackNavigation
            keyboardNavigation
            activeStep={currentStepIndex}
            steps={stepsWithStatus}
            onStepChange={(index) => {
              // Only allow navigation to step 2 if targeting is valid
              if (index === 1 && !isTargetingValid) {
                alert("Please complete targeting details before proceeding.");
                return;
              }
              setActiveStep((index + 1) as 1 | 2 | 3);
            }}
          />
        </div>

        <div className="p-6 space-y-8">
          <section
            aria-hidden={activeStep !== 1}
            className={`space-y-6 ${activeStep === 1 ? "" : "hidden"}`}
          >
            <header>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Targeting & Geography
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                Choose the businesses and regions you want ProspectPro to
                discover.
              </p>
            </header>

            <CollapsibleCard
              defaultOpen={true}
              icon={
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                  />
                </svg>
              }
              persistKey="discovery-business-types"
              subtitle={`${selectedBusinessTypes.length} business type${
                selectedBusinessTypes.length !== 1 ? "s" : ""
              } selected from ${selectedCategories.length} categor${
                selectedCategories.length !== 1 ? "ies" : "y"
              }`}
              title="Business Categories & Types"
            >
              <MultiSelectBusinessTypes
                selectedBusinessTypes={selectedBusinessTypes}
                selectedCategories={selectedCategories}
                onBusinessTypesChange={setSelectedBusinessTypes}
                onCategoriesChange={setSelectedCategories}
              />
            </CollapsibleCard>

            <CollapsibleCard
              defaultOpen={false}
              icon={
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                  />
                </svg>
              }
              persistKey="discovery-keywords"
              subtitle="Optional filters to narrow your search"
              title="Keywords & Refinements"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Additional Keywords (Optional)
                </label>
                <input
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                  placeholder="e.g., luxury, organic, 24-hour (comma-separated)"
                  type="text"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Add comma-separated keywords to refine your search.
                </p>
              </div>
            </CollapsibleCard>

            <CollapsibleCard
              defaultOpen={true}
              icon={
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                  />
                  <path
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                  />
                </svg>
              }
              persistKey="discovery-geography"
              subtitle={`${location.address} • ${searchRadius} mile radius`}
              title="Geographic Targeting"
            >
              <div className="space-y-4">
                <GeographicSelector
                  initialLocation={location}
                  initialRadius={searchRadius}
                  onLocationChange={handleGeographicChange}
                />

                <div className="flex items-center">
                  <input
                    checked={expandGeography}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                    id="expandGeography"
                    type="checkbox"
                    onChange={(e) => setExpandGeography(e.target.checked)}
                  />
                  <label
                    className="ml-2 text-sm text-gray-700 dark:text-gray-300"
                    htmlFor="expandGeography"
                  >
                    Expand geography automatically if initial results are
                    limited
                  </label>
                </div>
              </div>
            </CollapsibleCard>

            <div className="flex justify-end">
              <button
                className="px-5 py-2 rounded-md bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!isTargetingValid}
                type="button"
                onClick={handleContinue}
              >
                Continue to Campaign Setup
              </button>
            </div>
          </section>

          <section
            aria-hidden={activeStep !== 2}
            className={`space-y-6 ${activeStep === 2 ? "" : "hidden"}`}
          >
            <header className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Campaign Setup
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                  Review your targeting, then select enrichment tier and lead
                  quantity.
                </p>
              </div>
              <button
                className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-300"
                type="button"
                onClick={handleBackToTargeting}
              >
                ← Edit targeting
              </button>
            </header>

            <div className="rounded-md border border-gray-200 bg-gray-50 p-4 dark:border-slate-700 dark:bg-slate-900/80">
              <h3 className="mb-3 text-sm font-semibold text-gray-800 dark:text-slate-200">
                Campaign summary
              </h3>
              <dl className="grid gap-3 sm:grid-cols-2">
                {summaryItems.map((item) => (
                  <div key={item.label} className="flex flex-col">
                    <dt className="text-xs uppercase tracking-wide text-gray-500 dark:text-slate-400">
                      {item.label}
                    </dt>
                    <dd className="text-sm text-gray-800 dark:text-slate-100">
                      {item.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            <TierSelector
              numberOfLeads={numberOfLeads}
              selectedTier={selectedTier}
              onTierChange={setSelectedTier}
            />

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-200">
                Number of Leads
              </label>
              <div className="flex items-center gap-4">
                <input
                  className="h-2 flex-1 cursor-pointer appearance-none rounded-full bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  max="10"
                  min="1"
                  style={{
                    background: `linear-gradient(90deg, #2563eb 0%, #2563eb ${sliderPercent}%, #d1d5db ${sliderPercent}%, #d1d5db 100%)`,
                    accentColor: "#2563eb",
                  }}
                  type="range"
                  value={numberOfLeads}
                  onChange={(e) =>
                    setNumberOfLeads(parseInt(e.target.value, 10))
                  }
                />
                <div className="min-w-fit rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700 dark:border-sky-400 dark:bg-slate-900 dark:text-sky-300">
                  {numberOfLeads} leads
                </div>
              </div>
            </div>

            <div className="rounded-lg border-2 border-yellow-400 bg-white p-4 shadow-sm dark:border-amber-400 dark:bg-slate-900">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-300">
                    Estimated cost
                  </p>
                  <div className="mt-1 flex items-baseline gap-x-3">
                    <span className="text-3xl font-bold text-blue-700 dark:text-sky-300">
                      ${estimatedCost.toFixed(2)}
                    </span>
                  </div>
                </div>
                <div className="flex w-full flex-col items-start gap-2 sm:w-auto sm:items-end">
                  <span className="text-sm text-gray-600 dark:text-slate-400">
                    {numberOfLeads} leads × $
                    {currentTierConfig.price.toFixed(2)}
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 dark:border-sky-400 dark:bg-slate-900 dark:text-sky-300">
                      {currentTierConfig.name}
                    </span>
                    <button
                      className="inline-flex items-center justify-center rounded-md bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-sky-500 dark:hover:bg-sky-600"
                      disabled={isDiscovering}
                      type="button"
                      onClick={handleSearch}
                    >
                      {isDiscovering ? (
                        <>
                          <svg
                            className="-ml-1 mr-2 h-4 w-4 animate-spin text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              fill="currentColor"
                            ></path>
                          </svg>
                          Running…
                        </>
                      ) : (
                        "Run Campaign"
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <ProgressDisplay
              cacheStats={cacheStats}
              currentStage={currentStage}
              isDiscovering={isDiscovering}
              progress={progress}
            />
          </section>

          <section
            aria-hidden={activeStep !== 3}
            className={`space-y-6 ${activeStep === 3 ? "" : "hidden"}`}
          >
            <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Campaign Results
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                  {hasResultsForCurrentCampaign
                    ? `${campaignLeads.length} leads captured • ${qualifiedLeadCount} qualified`
                    : isDiscovering
                    ? "We're still enriching this campaign. Hang tight while ProspectPro verifies contacts."
                    : "Results will appear here once a campaign finishes. You can keep working in the meantime."}
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                {currentCampaign && (
                  <button
                    className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-slate-600 dark:bg-transparent dark:text-slate-200 dark:hover:border-sky-400"
                    type="button"
                    onClick={handleViewCampaign}
                  >
                    View full campaign
                  </button>
                )}
                {hasResultsForCurrentCampaign && (
                  <button
                    className="inline-flex items-center gap-2 rounded-md border border-emerald-400 px-4 py-2 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-50 dark:border-emerald-400 dark:text-emerald-300 dark:hover:bg-transparent"
                    type="button"
                    onClick={handleExportResults}
                  >
                    📊 Export CSV
                  </button>
                )}
              </div>
            </header>

            {currentCampaign && (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-slate-700 dark:bg-slate-900/70">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-slate-400">
                      Campaign ID
                    </div>
                    <div className="text-sm font-semibold text-gray-900 dark:text-slate-100">
                      {currentCampaign.campaign_id}
                    </div>
                    <div className="mt-2 text-xs text-gray-500 dark:text-slate-400">
                      Status • {currentCampaign.status}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <div className="text-center">
                      <div className="text-lg font-bold text-gray-900 dark:text-slate-100">
                        {currentCampaign.leads_found ?? campaignLeads.length}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-slate-400">
                        Total Leads
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-600 dark:text-sky-300">
                        {currentCampaign.leads_qualified ?? qualifiedLeadCount}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-slate-400">
                        Qualified
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-600 dark:text-emerald-300">
                        {currentCampaign.leads_validated ?? 0}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-slate-400">
                        Validated
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-purple-600 dark:text-violet-300">
                        {currentCampaign.tier_used || selectedTier}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-slate-400">
                        Tier
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden shadow-sm">
              {!hasResultsForCurrentCampaign ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <span className="text-4xl mb-2">🔍</span>
                  <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                    {isDiscovering
                      ? "ProspectPro is working on your campaign"
                      : "No leads yet"}
                  </h3>
                  <p className="mt-2 max-w-md text-sm text-gray-600 dark:text-gray-300">
                    {isDiscovering
                      ? "Please keep this tab open. We'll move results here automatically once enrichment finishes."
                      : "Launch or complete a campaign to populate results with verified leads."}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-900/40">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-gray-300">
                          Business
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-gray-300">
                          Contact
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-gray-300">
                          Confidence
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-gray-300">
                          Enrichment
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-gray-300">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-gray-300">
                          Cost
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {campaignLeads.map((lead) => (
                        <tr
                          key={lead.id}
                          className="hover:bg-gray-50 dark:hover:bg-gray-900/30"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                              {lead.business_name}
                            </div>
                            <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                              {lead.address}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 dark:text-gray-100 space-y-1">
                              {lead.phone && <div>📞 {lead.phone}</div>}
                              {lead.website && (
                                <div>
                                  🌐{" "}
                                  <a
                                    className="text-blue-600 dark:text-blue-400 hover:underline"
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
                              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300">
                                {lead.enrichment_tier || currentTierConfig.name}
                              </span>
                              {lead.vault_secured && (
                                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300">
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
                              {lead.validation_status || "pending"}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">
                            ${lead.cost_to_acquire.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>

          {error && (
            <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-red-400 dark:text-red-500"
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
                  <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                    Discovery Failed
                  </h3>
                  <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                    <p>
                      {error instanceof Error ? error.message : String(error)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
