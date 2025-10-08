import React from "react";
import { ApiUsageTable } from "../components/ApiUsageTable";
import { useAuth } from "../contexts/AuthContext";

export const AccountPage: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="flex items-center space-x-3">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
          <span className="text-gray-600 dark:text-slate-400">
            Loading account...
          </span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-slate-100">
            Sign in to manage your account
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-slate-400">
            Access your billing, usage analytics, and profile settings after
            signing in.
          </p>
        </div>
      </div>
    );
  }

  const displayName = user?.user_metadata?.full_name || "ProspectPro User";
  const email = user?.email || "Not provided";
  const avatarUrl = user?.user_metadata?.avatar_url;
  const createdAt = user?.created_at ? new Date(user.created_at) : null;
  const lastSignIn = user?.last_sign_in_at
    ? new Date(user.last_sign_in_at)
    : null;

  const initials = displayName
    .split(" ")
    .map((part: string) => part.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="border-b border-gray-200 pb-6 dark:border-slate-700">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">
          Account Settings
        </h1>
        <p className="mt-2 text-gray-600 dark:text-slate-400">
          Manage your account, view usage analytics, and configure preferences.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Profile Section */}
        <div className="lg:col-span-1">
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">
              Profile Information
            </h2>

            <div className="flex items-center space-x-4 mb-6">
              <div className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border-2 border-blue-200 bg-blue-100 text-xl font-bold text-blue-700 shadow-sm dark:border-sky-500/60 dark:bg-sky-500/10 dark:text-sky-200">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={displayName}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                ) : (
                  initials || "PP"
                )}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
                  {displayName}
                </h3>
                <p className="text-sm text-gray-600 dark:text-slate-400">
                  {email}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-slate-400">
                  Account Created
                </dt>
                <dd className="text-sm text-gray-900 dark:text-slate-100">
                  {createdAt
                    ? createdAt.toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : "Unknown"}
                </dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-slate-400">
                  Last Sign In
                </dt>
                <dd className="text-sm text-gray-900 dark:text-slate-100">
                  {lastSignIn
                    ? lastSignIn.toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "Unknown"}
                </dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-slate-400">
                  User ID
                </dt>
                <dd className="text-xs font-mono text-gray-700 dark:text-slate-300 break-all">
                  {user?.id || "Not available"}
                </dd>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">
              Quick Actions
            </h3>
            <div className="space-y-3">
              <button
                type="button"
                className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                onClick={() => {
                  // TODO: Implement profile editing
                  alert(
                    "Profile editing will be available in a future update."
                  );
                }}
              >
                Edit Profile
              </button>
              <button
                type="button"
                className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                onClick={() => {
                  // TODO: Implement password change
                  alert(
                    "Password management will be available in a future update."
                  );
                }}
              >
                Change Password
              </button>
              <button
                type="button"
                className="w-full rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:border-red-600 dark:bg-slate-800 dark:text-red-400 dark:hover:bg-red-900/20"
                onClick={() => {
                  // TODO: Implement account deletion
                  if (
                    confirm(
                      "Are you sure you want to delete your account? This action cannot be undone."
                    )
                  ) {
                    alert(
                      "Account deletion will be available in a future update."
                    );
                  }
                }}
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>

        {/* Usage Analytics */}
        <div className="lg:col-span-2">
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
                API Usage & Cost Analytics
              </h2>
              <p className="text-sm text-gray-600 dark:text-slate-400">
                Monitor your API usage patterns and costs across all services.
              </p>
            </div>

            <ApiUsageTable />
          </div>
        </div>
      </div>

      {/* Subscription and Billing Section (Placeholder) */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">
          Subscription & Billing
        </h2>
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-sky-800 dark:bg-sky-900/20">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-blue-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800 dark:text-sky-200">
                Current Plan: Pay-per-Use
              </h3>
              <p className="mt-1 text-sm text-blue-700 dark:text-sky-300">
                You're currently on a pay-per-use billing model with no monthly
                subscription. API costs are charged based on actual usage.
                Subscription plans with fixed pricing and enhanced features
                coming soon.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
