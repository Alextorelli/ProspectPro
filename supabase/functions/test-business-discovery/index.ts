import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  authenticateRequest,
  corsHeaders,
  handleCORS,
} from "../_shared/edge-auth.ts";

// Simplified Business Discovery with New Authentication
// Test version for new API key format

interface StorageResult {
  success: boolean;
  campaignStored?: boolean;
  leadsStored?: number;
  error?: string;
  leadsError?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  const corsResponse = handleCORS(req);
  if (corsResponse) return corsResponse;

  try {
    console.log(`🚀 Business Discovery with New Authentication`);

    const authContext = await authenticateRequest(req);
    console.log(
      `🔐 Authenticated Supabase session for ${authContext.userId} (${
        authContext.isAnonymous ? "anonymous" : "authenticated"
      })`
    );
    const supabaseClient = authContext.supabaseClient;
    const sessionUserId = authContext.sessionId;

    // Parse request
    const requestData = await req.json();
    const {
      businessType = "restaurant",
      location = "Seattle, WA",
      maxResults = 2,
    } = requestData;

    console.log(
      `📋 Request: ${businessType} in ${location} (${maxResults} results)`
    );

    // Mock some business data for testing
    const mockBusinesses = [
      {
        businessName: `Sample ${businessType} 1`,
        address: `123 Main St, ${location}`,
        phone: "(555) 123-4567",
        website: "https://example1.com",
        email: "contact@example1.com",
        optimizedScore: 85,
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
      },
      {
        businessName: `Sample ${businessType} 2`,
        address: `456 Oak Ave, ${location}`,
        phone: "(555) 234-5678",
        website: "https://example2.com",
        email: "info@example2.com",
        optimizedScore: 78,
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
      },
    ];

    const campaignId = `test_campaign_${Date.now()}`;

    // Test database storage with new authentication
    let dbStorageResult: StorageResult | null = null;
    if (supabaseClient) {
      try {
        const campaignData = {
          id: campaignId,
          business_type: businessType,
          location: location,
          target_count: maxResults,
          results_count: mockBusinesses.length,
          total_cost: 0.04,
          processing_time_ms: 500,
          status: "completed",
          user_id: authContext.userId,
          session_user_id: sessionUserId,
        };

        const { error: campaignError } = await supabaseClient
          .from("campaigns")
          .insert(campaignData);

        if (campaignError) {
          dbStorageResult = { success: false, error: campaignError.message };
        } else {
          dbStorageResult = { success: true, campaignStored: true };

          // Try to store leads
          const leadsData = mockBusinesses.map((lead) => ({
            campaign_id: campaignId,
            business_name: lead.businessName,
            address: lead.address,
            phone: lead.phone,
            website: lead.website,
            email: lead.email,
            confidence_score: lead.optimizedScore,
            enrichment_data: lead.enhancementData,
            user_id: authContext.userId,
            session_user_id: sessionUserId,
          }));

          const { error: leadsError } = await supabaseClient
            .from("leads")
            .insert(leadsData);

          if (leadsError) {
            if (dbStorageResult) {
              dbStorageResult.leadsError = leadsError.message;
            }
          } else if (dbStorageResult) {
            dbStorageResult.leadsStored = leadsData.length;
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
      discoveryEngine: "Test Discovery with New Authentication v1.0",
      authentication: {
        userId: authContext.userId,
        sessionId: sessionUserId,
        isAnonymous: authContext.isAnonymous,
      },
      requirements: {
        targetLeads: maxResults,
        businessType,
        location,
      },
      results: {
        totalFound: mockBusinesses.length,
        qualified: mockBusinesses.length,
        averageConfidence: Math.round(
          mockBusinesses.reduce((sum, lead) => sum + lead.optimizedScore, 0) /
            mockBusinesses.length
        ),
      },
      database_storage: dbStorageResult,
      leads: mockBusinesses,
      metadata: {
        timestamp: new Date().toISOString(),
        version: "test-1.0",
        authenticationUpdated: true,
      },
    };

    return new Response(JSON.stringify(response, null, 2), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("❌ Test discovery error:", error);

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
