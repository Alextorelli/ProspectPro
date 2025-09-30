/**
 * Campaign-Specific CSV Export API
 * Exports all leads from a specific campaign with comprehensive metadata
 */
const express = require("express");
const createCsvWriter = require("csv-writer").createObjectCsvWriter;
const path = require("path");
const fs = require("fs").promises;
const { getSupabaseClient } = require("../config/supabase");

const router = express.Router();

/**
 * Export campaign leads to CSV
 * GET /api/campaigns/:campaignId/export?format=csv&minConfidence=70
 */
router.get("/:campaignId/export", async (req, res) => {
  try {
    const { campaignId } = req.params;
    const {
      format = "csv",
      minConfidence = 70,
      includeUnqualified = false,
      includeProvenance = true,
    } = req.query;

    console.log(
      `📊 Exporting campaign ${campaignId} (format: ${format}, min confidence: ${minConfidence})`
    );

    const supabase = getSupabaseClient();
    if (!supabase) {
      return res.status(500).json({
        error: "Database connection not available",
        details: "Supabase client not initialized",
      });
    }

    // Get campaign details
    const { data: campaign, error: campaignError } = await supabase
      .from("campaigns")
      .select("*")
      .eq("id", campaignId)
      .single();

    if (campaignError || !campaign) {
      return res.status(404).json({
        error: "Campaign not found",
        details: campaignError?.message,
      });
    }

    // Get all leads for this campaign with enriched data
    const { data: leads, error: leadsError } = await supabase
      .from("enhanced_leads")
      .select(
        `
        *,
        lead_emails(*),
        validation_results(*),
        api_costs(*)
      `
      )
      .eq("campaign_id", campaignId)
      .gte("confidence_score", includeUnqualified ? 0 : minConfidence)
      .order("confidence_score", { ascending: false });

    if (leadsError) {
      console.error("Error fetching leads:", leadsError);
      return res.status(500).json({
        error: "Failed to fetch campaign leads",
        details: leadsError.message,
      });
    }

    if (!leads || leads.length === 0) {
      return res.status(404).json({
        error: "No leads found for this campaign",
        campaign: campaign.name || campaignId,
      });
    }

    // Generate CSV export
    const exportResult = await generateCampaignCSV(campaign, leads, {
      includeProvenance,
      minConfidence: parseInt(minConfidence),
    });

    // Set response headers for file download
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = sanitizeFilename(
      `${campaign.name || "campaign"}_${campaignId.slice(
        0,
        8
      )}_${timestamp}.csv`
    );

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("X-Export-Count", exportResult.exportedCount);
    res.setHeader("X-Total-Count", exportResult.totalCount);
    res.setHeader("X-Campaign-Name", campaign.name || "Untitled");

    console.log(
      `✅ Export completed: ${exportResult.exportedCount}/${exportResult.totalCount} leads exported`
    );
    res.send(exportResult.csvContent);
  } catch (error) {
    console.error("❌ Campaign export error:", error);
    res.status(500).json({
      error: "Export failed",
      details: error.message,
    });
  }
});

/**
 * Get campaign export history
 * GET /api/campaigns/:campaignId/exports
 */
router.get("/:campaignId/exports", async (req, res) => {
  try {
    const { campaignId } = req.params;

    const supabase = getSupabaseClient();
    if (!supabase) {
      return res.status(500).json({
        error: "Database connection not available",
        details: "Supabase client not initialized",
      });
    }

    const { data: exports, error } = await supabase
      .from("dashboard_exports")
      .select("*")
      .eq("campaign_id", campaignId)
      .order("created_at", { ascending: false });

    if (error) {
      return res.status(500).json({
        error: "Failed to fetch export history",
        details: error.message,
      });
    }

    res.json({
      campaignId,
      exports: exports || [],
    });
  } catch (error) {
    console.error("Export history error:", error);
    res.status(500).json({
      error: "Failed to get export history",
      details: error.message,
    });
  }
});

/**
 * Generate comprehensive CSV for campaign leads
 */
