import React, { useMemo } from "react";
import type { ApiUsageStats } from "../stores/enhancedCampaignStore";

interface ApiUsageChartProps {
  stats: ApiUsageStats;
  className?: string;
  /** Show skeleton when loading */
  isLoading?: boolean;
  /** Show empty state when no data */
  hasUsageData?: boolean;
}

/**
 * API Usage Chart Component with Visualizations
 *
 * Features:
 * - Bar charts for cost breakdown by service
 * - Trend lines for daily/monthly spend
 * - Skeleton loading states
 * - Empty states with helpful messaging
 * - Design tokens from tailwind.config.js
 * - Wired to API usage data per CODEBASE_INDEX.md
 *
 * Usage in AccountPage.tsx:
 * ```tsx
 * const stats = getApiUsageStats();
 * <ApiUsageChart
 *   stats={stats}
 *   isLoading={isLoadingStats}
 *   hasUsageData={stats.totalRequests > 0}
 * />
 * ```
 */
export const ApiUsageChart: React.FC<ApiUsageChartProps> = ({
  stats,
  className = "",
  isLoading = false,
  hasUsageData = true,
}) => {
  // Calculate normalized data for chart rendering
  const chartData = useMemo(() => {
    const services = Object.entries(stats.costByService).map(
      ([service, cost]) => ({
        service: service
          .replace(/_/g, " ")
          .replace(/\b\w/g, (l) => l.toUpperCase()),
        cost,
        percentage: (cost / stats.totalCost) * 100,
      })
    );

    const dailyData = Object.entries(stats.dailySpend)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-7)
      .map(([date, spend]) => ({
        date: new Date(date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        spend,
      }));

    const maxDailySpend = Math.max(...dailyData.map((d) => d.spend), 1);

    return {
      services: services.sort((a, b) => b.cost - a.cost),
      dailyData,
      maxDailySpend,
    };
  }, [stats]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <div
        className={`space-y-6 ${className}`}
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <div className="rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 dark:bg-slate-700 rounded w-1/3" />
            <div className="space-y-3">
              <div className="h-12 bg-gray-200 dark:bg-slate-700 rounded" />
              <div className="h-12 bg-gray-200 dark:bg-slate-700 rounded" />
              <div className="h-12 bg-gray-200 dark:bg-slate-700 rounded" />
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 dark:bg-slate-700 rounded w-1/2" />
            <div className="h-48 bg-gray-200 dark:bg-slate-700 rounded" />
          </div>
        </div>
        <span className="sr-only">Loading API usage data...</span>
      </div>
    );
  }

  // Empty state
  if (!hasUsageData || stats.totalRequests === 0) {
    return (
      <div className={`${className}`}>
        <div className="rounded-lg border-2 border-dashed border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50 p-12">
          <div className="flex flex-col items-center text-center">
            <svg
              className="w-16 h-16 text-gray-400 dark:text-slate-600 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-2">
              No API Usage Data Yet
            </h3>
            <p className="text-gray-600 dark:text-slate-400 max-w-md mb-4">
              Run your first discovery campaign to start tracking API usage
              metrics. We'll show you cost breakdowns, trends, and optimization
              opportunities.
            </p>
            <a
              href="/discovery"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-medium rounded-lg transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Start Discovery Campaign
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Cost by Service Chart */}
      <div className="rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm">
        <div className="border-b border-gray-200 dark:border-slate-700 px-6 py-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
            Cost by Service
          </h3>
          <p className="text-sm text-gray-600 dark:text-slate-400 mt-0.5">
            API spend distribution across providers
          </p>
        </div>
        <div className="p-6">
          {chartData.services.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-slate-400">
              No service data available
            </div>
          ) : (
            <div className="space-y-4">
              {chartData.services.map((service, index) => (
                <div key={service.service} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-900 dark:text-slate-100">
                      {service.service}
                    </span>
                    <span className="text-gray-600 dark:text-slate-400">
                      {formatCurrency(service.cost)} (
                      {service.percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="relative h-8 bg-gray-100 dark:bg-slate-700 rounded-lg overflow-hidden">
                    <div
                      className={`absolute inset-y-0 left-0 rounded-lg transition-all ${
                        index === 0
                          ? "bg-blue-500 dark:bg-blue-400"
                          : index === 1
                          ? "bg-purple-500 dark:bg-purple-400"
                          : index === 2
                          ? "bg-green-500 dark:bg-green-400"
                          : "bg-orange-500 dark:bg-orange-400"
                      }`}
                      style={{ width: `${Math.max(service.percentage, 2)}%` }}
                      role="progressbar"
                      aria-valuenow={service.percentage}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`${
                        service.service
                      }: ${service.percentage.toFixed(1)}%`}
                    >
                      {service.percentage > 10 && (
                        <span className="absolute inset-0 flex items-center px-3 text-xs font-semibold text-white">
                          {service.percentage.toFixed(0)}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Daily Spend Trend */}
      <div className="rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm">
        <div className="border-b border-gray-200 dark:border-slate-700 px-6 py-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
            Daily Spend Trend
          </h3>
          <p className="text-sm text-gray-600 dark:text-slate-400 mt-0.5">
            Last 7 days of API usage costs
          </p>
        </div>
        <div className="p-6">
          {chartData.dailyData.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-slate-400">
              No daily data available
            </div>
          ) : (
            <div className="flex items-end justify-between gap-2 h-48">
              {chartData.dailyData.map((day, index) => {
                const heightPercentage =
                  (day.spend / chartData.maxDailySpend) * 100;
                const isHighest = day.spend === chartData.maxDailySpend;

                return (
                  <div
                    key={`${day.date}-${index}`}
                    className="flex-1 flex flex-col items-center gap-2"
                  >
                    <div className="relative w-full flex flex-col justify-end h-40">
                      <div
                        className={`w-full rounded-t-lg transition-all ${
                          isHighest
                            ? "bg-blue-600 dark:bg-blue-500"
                            : "bg-blue-400 dark:bg-blue-600"
                        } hover:opacity-80 cursor-pointer`}
                        style={{
                          height: `${Math.max(heightPercentage, 5)}%`,
                        }}
                        role="img"
                        aria-label={`${day.date}: ${formatCurrency(day.spend)}`}
                        title={formatCurrency(day.spend)}
                      />
                      {isHighest && (
                        <span className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-semibold text-gray-900 dark:text-slate-100 whitespace-nowrap">
                          {formatCurrency(day.spend)}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-600 dark:text-slate-400 text-center">
                      {day.date}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {formatCurrency(stats.totalCost)}
          </div>
          <div className="text-xs text-gray-600 dark:text-slate-400 mt-1">
            Total Spend
          </div>
        </div>
        <div className="rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {stats.totalRequests.toLocaleString()}
          </div>
          <div className="text-xs text-gray-600 dark:text-slate-400 mt-1">
            API Requests
          </div>
        </div>
        <div className="rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {stats.averageResponseTime.toFixed(0)}ms
          </div>
          <div className="text-xs text-gray-600 dark:text-slate-400 mt-1">
            Avg Response
          </div>
        </div>
        <div className="rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
          <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
            {(stats.successRate * 100).toFixed(1)}%
          </div>
          <div className="text-xs text-gray-600 dark:text-slate-400 mt-1">
            Success Rate
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiUsageChart;
