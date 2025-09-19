// Enhanced Business Discovery Edge Function
// Integrates Google Places, Enhanced State Registry, and ZeroBounce validation
// Zero Fake Data Policy - All business data from real APIs

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { textSearch, PlaceResult } from "../_shared/google-places.ts";
import { EnhancedStateRegistryClient, StateRegistryResult } from "../_shared/enhanced-state-registry.ts";
import { ZeroBounceClient, EmailValidationResult } from "../_shared/zerobounce.ts";

interface EnhancedDiscoveryRequest {
  query: string;
  location: string;
  radius?: number;
  maxResults?: number;
  budgetLimit?: number;
  qualityThreshold?: number;
  enableRegistryValidation?: boolean;
  enableEmailValidation?: boolean;
  costOptimized?: boolean;
}

interface EnhancedBusinessResult {
  // Core business data from Google Places
  name: string;
  address: string;
  phone?: string;
  website?: string;
  rating?: number;
  placeId: string;
  
  // Enhanced validation data
  stateRegistryValidation?: StateRegistryResult;
  emailValidation?: EmailValidationResult;
  websiteValidation?: {
    accessible: boolean;
    statusCode?: number;
    responseTime?: number;
    error?: string;
  };
  
  // Confidence and qualification scoring
  preValidationScore: number;
  postValidationScore: number;
  finalConfidenceScore: number;
  qualified: boolean;
  
  // Cost tracking
  processingCost: number;
  
  // Processing metadata
  stage: string;
  timestamp: string;
}

interface EnhancedDiscoveryResponse {
  query: string;
  location: string;
  totalFound: number;
  totalProcessed: number;
  qualifiedResults: number;
  qualificationRate: number;
  businesses: EnhancedBusinessResult[];
  
  // Enhanced validation statistics
  dataEnhancements: {
    stateRegistryValidations: {
      totalChecked: number;
      validatedBusinesses: number;
      validationRate: number;
    };
    emailValidations: {
      totalValidated: number;
      deliverableEmails: number;
      deliverabilityRate: number;
    };
    websiteValidations: {
      totalChecked: number;
      accessibleWebsites: number;
      accessibilityRate: number;
    };
    qualityImprovements: {
      leadsEnhanced: number;
      enhancedValidationCost: string;
      governmentAPIsSources: number;
      totalFreeAPIsUsed: number;
    };
  };
  
  // Cost and performance metrics
  totalCost: number;
  processingTime: number;
  apiCalls: {
    googlePlaces: number;
    stateRegistry: number;
    emailValidation: number;
    websiteChecks: number;
  };
  
  timestamp: string;
}

console.log("Enhanced ProspectPro Business Discovery Edge Function loaded");

// Enhanced business discovery with 4-stage validation pipeline
class EnhancedBusinessDiscovery {
  private stateRegistry: EnhancedStateRegistryClient;
  private zeroBounce: ZeroBounceClient;
  private totalCost = 0;
  private apiCalls = {
    googlePlaces: 0,
    stateRegistry: 0,
    emailValidation: 0,
    websiteChecks: 0,
  };

  constructor() {
    this.stateRegistry = new EnhancedStateRegistryClient();
    this.zeroBounce = new ZeroBounceClient();
  }

  async discover(request: EnhancedDiscoveryRequest): Promise<EnhancedDiscoveryResponse> {
    const startTime = Date.now();
    const {
      query,
      location,
      radius = 5000,
      maxResults = 20,
      budgetLimit = 25.0,
      qualityThreshold = 75,
      enableRegistryValidation = true,
      enableEmailValidation = true,
      costOptimized = true,
    } = request;

    console.log(`🚀 Enhanced business discovery: "${query}" in "${location}"`);
    console.log(`💰 Budget: $${budgetLimit}, Quality threshold: ${qualityThreshold}%`);

    // Stage 1: Google Places Discovery (Primary Source)
    console.log("📍 Stage 1: Google Places Discovery");
    const placesResult = await textSearch({
      query: `${query} in ${location}`,
      radiusMeters: radius,
      language: "en",
    });

    this.apiCalls.googlePlaces++;
    this.totalCost += placesResult.meta.costUsdEstimate;

    if (!placesResult.ok || placesResult.results.length === 0) {
      return this.createEmptyResponse(request, Date.now() - startTime);
    }

    console.log(`Found ${placesResult.results.length} businesses from Google Places`);

    // Stage 2: Pre-validation Filtering
    console.log("🎯 Stage 2: Pre-validation Filtering");
    const preValidatedBusinesses = await this.preValidateBusinesses(
      placesResult.results.slice(0, maxResults),
      qualityThreshold
    );

    console.log(`${preValidatedBusinesses.length} businesses passed pre-validation`);

    // Stage 3: Enhanced Validation Pipeline
    console.log("🔍 Stage 3: Enhanced Validation Pipeline");
    const enhancedBusinesses = await this.processEnhancedValidation(
      preValidatedBusinesses,
      {
        budgetLimit: budgetLimit - this.totalCost,
        enableRegistryValidation,
        enableEmailValidation,
        costOptimized,
      }
    );

    // Stage 4: Final Qualification and Scoring
    console.log("✅ Stage 4: Final Qualification");
    const qualifiedBusinesses = enhancedBusinesses.filter(
      (business) => business.finalConfidenceScore >= qualityThreshold && business.qualified
    );

    console.log(`${qualifiedBusinesses.length} businesses qualified for export`);

    const processingTime = Date.now() - startTime;
    return this.createEnhancedResponse(
      request,
      placesResult.results,
      qualifiedBusinesses,
      processingTime
    );
  }

