import React, { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useCampaignStore } from "../stores/campaignStore";
import { AuthComponent } from "./AuthComponent";
import { ThemeToggle } from "./ThemeToggle";

interface LayoutProps {
  children: ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  // All hooks must be called unconditionally at the top level
  const location = useLocation();
  const { user } = useAuth();
  const { currentCampaign, campaigns } = useCampaignStore((state) => ({
    currentCampaign: state.currentCampaign,
    campaigns: state.campaigns,
  }));

  // Compute runningCampaignId at top level
  let runningCampaignId: string | null = null;
  if (currentCampaign?.status === "running") {
    runningCampaignId = currentCampaign.campaign_id;
  } else {
    const runningCampaign = campaigns.find(
      (campaign) => campaign.status === "running"
    );
    runningCampaignId = runningCampaign?.campaign_id ?? null;
  }

  type NavigationItem = {
    name: string;
    href: string;
    disabled?: boolean;
    isActive?: (pathname: string) => boolean;
  };

  // Build navigation array at top level
  const navigation: NavigationItem[] = [
    {
      name: "Start Discovery",
      href: "/discovery",
      isActive: (pathname) => pathname === "/" || pathname === "/discovery",
    },
    {
      name: "My Campaigns",
      href: "/dashboard",
      disabled: !user,
    },
  ];

  if (runningCampaignId) {
    navigation.push({
      name: "Live Progress",
      href: `/campaign/${runningCampaignId}/progress`,
      isActive: (pathname) =>
        pathname.startsWith(`/campaign/${runningCampaignId}/progress`),
    });
  }

  navigation.push({
    name: "Results",
    href: "/results",
  });

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 transition-colors dark:bg-slate-900 dark:text-slate-100">
      <header className="border-b border-yellow-400 bg-[#f9ed69] text-gray-900 dark:border-yellow-500 dark:bg-[#f9ed69] dark:text-gray-900">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <Link
            aria-label="ProspectPro home"
            className="flex h-full items-center"
            to="/"
          >
            <img
              alt="ProspectPro"
              className="h-16 w-auto"
              src="/logo-full.svg"
            />
          </Link>
          <div className="flex items-center space-x-3">
            <AuthComponent />
            <div aria-hidden="true" className="h-10 w-px bg-gray-300" />
            <ThemeToggle />
          </div>
        </div>
      </header>
      <nav className="border-b border-gray-200 bg-white text-sm font-medium transition-colors dark:border-slate-700 dark:bg-slate-900">
        <div className="mx-auto flex max-w-5xl items-center px-6">
          {navigation.map((item) => {
            const isActive =
              !item.disabled &&
              (item.isActive
                ? item.isActive(location.pathname)
                : location.pathname === item.href);

            if (item.disabled) {
              return (
                <span
                  key={item.name}
                  aria-disabled="true"
                  className="flex items-center border-b-2 border-transparent px-4 py-3 text-gray-400"
                >
                  {item.name}
                </span>
              );
            }

            return (
              <Link
                key={item.name}
                className={`flex items-center border-b-2 px-4 py-3 transition-colors ${
                  isActive
                    ? "border-blue-600 text-blue-700 dark:border-sky-400 dark:text-sky-300"
                    : "border-transparent text-gray-600 hover:text-gray-900 dark:text-slate-400 dark:hover:text-slate-50"
                }`}
                to={item.href}
              >
                {item.name}
              </Link>
            );
          })}
        </div>
      </nav>

      <main className="mx-auto max-w-5xl px-6 pb-12 pt-8 sm:pb-16 sm:pt-10">
        {children}
      </main>
    </div>
  );
};
