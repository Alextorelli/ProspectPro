import React, { useEffect, useId, useState } from "react";

interface CollapsibleCardProps {
  /** Card title displayed in the header */
  title: string;
  /** Optional subtitle or description */
  subtitle?: string;
  /** Content to be displayed when expanded */
  children: React.ReactNode;
  /** Initial collapsed state */
  defaultOpen?: boolean;
  /** Controlled open state */
  isOpen?: boolean;
  /** Callback when collapse state changes */
  onToggle?: (isOpen: boolean) => void;
  /** Optional icon to display in the header */
  icon?: React.ReactNode;
  /** Persist state to localStorage with this key */
  persistKey?: string;
  /** Custom class name */
  className?: string;
  /** Disable collapse functionality */
  disabled?: boolean;
  /** Loading state for lazy-loaded content */
  isLoading?: boolean;
}

/**
 * Accessible Collapsible Card / Filter Accordion
 *
 * Features:
 * - WCAG 2.1 AA compliant with full ARIA support
 * - State persistence to localStorage
 * - Lazy-loading support for heavy content
 * - Design tokens from tailwind.config.js
 * - Used for filters in BusinessDiscovery and Dashboard
 *
 * Usage in BusinessCategorySelector.tsx:
 * ```tsx
 * <CollapsibleCard
 *   title="Business Categories"
 *   subtitle="Select one or more business types"
 *   persistKey="filter-business-categories"
 *   defaultOpen
 * >
 *   <BusinessCategorySelector />
 * </CollapsibleCard>
 * ```
 */
export const CollapsibleCard: React.FC<CollapsibleCardProps> = ({
  title,
  subtitle,
  children,
  defaultOpen = false,
  isOpen: controlledIsOpen,
  onToggle,
  icon,
  persistKey,
  className = "",
  disabled = false,
  isLoading = false,
}) => {
  const cardId = useId();
  const isControlled = controlledIsOpen !== undefined;

  // Initialize state from localStorage if persistKey is provided
  const getInitialState = (): boolean => {
    if (isControlled) return controlledIsOpen;

    if (persistKey && typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(`collapsible-${persistKey}`);
        if (stored !== null) {
          return JSON.parse(stored);
        }
      } catch (error) {
        console.warn(
          "Failed to load collapsed state from localStorage:",
          error
        );
      }
    }

    return defaultOpen;
  };

  const [internalOpen, setInternalOpen] = useState(getInitialState);
  const isOpen = isControlled ? controlledIsOpen : internalOpen;

  // Persist state to localStorage when it changes
  useEffect(() => {
    if (persistKey && !isControlled && typeof window !== "undefined") {
      try {
        localStorage.setItem(
          `collapsible-${persistKey}`,
          JSON.stringify(internalOpen)
        );
      } catch (error) {
        console.warn("Failed to save collapsed state to localStorage:", error);
      }
    }
  }, [internalOpen, persistKey, isControlled]);

  const handleToggle = () => {
    if (disabled) return;

    const newState = !isOpen;

    if (!isControlled) {
      setInternalOpen(newState);
    }

    onToggle?.(newState);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleToggle();
    }
  };

  const headerId = `${cardId}-header`;
  const contentId = `${cardId}-content`;

  return (
    <div
      className={`bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 shadow-sm transition-shadow hover:shadow-md ${className}`}
    >
      <button
        id={headerId}
        type="button"
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        aria-expanded={isOpen}
        aria-controls={contentId}
        aria-disabled={disabled}
        className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors ${
          disabled
            ? "cursor-not-allowed opacity-50"
            : "hover:bg-gray-50 dark:hover:bg-slate-700/50 cursor-pointer"
        } focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-inset dark:focus-visible:ring-sky-400`}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {icon && (
            <span
              className="flex-shrink-0 text-gray-500 dark:text-slate-400"
              aria-hidden="true"
            >
              {icon}
            </span>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100">
              {title}
            </h3>
            {subtitle && (
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        <svg
          className={`flex-shrink-0 w-5 h-5 text-gray-500 dark:text-slate-400 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
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

      {isOpen && (
        <div
          id={contentId}
          role="region"
          aria-labelledby={headerId}
          className="px-4 pb-4 pt-2"
        >
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-gray-500 dark:text-slate-400">
                  Loading...
                </p>
              </div>
            </div>
          ) : (
            children
          )}
        </div>
      )}
    </div>
  );
};

/**
 * FilterAccordion - Specialized wrapper for filter sections
 *
 * Usage in Lead Explorer sidebar:
 * ```tsx
 * <FilterAccordion
 *   title="Confidence Score"
 *   persistKey="filter-confidence"
 * >
 *   <ConfidenceSlider />
 * </FilterAccordion>
 * ```
 */
export const FilterAccordion: React.FC<
  Omit<CollapsibleCardProps, "icon"> & {
    /** Number of active filters in this section */
    activeCount?: number;
  }
> = ({ activeCount, title, ...props }) => {
  const filterIcon = (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
      />
    </svg>
  );

  const displayTitle =
    activeCount && activeCount > 0 ? `${title} (${activeCount})` : title;

  return <CollapsibleCard {...props} title={displayTitle} icon={filterIcon} />;
};

export default CollapsibleCard;
