const express = require("express");
const GooglePlacesClient = require("../modules/api-clients/google-places");
const EnhancedLeadDiscovery = require("../modules/enhanced-lead-discovery");
const CampaignLogger = require("../modules/logging/campaign-logger");
const EnhancedStateRegistryClient = require("../modules/api-clients/enhanced-state-registry-client");
const ZeroBounceClient = require("../modules/api-clients/zerobounce-client");
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

module.exports = router;
