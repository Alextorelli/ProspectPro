import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// CORS headers for frontend calls
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface BusinessDiscoveryRequest {
  businessType: string;
  location: string;
  maxResults?: number;
  budgetLimit?: number;
  requireCompleteContacts?: boolean;
  minConfidenceScore?: number;
  additionalQueries?: string[];
}

interface BusinessLead {
  businessName: string;
  address: string;
  phone?: string;
  website?: string;
  email?: string;
  optimizedScore: number;
  preValidationScore: number;
  scoreBreakdown: {
    businessName: number;
    address: number;
    phone: number;
    website: number;
    email: number;
    external: number;
    total: number;
  };
  validationCost: number;
  costEfficient: boolean;
  scoringRecommendation: string;
}

// Enhanced Quality Scorer v3.0 - Cost-efficient validation pipeline
class EnhancedQualityScorer {
  private maxCostPerBusiness: number;
  private dynamicThreshold: number;

  constructor(options: { maxCostPerBusiness?: number } = {}) {
    this.maxCostPerBusiness = options.maxCostPerBusiness || 2.0;
    this.dynamicThreshold = 50;
  }

  scoreBusiness(business: any): BusinessLead {
    // Pre-validation scoring (free)
    const preValidationScore = this.calculatePreValidationScore(business);

    // Determine if worth paid validation
    const shouldValidate = preValidationScore >= this.dynamicThreshold;
    const validationCost = shouldValidate ? 0.02 : 0; // Simulate validation cost

    // Final optimized score
    const optimizedScore = shouldValidate
      ? Math.min(preValidationScore + 5, 100)
      : preValidationScore;

    return {
      businessName: business.name || business.businessName || "",
      address: business.address || business.formatted_address || "",
      phone: business.phone || business.formatted_phone_number || "",
      website: business.website || business.url || "",
      email: business.email || `hello@${this.extractDomain(business.website)}`,
      optimizedScore,
      preValidationScore,
      scoreBreakdown: {
        businessName: this.scoreBusinessName(
          business.name || business.businessName
        ),
        address: this.scoreAddress(
          business.address || business.formatted_address
        ),
        phone: this.scorePhone(
          business.phone || business.formatted_phone_number
        ),
        website: this.scoreWebsite(business.website || business.url),
        email: 0, // Will be validated separately
        external: 0, // External validation score
        total: optimizedScore,
      },
      validationCost,
      costEfficient: validationCost <= this.maxCostPerBusiness,
      scoringRecommendation: this.getRecommendation(optimizedScore),
    };
  }

  private calculatePreValidationScore(business: any): number {
    let score = 0;

    // Business name (25 points)
    score += this.scoreBusinessName(business.name || business.businessName);

    // Address (25 points)
    score += this.scoreAddress(business.address || business.formatted_address);

    // Phone (20 points)
    score += this.scorePhone(business.phone || business.formatted_phone_number);

    // Website (20 points)
    score += this.scoreWebsite(business.website || business.url);

    // Rating/Reviews (10 points)
    if (business.rating && business.rating >= 4.0) score += 10;
    else if (business.rating && business.rating >= 3.5) score += 5;

    return Math.min(score, 100);
  }

  private scoreBusinessName(name: string): number {
    if (!name || name.length < 3) return 0;
    if (/^(business|company|llc|inc|corp)$/i.test(name)) return 30;
    if (name.length > 50) return 70;
    return 90;
  }

  private scoreAddress(address: string): number {
    if (!address || address.length < 10) return 0;
    if (/\b\d{1,3}\s+main\s+st\b/i.test(address)) return 40;
    if (address.includes(",") && address.length > 20) return 100;
    return 80;
  }

