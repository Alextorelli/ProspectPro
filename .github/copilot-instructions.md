# ProspectPro Production Operations Guide

## Architecture Snapshot

- **Version**: 4.3.0 baseline with background discovery, enrichment, and export delivered by Supabase Edge Functions.
- **Frontend**: React/Vite app under `app/frontend/`; deploy with `npm run build` and Vercel production push.
- **Backend**: Supabase-first stack; Edge Functions live in `/supabase/functions/` with schema tracked in `/supabase/schema-sql/`.
- **Data Layer**: Supabase Postgres enforcing Row Level Security, campaign ownership, and authenticated exports.
- **Observability Toolchain**: MCP log forwarder, Supabase logs, and consolidated telemetry artifacts under `dev-tools/reports/`.
- **Authentication**: Supabase Auth for anonymous + authenticated sessions via shared helpers.

## Target Repo Structure & Tool Suite

- **Domain separation**
  - `app/` – production UI, shared client utilities, and embedded Vite config.
  - `dev-tools/` – automation, diagnostics, MCP servers, observability assets, and authoritative inventories.
  - `integration/` – partner connectors, infrastructure definitions, and environment specs.
- **Reports & Telemetry**: Long-lived diagnostics, monitoring outputs, and observability configs stay in `dev-tools/reports/`. Legacy `Reports/` folders are being merged here; do not recreate root-level `reports/`.
- **Temporary & Working Files**: Use `dev-tools/workspace/context/session_store/` exclusively for scratch plans, coverage snapshots, logs-in-transit, and migration trackers. Clean up after shipping to keep it lightweight.
- **Automation & Tasks**: Prefer the curated VS Code tasks (see `.vscode/TASKS_REFERENCE.md`) and npm scripts in `package.json` for deployment, validation, and diagnostics before adding new workflows.

## Data Integrity & Integrations

- Production data only—no synthetic pipelines.
- Core integrations: Google Place Details (authority data), Hunter.io + NeverBounce (email discovery/deliverability), Cobalt Intelligence + licensing directories (executive verification), chamber/trade association feeds (membership), Foursquare Places (category enrichment).
- Record anomalies and verification notes in `dev-tools/workspace/context/session_store/coverage.md` or linked playbooks before release.

## Tooling & Automation Guardrails

- **Chat modes**: `Smart Debug`, `Feature Delivery`, `Production Support`, `API Research`, `Cost Optimization` found under `.github/chatmodes/`.
- **Mermaid diagrams**: Author in `docs/tooling/` or `docs/app/`; validate via `npm run docs:prepare` before publishing.
- **MCP Servers**: Located in `mcp-servers/`; start troubleshooting with `npm run start:troubleshooting` from that directory.
- **Supabase CLI**: Run from `/workspaces/ProspectPro/supabase` via `npx --yes supabase@latest`; keep auth fresh with `scripts/operations/ensure-supabase-cli-session.sh`.
- **Automation scripts**: `scripts/automation/` handles log pulls, Vercel checks, and context snapshots; outputs now captured in `dev-tools/reports/` once finalized.

## Deployment & Validation

1. **Frontend**: `npm run build`, then deploy `dist/` with `npx --yes vercel@latest --prod --confirm --scope appsmithery --project prospect-pro --cwd dist` or the `Deploy: Full Automated Frontend` task.
2. **Edge Functions**: `npx --yes supabase@latest functions deploy <slug> --no-verify-jwt` from `/supabase`; batch options available via `npm run deploy:<group>`.
3. **Quality Gates**: `npm run docs:prepare`, `npm run docs:update`, `npm run lint`, `npm test`, and `npm run supabase:test:db` (pgTAP) prior to release.
4. **Post-deploy smoke**: Supabase curl probes (`docs/edge-auth-testing.md`), Vercel health checks, and MCP diagnostics tasks.

## Workspace Practices

- Stage `.vscode/` and `.github/` proposals in `docs/tooling/settings-staging.md` before editing live configs.
- Follow relocation sequencing in `docs/app/**Targeted ROOT action plan**.md` (mirrored as `dev-tools/workspace/context/session_store/**Targeted ROOT action plan**.md`).
- Update inventories in `dev-tools/workspace/context/session_store/{app-filetree,dev-tools-filetree,integration-filetree}.txt` whenever files move; log provenance in `coverage.md`.
- After migratory work, run `npm run docs:update` and refresh references in FAST README and platform playbooks.

## Copilot Response Guidelines

1. Assume the team understands the production architecture; focus on actionable fixes.
2. Cite concrete paths or existing scripts instead of inventing new workflows.
3. Recommend established tasks or npm scripts before bespoke commands.
4. Flag any configuration change proposals in `docs/tooling/settings-staging.md`.
5. Reference the relocation roadmap and REPO_RESTRUCTURE_PLAN.md when advising on structural work.
6. Align suggestions with current production behavior, Supabase-first design, and latest automation wiring.
7. Keep answers concise, oriented around debugging, deployment, automation, and data quality.
8. Use the session_store inventories to verify layout changes and capture updates in `coverage.md`.
9. After major repo structure or automation changes, suggest next steps for CI wiring, automation validation, and provenance logging.

## Follow-up References

- `docs/app/REPO_RESTRUCTURE_PLAN.md` – canonical migration roadmap.
- `dev-tools/workspace/context/session_store/coverage.md` – authoritative audit log for context work.
- `docs/tooling/devops-agent-runbook.md` – combined Supabase, Vercel, MCP automation sequences.
- `docs/tooling/platform-playbooks.md` & `docs/tooling/diagram-guidelines.md` – taxonomy, telemetry checkpoints, diagram guardrails.
- `dev-tools/reports/reports/refactor/` – cleanup trackers to maintain until restructure backlog closes.
