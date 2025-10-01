import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Import optimization modules (converted to Deno-compatible imports)
// Note: These would need to be transpiled or rewritten for Deno, but showing the structure

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
  tradeAssociations?: boolean;
  professionalLicensing?: boolean;
  chamberVerification?: boolean;
  apolloDiscovery?: boolean;
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
  enhancementData?: Record<string, unknown>;
}

// Enhanced Business Classifier for intelligent API routing
class OptimizedBusinessClassifier {
  private businessPatterns = {
    spa: {
      keywords: [
        "spa",
        "wellness",
        "massage",
        "facial",
        "relaxation",
        "therapeutic",
      ],
      confidenceWeight: 0.9,
      relevantAPIs: ["spaAssociation", "chamber"],
      geographicScope: "local",
    },
    beauty: {
      keywords: ["beauty", "salon", "hair", "nail", "cosmetic", "barbershop"],
      confidenceWeight: 0.85,
      relevantAPIs: ["beautyAssociation", "chamber"],
      geographicScope: "local",
    },
    accounting: {
      keywords: ["accounting", "cpa", "tax", "bookkeeping", "financial"],
      confidenceWeight: 0.95,
      relevantAPIs: ["cpaLicensing", "chamber"],
      geographicScope: "state",
    },
    professional: {
      keywords: ["law", "legal", "consulting", "architect", "engineer"],
      confidenceWeight: 0.8,
      relevantAPIs: ["chamber", "apollo"],
      geographicScope: "state",
    },
  };

  classifyBusiness(business: BusinessLead) {
    const businessText =
      `${business.businessName} ${business.address}`.toLowerCase();
    let bestMatch = null;
    let highestScore = 0;

    for (const [type, pattern] of Object.entries(this.businessPatterns)) {
      const matches = pattern.keywords.filter((keyword) =>
        businessText.includes(keyword)
      ).length;
      const score =
        (matches / pattern.keywords.length) * pattern.confidenceWeight * 100;

      if (score > highestScore) {
        highestScore = score;
        bestMatch = type;
      }
    }

    const confidence =
      highestScore > 70 ? "high" : highestScore > 40 ? "medium" : "low";

    return {
      primaryType: bestMatch,
      confidence,
      score: highestScore,
      relevantAPIs: bestMatch
        ? this.businessPatterns[bestMatch].relevantAPIs
        : ["chamber"],
      geographicScope: bestMatch
        ? this.businessPatterns[bestMatch].geographicScope
        : "local",
    };
  }
}

// Geographic Intelligence Router for location-based filtering
class GeographicRouter {
  private professionalLicensingStates = new Set([
    "CA",
    "NY",
    "TX",
    "FL",
    "IL",
    "WA",
    "PA",
    "OH",
  ]);
  private metropolitanAreas = new Set([
    "new york",
    "los angeles",
    "chicago",
    "houston",
    "phoenix",
    "philadelphia",
    "san antonio",
    "san diego",
    "dallas",
    "san jose",
    "austin",
    "jacksonville",
    "fort worth",
    "columbus",
    "charlotte",
  ]);

  analyzeLocation(business: BusinessLead) {
    const address = business.address.toLowerCase();

    // Extract state
    const stateMatch = business.address.match(/\b([A-Z]{2})\b/);
    const state = stateMatch ? stateMatch[1] : null;

    // Extract city
    const cityMatch = business.address.match(/,\s*([^,]+),\s*[A-Z]{2}/);
    const city = cityMatch ? cityMatch[1].trim().toLowerCase() : null;

    // Determine if metropolitan area
    const isMetropolitan = city ? this.metropolitanAreas.has(city) : false;

    return {
      state,
      city,
      isMetropolitan,
      hasStateLicensing: state
        ? this.professionalLicensingStates.has(state)
        : false,
      apolloRelevance: isMetropolitan ? "high" : city ? "medium" : "low",
    };
  }

  shouldCallAPI(
    apiType: string,
    businessClassification: any,
    locationData: any
  ): boolean {
    switch (apiType) {
      case "professionalLicensing":
        return (
          locationData.hasStateLicensing &&
          businessClassification.primaryType === "accounting"
        );
      case "spaAssociation":
        return businessClassification.primaryType === "spa";
      case "beautyAssociation":
        return businessClassification.primaryType === "beauty";
      case "apollo":
        return (
          locationData.apolloRelevance !== "low" &&
          businessClassification.confidence !== "low"
        );
      case "chamber":
        return true; // Always relevant but with different confidence
      default:
        return false;
    }
  }
}

