import type { BusinessLead } from "../types";

type ExportLeadsOptions = {
  fileName?: string;
};

const csvEscape = (value: unknown): string => {
  if (value === null || value === undefined) {
    return "";
  }

  const stringValue = String(value);
  const escaped = stringValue.replace(/"/g, '""');
  return `"${escaped}"`;
};

const getPrimaryEmail = (lead: BusinessLead): string => {
  if (lead.email) {
    return lead.email;
  }

  const enrichedEmail = lead.enrichment_data?.emails?.find(
    (entry) => entry.verified
  );

  return enrichedEmail?.email || lead.enrichment_data?.emails?.[0]?.email || "";
};

const getOwnerData = (lead: BusinessLead) => {
  const legacyOwnerData = (lead as any).owner_data || {};

  if (legacyOwnerData && Object.keys(legacyOwnerData).length > 0) {
    return legacyOwnerData;
  }

  const executiveContact = lead.enrichment_data?.emails?.find((entry) =>
    entry.type?.toLowerCase().includes("owner")
  );

  if (!executiveContact) {
    return {};
  }

  const name = [executiveContact.firstName, executiveContact.lastName]
    .filter(Boolean)
    .join(" ");

  return {
    name,
    email: executiveContact.email,
    phone: (executiveContact as any).phone,
    confidence_score: executiveContact.confidence,
  };
};

export const exportLeadsToCsv = (
  leads: BusinessLead[],
  options: ExportLeadsOptions = {}
) => {
  if (!leads.length) {
    console.warn("No leads provided for export.");
    return;
  }

  const headers = [
    "Business Name",
    "Address",
    "Phone",
    "Website",
    "Email",
    "Confidence Score",
    "Validation Status",
    "Cost to Acquire",
    "Data Sources",
    "Enrichment Tier",
    "Vault Secured",
    "Hunter Verified",
    "NeverBounce Verified",
    "License Verified",
    "Owner Name",
    "Owner Email",
    "Owner Phone",
    "Owner Confidence Score",
  ];

  const rows = leads.map((lead) => {
    const sources =
      lead.enrichment_data?.dataSources || lead.data_sources || [];
    const ownerData = getOwnerData(lead);

    return [
      csvEscape(lead.business_name),
      csvEscape(lead.address || ""),
      csvEscape(lead.phone || ""),
      csvEscape(lead.website || ""),
      csvEscape(getPrimaryEmail(lead)),
      csvEscape(lead.confidence_score ?? ""),
      csvEscape(lead.validation_status || ""),
      csvEscape((lead.cost_to_acquire ?? 0).toFixed(3)),
      csvEscape(sources.join("; ")),
      csvEscape(lead.enrichment_tier || ""),
      csvEscape(lead.vault_secured ? "Yes" : "No"),
      csvEscape(lead.enrichment_data?.hunterVerified ? "Yes" : "No"),
      csvEscape(lead.enrichment_data?.neverBounceVerified ? "Yes" : "No"),
      csvEscape(lead.enrichment_data?.licenseVerified ? "Yes" : "No"),
      csvEscape(ownerData.name || ""),
      csvEscape(ownerData.email || ""),
      csvEscape(ownerData.phone || ""),
      csvEscape(ownerData.confidence_score ?? ""),
    ].join(",");
  });

  const csvContent = [headers.join(","), ...rows].join("\n");

  const blob = new Blob([csvContent], {
    type: "text/csv;charset=utf-8;",
  });

  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.href = url;
  link.download =
    options.fileName ||
    `campaign-leads-${new Date().toISOString().split("T")[0]}.csv`;
  link.style.display = "none";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