async function generateCampaignCSV(campaign, leads, options = {}) {
  const { includeProvenance = true, minConfidence = 70 } = options;

  // Filter qualified leads
  const qualifiedLeads = leads.filter(
    (lead) =>
      lead.confidence_score >= minConfidence &&
      lead.business_name &&
      lead.address
  );

  // Define comprehensive CSV headers
  const headers = [
    "Business Name",
    "Address",
    "Phone",
    "Website",
    "Primary Email",
    "All Emails",
    "Owner Name",
    "Owner Title",
    "Confidence Score",
    "Validation Status",
    "Industry/Category",
    // Removed: Employee Count Est., Google Rating, Google Reviews
    "Created Date",
    "Discovery Source",
    "Email Source",
    "Apollo.io Data",
    "Hunter.io Data",
    "Optimized Engine Cost",
    "Website Status",
    "Email Deliverability",
    "Phone Validation",
    "Address Validation",
    "Total API Cost",
    "Cost Per Lead",
  ];

  // Add provenance columns if requested
  if (includeProvenance) {
    headers.push(
      // Removed: Google Place ID, Foursquare ID
      "Business Registration",
      "Professional License",
      "Chamber Membership",
      "Social Media Links",
      "Data Quality Score",
      "Enrichment Timestamp"
    );
  }

  // Generate CSV rows
  const csvRows = qualifiedLeads.map((lead) => {
    const baseRow = [
      cleanCsvField(lead.business_name),
      cleanCsvField(lead.address),
      cleanCsvField(lead.phone),
      cleanCsvField(lead.website),
      cleanCsvField(lead.lead_emails?.[0]?.email || ""),
      cleanCsvField(lead.lead_emails?.map((e) => e.email).join("; ") || ""),
      cleanCsvField(lead.owner_name || ""),
      cleanCsvField(lead.owner_title || ""),
      lead.confidence_score || 0,
      cleanCsvField(lead.validation_status || "pending"),
      cleanCsvField(lead.business_category || ""),
      // Removed: employee count, google rating, reviews
      formatDate(lead.created_at),
      cleanCsvField(lead.discovery_source || "unknown"),
      cleanCsvField(lead.email_discovery_source || "website"),
      getApolloDataStatus(lead),
      getHunterDataStatus(lead),
      formatCurrency(getOptimizedEngineCost(lead)),
      getWebsiteStatus(lead),
      getEmailDeliverability(lead),
      getPhoneValidation(lead),
      getAddressValidation(lead),
      formatCurrency(lead.total_cost || 0),
      formatCurrency(calculateCostPerLead(lead, campaign)),
    ];

    // Add provenance data if requested
    if (includeProvenance) {
      baseRow.push(
        // Removed: google_place_id, foursquare_fsq_id
        getRegistrationStatus(lead),
        getProfessionalLicense(lead),
        getChamberMembership(lead),
        getSocialMediaLinks(lead),
        calculateDataQualityScore(lead),
        formatDate(lead.enriched_at || lead.created_at)
      );
    }

    return baseRow;
  });

  // Generate CSV content
  const csvContent = [
    headers.join(","),
    ...csvRows.map((row) =>
      row
        .map((field) =>
          typeof field === "string" && field.includes(",")
            ? `"${field.replace(/"/g, '""')}"`
            : field
        )
        .join(",")
    ),
  ].join("\n");

  // Log export to database
  await logCampaignExport(campaign.id, qualifiedLeads.length, leads.length);

  return {
    csvContent,
    exportedCount: qualifiedLeads.length,
    totalCount: leads.length,
    headers,
  };
}

/**
 * Helper functions for CSV data formatting
 */
function cleanCsvField(value) {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/[\r\n]+/g, " ")
    .trim();
}

function formatDate(dateString) {
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString("en-US");
}

function formatCurrency(amount) {
  return "$" + parseFloat(amount || 0).toFixed(4);
}

function calculateCostPerLead(lead, campaign) {
  const totalCost = parseFloat(lead.total_cost || 0);
  return totalCost > 0 ? totalCost : 0;
}

function getWebsiteStatus(lead) {
  const validation = lead.validation_results?.[0];
  if (validation?.website_accessible === true) return "Accessible";
  if (validation?.website_accessible === false) return "Inaccessible";
  return "Not Validated";
}

function getEmailDeliverability(lead) {
  const primaryEmail = lead.lead_emails?.[0];
  if (primaryEmail?.deliverability_status === "deliverable")
    return "Deliverable";
  if (primaryEmail?.deliverability_status === "undeliverable")
    return "Undeliverable";
  if (primaryEmail?.deliverability_status === "risky") return "Risky";
  return "Not Validated";
}

function getPhoneValidation(lead) {
  const validation = lead.validation_results?.[0];
  if (validation?.phone_valid === true) return "Valid";
  if (validation?.phone_valid === false) return "Invalid";
  return "Not Validated";
}

function getAddressValidation(lead) {
  const validation = lead.validation_results?.[0];
  if (validation?.address_validated === true) return "Validated";
  if (validation?.address_validated === false) return "Invalid";
  return "Not Validated";
}

function getRegistrationStatus(lead) {
  const validation = lead.validation_results?.[0];
  const regData = validation?.business_registration_data;
  if (regData?.ca_sos_active) return "CA Active";
  if (regData?.ny_registry_active) return "NY Active";
  if (regData?.ct_ucc_filings > 0) return "CT UCC Found";
  return "Not Found";
}

