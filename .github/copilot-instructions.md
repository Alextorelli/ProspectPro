# ProspectPro Production Operations Guide

## Production Snapshot

- **Version**: 4.3.0 (production-grade background discovery & enrichment)
- **Frontend**: React/Vite app deployed to Vercel (`prospect-fyhedobh1-appsmithery.vercel.app`) with build outputs in `/dist`
- **Backend**: Supabase Edge Functions for discovery, enrichment, export, diagnostics (global edge network, <100ms cold starts)
- **Data Layer**: Supabase Postgres with Row Level Security, campaign ownership, and authenticated exports
- **Observability**: MCP log-forwarder + Supabase logs (see `dev-tools/context/session_store/coverage.md`)
- **Session-store provenance**: All action plans, coverage reports, workspace status snapshots, and progress updates live in `dev-tools/context/session_store/`; the root `reports/` directory is retired—do not recreate or reference it.
- **Authentication**: Supabase Auth (anonymous + authenticated sessions) enforced through shared helpers across functions and frontend
- **Configuration Guard**: Stage all `.vscode/` and `.github/` changes in `docs/tooling/settings-staging.md` before updating live files; follow the active relocation steps in `docs/app/**Targeted ROOT action plan**.md` (mirrored in `dev-tools/context/session_store/`).

## Data Integrity & Sources

ProspectPro operates exclusively on verified, production data sources. No synthetic data pipelines remain in the stack.

Primary integrations:

- Google Place Details API – phone, website, and location authority
- Hunter.io & NeverBounce – email discovery and deliverability scoring
- Cobalt Intelligence SOS + professional licensing directories – executive verification
- Chamber and trade association directories – membership validation
- Foursquare Places API – category enrichment and context

Data quality focuses on auditing live responses, preserving attribution, and documenting verification touchpoints inside enrichment metadata. Capture any anomalies in `dev-tools/context/session_store/` and reference them in the relevant playbook before shipping changes.

## AI-Assisted Workflow & Tooling

- **Chat modes**: `Smart Debug`, `Feature Delivery`, `Production Support`, `API Research`, `Cost Optimization` (see `.github/chatmodes/` for prompts and guardrails)
- **VS Code tasks**: `CI/CD: Validate Workspace Pipeline`, `Supabase: Fetch Logs`, `Supabase: Analyze Logs`, `Docs: Prepare`, `Deploy: Full Automated Frontend` (auto-generated reference in `.vscode/TASKS_REFERENCE.md`)
- **Mermaid diagrams**: Source-of-truth `.mmd` files under `docs/tooling/` and `docs/app/`; validate via `npm run docs:prepare`
- **MCP tooling**: Production/dev/troubleshooting servers plus tools such as `supabase_cli_healthcheck`, `vercel_status_check`, `ci_cd_validation_suite`, and `checkFakeDataViolations` for auditing downstream calls
- **Automation scripts**: `scripts/automation/` bundle handles Supabase log pulls, Vercel status checks, and context snapshots (outputs stored under `dev-tools/context/session_store/`)

## Platform Architecture Overview

- **Supabase-first architecture**: All backend logic lives in `/supabase/functions/`; database schema maintained in `/supabase/schema-sql/` (regenerate indexes via `npm run docs:update`)
- **Frontend**: Located in `/app/frontend/` with production bundles produced by `npm run build`
- **Edge functions**: Key production slugs include `business-discovery-background`, `business-discovery-optimized`, `business-discovery-user-aware` (legacy compatibility), `enrichment-hunter`, `enrichment-neverbounce`, `enrichment-orchestrator`, `enrichment-business-license`, `campaign-export-user-aware`, and diagnostics such as `test-new-auth` and `test-google-places`
- **Database references**: Campaign, lead, and export tables enforce user ownership and audit fields; analytics view `campaign_analytics` exposes aggregated metrics with security invoker semantics
- **MECE taxonomy**: `docs/tooling/platform-playbooks.md` links to the curated business taxonomy used by discovery flows

## Deployment & Validation Playbook

1. **Build & deploy frontend**
   - `npm run build`
   - `cd dist && npx --yes vercel@latest --prod`
2. **Deploy edge functions**
   - `cd supabase && npx --yes supabase@latest functions deploy <slug> --no-verify-jwt`
   - Use grouped npm scripts (`npm run deploy:critical`, `npm run deploy:discovery`, etc.) when shipping multiple functions
