import React from "react";
import type { BusinessLead } from "../types";

interface LeadCardProps {
  lead: BusinessLead;
  onClick?: (lead: BusinessLead) => void;
  isSelected?: boolean;
  showActions?: boolean;
  onExport?: (lead: BusinessLead) => void;
  onViewDetails?: (lead: BusinessLead) => void;
}

/**
 * Tier badge colors matching ENRICHMENT_TIERS from lib/supabase.ts
 * Aligned with zero-fake-data philosophy per SYSTEM_REFERENCE.md
 */
const TIER_COLORS = {
  ESSENTIAL: {
    bg: "bg-gray-100 dark:bg-slate-700",
    text: "text-gray-700 dark:text-slate-300",
    border: "border-gray-300 dark:border-slate-600",
    badge: "bg-gray-500",
  },
  PROFESSIONAL: {
    bg: "bg-blue-50 dark:bg-blue-900/30",
    text: "text-blue-700 dark:text-blue-300",
    border: "border-blue-200 dark:border-blue-800",
    badge: "bg-blue-600 dark:bg-blue-500",
  },
  BUSINESS: {
    bg: "bg-purple-50 dark:bg-purple-900/30",
    text: "text-purple-700 dark:text-purple-300",
    border: "border-purple-200 dark:border-purple-800",
    badge: "bg-purple-600 dark:bg-purple-500",
  },
  ENTERPRISE: {
    bg: "bg-amber-50 dark:bg-amber-900/30",
    text: "text-amber-700 dark:text-amber-300",
    border: "border-amber-200 dark:border-amber-800",
    badge: "bg-amber-600 dark:bg-amber-500",
  },
} as const;

/**
 * Enhanced Lead Card Component
 *
 * Features:
 * - Tier-based color coding from design tokens
 * - Confidence meter with visual indicator
 * - Structured metadata display
 * - Zero-fake-data messaging (verified contacts only)
 * - Full accessibility support
 *
 * Usage in LeadExplorerTable.tsx:
 * ```tsx
 * <LeadCard
 *   lead={lead}
 *   onClick={handleLeadClick}
 *   showActions
 *   onExport={handleExport}
 *   onViewDetails={handleViewDetails}
 * />
 * ```
 */
