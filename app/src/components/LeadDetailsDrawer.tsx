import React from "react";
import type { BusinessLead } from "../types";

interface LeadDetailsDrawerProps {
  lead: BusinessLead | null;
  isOpen: boolean;
  onClose: () => void;
}

const formatDisplayValue = (value?: string) =>
  value && value.trim().length > 0 ? value : "Not provided";

export const LeadDetailsDrawer: React.FC<LeadDetailsDrawerProps> = ({
  lead,
  isOpen,
  onClose,
}) => {
  if (!lead || !isOpen) {
    return null;
  }

  return (
    <>
      <div
        className="fixed inset-0 bg-black/40 z-40"
        role="presentation"
        onClick={onClose}
      />

      <aside
        aria-label="Lead details"
        className="fixed inset-y-0 right-0 w-full max-w-md z-50 shadow-2xl bg-white dark:bg-gray-900 overflow-y-auto"
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Lead Details
          </h2>
          <button
            aria-label="Close lead details"
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900 rounded-full"
            type="button"
            onClick={onClose}
          >
            <span aria-hidden="true">×</span>
          </button>
        </div>

        <div className="px-6 py-6 space-y-8">
          <section>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Business Summary
            </h3>
            <div className="mt-4 space-y-3 text-sm text-gray-700 dark:text-gray-200">
              <div>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  Name:
                </span>{" "}
                {formatDisplayValue(lead.business_name)}
              </div>
              <div>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  Address:
                </span>{" "}
                {formatDisplayValue(lead.address)}
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Contact Details
            </h3>
            <div className="mt-4 space-y-3 text-sm text-gray-700 dark:text-gray-200">
              <div>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  Phone:
                </span>{" "}
                {lead.phone ? (
                  <a
                    className="text-blue-600 hover:underline dark:text-blue-400"
                    href={`tel:${lead.phone}`}
                  >
                    {lead.phone}
                  </a>
                ) : (
                  "Not provided"
                )}
              </div>
              <div>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  Email:
                </span>{" "}
                {lead.email ? (
                  <a
                    className="text-blue-600 hover:underline dark:text-blue-400"
                    href={`mailto:${lead.email}`}
                  >
                    {lead.email}
                  </a>
                ) : (
                  "Not provided"
                )}
              </div>
              <div>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  Website:
                </span>{" "}
                {lead.website ? (
                  <a
                    className="text-blue-600 hover:underline dark:text-blue-400"
                    href={lead.website}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    {lead.website}
                  </a>
                ) : (
                  "Not provided"
                )}
              </div>
            </div>
          </section>
        </div>
      </aside>
    </>
  );
};
