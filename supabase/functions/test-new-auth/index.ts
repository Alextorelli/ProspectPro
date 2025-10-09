import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";
import type { AuthenticatedRequestContext } from "../_shared/edge-auth.ts";
import {
  authenticateRequest,
  corsHeaders,
  handleCORS,
} from "../_shared/edge-auth.ts";

// Test Edge Function - Supabase Session Authentication Diagnostics

interface DatabaseDiagnostics {
  success: boolean;
  access: Record<string, boolean>;
  error?: string;
}

interface QueryDiagnostics {
  success: boolean;
  rowCount?: number;
  error?: string;
  sampleCampaignIds?: string[];
}

interface RequestAuthDiagnostics {
  authorizationHeaderPresent: boolean;
  userId: string;
  sessionId: string | null;
  email: string | null;
  isAnonymous: boolean;
}

type EnvironmentDiagnostics = Record<string, boolean>;

serve(async (req) => {
  const corsResponse = handleCORS(req);
  if (corsResponse) return corsResponse;

  try {
    console.log("🧪 Running Supabase session authentication diagnostics...");

    const authContext = await authenticateRequest(req);
    const supabaseClient = authContext.supabaseClient;

    const requestDiagnostics = buildRequestDiagnostics(authContext, req);
    const databaseDiagnostics = await runDatabaseDiagnostics(supabaseClient);
    const queryDiagnostics = await fetchSampleCampaigns(supabaseClient);

    const environmentDiagnostics: EnvironmentDiagnostics = {
      SUPABASE_URL: Boolean(Deno.env.get("SUPABASE_URL")),
      SUPABASE_ANON_KEY: Boolean(Deno.env.get("SUPABASE_ANON_KEY")),
      VITE_SUPABASE_ANON_KEY: Boolean(Deno.env.get("VITE_SUPABASE_ANON_KEY")),
      SUPABASE_SERVICE_ROLE_KEY: Boolean(
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
      ),
      SUPABASE_SECRET_KEY: Boolean(Deno.env.get("SUPABASE_SECRET_KEY")),
    };

    const response = {
      success: true,
      timestamp: new Date().toISOString(),
      authentication: {
        request: requestDiagnostics,
        databaseTest: databaseDiagnostics,
        queryTest: queryDiagnostics,
      },
      environment: environmentDiagnostics,
      recommendations: generateRecommendations(
        authContext,
        databaseDiagnostics,
        environmentDiagnostics,
        queryDiagnostics
      ),
    };

    return new Response(JSON.stringify(response, null, 2), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("❌ Authentication diagnostics failed:", error);

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

function buildRequestDiagnostics(
  authContext: AuthenticatedRequestContext,
  req: Request
): RequestAuthDiagnostics {
  return {
    authorizationHeaderPresent: req.headers.has("Authorization"),
    userId: authContext.userId,
    sessionId: authContext.sessionId,
    email: authContext.email,
    isAnonymous: authContext.isAnonymous,
  };
}

async function runDatabaseDiagnostics(
  supabaseClient: SupabaseClient
): Promise<DatabaseDiagnostics> {
  const tables = ["campaigns", "leads", "dashboard_exports"] as const;
  const access: Record<string, boolean> = {};
  const errors: string[] = [];

  for (const table of tables) {
    try {
      const { error } = await supabaseClient.from(table).select("id").limit(1);
      access[table] = !error;
      if (error) {
        errors.push(`${table}: ${error.message}`);
      }
    } catch (error) {
      access[table] = false;
      errors.push(
        `${table}: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  return {
    success: Object.values(access).some(Boolean),
    access,
    error: errors.length ? errors.join("; ") : undefined,
  };
}

async function fetchSampleCampaigns(
  supabaseClient: SupabaseClient
): Promise<QueryDiagnostics> {
  try {
    const { data, error } = await supabaseClient
      .from("campaigns")
      .select("id")
      .limit(3);

    if (error) {
      return { success: false, error: error.message };
    }

    const rows = data ?? [];
    return {
      success: true,
      rowCount: rows.length,
      sampleCampaignIds: rows.map((row) => String(row.id)),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Query failed",
    };
  }
}

function generateRecommendations(
  authContext: AuthenticatedRequestContext,
  dbDiagnostics: DatabaseDiagnostics,
  envDiagnostics: EnvironmentDiagnostics,
  queryDiagnostics: QueryDiagnostics
): string[] {
  const recommendations: string[] = [];

  if (!envDiagnostics.SUPABASE_URL || !envDiagnostics.SUPABASE_ANON_KEY) {
    recommendations.push(
      "❌ Missing Supabase URL or anon key - update environment configuration"
    );
  }

  if (!envDiagnostics.SUPABASE_SERVICE_ROLE_KEY) {
    recommendations.push(
      "⚠️ Service role key missing - vault access and server-side operations may fail"
    );
  }

  if (dbDiagnostics.success === false) {
    recommendations.push(
      dbDiagnostics.error
        ? `❌ Database diagnostics failed: ${dbDiagnostics.error}`
        : "❌ Database diagnostics failed - check RLS policies"
    );
  } else {
    const accessibleTables = Object.entries(dbDiagnostics.access)
      .filter(([, hasAccess]) => hasAccess)
      .map(([table]) => table)
      .join(", ");
    recommendations.push(
      `✅ Database access confirmed for: ${accessibleTables}`
    );
  }

  if (!queryDiagnostics.success) {
    recommendations.push(
      queryDiagnostics.error
        ? `⚠️ Sample campaign query failed: ${queryDiagnostics.error}`
        : "⚠️ Unable to read campaigns - verify user permissions"
    );
  }

  if (authContext.isAnonymous) {
    recommendations.push(
      "ℹ️ Anonymous session detected - upgrade to authenticated user for full access"
    );
  }

  if (recommendations.length === 0) {
    recommendations.push("✅ Supabase authentication flow looks healthy");
  }

  return recommendations;
}
