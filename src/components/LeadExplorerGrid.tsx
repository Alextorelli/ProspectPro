import React, { useEffect, useMemo, useState } from "react";
import type { BusinessLead } from "../types";
import { CollapsibleCard } from "./CollapsibleCard";
import { LeadCard } from "./LeadCard";

interface LeadExplorerGridProps {
  leads: BusinessLead[];
  onRowClick?: (lead: BusinessLead) => void;
  isLoading?: boolean;
  pageSize?: number;
}

type SortDirection = "asc" | "desc";
type SortableField = "business_name" | "confidence_score" | "enrichment_tier";
type ViewMode = "grid" | "list";

const SORT_LABELS: Record<SortableField, string> = {
  business_name: "Business Name",
  confidence_score: "Confidence Score",
  enrichment_tier: "Enrichment Tier",
};

export const LeadExplorerGrid: React.FC<LeadExplorerGridProps> = ({
  leads,
  onRowClick,
  isLoading = false,
  pageSize = 24,
}) => {
  // Hoist all hooks to top-level before any early returns
  const [sortField, setSortField] = useState<SortableField>("confidence_score");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [currentPage, setCurrentPage] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [confidenceRange, setConfidenceRange] = useState<[number, number]>([
    0, 100,
  ]);
  const [selectedTiers, setSelectedTiers] = useState<Set<string>>(new Set());
  const [hasEmail, setHasEmail] = useState<boolean | null>(null);
  const [hasPhone, setHasPhone] = useState<boolean | null>(null);

  // Apply filters
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      // Confidence range
      const score = lead.confidence_score ?? 0;
      if (score < confidenceRange[0] || score > confidenceRange[1])
        return false;

      // Tier filter
      const tier =
        lead.enrichment_tier ||
        lead.enrichment_data?.enrichmentTier ||
        "ESSENTIAL";
      if (selectedTiers.size > 0 && !selectedTiers.has(tier)) return false;

      // Email filter
      if (hasEmail !== null && (hasEmail ? !lead.email : lead.email))
        return false;

      // Phone filter
      if (hasPhone !== null && (hasPhone ? !lead.phone : lead.phone))
        return false;

      return true;
    });
  }, [leads, confidenceRange, selectedTiers, hasEmail, hasPhone]);

  const sortedLeads = useMemo(() => {
    const entries = [...filteredLeads];
    entries.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];

      if (sortField === "business_name" || sortField === "enrichment_tier") {
        const aText = (
          sortField === "enrichment_tier"
            ? a.enrichment_tier || a.enrichment_data?.enrichmentTier || ""
            : (aValue as string | undefined) || ""
        ).toLowerCase();
        const bText = (
          sortField === "enrichment_tier"
            ? b.enrichment_tier || b.enrichment_data?.enrichmentTier || ""
            : (bValue as string | undefined) || ""
        ).toLowerCase();

        if (aText === bText) return 0;
        return sortDirection === "asc"
          ? aText.localeCompare(bText)
          : bText.localeCompare(aText);
      }

      const aNumber = typeof aValue === "number" ? aValue : 0;
      const bNumber = typeof bValue === "number" ? bValue : 0;
      if (aNumber === bNumber) return 0;
      return sortDirection === "asc" ? aNumber - bNumber : bNumber - aNumber;
    });
    return entries;
  }, [filteredLeads, sortField, sortDirection]);

  const totalPages =
    sortedLeads.length === 0 ? 0 : Math.ceil(sortedLeads.length / pageSize);

  useEffect(() => {
    setCurrentPage(0);
  }, [sortedLeads.length, pageSize]);

  useEffect(() => {
    if (totalPages === 0) {
      setCurrentPage(0);
      return;
    }

    if (currentPage > totalPages - 1) {
      setCurrentPage(totalPages - 1);
    }
  }, [currentPage, totalPages]);

  const pagedLeads = useMemo(() => {
    if (totalPages === 0) {
      return [];
    }

    const startIndex = currentPage * pageSize;
    return sortedLeads.slice(startIndex, startIndex + pageSize);
  }, [sortedLeads, currentPage, pageSize, totalPages]);

  const handleTierToggle = (tier: string) => {
    setSelectedTiers((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(tier)) {
        newSet.delete(tier);
      } else {
        newSet.add(tier);
      }
      return newSet;
    });
  };

  const handleClearFilters = () => {
    setConfidenceRange([0, 100]);
    setSelectedTiers(new Set());
    setHasEmail(null);
    setHasPhone(null);
  };

  const activeFilterCount =
    (confidenceRange[0] !== 0 || confidenceRange[1] !== 100 ? 1 : 0) +
    selectedTiers.size +
    (hasEmail !== null ? 1 : 0) +
    (hasPhone !== null ? 1 : 0);

  const showingStart =
    sortedLeads.length === 0 ? 0 : currentPage * pageSize + 1;
  const showingEnd =
    sortedLeads.length === 0
      ? 0
      : Math.min(sortedLeads.length, (currentPage + 1) * pageSize);

  // Accessibility and UX: close drawer on Escape and lock body scroll while open
  useEffect(() => {
    if (!showFilters) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowFilters(false);
      }
    };
    document.addEventListener("keydown", onKeyDown);

    // Lock body scroll
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [showFilters]);

  // Reusable Filters content for desktop sidebar and mobile drawer
  const FiltersContent = () => (
    <>
      <CollapsibleCard
        defaultOpen
        persistKey="lead-explorer-confidence-filter"
        title="Confidence Score"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
              Range: {confidenceRange[0]}% - {confidenceRange[1]}%
            </label>
            <div className="space-y-2">
              <input
                className="w-full"
                max="100"
                min="0"
                type="range"
                value={confidenceRange[0]}
                onChange={(e) =>
                  setConfidenceRange([
                    parseInt(e.target.value),
                    confidenceRange[1],
                  ])
                }
              />
              <input
                className="w-full"
                max="100"
                min="0"
                type="range"
                value={confidenceRange[1]}
                onChange={(e) =>
                  setConfidenceRange([
                    confidenceRange[0],
                    parseInt(e.target.value),
                  ])
                }
              />
            </div>
          </div>
        </div>
      </CollapsibleCard>

      <CollapsibleCard
        defaultOpen
        persistKey="lead-explorer-tier-filter"
        subtitle={
          selectedTiers.size > 0 ? `${selectedTiers.size} selected` : undefined
        }
        title="Enrichment Tier"
      >
        <div className="space-y-2">
          {["ESSENTIAL", "PROFESSIONAL", "BUSINESS", "ENTERPRISE"].map(
            (tier) => (
              <label key={tier} className="flex items-center gap-2 text-sm">
                <input
                  checked={selectedTiers.has(tier)}
                  className="rounded border-gray-300 dark:border-gray-600"
                  type="checkbox"
                  onChange={() => handleTierToggle(tier)}
                />
                <span className="text-gray-700 dark:text-gray-300">{tier}</span>
              </label>
            )
          )}
        </div>
      </CollapsibleCard>

      <CollapsibleCard
        defaultOpen
        persistKey="lead-explorer-contact-filter"
        subtitle={
          (hasEmail !== null ? 1 : 0) + (hasPhone !== null ? 1 : 0) > 0
            ? `${
                (hasEmail !== null ? 1 : 0) + (hasPhone !== null ? 1 : 0)
              } filters active`
            : undefined
        }
        title="Contact Data"
      >
        <div className="space-y-3">
          <div>
            <span className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email Available
            </span>
            <div className="flex gap-2">
              <button
                className={`px-3 py-1 text-xs rounded ${
                  hasEmail === true
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                }`}
                type="button"
                onClick={() => setHasEmail(hasEmail === true ? null : true)}
              >
                Yes
              </button>
              <button
                className={`px-3 py-1 text-xs rounded ${
                  hasEmail === false
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                }`}
                type="button"
                onClick={() => setHasEmail(hasEmail === false ? null : false)}
              >
                No
              </button>
            </div>
          </div>
          <div>
            <span className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
              Phone Available
            </span>
            <div className="flex gap-2">
              <button
                className={`px-3 py-1 text-xs rounded ${
                  hasPhone === true
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                }`}
                type="button"
                onClick={() => setHasPhone(hasPhone === true ? null : true)}
              >
                Yes
              </button>
              <button
                className={`px-3 py-1 text-xs rounded ${
                  hasPhone === false
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                }`}
                type="button"
                onClick={() => setHasPhone(hasPhone === false ? null : false)}
              >
                No
              </button>
            </div>
          </div>
        </div>
      </CollapsibleCard>

      {activeFilterCount > 0 && (
        <button
          className="w-full px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"
          type="button"
          onClick={handleClearFilters}
        >
          Clear All Filters ({activeFilterCount})
        </button>
      )}
    </>
  );

  return (
    <div className="flex gap-6">
      {/* Sidebar Filters (desktop and up) */}
      <aside className="hidden md:block w-64 flex-shrink-0 space-y-4">
        <FiltersContent />
      </aside>

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        {/* Toolbar */}
        <div className="mb-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Sort Controls */}
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600 dark:text-gray-400">
                Sort by:
              </label>
              <select
                className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                value={sortField}
                onChange={(e) => setSortField(e.target.value as SortableField)}
              >
                {Object.entries(SORT_LABELS).map(([field, label]) => (
                  <option key={field} value={field}>
                    {label}
                  </option>
                ))}
              </select>
              <button
                aria-label={`Sort ${
                  sortDirection === "asc" ? "ascending" : "descending"
                }`}
                className="p-1.5 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                type="button"
                onClick={() =>
                  setSortDirection((d) => (d === "asc" ? "desc" : "asc"))
                }
              >
                <span className="text-gray-600 dark:text-gray-400">
                  {sortDirection === "asc" ? "↑" : "↓"}
                </span>
              </button>
            </div>

            {/* Mobile Filters Button */}
            <div className="md:hidden">
              <button
                aria-label="Open filters"
                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                type="button"
                onClick={() => setShowFilters(true)}
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M3 4h18M6 8h12M9 12h6M11 16h2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                  />
                </svg>
                <span>Filters</span>
                {activeFilterCount > 0 && (
                  <span className="ml-1 inline-flex items-center justify-center rounded-full bg-blue-600 text-white text-[10px] font-semibold min-w-[18px] h-[18px] px-1">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <button
                aria-label="Grid view"
                className={`p-1.5 rounded ${
                  viewMode === "grid"
                    ? "bg-white dark:bg-gray-700 shadow"
                    : "hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
                type="button"
                onClick={() => setViewMode("grid")}
              >
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                aria-label="List view"
                className={`p-1.5 rounded ${
                  viewMode === "list"
                    ? "bg-white dark:bg-gray-700 shadow"
                    : "hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
                type="button"
                onClick={() => setViewMode("list")}
              >
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    clipRule="evenodd"
                    d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                    fillRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>

          <div className="text-sm text-gray-600 dark:text-gray-400">
            {showingStart}-{showingEnd} of {sortedLeads.length} leads
            {filteredLeads.length < leads.length && (
              <span className="ml-1 text-xs">
                ({leads.length - filteredLeads.length} filtered)
              </span>
            )}
          </div>
        </div>

        {/* Lead Grid/List */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
              Loading leads...
            </p>
          </div>
        ) : sortedLeads.length === 0 ? (
          <div className="text-center py-12 border border-gray-200 dark:border-gray-700 rounded-lg">
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
            <h3 className="mt-4 text-sm font-medium text-gray-900 dark:text-gray-100">
              No leads found
            </h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              {activeFilterCount > 0
                ? "Adjust your filters to see more results."
                : "Start a new campaign to generate leads."}
            </p>
            {activeFilterCount > 0 && (
              <button
                className="mt-4 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700"
                type="button"
                onClick={handleClearFilters}
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Mobile Filters Drawer */}
            {showFilters && (
              <div
                aria-labelledby="filters-title"
                aria-modal="true"
                className="fixed inset-0 z-40"
                role="dialog"
              >
                <div
                  aria-hidden="true"
                  className="fixed inset-0 bg-black/40"
                  onClick={() => setShowFilters(false)}
                />
                <div className="fixed inset-y-0 right-0 w-full max-w-sm bg-white dark:bg-gray-900 shadow-xl p-4 overflow-y-auto">
                  <div className="flex items-center justify-between mb-3">
                    <h2
                      className="text-base font-semibold text-gray-900 dark:text-gray-100"
                      id="filters-title"
                    >
                      Filters
                    </h2>
                    <button
                      autoFocus
                      aria-label="Close filters"
                      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                      type="button"
                      onClick={() => setShowFilters(false)}
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          d="M6 18L18 6M6 6l12 12"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                        />
                      </svg>
                    </button>
                  </div>

                  <div className="space-y-4">
                    <FiltersContent />
                  </div>
                </div>
              </div>
            )}

            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4"
                  : "space-y-4"
              }
            >
              {pagedLeads.map((lead) => (
                <LeadCard
                  key={lead.id}
                  lead={lead}
                  onClick={() => onRowClick?.(lead)}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <button
                  className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-800"
                  disabled={currentPage === 0}
                  type="button"
                  onClick={() =>
                    setCurrentPage((page) => Math.max(0, page - 1))
                  }
                >
                  Previous
                </button>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Page {currentPage + 1} of {totalPages}
                </span>
                <button
                  className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-800"
                  disabled={currentPage >= totalPages - 1}
                  type="button"
                  onClick={() =>
                    setCurrentPage((page) => Math.min(totalPages - 1, page + 1))
                  }
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
