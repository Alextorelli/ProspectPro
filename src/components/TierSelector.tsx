import React from "react";
import { ENRICHMENT_TIERS } from "../lib/supabase";

interface TierSelectorProps {
  selectedTier: keyof typeof ENRICHMENT_TIERS;
  onTierChange: (tier: keyof typeof ENRICHMENT_TIERS) => void;
  numberOfLeads: number;
}

const tierDataImprovements = {
  STARTER: [
    "Business verification",
    "Company data",
    "Phone & website validation"
  ],
  PROFESSIONAL: [
    "Business verification",
    "Company data", 
    "Phone & website validation",
    "Professional email discovery"
  ],
  ENTERPRISE: [
    "Business verification",
    "Company data",
    "Phone & website validation", 
    "Professional email discovery",
    "Email deliverability verification"
  ],
  COMPLIANCE: [
    "Business verification",
    "Company data",
    "Phone & website validation",
    "Professional email discovery", 
    "Email deliverability verification",
    "Executive contact enrichment"
  ]
};

export const TierSelector: React.FC<TierSelectorProps> = ({
  selectedTier,
  onTierChange,
  numberOfLeads,
}) => {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-3">
        Progressive Enrichment Tiers
      </label>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {Object.entries(ENRICHMENT_TIERS).map(([key, tier]) => {
          const tierKey = key as keyof typeof ENRICHMENT_TIERS;
          const totalCost = numberOfLeads * tier.price;
          const improvements = tierDataImprovements[tierKey];

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
              <div className="text-xs text-gray-500 mb-3">
                {tier.description}
              </div>
              
              {/* Data Improvements */}
              <div className="space-y-1 mb-3">
                {improvements.map((improvement, index) => (
                  <div key={index} className="flex items-center text-xs">
                    <svg className="w-3 h-3 text-green-500 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-600">{improvement}</span>
                  </div>
                ))}
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
    </div>
  );
};