  private async preValidateBusinesses(places: PlaceResult[], threshold: number): Promise<EnhancedBusinessResult[]> {
    const results: EnhancedBusinessResult[] = [];

    for (const place of places) {
      const preValidationScore = this.calculatePreValidationScore(place);
      
      // Only proceed with businesses that meet minimum threshold
      if (preValidationScore >= threshold - 20) { // Allow 20 point buffer for enhancement
        results.push({
          name: place.name,
          address: place.formattedAddress || "",
          rating: place.rating,
          placeId: place.placeId,
          preValidationScore,
          postValidationScore: preValidationScore,
          finalConfidenceScore: preValidationScore,
          qualified: false,
          processingCost: 0,
          stage: "pre-validation",
          timestamp: new Date().toISOString(),
        });
      }
    }

    return results;
  }

  private calculatePreValidationScore(place: PlaceResult): number {
    let score = 0;

    // Business name quality (25 points max)
    if (place.name && !this.isGenericBusinessName(place.name)) {
      score += 25;
    } else if (place.name) {
      score += 10;
    }

    // Address completeness (20 points max)
    if (place.formattedAddress && this.isCompleteAddress(place.formattedAddress)) {
      score += 20;
    } else if (place.formattedAddress) {
      score += 10;
    }

    // Google rating and reviews (25 points max)
    if (place.rating && place.rating >= 4.0 && place.userRatingsTotal && place.userRatingsTotal >= 10) {
      score += 25;
    } else if (place.rating && place.rating >= 3.5) {
      score += 15;
    } else if (place.rating) {
      score += 5;
    }

    // Business status (15 points max)
    if (place.businessStatus === "OPERATIONAL") {
      score += 15;
    } else if (place.businessStatus === "CLOSED_TEMPORARILY") {
      score += 5;
    }

    // Location data (15 points max)
    if (place.lat && place.lng) {
      score += 15;
    }

    return Math.min(score, 100);
  }

  private async processEnhancedValidation(
    businesses: EnhancedBusinessResult[],
    options: {
      budgetLimit: number;
      enableRegistryValidation: boolean;
      enableEmailValidation: boolean;
      costOptimized: boolean;
    }
  ): Promise<EnhancedBusinessResult[]> {
    const results: EnhancedBusinessResult[] = [];

    for (const business of businesses) {
      try {
        // Check budget before processing each business
        if (this.totalCost >= options.budgetLimit) {
          console.warn(`⚠️ Budget limit reached: $${this.totalCost.toFixed(2)}`);
          break;
        }

        let stageStartCost = this.totalCost;

        // Enhanced State Registry Validation (FREE)
        if (options.enableRegistryValidation && business.preValidationScore >= 70) {
          console.log(`🏛️ State registry validation for ${business.name}`);
          try {
            business.stateRegistryValidation = await this.stateRegistry.searchBusinessAcrossStates(
              business.name,
              business.address
            );
            this.apiCalls.stateRegistry += business.stateRegistryValidation.qualityMetrics.totalAPIsQueried;
          } catch (error) {
            console.error(`State registry validation failed for ${business.name}:`, error);
          }
        }

        // Website Validation (FREE)
        if (business.website) {
          business.websiteValidation = await this.validateWebsite(business.website);
          this.apiCalls.websiteChecks++;
        }

        // Email Validation (PAID - Cost Controlled)
        if (options.enableEmailValidation && 
            business.website && 
            this.zeroBounce.canMakeRequest(options.budgetLimit - this.totalCost) &&
            business.preValidationScore >= 80) {
          
          console.log(`📧 Email validation for ${business.name}`);
          try {
            const domain = this.extractDomain(business.website);
            const emailGuess = `info@${domain}`;
            
            business.emailValidation = await this.zeroBounce.validateEmail(emailGuess);
            this.apiCalls.emailValidation++;
            this.totalCost += business.emailValidation.cost;
          } catch (error) {
            console.error(`Email validation failed for ${business.name}:`, error);
          }
        }

        // Calculate post-validation scores
        business.postValidationScore = this.calculatePostValidationScore(business);
        business.finalConfidenceScore = this.calculateFinalConfidenceScore(business);
        business.qualified = business.finalConfidenceScore >= 70;
        business.processingCost = this.totalCost - stageStartCost;
        business.stage = "enhanced-validation";
        business.timestamp = new Date().toISOString();

        results.push(business);

        console.log(`✅ Enhanced ${business.name}: Score ${business.finalConfidenceScore}% (${business.qualified ? 'QUALIFIED' : 'NOT QUALIFIED'})`);

      } catch (error) {
        console.error(`Error processing business ${business.name}:`, error);
        // Include business with error state
        business.qualified = false;
        business.finalConfidenceScore = 0;
        business.stage = "error";
        results.push(business);
      }
    }

    return results;
  }