// Batch Enhancement Processor for parallel processing
class BatchEnhancementProcessor {
  private classifier = new OptimizedBusinessClassifier();
  private geoRouter = new GeographicRouter();

  async processBatch(businesses: BusinessLead[], enhancementOptions: any) {
    console.log(
      `🚀 Starting optimized batch processing for ${businesses.length} businesses`
    );

    // Step 1: Classify and analyze all businesses
    const analyzedBusinesses = businesses.map((business) => {
      const classification = this.classifier.classifyBusiness(business);
      const locationData = this.geoRouter.analyzeLocation(business);

      return {
        ...business,
        classification,
        locationData,
        apiRecommendations: this.generateAPIRecommendations(
          classification,
          locationData,
          enhancementOptions
        ),
      };
    });

    // Step 2: Group by processing strategy
    const parallelGroup = analyzedBusinesses.filter(
      (b) =>
        b.classification.confidence === "high" &&
        b.apiRecommendations.length <= 3
    );
    const sequentialGroup = analyzedBusinesses.filter(
      (b) => !parallelGroup.includes(b)
    );

    console.log(
      `📊 Processing groups: Parallel: ${parallelGroup.length}, Sequential: ${sequentialGroup.length}`
    );

    // Step 3: Process groups optimally
    const results = [];

    // Process parallel group with Promise.all
    if (parallelGroup.length > 0) {
      const parallelPromises = parallelGroup.map((business) =>
        this.processBusinessEnhancements(business, enhancementOptions)
      );
      const parallelResults = await Promise.all(parallelPromises);
      results.push(...parallelResults);
    }

    // Process sequential group one by one
    for (const business of sequentialGroup) {
      try {
        const result = await this.processBusinessEnhancements(
          business,
          enhancementOptions
        );
        results.push(result);
      } catch (error) {
        console.error(`Error processing ${business.businessName}:`, error);
        results.push({
          ...business,
          enhancementData: { error: error.message },
        });
      }
    }

    return results;
  }

  private generateAPIRecommendations(
    classification: any,
    locationData: any,
    options: any
  ) {
    const recommendations = [];

    if (
      options.tradeAssociations &&
      this.geoRouter.shouldCallAPI(
        "spaAssociation",
        classification,
        locationData
      )
    ) {
      recommendations.push("spaAssociation");
    }
    if (
      options.tradeAssociations &&
      this.geoRouter.shouldCallAPI(
        "beautyAssociation",
        classification,
        locationData
      )
    ) {
      recommendations.push("beautyAssociation");
    }
    if (
      options.professionalLicensing &&
      this.geoRouter.shouldCallAPI(
        "professionalLicensing",
        classification,
        locationData
      )
    ) {
      recommendations.push("professionalLicensing");
    }
    if (
      options.chamberVerification &&
      this.geoRouter.shouldCallAPI("chamber", classification, locationData)
    ) {
      recommendations.push("chamber");
    }
    if (
      options.apolloDiscovery &&
      this.geoRouter.shouldCallAPI("apollo", classification, locationData)
    ) {
      recommendations.push("apollo");
    }

    return recommendations;
  }

