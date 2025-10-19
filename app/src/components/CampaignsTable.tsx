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
        const aDate = aValue ? new Date(aValue as string) : new Date(0);
        const bDate = bValue ? new Date(bValue as string) : new Date(0);
        return sortDirection === "asc"
          ? aDate.getTime() - bDate.getTime()
          : bDate.getTime() - aDate.getTime();
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
      setSortField(field as SortableField);
      setSortDirection("desc");
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
      {/* ...existing code... */}
    </div>
  );
};
