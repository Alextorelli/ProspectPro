import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  EdgeFunctionAuth,
  corsHeaders,
  handleCORS,
} from "../_shared/edge-auth.ts";

// User-Aware Campaign Export Function
// October 4, 2025 - Export with user authentication and ownership

interface ExportRequest {
  campaignId?: string;
  format?: "csv" | "json" | "xlsx";
  includeEnrichmentData?: boolean;
  userEmail?: string;
  sessionUserId?: string;
}

interface ExportLead {
  businessName: string;
  address: string;
  phone: string;
  website: string;
  email: string;
  confidenceScore: number;
  verificationSources: string[];
  apolloVerified: boolean;
  chamberVerified: boolean;
  licenseVerified: boolean;
  totalCost: number;
  processingStrategy: string;
}

// Helper function to get user context from request
function getUserContext(req: Request, requestData: ExportRequest) {
  const authHeader = req.headers.get("Authorization");
  let userFromJWT = null;

  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    try {
      if (token.startsWith("eyJ")) {
        const payload = JSON.parse(atob(token.split(".")[1]));
        userFromJWT = payload.sub;
      }
    } catch (error) {
      console.log("Could not decode JWT for user info:", error);
    }
  }

  return {
    userId: userFromJWT || requestData.sessionUserId || null,
    userEmail: requestData.userEmail || null,
    isAuthenticated: !!userFromJWT,
    sessionId: requestData.sessionUserId,
  };
}

// CSV formatting function
function formatAsCSV(
  leads: ExportLead[],
  includeEnrichmentData: boolean
): string {
  const headers = [
    "Business Name",
    "Address",
    "Phone",
    "Website",
    "Email",
    "Confidence Score",
  ];

  if (includeEnrichmentData) {
    headers.push(
      "Verification Sources",
      "Apollo Verified",
      "Chamber Verified",
      "License Verified",
      "Total Cost",
      "Processing Strategy"
    );
  }

  const csvRows = [headers.join(",")];

  leads.forEach((lead) => {
    const row = [
      `"${lead.businessName.replace(/"/g, '""')}"`,
      `"${lead.address.replace(/"/g, '""')}"`,
      `"${lead.phone}"`,
      `"${lead.website}"`,
      `"${lead.email}"`,
      lead.confidenceScore.toString(),
    ];

    if (includeEnrichmentData) {
      row.push(
        `"${lead.verificationSources.join(", ")}"`,
        lead.apolloVerified.toString(),
        lead.chamberVerified.toString(),
        lead.licenseVerified.toString(),
        lead.totalCost.toString(),
        `"${lead.processingStrategy}"`
      );
    }

    csvRows.push(row.join(","));
  });

  return csvRows.join("\n");
}

// Get campaign data with user authorization
async function getCampaignData(
  supabaseClient: any,
  campaignId: string,
  userContext: any
) {
  try {
    // Get campaign with user authorization - RLS policies will handle access control
    const { data: campaign, error: campaignError } = await supabaseClient
      .from("campaigns")
      .select("*")
      .eq("id", campaignId)
      .single();

    if (campaignError) {
      throw new Error(
        `Campaign not found or access denied: ${campaignError.message}`
      );
    }

    // Get leads for the campaign
    const { data: leads, error: leadsError } = await supabaseClient
      .from("leads")
      .select("*")
      .eq("campaign_id", campaignId);

    if (leadsError) {
      throw new Error(`Could not fetch leads: ${leadsError.message}`);
    }

    return { campaign, leads };
  } catch (error) {
    throw error;
  }
}

