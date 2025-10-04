import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, handleCORS } from "../_shared/edge-auth.ts";

// Background Task Business Discovery with Job Queue System
// ProspectPro v4.2 - October 2025
// Uses EdgeRuntime.waitUntil() for long-running tasks without timeout

// Type declarations for EdgeRuntime
declare const EdgeRuntime: {
  waitUntil(promise: Promise<unknown>): void;
};

interface BusinessDiscoveryRequest {
  businessType: string;
  location: string;
  maxResults?: number;
  budgetLimit?: number;
  minConfidenceScore?: number;
  sessionUserId?: string;
  userEmail?: string;
}

interface JobConfig {
  campaignId: string;
  businessType: string;
  location: string;
  maxResults: number;
  budgetLimit: number;
  minConfidenceScore: number;
  userId?: string;
  sessionUserId?: string;
}

interface BusinessData {
  name?: string;
  businessName?: string;
  formatted_address?: string;
  address?: string;
  formatted_phone_number?: string;
  phone?: string;
  website?: string;
  place_id?: string;
}

interface ScoredLead {
  businessName: string;
  address: string;
  phone: string;
  website: string;
  email: string;
  optimizedScore: number;
  validationCost: number;
  enhancementData: {
    verificationSources: string[];
    processingMetadata: {
      totalCost: number;
      processingStrategy: string;
    };
  };
}

// =======================
// BACKGROUND PROCESSOR
// =======================
async function processDiscoveryJob(
  jobId: string,
  config: JobConfig,
  supabaseUrl: string,
  supabaseServiceKey: string
) {
  console.log(`🚀 Background job ${jobId} started`);
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Update job status to processing
    await supabase
      .from("discovery_jobs")
      .update({
        status: "processing",
        started_at: new Date().toISOString(),
        current_stage: "discovering_businesses",
        progress: 10,
      })
      .eq("id", jobId);

    // Step 1: Business Discovery (Google Places)
    console.log(`🔍 Discovering businesses: ${config.businessType} in ${config.location}`);
    const businesses = await discoverBusinesses(
      config.businessType,
      config.location,
      config.maxResults
    );

    await supabase
      .from("discovery_jobs")
      .update({
        current_stage: "scoring_businesses",
        progress: 30,
        metrics: { businesses_found: businesses.length },
      })
      .eq("id", jobId);

    // Step 2: Score businesses
    const scorer = new QualityScorer({ maxCostPerBusiness: config.budgetLimit / config.maxResults });
    const scoredBusinesses = businesses.map((b: BusinessData) => scorer.scoreBusiness(b));
    const qualifiedLeads = scoredBusinesses
      .filter((lead: ScoredLead) => lead.optimizedScore >= config.minConfidenceScore)
      .slice(0, config.maxResults);

    await supabase
      .from("discovery_jobs")
      .update({
        current_stage: "enriching_contacts",
        progress: 50,
        metrics: { qualified_leads: qualifiedLeads.length },
      })
      .eq("id", jobId);

    // Step 3: Progressive enrichment (Hunter.io, NeverBounce)
    console.log(`🔄 Enriching ${qualifiedLeads.length} leads...`);
    const enrichedLeads = [];
    let totalCost = 0;

    for (let i = 0; i < qualifiedLeads.length; i++) {
      const lead = qualifiedLeads[i];
      
      try {
        const enrichmentResult = await enrichLead(lead, config);
        enrichedLeads.push(enrichmentResult.lead);
        totalCost += enrichmentResult.cost;

        // Update progress
        const progress = 50 + Math.floor(((i + 1) / qualifiedLeads.length) * 40);
        await supabase
          .from("discovery_jobs")
          .update({
            progress,
            metrics: { 
              leads_enriched: i + 1,
              total_cost: totalCost,
            },
          })
          .eq("id", jobId);

      } catch (error) {
        console.error(`❌ Enrichment error for ${lead.businessName}:`, error);
        enrichedLeads.push(lead); // Keep original data
      }
    }

    // Step 4: Store results in database
    await supabase
      .from("discovery_jobs")
      .update({
        current_stage: "storing_results",
        progress: 90,
      })
      .eq("id", jobId);

    await supabase
      .from("campaigns")
      .insert({
        id: config.campaignId,
        business_type: config.businessType,
        location: config.location,
        target_count: config.maxResults,
        results_count: enrichedLeads.length,
        total_cost: totalCost,
        status: "completed",
        user_id: config.userId,
        session_user_id: config.sessionUserId,
      })
      .select()
      .single();

    const leadsData = enrichedLeads.map((lead: ScoredLead) => ({
      campaign_id: config.campaignId,
      business_name: lead.businessName,
      address: lead.address,
      phone: lead.phone,
      website: lead.website,
      email: lead.email,
      confidence_score: lead.optimizedScore,
      enrichment_data: lead.enhancementData,
      validation_cost: lead.validationCost,
      user_id: config.userId,
      session_user_id: config.sessionUserId,
    }));

    await supabase.from("leads").insert(leadsData);

    // Mark job as completed
    await supabase
      .from("discovery_jobs")
      .update({
        status: "completed",
        progress: 100,
        completed_at: new Date().toISOString(),
        results: enrichedLeads,
        metrics: {
          total_found: enrichedLeads.length,
          total_cost: totalCost,
          avg_confidence: enrichedLeads.reduce((sum: number, l: ScoredLead) => sum + l.optimizedScore, 0) / enrichedLeads.length,
        },
      })
      .eq("id", jobId);

    console.log(`✅ Background job ${jobId} completed: ${enrichedLeads.length} leads, $${totalCost}`);

  } catch (error) {
    console.error(`❌ Background job ${jobId} failed:`, error);
    
    await supabase
      .from("discovery_jobs")
      .update({
        status: "failed",
        error: error instanceof Error ? error.message : "Unknown error",
        completed_at: new Date().toISOString(),
      })
      .eq("id", jobId);
  }
}

