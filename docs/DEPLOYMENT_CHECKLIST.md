# 🚀 ProspectPro Supabase/Vercel Deployment Checklist

## 📋 Deployment Finalization Checklist

### Phase 1: Preflight Verification

- [ ] Confirm Supabase project `sriycekxdqnesdsgwiuc` has current Edge Function secrets (`GOOGLE_PLACES_API_KEY`, `HUNTER_IO_API_KEY`, `NEVERBOUNCE_API_KEY`, `FOURSQUARE_API_KEY`).
- [ ] Confirm Vercel project `appsmithery/prospect-pro` points at the main branch and uses the static build output.
- [ ] Pull latest `main`, ensure working tree is clean, and run `npm install` if dependencies changed.
- [ ] Verify the frontend `.env` or config references `sb_publishable_your_key_here` style placeholders only.
- [ ] Confirm you are at the Git top level: `git rev-parse --show-toplevel` must return `/workspaces/ProspectPro` (abort otherwise).
- [ ] Pull Vercel environment variables locally: `vercel env pull .env.vercel` so scripts can source the current `sb_publishable_*` key.
- [ ] Populate `.env.sync` with real Supabase + Google keys and push them to secrets:

  ```bash
  supabase secrets set --env-file .env.sync
  ```

- [ ] Mirror the same values into Vercel (`vercel env pull` already downloaded the current set) before deploying the frontend.

### Phase 2: Deploy Supabase Edge Functions

- [ ] Authenticate with Supabase CLI: `supabase login` (one-time on new machine).
- [ ] Run `supabase functions list` to verify CLI connectivity.
- [ ] Deploy production functions:

  ```bash
  supabase functions deploy business-discovery-background
  supabase functions deploy business-discovery-optimized
  supabase functions deploy business-discovery-user-aware
  supabase functions deploy enrichment-orchestrator
  supabase functions deploy enrichment-neverbounce
  supabase functions deploy enrichment-hunter
  supabase functions deploy campaign-export-user-aware
  ```

- [ ] Confirm the Supabase dashboard lists the new deploy time for each function.

### Phase 3: Build and Ship Frontend (Vercel)

- [ ] Build production bundle locally: `npm run build` (outputs to `/dist`).
- [ ] Preview the static build if desired: `npm run preview`.
- [ ] Deploy to Vercel from the build directory:

  ```bash
  cd dist
  vercel --prod
  cd ..
  ```

- [ ] Note the deployment URL; confirm the custom domain `prospect-fyhedobh1-appsmithery.vercel.app` points to the new build.

### Phase 4: Post-Deployment Validation

- [ ] Hit the production origin with a warm-up request: `curl -I https://prospect-fyhedobh1-appsmithery.vercel.app`.
- [ ] Validate the Supabase session flow in the browser (login, discovery start, export download).
- [ ] Tail function logs for regressions while triggering discovery:

  ```bash
  supabase logs functions \
    --project-ref sriycekxdqnesdsgwiuc \
    --slug business-discovery-background \
    --tail
  ```

- [ ] Trigger a background discovery via UI and confirm campaign + leads rows appear in Supabase tables.
- [ ] Run the export flow and verify `dashboard_exports` records update with `completed` status.

### Phase 5: Acceptance Criteria

- [ ] All functions deploy without CLI errors.
- [ ] Vercel deploy finishes with status `READY` and no runtime errors in the activity log.
- [ ] Campaign creation, lead enrichment, and CSV export succeed end-to-end using a real Supabase session token.
- [ ] Supabase log tail shows only expected info-level entries (no auth or quota errors).
- [ ] Browser console reports no unhandled exceptions during discovery/export.

## 📞 Troubleshooting Cheatsheet

- **Supabase deploy fails** → Re-run `supabase login`, ensure you are on the correct organization/project, and confirm local CLI version via `supabase --version`.
- **Vercel deploy issues** → Run `vercel logs <deployment-url>` and confirm build output was from `/dist`.
- **Scripts act on wrong directory** → Run `git rev-parse --show-toplevel`; if it is not `/workspaces/ProspectPro`, `cd` to the repo root before re-running any Supabase/Vercel commands.
- **Auth errors** → Re-authenticate from the UI, verify publishable key matches Supabase dashboard, and check Edge Function logs for `auth.getUser` failures.
- **Data missing** → Inspect Supabase tables (`campaigns`, `leads`, `dashboard_exports`) and ensure RLS policies are in effect; use the Supabase SQL editor for targeted queries.

## 🔗 Quick Reference Links

- Supabase Dashboard: https://supabase.com/dashboard
- Supabase Functions URL: https://sriycekxdqnesdsgwiuc.supabase.co/functions/v1/
- Vercel Project: https://vercel.com/appsmithery/prospect-pro
- Production Frontend: https://prospect-fyhedobh1-appsmithery.vercel.app
- GitHub Repository: https://github.com/Alextorelli/ProspectPro

## 📚 Documentation References

- [`docs/SUPABASE_ARCHITECTURE_VALIDATION.md`](SUPABASE_ARCHITECTURE_VALIDATION.md) — Validate the Supabase-first architecture decisions.
- [`docs/SUPABASE_PRODUCTION_OPTIMIZATION_GUIDE.md`](SUPABASE_PRODUCTION_OPTIMIZATION_GUIDE.md) — Cost and performance checklist.
- [`docs/EDGE_FUNCTION_AUTH_UPDATE_GUIDE.md`](EDGE_FUNCTION_AUTH_UPDATE_GUIDE.md) — Authentication and session handling reference.

---

Refer back to this checklist before every release cycle to keep production aligned with the Supabase-first deployment model.