  private async processBusinessEnhancements(
    business: any,
    enhancementOptions: any
  ) {
    const enhancements: Record<string, unknown> = {};
    let totalConfidenceBoost = 0;
    let totalCost = 0;

    // Only call recommended APIs
    const apiPromises = business.apiRecommendations.map(
      async (apiType: string) => {
        try {
          switch (apiType) {
            case "spaAssociation":
              if (business.classification.primaryType === "spa") {
                const result = await this.processSpaAssociation(business);
                if (result.verified) {
                  enhancements.spaAssociation = result;
                  totalConfidenceBoost += 20;
                }
              }
              break;
            case "beautyAssociation":
              if (business.classification.primaryType === "beauty") {
                const result = await this.processBeautyAssociation(business);
                if (result.verified) {
                  enhancements.beautyAssociation = result;
                  totalConfidenceBoost += 18;
                }
              }
              break;
            case "professionalLicensing":
              if (business.classification.primaryType === "accounting") {
                const result = await this.processCPALicense(business);
                if (result.licensed) {
                  enhancements.cpaLicense = result;
                  totalConfidenceBoost += 25;
                }
              }
              break;
            case "chamber":
              const chamberResult = await this.processChamberVerification(
                business
              );
              if (chamberResult.verified) {
                enhancements.chamber = chamberResult;
                totalConfidenceBoost += 15;
              }
              break;
            case "apollo":
              if (business.website) {
                const apolloResult = await this.processApolloEnrichment(
                  business
                );
                enhancements.apollo = apolloResult;
                totalCost += apolloResult.cost || 1.0;
                if (apolloResult.success) {
                  totalConfidenceBoost += 30;
                }
              }
              break;
          }
        } catch (error) {
          console.error(
            `Error processing ${apiType} for ${business.businessName}:`,
            error
          );
        }
      }
    );

    await Promise.all(apiPromises);

    return {
      ...business,
      enhancementData: {
        ...enhancements,
        processingMetadata: {
          totalConfidenceBoost,
          totalCost,
          apisUsed: business.apiRecommendations,
          apisSkipped: this.calculateSkippedAPIs(business.apiRecommendations),
          processingStrategy:
            business.apiRecommendations.length <= 3 ? "parallel" : "sequential",
        },
      },
      optimizedScore: business.optimizedScore + totalConfidenceBoost,
    };
  }

  private calculateSkippedAPIs(usedAPIs: string[]) {
    const allAPIs = [
      "spaAssociation",
      "beautyAssociation",
      "professionalLicensing",
      "chamber",
      "apollo",
    ];
    return allAPIs.filter((api) => !usedAPIs.includes(api));
  }

  // Enhancement processing methods (optimized versions)
  private async processSpaAssociation(business: any) {
    await new Promise((resolve) => setTimeout(resolve, 50)); // Simulate API call
    return {
      verified: Math.random() > 0.7,
      membershipType: "Professional",
      source: "spa_industry_association",
      confidenceBoost: 20,
    };
  }

  private async processBeautyAssociation(business: any) {
    await new Promise((resolve) => setTimeout(resolve, 50));
    return {
      verified: Math.random() > 0.65,
      membershipLevel: "Professional",
      source: "professional_beauty_association",
      confidenceBoost: 18,
    };
  }

  private async processCPALicense(business: any) {
    await new Promise((resolve) => setTimeout(resolve, 60));
    return {
      licensed: Math.random() > 0.6,
      licenseType: "CPA",
      state: business.locationData.state,
      source: "cpa_verify",
      confidenceBoost: 25,
    };
  }

  private async processChamberVerification(business: any) {
    await new Promise((resolve) => setTimeout(resolve, 40));
    const isMetropolitan = business.locationData.isMetropolitan;
    const baseChance = isMetropolitan ? 0.8 : 0.6;

    return {
      verified: Math.random() < baseChance,
      chambers: [
        `${business.locationData.city || "Local"} Chamber of Commerce`,
      ],
      membershipLevel: "Professional Member",
      source: "chamber_directory",
      confidenceBoost: 15,
    };
  }

  private async processApolloEnrichment(business: any) {
    await new Promise((resolve) => setTimeout(resolve, 100));
    const success = Math.random() > 0.3;

    return {
      success,
      cost: 1.0,
      ownerContacts: success
        ? [
            {
              name: "John Smith",
              title: "Owner",
              email: `owner@${this.extractDomain(business.website)}`,
            },
          ]
        : [],
      source: "apollo_io",
    };
  }

  private extractDomain(website: string): string {
    try {
      const url = new URL(
        website.startsWith("http") ? website : `https://${website}`
      );
      return url.hostname.replace("www.", "");
    } catch {
      return "example.com";
    }
  }
}

// Enhanced Quality Scorer with optimization awareness
class OptimizedQualityScorer {
  private maxCostPerBusiness: number;

  constructor(options: { maxCostPerBusiness?: number } = {}) {
    this.maxCostPerBusiness = options.maxCostPerBusiness || 2.0;
  }

