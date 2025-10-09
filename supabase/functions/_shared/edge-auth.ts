import type {
  SupabaseClient,
  User,
} from "https://esm.sh/@supabase/supabase-js@2.38.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

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
  tokenClaims: Record<string, unknown>;
}

function getRequiredEnv(name: string): string {
  const value = Deno.env.get(name);
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
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

function decodeJwtClaims(token: string): Record<string, unknown> {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) {
      return {};
    }
    const payload = base64UrlToUint8Array(parts[1]);
    const decoded = new TextDecoder().decode(payload);
    return JSON.parse(decoded) as Record<string, unknown>;
  } catch (_error) {
    return {};
  }
}

export async function authenticateRequest(
  req: Request
): Promise<AuthenticatedRequestContext> {
  const supabaseUrl = getRequiredEnv("SUPABASE_URL");
  const supabaseAnonKey = getRequiredEnv("SUPABASE_ANON_KEY");
  const supabaseServiceRoleKey = getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY");

  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) {
    throw new Error("Missing Authorization bearer token");
  }

  const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false },
    global: {
      headers: {
        Authorization: authHeader,
      },
    },
  });

  const accessToken = authHeader.replace(/^Bearer\s+/i, "");
  const { data, error } = await supabaseClient.auth.getUser(accessToken);

  if (error || !data.user) {
    throw new Error(
      `Authentication failed: ${error?.message ?? "No user found"}`
    );
  }

  const user = data.user;
  const tokenClaims = decodeJwtClaims(accessToken);
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
    supabaseServiceRoleKey,
    supabaseClient,
    accessToken,
    user,
    userId: user.id,
    email,
    isAnonymous,
    sessionId,
    tokenClaims,
  };
}

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
};

export function handleCORS(request: Request): Response | null {
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  return null;
}
