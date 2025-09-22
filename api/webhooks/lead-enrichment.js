/**
 * Lead Enrichment Webhook Endpoint
 * Processes database-triggered webhooks for lead enrichment automation
 * Replaces polling-based lead processing with event-driven architecture
 */

const express = require("express");
const crypto = require("crypto");
const EnhancedLeadDiscovery = require("../../modules/enhanced-lead-discovery");
const supabase = require("../../config/supabase");
const logger = require("../../modules/utils/logger");

const router = express.Router();

// Initialize Enhanced Lead Discovery with API keys
const apiKeys = {
  hunterIO: process.env.HUNTER_IO_API_KEY,
  apollo: process.env.APOLLO_API_KEY,
  neverBounce: process.env.NEVERBOUNCE_API_KEY,
  googlePlaces: process.env.GOOGLE_PLACES_API_KEY,
  foursquare:
    process.env.FOURSQUARE_SERVICE_API_KEY ||
    process.env.FOURSQUARE_PLACES_API_KEY,
  zeroBounce: process.env.ZEROBOUNCE_API_KEY,
  californiaSOS: process.env.CALIFORNIA_SOS_API_KEY,
  newYorkSOS: process.env.NEWYORK_SOS_API_KEY,
  proPublica: process.env.PROPUBLICA_API_KEY,
  uspto: process.env.USPTO_TSDR_API_KEY,
  companiesHouseUK: process.env.COMPANIES_HOUSE_UK_API_KEY,
  scrapingdog: process.env.SCRAPINGDOG_API_KEY,
};

const leadDiscovery = new EnhancedLeadDiscovery(apiKeys);

/**
 * Webhook authentication middleware
 * Validates webhook token and signature
 */
function authenticateWebhook(req, res, next) {
  const webhookToken =
    process.env.WEBHOOK_AUTH_TOKEN || process.env.PERSONAL_ACCESS_TOKEN;
  const providedToken = req.headers.authorization?.replace("Bearer ", "");

  if (!webhookToken) {
    logger.warn("🔒 Webhook authentication disabled - no token configured");
    return next();
  }

  if (!providedToken || providedToken !== webhookToken) {
    logger.warn("❌ Webhook authentication failed - invalid token");
    return res.status(401).json({
      error: "Unauthorized",
      message: "Invalid webhook authentication token",
    });
  }

  next();
}

/**
 * Request validation middleware
 * Validates webhook payload structure
 */
function validateWebhookPayload(req, res, next) {
  const { lead_id, business_name, location } = req.body;

  if (!lead_id || !business_name || !location) {
    return res.status(400).json({
      error: "Invalid payload",
      message: "Missing required fields: lead_id, business_name, location",
      required: ["lead_id", "business_name", "location"],
    });
  }

  // Validate webhook metadata
  const metadata = req.body.webhook_metadata;
  if (!metadata || !metadata.trigger_event || !metadata.trigger_time) {
    return res.status(400).json({
      error: "Invalid payload",
      message: "Missing webhook metadata",
      required: [
        "webhook_metadata.trigger_event",
        "webhook_metadata.trigger_time",
      ],
    });
  }

  next();
}

/**
 * Lead Enrichment Webhook Endpoint
 * POST /api/webhooks/lead-enrichment
 *
 * Triggered by database on enhanced_leads INSERT
 * Processes lead enrichment asynchronously
 */
router.post(
  "/lead-enrichment",
  express.json({ limit: "10mb" }),
  authenticateWebhook,
  validateWebhookPayload,
  async (req, res) => {
    const startTime = Date.now();
    const {
      lead_id,
      business_name,
      location,
      source,
      phone,
      website,
      category,
      campaign_id,
      google_place_id,
      confidence_score,
      webhook_metadata,
    } = req.body;

    logger.info(
      `🔗 Lead enrichment webhook triggered for ${business_name} (ID: ${lead_id})`
    );

    try {
      // Acknowledge webhook immediately to prevent timeouts
      res.status(200).json({
        status: "accepted",
        lead_id,
        business_name,
        message: "Lead enrichment started",
        timestamp: new Date().toISOString(),
        processing_time_ms: Date.now() - startTime,
      });

      // Process enrichment asynchronously
      processLeadEnrichmentAsync(lead_id, {
        name: business_name,
        address: location.address,
        city: location.city,
        state: location.state,
        postal_code: location.postal_code,
        country: location.country,
        phone,
        website,
        category,
        source,
        campaign_id,
        google_place_id,
        confidence_score: confidence_score || 0,
        webhook_metadata,
      });
    } catch (error) {
      logger.error(
        `❌ Lead enrichment webhook error for ${business_name}:`,
        error.message
      );

      // If response not sent yet, send error
      if (!res.headersSent) {
        res.status(500).json({
          status: "error",
          lead_id,
          business_name,
          error: error.message,
          timestamp: new Date().toISOString(),
          processing_time_ms: Date.now() - startTime,
        });
      }
    }
  }
);

/**
 * Asynchronous lead enrichment processing
 * Runs the 4-stage enrichment pipeline and updates database
 */