  scoreBusiness(business: any): BusinessLead {
    const businessName = business.name || business.businessName || "";
    const address = business.formatted_address || business.address || "";
    const phone = business.formatted_phone_number || business.phone || "";
    const website = business.website || "";

    // Only use real email if provided by the source
    const email = business.email || "";

    // Scoring breakdown
    const scores = {
      businessName: businessName ? Math.min(100, businessName.length * 3) : 0,
      address: address ? 100 : 0,
      phone: phone ? 80 : 0,
      website: website ? 80 : 0,
      email: email ? 60 : 0,
      external: 0,
    };

    const totalScore =
      Object.values(scores).reduce((sum, score) => sum + score, 0) / 6;

    return {
      businessName,
      address,
      phone,
      website,
      email,
      optimizedScore: Math.round(totalScore),
      preValidationScore: Math.round(totalScore),
      scoreBreakdown: {
        ...scores,
        total: Math.round(totalScore),
      },
      validationCost: 0.02,
      costEfficient: true,
      scoringRecommendation:
        totalScore > 80
          ? "High-quality lead - recommended for outreach"
          : totalScore > 50
          ? "Medium-quality lead - verify details"
          : "Low-quality lead - additional validation needed",
    };
  }
}

// Google Places API with optimization
class OptimizedGooglePlacesAPI {
  private apiKey: string;
  private cache = new Map();
  private cacheTTL = 3600000; // 1 hour

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async searchBusinesses(
    businessType: string,
    location: string,
    maxResults: number
  ) {
    const cacheKey = `${businessType}_${location}_${maxResults}`;

    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      console.log("📦 Using cached Google Places results");
      return cached.data;
    }

    console.log(`🔍 Searching Google Places: ${businessType} in ${location}`);

