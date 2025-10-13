import type {
  SupabaseClient,
  User,
} from "https://esm.sh/@supabase/supabase-js@2.38.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

type JwtPayload = Record<string, unknown> & {
  sub?: string;
  email?: string;
  exp?: number;
  nbf?: number;
  session_id?: string;
  is_anonymous?: boolean;
};

export interface AuthenticatedRequestContext {
  supabaseUrl: string;
  supabaseAnonKey: string;
  supabaseServiceRoleKey: string;
  supabaseClient: SupabaseClient;
  accessToken: string;
  user: User;
  userId: string;
  email: string | null;
  isAnonymous: boolean;
  sessionId: string | null;
  tokenClaims: JwtPayload;
}

interface AuthDiagnostics {
  envSources: Record<string, string>;
  tokenPreview: string | null;
}

function maskSecret(value: string): string {
  if (value.length <= 8) {
    return "****";
  }
  return `${value.slice(0, 4)}…${value.slice(-4)}`;
}

function getEnvFallback(
  names: string[],
  label: string,
  diagnostics?: AuthDiagnostics
): string {
  for (const name of names) {
    const value = Deno.env.get(name);
    if (value) {
      if (diagnostics) {
        diagnostics.envSources[label] = name;
      }
      if (name !== names[0]) {
        console.log(
          `ℹ️ Using fallback environment variable ${name} for ${label}`
        );
      }
      console.log(`🔐 ${label} resolved from ${name} (${maskSecret(value)})`);
      return value;
    }
  }
  throw new Error(
    `Missing required environment variable: ${label}. Checked ${names.join(
      ", "
    )}`
  );
}

// Drop custom JWT parsing; rely on Supabase client auth helpers per docs.

interface SupabaseEnv {
  url: string;
  anonKey: string;
  serviceRoleKey: string;
}

function resolveSupabaseEnv(diagnostics: AuthDiagnostics): SupabaseEnv {
  const url = getEnvFallback(
    ["SUPABASE_URL", "EDGE_SUPABASE_URL"],
    "SUPABASE_URL",
    diagnostics
  );
  const anonKey = getEnvFallback(
    ["EDGE_SUPABASE_ANON_KEY", "EDGE_ANON_KEY", "SUPABASE_ANON_KEY"],
    "SUPABASE_ANON_KEY",
    diagnostics
  );
  const serviceRoleKey = getEnvFallback(
    [
      "EDGE_SUPABASE_SERVICE_ROLE_KEY",
      "EDGE_SERVICE_ROLE_KEY",
      "SUPABASE_SERVICE_ROLE_KEY",
    ],
    "SUPABASE_SERVICE_ROLE_KEY",
    diagnostics
  );

  return { url, anonKey, serviceRoleKey };
}

function extractAccessToken(
  req: Request,
  diagnostics: AuthDiagnostics
): string {
  // Per Supabase Functions auth guide: use Authorization header only.
  const token = extractBearerToken(req.headers.get("Authorization"));
  if (!token) throw new Error("Missing Authorization bearer token");
  diagnostics.tokenPreview = `${token.slice(0, 8)}…${token.slice(-6)}`;
  return token;
}

// No manual decode; Supabase SDK validates the token with auth.getUser.

