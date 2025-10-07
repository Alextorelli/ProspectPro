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
          <div className="text-2xl font-bold text-blue-600 dark:text-sky-400">
            {formatCurrency(stats.totalCost)}
          </div>
          <div className="text-sm text-gray-600 dark:text-slate-400">
            Total Spend
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="text-2xl font-bold text-green-600 dark:text-emerald-400">
            {formatNumber(stats.totalRequests)}
          </div>
          <div className="text-sm text-gray-600 dark:text-slate-400">
            API Requests
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="text-2xl font-bold text-purple-600 dark:text-violet-400">
            {stats.averageResponseTime.toFixed(0)}ms
          </div>
          <div className="text-sm text-gray-600 dark:text-slate-400">
            Avg Response Time
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="text-2xl font-bold text-orange-600 dark:text-amber-400">
            {formatPercentage(stats.successRate)}
          </div>
          <div className="text-sm text-gray-600 dark:text-slate-400">
            Success Rate
          </div>
        </div>
      </div>

      {/* Cost by Service */}
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="border-b border-gray-200 px-6 py-4 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
            Cost by Service
          </h3>
          <p className="text-sm text-gray-600 dark:text-slate-400">
            API usage and costs broken down by service provider
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
            <thead className="bg-gray-50 dark:bg-slate-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-slate-400">
                  Service
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-slate-400">
                  Total Cost
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-slate-400">
                  Requests
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-slate-400">
                  Avg Cost/Request
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white dark:divide-slate-700 dark:bg-slate-900">
              {serviceRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-4 text-center text-sm text-gray-500 dark:text-slate-400"
                  >
                    No API usage data available
                  </td>
                </tr>
              ) : (
                serviceRows.map(
                  ({ service, cost, requests, avgCostPerRequest }) => (
                    <tr
                      key={service}
                      className="hover:bg-gray-50 dark:hover:bg-slate-800"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-slate-100">
                        {service
                          .replace(/_/g, " ")
                          .replace(/\b\w/g, (l) => l.toUpperCase())}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-slate-100">
                        {formatCurrency(cost)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-slate-100">
                        {formatNumber(requests)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-slate-100">
                        {formatCurrency(avgCostPerRequest)}
                      </td>
                    </tr>
                  )
                )
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Monthly Spend Trend */}
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="border-b border-gray-200 px-6 py-4 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
            Monthly Spend Trend
          </h3>
          <p className="text-sm text-gray-600 dark:text-slate-400">
            API costs over the last 6 months
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
            <thead className="bg-gray-50 dark:bg-slate-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-slate-400">
                  Month
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-slate-400">
                  Total Spend
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white dark:divide-slate-700 dark:bg-slate-900">
              {monthlyRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={2}
                    className="px-6 py-4 text-center text-sm text-gray-500 dark:text-slate-400"
                  >
                    No monthly data available
                  </td>
                </tr>
              ) : (
                monthlyRows.map(([month, cost]) => (
                  <tr
                    key={month}
                    className="hover:bg-gray-50 dark:hover:bg-slate-800"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-slate-100">
                      {new Date(month + "-01").toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-slate-100">
                      {formatCurrency(cost)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Daily Spend */}
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="border-b border-gray-200 px-6 py-4 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
            Daily Spend (Last 7 Days)
          </h3>
          <p className="text-sm text-gray-600 dark:text-slate-400">
            Recent daily API costs for monitoring usage patterns
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
            <thead className="bg-gray-50 dark:bg-slate-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-slate-400">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-slate-400">
                  Daily Spend
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white dark:divide-slate-700 dark:bg-slate-900">
              {dailyRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={2}
                    className="px-6 py-4 text-center text-sm text-gray-500 dark:text-slate-400"
                  >
                    No daily data available
                  </td>
                </tr>
              ) : (
                dailyRows.map(([date, cost]) => (
                  <tr
                    key={date}
                    className="hover:bg-gray-50 dark:hover:bg-slate-800"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-slate-100">
                      {new Date(date).toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-slate-100">
                      {formatCurrency(cost)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Data Quality Note */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-sky-800 dark:bg-sky-900/20">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-blue-400"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-blue-800 dark:text-sky-200">
              <strong>Data Source:</strong> API usage metrics are collected from
              real campaign runs and stored locally. Historical data shows the
              last {apiUsageMetrics.length} recorded API calls across all
              services.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
