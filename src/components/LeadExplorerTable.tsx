import React, { useEffect, useMemo, useState } from "react";
import type { BusinessLead } from "../types";

interface LeadExplorerTableProps {
  leads: BusinessLead[];
  onRowClick?: (lead: BusinessLead) => void;
  isLoading?: boolean;
  pageSize?: number;
}

type SortDirection = "asc" | "desc";

type SortableField = "business_name" | "confidence_score" | "enrichment_tier";

const SORT_LABELS: Record<SortableField, string> = {
  business_name: "Business",
  confidence_score: "Confidence",
  enrichment_tier: "Tier",
};

export const LeadExplorerTable: React.FC<LeadExplorerTableProps> = ({
  leads,
  onRowClick,
  isLoading = false,
  pageSize = 25,
}) => {
  // Hoist all hooks to top-level before any early returns
  const [sortField, setSortField] = useState<SortableField>("confidence_score");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [currentPage, setCurrentPage] = useState(0);
  const sortedLeads = useMemo(() => {
    const entries = [...leads];
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
  }, [leads, sortField, sortDirection]);
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

  const toggleSort = (field: SortableField) => {
    if (field === sortField) {
      setSortDirection((direction) => (direction === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const showingStart =
    sortedLeads.length === 0 ? 0 : currentPage * pageSize + 1;
  const showingEnd =
    sortedLeads.length === 0
      ? 0
      : Math.min(sortedLeads.length, (currentPage + 1) * pageSize);

  return (
    <div className="overflow-hidden border border-gray-200 dark:border-gray-700 rounded-lg">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            {Object.entries(SORT_LABELS).map(([field, label]) => (
              <th
                key={field}
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400"
                scope="col"
              >
                <button
                  className="flex items-center space-x-1 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
                  type="button"
                  onClick={() => toggleSort(field as SortableField)}
                >
                  <span>{label}</span>
                  {sortField === field ? (
                    <span aria-hidden="true">
                      {sortDirection === "asc" ? "▲" : "▼"}
                    </span>
                  ) : (
                    <span
                      aria-hidden="true"
                      className="text-gray-400 dark:text-gray-500"
                    >
                      ⇅
                    </span>
                  )}
                </button>
              </th>
            ))}
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Contact
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Campaign
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
          {isLoading ? (
            <tr>
              <td
                className="px-6 py-6 text-center text-sm text-gray-500 dark:text-gray-400"
                colSpan={5}
              >
                Loading leads...
              </td>
            </tr>
          ) : sortedLeads.length === 0 ? (
            <tr>
              <td
                className="px-6 py-6 text-center text-sm text-gray-500 dark:text-gray-400"
                colSpan={5}
              >
                No leads found. Adjust your filters or start a new campaign.
              </td>
            </tr>
          ) : (
            pagedLeads.map((lead) => {
              const enrichmentTier =
                lead.enrichment_tier || lead.enrichment_data?.enrichmentTier;

              return (
                <tr
                  key={lead.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                  onClick={() => onRowClick?.(lead)}
                >
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {lead.business_name || "Unnamed business"}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-700 dark:text-gray-200">
                      {lead.confidence_score ?? 0}%
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                      {enrichmentTier || "Standard"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-200">
                    <div className="space-y-1">
                      {lead.email && (
                        <div
                          className="truncate"
                          title={lead.email}
                          onClick={(event) => event.stopPropagation()}
                        >
                          <a
                            className="text-blue-600 hover:underline dark:text-blue-400"
                            href={`mailto:${lead.email}`}
                          >
                            {lead.email}
                          </a>
                        </div>
                      )}
                      {lead.phone && <div>Phone: {lead.phone}</div>}
                      {lead.website && (
                        <div onClick={(event) => event.stopPropagation()}>
                          <a
                            className="text-blue-600 hover:underline dark:text-blue-400"
                            href={lead.website}
                            rel="noopener noreferrer"
                            target="_blank"
                          >
                            Website
                          </a>
                        </div>
                      )}
                      {!lead.email && !lead.phone && !lead.website && (
                        <div className="text-xs text-gray-400">
                          No contact information available.
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                    {lead.campaign_id ? (
                      <a
                        className="text-blue-600 hover:underline dark:text-blue-400"
                        href={`/campaign?id=${lead.campaign_id}`}
                        onClick={(event) => event.stopPropagation()}
                      >
                        View campaign
                      </a>
                    ) : (
                      <span className="text-xs text-gray-400">Not linked</span>
                    )}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>

      <div className="flex items-center justify-between px-6 py-3 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-600 dark:text-gray-400">
        <span>
          Showing {showingStart}-{showingEnd} of {sortedLeads.length}
        </span>
        <div className="flex items-center gap-2">
          <button
            className="px-2 py-1 rounded border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={currentPage === 0 || totalPages === 0}
            type="button"
            onClick={() => setCurrentPage((page) => Math.max(0, page - 1))}
          >
            Previous
          </button>
          <span>
            Page {totalPages === 0 ? 0 : currentPage + 1} of {totalPages}
          </span>
          <button
            className="px-2 py-1 rounded border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={totalPages === 0 || currentPage >= totalPages - 1}
            type="button"
            onClick={() =>
              setCurrentPage((page) =>
                Math.min(
                  totalPages === 0 ? 0 : totalPages - 1,
                  Math.max(0, page + 1)
                )
              )
            }
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};
