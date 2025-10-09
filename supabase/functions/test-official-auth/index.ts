import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  authenticateRequest,
  corsHeaders,
  handleCORS,
} from "../_shared/edge-auth.ts";

// Test Edge Function - Supabase Official Authentication Pattern

serve(async (req) => {
  const corsResponse = handleCORS(req);
  if (corsResponse) return corsResponse;

  try {
    console.log("🧪 Testing Supabase's official auth pattern...");

    const authContext = await authenticateRequest(req);
    console.log(
      `🔐 Authenticated user ${authContext.userId} (anonymous: ${authContext.isAnonymous})`
    );

    // Test database operations with RLS enforced automatically
    const supabaseClient = authContext.supabaseClient;

    // Test campaigns table access
    const { data: campaigns, error: campaignsError } = await supabaseClient
      .from("campaigns")
      .select("id, business_type, location")
      .limit(3);

    if (campaignsError) {
      console.warn("Campaigns query error:", campaignsError.message);
    }

    // Test leads table access
    const { data: leads, error: leadsError } = await supabaseClient
      .from("leads")
      .select("id, business_name, campaign_id")
      .limit(3);

    if (leadsError) {
      console.warn("Leads query error:", leadsError.message);
    }

    const response = {
      success: true,
      timestamp: new Date().toISOString(),
      authenticationMethod: "Supabase Official Pattern",
      user: {
        id: authContext.user.id,
        email: authContext.user.email,
        isAnonymous: authContext.isAnonymous,
        sessionId: authContext.sessionId,
      },
      databaseAccess: {
        campaigns: {
          accessible: !campaignsError,
          count: campaigns?.length || 0,
          error: campaignsError?.message,
          sampleIds: campaigns?.map((c) => c.id).slice(0, 3),
        },
        leads: {
          accessible: !leadsError,
          count: leads?.length || 0,
          error: leadsError?.message,
          sampleIds: leads?.map((l) => l.id).slice(0, 3),
        },
      },
      recommendations: [
        "✅ Using Supabase's built-in JWT verification",
        "✅ RLS policies enforced automatically",
        "✅ No manual JWKS fetching required",
        campaignsError && leadsError
          ? "⚠️ Check RLS policies - no table access"
          : "✅ Database access working with RLS",
      ].filter(Boolean),
    };

    return new Response(JSON.stringify(response, null, 2), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("❌ Official auth pattern test failed:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
        authenticationMethod: "Supabase Official Pattern",
      }),
      {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
