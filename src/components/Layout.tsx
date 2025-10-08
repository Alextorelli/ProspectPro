import React, { ReactNode, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { AuthComponent } from "./AuthComponent";
import { ThemeToggle } from "./ThemeToggle";

interface LayoutProps {
  children: ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const { user } = useAuth();

  const navigation = useMemo(
    () => [
      { name: "New Campaign", href: "/", disabled: false },
      {
        name: "My Campaigns",
        href: "/dashboard",
        disabled: !user,
      },
    ],
    [user]
  );

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 transition-colors dark:bg-slate-900 dark:text-slate-100">
      <header className="border-b border-yellow-400 bg-[#f9ed69] text-gray-900 dark:border-yellow-500 dark:bg-[#f9ed69] dark:text-gray-900">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <Link
            to="/"
            className="flex h-full items-center"
            aria-label="ProspectPro home"
          >
            <img
              src="/logo-full.svg"
              alt="ProspectPro"
              className="h-16 w-auto"
            />
          </Link>
          <div className="flex items-center space-x-3">
            <AuthComponent />
            <div className="h-10 w-px bg-gray-300" aria-hidden="true" />
            <ThemeToggle />
          </div>
        </div>
      </header>
      <nav className="border-b border-gray-200 bg-white text-sm font-medium transition-colors dark:border-slate-700 dark:bg-slate-900">
        <div className="mx-auto flex max-w-5xl items-center px-6">
          {navigation.map((item) => {
            const isActive = !item.disabled && location.pathname === item.href;

            if (item.disabled) {
              return (
                <span
                  key={item.name}
                  className="flex items-center border-b-2 border-transparent px-4 py-3 text-gray-400"
                  aria-disabled="true"
                >
                  {item.name}
                </span>
              );
            }

            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center border-b-2 px-4 py-3 transition-colors ${
                  isActive
                    ? "border-blue-600 text-blue-700 dark:border-sky-400 dark:text-sky-300"
                    : "border-transparent text-gray-600 hover:text-gray-900 dark:text-slate-400 dark:hover:text-slate-50"
                }`}
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
