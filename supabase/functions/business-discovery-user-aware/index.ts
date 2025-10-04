import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  EdgeFunctionAuth,
  corsHeaders,
  handleCORS,
} from "../_shared/edge-auth.ts";

// Business Discovery with User-Campaign Linking
// October 4, 2025 - Complete authentication and user management

interface BusinessDiscoveryRequest {
  businessType: string;
  location: string;
  maxResults?: number;
  budgetLimit?: number;
  requireCompleteContacts?: boolean;
  minConfidenceScore?: number;
  // User session management
  sessionUserId?: string;
  userEmail?: string;
}

interface BusinessLead {
  businessName: string;
  address: string;
  phone: string;
  website: string;
  email: string;
  optimizedScore: number;
  validationCost: number;
  enhancementData: {
    verificationSources: string[];
    apolloVerified: boolean;
    chamberVerified: boolean;
    licenseVerified: boolean;
    processingMetadata: {
      totalCost: number;
      totalConfidenceBoost: number;
      apisSkipped: string[];
      processingStrategy: string;
    };
  };
}

// Helper function to get or extract user ID from request
function getUserContext(req: Request, requestData: BusinessDiscoveryRequest) {
  // Try to get user from JWT (authenticated users)
  const authHeader = req.headers.get("Authorization");
  let userFromJWT = null;

  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    try {
      // For JWT tokens, we can decode to get user info
      if (token.startsWith("eyJ")) {
        const payload = JSON.parse(atob(token.split(".")[1]));
        userFromJWT = payload.sub; // User ID from JWT
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

// Enhanced Quality Scorer with user context
class UserAwareQualityScorer {
  private maxCostPerBusiness: number;

  constructor(options: { maxCostPerBusiness?: number } = {}) {
    this.maxCostPerBusiness = options.maxCostPerBusiness || 2.0;
  }

  scoreBusiness(business: any): BusinessLead {
    const businessName = business.name || business.businessName || "";
    const address = business.formatted_address || business.address || "";
    const phone = business.formatted_phone_number || business.phone || "";
    const website = business.website || "";
    const email = business.email || "";

    // Scoring breakdown
    const scores = {
      businessName: businessName ? Math.min(100, businessName.length * 3) : 0,
      address: address ? 100 : 0,
      phone: phone ? 80 : 0,
      website: website ? 80 : 0,
      email: email ? 60 : 0,
    };

    const totalScore =
      Object.values(scores).reduce((sum, score) => sum + score, 0) / 5;

    return {
      businessName,
      address,
      phone,
      website,
      email,
      optimizedScore: Math.round(totalScore),
      validationCost: 0.02,
      enhancementData: {
        verificationSources: ["google_places"],
        apolloVerified: false,
        chamberVerified: false,
        licenseVerified: false,
        processingMetadata: {
          totalCost: 0.02,
          totalConfidenceBoost: 0,
          apisSkipped: [],
          processingStrategy: "basic",
        },
      },
    };
  }
}

// Real Google Places API integration with Place Details enrichment
async function discoverBusinesses(
  businessType: string,
  location: string,
  maxResults: number
): Promise<any[]> {
  const apiKey = Deno.env.get("GOOGLE_PLACES_API_KEY");

  if (!apiKey) {
    console.error("❌ GOOGLE_PLACES_API_KEY not configured");
    throw new Error("Google Places API key not configured");
  }

  console.log(`🔍 Searching Google Places: ${businessType} in ${location}`);

  // Step 1: Text Search to find businesses
  const query = `${businessType} in ${location}`;
  const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(
    query
  )}&key=${apiKey}`;

  const searchResponse = await fetch(searchUrl);
  const searchData = await searchResponse.json();

  console.log(`🔧 Google Places API status: ${searchData.status}`);

  if (searchData.status !== "OK") {
    console.error(`❌ Google Places API error: ${searchData.status}`);
    if (searchData.error_message) {
      console.error(`   Error message: ${searchData.error_message}`);
    }
    throw new Error(`Google Places API failed: ${searchData.status}`);
  }

  const results = searchData.results.slice(0, maxResults);
  console.log(
    `📊 Found ${results.length} businesses, enriching with Place Details...`
  );

  // Step 2: Enrich each business with Place Details API for complete contact info
  const enrichedBusinesses = [];
  for (const business of results) {
    try {
      const placeId = business.place_id;
      if (!placeId) {
        enrichedBusinesses.push(business);
        continue;
      }

      // Fetch complete contact information via Place Details API
      const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=formatted_phone_number,international_phone_number,website,url&key=${apiKey}`;

      const detailsResponse = await fetch(detailsUrl);
      const detailsData = await detailsResponse.json();

      if (detailsData.status === "OK" && detailsData.result) {
        // Merge Place Details into business data
        enrichedBusinesses.push({
          ...business,
          formatted_phone_number:
            detailsData.result.formatted_phone_number || "",
          website: detailsData.result.website || "",
          // Note: Google Places doesn't provide emails directly
          // Email discovery would require Hunter.io integration
        });
      } else {
        // Keep original data if Place Details fails
        enrichedBusinesses.push(business);
      }
    } catch (error) {
      console.error(`⚠️ Place Details error for ${business.name}:`, error);
      enrichedBusinesses.push(business); // Keep partial data
    }
  }

  console.log(
    `✅ Enriched ${enrichedBusinesses.length} businesses with verified contact data`
  );

  return enrichedBusinesses;
}