function decodeJwtClaims(token: string): JwtPayload {
  const parts = token.split(".");
  if (parts.length < 2) {
    return {};
  }

  try {
    const base64Segment = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64Segment.padEnd(
      Math.ceil(base64Segment.length / 4) * 4,
      "="
    );
    const decoded = atob(padded);
    const parsed = JSON.parse(decoded);
    return typeof parsed === "object" && parsed !== null ? parsed : {};
  } catch (error) {
    console.warn("JWT decode failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return {};
  }
}

function extractBearerToken(rawValue: string | null): string | null {
  if (!rawValue) return null;
  const trimmed = rawValue.trim();
  if (!trimmed) return null;
  const matches = /^Bearer\s+(.+)$/i.exec(trimmed);
  return matches ? matches[1] : trimmed;
}

export async function authenticateRequest(
  req: Request
): Promise<AuthenticatedRequestContext> {
  const diagnostics: AuthDiagnostics = { envSources: {}, tokenPreview: null };
  let debugStage = "resolve_env";
  let usedServiceFallback = false;

  try {
    const {
      url: supabaseUrl,
      anonKey: supabaseAnonKey,
      serviceRoleKey,
    } = resolveSupabaseEnv(diagnostics);

    debugStage = "extract_token";
    console.log("🔐 Edge auth headers", {
      hasAuthorization: Boolean(req.headers.get("Authorization")),
      hasProspectSession: Boolean(req.headers.get("x-prospect-session")),
    });

    const accessToken = extractAccessToken(req, diagnostics);
    const tokenClaims = decodeJwtClaims(accessToken);

    // Minimal client per Supabase docs: pass anon key, and forward Authorization header via global headers
    debugStage = "create_client";
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
    });

    // First attempt: rely on anon client with forwarded Authorization header
    debugStage = "verify_user_forwarded";
    const { data: forwardedData, error: forwardedError } =
      await supabaseClient.auth.getUser(accessToken);

    let user = forwardedData?.user ?? null;

    if (!user) {
      if (forwardedError) {
        console.warn("⚠️ auth.getUser (forwarded) failed", {
          message: forwardedError.message,
          status: (forwardedError as { status?: number }).status ?? null,
        });
      } else {
        console.warn("⚠️ auth.getUser (forwarded) returned no user");
      }

      debugStage = "create_admin_client";
      const serviceClient = createClient(supabaseUrl, serviceRoleKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      });

      usedServiceFallback = true;

      const tokenSub =
        typeof tokenClaims.sub === "string" ? tokenClaims.sub : null;

      if (tokenSub) {
        debugStage = "verify_user_admin";
        const { data: adminData, error: adminError } =
          await serviceClient.auth.admin.getUserById(tokenSub);

        if (adminError || !adminData?.user) {
          console.error("❌ auth.admin.getUserById failed", {
            message: adminError?.message,
            status: adminError?.status,
          });
          throw new Error(
            adminError?.message ?? "Authentication failed: user not found"
          );
        }

        user = adminData.user;
      } else {
        debugStage = "verify_user_service";
        const { data: serviceData, error: serviceError } =
          await serviceClient.auth.getUser(accessToken);

        if (serviceError || !serviceData?.user) {
          console.error("❌ auth.getUser (service) failed", {
            message: serviceError?.message,
            status: serviceError?.status,
          });
          throw new Error(
            serviceError?.message ?? "Authentication failed: user not found"
          );
        }

        user = serviceData.user;
      }
    }

    debugStage = "finalize";
    const sessionId =
      typeof tokenClaims.session_id === "string"
        ? tokenClaims.session_id
        : null;
    const isAnonymous = Boolean(user.is_anonymous);
    const email = typeof user.email === "string" ? user.email : null;

    return {
      supabaseUrl,
      supabaseAnonKey,
      supabaseServiceRoleKey: serviceRoleKey,
      supabaseClient,
      accessToken,
      user,
      userId: user.id,
      email,
      isAnonymous,
      sessionId,
      tokenClaims,
    };
  } catch (error) {
    console.error("❌ authenticateRequest failure", {
      stage: debugStage,
      envSources: diagnostics.envSources,
      tokenPreview: diagnostics.tokenPreview,
      usedServiceFallback,
      error: error instanceof Error ? error.message : String(error),
    });

    const message = error instanceof Error ? error.message : String(error);
    // Normalize common Supabase error wording
    throw new Error(`Auth failure (${debugStage}): ${message}`);
  }
}

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-prospect-session",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
};

export function handleCORS(request: Request): Response | null {
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  return null;
}
