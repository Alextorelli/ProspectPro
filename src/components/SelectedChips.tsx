import React, { useRef, useState } from "react";

interface ChipData {
  id: string;
  label: string;
  value: string;
  category?: string;
}

interface SelectedChipsProps {
  /** Array of selected chips to display */
  chips: ChipData[];
  /** Callback when a chip is removed */
  onRemove: (chipId: string) => void;
  /** Optional callback when all chips are cleared */
  onClearAll?: () => void;
  /** Maximum number of chips to show before overflow */
  maxVisible?: number;
  /** Enable tooltip for truncated labels */
  showTooltips?: boolean;
  /** Custom class name */
  className?: string;
  /** Aria label for the chip container */
  ariaLabel?: string;
}

/**
 * Selected Chips Component
 *
 * Features:
 * - Removable filter chips with keyboard support
 * - Overflow handling for many selections
 * - Tooltips for long labels
 * - Design tokens from tailwind.config.js
 * - Used for active filters in BusinessDiscovery
 *
 * Usage in BusinessDiscovery.tsx:
 * ```tsx
 * <SelectedChips
 *   chips={[
 *     { id: "1", label: "Category", value: "Restaurants" },
 *     { id: "2", label: "Location", value: "Seattle, WA" },
 *     { id: "3", label: "Radius", value: "10 miles" }
 *   ]}
 *   onRemove={handleRemoveFilter}
 *   onClearAll={handleClearAll}
 *   maxVisible={5}
 *   showTooltips
 * />
 * ```
 */
export const SelectedChips: React.FC<SelectedChipsProps> = ({
  chips,
  onRemove,
  onClearAll,
  maxVisible = 10,
  showTooltips = true,
  className = "",
  ariaLabel = "Selected filters",
}) => {
  const [showAll, setShowAll] = useState(false);
  const [hoveredChip, setHoveredChip] = useState<string | null>(null);
  const tooltipRefs = useRef<Map<string, HTMLSpanElement>>(new Map());

  const visibleChips = showAll ? chips : chips.slice(0, maxVisible);
  const hasMore = chips.length > maxVisible;
  const overflowCount = chips.length - maxVisible;

  // Check if a label is truncated and needs a tooltip
  const needsTooltip = (chipId: string): boolean => {
    if (!showTooltips) return false;
    const element = tooltipRefs.current.get(chipId);
    if (!element) return false;
    return element.scrollWidth > element.clientWidth;
  };

  const handleRemove = (chipId: string) => {
    onRemove(chipId);
  };

  const handleKeyDown = (e: React.KeyboardEvent, chipId: string) => {
    if (e.key === "Delete" || e.key === "Backspace") {
      e.preventDefault();
      handleRemove(chipId);
    }
  };

  if (chips.length === 0) {
    return null;
  }

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={`flex flex-wrap items-center gap-2 ${className}`}
    >
      {visibleChips.map((chip) => {
        const isHovered = hoveredChip === chip.id;
        const showTooltip = showTooltips && isHovered && needsTooltip(chip.id);

        return (
          <div key={chip.id} className="relative inline-flex">
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium border border-blue-200 dark:border-blue-800 transition-colors hover:bg-blue-100 dark:hover:bg-blue-900/50"
              onMouseEnter={() => setHoveredChip(chip.id)}
              onMouseLeave={() => setHoveredChip(null)}
            >
              {chip.category && (
                <span className="text-blue-600 dark:text-blue-400 font-semibold">
                  {chip.category}:
                </span>
              )}
              <span
                ref={(el) => {
                  if (el) tooltipRefs.current.set(chip.id, el);
                }}
                className="max-w-[200px] truncate"
                aria-label={chip.value}
              >
                {chip.value}
              </span>
              <button
                type="button"
                onClick={() => handleRemove(chip.id)}
                onKeyDown={(e) => handleKeyDown(e, chip.id)}
                aria-label={`Remove ${chip.category || chip.label}: ${
                  chip.value
                }`}
                className="flex-shrink-0 ml-0.5 p-0.5 rounded-full hover:bg-blue-200 dark:hover:bg-blue-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 transition-colors"
              >
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Tooltip for truncated labels */}
            {showTooltip && (
              <div
                role="tooltip"
                className="absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-medium rounded shadow-lg whitespace-nowrap pointer-events-none"
              >
                {chip.value}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-px">
                  <div className="border-4 border-transparent border-t-gray-900 dark:border-t-slate-100" />
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Show more/less button */}
      {hasMore && !showAll && (
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 rounded-full text-sm font-medium hover:bg-gray-200 dark:hover:bg-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 transition-colors"
          aria-label={`Show ${overflowCount} more filters`}
        >
          <span>+{overflowCount} more</span>
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
      )}

      {showAll && hasMore && (
        <button
          type="button"
          onClick={() => setShowAll(false)}
          className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 rounded-full text-sm font-medium hover:bg-gray-200 dark:hover:bg-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 transition-colors"
          aria-label="Show less filters"
        >
          <span>Show less</span>
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 15l7-7 7 7"
            />
          </svg>
        </button>
      )}

      {/* Clear all button */}
      {onClearAll && chips.length > 1 && (
        <button
          type="button"
          onClick={onClearAll}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-red-600 dark:text-red-400 rounded-full text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-1 transition-colors"
          aria-label="Clear all filters"
        >
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
          <span>Clear all</span>
        </button>
      )}
    </div>
  );
};

/**
 * Helper function to create chip data from filters
 *
 * Usage:
 * ```tsx
 * const chips = createChipsFromFilters({
 *   categories: ["Restaurants", "Cafes"],
 *   location: "Seattle, WA",
 *   radius: 10,
 *   minConfidence: 80
 * });
 * ```
 */
export const createChipsFromFilters = (filters: {
  categories?: string[];
  location?: string;
  radius?: number;
  minConfidence?: number;
  [key: string]: any;
}): ChipData[] => {
  const chips: ChipData[] = [];

  if (filters.categories && filters.categories.length > 0) {
    filters.categories.forEach((category, index) => {
      chips.push({
        id: `category-${index}`,
        label: "Category",
        value: category,
        category: "Category",
      });
    });
  }

  if (filters.location) {
    chips.push({
      id: "location",
      label: "Location",
      value: filters.location,
      category: "Location",
    });
  }

  if (filters.radius) {
    chips.push({
      id: "radius",
      label: "Radius",
      value: `${filters.radius} miles`,
      category: "Radius",
    });
  }

  if (filters.minConfidence) {
    chips.push({
      id: "confidence",
      label: "Min Confidence",
      value: `${filters.minConfidence}%`,
      category: "Confidence",
    });
  }

  return chips;
};

export default SelectedChips;