export const LeadCard: React.FC<LeadCardProps> = ({
  lead,
  onClick,
  isSelected = false,
  showActions = false,
  onExport,
  onViewDetails,
}) => {
  const tierKey = (lead.enrichment_tier?.toUpperCase() ||
    "ESSENTIAL") as keyof typeof TIER_COLORS;
  const tierColors = TIER_COLORS[tierKey] || TIER_COLORS.ESSENTIAL;

  const confidenceScore = lead.confidence_score || 0;
  const confidencePercentage = Math.round(confidenceScore);

  // Confidence level for display
  const getConfidenceLevel = (score: number): string => {
    if (score >= 90) return "Excellent";
    if (score >= 75) return "Very Good";
    if (score >= 60) return "Good";
    if (score >= 40) return "Fair";
    return "Low";
  };

  const getConfidenceColor = (score: number): string => {
    if (score >= 75) return "text-green-600 dark:text-green-400";
    if (score >= 50) return "text-blue-600 dark:text-blue-400";
    return "text-orange-600 dark:text-orange-400";
  };

  // Data sources with verification badge
  const dataSources = lead.data_sources || [];
  const hasVerifiedData = dataSources.length > 0;

  // Extract enrichment data
  const enrichmentData = lead.enrichment_data as any;
  const emails = enrichmentData?.emails || [];
  const verifiedEmail = emails.find((e: any) => e.verified);

  const handleCardClick = () => {
    if (onClick) {
      onClick(lead);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleCardClick();
    }
  };

  return (
    <article
      aria-label={`Lead: ${lead.business_name}`}
      className={`relative bg-white dark:bg-slate-800 rounded-lg border-2 transition-all ${
        isSelected
          ? `${tierColors.border} ring-2 ${tierColors.badge.replace(
              "bg-",
              "ring-"
            )}`
          : "border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600"
      } ${
        onClick ? "cursor-pointer" : ""
      } focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2`}
      role="button"
      tabIndex={onClick ? 0 : undefined}
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
    >
      {/* Tier Badge */}
      <div className="absolute -top-3 -right-3">
        <span
          aria-label={`${tierKey} tier lead`}
          className={`inline-flex items-center gap-1.5 px-3 py-1 ${tierColors.badge} text-white text-xs font-bold rounded-full shadow-md`}
        >
          {tierKey === "ENTERPRISE" && (
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          )}
          {tierKey}
        </span>
      </div>

      <div className="p-4 space-y-3">
        {/* Business Name & Verified Badge */}
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 flex-1">
            {lead.business_name}
          </h3>
          {hasVerifiedData && (
            <span
              aria-label="Verified contact data"
              className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-medium rounded"
              title={`Verified via: ${dataSources.join(", ")}`}
            >
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path
                  clipRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  fillRule="evenodd"
                />
              </svg>
              Verified
            </span>
          )}
        </div>

        {/* Contact Information */}
        <div className="space-y-1.5 text-sm">
          {lead.address && (
            <div className="flex items-start gap-2 text-gray-600 dark:text-slate-400">
              <svg
                className="w-4 h-4 mt-0.5 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                />
                <path
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                />
              </svg>
              <span className="flex-1">{lead.address}</span>
            </div>
          )}

          {lead.phone && (
            <div className="flex items-center gap-2 text-gray-600 dark:text-slate-400">
              <svg
                className="w-4 h-4 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                />
              </svg>
              <span>{lead.phone}</span>
            </div>
          )}

          {verifiedEmail && (
            <div className="flex items-center gap-2 text-gray-600 dark:text-slate-400">
              <svg
                className="w-4 h-4 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                />
              </svg>
              <span className="flex-1 truncate">{verifiedEmail.email}</span>
              <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                <svg
                  className="w-3 h-3"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    clipRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    fillRule="evenodd"
                  />
                </svg>
                Verified
              </span>
            </div>
          )}

          {lead.website && (
            <div className="flex items-center gap-2 text-gray-600 dark:text-slate-400">
              <svg
                className="w-4 h-4 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                />
              </svg>
              <a
                className="flex-1 truncate hover:text-blue-600 dark:hover:text-blue-400 hover:underline"
                href={lead.website}
                rel="noopener noreferrer"
                target="_blank"
                onClick={(e) => e.stopPropagation()}
              >
                {lead.website}
              </a>
            </div>
          )}
        </div>

        {/* Confidence Meter */}
        <div className="pt-2 border-t border-gray-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-gray-600 dark:text-slate-400">
              Confidence Score
            </span>
            <span
              className={`text-xs font-semibold ${getConfidenceColor(
                confidencePercentage
              )}`}
            >
              {confidencePercentage}% •{" "}
              {getConfidenceLevel(confidencePercentage)}
            </span>
          </div>
          <div className="w-full h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              aria-label={`Confidence score: ${confidencePercentage}%`}
              aria-valuemax={100}
              aria-valuemin={0}
              aria-valuenow={confidencePercentage}
              className={`h-full transition-all ${
                confidencePercentage >= 75
                  ? "bg-green-500 dark:bg-green-400"
                  : confidencePercentage >= 50
                  ? "bg-blue-500 dark:bg-blue-400"
                  : "bg-orange-500 dark:bg-orange-400"
              }`}
              role="progressbar"
              style={{ width: `${Math.max(confidencePercentage, 5)}%` }}
            />
          </div>
        </div>

        {/* Data Sources */}
        {dataSources.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {dataSources.map((source, index) => (
              <span
                key={`${source}-${index}`}
                className="inline-flex items-center px-2 py-0.5 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-400 text-xs rounded"
                title={`Data verified via ${source}`}
              >
                {source}
              </span>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        {showActions && (
          <div className="flex gap-2 pt-2">
            {onViewDetails && (
              <button
                className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white text-sm font-medium rounded transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onViewDetails(lead);
                }}
              >
                View Details
              </button>
            )}
            {onExport && (
              <button
                aria-label="Export lead"
                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-gray-700 dark:text-slate-300 text-sm font-medium rounded transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2"
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onExport(lead);
                }}
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                  />
                </svg>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Zero-fake-data indicator */}
      <div className="px-4 py-2 bg-gray-50 dark:bg-slate-900/50 border-t border-gray-200 dark:border-slate-700 rounded-b-lg">
        <p className="text-xs text-gray-500 dark:text-slate-500 flex items-center gap-1.5">
          <svg
            className="w-3 h-3 text-green-600"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              clipRule="evenodd"
              d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              fillRule="evenodd"
            />
          </svg>
          <span>
            Verified professional contact • Zero fake data • Cost: $
            {(lead.cost_to_acquire || 0).toFixed(2)}
          </span>
        </p>
      </div>
    </article>
  );
};

export default LeadCard;
