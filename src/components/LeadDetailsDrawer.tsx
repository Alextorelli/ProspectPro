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
        role="presentation"
        className="fixed inset-0 bg-black/40 z-40"
        onClick={onClose}
      />

      <aside
        className="fixed inset-y-0 right-0 w-full max-w-md z-50 shadow-2xl bg-white dark:bg-gray-900 overflow-y-auto"
        aria-label="Lead details"
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Lead Details
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900 rounded-full"
            aria-label="Close lead details"
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
                    href={`tel:${lead.phone}`}
                    className="text-blue-600 hover:underline dark:text-blue-400"
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
                    href={`mailto:${lead.email}`}
                    className="text-blue-600 hover:underline dark:text-blue-400"
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
                    href={lead.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline dark:text-blue-400"
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
