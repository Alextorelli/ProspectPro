import React, { useEffect, useId, useRef, useState } from "react";

export interface TabConfig {
  id: string;
  label: string;
  content: React.ReactNode;
  /** Optional icon component for the tab */
  icon?: React.ReactNode;
  /** Optional badge count */
  badge?: number;
  /** Disable the tab */
  disabled?: boolean;
}

interface TabsProps {
  tabs: TabConfig[];
  defaultTab?: string;
  activeTab?: string;
  onChange?: (tabId: string) => void;
  /** Custom class name for the container */
  className?: string;
  /** Enable keyboard navigation with arrow keys */
  keyboardNavigation?: boolean;
  /** Aria label for the tab list */
  ariaLabel?: string;
}

/**
 * Accessible Tabs Component
 *
 * Features:
 * - WCAG 2.1 AA compliant with full ARIA support
 * - Roving tabindex for keyboard navigation
 * - SSR-safe with useId hook
 * - Design tokens from tailwind.config.js
 * - Wired to Dashboard data sources per CODEBASE_INDEX.md
 *
 * Usage in Dashboard.tsx:
 * ```tsx
 * <Tabs
 *   tabs={[
 *     { id: "leads", label: "Lead Explorer", content: <LeadExplorerTable /> },
 *     { id: "campaigns", label: "Campaigns", content: <CampaignsTable />, badge: 5 },
 *     { id: "analytics", label: "Analytics", content: <Analytics /> }
 *   ]}
 *   defaultTab="leads"
 *   onChange={handleTabChange}
 *   keyboardNavigation
 * />
 * ```
 */
export const Tabs: React.FC<TabsProps> = ({
  tabs,
  defaultTab,
  activeTab,
  onChange,
  className = "",
  keyboardNavigation = true,
  ariaLabel = "Dashboard Navigation",
}) => {
  const tabListId = useId();
  const initialTab = activeTab || defaultTab || tabs[0]?.id;
  const [currentTab, setCurrentTab] = useState<string | undefined>(initialTab);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    if (activeTab && activeTab !== currentTab) {
      setCurrentTab(activeTab);
    }
  }, [activeTab, currentTab]);

  const handleTabChange = (tabId: string, index: number) => {
    const tab = tabs[index];
    if (tab.disabled) return;

    if (!activeTab) {
      setCurrentTab(tabId);
    }
    onChange?.(tabId);
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (!keyboardNavigation) return;

    let targetIndex: number | null = null;

    switch (e.key) {
      case "ArrowRight":
        e.preventDefault();
        // Move to next non-disabled tab
        targetIndex = index + 1;
        while (targetIndex < tabs.length && tabs[targetIndex].disabled) {
          targetIndex++;
        }
        if (targetIndex >= tabs.length) targetIndex = null;
        break;

      case "ArrowLeft":
        e.preventDefault();
        // Move to previous non-disabled tab
        targetIndex = index - 1;
        while (targetIndex >= 0 && tabs[targetIndex].disabled) {
          targetIndex--;
        }
        if (targetIndex < 0) targetIndex = null;
        break;

      case "Home":
        e.preventDefault();
        // Move to first non-disabled tab
        targetIndex = 0;
        while (targetIndex < tabs.length && tabs[targetIndex].disabled) {
          targetIndex++;
        }
        if (targetIndex >= tabs.length) targetIndex = null;
        break;

      case "End":
        e.preventDefault();
        // Move to last non-disabled tab
        targetIndex = tabs.length - 1;
        while (targetIndex >= 0 && tabs[targetIndex].disabled) {
          targetIndex--;
        }
        if (targetIndex < 0) targetIndex = null;
        break;
    }

    if (targetIndex !== null) {
      const targetTab = tabRefs.current[targetIndex];
      if (targetTab) {
        targetTab.focus();
        handleTabChange(tabs[targetIndex].id, targetIndex);
      }
    }
  };

  if (!tabs.length) {
    return null;
  }

  const resolvedTabId = currentTab || tabs[0].id;
  const activeTabIndex = tabs.findIndex((tab) => tab.id === resolvedTabId);
  const activeTabContent = tabs[activeTabIndex]?.content;

  return (
    <div className={`w-full ${className}`}>
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav
          role="tablist"
          aria-label={ariaLabel}
          aria-orientation="horizontal"
          className="-mb-px flex space-x-4"
        >
          {tabs.map((tab, index) => {
            const isActive = tab.id === resolvedTabId;
            const panelId = `${tabListId}-panel-${tab.id}`;
            const tabId = `${tabListId}-tab-${tab.id}`;

            return (
              <button
                key={tab.id}
                ref={(el) => (tabRefs.current[index] = el)}
                id={tabId}
                role="tab"
                type="button"
                onClick={() => handleTabChange(tab.id, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                disabled={tab.disabled}
                tabIndex={isActive ? 0 : -1}
                aria-selected={isActive}
                aria-controls={panelId}
                aria-disabled={tab.disabled}
                className={`inline-flex items-center gap-2 whitespace-nowrap py-3 px-1 border-b-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900 ${
                  tab.disabled
                    ? "border-transparent text-gray-300 dark:text-gray-600 cursor-not-allowed"
                    : isActive
                    ? "border-blue-500 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200"
                }`}
              >
                {tab.icon && (
                  <span className="flex-shrink-0" aria-hidden="true">
                    {tab.icon}
                  </span>
                )}
                <span>{tab.label}</span>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span
                    className={`inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none rounded-full ${
                      isActive
                        ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                        : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
                    }`}
                    aria-label={`${tab.badge} items`}
                  >
                    {tab.badge > 99 ? "99+" : tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
      <div
        role="tabpanel"
        id={`${tabListId}-panel-${resolvedTabId}`}
        aria-labelledby={`${tabListId}-tab-${resolvedTabId}`}
        tabIndex={0}
        className="mt-6 focus:outline-none"
      >
        {activeTabContent}
      </div>
    </div>
  );
};