3. **Validation pipeline** (Phase 6 baseline)
   - `npm run docs:prepare`
   - `npm run docs:update`
   - `npm run lint`
   - `npm test`
   - `npm run supabase:test:db` (pgTAP suite; reports `NOTESTS` when no fixtures are present)
4. **Production smoke checks**
   - Supabase curl probes in `docs/edge-auth-testing.md`
   - Vercel health (`vercel --prod --confirm --cwd dist` + `curl -I` against production URL)
   - MCP diagnostics (`npm run mcp:start` tasks) for telemetry confirmation

## Supabase CLI & Script Conventions

- Change directory to `/workspaces/ProspectPro/supabase` before running CLI commands
- Invoke CLI via `npx --yes supabase@latest <command>`; no global install required
- Refresh authentication with `source scripts/operations/ensure-supabase-cli-session.sh`
- Use helper scripts in `scripts/lib/supabase_cli_helpers.sh` for migrations, type generation, and log collection
- Reference documentation: https://supabase.com/docs/reference/cli/ (functions, db, auth workflows)

## Debugging Patterns

- **Edge Function issues**: Review Supabase dashboard logs, confirm environment secrets, and replay requests with authenticated curl commands
- **RLS or auth errors**: Verify publishable key sync, session JWT freshness, and row-level policies; run diagnostics via `test-new-auth`
- **Frontend regressions**: Ensure deployment runs from `/dist`, watch browser console for API failures, and use React DevTools (browser extension or `npx react-devtools`)
- **Vercel deployment mismatches**: Re-run `vercel env pull .env.vercel`, confirm `vercel link`, and redeploy from the repo root
- **Observability gaps**: Use MCP log-forwarder commands (`scripts/automation/context-snapshot.sh`) and reference the telemetry cleanup report for expected outputs

## Response Guidelines for GitHub Copilot

1. Assume familiarity with the production architecture; avoid re-explaining unless asked
2. Prioritize actionable fixes, referencing existing files or scripts by path
3. Default to existing npm scripts, tasks, and automation instead of bespoke commands
4. Flag configuration changes by staging proposals in `docs/tooling/settings-staging.md` before modifying `.vscode/` or `.github/`
5. Reference the stepwise relocation guidance in `docs/app/**Targeted ROOT action plan**.md` when discussing structural work
6. Cite the production system’s current behavior when discussing alternatives or enhancements
7. Keep responses concise, oriented around debugging, deployment, or data quality tasks
8. Use the canonical inventories in `dev-tools/workspace/context/session_store/{app-filetree,dev-tools-filetree,integration-filetree}.txt` when verifying layout changes, and log provenance updates in `dev-tools/workspace/context/session_store/coverage.md`

## MCP & Observability Notes

- MCP servers (production, development, troubleshooting) are configured in `mcp-servers/`
- `docs/tooling/devops-agent-runbook.md` provides automation sequences for combining Supabase, Vercel, and MCP tooling
- `docs/tooling/platform-playbooks.md` and `docs/tooling/diagram-guidelines.md` describe diagram validation, telemetry checkpoints, and guardrails
- Start the troubleshooting server with `cd mcp-servers && npm run start:troubleshooting` for scripted diagnostics; stop via the paired npm task

## Remaining Dependencies & Follow-up

- **Telemetry report**: `dev-tools/workspace/context/session_store/coverage.md` is now the authoritative audit; keep linked from this file for all future reference
- **Restructure plan**: `docs/app/REPO_RESTRUCTURE_PLAN.md` is the canonical migration roadmap (daily sequencing captured in `docs/app/**Targeted ROOT action plan**.md`); update both in lockstep with structural changes
- **MCP status**: See `docs/tooling/devops-agent-runbook.md` (MCP Production Status Snapshot) for the current production server inventory; update that section when tool counts change
- **Audit artifacts**: `dev-tools/reports/reports/refactor/docs-audit.txt` and `dev-tools/reports/reports/refactor/structure-gap.md` track the ongoing cleanup; keep until the restructure backlog closes
- **Coverage output**: `dev-tools/workspace/context/session_store/coverage.md` is populated by the “Phase 02” task; this is the new standard output location
- After each removal or replacement, re-run `npm run docs:update` and refresh cross-references in the FAST README and platform playbooks
