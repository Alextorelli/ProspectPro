const express = require("express");
const GooglePlacesClient = require("../modules/api-clients/google-places");
const EnhancedLeadDiscovery = require("../modules/enhanced-lead-discovery");
const CampaignLogger = require("../modules/logging/campaign-logger");
const CampaignCSVExporter = require("../modules/campaign-csv-exporter");
const EnhancedStateRegistryClient = require("../modules/api-clients/enhanced-state-registry-client");
const ZeroBounceClient = require("../modules/api-clients/zerobounce-client");
const createCsvWriter = require("csv-writer").createObjectCsvWriter;
const path = require("path");
const fs = require("fs").promises;
const router = express.Router();

// Initialize enhanced discovery algorithm with all API keys
const apiKeys = {
  hunterIO: process.env.HUNTER_IO_API_KEY,
  neverBounce: process.env.NEVERBOUNCE_API_KEY,
  googlePlaces: process.env.GOOGLE_PLACES_API_KEY,
  // Enhanced State Registry APIs
  zeroBounce: process.env.ZEROBOUNCE_API_KEY,
  courtListener: process.env.COURTLISTENER_API_KEY,
  socrata: process.env.SOCRATA_API_KEY,
  socrataToken: process.env.SOCRATA_APP_TOKEN,
  uspto: process.env.USPTO_TSDR_API_KEY,
};

const googlePlacesClient = new GooglePlacesClient(apiKeys.googlePlaces);
const enhancedDiscovery = new EnhancedLeadDiscovery(apiKeys);
const campaignLogger = new CampaignLogger();
const campaignCSVExporter = new CampaignCSVExporter();

// Lazy initialization of enhanced API clients to avoid startup delays
let enhancedStateRegistry = null;
let zeroBounceClient = null;

function getEnhancedStateRegistry() {
  if (!enhancedStateRegistry) {
    enhancedStateRegistry = new EnhancedStateRegistryClient();
  }
  return enhancedStateRegistry;
}

function getZeroBounceClient() {
  if (!zeroBounceClient) {
    zeroBounceClient = new ZeroBounceClient(apiKeys.zeroBounce);
  }
  return zeroBounceClient;
}

