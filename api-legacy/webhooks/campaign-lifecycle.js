const express = require("express");
const router = express.Router();
const supabase = require("../../config/supabase");

/**
 * Campaign Lifecycle Webhook Handler
 * Processes database-triggered campaign lifecycle events
 * Handles campaign creation, progress updates, completion, and error states
 */

// Middleware for webhook authentication
const authenticateWebhook = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const expectedToken =
    process.env.WEBHOOK_AUTH_TOKEN || process.env.PERSONAL_ACCESS_TOKEN;

  if (!expectedToken) {
    console.error("⚠️ WEBHOOK_AUTH_TOKEN not configured");
    return res
      .status(500)
      .json({ error: "Webhook authentication not configured" });
  }

  const providedToken = authHeader?.replace("Bearer ", "");

  if (!providedToken || providedToken !== expectedToken) {
    console.error("❌ Campaign lifecycle webhook authentication failed");
    return res.status(401).json({ error: "Unauthorized" });
  }

  next();
};

// Campaign CSV Exporter integration
let CampaignCsvExporter;
try {
  CampaignCsvExporter = require("../../modules/core/export-campaign-csv-system");
} catch (error) {
  console.warn("⚠️ CampaignCsvExporter not available:", error.message);
  CampaignCsvExporter = null;
}

// ProspectPro Metrics integration
let ProspectProMetrics;
try {
  const metricsModule = require("../../modules/monitoring/prometheus-metrics");
  ProspectProMetrics = metricsModule.ProspectProMetrics;
} catch (error) {
  console.warn("⚠️ ProspectProMetrics not available:", error.message);
  ProspectProMetrics = null;
}

/**
 * Handle campaign created webhook
 */
async function handleCampaignCreated(payload) {
  const { campaign_id, event_data, campaign_info } = payload;

  console.log(
    `📝 Campaign Created: ${campaign_info.name} (ID: ${campaign_id})`
  );

  // Record metrics
  if (ProspectProMetrics) {
    ProspectProMetrics.campaignCreated.inc({
      business_type: campaign_info.business_type || "unknown",
      location: campaign_info.location || "unknown",
    });

    ProspectProMetrics.campaignTargetCount.observe(
      { business_type: campaign_info.business_type || "unknown" },
      campaign_info.target_count || 0
    );

    if (campaign_info.budget_limit) {
      ProspectProMetrics.campaignBudgetLimit.observe(
        { business_type: campaign_info.business_type || "unknown" },
        parseFloat(campaign_info.budget_limit)
      );
    }
  }

  // Initialize campaign processing if needed
  try {
    await initiateCampaignProcessing(campaign_id, campaign_info);
  } catch (error) {
    console.error(`❌ Failed to initiate campaign processing:`, error);
    throw error;
  }

  return {
    status: "processed",
    action: "campaign_initialized",
    campaign_id,
    processing_initiated: true,
  };
}

/**
 * Handle campaign processing started webhook
 */
async function handleProcessingStarted(payload) {
  const { campaign_id, event_data } = payload;

  console.log(`🚀 Campaign Processing Started: ${campaign_id}`);

  // Record processing start metrics
  if (ProspectProMetrics) {
    ProspectProMetrics.campaignProcessingStarted.inc({
      campaign_id: campaign_id.toString(),
    });
  }

  // Set processing start time
  try {
    await supabase.client
      .from("campaign_processing_status")
      .update({
        started_at: new Date(),
        status: "processing",
      })
      .eq("campaign_id", campaign_id);
  } catch (error) {
    console.error("Failed to update processing start time:", error);
  }

  return {
    status: "processed",
    action: "processing_started_logged",
    campaign_id,
  };
}

/**
 * Handle campaign progress update webhook
 */
