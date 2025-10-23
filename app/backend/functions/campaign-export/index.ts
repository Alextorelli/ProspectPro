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
  confidence_score?: number;
  enrichment_tier?: string;
  validation_status?: string;
  chamber_verified?: boolean;
  trade_association?: string;
  cost_to_acquire?: number;
  validation_cost?: number;
  cache_hit?: boolean;
  created_at?: string;
  updated_at?: string;
  enrichment_data?: Record<string, unknown>;
  data_sources?: unknown;
  data_source?: string;
  verification_status?: string;
  apollo_verified?: boolean;
  license_verified?: boolean;
  score_breakdown?: Record<string, unknown>;
  cost_efficient?: boolean;
  scoring_recommendation?: string;
  vault_secured?: boolean;
  owner_contact?: string;
  linkedin_profile?: string;
  professional_license?: string;
  last_verified?: string;
  google_places_verified?: boolean;
  [key: string]: unknown;
}

// CSV Export functionality
class CampaignExporter {
  generateCSV(campaign: Campaign, leads: Lead[]): string {
    // Comprehensive CSV headers for all tiers - unified template
    const headers = [
      // Base tier columns (always included)
      "Business Name",
      "Address",
      "Phone",
      "Website",
      "Generic Company Email",
      "Industry",
      "Company Size",
      "Business Verification Status",
      "Confidence Score",

      // Professional tier columns
      "Professional Email",
      "Email Verification Status",
      "Email Deliverability Score",
      "Enhanced Company Data",

      // Enterprise tier columns
      "Executive Contact Name",
      "Executive Title",
      "Executive Email",
      "Executive Phone",
      "Executive LinkedIn",
      "Compliance Verification",
      "Professional License",
      "Chamber Member Status",
      "Trade Association",

      // Universal metadata columns
      "Enrichment Tier",
      "Total Cost",
      "Validation Cost",
      "Enrichment Cost",
      "Data Sources",
      "Cache Hit",
      "Processing Time",
      "Created Date",
      "Last Updated",
    ];

    // Generate CSV rows with tier-aware data population
    const rows = leads.map((lead) => {
      const enrichmentData = this.parseEnrichmentData(lead);
      const tierUsed = String(
        lead.enrichment_tier || campaign.tier_used || "Base"
      );

      return [
        // Base tier data (always populated)
        this.cleanField(lead.business_name),
        this.cleanField(lead.address),
        this.cleanField(lead.phone),
        this.cleanField(lead.website),
        this.getGenericEmail(lead, tierUsed),
        this.getCompanyIndustry(lead, enrichmentData, tierUsed),
        this.getCompanySize(lead, enrichmentData, tierUsed),
        this.getBusinessVerificationStatus(lead, tierUsed),
        lead.confidence_score || 0,

        // Professional tier data
        this.getProfessionalEmail(lead, enrichmentData, tierUsed),
        this.getEmailVerificationStatus(lead, enrichmentData, tierUsed),
        this.getEmailDeliverabilityScore(lead, enrichmentData, tierUsed),
        this.getEnhancedCompanyData(lead, enrichmentData, tierUsed),

        // Enterprise tier data
        this.getExecutiveContactName(lead, enrichmentData, tierUsed),
        this.getExecutiveTitle(lead, enrichmentData, tierUsed),
        this.getExecutiveEmail(lead, enrichmentData, tierUsed),
        this.getExecutivePhone(lead, enrichmentData, tierUsed),
        this.getExecutiveLinkedIn(lead, enrichmentData, tierUsed),
        this.getComplianceVerification(lead, enrichmentData, tierUsed),
        this.getProfessionalLicense(lead, enrichmentData, tierUsed),
        this.getChamberMemberStatus(lead, enrichmentData, tierUsed),
        this.getTradeAssociation(lead, enrichmentData, tierUsed),

        // Universal metadata
        tierUsed,
        this.getTotalCost(lead),
        this.getValidationCost(lead, enrichmentData),
        this.getEnrichmentCost(lead, enrichmentData),
        this.getDataSources(lead, enrichmentData),
        this.getCacheStatus(lead),
        this.getProcessingTime(lead, enrichmentData),
        this.formatDate(lead.created_at || ""),
        this.formatDate(String(lead.updated_at || lead.created_at || "")),
      ];
    });

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

  private parseEnrichmentData(lead: Lead): Record<string, unknown> | null {
    if (!lead.enrichment_data) return null;

    if (typeof lead.enrichment_data === "string") {
      try {
        return JSON.parse(lead.enrichment_data) as Record<string, unknown>;
      } catch {
        return null;
      }
    }

    if (typeof lead.enrichment_data === "object") {
      return lead.enrichment_data as Record<string, unknown>;
    }

    return null;
  }

  private getEmailDisplay(lead: Lead): string {
    const verifiedEmail = this.cleanVerifiedField(lead.email);
    if (verifiedEmail) {
      return verifiedEmail;
    }

    const enrichmentData = this.parseEnrichmentData(lead);
    if (!enrichmentData) {
      return "";
    }

    const processingMetadata = (enrichmentData["processingMetadata"] ??
      {}) as Record<string, unknown>;

    const metadataVerified =
      typeof processingMetadata["verifiedEmail"] === "string"
        ? this.cleanVerifiedField(processingMetadata["verifiedEmail"])
        : "";

    if (metadataVerified) {
      return metadataVerified;
    }

    const emailStatus =
      typeof processingMetadata["emailStatus"] === "string"
        ? (processingMetadata["emailStatus"] as string)
        : undefined;

    const hasUnverified =
      typeof processingMetadata["unverifiedEmail"] === "string" &&
      (processingMetadata["unverifiedEmail"] as string).length > 0;

    if (emailStatus === "unconfirmed" && hasUnverified) {
      return "unconfirmed";
    }

    return "";
  }

  // Tier-aware data extraction methods
  private getGenericEmail(lead: Lead, tierUsed: string): string {
    // Base tier gets generic company email from basic data
    if (tierUsed === "Base") {
      return this.cleanVerifiedField(lead.email) || "";
    }
    return "N/A"; // Higher tiers use professional email column
  }

  private getProfessionalEmail(
    lead: Lead,
    enrichmentData: Record<string, unknown> | null,
    tierUsed: string
  ): string {
    if (tierUsed === "Base") return "N/A";

    // Professional and Enterprise tiers get verified professional emails
    const processingMetadata = enrichmentData?.["processingMetadata"] as
      | Record<string, unknown>
      | undefined;
    const verifiedEmail =
      typeof processingMetadata?.["verifiedEmail"] === "string"
        ? (processingMetadata["verifiedEmail"] as string)
        : "";

    if (verifiedEmail) {
      return this.cleanVerifiedField(verifiedEmail);
    }

    // Fallback to lead.email if verified
    return this.cleanVerifiedField(lead.email) || "";
  }

  private getEmailVerificationStatus(
    _lead: Lead,
    enrichmentData: Record<string, unknown> | null,
    tierUsed: string
  ): string {
    if (tierUsed === "Base") return "N/A";

    const processingMetadata = enrichmentData?.["processingMetadata"] as
      | Record<string, unknown>
      | undefined;
    const emailStatus = processingMetadata?.["emailStatus"] as
      | string
      | undefined;

    switch (emailStatus) {
      case "verified":
        return "Verified";
      case "unconfirmed":
        return "Unconfirmed";
      case "not_found":
        return "Not Found";
      default:
        return "";
    }
  }

  private getEmailDeliverabilityScore(
    _lead: Lead,
    enrichmentData: Record<string, unknown> | null,
    tierUsed: string
  ): string {
    if (tierUsed === "Base") return "N/A";

    const emails = enrichmentData?.["emails"] as
      | Array<{ email?: string; confidence?: number; verified?: boolean }>
      | undefined;
    if (!emails || emails.length === 0) return "";

    const verifiedEmail = emails.find((e) => e.verified);
    return verifiedEmail?.confidence ? `${verifiedEmail.confidence}%` : "";
  }

  private getCompanyIndustry(
    _lead: Lead,
    enrichmentData: Record<string, unknown> | null,
    _tierUsed: string
  ): string {
    const companyInfo = enrichmentData?.["companyInfo"] as
      | Record<string, unknown>
      | undefined;
    return typeof companyInfo?.["industry"] === "string"
      ? (companyInfo["industry"] as string)
      : "";
  }

  private getCompanySize(
    _lead: Lead,
    enrichmentData: Record<string, unknown> | null,
    _tierUsed: string
  ): string {
    const companyInfo = enrichmentData?.["companyInfo"] as
      | Record<string, unknown>
      | undefined;
    return typeof companyInfo?.["size"] === "string"
      ? (companyInfo["size"] as string)
      : "";
  }

  private getEnhancedCompanyData(
    _lead: Lead,
    enrichmentData: Record<string, unknown> | null,
    tierUsed: string
  ): string {
    if (tierUsed === "Base") return "N/A";

    const companyInfo = enrichmentData?.["companyInfo"] as
      | Record<string, unknown>
      | undefined;
    if (!companyInfo) return "";

    const details = [];
    if (companyInfo["founded"])
      details.push(`Founded: ${companyInfo["founded"]}`);
    if (companyInfo["revenue"])
      details.push(`Revenue: ${companyInfo["revenue"]}`);
    if (companyInfo["description"])
      details.push(`Description: ${companyInfo["description"]}`);

    return details.join(" | ");
  }

  private getBusinessVerificationStatus(lead: Lead, _tierUsed: string): string {
    // All tiers include business verification
    return String(lead.validation_status || "Verified");
  }

  // Enterprise tier methods
  private getExecutiveContactName(
    _lead: Lead,
    enrichmentData: Record<string, unknown> | null,
    tierUsed: string
  ): string {
    if (tierUsed !== "Enterprise") return "N/A";

    const personEnrichment = enrichmentData?.["personEnrichment"] as
      | Array<{ name?: string }>
      | undefined;
    return personEnrichment?.[0]?.name || "";
  }

  private getExecutiveTitle(
    _lead: Lead,
    enrichmentData: Record<string, unknown> | null,
    tierUsed: string
  ): string {
    if (tierUsed !== "Enterprise") return "N/A";

    const personEnrichment = enrichmentData?.["personEnrichment"] as
      | Array<{ title?: string }>
      | undefined;
    return personEnrichment?.[0]?.title || "";
  }

  private getExecutiveEmail(
    _lead: Lead,
    enrichmentData: Record<string, unknown> | null,
    tierUsed: string
  ): string {
    if (tierUsed !== "Enterprise") return "N/A";

    const personEnrichment = enrichmentData?.["personEnrichment"] as
      | Array<{ email?: string }>
      | undefined;
    return personEnrichment?.[0]?.email || "";
  }

  private getExecutivePhone(
    _lead: Lead,
    enrichmentData: Record<string, unknown> | null,
    tierUsed: string
  ): string {
    if (tierUsed !== "Enterprise") return "N/A";

    const personEnrichment = enrichmentData?.["personEnrichment"] as
      | Array<{ phone?: string }>
      | undefined;
    return personEnrichment?.[0]?.phone || "";
  }

  private getExecutiveLinkedIn(
    _lead: Lead,
    enrichmentData: Record<string, unknown> | null,
    tierUsed: string
  ): string {
    if (tierUsed !== "Enterprise") return "N/A";

    const personEnrichment = enrichmentData?.["personEnrichment"] as
      | Array<{ linkedin?: string }>
      | undefined;
    return personEnrichment?.[0]?.linkedin || "";
  }

  private getComplianceVerification(
    _lead: Lead,
    enrichmentData: Record<string, unknown> | null,
    tierUsed: string
  ): string {
    if (tierUsed !== "Enterprise") return "N/A";

    const complianceData = enrichmentData?.["complianceData"] as
      | Record<string, unknown>
      | undefined;
    if (!complianceData) return "";

    const checks = [];
    if (complianceData["finraCheck"]) checks.push("FINRA");
    if (complianceData["sanctionsCheck"]) checks.push("Sanctions");

    return checks.join(", ") || "No findings";
  }

  private getProfessionalLicense(
    _lead: Lead,
    enrichmentData: Record<string, unknown> | null,
    _tierUsed: string
  ): string {
    const businessLicense = enrichmentData?.["businessLicense"] as
      | Record<string, unknown>
      | undefined;
    if (!businessLicense) return "";

    return (businessLicense["licenseNumber"] as string) || "";
  }

  private getChamberMemberStatus(
    lead: Lead,
    _enrichmentData: Record<string, unknown> | null,
    _tierUsed: string
  ): string {
    return lead.chamber_verified ? "Member" : "";
  }

  private getTradeAssociation(
    lead: Lead,
    _enrichmentData: Record<string, unknown> | null,
    _tierUsed: string
  ): string {
    return this.cleanField(lead.trade_association);
  }

  // Cost and metadata methods
  private getTotalCost(lead: Lead): string {
    const cost = lead.cost_to_acquire || lead.validation_cost || 0;
    return `$${cost.toFixed(3)}`;
  }

  private getValidationCost(
    _lead: Lead,
    enrichmentData: Record<string, unknown> | null
  ): string {
    const processingMetadata = enrichmentData?.["processingMetadata"] as
      | Record<string, unknown>
      | undefined;
    const validationCost = processingMetadata?.["validationCost"] as
      | number
      | undefined;
    return validationCost ? `$${validationCost.toFixed(3)}` : "$0.000";
  }

  private getEnrichmentCost(
    _lead: Lead,
    enrichmentData: Record<string, unknown> | null
  ): string {
    const processingMetadata = enrichmentData?.["processingMetadata"] as
      | Record<string, unknown>
      | undefined;
    const enrichmentCost = processingMetadata?.["enrichmentCost"] as
      | number
      | undefined;
    return enrichmentCost ? `$${enrichmentCost.toFixed(3)}` : "$0.000";
  }

  private getDataSources(
    _lead: Lead,
    enrichmentData: Record<string, unknown> | null
  ): string {
    const verificationSources = enrichmentData?.["verificationSources"] as
      | string[]
      | undefined;
    const dataSources = enrichmentData?.["dataSources"] as string[] | undefined;

    const allSources = new Set<string>();
    verificationSources?.forEach((source) => allSources.add(source));
    dataSources?.forEach((source) => allSources.add(source));

    return Array.from(allSources).join(", ") || "Google Places";
  }

  private getCacheStatus(lead: Lead): string {
    return lead.cache_hit ? "Cache Hit" : "Fresh";
  }

  private getProcessingTime(
    _lead: Lead,
    enrichmentData: Record<string, unknown> | null
  ): string {
    const processingMetadata = enrichmentData?.["processingMetadata"] as
      | Record<string, unknown>
      | undefined;
    const processingTime = processingMetadata?.["processingTime"] as
      | number
      | undefined;
    return processingTime ? `${processingTime}ms` : "";
  }

  // Utility methods
  private cleanField(value: unknown): string {
    if (value === null || value === undefined || value === "") return "";
    return String(value)
      .replace(/[\r\n]+/g, " ")
      .trim();
  }

  private cleanVerifiedField(email: unknown): string {
    if (!email) return "";
    const emailStr = String(email);

    // Check if email contains pattern indicators (fake data)
    const fakePatterns = [
      "info@",
      "contact@",
      "hello@",
      "sales@",
      "support@",
      "admin@",
      "noreply@",
      "no-reply@",
      "mail@",
    ];

    const isGenericPattern = fakePatterns.some((pattern) =>
      emailStr.toLowerCase().includes(pattern)
    );

    if (isGenericPattern) {
      return ""; // Don't include generic pattern emails
    }

    return this.cleanField(emailStr);
  }

  private getEnrichmentDataSources(lead: Lead): string {
    if (!lead.data_sources) return "Google Places";

    const sources = Array.isArray(lead.data_sources) ? lead.data_sources : [];
    const sourceNames: string[] = [];

    sources.forEach((source) => {
      if (typeof source === "string") {
        sourceNames.push(source);
      } else if (source && typeof source === "object" && "name" in source) {
        sourceNames.push((source as { name: string }).name);
      }
    });

    return sourceNames.length > 0 ? sourceNames.join(", ") : "Google Places";
  }

  private getDataSource(lead: Lead): string {
    const sources: string[] = [];
    if (lead.verification_status?.includes("google"))
      sources.push("Google Places");
    if (lead.apollo_verified) sources.push("Apollo");
    if (lead.chamber_verified) sources.push("Chamber of Commerce");
    if (lead.license_verified) sources.push("Professional License Board");

    // Check for verification sources in lead data
    if (lead.data_source && typeof lead.data_source === "string") {
      const dataSources = lead.data_source
        .split(",")
        .map((s: string) => s.trim());
      dataSources.forEach((source: string) => {
        if (
          source === "chamber_commerce" &&
          !sources.includes("Chamber of Commerce")
        ) {
          sources.push("Chamber of Commerce");
        }
        if (
          source === "trade_association" &&
          !sources.includes("Trade Association")
        ) {
          sources.push("Trade Association");
        }
        if (
          source === "professional_license" &&
          !sources.includes("Professional License")
        ) {
          sources.push("Professional License");
        }
      });
    }

    return sources.join("; ") || "Google Places";
  }

  private getVerificationStatus(lead: Lead): string {
    // Priority-based verification status
    if (lead.apollo_verified) return "Executive Contact Verified";
    if (lead.license_verified) return "Professional License Verified";
    if (lead.chamber_verified) return "Chamber Membership Verified";

    // Check verification level from lead data
    if (lead.verification_status) {
      if (lead.verification_status.includes("apollo"))
        return "Executive Contact Verified";
      if (lead.verification_status.includes("license"))
        return "Professional License Verified";
      if (lead.verification_status.includes("chamber"))
        return "Chamber Membership Verified";
      if (lead.verification_status.includes("trade"))
        return "Trade Association Verified";
    }

    if ((lead.confidence_score || 0) >= 75) return "High Confidence";
    if ((lead.confidence_score || 0) >= 50) return "Medium Confidence";
    return "Basic Listing";
  }

  private getMembershipStatus(isVerified: unknown): string {
    return isVerified ? "Verified Member" : "";
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
