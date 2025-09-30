const express = require("express");
const EnhancedDiscoveryEngine = require("../modules/core/core-business-discovery-engine");
const EnhancedQualityScorer = require("../modules/validators/enhanced-quality-scorer");
const CampaignLogger = require("../modules/logging/logging-campaign-manager");
const path = require("path");
const fs = require("fs").promises;
const router = express.Router();

// Load Environment with Vault API Keys
const EnvironmentLoader = require("../config/environment-loader");
const envLoader = new EnvironmentLoader();

// Initialize API keys (will be loaded async from vault)
let apiKeysCache = null;
let lastApiKeyLoad = null;
const API_KEY_CACHE_TTL = 300000; // 5 minutes

/**
 * Get API keys with caching and vault integration
 * @returns {Promise<Object>} API keys object
 */
async function getApiKeys() {
  const now = Date.now();

  // Return cached keys if still valid
  if (
    apiKeysCache &&
    lastApiKeyLoad &&
    now - lastApiKeyLoad < API_KEY_CACHE_TTL
  ) {
    return apiKeysCache;
  }

  try {
    console.log("🔑 Refreshing API keys from Supabase Vault...");
    apiKeysCache = await envLoader.getApiKeys();
    lastApiKeyLoad = now;

    const keyCount = Object.values(apiKeysCache).filter(
      (key) => key && key !== "your_api_key_here" && !key.includes("your_")
    ).length;

    console.log(
      `🔑 API keys refreshed: ${keyCount}/${
        Object.keys(apiKeysCache).length
      } available`
    );
    return apiKeysCache;
  } catch (error) {
    console.error("❌ Failed to load API keys from vault:", error.message);

    // Fallback to environment variables
    console.log("🔄 Falling back to environment variables");
    apiKeysCache = {
      hunterIO: process.env.HUNTER_IO_API_KEY,
      apollo: process.env.APOLLO_API_KEY,
      neverBounce: process.env.NEVERBOUNCE_API_KEY,
      googlePlaces: process.env.GOOGLE_PLACES_API_KEY,
      foursquare:
        process.env.FOURSQUARE_SERVICE_API_KEY ||
        process.env.FOURSQUARE_PLACES_API_KEY,
      zeroBounce: process.env.ZEROBOUNCE_API_KEY,
      courtListener: process.env.COURTLISTENER_API_KEY,
      socrata: process.env.SOCRATA_API_KEY,
      socrataToken: process.env.SOCRATA_APP_TOKEN,
      uspto: process.env.USPTO_TSDR_API_KEY,
      californiaSOSApiKey: process.env.CALIFORNIA_SOS_API_KEY,
      scrapingdog: process.env.SCRAPINGDOG_API_KEY,
    };

    lastApiKeyLoad = now;
    return apiKeysCache;
  }
}

