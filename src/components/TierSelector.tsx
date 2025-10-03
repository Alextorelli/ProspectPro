import React from "react";
import { ENRICHMENT_TIERS } from "../lib/supabase";

interface TierSelectorProps {
  selectedTier: keyof typeof ENRICHMENT_TIERS;
  onTierChange: (tier: keyof typeof ENRICHMENT_TIERS) => void;
  numberOfLeads: number;
}

export const TierSelector: React.FC<TierSelectorProps> = ({
  selectedTier,
  onTierChange,
  numberOfLeads,
}) => {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-3">
        Progressive Enrichment Tier (90% cost reduction vs competitors)
      </label>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(ENRICHMENT_TIERS).map(([key, tier]) => {
          const tierKey = key as keyof typeof ENRICHMENT_TIERS;
          const totalCost = numberOfLeads * tier.price;

          return (
            <div
              key={key}
              className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                selectedTier === key
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
              onClick={() => onTierChange(tierKey)}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-gray-900">{tier.name}</h3>
                <div className="text-lg font-bold text-blue-600">
                  ${tier.price}
                </div>
              </div>
              <div className="text-xs text-gray-500 mb-2">
                {tier.description}
              </div>
              <div className="text-xs text-gray-400 mb-2">
                Stages: {tier.stages.join(" → ")}
              </div>
              <div className="text-sm font-medium text-gray-700">
                Total: ${totalCost.toFixed(2)}
              </div>
              {selectedTier === key && (
                <div className="mt-2 flex items-center text-xs text-blue-600">
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
          );
        })}
      </div>
      <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
        <div className="flex items-center">
          <svg
            className="w-5 h-5 text-green-500 mr-2"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
              clipRule="evenodd"
            />
          </svg>
          <div className="text-sm text-green-700">
            <strong>Vault-secured API access</strong> with 90-day intelligent
            caching for massive cost savings
          </div>
        </div>
      </div>
    </div>
  );
};
