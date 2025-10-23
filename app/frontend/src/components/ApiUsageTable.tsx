import React, { useEffect } from "react";
import type { ApiUsageStats } from "../stores/enhancedCampaignStore";
import { useCampaignStore } from "../stores/enhancedCampaignStore";

interface ApiUsageTableProps {
  className?: string;
}

export const ApiUsageTable: React.FC<ApiUsageTableProps> = ({
  className = "",
}) => {
  const { getApiUsageStats, clearOldMetrics, apiUsageMetrics } =
    useCampaignStore();
  const stats: ApiUsageStats = getApiUsageStats();

  // Clean old metrics on component mount
  useEffect(() => {
    clearOldMetrics(30); // Keep last 30 days
  }, [clearOldMetrics]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 4,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "percent",
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat("en-US").format(value);
  };

  const serviceRows = Object.entries(stats.costByService).map(
    ([service, cost]) => ({
      service,
      cost,
      requests: stats.requestsByService[service] || 0,
      avgCostPerRequest: cost / (stats.requestsByService[service] || 1),
    })
  );

  const monthlyRows = Object.entries(stats.monthlySpend)
    .sort(([a], [b]) => b.localeCompare(a)) // Most recent first
    .slice(0, 6); // Last 6 months

  const dailyRows = Object.entries(stats.dailySpend)
    .sort(([a], [b]) => b.localeCompare(a)) // Most recent first
    .slice(0, 7); // Last 7 days

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          {/* ...existing code... */}
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          {/* ...existing code... */}
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          {/* ...existing code... */}
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          {/* ...existing code... */}
        </div>
      </div>

      {/* Cost by Service */}
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
        {/* ...existing code... */}
      </div>

      {/* Monthly Spend Trend */}
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
        {/* ...existing code... */}
      </div>

      {/* Recent Daily Spend */}
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
        {/* ...existing code... */}
      </div>

      {/* Data Quality Note */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-sky-800 dark:bg-sky-900/20">
        {/* ...existing code... */}
      </div>
    </div>
  );
};
