import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  EdgeFunctionAuth,
  corsHeaders,
  handleCORS,
} from "../_shared/edge-auth.ts";

// Test Edge Function - New API Key Authentication
// October 4, 2025 - Verify new sb_publishable_*/sb_secret_* format

serve(async (req) => {
  // Handle CORS preflight
  const corsResponse = handleCORS(req);
  if (corsResponse) return corsResponse;

  try {
    console.log(`🧪 Testing new API key authentication...`);

    // Initialize Edge Function authentication
    const edgeAuth = new EdgeFunctionAuth();
    const authContext = edgeAuth.getAuthContext();

    console.log(
      `🔐 Auth Context: ${authContext.keyFormat} (${
        authContext.isValid ? "Valid" : "Invalid"
      })`
    );

    // Test database connectivity
    const dbTest = await edgeAuth.testDatabaseConnection();
    console.log(`💾 Database Test:`, dbTest);

    // Test request authentication
    const requestAuthTest = edgeAuth.validateRequestAuth(req);
    console.log(`📨 Request Auth Test:`, requestAuthTest);

    // Try a simple database query if we have a valid client
    let queryResult = null;
    if (authContext.client) {
      try {
        const { data, error } = await authContext.client
          .from("campaigns")
          .select("id, business_type, location, status")
          .limit(3);

        queryResult = {
          success: !error,
          rowCount: data?.length || 0,
          error: error?.message,
        };
      } catch (e) {
        queryResult = {
          success: false,
          error: e instanceof Error ? e.message : "Query failed",
        };
      }
    }

    // Test environment variables
    const envTest = {
      SUPABASE_URL: !!Deno.env.get("SUPABASE_URL"),
      SUPABASE_ANON_KEY: !!Deno.env.get("SUPABASE_ANON_KEY"),
      VITE_SUPABASE_ANON_KEY: !!Deno.env.get("VITE_SUPABASE_ANON_KEY"),
      SUPABASE_SERVICE_ROLE_KEY: !!Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),
      SUPABASE_SECRET_KEY: !!Deno.env.get("SUPABASE_SECRET_KEY"),
    };

    const response = {
      success: true,
      timestamp: new Date().toISOString(),
      authentication: {
        context: {
          keyFormat: authContext.keyFormat,
          isValid: authContext.isValid,
          hasClient: !!authContext.client,
        },
        databaseTest: dbTest,
        requestAuth: requestAuthTest,
        queryTest: queryResult,
      },
      environment: envTest,
      recommendations: generateRecommendations(authContext, dbTest, envTest),
    };

    return new Response(JSON.stringify(response, null, 2), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("❌ Authentication test error:", error);

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

function generateRecommendations(
  authContext: any,
  dbTest: any,
  envTest: any
): string[] {
  const recommendations = [];

  if (!authContext.isValid) {
    recommendations.push(
      "❌ No valid authentication found - check environment variables"
    );
  }

  if (authContext.keyFormat === "legacy_jwt") {
    recommendations.push(
      "⚠️ Using legacy JWT authentication - consider updating to new format"
    );
  }

  if (authContext.keyFormat === "new_publishable") {
    recommendations.push(
      "✅ Using new publishable key format - optimal for frontend"
    );
  }

  if (authContext.keyFormat === "new_secret") {
    recommendations.push(
      "✅ Using new secret key format - optimal for backend operations"
    );
  }

  if (!dbTest.success) {
    recommendations.push(
      "❌ Database connectivity failed - check RLS policies and key permissions"
    );
  }

  if (dbTest.hasAccess) {
    const accessCount = Object.values(dbTest.hasAccess).filter(Boolean).length;
    if (accessCount === 3) {
      recommendations.push("✅ Full database access to all core tables");
    } else if (accessCount > 0) {
      recommendations.push(
        `⚠️ Partial database access (${accessCount}/3 tables)`
      );
    } else {
      recommendations.push("❌ No database table access - check RLS policies");
    }
  }

  if (!envTest.SUPABASE_URL) {
    recommendations.push("❌ SUPABASE_URL environment variable missing");
  }

  const keyCount = [
    envTest.SUPABASE_ANON_KEY,
    envTest.VITE_SUPABASE_ANON_KEY,
    envTest.SUPABASE_SERVICE_ROLE_KEY,
    envTest.SUPABASE_SECRET_KEY,
  ].filter(Boolean).length;

  if (keyCount === 0) {
    recommendations.push("❌ No API keys found in environment");
  } else if (keyCount === 1) {
    recommendations.push(
      "⚠️ Only one API key configured - consider adding backup keys"
    );
  } else {
    recommendations.push(`✅ Multiple API keys configured (${keyCount} keys)`);
  }

  return recommendations;
}