// =======================
// HELPER FUNCTIONS
// =======================
class QualityScorer {
  private maxCostPerBusiness: number;

  constructor(options: { maxCostPerBusiness?: number } = {}) {
    this.maxCostPerBusiness = options.maxCostPerBusiness || 2.0;
  }

  scoreBusiness(business: BusinessData): ScoredLead {
    const businessName = business.name || business.businessName || "";
    const address = business.formatted_address || business.address || "";
    const phone = business.formatted_phone_number || business.phone || "";
    const website = business.website || "";

    const scores = {
      businessName: businessName ? Math.min(100, businessName.length * 3) : 0,
      address: address ? 100 : 0,
      phone: phone ? 80 : 0,
      website: website ? 80 : 0,
    };

    const totalScore = Object.values(scores).reduce((sum, s) => sum + s, 0) / 4;

    return {
      businessName,
      address,
      phone,
      website,
      email: "",
      optimizedScore: Math.round(totalScore),
      validationCost: 0.02,
      enhancementData: {
        verificationSources: ["google_places"],
        processingMetadata: {
          totalCost: 0.02,
          processingStrategy: "basic",
        },
      },
    };
  }
}

async function discoverBusinesses(businessType: string, location: string, maxResults: number) {
  const apiKey = Deno.env.get("GOOGLE_PLACES_API_KEY");
  if (!apiKey) throw new Error("Google Places API key not configured");

  const query = `${businessType} in ${location}`;
  const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${apiKey}`;
  
  const response = await fetch(searchUrl);
  const data = await response.json();

  if (data.status !== "OK") {
    throw new Error(`Google Places API failed: ${data.status}`);
  }

  const results = data.results.slice(0, maxResults);

  // Enrich with Place Details
  const enriched = [];
  for (const business of results) {
    const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${business.place_id}&fields=formatted_phone_number,website&key=${apiKey}`;
    const detailsResponse = await fetch(detailsUrl);
    const detailsData = await detailsResponse.json();

    enriched.push({
      ...business,
      formatted_phone_number: detailsData.result?.formatted_phone_number || "",
      website: detailsData.result?.website || "",
    });
  }

  return enriched;
}

async function enrichLead(lead: ScoredLead, config: JobConfig) {
  const enrichmentUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/enrichment-orchestrator`;
  
  const response = await fetch(enrichmentUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      businessName: lead.businessName,
      domain: lead.website?.replace(/^https?:\/\//, "").replace(/\/$/, ""),
      address: lead.address,
      phone: lead.phone,
      website: lead.website,
      discoverEmails: true,
      verifyEmails: true,
      maxCostPerBusiness: config.budgetLimit / config.maxResults,
      minConfidenceScore: config.minConfidenceScore,
    }),
  });

  if (!response.ok) {
    return { lead, cost: 0 };
  }

  const enrichmentData = await response.json();
  
  return {
    lead: {
      ...lead,
      email: enrichmentData.enrichedData?.emails?.[0]?.email || lead.email,
      enhancementData: {
        ...lead.enhancementData,
        verificationSources: enrichmentData.processingMetadata?.servicesUsed || [],
      },
    },
    cost: enrichmentData.totalCost || 0,
  };
}

// =======================
// MAIN HANDLER
// =======================
serve(async (req) => {
  const corsResponse = handleCORS(req);
  if (corsResponse) return corsResponse;

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization");
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: authHeader ? { headers: { Authorization: authHeader } } : {},
    });

    const { data: { user } } = await supabaseClient.auth.getUser();

    const requestData: BusinessDiscoveryRequest = await req.json();
    const {
      businessType,
      location,
      maxResults = 5,
      budgetLimit = 50,
      minConfidenceScore = 50,
      sessionUserId,
    } = requestData;

    // Create job ID and campaign ID
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const campaignId = `campaign_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const jobConfig = {
      campaignId,
      businessType,
      location,
      maxResults,
      budgetLimit,
      minConfidenceScore,
      userId: user?.id,
      sessionUserId: sessionUserId || user?.id,
    };

    // Create job record
    const { error: jobError } = await supabaseClient
      .from("discovery_jobs")
      .insert({
        id: jobId,
        campaign_id: campaignId,
        user_id: user?.id,
        session_user_id: sessionUserId || user?.id,
        status: "pending",
        config: jobConfig,
      });

    if (jobError) {
      throw new Error(`Failed to create job: ${jobError.message}`);
    }

    // 🔥 CRITICAL: Use EdgeRuntime.waitUntil() to run background task
    // This allows the function to return immediately while processing continues
    EdgeRuntime.waitUntil(
      processDiscoveryJob(jobId, jobConfig, supabaseUrl, supabaseServiceKey)
    );

    // Return immediately with job ID
    return new Response(
      JSON.stringify({
        success: true,
        message: "Discovery job created and processing in background",
        jobId,
        campaignId,
        status: "processing",
        estimatedTime: "1-2 minutes",
        realtimeChannel: `discovery_jobs:id=eq.${jobId}`,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error("❌ Error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