// POST /api/business/discover
router.post("/discover", async (req, res) => {
  try {
    const {
      query,
      location,
      count = 20,
      budgetLimit = 25.0,
      qualityThreshold = 75,
      batchType = "cost-optimized",
      exportToCsv = false,
      campaignId = null, // Optional campaign ID for multi-query campaigns
    } = req.body;

    // Validate required parameters
    if (!query || !location) {
      return res.status(400).json({
        error: "Query and location are required",
        provided: { query, location },
      });
    }

    // Validate API keys for enhanced features
    const missingKeys = [];
    if (!apiKeys.googlePlaces) missingKeys.push("GOOGLE_PLACES_API_KEY");
    if (!apiKeys.hunterIO) missingKeys.push("HUNTER_IO_API_KEY (recommended)");
    if (!apiKeys.neverBounce)
      missingKeys.push("NEVERBOUNCE_API_KEY (recommended)");

    if (!apiKeys.googlePlaces) {
      return res.status(500).json({
        error: "Google Places API key is required",
        missingKeys,
      });
    }

    console.log(`🚀 Enhanced business discovery: "${query}" in "${location}"`);
    console.log(
      `💰 Budget: $${budgetLimit}, Quality threshold: ${qualityThreshold}%, Count: ${count}`
    );

    const startTime = Date.now();

    // Initialize or use existing campaign for CSV export
    let currentCampaignId = campaignId;
    if (exportToCsv && !currentCampaignId) {
      currentCampaignId = campaignCSVExporter.initializeCampaign(null, {
        initialQuery: query,
        initialLocation: location,
        budgetLimit,
        qualityThreshold,
        requestedCount: count,
      });
    }

    // Stage 1: Google Places Discovery (Primary Source)
    const googleResults = await googlePlacesClient.textSearch({
      query: `${query} in ${location}`,
      type: "establishment",
    });

    if (!googleResults || googleResults.length === 0) {
      return res.json({
        success: false,
        message: "No businesses found for the specified query and location",
        results: [],
        totalCost: 0,
        processingTime: Date.now() - startTime,
        campaignId: currentCampaignId,
      });
    }

    console.log(
      `🔍 Found ${googleResults.length} businesses from Google Places`
    );

    // Stage 2-4: Enhanced Multi-Source Validation Pipeline
    const discoveryOptions = {
      budgetLimit,
      qualityThreshold,
      maxResults: count,
      prioritizeLocalBusinesses: true,
      enablePropertyIntelligence: true,
      enableRegistryValidation: true,
    };

    const enhancedResults = await enhancedDiscovery.discoverAndValidateLeads(
      googleResults,
      discoveryOptions
    );

    // Stage 5: Enhanced State Registry & Email Validation
    console.log(
      `🏛️ Starting enhanced validation for ${enhancedResults.leads.length} leads`
    );

    const enhancedValidationResults = {
      stateRegistryChecks: 0,
      stateRegistryMatches: 0,
      emailValidations: 0,
      emailDeliverable: 0,
      totalEnhancedCost: 0,
      confidenceImprovements: 0,
    };

    // Process leads with enhanced validation
    for (let i = 0; i < enhancedResults.leads.length; i++) {
      const lead = enhancedResults.leads[i];

      try {
        // Enhanced State Registry Validation
        if (lead.name && lead.address) {
          const stateValidation =
            await getEnhancedStateRegistry().searchBusinessAcrossStates(
              lead.name,
              lead.address,
              lead.state || location
            );

          enhancedValidationResults.stateRegistryChecks++;
          if (stateValidation.confidenceScore > 50) {
            enhancedValidationResults.stateRegistryMatches++;
            // Boost confidence for registry-validated businesses
            if (lead.confidenceScore) {
              lead.confidenceScore = Math.min(100, lead.confidenceScore + 15);
              enhancedValidationResults.confidenceImprovements++;
            }
            // Add state registry validation details
            lead.stateRegistryValidation = {
              isValidated: true,
              confidenceScore: stateValidation.confidenceScore,
              sourcesChecked:
                stateValidation.qualityMetrics?.totalAPIsQueried || 7,
              registrationDetails: stateValidation.registrationDetails,
            };
          }
        }

        // ZeroBounce Email Validation (if budget allows)
        if (
          lead.email &&
          enhancedValidationResults.totalEnhancedCost < budgetLimit * 0.1
        ) {
          try {
            const emailValidation = await getZeroBounceClient().validateEmail(
              lead.email
            );
            enhancedValidationResults.emailValidations++;
            enhancedValidationResults.totalEnhancedCost +=
              emailValidation.cost || 0.007;

            if (emailValidation.isValid && emailValidation.confidence > 80) {
              enhancedValidationResults.emailDeliverable++;
              // Boost confidence for validated emails
              if (lead.confidenceScore) {
                lead.confidenceScore = Math.min(100, lead.confidenceScore + 10);
                enhancedValidationResults.confidenceImprovements++;
              }
            }

            // Add email validation details
            lead.emailValidation = {
              status: emailValidation.status,
              isValid: emailValidation.isValid,
              confidence: emailValidation.confidence,
              deliverable: emailValidation.status === "valid",
            };
          } catch (emailError) {
            console.log(
              `⚠️ Email validation failed for ${lead.email}: ${emailError.message}`
            );
          }
        }
      } catch (validationError) {
        console.log(
          `⚠️ Enhanced validation failed for ${lead.name}: ${validationError.message}`
        );
      }
    }

    console.log(
      `✅ Enhanced validation complete: ${enhancedValidationResults.stateRegistryMatches}/${enhancedValidationResults.stateRegistryChecks} registry matches, ${enhancedValidationResults.emailDeliverable}/${enhancedValidationResults.emailValidations} emails validated`
    );

    // Update total cost to include enhanced validations
    enhancedResults.totalCost += enhancedValidationResults.totalEnhancedCost;

    // Log campaign results
    await campaignLogger.logCampaignResults({
      query,
      location,
      totalBusinesses: googleResults.length,
      qualifiedLeads: enhancedResults.leads.length,
      totalCost: enhancedResults.totalCost,
      qualityMetrics: enhancedResults.qualityMetrics,
      usageStats: enhancedResults.usageStats,
      processingTime: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    });

    // Enhanced CSV Export functionality with campaign tracking
    let csvExportResult = null;
    if (exportToCsv && enhancedResults.leads.length > 0) {
      try {
        // Add query results to campaign
        const queryId = campaignCSVExporter.addQueryResults(
          query,
          location,
          enhancedResults.leads,
          {
            totalProcessed: enhancedResults.totalProcessed,
            qualificationRate: Math.round(
              (enhancedResults.leads.length / enhancedResults.totalProcessed) *
                100
            ),
            averageConfidence: enhancedResults.qualityMetrics.averageConfidence,
            processingTime: Date.now() - startTime,
            totalCost: enhancedResults.totalCost,
            qualityBreakdown: enhancedResults.qualityMetrics,
            apiUsage: enhancedResults.usageStats,
            budgetLimit,
            qualityThreshold,
            requestedCount: count,
          }
        );

        // Export campaign to comprehensive CSV
        csvExportResult = await campaignCSVExporter.exportCampaignToCsv();

        console.log(
          `📊 Enhanced CSV Export: ${csvExportResult.filename} created with ${enhancedResults.leads.length} leads from query "${query}"`
        );
        console.log(
          `🆔 Campaign ID: ${currentCampaignId}, Query ID: ${queryId}`
        );
      } catch (csvError) {
        console.error("❌ Enhanced CSV Export failed:", csvError.message);

        // Fallback to legacy CSV export
        try {
          csvExportResult = await exportResultsToCsv(enhancedResults.leads, {
            query,
            location,
            totalProcessed: enhancedResults.totalProcessed,
            qualificationRate: Math.round(
              (enhancedResults.leads.length / enhancedResults.totalProcessed) *
                100
            ),
            averageConfidence: enhancedResults.qualityMetrics.averageConfidence,
            processingTime: Date.now() - startTime,
            totalCost: enhancedResults.totalCost,
          });
          console.log(
            `📊 Fallback CSV Export: ${csvExportResult.filename} created`
          );
        } catch (fallbackError) {
          console.error(
            "❌ Fallback CSV Export also failed:",
            fallbackError.message
          );
        }
      }
    }

    // Return enhanced results with full transparency
    res.json({
      success: true,
      results: enhancedResults.leads,
      metadata: {
        totalProcessed: enhancedResults.totalProcessed,
        totalQualified: enhancedResults.leads.length,
        qualificationRate: Math.round(
          (enhancedResults.leads.length / enhancedResults.totalProcessed) * 100
        ),
        averageConfidence: enhancedResults.qualityMetrics.averageConfidence,
        totalCost: enhancedResults.totalCost,
        costPerLead:
          enhancedResults.leads.length > 0
            ? (
                enhancedResults.totalCost / enhancedResults.leads.length
              ).toFixed(3)
            : 0,
        processingTime: Date.now() - startTime,
        budgetUtilization: Math.round(
          (enhancedResults.totalCost / budgetLimit) * 100
        ),
      },
      qualityBreakdown: enhancedResults.qualityMetrics,
      apiUsage: enhancedResults.usageStats,
      dataEnhancements: {
        businessRegistrationChecks:
          enhancedResults.qualityMetrics.registrationVerified || 0,
        websiteValidations:
          enhancedResults.qualityMetrics.websitesAccessible || 0,
        emailVerifications: enhancedResults.qualityMetrics.emailsVerified || 0,
        propertyIntelligence:
          enhancedResults.qualityMetrics.propertiesFound || 0,
        // New Enhanced State Registry & ZeroBounce Validations
        stateRegistryValidations: {
          totalChecked: enhancedValidationResults.stateRegistryChecks,
          validatedBusinesses: enhancedValidationResults.stateRegistryMatches,
          validationRate:
            enhancedValidationResults.stateRegistryChecks > 0
              ? Math.round(
                  (enhancedValidationResults.stateRegistryMatches /
                    enhancedValidationResults.stateRegistryChecks) *
                    100
                )
              : 0,
        },
        advancedEmailValidations: {
          totalValidated: enhancedValidationResults.emailValidations,
          deliverableEmails: enhancedValidationResults.emailDeliverable,
          deliverabilityRate:
            enhancedValidationResults.emailValidations > 0
              ? Math.round(
                  (enhancedValidationResults.emailDeliverable /
                    enhancedValidationResults.emailValidations) *
                    100
                )
              : 0,
        },
        qualityImprovements: {
          leadsEnhanced: enhancedValidationResults.confidenceImprovements,
          enhancedValidationCost:
            enhancedValidationResults.totalEnhancedCost.toFixed(3),
          governmentAPIsSources: 7,
          totalFreeAPIsUsed: enhancedValidationResults.stateRegistryChecks,
        },
      },
      csvExport: csvExportResult
        ? {
            filename: csvExportResult.filename,
            filepath: csvExportResult.filepath,
            leadCount: csvExportResult.leadCount,
            queryCount: csvExportResult.queryCount || 1,
            campaignId: csvExportResult.campaignId || currentCampaignId,
            summaryFiles: csvExportResult.summaryFiles,
            downloadUrl: `/api/business/download-csv/${encodeURIComponent(
              csvExportResult.filename
            )}`,
            analysisUrl: csvExportResult.summaryFiles
              ? `/api/business/download-csv/${encodeURIComponent(
                  csvExportResult.summaryFiles.analysis
                )}`
              : null,
            summaryUrl: csvExportResult.summaryFiles
              ? `/api/business/download-csv/${encodeURIComponent(
                  csvExportResult.summaryFiles.summary
                )}`
              : null,
          }
        : null,
      campaignTracking: currentCampaignId
        ? {
            campaignId: currentCampaignId,
            canAddMoreQueries: true,
            addQueryEndpoint: "/api/business/campaign/add-query",
            exportCampaignEndpoint: "/api/business/campaign/export",
          }
        : null,
    });
  } catch (error) {
    console.error("❌ Enhanced business discovery failed:", error);

    res.status(500).json({
      success: false,
      error: error.message,
      recommendations: [
        "Check API key configuration",
        "Verify budget limits and thresholds",
        "Ensure network connectivity to external APIs",
        "Review query format and location specificity",
      ],
    });
  }
});
// Removed stray unreachable block with top-level await and undefined symbols (preValidationScorer, ownerDiscovery, etc.)