// Enhanced business discovery endpoint with v2.0 quality-focused engine
router.post("/discover-businesses", async (req, res) => {
  const startTime = Date.now();
  const campaignId = `campaign_${Date.now()}_${Math.random()
    .toString(36)
    .substr(2, 9)}`;

  // Initialize campaign logger at function level for error handling
  const campaignLogger = new CampaignLogger();

  try {
    // Load fresh API keys from vault
    const apiKeys = await getApiKeys();

    // Initialize Enhanced Discovery Engine v2.0 with vault API keys
    const discoveryEngine = new EnhancedDiscoveryEngine(apiKeys);

    const {
      businessType,
      location,
      maxResults = 10,
      budgetLimit = 50,
      requireCompleteContacts = false, // More lenient default
      minConfidenceScore = 50, // Lower threshold for better results
      additionalQueries = [],
    } = req.body;

    // Validate required parameters
    if (!businessType || !location) {
      return res.status(400).json({
        success: false,
        error: "Business type and location are required",
      });
    }

    // Check for critical API keys
    if (!apiKeys.foursquare && !apiKeys.googlePlaces) {
      return res.status(500).json({
        success: false,
        error:
          "Critical API keys missing: Foursquare or Google Places required for business discovery",
        details:
          "Configure API keys in Supabase Vault or environment variables",
      });
    }

    console.log(
      `🚀 Starting Enhanced Discovery v2.0 - Campaign: ${campaignId}`
    );
    console.log(`📊 Requirements: ${maxResults} qualified leads`);
    console.log(`💰 Budget limit: $${budgetLimit}`);
    console.log(`✅ Complete contacts required: ${requireCompleteContacts}`);
    console.log(`🎯 Minimum confidence: ${minConfidenceScore}%`);

    // Use Enhanced Discovery Engine v2.0 for iterative quality-focused discovery
    const discoveryResult = await discoveryEngine.discoverQualifiedLeads({
      businessType,
      location,
      targetCount: maxResults,
      budgetLimit,
      requireCompleteContacts,
      minConfidenceScore,
      additionalQueries,
    });

    // Apply Enhanced Quality Scoring v3.0 with cost optimization
    const qualityScorer = new EnhancedQualityScorer({
      maxCostPerBusiness: budgetLimit / maxResults || 2.0,
    });

    // Score all discovered businesses with optimized algorithm
    if (discoveryResult && discoveryResult.leads) {
      console.log(
        `🎯 Applying Enhanced Quality Scoring v3.0 to ${discoveryResult.leads.length} businesses`
      );

      for (let i = 0; i < discoveryResult.leads.length; i++) {
        const business = discoveryResult.leads[i];
        const scoringResult = await qualityScorer.calculateOptimizedScore(
          business
        );

        // Update business with enhanced scoring
        discoveryResult.leads[i] = {
          ...business,
          optimizedScore: scoringResult.score,
          scoreBreakdown: scoringResult.breakdown,
          costEfficient: scoringResult.costEfficient,
          validationCost: scoringResult.totalCost,
          scoringRecommendation: scoringResult.recommendation,
        };
      }

      // Apply dynamic threshold optimization
      const thresholdAnalysis = qualityScorer.calculateOptimalThreshold(
        discoveryResult.leads,
        35 // Target 35% qualification rate for balanced approach
      );

      const optimalThreshold = thresholdAnalysis.suggested;
      console.log(
        `📊 Dynamic threshold optimization: ${optimalThreshold}% (target: 35% qualification rate)`
      );

      // Filter with optimized threshold
      const qualifiedLeads = discoveryResult.leads.filter(
        (lead) => lead.optimizedScore >= optimalThreshold
      );

      // Update discovery result with enhanced scoring metrics
      discoveryResult.leads = qualifiedLeads;
      discoveryResult.qualityMetrics = {
        originalCount: discoveryResult.totalFound || 0,
        processedCount: discoveryResult.leads.length || 0,
        qualifiedCount: qualifiedLeads.length,
        qualificationRate:
          discoveryResult.leads.length > 0
            ? Math.round(
                (qualifiedLeads.length / (discoveryResult.totalFound || 1)) *
                  100
              )
            : 0,
        averageScore: Math.round(
          discoveryResult.leads.reduce(
            (sum, lead) => sum + (lead.optimizedScore || 0),
            0
          ) / Math.max(1, discoveryResult.leads.length)
        ),
        optimalThreshold,
        thresholdAnalysis: thresholdAnalysis.analysis,
        costEfficiency: qualityScorer.getPerformanceSummary(),
      };

      console.log(`✅ Enhanced Quality Scoring complete:`);
      console.log(
        `   📊 Qualified: ${qualifiedLeads.length}/${
          discoveryResult.totalFound || 0
        } (${discoveryResult.qualityMetrics.qualificationRate}%)`
      );
      console.log(
        `   💰 Avg Score: ${discoveryResult.qualityMetrics.averageScore}% | Threshold: ${optimalThreshold}%`
      );
      console.log(
        `   🎯 Cost Savings: $${qualityScorer
          .getPerformanceSummary()
          .totalCostSavings.toFixed(2)}`
      );
    }

    const processingTime = Date.now() - startTime;

    // Enhanced response with comprehensive metrics
    const response = {
      success: true,
      campaignId,
      discoveryEngine: "Enhanced Discovery Engine v2.0 + Quality Scorer v3.0",
      requirements: {
        targetLeads: maxResults,
        budgetLimit,
        requireCompleteContacts,
        minConfidenceScore,
      },
      results: {
        totalFound: discoveryResult?.totalFound || 0,
        qualified: discoveryResult?.leads?.length || 0,
        qualificationRate: `${(
          ((discoveryResult?.leads?.length || 0) /
            (discoveryResult?.totalFound || 1)) *
          100
        ).toFixed(1)}%`,
        averageConfidence: discoveryResult?.averageConfidence || 0,
        completeness: discoveryResult?.completeness || 0,
      },
      qualityMetrics: discoveryResult?.qualityMetrics || {
        processedCount: 0,
        qualificationRate: 0,
        averageScore: 0,
        optimalThreshold: minConfidenceScore,
        note: "Enhanced Quality Scoring not applied - no businesses processed",
      },
      costs: {
        totalCost: discoveryResult?.totalCost || 0,
        costPerLead: discoveryResult?.costPerLead || 0,
        costBreakdown: discoveryResult?.costBreakdown || {},
        validationCosts:
          discoveryResult?.qualityMetrics?.costEfficiency
            ?.averageCostPerBusiness || 0,
        costSavings:
          discoveryResult?.qualityMetrics?.costEfficiency
            ?.costSavingsVsTraditional || 0,
      },
      performance: {
        processingTime: `${(processingTime / 1000).toFixed(1)}s`,
        avgTimePerLead: `${(
          processingTime /
          1000 /
          (discoveryResult?.leads?.length || 1)
        ).toFixed(1)}s`,
        iterationsCompleted: discoveryResult?.iterationsCompleted || 0,
      },
      leads: (discoveryResult?.leads || []).map((lead) => ({
        businessName: lead.businessName,
        address: lead.address,
        phone: lead.phone,
        website: lead.website,
        email: lead.email,
        confidenceScore: lead.confidenceScore,
        optimizedScore: lead.optimizedScore,
        preValidationScore: lead.preValidationScore,
        scoreBreakdown: lead.scoreBreakdown,
        validationCost: lead.validationCost,
        costEfficient: lead.costEfficient,
        scoringRecommendation: lead.scoringRecommendation,
        dataCompleteness: lead.dataCompleteness,
        sources: lead.sources,
        enrichmentData: lead.enrichmentData,
        validationResults: lead.validationResults,
      })),
      metadata: {
        timestamp: new Date().toISOString(),
        version: "Enhanced Discovery Engine v2.0",
        searchQueries: discoveryResult.searchQueries,
        duplicatesRemoved: discoveryResult.duplicatesRemoved,
        qualityFiltering: discoveryResult.qualityFiltering,
      },
    };

    // Log successful campaign completion using available method
    const finalCampaignData = {
      campaignId,
      businessType,
      location,
      targetCount: maxResults,
      businesses: (discoveryResult?.leads || []).map((lead) => ({
        name: lead.businessName,
        address: lead.address,
        phone: lead.phone,
        website: lead.website,
        email: lead.email,
        confidenceScore: lead.confidenceScore,
        qualityGrade:
          lead.confidenceScore >= 80
            ? "A"
            : lead.confidenceScore >= 70
            ? "B"
            : lead.confidenceScore >= 60
            ? "C"
            : "D",
      })),
      estimatedCost: discoveryResult.totalCost,
      duration: processingTime,
    };

    // Log campaign results asynchronously (don't block response)
    campaignLogger.logCampaignResults(finalCampaignData).catch((err) => {
      console.warn("Campaign logging failed:", err.message);
    });

    console.log(
      `✅ Campaign ${campaignId} completed: ${
        discoveryResult?.leads?.length || 0
      }/${maxResults} qualified leads`
    );
    console.log(
      `💰 Total cost: $${(discoveryResult?.totalCost || 0).toFixed(4)}`
    );
    console.log(`⏱️ Processing time: ${(processingTime / 1000).toFixed(1)}s`);

    // Store results for export functionality
    if (global.storeCampaignResults && discoveryResult?.leads) {
      try {
        global.storeCampaignResults(campaignId, response);
        console.log(`📊 Campaign results stored for export: ${campaignId}`);
      } catch (storeError) {
        console.warn("Failed to store campaign results:", storeError.message);
      }
    }

    res.json(response);
  } catch (error) {
    const processingTime = Date.now() - startTime;

    console.error("❌ Enhanced Discovery Error:", error.message);
    console.error("Stack trace:", error.stack);

    // Log failed campaign if ID exists
    if (campaignId) {
      const failedCampaignData = {
        campaignId,
        businessType: req.body.businessType,
        location: req.body.location,
        targetCount: req.body.maxResults || 10,
        businesses: [],
        estimatedCost: 0,
        duration: processingTime,
        error: error.message,
      };

      campaignLogger.logCampaignResults(failedCampaignData).catch((err) => {
        console.warn("Failed campaign logging failed:", err.message);
      });
    }

    res.status(500).json({
      success: false,
      error: "Enhanced discovery system failed",
      details: error.message,
      campaignId,
      processingTime: `${(processingTime / 1000).toFixed(1)}s`,
      timestamp: new Date().toISOString(),
    });
  }
});

