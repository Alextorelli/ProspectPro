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

function base64UrlToUint8Array(value: string): Uint8Array {
  const padded = value.padEnd(
    value.length + ((4 - (value.length % 4)) % 4),
    "="
  );
  const base64 = padded.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function parseJwtSegment<T = Record<string, unknown>>(segment: string): T {
  const bytes = base64UrlToUint8Array(segment);
  const decoded = new TextDecoder().decode(bytes);
  return JSON.parse(decoded) as T;
}

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
  const authHeader = extractBearerToken(req.headers.get("Authorization"));
  const sessionHeader = extractBearerToken(
    req.headers.get("x-prospect-session")
  );

  const token = sessionHeader ?? authHeader;
  if (!token) {
    throw new Error("Missing bearer token on request");
  }

  diagnostics.tokenPreview = `${token.slice(0, 8)}…${token.slice(-6)}`;
  return token;
}

function decodeJwtPayload(token: string): JwtPayload {
  try {
    const segments = token.split(".");
    if (segments.length !== 3) {
      return {};
    }
    return parseJwtSegment<JwtPayload>(segments[1]);
  } catch (error) {
    console.warn("Unable to decode JWT payload", error);
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

    debugStage = "create_client";
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false },
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    });

    debugStage = "load_user";
    const { data: authData, error: authError } =
      await supabaseClient.auth.getUser(accessToken);

    if (authError || !authData?.user) {
      throw new Error(
        `Authentication failed: ${authError?.message ?? "No user found"}`
      );
    }

    const user = authData.user;
    const tokenClaims = decodeJwtPayload(accessToken);

    debugStage = "finalize";
    const sessionId =
      typeof tokenClaims.session_id === "string"
        ? (tokenClaims.session_id as string)
        : null;
    const isAnonymous =
      typeof user.is_anonymous === "boolean"
        ? user.is_anonymous
        : Boolean(tokenClaims.is_anonymous);
    const email =
      typeof user.email === "string"
        ? user.email
        : typeof tokenClaims.email === "string"
        ? (tokenClaims.email as string)
        : null;

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
      error: error instanceof Error ? error.message : String(error),
    });

    if (error instanceof Error) {
      throw new Error(`Auth failure (${debugStage}): ${error.message}`);
    }
    throw new Error(`Auth failure (${debugStage})`);
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
