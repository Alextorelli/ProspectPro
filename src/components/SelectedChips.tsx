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
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleRemove(chipId);
    }
  };

  if (chips.length === 0) {
    return null;
  }

  return (
    <div
      aria-label={ariaLabel}
      className={`flex flex-wrap items-center gap-2 ${className}`}
      role="group"
    >
      {/* ...existing chip rendering code... */}
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
