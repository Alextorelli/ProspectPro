import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// CORS headers for frontend calls
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface CampaignExportRequest {
  campaignId: string;
  format?: string;
  minConfidence?: number;
  includeUnqualified?: boolean;
  includeProvenance?: boolean;
}

interface Campaign {
  id: string;
  business_type: string;
  location: string;
  [key: string]: unknown;
}

interface Lead {
  business_name: string;
  address: string;
  phone?: string;
  website?: string;
  email?: string;
  confidence_score: number;
  score_breakdown?: Record<string, unknown>;
  validation_cost?: number;
  cost_efficient?: boolean;
  scoring_recommendation?: string;
  created_at: string;
}

// CSV Export functionality
class CampaignExporter {
  generateCSV(_campaign: Campaign, leads: Lead[]): string {
    // Define CSV headers
    const headers = [
      "Business Name",
      "Address",
      "Phone",
      "Website",
      "Email",
      "Confidence Score",
      "Score Breakdown",
      "Validation Cost",
      "Cost Efficient",
      "Recommendation",
      "Created Date",
    ];

    // Generate CSV rows
    const rows = leads.map((lead) => [
      this.cleanField(lead.business_name),
      this.cleanField(lead.address),
      this.cleanField(lead.phone),
      this.cleanField(lead.website),
      this.cleanField(lead.email),
      lead.confidence_score || 0,
      JSON.stringify(lead.score_breakdown || {}),
      `$${(lead.validation_cost || 0).toFixed(4)}`,
      lead.cost_efficient ? "Yes" : "No",
      this.cleanField(lead.scoring_recommendation),
      this.formatDate(lead.created_at),
    ]);

    // Combine headers and rows
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

  private cleanField(value: unknown): string {
    if (value === null || value === undefined) return "";
    return String(value)
      .replace(/[\r\n]+/g, " ")
      .trim();
  }

  private formatDate(dateString: string): string {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-US");
  }

  private sanitizeFilename(filename: string): string {
    return filename.replace(/[^a-zA-Z0-9_-]/g, "_").replace(/__+/g, "_");
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const url = new URL(req.url);
    const campaignId = url.pathname.split("/").pop();

    if (!campaignId) {
      return new Response(
        JSON.stringify({
          error: "Campaign ID is required",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    const queryParams = new URLSearchParams(url.search);
    const format = queryParams.get("format") || "csv";
    const minConfidence = parseInt(queryParams.get("minConfidence") || "0");
    const includeUnqualified = queryParams.get("includeUnqualified") === "true";

    console.log(
      `📊 Exporting campaign ${campaignId} (format: ${format}, min confidence: ${minConfidence})`
    );

    // Get campaign details
    const { data: campaign, error: campaignError } = await supabase
      .from("campaigns")
      .select("*")
      .eq("id", campaignId)
      .single();

    if (campaignError || !campaign) {
      return new Response(
        JSON.stringify({
          error: "Campaign not found",
          details: campaignError?.message,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 404,
        }
      );
    }

    // Get campaign leads
    let query = supabase
      .from("leads")
      .select("*")
      .eq("campaign_id", campaignId)
      .order("confidence_score", { ascending: false });

    if (!includeUnqualified) {
      query = query.gte("confidence_score", minConfidence);
    }

    const { data: leads, error: leadsError } = await query;

    if (leadsError) {
      console.error("Error fetching leads:", leadsError);
      return new Response(
        JSON.stringify({
          error: "Failed to fetch campaign leads",
          details: leadsError.message,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    if (!leads || leads.length === 0) {
      return new Response(
        JSON.stringify({
          error: "No leads found for this campaign",
          campaign: campaign.business_type || campaignId,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 404,
        }
      );
    }

    // Generate CSV export
    const exporter = new CampaignExporter();
    const csvContent = exporter.generateCSV(campaign, leads);

    // Set response headers for file download
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `${
      campaign.business_type || "campaign"
    }_${campaignId.slice(0, 8)}_${timestamp}.csv`;

    console.log(`✅ Export completed: ${leads.length} leads exported`);

    return new Response(csvContent, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "X-Export-Count": leads.length.toString(),
        "X-Campaign-Name": campaign.business_type || "Untitled",
      },
    });
  } catch (error) {
    console.error("❌ Campaign export error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({
        error: "Export failed",
        details: errorMessage,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
