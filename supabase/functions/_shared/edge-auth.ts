import type {
  SupabaseClient,
  User,
} from "https://esm.sh/@supabase/supabase-js@2.38.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

const JWKS_CACHE_TTL_MS = 5 * 60 * 1000;

type JwtHeader = {
  kid?: string;
  alg?: string;
};

type JwtPayload = Record<string, unknown> & {
  sub?: string;
  email?: string;
  exp?: number;
  nbf?: number;
  session_id?: string;
  is_anonymous?: boolean;
};

interface JwksCache {
  fetchedAt: number;
  keys: JsonWebKey[];
}

const jwksCache: JwksCache = {
  fetchedAt: 0,
  keys: [],
};

const cryptoKeyCache = new Map<string, CryptoKey>();

type KidJsonWebKey = JsonWebKey & { kid?: string };

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

async function fetchJwks(jwksUrl: string): Promise<JsonWebKey[]> {
  const now = Date.now();
  if (jwksCache.keys.length && now - jwksCache.fetchedAt < JWKS_CACHE_TTL_MS) {
    return jwksCache.keys;
  }

  const response = await fetch(jwksUrl, {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch JWKS: ${response.status} ${response.statusText}`
    );
  }

  const { keys } = (await response.json()) as { keys: JsonWebKey[] };
  if (!Array.isArray(keys) || keys.length === 0) {
    throw new Error("JWKS response did not contain any keys");
  }

  jwksCache.keys = keys;
  jwksCache.fetchedAt = now;
  return keys;
}

async function getCryptoKeyForKid(
  kid: string,
  jwksUrl: string
): Promise<CryptoKey> {
  const cached = cryptoKeyCache.get(kid);
  if (cached) {
    return cached;
  }

  const keys = (await fetchJwks(jwksUrl)) as KidJsonWebKey[];
  const jwk = keys.find((key) => key.kid === kid);

  if (!jwk) {
    throw new Error(`Unable to locate signing key for kid: ${kid}`);
  }

  const cryptoKey = await crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "ECDSA", namedCurve: "P-256" },
    true,
    ["verify"]
  );

  cryptoKeyCache.set(kid, cryptoKey);
  return cryptoKey;
}

async function verifyAndDecodeJwt(
  token: string,
  jwksUrl: string
): Promise<{ header: JwtHeader; payload: JwtPayload }> {
  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new Error("Invalid JWT structure");
  }

  const [headerPart, payloadPart, signaturePart] = parts;
  const header = parseJwtSegment<JwtHeader>(headerPart);
  const payload = parseJwtSegment<JwtPayload>(payloadPart);

  if (!header.kid) {
    throw new Error("JWT missing key identifier (kid)");
  }

  if (header.alg && header.alg !== "ES256") {
    throw new Error(`Unsupported JWT algorithm: ${header.alg}`);
  }

  const cryptoKey = await getCryptoKeyForKid(header.kid, jwksUrl);
  const signature = base64UrlToUint8Array(signaturePart);
  const data = new TextEncoder().encode(`${headerPart}.${payloadPart}`);

  const verified = await crypto.subtle.verify(
    { name: "ECDSA", hash: { name: "SHA-256" } },
    cryptoKey,
    signature as unknown as BufferSource,
    data as unknown as BufferSource
  );

  if (!verified) {
    throw new Error("Invalid JWT signature");
  }

  const nowInSeconds = Math.floor(Date.now() / 1000);
  if (typeof payload.exp === "number" && payload.exp < nowInSeconds) {
    throw new Error("JWT has expired");
  }

  if (typeof payload.nbf === "number" && payload.nbf > nowInSeconds) {
    throw new Error("JWT not yet valid");
  }

  return { header, payload };
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
    const supabaseUrl = getEnvFallback(
      ["SUPABASE_URL", "EDGE_SUPABASE_URL"],
      "SUPABASE_URL",
      diagnostics
    );
    const supabaseAnonKey = getEnvFallback(
      ["EDGE_SUPABASE_ANON_KEY", "EDGE_ANON_KEY", "SUPABASE_ANON_KEY"],
      "SUPABASE_ANON_KEY",
      diagnostics
    );
    const supabaseServiceRoleKey = getEnvFallback(
      [
        "EDGE_SUPABASE_SERVICE_ROLE_KEY",
        "EDGE_SERVICE_ROLE_KEY",
        "SUPABASE_SERVICE_ROLE_KEY",
      ],
      "SUPABASE_SERVICE_ROLE_KEY",
      diagnostics
    );

    debugStage = "extract_token";
    const authHeader = extractBearerToken(req.headers.get("Authorization"));
    const sessionHeader = extractBearerToken(
      req.headers.get("x-prospect-session")
    );

    const accessToken = authHeader ?? sessionHeader;
    if (!accessToken) {
      throw new Error("Missing bearer token on request");
    }

    diagnostics.tokenPreview = `${accessToken.slice(0, 8)}…${accessToken.slice(
      -6
    )}`;

    debugStage = "verify_jwt";
    const jwksUrl = `${supabaseUrl.replace(
      /\/$/,
      ""
    )}/auth/v1/.well-known/jwks.json`;
    const { payload: tokenClaims } = await verifyAndDecodeJwt(
      accessToken,
      jwksUrl
    );

    const userId = typeof tokenClaims.sub === "string" ? tokenClaims.sub : null;
    if (!userId) {
      throw new Error("JWT payload missing subject claim");
    }

    debugStage = "load_user";
    const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { persistSession: false },
    });

    const { data: adminData, error: adminError } =
      await adminClient.auth.admin.getUserById(userId);

    if (adminError || !adminData?.user) {
      throw new Error(
        `Authentication failed: ${adminError?.message ?? "No user found"}`
      );
    }

    const user = adminData.user;

    debugStage = "create_client";
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false },
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    });

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