serve(async (req) => {
  // Handle CORS preflight
  const corsResponse = handleCORS(req);
  if (corsResponse) return corsResponse;

  try {
    const startTime = Date.now();

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
    const requestData: BusinessDiscoveryRequest = await req.json();
    const {
      businessType,
      location,
      maxResults = 5,
      budgetLimit = 50,
      minConfidenceScore = 50,
    } = requestData;

    console.log(
      `🚀 Business Discovery: ${businessType} in ${location} (${maxResults} results)`
    );

    // Get user context
    const userContext = getUserContext(req, requestData);
    console.log(`👤 User Context:`, userContext);

    // Initialize components
    const qualityScorer = new UserAwareQualityScorer({
      maxCostPerBusiness: budgetLimit / maxResults,
    });

    // Step 1: Business discovery with real Google Places API
    const rawBusinesses = await discoverBusinesses(
      businessType,
      location,
      maxResults
    );
    console.log(`📊 Found ${rawBusinesses.length} businesses`);

    // Step 2: Score and filter businesses
    const scoredBusinesses = rawBusinesses.map((business: any) =>
      qualityScorer.scoreBusiness(business)
    );
    const qualifiedLeads = scoredBusinesses
      .filter((lead: BusinessLead) => lead.optimizedScore >= minConfidenceScore)
      .slice(0, maxResults);

    console.log(
      `✅ Qualified ${qualifiedLeads.length}/${scoredBusinesses.length} businesses`
    );

    // Step 3: Progressive enrichment via orchestrator
    console.log(
      `🔄 Starting progressive enrichment for ${qualifiedLeads.length} leads...`
    );

    const enrichedLeads = [];
    let enrichmentTotalCost = 0;

    for (const lead of qualifiedLeads) {
      try {
        // Call enrichment orchestrator for each lead
        const enrichmentUrl = `https://sriycekxdqnesdsgwiuc.supabase.co/functions/v1/enrichment-orchestrator`;
        console.log(
          `🔄 Calling enrichment orchestrator for ${lead.businessName}...`
        );

        const enrichmentResponse = await fetch(enrichmentUrl, {
          method: "POST",
          headers: {
            Authorization: req.headers.get("Authorization") || "",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            businessName: lead.businessName,
            domain: lead.website
              ?.replace(/^https?:\/\//, "")
              .replace(/\/$/, ""),
            address: lead.address,
            phone: lead.phone,
            website: lead.website,

            // Progressive enrichment configuration
            includeBusinessLicense: true,
            discoverEmails: true,
            verifyEmails: true,
            includeCompanyEnrichment: false, // Skip PDL to save costs
            includePersonEnrichment: false, // Skip unless needed
            apolloEnrichment: false, // Skip unless premium tier

            // Budget controls
            maxCostPerBusiness: budgetLimit / maxResults,
            minConfidenceScore: minConfidenceScore,
            tier: "professional",
          }),
        });

        if (enrichmentResponse.ok) {
          const enrichmentData = await enrichmentResponse.json();
          console.log(
            `✅ Enrichment response for ${lead.businessName}:`,
            JSON.stringify(enrichmentData).substring(0, 200)
          );

          if (enrichmentData.success) {
            // Merge enrichment data into lead
            enrichedLeads.push({
              ...lead,
              email:
                enrichmentData.enrichedData?.emails?.[0]?.email || lead.email,
              emails: enrichmentData.enrichedData?.emails || [],
              businessLicense: enrichmentData.enrichedData?.businessLicense,
              validationCost: lead.validationCost + enrichmentData.totalCost,
              optimizedScore: Math.min(
                100,
                lead.optimizedScore + (enrichmentData.confidenceScore || 0)
              ),
              enhancementData: {
                ...lead.enhancementData,
                verificationSources: [
                  ...lead.enhancementData.verificationSources,
                  ...enrichmentData.processingMetadata.servicesUsed,
                ],
                hunterVerified: enrichmentData.enrichedData?.emails?.length > 0,
                neverBounceVerified: enrichmentData.enrichedData?.emails?.some(
                  (e: any) => e.verified
                ),
                licenseVerified:
                  enrichmentData.enrichedData?.businessLicense?.isValid ||
                  false,
                processingMetadata: {
                  ...lead.enhancementData.processingMetadata,
                  totalCost: lead.validationCost + enrichmentData.totalCost,
                  enrichmentCostBreakdown: enrichmentData.costBreakdown,
                  servicesUsed: enrichmentData.processingMetadata.servicesUsed,
                  servicesSkipped:
                    enrichmentData.processingMetadata.servicesSkipped,
                },
              },
            });

            enrichmentTotalCost += enrichmentData.totalCost;
            console.log(
              `✅ Enriched ${lead.businessName}: +${
                enrichmentData.enrichedData?.emails?.length || 0
              } emails, cost $${enrichmentData.totalCost}`
            );
          } else {
            // Keep original lead if enrichment fails
            enrichedLeads.push(lead);
            console.log(
              `⚠️ Enrichment failed for ${lead.businessName}, keeping original data`
            );
          }
        } else {
          const errorText = await enrichmentResponse.text();
          enrichedLeads.push(lead);
          console.log(
            `⚠️ Enrichment service returned status ${
              enrichmentResponse.status
            } for ${lead.businessName}: ${errorText.substring(0, 200)}`
          );
        }
      } catch (error) {
        // Keep original lead on error
        enrichedLeads.push(lead);
        console.error(`❌ Enrichment error for ${lead.businessName}:`, error);
      }
    }

    console.log(
      `✅ Enrichment complete: ${enrichedLeads.length} leads, total cost $${enrichmentTotalCost}`
    );

    const processingTime = Date.now() - startTime;
    const totalCost =
      enrichmentTotalCost +
      qualifiedLeads.reduce(
        (sum: number, lead: BusinessLead) => sum + lead.validationCost,
        0
      );

    // Generate campaign ID
    const campaignId = `campaign_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    // Store in database with user context and enriched data
    let dbStorageResult = null;
    if (authContext.client) {
      try {
        // Prepare campaign data with user context
        const campaignData = {
          id: campaignId,
          business_type: businessType,
          location: location,
          target_count: maxResults,
          results_count: enrichedLeads.length,
          total_cost: totalCost,
          processing_time_ms: processingTime,
          status: "completed",
          // Add user_id for authenticated users only
          ...(userContext.isAuthenticated &&
            userContext.userId && { user_id: userContext.userId }),
          // Add session_user_id for anonymous users
          ...(!userContext.isAuthenticated &&
            userContext.sessionId && {
              session_user_id: userContext.sessionId,
            }),
        };

        const { error: campaignError } = await authContext.client
          .from("campaigns")
          .insert(campaignData);

        if (campaignError) {
          dbStorageResult = { success: false, error: campaignError.message };
        } else {
          dbStorageResult = {
            success: true,
            campaign_stored: true,
            leads_error: null,
            leads_stored: 0,
          };

          // Store enriched leads with user context
          const leadsData = enrichedLeads.map((lead: any) => ({
            campaign_id: campaignId,
            business_name: lead.businessName,
            address: lead.address,
            phone: lead.phone,
            website: lead.website,
            email: lead.email,
            confidence_score: lead.optimizedScore,
            enrichment_data: lead.enhancementData,
            validation_cost: lead.validationCost,
            // Add user_id for authenticated users only
            ...(userContext.isAuthenticated &&
              userContext.userId && { user_id: userContext.userId }),
            // Add session_user_id for anonymous users
            ...(!userContext.isAuthenticated &&
              userContext.sessionId && {
                session_user_id: userContext.sessionId,
              }),
          }));

          const { error: leadsError } = await authContext.client
            .from("leads")
            .insert(leadsData);

          if (leadsError) {
            dbStorageResult.leads_error = leadsError.message;
          } else {
            dbStorageResult.leads_stored = leadsData.length;
          }
        }

        console.log(`💾 Database storage result:`, dbStorageResult);
      } catch (error) {
        dbStorageResult = {
          success: false,
          error: error instanceof Error ? error.message : "Storage failed",
          campaign_stored: false,
          leads_error: null,
          leads_stored: 0,
        };
      }
    }

    const response = {
      success: true,
      campaignId,
      discoveryEngine:
        "ProspectPro Business Discovery v4.2 - User-Aware with Progressive Enrichment",
      authentication: {
        keyFormat: authContext.keyFormat,
        isValid: authContext.isValid,
        userContext: {
          isAuthenticated: userContext.isAuthenticated,
          hasUserId: !!userContext.userId,
          hasEmail: !!userContext.userEmail,
        },
      },
      requirements: {
        targetLeads: maxResults,
        businessType,
        location,
        budgetLimit,
        minConfidenceScore,
      },
      results: {
        totalFound: enrichedLeads.length,
        qualified: enrichedLeads.length,
        qualificationRate: `${(
          (enrichedLeads.length / rawBusinesses.length) *
          100
        ).toFixed(1)}%`,
        averageConfidence: Math.round(
          enrichedLeads.reduce(
            (sum: number, lead: any) => sum + lead.optimizedScore,
            0
          ) / enrichedLeads.length
        ),
        emailsDiscovered: enrichedLeads.filter((lead: any) => lead.email)
          .length,
        licensesVerified: enrichedLeads.filter(
          (lead: any) => lead.businessLicense?.isValid
        ).length,
      },
      userManagement: {
        userId: userContext.userId,
        isAuthenticated: userContext.isAuthenticated,
        sessionId: userContext.sessionId,
        campaignOwnership: userContext.userId ? "user_owned" : "session_based",
      },
      optimization: {
        processingTime: `${processingTime}ms`,
        totalCost,
        costPerLead: totalCost / enrichedLeads.length,
        enrichmentCost: enrichmentTotalCost,
        discoveryCost: totalCost - enrichmentTotalCost,
      },
      database_storage: dbStorageResult,
      leads: enrichedLeads,
      metadata: {
        timestamp: new Date().toISOString(),
        version: "4.2",
        userAware: true,
        progressiveEnrichment: true,
        authenticationUpdated: true,
      },
    };

    return new Response(JSON.stringify(response, null, 2), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("❌ Business discovery error:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
