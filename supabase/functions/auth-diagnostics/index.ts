import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  authenticateRequest,
  corsHeaders,
  extractBearerToken,
  getAuthorizationHeader,
  handleCORS,
} from "../_shared/edge-auth.ts";

function createPreview(value: string | null): string | null {
  if (!value) return null;
  if (value.length <= 16) return value;
  return `${value.slice(0, 8)}…${value.slice(-8)}`;
}

serve(async (req) => {
  const corsResponse = handleCORS(req);
  if (corsResponse) return corsResponse;

  const authHeader = getAuthorizationHeader(req);
  const bearerToken = extractBearerToken(authHeader);

  const headerSnapshot = {
    method: req.method,
    hasAuthorization: Boolean(authHeader),
    authorizationLength: authHeader?.length ?? null,
    bearerPreview: createPreview(bearerToken),
    hasProspectSession: Boolean(req.headers.get("x-prospect-session")),
    contentType: req.headers.get("content-type") ?? null,
    userAgent: req.headers.get("user-agent") ?? null,
  };

  try {
    const authContext = await authenticateRequest(req);

    return new Response(
      JSON.stringify(
        {
          ok: true,
          headerSnapshot,
          authContext: {
            userId: authContext.userId,
            email: authContext.email,
            isAnonymous: authContext.isAnonymous,
            sessionId: authContext.sessionId,
            tokenClaims: authContext.tokenClaims,
            tokenPreview: createPreview(authContext.accessToken),
          },
        },
        null,
        2
      ),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    return new Response(
      JSON.stringify(
        {
          ok: false,
          headerSnapshot,
          error: message,
        },
        null,
        2
      ),
      {
        status: 401,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
