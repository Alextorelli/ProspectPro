ProspectPro Deployment Runbook

Overview
This runbook documents the steps to deploy ProspectPro to Railway (or similar PaaS) and validate the deployment. It assumes the database hardening and SQL scripts in `database/` have been applied already.

Prerequisites
- Git repo with code on `main` branch
- Railway project created and linked to this repo
- Supabase project provisioned with database and schemas
- Required API keys (Google Places, Scrapingdog, Hunter.io, NeverBounce)

1) Environment variables (Railway project settings)
- SUPABASE_URL: https://<ref>.supabase.co
- SUPABASE_SECRET_KEY: Service role key from Supabase
- GOOGLE_PLACES_API_KEY: Google Cloud API key with Places + Geocoding enabled
- PERSONAL_ACCESS_TOKEN: Random secure token for the admin dashboard
- RAILWAY_WEBHOOK_SECRET: (Optional) for verifying incoming webhooks
- SCRAPINGDOG_API_KEY, HUNTER_IO_API_KEY, NEVERBOUNCE_API_KEY: Optional but recommended

2) Local smoke-check (optional - skip if you prefer)
- Copy `.env.example` to `.env` and fill keys
- Run `npm install` then `node server.js`
- Confirm `http://localhost:3000/health` responds 200

3) Deploy to Railway
- Commit changes to `main` and push: `git add . && git commit -m "Deploy" && git push origin main`
- On Railway dashboard, ensure the env vars are present
- Monitor deployment logs. The app should print: `ProspectPro server listening on port <port>` and later `Supabase connection success: true`

4) Post-deploy verification
- Open `https://<railway-app>.railway.app/health` → expect 200
- `https://<railway-app>.railway.app/diag` → check Supabase diagnostics (should show service role key detected)
- Run `database/VALIDATION_QUERIES.sql` in Supabase SQL editor to verify:
  - `function_search_path_mutable` cleared
  - `extension_in_public` only shows `postgis` in public for existing installs
  - `rls_disabled_in_public` should be cleared except for system tables if permissions prevented changes

5) Optional: Configure monitoring & alerts
- Configure Railway alerts for failures and restarts
- Set up Sentry (if SENTRY_DSN set) and Prometheus scraping

6) Rollback plan
- If deployment fails, roll back by selecting previous successful deployment in Railway
- Ensure DB migrations are idempotent; use `database/all-phases-consolidated.sql` only for new installs

Troubleshooting tips
- If Supabase connection fails: verify `SUPABASE_URL` and `SUPABASE_SECRET_KEY` env vars
- If PostGIS errors occur: PostGIS may be non-relocatable; accept `postgis` in `public` for existing installs
- If `spatial_ref_sys` RLS change fails: managed DBs may disallow ownership changes; this is acceptable

Quick Commands (PowerShell)
```
# Install deps and start locally
cd C:\Users\Alext\ProspectPro; npm ci; node server.js

# Test Supabase connectivity via helper
node -e "require('dotenv').config(); require('./config/supabase').testConnection().then(r => console.log(r)).catch(e => console.error(e))"

# Deploy
git add .; git commit -m "Deploy"; git push origin main
```

Contact
- For deployment help: reach out to the development team or open an issue in the repo.