// Legacy API endpoint for backward compatibility - redirects to new engine
router.post("/discover", async (req, res) => {
  console.log(
    "🔄 Legacy /discover endpoint called - redirecting to Enhanced Discovery Engine v2.0"
  );

  try {
    // Load fresh API keys from vault
    const apiKeys = await getApiKeys();

    // Initialize Enhanced Discovery Engine v2.0 with vault API keys
    const discoveryEngine = new EnhancedDiscoveryEngine(apiKeys);
    const campaignLogger = new CampaignLogger();

    // Map legacy parameters to new format
    const {
      query: businessType,
      location,
      count: maxResults = 10,
      budgetLimit = 50,
      qualityThreshold: minConfidenceScore = 70,
    } = req.body;

    // Validate required parameters
    if (!businessType || !location) {
      return res.status(400).json({
        success: false,
        error: "Business type (query) and location are required",
      });
    }

    // Call Enhanced Discovery Engine v2.0 with mapped parameters
    const startTime = Date.now();
    let campaignId = null;

    // Generate campaign ID for tracking
    campaignId = `campaign_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    console.log(
      `🔄 Legacy endpoint using Enhanced Discovery v2.0 - Campaign: ${campaignId}`
    );

    // Use Enhanced Discovery Engine v2.0
    const discoveryResult = await discoveryEngine.discoverQualifiedLeads({
      businessType,
      location,
      targetCount: maxResults,
      budgetLimit,
      requireCompleteContacts: false, // More lenient for legacy compatibility
      minConfidenceScore: Math.max(minConfidenceScore - 20, 30), // Lower threshold
    });

    const processingTime = Date.now() - startTime;

    // Log campaign completion using available method
    const legacyCampaignData = {
      campaignId,
      businessType,
      location,
      targetCount: maxResults,
      businesses: (discoveryResult?.leads || []).map((lead) => ({
        name: lead.businessName,
        address: lead.address,
        phone: lead.phone,
        website: lead.website,
        email: lead.email,
        confidenceScore: lead.confidenceScore,
        qualityGrade:
          lead.confidenceScore >= 80
            ? "A"
            : lead.confidenceScore >= 70
            ? "B"
            : lead.confidenceScore >= 60
            ? "C"
            : "D",
      })),
      estimatedCost: discoveryResult.totalCost,
      duration: processingTime,
    };

    campaignLogger.logCampaignResults(legacyCampaignData).catch((err) => {
      console.warn("Legacy campaign logging failed:", err.message);
    });

    // Return response in legacy format for backward compatibility
    res.json({
      success: true,
      results: (discoveryResult?.leads || []).map((lead) => ({
        name: lead.businessName,
        address: lead.address,
        phone: lead.phone,
        website: lead.website,
        email: lead.email,
        confidenceScore: lead.confidenceScore,
        category: lead.category,
        rating: lead.rating,
        reviewCount: lead.reviewCount,
        sources: lead.sources,
        enrichmentData: lead.enrichmentData,
        validationResults: lead.validationResults,
      })),
      metadata: {
        totalProcessed: discoveryResult?.totalFound || 0,
        totalQualified: discoveryResult?.leads?.length || 0,
        qualificationRate: Math.round(
          ((discoveryResult?.leads?.length || 0) /
            (discoveryResult?.totalFound || 1)) *
            100
        ),
        averageConfidence: discoveryResult?.averageConfidence || 0,
        totalCost: discoveryResult?.totalCost || 0,
        costPerLead: discoveryResult?.costPerLead || 0,
        processingTime: Date.now() - startTime,
        discoveryEngine: "Enhanced Discovery Engine v2.0 (Legacy Compatible)",
        campaignId,
      },
    });
  } catch (error) {
    console.error("❌ Legacy endpoint error:", error.message);
    res.status(500).json({
      success: false,
      error: "Enhanced discovery system failed",
      details: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// GET /api/business/stats - Get campaign statistics for admin dashboard
router.get("/stats", async (req, res) => {
  try {
    const stats = await campaignLogger.getCampaignStats();
    const recentCampaigns = await campaignLogger.getRecentCampaigns(5);

    res.json({
      success: true,
      aggregateStats: stats,
      recentCampaigns: recentCampaigns,
      discoveryEngine: "Enhanced Discovery Engine v2.0",
    });
  } catch (error) {
    console.error("Failed to get campaign stats:", error);
    res.status(500).json({
      error: "Failed to retrieve statistics",
      message: error.message,
    });
  }
});

// CSV Export endpoint for Enhanced Discovery Engine v2.0
router.post("/export-csv", async (req, res) => {
  try {
    const { campaignId } = req.body;

    if (!campaignId) {
      return res.status(400).json({
        error: "campaignId is required",
      });
    }

    console.log(`📊 Exporting campaign: ${campaignId}`);

    // Get campaign data and export to CSV using Enhanced Discovery Engine v2.0
    const exportResult = await discoveryEngine.exportCampaignToCsv(campaignId);

    console.log(
      `✅ Campaign export complete: ${exportResult.filename} with ${exportResult.leadCount} leads`
    );

    res.json({
      success: true,
      export: {
        ...exportResult,
        downloadUrl: `/api/business/download-csv/${encodeURIComponent(
          exportResult.filename
        )}`,
      },
    });
  } catch (error) {
    console.error("❌ Campaign export failed:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

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