async function processLeadEnrichmentAsync(leadId, businessData) {
  const enrichmentStartTime = Date.now();

  try {
    logger.info(
      `⚡ Starting enrichment for lead ${leadId}: ${businessData.name}`
    );

    // Update lead status to processing
    await updateLeadStatus(leadId, "processing", {
      enrichment_started_at: new Date().toISOString(),
      processing_stage: "stage_1_discovery",
    });

    // Stage 1: Business Discovery & Pre-validation
    logger.debug(`📋 Stage 1: Pre-validation for ${businessData.name}`);
    const stage1Result = await leadDiscovery.stage1_PreValidation(businessData);

    await updateLeadStatus(leadId, "processing", {
      processing_stage: "stage_2_enrichment",
      stage_1_complete: true,
      confidence_score: stage1Result.preValidationScore || 0,
    });

    // Stage 2: Contact Enrichment
    logger.debug(`🔍 Stage 2: Contact enrichment for ${businessData.name}`);
    const stage2Result = await leadDiscovery.stage2_ContactEnrichment(
      stage1Result
    );

    await updateLeadStatus(leadId, "processing", {
      processing_stage: "stage_3_validation",
      stage_2_complete: true,
      email_discovery_count: stage2Result.emailDiscovery?.emails?.length || 0,
    });

    // Stage 3: Validation & Registry Checks
    logger.debug(`🏛️ Stage 3: Validation for ${businessData.name}`);
    const stage3Result = await leadDiscovery.stage3_Validation(stage2Result);

    await updateLeadStatus(leadId, "processing", {
      processing_stage: "stage_4_scoring",
      stage_3_complete: true,
      website_validated: stage3Result.websiteValidation?.isAccessible || false,
      registry_validated:
        stage3Result.registryValidation?.registeredInAnyState || false,
    });

    // Stage 4: Final Quality Scoring
    logger.debug(`🎯 Stage 4: Final scoring for ${businessData.name}`);
    const finalResult = await leadDiscovery.stage4_QualityScoringAndExport(
      stage3Result
    );

    // Determine final status based on qualification
    const finalStatus = finalResult.isQualified ? "qualified" : "enriched";

    // Update lead with enriched data
    await updateLeadWithEnrichmentData(leadId, finalResult, finalStatus);

    const processingTime = Date.now() - enrichmentStartTime;
    logger.info(
      `✅ Lead enrichment completed for ${businessData.name} in ${processingTime}ms - Status: ${finalStatus}`
    );
  } catch (error) {
    logger.error(
      `❌ Lead enrichment failed for lead ${leadId}:`,
      error.message
    );

    // Update lead status to error
    await updateLeadStatus(leadId, "error", {
      error_message: error.message,
      error_timestamp: new Date().toISOString(),
      processing_time_ms: Date.now() - enrichmentStartTime,
    });
  }
}

/**
 * Update lead status in database
 */
async function updateLeadStatus(leadId, status, additionalData = {}) {
  try {
    const updateData = {
      status,
      updated_at: new Date().toISOString(),
      ...additionalData,
    };

    const { error } = await supabase
      .getClient()
      .from("enhanced_leads")
      .update(updateData)
      .eq("id", leadId);

    if (error) {
      throw new Error(`Database update failed: ${error.message}`);
    }

    logger.debug(`📝 Updated lead ${leadId} status to ${status}`);
  } catch (error) {
    logger.error(`❌ Failed to update lead ${leadId} status:`, error.message);
    throw error;
  }
}

/**
 * Update lead with complete enrichment data
 */
async function updateLeadWithEnrichmentData(leadId, enrichmentResult, status) {
  try {
    const updateData = {
      status,
      updated_at: new Date().toISOString(),
      confidence_score: enrichmentResult.finalConfidenceScore || 0,
      is_qualified: enrichmentResult.isQualified || false,

      // Contact information
      email: enrichmentResult.emailValidation?.bestEmail?.email || null,
      phone: enrichmentResult.phone || null,
      website: enrichmentResult.website || null,

      // Owner information
      owner_name: enrichmentResult.ownerInformation?.name || null,
      owner_title: enrichmentResult.ownerInformation?.title || null,
      owner_email: enrichmentResult.ownerInformation?.email || null,

      // Validation results
      website_validated:
        enrichmentResult.websiteValidation?.isAccessible || false,
      email_validated:
        enrichmentResult.emailValidation?.deliverableCount > 0 || false,
      registry_validated:
        enrichmentResult.registryValidation?.registeredInAnyState || false,

      // Registry classifications
      is_nonprofit: enrichmentResult.registryValidation?.isNonprofit || false,
      is_public_company:
        enrichmentResult.registryValidation?.isPublicCompany || false,
      has_intellectual_property:
        enrichmentResult.registryValidation?.hasIntellectualProperty || false,
      is_international:
        enrichmentResult.registryValidation?.isInternational || false,

      // Processing metadata
      processing_cost: enrichmentResult.processingCost || 0,
      enrichment_completed_at: new Date().toISOString(),

      // Store full enrichment data as JSON
      enrichment_data: JSON.stringify({
        qualityScores: enrichmentResult.qualityScores,
        emailDiscovery: enrichmentResult.emailDiscovery,
        websiteValidation: enrichmentResult.websiteValidation,
        registryValidation: enrichmentResult.registryValidation,
        processingStats: enrichmentResult.processingStats,
      }),
    };

    const { error } = await supabase
      .getClient()
      .from("enhanced_leads")
      .update(updateData)
      .eq("id", leadId);

    if (error) {
      throw new Error(`Database update failed: ${error.message}`);
    }

    logger.info(`💾 Updated lead ${leadId} with complete enrichment data`);
  } catch (error) {
    logger.error(
      `❌ Failed to update lead ${leadId} enrichment data:`,
      error.message
    );
    throw error;
  }
}

/**
 * Webhook health check endpoint
 */
router.get("/lead-enrichment/health", (req, res) => {
  res.json({
    status: "healthy",
    service: "lead-enrichment-webhook",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    dependencies: {
      supabase: supabase.getClient() ? "connected" : "disconnected",
      leadDiscovery: leadDiscovery ? "initialized" : "not_initialized",
    },
  });
});

module.exports = router;
