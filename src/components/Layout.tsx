import React, { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { ThemeToggle } from "./ThemeToggle";

interface LayoutProps {
  children: ReactNode;
}

const navigation = [
  { name: "Discovery", href: "/", icon: "🔍" },
  { name: "Dashboard", href: "/dashboard", icon: "📊" },
];

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-800">
      {/* ProspectPro Header */}
      <div className="px-6 py-4" style={{ backgroundColor: "#f9ed69" }}>
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center">
            <img
              src="/ProspectPro Icon.png"
              alt="ProspectPro"
              className="h-8"
            />
          </div>
          <ThemeToggle />
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
        <div className="max-w-4xl mx-auto">
          <div className="flex">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center space-x-2 px-6 py-4 border-b-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20"
                      : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                  }`}
                >
                  <span>{item.icon}</span>
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto p-6">{children}</main>
    </div>
  );
};
