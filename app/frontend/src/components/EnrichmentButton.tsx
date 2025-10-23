import React, { useState } from "react";
import { useLeadEnrichment } from "../hooks/useLeadEnrichment";
import { useCampaignStore } from "../stores/campaignStore";

interface EnrichmentButtonProps {
  campaignId: string;
  onComplete?: () => void;
}

export const EnrichmentButton: React.FC<EnrichmentButtonProps> = ({
  campaignId,
  onComplete,
}) => {
  const { leads, updateLead } = useCampaignStore();
  const {
    enrichMultipleLeads,
    isEnriching,
    progress,
    currentStage,
    enrichedCount,
    totalCost,
    reset,
  } = useLeadEnrichment();

  // Hoist useState to top-level before any early returns
  const [showProgress, setShowProgress] = useState(false);

  const campaignLeads = leads.filter((lead) => lead.campaign_id === campaignId);
  const unenrichedLeads = campaignLeads.filter(
    (lead) => !lead.enrichment_data?.hunterVerified
  );

  const handleEnrich = async () => {
    if (unenrichedLeads.length === 0) {
      alert("All leads are already enriched!");
      return;
    }

    setShowProgress(true);
    reset();

    try {
      const { results, errors } = await enrichMultipleLeads(
        unenrichedLeads.map((lead) => ({
          businessName: lead.business_name,
          website: lead.website,
          address: lead.address,
          phone: lead.phone,
        })),
        {
          includeBusinessLicense: true,
          discoverEmails: true,
          verifyEmails: true,
          maxCostPerBusiness: 0.5,
        }
      );

      // Update leads in store with enrichment data
      results.forEach((result, index) => {
        const lead = unenrichedLeads[index];
        if (lead) {
          updateLead(lead.id, {
            email: result.enrichedData?.emails?.[0]?.email || lead.email,
            enrichment_data: {
              ...(lead.enrichment_data || {}),
              emails: result.enrichedData?.emails || [],
              businessLicense: result.enrichedData?.businessLicense,
              hunterVerified: (result.enrichedData?.emails?.length || 0) > 0,
              neverBounceVerified: result.enrichedData?.emails?.some(
                (e) => e.verified
              ),
              licenseVerified:
                result.enrichedData?.businessLicense?.isValid || false,
              processingMetadata: {
                ...result.processingMetadata,
                totalCost: result.totalCost,
                enrichmentCostBreakdown: result.costBreakdown,
              },
            },
          });
        }
      });

      // Show summary
      setTimeout(() => {
        alert(
          `Enrichment Complete!\n\n` +
            `✅ Enriched: ${results.length} leads\n` +
            `❌ Failed: ${errors.length} leads\n` +
            `💰 Total Cost: $${totalCost.toFixed(3)}\n` +
            `📧 Emails Found: ${results.reduce(
              (sum, r) => sum + (r.enrichedData?.emails?.length || 0),
              0
            )}`
        );
        setShowProgress(false);
        onComplete?.();
      }, 1000);
    } catch (error) {
      console.error("Enrichment error:", error);
      alert(
        `Enrichment failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      setShowProgress(false);
    }
  };

  if (unenrichedLeads.length === 0) {
    return (
      <button
        disabled
        className="px-4 py-2 bg-gray-300 text-gray-600 rounded-lg cursor-not-allowed"
      >
        ✅ All Leads Enriched
      </button>
    );
  }

  return (
    <div className="space-y-3">
      <button
        className={`px-6 py-3 rounded-lg font-semibold transition-all ${
          isEnriching
            ? "bg-blue-400 cursor-wait"
            : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        } text-white shadow-md`}
        disabled={isEnriching}
        onClick={handleEnrich}
      >
        {isEnriching ? (
          <span className="flex items-center gap-2">
            <svg
              className="animate-spin h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                fill="currentColor"
              />
            </svg>
            Enriching...
          </span>
        ) : (
          `🚀 Enrich ${unenrichedLeads.length} Leads`
        )}
      </button>

      {showProgress && (
        <div className="bg-white border border-blue-200 rounded-lg p-4 shadow-sm">
          <div className="space-y-2">
            {/* Progress bar */}
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Progress text */}
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-700 font-medium">{currentStage}</span>
              <span className="text-gray-600">{progress}%</span>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-200">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {enrichedCount}
                </div>
                <div className="text-xs text-gray-600">Enriched</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  ${totalCost.toFixed(3)}
                </div>
                <div className="text-xs text-gray-600">Total Cost</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enrichment info */}
      <div className="text-sm text-gray-600 bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="font-semibold mb-1">✨ Progressive Enrichment</div>
        <ul className="space-y-1 text-xs">
          <li>
            📧 <strong>Email Discovery</strong> (Hunter.io) - $0.034/lead
          </li>
          <li>
            ✅ <strong>Email Verification</strong> (NeverBounce) - $0.008/lead
          </li>
          <li>
            📜 <strong>License Validation</strong> - $0.03/lead
          </li>
          <li className="pt-1 border-t border-blue-200 font-semibold">
            💰 Estimated: ${(unenrichedLeads.length * 0.072).toFixed(2)} total
          </li>
        </ul>
      </div>
    </div>
  );
};
