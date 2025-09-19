# ProspectPro Deployment Runbook (Lovable + Supabase Edge Functions)

## Overview

This runbook documents the steps to run ProspectPro with a Lovable-hosted frontend and Supabase Edge Functions backend. The legacy Railway Express server is considered optional/legacy and may be removed once Edge Functions cover all endpoints. It assumes the database hardening and SQL scripts in `database/` have been applied already.

## Prerequisites

- Git repo with code on `main` branch
- Supabase project provisioned with database and schemas
- Supabase CLI installed and logged in (PowerShell: `iwr -useb https://supabase.com/cli/install/windows.ps1 | iex`)
- Required API keys (Google Places, Scrapingdog, Hunter.io, NeverBounce)

## 1) Environment variables (Supabase project → Settings → Configuration)

- `SUPABASE_URL`: `https://<ref>.supabase.co`
- `SUPABASE_SERVICE_ROLE_KEY` or `SUPABASE_SECRET_KEY`: Service role key from Supabase
- `GOOGLE_PLACES_API_KEY`: Google Cloud API key with Places + Geocoding enabled
- `PERSONAL_ACCESS_TOKEN`: Random secure token for the admin dashboard
- `SCRAPINGDOG_API_KEY`, `HUNTER_IO_API_KEY`, `NEVERBOUNCE_API_KEY`: Optional but recommended

## 2) Local development (Edge Functions)

- Recommended: VS Code + DevContainer (open folder and re-open in container)
- Run locally with the Supabase CLI:
  - PowerShell
    - `cd C:\Users\Alext\ProspectPro`
    - `supabase functions serve diag`
    - `supabase functions serve business-discovery`
  - Or use VS Code tasks: `Supabase: Serve Function (diag)` and `Supabase: Serve Function (business-discovery)`

## 3) Deploy Edge Functions

- Ensure you’re logged in: `supabase login`
- Link project (run once): `supabase link --project-ref <your-project-ref>`
- Deploy: `supabase functions deploy diag`; `supabase functions deploy business-discovery`

## 4) Wire in Lovable frontend

- In Lovable, connect GitHub repo and configure environment variables matching your Supabase project
- Use Supabase JS client in the frontend and call Edge Functions with `supabase.functions.invoke('business-discovery', { body: { query, location } })`

## 5) Post-deploy verification

- Invoke `diag` function via Supabase dashboard or CLI:
  - `supabase functions invoke diag --no-verify-jwt --body '{"ping":true}'`
- Verify DB constraints by running `database/VALIDATION_QUERIES.sql` in Supabase SQL editor
  - `function_search_path_mutable` cleared
  - `extension_in_public` only shows `postgis` in public for existing installs
  - `rls_disabled_in_public` cleared except for system tables when permissions prevent change

## 6) Windows Dev Drive and Junction Setup

- Preferred working path: `D:\APPS\ProspectPro` (fast dev drive)
- Create a junction from your user folder to the dev drive (run PowerShell as Administrator):
  - `New-Item -ItemType Junction -Path 'C:\Users\Alext\ProspectPro' -Target 'D:\APPS\ProspectPro'`
- After this, open the project via `C:\Users\Alext\ProspectPro` in VS Code; the underlying files live on D:

## 7) Legacy server (optional)

- The Node/Express server remains for now for reference and `/health`; you can run it locally with:
  - `npm ci; node server.js`
- Plan to deprecate once Edge Functions replace all endpoints

## Troubleshooting tips

- If Edge Function import errors appear in VS Code, ensure the Deno extension is enabled for the workspace and `deno.json` + `import_map.json` are present
- Supabase function serve binds on a local port; check the CLI output for the URL
- PostGIS may be non-relocatable in managed Supabase; accept `postgis` in `public` for existing installs
- If `spatial_ref_sys` RLS change fails: managed DBs may disallow ownership changes; this is acceptable

## Quick Commands (PowerShell)

```powershell
# Supabase CLI login and link
supabase login; supabase link --project-ref <your-project-ref>

# Serve and deploy functions
supabase functions serve diag; supabase functions deploy diag
supabase functions serve business-discovery; supabase functions deploy business-discovery

# Create Windows junction for dev drive (Admin PowerShell)
New-Item -ItemType Junction -Path 'C:\\Users\\Alext\\ProspectPro' -Target 'D:\\APPS\\ProspectPro'
```

## Contact

- For deployment help: open an issue in the repo.