// POST /api/business/campaign/start - Start a new multi-query campaign
router.post("/campaign/start", async (req, res) => {
  try {
    const { campaignName, description, targetQueries = [] } = req.body;

    const campaignId = campaignCSVExporter.initializeCampaign(null, {
      campaignName: campaignName || "Unnamed Campaign",
      description: description || "",
      targetQueries,
      startedBy: "API",
      startTime: new Date().toISOString(),
    });

    console.log(`🆔 New campaign started: ${campaignId}`);

    res.json({
      success: true,
      campaignId,
      message: "Campaign initialized successfully",
      nextSteps: {
        addQuery: "/api/business/campaign/add-query",
        exportCampaign: "/api/business/campaign/export",
        campaignStatus: "/api/business/campaign/status",
      },
    });
  } catch (error) {
    console.error("❌ Failed to start campaign:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// POST /api/business/campaign/add-query - Add query to existing campaign
router.post("/campaign/add-query", async (req, res) => {
  try {
    const {
      campaignId,
      query,
      location,
      count = 20,
      budgetLimit = 25.0,
      qualityThreshold = 75,
    } = req.body;

    if (!campaignId || !query || !location) {
      return res.status(400).json({
        error: "campaignId, query, and location are required",
        provided: { campaignId, query, location },
      });
    }

    // Set the campaign ID for the CSV exporter
    if (campaignCSVExporter.campaignData.campaignId !== campaignId) {
      return res.status(400).json({
        error: "Campaign ID not found or expired",
        message: "Please start a new campaign or use the correct campaign ID",
      });
    }

    console.log(
      `📊 Adding query to campaign ${campaignId}: "${query}" in "${location}"`
    );

    const startTime = Date.now();

    // Use the existing discovery logic
    const googleResults = await googlePlacesClient.textSearch({
      query: `${query} in ${location}`,
      type: "establishment",
    });

    if (!googleResults || googleResults.length === 0) {
      return res.json({
        success: false,
        message: "No businesses found for the specified query and location",
        results: [],
        totalCost: 0,
        processingTime: Date.now() - startTime,
        campaignId,
      });
    }

    const discoveryOptions = {
      budgetLimit,
      qualityThreshold,
      maxResults: count,
      prioritizeLocalBusinesses: true,
      enablePropertyIntelligence: true,
      enableRegistryValidation: true,
    };

    const enhancedResults = await enhancedDiscovery.discoverAndValidateLeads(
      googleResults,
      discoveryOptions
    );

    // Add results to campaign
    const queryId = campaignCSVExporter.addQueryResults(
      query,
      location,
      enhancedResults.leads,
      {
        totalProcessed: enhancedResults.totalProcessed,
        qualificationRate: Math.round(
          (enhancedResults.leads.length / enhancedResults.totalProcessed) * 100
        ),
        averageConfidence: enhancedResults.qualityMetrics.averageConfidence,
        processingTime: Date.now() - startTime,
        totalCost: enhancedResults.totalCost,
        qualityBreakdown: enhancedResults.qualityMetrics,
        apiUsage: enhancedResults.usageStats,
        budgetLimit,
        qualityThreshold,
        requestedCount: count,
      }
    );

    console.log(
      `✅ Query added to campaign: ${queryId} with ${enhancedResults.leads.length} leads`
    );

    res.json({
      success: true,
      campaignId,
      queryId,
      results: enhancedResults.leads,
      queryMetadata: {
        query,
        location,
        leadCount: enhancedResults.leads.length,
        qualificationRate: Math.round(
          (enhancedResults.leads.length / enhancedResults.totalProcessed) * 100
        ),
        averageConfidence: enhancedResults.qualityMetrics.averageConfidence,
        processingTime: Date.now() - startTime,
        totalCost: enhancedResults.totalCost,
      },
      campaignSummary: {
        totalQueries: campaignCSVExporter.campaignData.queries.length,
        totalLeads: campaignCSVExporter.campaignData.totalLeads.length,
        totalCost: campaignCSVExporter.campaignData.analysisData.totalCost,
        averageConfidence:
          campaignCSVExporter.campaignData.analysisData.averageConfidence,
      },
    });
  } catch (error) {
    console.error("❌ Failed to add query to campaign:", error);
    res.status(500).json({
      success: false,
      error: error.message,
      campaignId: req.body.campaignId,
    });
  }
});

// GET /api/business/campaign/status/:campaignId - Get campaign status
router.get("/campaign/status/:campaignId", async (req, res) => {
  try {
    const { campaignId } = req.params;

    if (campaignCSVExporter.campaignData.campaignId !== campaignId) {
      return res.status(404).json({
        success: false,
        error: "Campaign not found or expired",
      });
    }

    const campaignData = campaignCSVExporter.campaignData;

    res.json({
      success: true,
      campaign: {
        campaignId: campaignData.campaignId,
        startTime: campaignData.startTime,
        totalQueries: campaignData.queries.length,
        totalLeads: campaignData.totalLeads.length,
        metadata: campaignData.metadata,
        analysisData: campaignData.analysisData,
      },
      queries: campaignData.queries.map((q) => ({
        queryId: q.queryId,
        query: q.query,
        location: q.location,
        leadCount: q.leadCount,
        timestamp: q.timestamp,
        cost: q.cost,
        processingTime: q.processingTime,
      })),
    });
  } catch (error) {
    console.error("❌ Failed to get campaign status:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// POST /api/business/campaign/export - Export complete campaign to CSV
router.post("/campaign/export", async (req, res) => {
  try {
    const { campaignId } = req.body;

    if (!campaignId) {
      return res.status(400).json({
        error: "campaignId is required",
      });
    }

    if (campaignCSVExporter.campaignData.campaignId !== campaignId) {
      return res.status(404).json({
        success: false,
        error: "Campaign not found or expired",
      });
    }

    if (campaignCSVExporter.campaignData.totalLeads.length === 0) {
      return res.status(400).json({
        success: false,
        error: "No leads to export - add queries to the campaign first",
      });
    }

    console.log(`📊 Exporting campaign: ${campaignId}`);

    const exportResult = await campaignCSVExporter.exportCampaignToCsv();

    console.log(
      `✅ Campaign export complete: ${exportResult.filename} with ${exportResult.leadCount} leads across ${exportResult.queryCount} queries`
    );

    res.json({
      success: true,
      export: {
        ...exportResult,
        downloadUrl: `/api/business/download-csv/${encodeURIComponent(
          exportResult.filename
        )}`,
        analysisUrl: exportResult.summaryFiles
          ? `/api/business/download-csv/${encodeURIComponent(
              exportResult.summaryFiles.analysis
            )}`
          : null,
        summaryUrl: exportResult.summaryFiles
          ? `/api/business/download-csv/${encodeURIComponent(
              exportResult.summaryFiles.summary
            )}`
          : null,
      },
    });
  } catch (error) {
    console.error("❌ Campaign export failed:", error);
    res.status(500).json({
      success: false,
      error: error.message,
      campaignId: req.body.campaignId,
    });
  }
});

// GET /api/business/stats - Get campaign statistics for admin dashboard
router.get("/stats", async (req, res) => {
  try {
    const stats = await campaignLogger.getCampaignStats();
    const recentCampaigns = await campaignLogger.getRecentCampaigns(5);

    // Get basic enrichment stats from the discovery module
    const enrichmentStats = {
      totalProcessed: 0,
      totalEnriched: 0,
      enrichmentRate: 0,
      averageConfidence: 0,
    };

    res.json({
      success: true,
      aggregateStats: stats,
      recentCampaigns: recentCampaigns,
      currentSessionStats: enrichmentStats,
    });
  } catch (error) {
    console.error("Failed to get campaign stats:", error);
    res.status(500).json({
      error: "Failed to retrieve statistics",
      message: error.message,
    });
  }
});

// POST /api/business/usage-report - Generate usage report for date range
router.post("/usage-report", async (req, res) => {
  try {
    const { startDate, endDate } = req.body;

    if (!startDate || !endDate) {
      return res.status(400).json({
        error: "startDate and endDate are required",
      });
    }

    const report = await campaignLogger.getUsageReport(startDate, endDate);

    res.json({
      success: true,
      report: report,
    });
  } catch (error) {
    console.error("Failed to generate usage report:", error);
    res.status(500).json({
      error: "Failed to generate usage report",
      message: error.message,
    });
  }
});

// Helper function to calculate quality distribution
function calculateQualityDistribution(businesses) {
  if (!businesses) return { A: 0, B: 0, C: 0, D: 0, F: 0 };

  const distribution = { A: 0, B: 0, C: 0, D: 0, F: 0 };
  businesses.forEach((b) => {
    const grade = b.qualityGrade || "F";
    if (distribution[grade] !== undefined) {
      distribution[grade]++;
    }
  });

  return distribution;
}

function mergeBusinessSources(googleResults, yellowPagesResults) {
  const merged = [...googleResults];

  // Create a more sophisticated deduplication key using name + address
  const getBusinessKey = (business) => {
    const name = business.name?.toLowerCase().trim() || "";
    const address = business.address?.toLowerCase().trim() || "";
    // Use first part of address to handle slight variations
    const addressKey = address.split(",")[0] || address;
    return `${name}|${addressKey}`;
  };

  const googleKeys = new Set(googleResults.map((b) => getBusinessKey(b)));

  // Add Yellow Pages results that aren't already in Google results
  yellowPagesResults.forEach((business) => {
    const businessKey = getBusinessKey(business);
    if (!googleKeys.has(businessKey)) {
      merged.push(business);
    }
  });

  return merged;
}

function deduplicateBusinesses(businesses) {
  const seen = new Map();
  const deduplicated = [];

  businesses.forEach((business) => {
    const name = business.name?.toLowerCase().trim() || "";
    const address = business.address?.toLowerCase().trim() || "";
    const phone = business.phone?.replace(/\D/g, "") || ""; // Remove non-digits

    // Create multiple possible keys for deduplication
    const keys = [
      `${name}|${address.split(",")[0]}`, // name + street address
      phone ? `${name}|${phone}` : null, // name + phone
      business.placeId ? `place_${business.placeId}` : null, // Google Places ID
    ].filter(Boolean);

    let isDuplicate = false;
    for (const key of keys) {
      if (seen.has(key)) {
        isDuplicate = true;
        break;
      }
    }

    if (!isDuplicate) {
      // Mark all keys as seen
      keys.forEach((key) => seen.set(key, true));
      deduplicated.push(business);
    }
  });

  return deduplicated;
}

// CSV Export Function
async function exportResultsToCsv(leads, metadata) {
  // Ensure exports directory exists
  const exportsDir = path.join(__dirname, "../exports");
  try {
    await fs.mkdir(exportsDir, { recursive: true });
  } catch (error) {
    console.error("Error creating exports directory:", error);
  }

  // Create timestamp for unique filename
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const sanitizedQuery = metadata.query.replace(/[^a-zA-Z0-9]/g, "-");
  const filename = `ProspectPro-${sanitizedQuery}-${timestamp}.csv`;
  const filepath = path.join(exportsDir, filename);

  // Define CSV structure for enhanced company vs owner contact differentiation
  const csvWriter = createCsvWriter({
    path: filepath,
    header: [
      { id: "name", title: "Business Name" },
      { id: "address", title: "Address" },
      { id: "companyPhone", title: "Company Phone" },
      { id: "companyPhoneSource", title: "Company Phone Source" },
      { id: "ownerPhone", title: "Owner Phone" },
      { id: "ownerPhoneSource", title: "Owner Phone Source" },
      { id: "website", title: "Website" },
      { id: "websiteSource", title: "Website Source" },
      { id: "companyEmail", title: "Company Email" },
      { id: "companyEmailSource", title: "Company Email Source" },
      { id: "companyEmailConfidence", title: "Company Email Confidence" },
      { id: "ownerEmail", title: "Owner Email" },
      { id: "ownerEmailSource", title: "Owner Email Source" },
      { id: "ownerEmailConfidence", title: "Owner Email Confidence" },
      { id: "ownerName", title: "Owner Name" },
      { id: "ownerTitle", title: "Owner Title" },
      { id: "confidenceScore", title: "Confidence Score" },
      { id: "category", title: "Category" },
      { id: "rating", title: "Rating" },
      { id: "reviewCount", title: "Review Count" },
      { id: "priceLevel", title: "Price Level" },
      { id: "hours", title: "Hours" },
      { id: "dataSource", title: "Data Sources" },
      { id: "placeId", title: "Google Place ID" },
    ],
  });

  // Map leads to CSV format with enhanced company vs owner contact differentiation
  const csvData = leads.map((lead) => ({
    name: lead.name || "",
    address: lead.address || "",
    companyPhone: lead.companyPhone || lead.phone || "",
    companyPhoneSource:
      lead.companyPhoneSource || lead.phoneSource || "Google Places",
    ownerPhone: lead.ownerPhone || "",
    ownerPhoneSource: lead.ownerPhoneSource || "",
    website: lead.website || "",
    websiteSource: lead.websiteSource || "Google Places",
    companyEmail: lead.companyEmail || lead.email || "",
    companyEmailSource: lead.companyEmailSource || lead.emailSource || "",
    companyEmailConfidence: lead.companyEmailConfidence || "",
    ownerEmail: lead.ownerEmail || "",
    ownerEmailSource: lead.ownerEmailSource || "",
    ownerEmailConfidence: lead.ownerEmailConfidence || "",
    ownerName: lead.ownerName || "",
    ownerTitle: lead.ownerTitle || "",
    confidenceScore: lead.finalConfidenceScore || lead.confidenceScore || "",
    category: lead.category || "",
    rating: lead.rating || "",
    reviewCount: lead.reviewCount || "",
    priceLevel: lead.priceLevel || "",
    hours: lead.hours
      ? typeof lead.hours === "object"
        ? JSON.stringify(lead.hours)
        : lead.hours
      : "",
    dataSource: [
      "Google Places",
      lead.foursquareData?.found ? "Foursquare" : "",
      lead.emailDiscovery?.emails?.length > 0 ? "Hunter.io" : "",
      lead.emailValidation?.results?.length > 0 ? "NeverBounce" : "",
    ]
      .filter(Boolean)
      .join(", "),
    placeId: lead.placeId || "",
  }));

  // Write CSV file
  await csvWriter.writeRecords(csvData);

  // Write metadata file
  const metadataFilename = `ProspectPro-${sanitizedQuery}-${timestamp}-metadata.json`;
  const metadataPath = path.join(exportsDir, metadataFilename);
  await fs.writeFile(
    metadataPath,
    JSON.stringify(
      {
        ...metadata,
        exportDate: new Date().toISOString(),
        leadCount: leads.length,
      },
      null,
      2
    )
  );

  console.log(
    `✅ CSV Export complete: ${leads.length} leads exported to ${filename}`
  );

  return {
    filename: filename,
    filepath: filepath,
    leadCount: leads.length,
    metadataFile: metadataFilename,
  };
}

// Download CSV endpoint
router.get("/download-csv/:filename", async (req, res) => {
  try {
    const { filename } = req.params;
    const filepath = path.join(__dirname, "../exports", filename);

    // Check if file exists
    try {
      await fs.access(filepath);
    } catch (error) {
      return res.status(404).json({
        error: "File not found",
        message: "The requested CSV file does not exist or has expired.",
      });
    }

    // Send file with proper headers
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    const fileStream = require("fs").createReadStream(filepath);
    fileStream.pipe(res);
  } catch (error) {
    console.error("Error downloading CSV:", error);
    res.status(500).json({
      error: "Download failed",
      message: error.message,
    });
  }
});

module.exports = router;