  private calculatePostValidationScore(business: EnhancedBusinessResult): number {
    let score = business.preValidationScore;

    // State Registry Validation Boost (+15 points max)
    if (business.stateRegistryValidation?.isLegitimate) {
      score += 15;
    } else if (business.stateRegistryValidation?.confidenceScore > 50) {
      score += Math.round(business.stateRegistryValidation.confidenceScore * 0.15);
    }

    // Website Validation Boost (+10 points max)
    if (business.websiteValidation?.accessible) {
      score += 10;
    }

    // Email Validation Boost (+10 points max)
    if (business.emailValidation?.isValid && business.emailValidation.confidence >= 80) {
      score += 10;
    } else if (business.emailValidation?.confidence > 50) {
      score += Math.round(business.emailValidation.confidence * 0.1);
    }

    return Math.min(score, 100);
  }

  private calculateFinalConfidenceScore(business: EnhancedBusinessResult): number {
    const weights = {
      preValidation: 0.4,
      stateRegistry: 0.25,
      website: 0.2,
      email: 0.15,
    };

    let weightedSum = business.preValidationScore * weights.preValidation;
    let totalWeight = weights.preValidation;

    if (business.stateRegistryValidation) {
      weightedSum += business.stateRegistryValidation.confidenceScore * weights.stateRegistry;
      totalWeight += weights.stateRegistry;
    }

    if (business.websiteValidation) {
      const websiteScore = business.websiteValidation.accessible ? 95 : 20;
      weightedSum += websiteScore * weights.website;
      totalWeight += weights.website;
    }

    if (business.emailValidation) {
      weightedSum += business.emailValidation.confidence * weights.email;
      totalWeight += weights.email;
    }

    return totalWeight > 0 ? Math.round(weightedSum / totalWeight) : business.preValidationScore;
  }

  private async validateWebsite(url: string): Promise<any> {
    try {
      const startTime = Date.now();
      const websiteUrl = url.startsWith("http") ? url : `https://${url}`;
      
      const response = await fetch(websiteUrl, {
        method: "HEAD",
        headers: { "User-Agent": "ProspectPro-Validator/1.0" },
      });
      
      const responseTime = Date.now() - startTime;
      const accessible = response.status >= 200 && response.status < 400;
      
      return {
        accessible,
        statusCode: response.status,
        responseTime,
        error: null,
      };
    } catch (error) {
      return {
        accessible: false,
        error: (error as Error).message,
      };
    }
  }

