import React, { useMemo, useState } from "react";
import type { BusinessLead } from "../types";

interface LeadExplorerTableProps {
  leads: BusinessLead[];
  onSelect?: (leadIds: string[]) => void;
  onRowClick?: (lead: BusinessLead) => void;
  isLoading?: boolean;
}

type SortDirection = "asc" | "desc";

type SortableField =
  | "business_name"
  | "confidence_score"
  | "validation_status"
  | "created_at";

const SORT_LABELS: Record<SortableField, string> = {
  business_name: "Business",
  confidence_score: "Score",
  validation_status: "Status",
  created_at: "Created",
};

const getConfidenceClass = (score: number) => {
  if (score >= 80) return "bg-green-500";
  if (score >= 60) return "bg-yellow-500";
  return "bg-red-500";
};

const formatDate = (value: string) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "—";
  }
  return parsed.toLocaleDateString();
};

export const LeadExplorerTable: React.FC<LeadExplorerTableProps> = ({
  leads,
  onSelect,
  onRowClick,
  isLoading = false,
}) => {
  const [sortField, setSortField] = useState<SortableField>("confidence_score");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const isSelectable = Boolean(onSelect);

  const sortedLeads = useMemo(() => {
    const entries = [...leads];
    entries.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];

      if (sortField === "business_name" || sortField === "validation_status") {
        const aText = (aValue as string | undefined)?.toLowerCase() || "";
        const bText = (bValue as string | undefined)?.toLowerCase() || "";
        if (aText === bText) return 0;
        return sortDirection === "asc"
          ? aText.localeCompare(bText)
          : bText.localeCompare(aText);
      }

      if (sortField === "created_at") {
        const aDate = new Date((aValue as string) || 0).getTime();
        const bDate = new Date((bValue as string) || 0).getTime();
        if (aDate === bDate) return 0;
        return sortDirection === "asc" ? aDate - bDate : bDate - aDate;
      }

      const aNumber = typeof aValue === "number" ? aValue : 0;
      const bNumber = typeof bValue === "number" ? bValue : 0;
      if (aNumber === bNumber) return 0;
      return sortDirection === "asc" ? aNumber - bNumber : bNumber - aNumber;
    });
    return entries;
  }, [leads, sortField, sortDirection]);

  const toggleSort = (field: SortableField) => {
    if (field === sortField) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (!isSelectable) return;

    if (checked) {
      const ids = leads.map((lead) => lead.id).filter(Boolean);
      const newSelection = new Set(ids);
      setSelectedIds(newSelection);
      onSelect?.(Array.from(newSelection));
    } else {
      setSelectedIds(new Set());
      onSelect?.([]);
    }
  };

  const handleRowSelect = (leadId: string, checked: boolean) => {
    if (!isSelectable) return;

    const updated = new Set(selectedIds);
    if (checked) {
      updated.add(leadId);
    } else {
      updated.delete(leadId);
    }
    setSelectedIds(updated);
    onSelect?.(Array.from(updated));
  };

  return (
    <div className="overflow-hidden border border-gray-200 dark:border-gray-700 rounded-lg">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            {isSelectable && (
              <th scope="col" className="px-4 py-3 text-left">
                <input
                  type="checkbox"
                  aria-label="Select all leads"
                  className="rounded border-gray-300 dark:border-gray-600"
                  checked={
                    selectedIds.size > 0 && selectedIds.size === leads.length
                  }
                  onChange={(event) => handleSelectAll(event.target.checked)}
                />
              </th>
            )}
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
                colSpan={isSelectable ? 7 : 6}
                className="px-6 py-6 text-center text-sm text-gray-500 dark:text-gray-400"
              >
                Loading leads...
              </td>
            </tr>
          ) : sortedLeads.length === 0 ? (
            <tr>
              <td
                colSpan={isSelectable ? 7 : 6}
                className="px-6 py-6 text-center text-sm text-gray-500 dark:text-gray-400"
              >
                No leads found. Adjust your filters or start a new campaign.
              </td>
            </tr>
          ) : (
            sortedLeads.map((lead) => {
              const selected = selectedIds.has(lead.id);
              return (
                <tr
                  key={lead.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                  onClick={() => onRowClick?.(lead)}
                >
                  {isSelectable && (
                    <td
                      className="px-4 py-4"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        aria-label={`Select ${lead.business_name}`}
                        className="rounded border-gray-300 dark:border-gray-600"
                        checked={selected}
                        onChange={(event) =>
                          handleRowSelect(lead.id, event.target.checked)
                        }
                      />
                    </td>
                  )}
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {lead.business_name || "Unnamed business"}
                    </div>
                    {lead.address ? (
                      <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {lead.address}
                      </div>
                    ) : null}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-20 h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                        <div
                          className={`h-2 rounded-full ${getConfidenceClass(
                            lead.confidence_score || 0
                          )}`}
                          style={{
                            width: `${Math.min(
                              lead.confidence_score || 0,
                              100
                            )}%`,
                          }}
                        />
                      </div>
                      <span className="text-sm text-gray-700 dark:text-gray-200">
                        {lead.confidence_score ?? 0}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                        lead.validation_status === "validated"
                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200"
                          : lead.validation_status === "validating"
                          ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200"
                          : lead.validation_status === "failed"
                          ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200"
                          : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
                      }`}
                    >
                      {lead.validation_status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                    {formatDate(lead.created_at)}
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
                            href={`mailto:${lead.email}`}
                            className="text-blue-600 hover:underline dark:text-blue-400"
                          >
                            {lead.email}
                          </a>
                        </div>
                      )}
                      {lead.phone && <div>📞 {lead.phone}</div>}
                      {lead.website && (
                        <div onClick={(event) => event.stopPropagation()}>
                          <a
                            href={lead.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline dark:text-blue-400"
                          >
                            Website
                          </a>
                        </div>
                      )}
                      {!lead.email && !lead.phone && !lead.website && (
                        <div className="text-xs text-gray-400">
                          No contact info
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                    {lead.campaign_id ? (
                      <a
                        href={`/campaign?id=${lead.campaign_id}`}
                        onClick={(event) => event.stopPropagation()}
                        className="text-blue-600 hover:underline dark:text-blue-400"
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
    </div>
  );
};