function getProfessionalLicense(lead) {
  const validation = lead.validation_results?.[0];
  const licenseData = validation?.professional_license_data;
  if (licenseData?.license_active) return licenseData.license_type || "Active";
  return "Not Found";
}

function getChamberMembership(lead) {
  // Check if lead was discovered via chamber source
  if (lead.discovery_source?.includes("chamber")) return "Member";
  return "Not Verified";
}

function getSocialMediaLinks(lead) {
  const socialLinks = [];
  if (lead.facebook_url) socialLinks.push("Facebook");
  if (lead.linkedin_url) socialLinks.push("LinkedIn");
  if (lead.twitter_url) socialLinks.push("Twitter");
  if (lead.instagram_url) socialLinks.push("Instagram");
  return socialLinks.length > 0 ? socialLinks.join(", ") : "None";
}

/**
 * Enhanced optimized engine tracking functions
 */
function getApolloDataStatus(lead) {
  // Check if lead has data enriched by Apollo
  const hasOwnerData = lead.owner_name || lead.owner_title;
  const hasOrganizationData =
    lead.employee_count_estimate || lead.company_description;
  const apolloCost = getApiCostByService(lead, "apollo");

  if (apolloCost > 0) {
    const dataPoints = [];
    if (hasOwnerData) dataPoints.push("Owner Info");
    if (hasOrganizationData) dataPoints.push("Company Data");
    if (dataPoints.length > 0) {
      return `Yes (${dataPoints.join(", ")}) - $${apolloCost.toFixed(4)}`;
    }
    return `Yes - $${apolloCost.toFixed(4)}`;
  }

  // Check for Apollo-sourced data without explicit cost tracking
  if (hasOwnerData && lead.discovery_source?.includes("apollo")) {
    return "Yes (Owner Info)";
  }

  return "No";
}

function getHunterDataStatus(lead) {
  // Check if lead has Hunter.io email data
  const hunterEmails =
    lead.lead_emails?.filter(
      (email) =>
        email.source?.toLowerCase().includes("hunter") ||
        email.discovery_method?.toLowerCase().includes("hunter")
    ) || [];

  const hunterCost = getApiCostByService(lead, "hunter");

  if (hunterCost > 0) {
    return `Yes (${hunterEmails.length} emails) - $${hunterCost.toFixed(4)}`;
  }

  // Check for Hunter-sourced emails without explicit cost tracking
  if (hunterEmails.length > 0) {
    return `Yes (${hunterEmails.length} emails)`;
  }

  // Check if email discovery source mentions hunter/comprehensive
  if (
    lead.email_discovery_source?.toLowerCase().includes("hunter") ||
    lead.email_discovery_source?.toLowerCase().includes("comprehensive")
  ) {
    return "Yes (Email Discovery)";
  }

  return "No";
}

function getOptimizedEngineCost(lead) {
  const apolloCost = getApiCostByService(lead, "apollo");
  const hunterCost = getApiCostByService(lead, "hunter");
  return apolloCost + hunterCost;
}

function getApiCostByService(lead, serviceName) {
  if (!lead.api_costs || !Array.isArray(lead.api_costs)) {
    return 0;
  }

  return lead.api_costs
    .filter((cost) =>
      cost.api_service?.toLowerCase().includes(serviceName.toLowerCase())
    )
    .reduce((sum, cost) => sum + parseFloat(cost.cost_usd || 0), 0);
}

function calculateDataQualityScore(lead) {
  let score = 0;
  const weights = {
    hasWebsite: 15,
    hasEmail: 20,
    hasPhone: 20,
    hasOwnerName: 15,
    emailVerified: 15,
    websiteAccessible: 10,
    hasBusinessRegistration: 5,
  };

  if (lead.website) score += weights.hasWebsite;
  if (lead.lead_emails?.length > 0) score += weights.hasEmail;
  if (lead.phone) score += weights.hasPhone;
  if (lead.owner_name) score += weights.hasOwnerName;

  const validation = lead.validation_results?.[0];
  if (validation?.email_deliverable) score += weights.emailVerified;
  if (validation?.website_accessible) score += weights.websiteAccessible;
  if (validation?.business_registration_found)
    score += weights.hasBusinessRegistration;

  return Math.min(score, 100);
}

function sanitizeFilename(filename) {
  return filename.replace(/[^a-zA-Z0-9_-]/g, "_").replace(/__+/g, "_");
}

async function logCampaignExport(campaignId, exportedCount, totalCount) {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      console.error("Cannot log export: Database connection not available");
      return;
    }
    
    await supabase.from("dashboard_exports").insert({
      campaign_id: campaignId,
      export_type: "lead_export",
      file_format: "csv",
      row_count: exportedCount,
      export_status: "completed",
      completed_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Failed to log export:", error);
  }
}

module.exports = router;
