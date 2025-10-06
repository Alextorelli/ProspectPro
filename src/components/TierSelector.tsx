import React from "react";
import { ENRICHMENT_TIERS } from "../lib/supabase";

interface TierSelectorProps {
  selectedTier: keyof typeof ENRICHMENT_TIERS;
  onTierChange: (tier: keyof typeof ENRICHMENT_TIERS) => void;
  numberOfLeads: number;
}

const tierDataImprovements = {
  BASE: [
    "Business verification",
    "Company data (name, industry, size)",
    "Phone & address validation",
    "Generic company email",
  ],
  PROFESSIONAL: [
    "Everything in Base",
    "Professional email discovery & verification",
    "Email deliverability verification",
    "Enhanced company enrichment",
  ],
  ENTERPRISE: [
    "Everything in Professional",
    "Executive contact enrichment",
    "Full compliance verification",
    "Advanced data validation",
  ],
};

export const TierSelector: React.FC<TierSelectorProps> = ({
  selectedTier,
  onTierChange,
  numberOfLeads,
}) => {
  const formatUnitCost = (price: number): string => {
    if (price >= 1) return `$${price.toFixed(2)}`;
    if (price >= 0.01) return `$${price.toFixed(3)}`;
    return `$${price.toFixed(4)}`;
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
        Data Enhancement Tiers
      </label>

      {/* Single column, table-style layout */}
      <div className="space-y-2">
        {Object.entries(ENRICHMENT_TIERS).map(([key, tier]) => {
          const tierKey = key as keyof typeof ENRICHMENT_TIERS;
          const totalCost = numberOfLeads * tier.price;
          const improvements = tierDataImprovements[tierKey];

          return (
            <div
              key={key}
              className={`rounded-lg p-4 cursor-pointer transition-all border-l-4 ${
                selectedTier === key
                  ? "bg-blue-50 dark:bg-blue-950/30 border-l-blue-500 shadow-md dark:shadow-gray-900/20"
                  : "bg-gray-100 dark:bg-gray-700 border-l-gray-200 dark:border-l-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600 hover:border-l-gray-300 dark:hover:border-l-gray-500"
              }`}
              onClick={() => onTierChange(tierKey)}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {tier.name}
                  </h3>
                  {tier.badge && (
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        tier.badge === "Most Popular"
                          ? "bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200"
                          : tier.badge === "Premium"
                          ? "bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-200"
                          : "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                      }`}
                    >
                      {tier.badge}
                    </span>
                  )}
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {formatUnitCost(tier.price)} per lead
                  </div>
                  {selectedTier === key && (
                    <div className="flex items-center text-sm text-blue-600 dark:text-blue-400">
                      <svg
                        className="w-4 h-4 mr-1"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Selected
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    ${totalCost.toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Total cost</div>
                </div>
              </div>

              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                    {tier.description}
                  </div>

                  {/* Data Improvements in horizontal layout */}
                  <div className="flex flex-wrap gap-2">
                    {improvements.map((improvement, index) => (
                      <div
                        key={index}
                        className="flex items-center text-xs bg-white dark:bg-gray-800 rounded-full px-2 py-1 border border-gray-200 dark:border-gray-600"
                      >
                        <svg
                          className="w-3 h-3 text-green-500 dark:text-green-400 mr-1 flex-shrink-0"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="text-gray-700 dark:text-gray-200">{improvement}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
        <div className="flex items-center">
          <svg
            className="w-5 h-5 text-yellow-500 dark:text-yellow-400 mr-2"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          <div className="text-sm text-yellow-700 dark:text-yellow-300">
            <strong>Actual API costs</strong> - Pricing may vary based on API
            response complexity and data availability
          </div>
        </div>
      </div>
    </div>
  );
};