serve(async (req) => {
  // Handle CORS preflight
  const corsResponse = handleCORS(req);
  if (corsResponse) return corsResponse;

  try {
    console.log(`📤 Campaign Export with User Authentication`);

    // Initialize Edge Function authentication
    const edgeAuth = new EdgeFunctionAuth();
    const authContext = edgeAuth.getAuthContext();

    console.log(
      `🔐 Auth: ${authContext.keyFormat} (${
        authContext.isValid ? "Valid" : "Invalid"
      })`
    );

    if (!authContext.isValid) {
      throw new Error(`Authentication failed: ${authContext.keyFormat}`);
    }

    // Parse request
    const requestData: ExportRequest = await req.json();
    const {
      campaignId,
      format = "csv",
      includeEnrichmentData = true,
    } = requestData;

    if (!campaignId) {
      throw new Error("Campaign ID is required");
    }

    // Get user context
    const userContext = getUserContext(req, requestData);
    console.log(`👤 Export User Context:`, userContext);

    // Get campaign and leads data
    const { campaign, leads } = await getCampaignData(
      authContext.client,
      campaignId,
      userContext
    );

    console.log(
      `📊 Exporting campaign: ${campaign.business_type} in ${campaign.location}`
    );
    console.log(`📋 Lead count: ${leads.length}`);

    // Transform leads for export
    const exportLeads: ExportLead[] = leads.map((lead) => ({
      businessName: lead.business_name,
      address: lead.address,
      phone: lead.phone,
      website: lead.website,
      email: lead.email,
      confidenceScore: lead.confidence_score,
      verificationSources: lead.enrichment_data?.verificationSources || [
        "google_places",
      ],
      apolloVerified: lead.enrichment_data?.apolloVerified || false,
      chamberVerified: lead.enrichment_data?.chamberVerified || false,
      licenseVerified: lead.enrichment_data?.licenseVerified || false,
      totalCost: lead.enrichment_data?.processingMetadata?.totalCost || 0,
      processingStrategy:
        lead.enrichment_data?.processingMetadata?.processingStrategy || "basic",
    }));

    // Record export in database
    const exportRecord = {
      campaign_id: campaignId,
      export_type: "lead_export",
      file_format: format,
      row_count: exportLeads.length,
      export_status: "completed",
      completed_at: new Date().toISOString(),
      // Add user_id if available
      ...(userContext.userId && { user_id: userContext.userId }),
    };

    const { error: exportError } = await authContext.client
      .from("dashboard_exports")
      .insert(exportRecord);

    if (exportError) {
      console.warn("Could not record export:", exportError.message);
    }

    // Generate export data based on format
    let exportData: string;
    let contentType: string;
    let fileName: string;

    switch (format) {
      case "csv":
        exportData = formatAsCSV(exportLeads, includeEnrichmentData);
        contentType = "text/csv";
        fileName = `prospectpro_${campaign.business_type.replace(
          /\s+/g,
          "_"
        )}_${campaignId.slice(-8)}.csv`;
        break;

      case "json":
        exportData = JSON.stringify(
          {
            campaign: {
              id: campaign.id,
              businessType: campaign.business_type,
              location: campaign.location,
              targetCount: campaign.target_count,
              resultsCount: campaign.results_count,
              totalCost: campaign.total_cost,
              createdAt: campaign.created_at,
            },
            leads: exportLeads,
            exportMetadata: {
              exportedAt: new Date().toISOString(),
              includeEnrichmentData,
              totalLeads: exportLeads.length,
              userContext: {
                isAuthenticated: userContext.isAuthenticated,
                hasUserId: !!userContext.userId,
              },
            },
          },
          null,
          2
        );
        contentType = "application/json";
        fileName = `prospectpro_${campaign.business_type.replace(
          /\s+/g,
          "_"
        )}_${campaignId.slice(-8)}.json`;
        break;

      default:
        throw new Error(`Unsupported export format: ${format}`);
    }

    const response = {
      success: true,
      exportId: `export_${Date.now()}`,
      campaign: {
        id: campaign.id,
        businessType: campaign.business_type,
        location: campaign.location,
        leadCount: exportLeads.length,
      },
      export: {
        format,
        fileName,
        size: exportData.length,
        includeEnrichmentData,
        recordedInDatabase: !exportError,
      },
      userContext: {
        isAuthenticated: userContext.isAuthenticated,
        hasAccess: true,
        ownership: userContext.userId ? "user_owned" : "session_based",
      },
      metadata: {
        timestamp: new Date().toISOString(),
        version: "4.2",
        userAware: true,
      },
    };

    // Return the export data directly for download
    if (req.url.includes("download=true")) {
      return new Response(exportData, {
        headers: {
          ...corsHeaders,
          "Content-Type": contentType,
          "Content-Disposition": `attachment; filename="${fileName}"`,
          "Content-Length": exportData.length.toString(),
        },
      });
    }

    // Return export metadata
    return new Response(JSON.stringify(response, null, 2), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("❌ Export error:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Export failed",
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