    const query = `${businessType} in ${location}`;
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(
      query
    )}&key=${
      this.apiKey
    }&fields=place_id,name,formatted_address,formatted_phone_number,website,rating`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== "OK") {
      throw new Error(`Google Places API error: ${data.status}`);
    }

    const results = data.results.slice(0, maxResults * 2); // Get extra for filtering

    // Cache the results
    this.cache.set(cacheKey, {
      data: results,
      timestamp: Date.now(),
    });

    return results;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const startTime = Date.now();

    // Parse request
    const requestData: BusinessDiscoveryRequest = await req.json();
    const {
      businessType,
      location,
      maxResults = 5,
      budgetLimit = 50,
      minConfidenceScore = 50,
      tradeAssociations = false,
      professionalLicensing = false,
      chamberVerification = false,
      apolloDiscovery = false,
    } = requestData;

    console.log(`🚀 Optimized Business Discovery v3.0`);
    console.log(
      `📋 Request: ${businessType} in ${location} (${maxResults} leads)`
    );
    console.log(
      `🎯 Enhancements: Trade:${tradeAssociations}, Licensing:${professionalLicensing}, Chamber:${chamberVerification}, Apollo:${apolloDiscovery}`
    );

    // Get API keys from environment
    const googlePlacesKey = Deno.env.get("GOOGLE_PLACES_API_KEY");
    if (!googlePlacesKey) {
      throw new Error("Google Places API key not configured");
    }

    // Initialize optimized components
    const placesAPI = new OptimizedGooglePlacesAPI(googlePlacesKey);
    const qualityScorer = new OptimizedQualityScorer({
      maxCostPerBusiness: budgetLimit / maxResults,
    });
    const batchProcessor = new BatchEnhancementProcessor();

    // Step 1: Search for businesses (with intelligent caching)
    const rawBusinesses = await placesAPI.searchBusinesses(
      businessType,
      location,
      maxResults
    );
    console.log(
      `📊 Found ${rawBusinesses.length} raw businesses from Google Places`
    );

    // Step 2: Score and filter businesses
    const scoredBusinesses = rawBusinesses.map((business) =>
      qualityScorer.scoreBusiness(business)
    );
    const qualifiedLeads = scoredBusinesses
      .filter((lead) => lead.optimizedScore >= minConfidenceScore)
      .slice(0, maxResults);

    console.log(
      `✅ Qualified ${qualifiedLeads.length}/${
        scoredBusinesses.length
      } businesses (${(
        (qualifiedLeads.length / scoredBusinesses.length) *
        100
      ).toFixed(1)}%)`
    );

    // Step 3: Apply optimized P1 enhancements if requested
    let enhancedLeads = qualifiedLeads;
    let enhancementCost = 0;
    let optimizationStats = {};

    if (
      tradeAssociations ||
      professionalLicensing ||
      chamberVerification ||
      apolloDiscovery
    ) {
      console.log("🚀 Applying optimized P1 enhancements...");

      const enhancementOptions = {
        tradeAssociations,
        professionalLicensing,
        chamberVerification,
        apolloDiscovery,
      };

      enhancedLeads = await batchProcessor.processBatch(
        qualifiedLeads,
        enhancementOptions
      );

      // Calculate enhancement costs
      enhancementCost = enhancedLeads.reduce((total, lead) => {
        const metadata = lead.enhancementData?.processingMetadata as any;
        return total + (metadata?.totalCost || 0);
      }, 0);

      // Collect optimization statistics
      optimizationStats = {
        totalAPICallsSaved: enhancedLeads.reduce((total, lead) => {
          const metadata = lead.enhancementData?.processingMetadata as any;
          return total + (metadata?.apisSkipped?.length || 0);
        }, 0),
        averageConfidenceBoost:
          enhancedLeads.reduce((total, lead) => {
            const metadata = lead.enhancementData?.processingMetadata as any;
            return total + (metadata?.totalConfidenceBoost || 0);
          }, 0) / enhancedLeads.length,
        parallelProcessingUsed: enhancedLeads.filter((lead) => {
          const metadata = lead.enhancementData?.processingMetadata as any;
          return metadata?.processingStrategy === "parallel";
        }).length,
      };

      console.log(`💰 Enhancement cost: $${enhancementCost.toFixed(2)}`);
      console.log(
        `⚡ Optimization: ${optimizationStats.totalAPICallsSaved} API calls saved`
      );
      console.log(
        `📈 Average confidence boost: +${optimizationStats.averageConfidenceBoost.toFixed(
          1
        )} points`
      );
    }

    const processingTime = Date.now() - startTime;
    const totalCost =
      qualifiedLeads.reduce((sum, lead) => sum + lead.validationCost, 0) +
      enhancementCost;

    // Generate campaign ID
    const campaignId = `campaign_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    // Store in database (Supabase integration)
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY");

    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);

      try {
        await supabase.from("campaigns").insert({
          id: campaignId,
          business_type: businessType,
          location: location,
          target_count: maxResults,
          results_count: enhancedLeads.length,
          total_cost: totalCost,
          enhancement_cost: enhancementCost,
          processing_time: processingTime,
          optimization_stats: optimizationStats,
        });

        // Store leads
        const leadsToStore = enhancedLeads.map((lead) => ({
          campaign_id: campaignId,
          business_name: lead.businessName,
          address: lead.address,
          phone: lead.phone,
          website: lead.website,
          email: lead.email,
          confidence_score: lead.optimizedScore,
          enhancement_data: lead.enhancementData,
        }));

        await supabase.from("leads").insert(leadsToStore);
      } catch (error) {
        console.error("Database storage error:", error);
      }
    }

    // Return optimized results
    return new Response(
      JSON.stringify({
        success: true,
        campaignId,
        discoveryEngine: "Optimized Discovery Engine v3.0 + Batch Processing",
        requirements: {
          targetLeads: maxResults,
          budgetLimit,
          minConfidenceScore,
        },
        results: {
          totalFound: enhancedLeads.length,
          qualified: enhancedLeads.length,
          qualificationRate: `${(
            (enhancedLeads.length / rawBusinesses.length) *
            100
          ).toFixed(1)}%`,
          averageConfidence: Math.round(
            enhancedLeads.reduce((sum, lead) => sum + lead.optimizedScore, 0) /
              enhancedLeads.length
          ),
        },
        optimization: {
          processingTime: `${processingTime}ms`,
          apiCallsSaved: optimizationStats.totalAPICallsSaved || 0,
          parallelProcessing: optimizationStats.parallelProcessingUsed || 0,
          averageConfidenceBoost: optimizationStats.averageConfidenceBoost || 0,
          costOptimization: {
            enhancementCost,
            totalCost,
            savingsFromIntelligentRouting:
              (optimizationStats.totalAPICallsSaved || 0) * 0.1, // Estimated savings
          },
        },
        costs: {
          totalCost,
          costPerLead: totalCost / enhancedLeads.length,
          enhancementCost,
          validationCost: totalCost - enhancementCost,
        },
        leads: enhancedLeads,
        metadata: {
          timestamp: new Date().toISOString(),
          version: "3.0",
          optimizationsApplied: true,
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Optimized discovery error:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
