# Google OAuth Branding Alignment Guide

## 🎯 Goal

Ensure the Google sign-in consent screen shows the production ProspectPro branding and domain (`prospectpro.appsmithery.co`) instead of the default Supabase project URL.

---

## 1. Confirm Frontend Redirect Configuration

- ✅ `VITE_AUTH_REDIRECT_URL` now points to `https://prospectpro.appsmithery.co/auth/callback` (see `.env.production`).
- ✅ The auth component normalizes every OAuth redirect to `/auth/callback`.
- 🔁 If you host staging builds, set their redirect URLs explicitly (e.g., `https://staging.prospectpro.appsmithery.co/auth/callback`).

> **Why it matters:** Google displays the domain from the `redirect_uri` and authorized domain list when rendering the consent screen.

---

## 2. Update Supabase Auth Settings

1. Open the Supabase dashboard → **Authentication → URL Configuration**.
2. Set **Site URL**: `https://prospectpro.appsmithery.co`.
3. In **Additional Redirect URLs**, add:
   - `https://prospectpro.appsmithery.co/auth/callback`
   - `http://localhost:5173/auth/callback`
   - Any other approved environments (preview/staging).
4. Save changes.

> Keep the list tidy—remove legacy Vercel preview URLs once production is stable.

---

## 3. (Recommended) Provision an Auth Custom Domain

Using a Supabase Auth custom domain avoids the `project-ref.supabase.co` fallback entirely.

1. In Supabase dashboard → **Authentication → URL Configuration → Custom domain**.
2. Request a domain like `auth.prospectpro.appsmithery.co`.
3. Create a DNS record at your provider:
   - Type: `CNAME`
   - Name: `auth`
   - Value: `<generated>.supabase.co`
   - TTL: automatic (or 300 seconds)
4. Wait for Supabase to validate and issue the TLS certificate (typically <30 minutes).
5. Once active, Supabase will show the new auth domain. Note the new redirect pattern: `https://auth.prospectpro.appsmithery.co/auth/v1/callback`.

> **Billing note:** Auth custom domains require a paid Supabase plan.

---

## 4. Refresh Google Cloud OAuth Consent Settings

1. Open the Google Cloud console → **APIs & Services → OAuth consent screen**.
2. Update **Application name** to `ProspectPro` (or preferred display name).
3. Under **Authorized domains**, add:
   - `prospectpro.appsmithery.co`
   - `auth.prospectpro.appsmithery.co` (once the custom domain is live)
4. Set **Application homepage** to `https://prospectpro.appsmithery.co`.
5. Save the consent screen changes.

---

## 5. Update OAuth Client Authorized Redirect URIs

1. In Google Cloud → **APIs & Services → Credentials → OAuth 2.0 Client IDs** (the client used in Supabase Google provider settings).
2. Add the following to **Authorized redirect URIs**:
   - `https://auth.prospectpro.appsmithery.co/auth/v1/callback` (preferred)
   - `https://sriycekxdqnesdsgwiuc.supabase.co/auth/v1/callback` (keep temporarily until custom domain is verified)
3. Remove legacy Vercel preview callback URLs after confirming production works.
4. Save.

> If you change the client secret, remember to update the Supabase Google provider configuration immediately.

---

## 6. Validate the Experience

1. Deploy the latest frontend (`npm run build && cd dist && vercel --prod`).
2. In an incognito window, click **Continue with Google**.
3. Confirm the consent screen shows:
   - Application name: `ProspectPro`
   - Domain line referencing `prospectpro.appsmithery.co`
4. Complete sign-in and ensure you land on `/dashboard` via `/auth/callback`.

Optional spot checks:

```bash
# Confirm DNS for the auth domain (after provisioning)
nslookup auth.prospectpro.appsmithery.co

# Verify Supabase auth redirect settings via CLI (requires Supabase >= 1.150)
supabase projects get \
  --project-ref sriycekxdqnesdsgwiuc \
  --json | jq '.auth.site_url, .auth.additional_redirect_urls'
```

---

## 7. Rollout Checklist

- [ ] `.env.production`, `.env.local`, and templates updated with `/auth/callback`.
- [ ] Supabase site URL and redirect URLs set.
- [ ] (Optional) Auth custom domain verified in Supabase.
- [ ] Google OAuth consent screen refreshed with production domain.
- [ ] OAuth client redirect URIs include the new domain.
- [ ] Manual sign-in reviewed to confirm branding change.

Once these steps are complete, every Google login prompt will align with ProspectPro's production identity, eliminating legacy Supabase URLs from the user journey.
