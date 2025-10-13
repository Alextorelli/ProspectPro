# ProspectPro v4.3 — Supabase CLI Guide

ProspectPro relies on the Supabase CLI for deploying Edge Functions, tailing logs, and managing environment configuration. This guide captures the exact commands used by the production team.

## 📦 Install or Update the CLI

- **macOS / Linux**: `brew install supabase/tap/supabase` then `brew upgrade supabase` when new releases ship.
- **Windows**: `scoop bucket add supabase https://github.com/supabase/scoop-bucket.git` then `scoop install supabase`.
- **Alternative**: download binaries from https://github.com/supabase/cli/releases or run `npm exec --yes supabase -- --help` when installing locally is not possible.

Verify the version any time with:

```bash
supabase --version
```

## 🔐 Authenticate and Target the Project

```bash
supabase login                      # one-time per machine
supabase link --project-ref sriycekxdqnesdsgwiuc
supabase functions list             # confirm connectivity and auth
```

If `supabase link` is already configured, `supabase status` shows current project context.

## 🚀 Deploy Edge Functions

Deploy functions individually (preferred for visibility):

```bash
supabase functions deploy business-discovery-background
supabase functions deploy business-discovery-optimized
supabase functions deploy business-discovery-user-aware
supabase functions deploy enrichment-orchestrator
supabase functions deploy enrichment-hunter
supabase functions deploy enrichment-neverbounce
supabase functions deploy campaign-export-user-aware
```

For batch deploys the repository includes `scripts/deploy-background-tasks.sh`, but manual deploys make it easier to spot failures.

## 📡 Tail Logs in Real Time

```bash
supabase logs functions \
  --project-ref sriycekxdqnesdsgwiuc \
  --slug business-discovery-background \
  --tail
```

Adjust `--slug` for enrichment or diagnostic functions. Use `--since 1h` to review historical events.

## 🧪 Local Function Serving

```bash
supabase functions serve business-discovery-background --env-file ../.env
```

This spins up the function locally with an emulator. Supply a Supabase session JWT when probing the local endpoint.

## 🔑 Manage Secrets

Edge function secrets are stored in the Supabase dashboard. To sync new values from `.env.edge-secret` run:

```bash
supabase secrets set \
  GOOGLE_PLACES_API_KEY=xxx \
  HUNTER_IO_API_KEY=xxx \
  NEVERBOUNCE_API_KEY=xxx \
  FOURSQUARE_API_KEY=xxx
```

List the current keys at any time with `supabase secrets list`.

## 🧷 Database Change Workflow

- Apply migrations through the Supabase SQL editor or the CLI migration flow: `supabase migration new <name>` followed by `supabase db push`.
- Run `supabase db diff --linked` before committing schema changes to confirm production parity.

## 🆘 Common Pitfalls

- **401 / Invalid JWT**: Log in again (`supabase login`) or fetch a fresh session token from the frontend and retry.
- **Secret Missing in Runtime**: Re-run `supabase secrets set` and redeploy the affected function.
- **CLI stuck on old project**: `supabase unlink` then `supabase link --project-ref sriycekxdqnesdsgwiuc`.

## 📚 Additional References

- Supabase CLI docs: https://supabase.com/docs/reference/cli/about
- ProspectPro deployment checklist: `docs/DEPLOYMENT_CHECKLIST.md`
- Edge function auth guide: `EDGE_FUNCTION_AUTH_UPDATE_GUIDE.md`

Keep this guide next to the CLI terminal session during releases to avoid context switching back to the dashboard.