async function handleProgressUpdate(payload) {
  const { campaign_id, event_data } = payload;

  console.log(`📊 Campaign Progress Update: ${campaign_id}`, {
    stage: event_data.current_stage,
    progress: event_data.new_progress,
    processed: event_data.processed_leads,
    qualified: event_data.qualified_leads,
  });

  // Record progress metrics
  if (ProspectProMetrics) {
    ProspectProMetrics.campaignProgress.set(
      {
        campaign_id: campaign_id.toString(),
        stage: event_data.current_stage || "unknown",
      },
      event_data.new_progress || 0
    );

    if (event_data.processed_leads) {
      ProspectProMetrics.campaignProcessedLeads.set(
        { campaign_id: campaign_id.toString() },
        event_data.processed_leads
      );
    }

    if (event_data.qualified_leads) {
      ProspectProMetrics.campaignQualifiedLeads.set(
        { campaign_id: campaign_id.toString() },
        event_data.qualified_leads
      );
    }

    if (event_data.processing_cost) {
      ProspectProMetrics.campaignProcessingCost.set(
        { campaign_id: campaign_id.toString() },
        parseFloat(event_data.processing_cost)
      );
    }
  }

  return {
    status: "processed",
    action: "progress_updated",
    campaign_id,
    current_progress: event_data.new_progress,
  };
}

/**
 * Handle campaign completed webhook
 */
async function handleCampaignCompleted(payload) {
  const { campaign_id, event_data, processing_status } = payload;

  console.log(`✅ Campaign Completed: ${campaign_id}`, {
    total_leads: processing_status?.total_leads,
    qualified_leads: processing_status?.qualified_leads,
    cost: processing_status?.processing_cost,
  });

  // Record completion metrics
  if (ProspectProMetrics) {
    ProspectProMetrics.campaignCompleted.inc({
      campaign_id: campaign_id.toString(),
    });

    if (processing_status) {
      if (processing_status.qualified_leads) {
        ProspectProMetrics.campaignFinalQualifiedLeads.observe(
          { campaign_id: campaign_id.toString() },
          processing_status.qualified_leads
        );
      }

      if (processing_status.processing_cost) {
        ProspectProMetrics.campaignFinalCost.observe(
          { campaign_id: campaign_id.toString() },
          parseFloat(processing_status.processing_cost)
        );
      }
    }
  }

  // Auto-export campaign results if configured
  if (CampaignCsvExporter && processing_status?.qualified_leads > 0) {
    try {
      await automatedCampaignExport(campaign_id, processing_status);
    } catch (error) {
      console.error("❌ Failed automated campaign export:", error);
      // Don't throw - export failure shouldn't fail webhook processing
    }
  }

  return {
    status: "processed",
    action: "campaign_completed",
    campaign_id,
    qualified_leads: processing_status?.qualified_leads || 0,
    export_attempted: CampaignCsvExporter ? true : false,
  };
}

/**
 * Handle campaign error webhook
 */
async function handleCampaignError(payload) {
  const { campaign_id, event_data } = payload;

  console.error(`❌ Campaign Error: ${campaign_id}`, event_data);

  // Record error metrics
  if (ProspectProMetrics) {
    ProspectProMetrics.campaignErrors.inc({
      campaign_id: campaign_id.toString(),
      error_type: event_data.error_type || "unknown",
    });
  }

  return {
    status: "processed",
    action: "error_logged",
    campaign_id,
    error_recorded: true,
  };
}

/**
 * Handle campaign cancelled webhook
 */
async function handleCampaignCancelled(payload) {
  const { campaign_id, event_data } = payload;

  console.log(`⏹️ Campaign Cancelled: ${campaign_id}`);

  // Record cancellation metrics
  if (ProspectProMetrics) {
    ProspectProMetrics.campaignCancelled.inc({
      campaign_id: campaign_id.toString(),
    });
  }

  return {
    status: "processed",
    action: "cancellation_logged",
    campaign_id,
  };
}

/**
 * Initiate automated campaign processing
 */
async function initiateCampaignProcessing(campaignId, campaignInfo) {
  // This would typically trigger the lead discovery pipeline
  // For now, we'll update the status to indicate processing can begin

  const { error } = await supabase.client
    .from("campaign_processing_status")
    .update({
      status: "ready_for_processing",
      processing_metadata: {
        ...campaignInfo,
        processing_initiated_at: new Date(),
        auto_processing_enabled: true,
      },
    })
    .eq("campaign_id", campaignId);

  if (error) {
    throw new Error(`Failed to initiate campaign processing: ${error.message}`);
  }

  console.log(`🔄 Campaign ${campaignId} marked ready for processing`);
}

