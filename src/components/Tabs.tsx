import React, { useEffect, useState } from "react";

export interface TabConfig {
  id: string;
  label: string;
  content: React.ReactNode;
}

interface TabsProps {
  tabs: TabConfig[];
  defaultTab?: string;
  activeTab?: string;
  onChange?: (tabId: string) => void;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  defaultTab,
  activeTab,
  onChange,
}) => {
  const initialTab = activeTab || defaultTab || tabs[0]?.id;
  const [currentTab, setCurrentTab] = useState<string | undefined>(initialTab);

  useEffect(() => {
    if (activeTab && activeTab !== currentTab) {
      setCurrentTab(activeTab);
    }
  }, [activeTab, currentTab]);

  const handleTabChange = (tabId: string) => {
    if (!activeTab) {
      setCurrentTab(tabId);
    }
    onChange?.(tabId);
  };

  if (!tabs.length) {
    return null;
  }

  const resolvedTabId = currentTab || tabs[0].id;
  const activeTabContent = tabs.find(
    (tab) => tab.id === resolvedTabId
  )?.content;

  return (
    <div className="w-full">
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-4" aria-label="Dashboard Tabs">
          {tabs.map((tab) => {
            const isActive = tab.id === resolvedTabId;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabChange(tab.id)}
                className={`whitespace-nowrap py-3 px-1 border-b-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900 ${
                  isActive
                    ? "border-blue-500 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200"
                }`}
                aria-current={isActive ? "page" : undefined}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>
      <div className="mt-6">{activeTabContent}</div>
    </div>
  );
};
