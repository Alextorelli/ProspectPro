import React, { useEffect, useMemo, useState } from "react";
import type { CampaignResult } from "../types";

interface CampaignsTableProps {
  campaigns: CampaignResult[];
  onRowClick?: (campaign: CampaignResult) => void;
  isLoading?: boolean;
  pageSize?: number;
}

type SortDirection = "asc" | "desc";

type SortableField =
  | "business_type"
  | "status"
  | "leads_found"
  | "progress"
  | "created_at"
  | "total_cost";

const SORT_LABELS: Record<SortableField, string> = {
  business_type: "Campaign",
  status: "Status",
  leads_found: "Leads",
  progress: "Progress",
  created_at: "Created",
  total_cost: "Cost",
};

const STATUS_STYLES: Record<CampaignResult["status"], string> = {
  running: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200",
  completed:
    "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200",
  failed: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200",
  cancelled: "bg-gray-200 text-gray-600 dark:bg-gray-800 dark:text-gray-200",
};

const formatDate = (value?: string) => {
  if (!value) {
    return "—";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "—";
  }

  return parsed.toLocaleDateString();
};

export const CampaignsTable: React.FC<CampaignsTableProps> = ({
  campaigns,
  onRowClick,
  isLoading = false,
  pageSize = 25,
}) => {
  const [sortField, setSortField] = useState<SortableField>("created_at");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [currentPage, setCurrentPage] = useState(0);

  const sortedCampaigns = useMemo(() => {
    const entries = [...campaigns];
    entries.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];

      if (sortField === "business_type" || sortField === "status") {
        const aText = ((aValue as string | undefined) || "").toLowerCase();
        const bText = ((bValue as string | undefined) || "").toLowerCase();

        if (aText === bText) return 0;
        return sortDirection === "asc"
          ? aText.localeCompare(bText)
          : bText.localeCompare(aText);
      }

      if (sortField === "created_at") {
        const aDate = new Date(a.created_at).getTime() || 0;
        const bDate = new Date(b.created_at).getTime() || 0;
        if (aDate === bDate) return 0;
        return sortDirection === "asc" ? aDate - bDate : bDate - aDate;
      }

      const aNumber = typeof aValue === "number" ? aValue : 0;
      const bNumber = typeof bValue === "number" ? bValue : 0;
      if (aNumber === bNumber) return 0;
      return sortDirection === "asc" ? aNumber - bNumber : bNumber - aNumber;
    });
    return entries;
  }, [campaigns, sortField, sortDirection]);

  const totalPages =
    sortedCampaigns.length === 0
      ? 0
      : Math.ceil(sortedCampaigns.length / pageSize);

  useEffect(() => {
    setCurrentPage(0);
  }, [sortedCampaigns.length, pageSize]);

  useEffect(() => {
    if (totalPages === 0) {
      setCurrentPage(0);
      return;
    }

    if (currentPage > totalPages - 1) {
      setCurrentPage(totalPages - 1);
    }
  }, [currentPage, totalPages]);

  const pagedCampaigns = useMemo(() => {
    if (totalPages === 0) {
      return [];
    }

    const startIndex = currentPage * pageSize;
    return sortedCampaigns.slice(startIndex, startIndex + pageSize);
  }, [sortedCampaigns, currentPage, pageSize, totalPages]);

  const toggleSort = (field: SortableField) => {
    if (field === sortField) {
      setSortDirection((direction) => (direction === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection(field === "created_at" ? "desc" : "asc");
    }
  };

  const showingStart =
    sortedCampaigns.length === 0 ? 0 : currentPage * pageSize + 1;
  const showingEnd =
    sortedCampaigns.length === 0
      ? 0
      : Math.min(sortedCampaigns.length, (currentPage + 1) * pageSize);

  return (
    <div className="overflow-hidden border border-gray-200 dark:border-gray-700 rounded-lg">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            {Object.entries(SORT_LABELS).map(([field, label]) => (
              <th
                key={field}
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400"
              >
                <button
                  type="button"
                  onClick={() => toggleSort(field as SortableField)}
                  className="flex items-center space-x-1 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
                >
                  <span>{label}</span>
                  {sortField === field ? (
                    <span aria-hidden="true">
                      {sortDirection === "asc" ? "▲" : "▼"}
                    </span>
                  ) : (
                    <span
                      className="text-gray-400 dark:text-gray-500"
                      aria-hidden="true"
                    >
                      ⇅
                    </span>
                  )}
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
          {isLoading ? (
            <tr>
              <td
                colSpan={6}
                className="px-6 py-6 text-center text-sm text-gray-500 dark:text-gray-400"
              >
                Loading campaigns...
              </td>
            </tr>
          ) : sortedCampaigns.length === 0 ? (
            <tr>
              <td
                colSpan={6}
                className="px-6 py-6 text-center text-sm text-gray-500 dark:text-gray-400"
              >
                No campaigns found. Adjust your filters or launch a new
                campaign.
              </td>
            </tr>
          ) : (
            pagedCampaigns.map((campaign) => {
              const { status } = campaign;
              const statusBadge =
                STATUS_STYLES[status] ||
                "bg-gray-200 text-gray-600 dark:bg-gray-800 dark:text-gray-200";

              return (
                <tr
                  key={campaign.campaign_id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                  onClick={() => onRowClick?.(campaign)}
                >
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {campaign.business_type || "Untitled campaign"}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {campaign.location || "Location not specified"}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${statusBadge}`}
                    >
                      {status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-200">
                    <div className="space-y-1">
                      <div>Found: {campaign.leads_found}</div>
                      <div>Qualified: {campaign.leads_qualified}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-200">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {Math.round(campaign.progress)}%
                      </span>
                      <div className="w-20 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-2 bg-blue-500 dark:bg-blue-400 rounded-full"
                          style={{
                            width: `${Math.min(
                              100,
                              Math.max(0, campaign.progress)
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                    {formatDate(campaign.created_at)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-200">
                    ${campaign.total_cost.toFixed(2)}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>

      <div className="flex items-center justify-between px-6 py-3 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-600 dark:text-gray-400">
        <span>
          Showing {showingStart}-{showingEnd} of {sortedCampaigns.length}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCurrentPage((page) => Math.max(0, page - 1))}
            disabled={currentPage === 0 || totalPages === 0}
            className="px-2 py-1 rounded border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span>
            Page {totalPages === 0 ? 0 : currentPage + 1} of {totalPages}
          </span>
          <button
            type="button"
            onClick={() =>
              setCurrentPage((page) =>
                Math.min(
                  totalPages === 0 ? 0 : totalPages - 1,
                  Math.max(0, page + 1)
                )
              )
            }
            disabled={totalPages === 0 || currentPage >= totalPages - 1}
            className="px-2 py-1 rounded border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};
