/**
 * Simple Campaign Export - Works without database dependencies
 * Temporary solution until database schema is properly configured
 */
const express = require("express");
const router = express.Router();

// In-memory storage for campaign results (temporary)
let campaignResults = new Map();

/**
 * Store campaign results for later export
 */
function storeCampaignResults(campaignId, results) {
  campaignResults.set(campaignId, {
    ...results,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Simple CSV export that works with stored results
 */
router.get("/:campaignId/export", async (req, res) => {
  try {
    const { campaignId } = req.params;

    console.log(`📊 Exporting campaign ${campaignId}`);

    // Get stored results
    const campaign = campaignResults.get(campaignId);

    if (!campaign || !campaign.leads) {
      return res.status(404).json({
        error: "Campaign not found or no leads available",
        campaignId,
        available: Array.from(campaignResults.keys()),
      });
    }

    // Generate simple CSV
    const csvContent = generateSimpleCSV(campaign);

    // Set response headers
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `campaign_${campaignId.slice(0, 8)}_${timestamp}.csv`;

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("X-Export-Count", campaign.leads.length);
    res.setHeader("X-Campaign-ID", campaignId);

    console.log(`✅ Export completed: ${campaign.leads.length} leads exported`);
    res.send(csvContent);
  } catch (error) {
    console.error("❌ Export error:", error);
    res.status(500).json({
      error: "Export failed",
      details: error.message,
    });
  }
});

/**
 * Generate simple CSV from campaign data
 */
function generateSimpleCSV(campaign) {
  const headers = [
    "Business Name",
    "Address",
    "Phone",
    "Website",
    "Email",
    "Confidence Score",
    "Discovery Source",
    "Timestamp",
  ];

  const rows = campaign.leads.map((lead) => [
    cleanField(lead.businessName || ""),
    cleanField(lead.address || ""),
    cleanField(lead.phone || ""),
    cleanField(lead.website || ""),
    cleanField(lead.email || ""),
    lead.optimizedScore || lead.confidence_score || 0,
    cleanField(lead.discovery_source || "Google Places"),
    new Date().toLocaleDateString(),
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) =>
      row
        .map((field) =>
          typeof field === "string" &&
          (field.includes(",") || field.includes('"'))
            ? `"${field.replace(/"/g, '""')}"`
            : field
        )
        .join(",")
    ),
  ].join("\n");

  return csvContent;
}

/**
 * Clean CSV field
 */
function cleanField(value) {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/[\r\n]+/g, " ")
    .trim();
}

/**
 * Get list of available campaigns
 */
router.get("/", (req, res) => {
  const campaigns = Array.from(campaignResults.entries()).map(([id, data]) => ({
    campaignId: id,
    timestamp: data.timestamp,
    leadCount: data.leads?.length || 0,
    totalFound: data.results?.totalFound || 0,
    qualified: data.results?.qualified || 0,
  }));

  res.json({
    campaigns,
    total: campaigns.length,
  });
});

module.exports = { router, storeCampaignResults };