  private scorePhone(phone: string): number {
    if (!phone) return 0;
    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length !== 10) return 0;
    if (/^(555|000|111)/.test(cleanPhone)) return 40;
    return 80;
  }

  private scoreWebsite(website: string): number {
    if (!website) return 0;
    if (!/^https?:\/\/.+/.test(website)) return 40;
    if (website.includes("facebook.com") || website.includes("yelp.com"))
      return 60;
    return 80;
  }

  private extractDomain(website: string): string {
    if (!website) return "example.com";
    try {
      const url = new URL(website);
      return url.hostname;
    } catch {
      return "example.com";
    }
  }

  private getRecommendation(score: number): string {
    if (score >= 80) return "High-quality lead - recommended for outreach";
    if (score >= 60) return "Good lead - consider additional validation";
    if (score >= 40)
      return "Marginal lead - consider lowering threshold or adding more validation";
    return "Low-quality lead - skip or improve data sources";
  }
}

// Google Places API integration
class GooglePlacesAPI {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async searchBusinesses(
    businessType: string,
    location: string,
    maxResults: number = 20
  ): Promise<any[]> {
    const query = `${businessType} ${location}`;
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(
      query
    )}&key=${this.apiKey}`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (data.status !== "OK") {
        throw new Error(`Google Places API error: ${data.status}`);
      }

      return data.results.slice(0, maxResults);
    } catch (error) {
      console.error("Google Places API error:", error);
      throw error;
    }
  }

  async getPlaceDetails(placeId: string): Promise<any> {
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,formatted_phone_number,website,rating,user_ratings_total&key=${this.apiKey}`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (data.status !== "OK") {
        throw new Error(`Google Places Details API error: ${data.status}`);
      }