  private extractDomain(website: string): string {
    try {
      const url = new URL(website.startsWith("http") ? website : `https://${website}`);
      return url.hostname.replace("www.", "");
    } catch {
      return website.replace(/^https?:\/\//, "").replace("www.", "").split("/")[0];
    }
  }

  private isGenericBusinessName(name: string): boolean {
    const genericPatterns = [
      /business\s+(llc|inc|corp)/i,
      /company\s+(llc|inc|corp)/i,
      /^(business|company)$/i,
      /test\s*business/i
    ];
    return genericPatterns.some(pattern => pattern.test(name));
  }

  private isCompleteAddress(address: string): boolean {
    return address &&
           address.length > 10 &&
           /\d/.test(address) &&
           /[a-zA-Z]/.test(address) &&
           !address.includes('Main St, Main St');
  }

  private createEmptyResponse(request: EnhancedDiscoveryRequest, processingTime: number): EnhancedDiscoveryResponse {
    return {
      query: `${request.query} in ${request.location}`,
      location: request.location,
      totalFound: 0,
      totalProcessed: 0,
      qualifiedResults: 0,
      qualificationRate: 0,
      businesses: [],
      dataEnhancements: {
        stateRegistryValidations: { totalChecked: 0, validatedBusinesses: 0, validationRate: 0 },
        emailValidations: { totalValidated: 0, deliverableEmails: 0, deliverabilityRate: 0 },
        websiteValidations: { totalChecked: 0, accessibleWebsites: 0, accessibilityRate: 0 },
        qualityImprovements: { leadsEnhanced: 0, enhancedValidationCost: "0.000", governmentAPIsSources: 7, totalFreeAPIsUsed: 0 },
      },
      totalCost: this.totalCost,
      processingTime,
      apiCalls: this.apiCalls,
      timestamp: new Date().toISOString(),
    };
  }

  private createEnhancedResponse(
    request: EnhancedDiscoveryRequest,
    originalPlaces: PlaceResult[],
    qualifiedBusinesses: EnhancedBusinessResult[],
    processingTime: number
  ): EnhancedDiscoveryResponse {
    // Calculate enhancement statistics
    const stateRegistryChecks = qualifiedBusinesses.filter(b => b.stateRegistryValidation).length;
    const validatedByRegistry = qualifiedBusinesses.filter(b => b.stateRegistryValidation?.isLegitimate).length;
    
    const emailChecks = qualifiedBusinesses.filter(b => b.emailValidation).length;
    const deliverableEmails = qualifiedBusinesses.filter(b => b.emailValidation?.isValid).length;
    
    const websiteChecks = qualifiedBusinesses.filter(b => b.websiteValidation).length;
    const accessibleWebsites = qualifiedBusinesses.filter(b => b.websiteValidation?.accessible).length;

    return {
      query: `${request.query} in ${request.location}`,
      location: request.location,
      totalFound: originalPlaces.length,
      totalProcessed: qualifiedBusinesses.length,
      qualifiedResults: qualifiedBusinesses.filter(b => b.qualified).length,
      qualificationRate: qualifiedBusinesses.length > 0 
        ? Math.round((qualifiedBusinesses.filter(b => b.qualified).length / qualifiedBusinesses.length) * 100)
        : 0,
      businesses: qualifiedBusinesses,
      
      dataEnhancements: {
        stateRegistryValidations: {
          totalChecked: stateRegistryChecks,
          validatedBusinesses: validatedByRegistry,
          validationRate: stateRegistryChecks > 0 ? Math.round((validatedByRegistry / stateRegistryChecks) * 100) : 0,
        },
        emailValidations: {
          totalValidated: emailChecks,
          deliverableEmails: deliverableEmails,
          deliverabilityRate: emailChecks > 0 ? Math.round((deliverableEmails / emailChecks) * 100) : 0,
        },
        websiteValidations: {
          totalChecked: websiteChecks,
          accessibleWebsites: accessibleWebsites,
          accessibilityRate: websiteChecks > 0 ? Math.round((accessibleWebsites / websiteChecks) * 100) : 0,
        },
        qualityImprovements: {
          leadsEnhanced: qualifiedBusinesses.length,
          enhancedValidationCost: this.totalCost.toFixed(3),
          governmentAPIsSources: 7,
          totalFreeAPIsUsed: this.apiCalls.stateRegistry,
        },
      },
      
      totalCost: this.totalCost,
      processingTime,
      apiCalls: this.apiCalls,
      timestamp: new Date().toISOString(),
    };
  }
}

// Main Deno.serve handler
Deno.serve(async (req) => {
  // CORS headers
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
        "Access-Control-Allow-Headers": "apikey, X-Client-Info, Content-Type, Authorization",
      },
    });
  }

  try {
    const requestData: EnhancedDiscoveryRequest = await req.json();

    if (!requestData.query || !requestData.location) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields: query and location",
          required: ["query", "location"],
          optional: ["radius", "maxResults", "budgetLimit", "qualityThreshold"],
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    // Check for required API keys
    const googleApiKey = Deno.env.get("GOOGLE_PLACES_API_KEY");
    if (!googleApiKey) {
      return new Response(
        JSON.stringify({ error: "Google Places API key not configured" }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    console.log(`Enhanced discovery request: ${requestData.query} in ${requestData.location}`);

    // Initialize enhanced discovery engine
    const discovery = new EnhancedBusinessDiscovery();
    const response = await discovery.discover(requestData);

    console.log(`✅ Enhanced discovery complete: ${response.qualifiedResults}/${response.totalFound} qualified leads`);
    console.log(`💰 Total cost: $${response.totalCost.toFixed(3)}`);

    return new Response(
      JSON.stringify(response),
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );

  } catch (error) {
    console.error("Enhanced business discovery error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: (error as Error).message,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
});

/* To test locally:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/enhanced-business-discovery' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{
      "query": "restaurants",
      "location": "San Francisco, CA",
      "maxResults": 5,
      "budgetLimit": 10.0,
      "qualityThreshold": 75,
      "enableRegistryValidation": true,
      "enableEmailValidation": true,
      "costOptimized": true
    }'

*/