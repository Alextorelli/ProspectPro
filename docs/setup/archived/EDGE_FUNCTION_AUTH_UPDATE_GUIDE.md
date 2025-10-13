# 🔐 Edge Function Authentication Update - Complete Guide

## October 9, 2025 — Supabase-Native Session Enforcement

### 🎯 **STATUS: EDGE FUNCTIONS REQUIRE REAL SUPABASE SESSIONS**

✅ **COMPLETED THIS ROUND:**

- Replaced the custom JWKS verifier with Supabase's supported `auth.getUser` flow
- Updated every production Edge Function to consume the new `authenticateRequest`
- Preserved automatic user + session binding when writing campaigns, leads, and exports
- Added an official reference function (`test-official-auth`) that exercises the supported pattern end-to-end
- Refreshed developer tooling and docs to reflect the simplified contract (session token only)

🚨 **AUTH REQUIREMENT:**

- Authenticated Edge Functions **must** receive a Supabase session JWT (user sign-in token)
- Publishable or service-role keys **cannot** substitute for end-user Authorization headers
- Frontend and service callers are responsible for forwarding `Authorization: Bearer <supabase_session_jwt>` on every request

---

### 🔧 **CALLER CHECKLIST**

1. Fetch the active session token in the client:

```ts
const session = await supabase.auth.getSession();
const accessToken = session.data.session?.access_token;
```

2. Attach the token when invoking an Edge Function:

```ts
const response = await fetch(edgeFunctionUrl, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify(payload),
});
```

3. For service automations, mint a short-lived service-role JWT via the Supabase Admin API and forward it exactly the same way.

Keep tokens fresh by subscribing to `onAuthStateChange` and updating any cached headers when Supabase rotates the session.

---

### 🧱 **IMPLEMENTATION SNAPSHOT**

```ts
// /supabase/functions/_shared/edge-auth.ts
export async function authenticateRequest(req: Request) {
  // 1. Create a Supabase client with the caller's Authorization header
  // 2. Call supabaseClient.auth.getUser(token) to validate the session
  // 3. Return the hydrated client and user context (id, email, anonymous flag, session id, token claims)
}

export const corsHeaders = {
  /* shared CORS headers */
};
export function handleCORS(request: Request) {
  /* OPTIONS preflight helper */
}
```

Every production Edge Function (`business-discovery-optimized`, `enrichment-hunter`, `campaign-export-user-aware`, the test harnesses, and background diagnostics) now consumes the simplified context:

- `authContext.userId` → Postgres `user_id` columns
- `authContext.sessionId` → Postgres `session_user_id` columns (falls back to `null` when not present)
- `authContext.isAnonymous` / `authContext.email` → logging and analytics
- `authContext.supabaseClient` → automatically scoped client with RLS enforced

---

### 🧪 **HOW TO TEST IT**

| Scenario                    | Command                                                                                                                                                          | Expected Result                                                 |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| Edge Function diagnostics   | `curl -X POST https://.../functions/v1/test-new-auth -H "Authorization: Bearer <SESSION>" -d '{"diagnostics":true}'`                                             | JSON payload confirming database access & environment readiness |
| Official pattern smoke test | `curl -X POST https://.../functions/v1/test-official-auth -H "Authorization: Bearer <SESSION>" -d '{}'`                                                          | Confirms RLS queries succeed with supplied session              |
| Business discovery test     | `curl -X POST https://.../functions/v1/test-business-discovery -H "Authorization: Bearer <SESSION>" -d '{"businessType":"coffee shop","location":"Austin, TX"}'` | Inserts mocked campaign/leads tied to caller's user id          |

> Replace `<SESSION>` with an actual Supabase session JWT fetched via Supabase CLI, Admin API, or the frontend.

---

### 🚀 **NEXT STEPS FOR CALLERS**

1. **Propagate session JWTs** throughout the frontend and automation scripts (reference checklist above).
2. **Monitor session expiry** — refresh tokens during long-running workflows to avoid mid-flight 401s.
3. **Rotate service-role tokens** on a schedule if background jobs call these functions without a user session.

---

### 📊 **SECURITY & OBSERVABILITY**

- ✅ RLS enforcement automatically scopes queries to the authenticated user.
- ✅ `user_id` and `session_user_id` continue to populate on all writes.
- ✅ No project secrets or JWKS endpoints are required inside Edge Functions.
- 📈 `test-new-auth` returns environment + data-access diagnostics to validate new deployments quickly.
- ⚠️ Anonymous sessions still authenticate, but output is limited—promote users for full data access.

---

### ✅ **VERIFICATION CHECKLIST (POST-MIGRATION)**

- [ ] Frontend is forwarding real session tokens
- [ ] Edge Functions succeed via `test-official-auth`
- [ ] Discovery/enrichment/export runs store `user_id` and `session_user_id`
- [ ] No references to JWKS or legacy JWT helpers remain in the codebase
- [ ] Documentation and automation scripts updated to reflect the simplified contract

**Status:** Migration to the Supabase-supported authentication pattern is complete. Continue using session JWTs for every authenticated invocation.