/**
 * Automated campaign export when completed
 */
async function automatedCampaignExport(campaignId, processingStatus) {
  if (!CampaignCsvExporter) {
    console.log("📤 CampaignCsvExporter not available - skipping auto-export");
    return;
  }

  try {
    const exporter = new CampaignCsvExporter();
    const exportResult = await exporter.exportCampaign(campaignId, {
      includeUnqualified: false, // Only export qualified leads
      format: "csv",
      autoDownload: false, // Generate file but don't auto-download
    });

    console.log(
      `📤 Automated export completed for campaign ${campaignId}:`,
      exportResult
    );

    // Update campaign with export information
    await supabase.client
      .from("campaigns")
      .update({
        export_file_path: exportResult.filePath,
        exported_at: new Date(),
        export_metadata: {
          qualified_leads_exported: processingStatus.qualified_leads,
          export_format: "csv",
          automated_export: true,
        },
      })
      .eq("id", campaignId);

    return exportResult;
  } catch (error) {
    console.error(
      `❌ Automated export failed for campaign ${campaignId}:`,
      error
    );
    throw error;
  }
}

/**
 * Main webhook endpoint
 */
router.post("/", authenticateWebhook, async (req, res) => {
  try {
    const payload = req.body;
    const { campaign_id, lifecycle_event } = payload;

    console.log(`🔔 Campaign lifecycle webhook received:`, {
      campaign_id,
      lifecycle_event,
      timestamp: new Date().toISOString(),
    });

    // Validate required fields
    if (!campaign_id || !lifecycle_event) {
      return res.status(400).json({
        error: "Missing required fields: campaign_id, lifecycle_event",
      });
    }

    let result;

    // Route to appropriate handler based on lifecycle event
    switch (lifecycle_event) {
      case "created":
        result = await handleCampaignCreated(payload);
        break;

      case "processing_started":
        result = await handleProcessingStarted(payload);
        break;

      case "progress_update":
        result = await handleProgressUpdate(payload);
        break;

      case "completed":
        result = await handleCampaignCompleted(payload);
        break;

      case "error":
        result = await handleCampaignError(payload);
        break;

      case "cancelled":
        result = await handleCampaignCancelled(payload);
        break;

      default:
        console.log(`⚠️ Unknown lifecycle event: ${lifecycle_event}`);
        result = {
          status: "ignored",
          reason: "Unknown lifecycle event",
          campaign_id,
          lifecycle_event,
        };
    }

    // Record webhook processing metrics
    if (ProspectProMetrics) {
      ProspectProMetrics.webhookProcessed.inc({
        webhook_type: "campaign_lifecycle",
        lifecycle_event,
        status: result.status,
      });
    }

    res.json({
      success: true,
      processed_at: new Date().toISOString(),
      campaign_id,
      lifecycle_event,
      result,
    });
  } catch (error) {
    console.error("❌ Campaign lifecycle webhook error:", error);

    // Record error metrics
    if (ProspectProMetrics) {
      ProspectProMetrics.webhookErrors.inc({
        webhook_type: "campaign_lifecycle",
        error_type: error.constructor.name,
      });
    }

    res.status(500).json({
      success: false,
      error: error.message,
      processed_at: new Date().toISOString(),
    });
  }
});

/**
 * Health check endpoint
 */
router.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    webhook_type: "campaign_lifecycle",
    timestamp: new Date().toISOString(),
    integrations: {
      supabase: !!supabase.client,
      csv_exporter: !!CampaignCsvExporter,
      metrics: !!ProspectProMetrics,
    },
  });
});

/**
 * Get campaign lifecycle events (for debugging)
 */
router.get("/events/:campaignId", authenticateWebhook, async (req, res) => {
  try {
    const { campaignId } = req.params;
    const { limit = 50 } = req.query;

    const { data, error } = await supabase.client
      .from("campaign_lifecycle_log")
      .select("*")
      .eq("campaign_id", campaignId)
      .order("created_at", { ascending: false })
      .limit(parseInt(limit));

    if (error) throw error;

    res.json({
      campaign_id: campaignId,
      events: data,
      count: data.length,
    });
  } catch (error) {
    console.error("Failed to fetch campaign lifecycle events:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
