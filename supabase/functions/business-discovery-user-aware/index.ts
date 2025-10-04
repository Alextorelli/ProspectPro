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

// Mock business discovery for testing (replace with real Google Places API)
async function mockBusinessDiscovery(
  businessType: string,
  location: string,
  maxResults: number
): Promise<any[]> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 100));

  const businesses = [];
  for (let i = 1; i <= maxResults; i++) {
    businesses.push({
      name: `${businessType} Business ${i}`,
      formatted_address: `${100 + i} Main St, ${location}`,
      formatted_phone_number: `(555) ${String(i).padStart(3, "0")}-${String(
        i * 1000
      ).padStart(4, "0")}`,
      website: `https://business${i}.com`,
      email: `contact@business${i}.com`,
      rating: 4.0 + Math.random() * 1.0,
      business_status: "OPERATIONAL",
    });
  }

  return businesses;
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

    // Step 1: Business discovery (mock for now, replace with real APIs)
    const rawBusinesses = await mockBusinessDiscovery(
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

    const processingTime = Date.now() - startTime;
    const totalCost = qualifiedLeads.reduce(
      (sum: number, lead: BusinessLead) => sum + lead.validationCost,
      0
    );

    // Generate campaign ID
    const campaignId = `campaign_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    // Store in database with user context
    let dbStorageResult = null;
    if (authContext.client) {
      try {
        // Prepare campaign data with user context
        const campaignData = {
          id: campaignId,
          business_type: businessType,
          location: location,
          target_count: maxResults,
          results_count: qualifiedLeads.length,
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

        const { data: campaignInsert, error: campaignError } =
          await authContext.client.from("campaigns").insert(campaignData);

        if (campaignError) {
          dbStorageResult = { success: false, error: campaignError.message };
        } else {
          dbStorageResult = { success: true, campaign_stored: true };

          // Store leads with user context
          const leadsData = qualifiedLeads.map((lead) => ({
            campaign_id: campaignId,
            business_name: lead.businessName,
            address: lead.address,
            phone: lead.phone,
            website: lead.website,
            email: lead.email,
            confidence_score: lead.optimizedScore,
            enrichment_data: lead.enhancementData,
            // Add user_id for authenticated users only
            ...(userContext.isAuthenticated &&
              userContext.userId && { user_id: userContext.userId }),
            // Add session_user_id for anonymous users
            ...(!userContext.isAuthenticated &&
              userContext.sessionId && {
                session_user_id: userContext.sessionId,
              }),
          }));

          const { data: leadsInsert, error: leadsError } =
            await authContext.client.from("leads").insert(leadsData);

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
        };
      }
    }

    const response = {
      success: true,
      campaignId,
      discoveryEngine: "ProspectPro Business Discovery v4.2 - User-Aware",
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
        totalFound: qualifiedLeads.length,
        qualified: qualifiedLeads.length,
        qualificationRate: `${(
          (qualifiedLeads.length / rawBusinesses.length) *
          100
        ).toFixed(1)}%`,
        averageConfidence: Math.round(
          qualifiedLeads.reduce(
            (sum: number, lead: BusinessLead) => sum + lead.optimizedScore,
            0
          ) / qualifiedLeads.length
        ),
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
        costPerLead: totalCost / qualifiedLeads.length,
      },
      database_storage: dbStorageResult,
      leads: qualifiedLeads,
      metadata: {
        timestamp: new Date().toISOString(),
        version: "4.2",
        userAware: true,
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
