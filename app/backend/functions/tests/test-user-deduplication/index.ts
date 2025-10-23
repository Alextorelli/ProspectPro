import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, handleCORS } from "../../_shared/edge-auth.ts";

// Test User Deduplication System
// ProspectPro v4.3 - October 2025

serve(async (req) => {
  const corsResponse = handleCORS(req);
  if (corsResponse) return corsResponse;

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const requestData = await req.json();
    const { action = "test_functions" } = requestData;

    if (action === "test_functions") {
      // Test 1: Campaign hash generation
      const { data: hashTest, error: hashError } = await supabase.rpc(
        "generate_campaign_hash",
        {
          business_type: "coffee shop",
          location: "Seattle, WA",
          min_confidence_score: 50,
        }
      );

      // Test 2: Business identifier generation
      const { data: identifierTest, error: identifierError } =
        await supabase.rpc("generate_business_identifier", {
          business_name: "Starbucks",
          business_address: "123 Main St, Seattle, WA",
        });

      // Test 3: Check table exists
      const { error: tableError } = await supabase
        .from("user_campaign_results")
        .select("id")
        .limit(1);

      // Test 4: Usage stats function
      const { data: usageStats, error: usageError } = await supabase.rpc(
        "get_user_usage_stats",
        {
          target_user_id: null,
          target_session_user_id: "test_session_123",
        }
      );

      return new Response(
        JSON.stringify({
          success: true,
          tests: {
            campaign_hash: {
              success: !hashError,
              result: hashTest,
              error: hashError?.message,
            },
            business_identifier: {
              success: !identifierError,
              result: identifierTest,
              error: identifierError?.message,
            },
            table_exists: {
              success: !tableError,
              error: tableError?.message,
            },
            usage_stats: {
              success: !usageError,
              result: usageStats,
              error: usageError?.message,
            },
          },
          message: "Deduplication system test completed",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (action === "test_deduplication") {
      const { userId, sessionUserId, businesses } = requestData;

      // Generate campaign hash
      const campaignHash = await supabase.rpc("generate_campaign_hash", {
        business_type: "coffee shop",
        location: "Seattle, WA",
        min_confidence_score: 50,
      });

      if (!campaignHash.data) {
        throw new Error("Failed to generate campaign hash");
      }

      // Generate business identifiers
      const businessIdentifiers = businesses.map(
        (business: { name: string; address: string }) =>
          supabase.rpc("generate_business_identifier", {
            business_name: business.name,
            business_address: business.address,
          })
      );

      const identifierResults = await Promise.all(businessIdentifiers);
      const identifiers = identifierResults
        .map((result) => result.data)
        .filter(Boolean);

      // Test filter function
      const { data: filteredIds, error: filterError } = await supabase.rpc(
        "filter_already_served_businesses",
        {
          p_user_id: userId,
          p_session_user_id: sessionUserId,
          p_campaign_hash: campaignHash.data,
          p_business_identifiers: identifiers,
        }
      );

      return new Response(
        JSON.stringify({
          success: true,
          campaignHash: campaignHash.data,
          originalBusinesses: businesses.length,
          identifiers,
          filteredIdentifiers: filteredIds,
          filterError: filterError?.message,
          message: "Deduplication filter test completed",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: "Unknown action. Use 'test_functions' or 'test_deduplication'",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Test error:", error);
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