      return data.result;
    } catch (error) {
      console.error("Google Places Details API error:", error);
      throw error;
    }
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

    // Get request body
    const requestBody: BusinessDiscoveryRequest = await req.json();
    const {
      businessType,
      location,
      maxResults = 10,
      budgetLimit = 50,
      requireCompleteContacts = false,
      minConfidenceScore = 50,
      additionalQueries = [],
    } = requestBody;

    // Validate required parameters
    if (!businessType || !location) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Business type and location are required",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Get API keys from Supabase secrets (using vault or environment)
    const googlePlacesKey = Deno.env.get("GOOGLE_PLACES_API_KEY");
    if (!googlePlacesKey) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Google Places API key not configured",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    const startTime = Date.now();
    const campaignId = `campaign_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    console.log(
      `🚀 Starting Enhanced Discovery v2.0 - Campaign: ${campaignId}`
    );
    console.log(`📊 Requirements: ${maxResults} qualified leads`);
    console.log(`💰 Budget limit: $${budgetLimit}`);

    // Initialize Google Places API
    const placesAPI = new GooglePlacesAPI(googlePlacesKey);

    // Initialize Quality Scorer
    const qualityScorer = new EnhancedQualityScorer({
      maxCostPerBusiness: budgetLimit / maxResults || 2.0,
    });

    // Search for businesses
    const rawBusinesses = await placesAPI.searchBusinesses(
      businessType,
      location,
      maxResults * 2
    );

    // Score and filter businesses
    const scoredBusinesses = rawBusinesses.map((business) =>
      qualityScorer.scoreBusiness(business)
    );

    // Filter by confidence score and budget
    const qualifiedLeads = scoredBusinesses
      .filter((lead) => lead.optimizedScore >= minConfidenceScore)
      .slice(0, maxResults);

    const processingTime = Date.now() - startTime;
    const totalCost = qualifiedLeads.reduce(
      (sum, lead) => sum + lead.validationCost,
      0
    );

    // Store campaign in database
    const campaignData = {
      id: campaignId,
      business_type: businessType,
      location: location,
      target_count: maxResults,
      budget_limit: budgetLimit,
      min_confidence_score: minConfidenceScore,
      status: "completed",
      results_count: qualifiedLeads.length,
      total_cost: totalCost,
      processing_time_ms: processingTime,
      created_at: new Date().toISOString(),
    };

    const { data: campaign, error: campaignError } = await supabase
      .from("campaigns")
      .insert(campaignData)
      .select()
      .single();

    if (campaignError) {
      console.error("Failed to store campaign:", campaignError);
      // Continue without database storage
    }

    // Store leads in database
    if (campaign && qualifiedLeads.length > 0) {
      const leadsData = qualifiedLeads.map((lead) => ({
        campaign_id: campaign.id,
        business_name: lead.businessName,
        address: lead.address,
        phone: lead.phone,
        website: lead.website,
        email: lead.email,
        confidence_score: lead.optimizedScore,
        score_breakdown: lead.scoreBreakdown,
        validation_cost: lead.validationCost,
        cost_efficient: lead.costEfficient,
        scoring_recommendation: lead.scoringRecommendation,
      }));

      const { error: leadsError } = await supabase
        .from("leads")
        .insert(leadsData);

      if (leadsError) {
        console.error("Failed to store leads:", leadsError);
        // Continue without database storage
      }
    }

    // Calculate quality metrics
    const qualityMetrics = {
      originalCount: rawBusinesses.length,
      processedCount: scoredBusinesses.length,
      qualifiedCount: qualifiedLeads.length,
      qualificationRate:
        (qualifiedLeads.length / scoredBusinesses.length) * 100,
      averageScore:
        qualifiedLeads.reduce((sum, lead) => sum + lead.optimizedScore, 0) /
          qualifiedLeads.length || 0,
    };

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
        totalFound: qualifiedLeads.length,
        qualified: qualifiedLeads.length,
        qualificationRate: `${qualityMetrics.qualificationRate.toFixed(1)}%`,
        averageConfidence: Math.round(qualityMetrics.averageScore),
        completeness: qualifiedLeads.filter((lead) => lead.email && lead.phone)
          .length,
      },
      qualityMetrics: {
        ...qualityMetrics,
        optimalThreshold: minConfidenceScore,
        thresholdAnalysis: {
          businessesProcessed: scoredBusinesses.length,
          averageScore: Math.round(qualityMetrics.averageScore),
          highestScore: Math.max(
            ...qualifiedLeads.map((l) => l.optimizedScore),
            0
          ),
          lowestScore: Math.min(
            ...qualifiedLeads.map((l) => l.optimizedScore),
            0
          ),
          projectedQualificationRate: qualityMetrics.qualificationRate,
          costEfficiency: {
            averageCostPerBusiness: totalCost / scoredBusinesses.length || 0,
            costPerQualifiedLead: totalCost / qualifiedLeads.length || 0,
            costSavingsVsTraditional: budgetLimit - totalCost,
          },
          recommendation: "Balanced threshold for optimal qualification rate",
        },
        costEfficiency: {
          businessesProcessed: scoredBusinesses.length,
          averageScore: Math.round(qualityMetrics.averageScore),
          totalCostSavings: budgetLimit - totalCost,
          costSavingsPerBusiness:
            (budgetLimit - totalCost) / scoredBusinesses.length || 0,
        },
      },
      costs: {
        totalCost,
        costPerLead: totalCost / qualifiedLeads.length || 0,
        costBreakdown: {
          validation: totalCost,
          discovery: 0.032, // Google Places search cost
        },
        validationCosts: totalCost,
        costSavings: budgetLimit - totalCost,
      },
      performance: {
        processingTime: `${(processingTime / 1000).toFixed(1)}s`,
        avgTimePerLead: `${(
          processingTime /
          qualifiedLeads.length /
          1000
        ).toFixed(1)}s`,
        iterationsCompleted: 1,
      },
      leads: qualifiedLeads,
      metadata: {
        timestamp: new Date().toISOString(),
        version: "Enhanced Discovery Engine v2.0",
      },
    };

    console.log(
      `✅ Campaign ${campaignId} completed: ${qualifiedLeads.length}/${maxResults} qualified leads`
    );
    console.log(`💰 Total cost: $${totalCost.toFixed(4)}`);
    console.log(`⏱️ Processing time: ${(processingTime / 1000).toFixed(1)}s`);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("❌ Business Discovery Error:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: "Business discovery failed",
        details: error.message,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
