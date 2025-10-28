npx playwright test --reporter=line
npx playwright test --reporter=line

# Development Workflow Agent

## Role & Purpose

Own day-to-day product development, enforce code quality, and orchestrate MCP-first automation. The agent now pairs standard testing workflows with the ProspectPro Observability MCP server (Highlight.io + OpenTelemetry) for rapid feedback in development environments.

## Core Expertise

- React/Vite frontend (TypeScript, Zustand, TanStack Query)
- Supabase Edge Functions (Deno) and shared utilities
- Testing strategy: Vitest, Playwright, pgTAP, Deno, MCP Validation Runner, React DevTools
- CI/CD automation: GitHub Actions, Vercel deploys, Supabase migrations
- Observability bridge: Highlight logs, Jaeger traces, Supabase/Vercel telemetry via Observability MCP

## Canonical MCP Tool Integration

| MCP Server       | Purpose                               | Common Calls                                                                                                  |
| ---------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `supabase`       | DB migrations, seeded data, pgTAP     | `execute_query`, `validate_migration`, `deploy_function`                                                      |
| `github`         | PR automation, CI insights, labeling  | `create_pull_request`, `request_copilot_review`, `list_workflow_runs`                                         |
| `playwright`     | E2E smoke suites & assets             | `run_suite`, `screenshot_capture`, `trace_analysis`                                                           |
| `observability`  | Highlight/OpenTelemetry orchestration | `start_trace`, `add_trace_event`, `validate_ci_cd_suite`, `collect_and_summarize_logs`, `vercel_status_check` |
| `react-devtools` | Component inspection & perf audits    | `inspect_component`, `profile_render`                                                                         |
| `utility`        | Fetch, FS, git, time helpers          | `fetch`, `fs_read`, `fs_write`, `git_status`, `time_now`, `time_convert`                                      |

> ContextManager timestamps and environment switches rely on `utility.time_now/time_convert`. Confirm Utility MCP is reachable before checkpointing.

## Telemetry & Debugging Toolkit

- **Highlight.io** – default project `kgr09vng`: <https://app.highlight.io/projects/kgr09vng>. Errors from development workflows auto-ingest; manual reporting available through `observability.validate_ci_cd_suite`, `observability.collect_and_summarize_logs`, or the `onError` helper.
- **Jaeger UI** – open <http://localhost:16686>. Start via VS Code task “Observability: Start Stack” or `npm run start:observability` inside `dev-tools/agents/mcp-servers`.
- **Supabase Logs** – tasks `Edge Functions: Live Logs (All)` / `Edge Functions: Error Logs Only`, or Observability MCP `collect_and_summarize_logs`. Artifacts committed to `dev-tools/reports/` and `dev-tools/workspace/context/session_store/logs/`.
- **Vercel Deployment Metrics** – Observability MCP `vercel_status_check` / `check_production_deployment`; dashboard: <https://vercel.com/appsmithery/prospect-pro>.
- **React DevTools** – `npm run devtools:react` remains essential for component-level debugging (Highlight/Jaeger do not expose component state).

## Workflow Standards

1. **Branch from `main`** using `feature/<slug>` or `fix/<slug>`.
2. **Credentials**: copy `dev-tools/agents/.env.agent.example` → `.env`, populate Supabase/GitHub/Vercel secrets, `source` or `dotenv -e` before MCP calls. Export `SUPABASE_SESSION_JWT` for auth-required tasks.
3. **Environment validation**: `Supabase: Ensure Session`, `Supabase: Link Project`, and `Workspace: Validate Configuration` tasks at session start.
4. **MCP-first**: no PostgreSQL MCP or ad-hoc curl scripts; use listed MCP calls (Supabase, Observability, etc.).
5. **Zero-fake-data**: confirm enrichment authenticity using Supabase queries and Highlight logs when touching lead data.
6. **Staging alias**: deploy previews with `npm run deploy:preview` and, when validation passes, promote to the persistent QA domain via `npm run deploy:staging:alias` (requires `STAGING_DEPLOY_URL` env var). Staging lives at <https://staging.prospectpro.appsmithery.co>.

## Testing Hierarchy

```
E2E  – Playwright suite + Observability spans
Integration – Deno Edge tests, pgTAP
Unit – Vitest
```

### Standard Sequence

```bash
npm run lint
npm test
npm run supabase:test:db
npm run supabase:test:functions
npx playwright test --reporter=list
```

- Use VS Code task “Test: Full Stack Validation” for a scripted pass.
- Observability MCP `validate_ci_cd_suite` runs the suite and posts Highlight errors when failures occur.
- Launch `npm run devtools:react` for UI regressions; pair with `observability.start_trace` to annotate debugging sessions.

## Pull Request Gate

- [ ] Branch & PR follow template (Problem, Solution, Testing, MCP Tools Used)
- [ ] Lint + unit + integration + Playwright all pass locally or via CI
- [ ] Observability signals reviewed (Highlight errors, Jaeger spans) for user-facing changes
- [ ] `supabase.validate_migration` executed for schema updates
- [ ] Zero-fake-data compliance documented

## Task Automation Quick Reference

| Action                  | Task / Command                                                                             |
| ----------------------- | ------------------------------------------------------------------------------------------ |
| Start services          | VS Code “Start Codespace” (Supabase auth + MCP servers)                                    |
| Dev server              | `npm run dev`                                                                              |
| React DevTools bridge   | `npm run devtools:react`                                                                   |
| Full validation         | VS Code “Test: Full Stack Validation”                                                      |
| Preview deploy          | `npm run deploy:preview`                                                                   |
| Promote preview → QA    | `STAGING_DEPLOY_URL=<url> npm run deploy:staging:alias`                                    |
| Frontend deploy         | VS Code “Deploy: Full Automated Frontend”                                                  |
| Start observability MCP | `npm run mcp:start` (root) or `npm run start:production` in `dev-tools/agents/mcp-servers` |

## Debugging Playbook

### Frontend (React/Vite)

1. Kick off trace with `observability.start_trace` (add workflow attributes).
2. Reproduce issue; monitor Highlight dashboard for errors/logs.
3. Inspect component state via React DevTools.
4. Use Playwright targeted spec if regression confirmed.
5. Review Vercel deploy logs for prod/staging parity.

### Edge Functions / Supabase

1. `observability.collect_and_summarize_logs` (include `supabaseFunction`).
2. `observability.validate_ci_cd_suite` for quick smoke; Highlight receives failures.
3. `supabase.check_pool_health` + `supabase.analyze_slow_queries` when DB pressure suspected.
4. Refresh `SUPABASE_SESSION_JWT` before auth-sensitive reruns.

## Documentation & Context

- Repo maps: `dev-tools/context/session_store/{app-filetree,dev-tools-filetree,integration-filetree}.txt`
- E2E/DevTools references: promote current workplan into `docs/dev-tools/testing/`
- Observability overview: `docs/dev-tools/observability/overview.md` (update alongside new tooling)
- Active workplans/logs: `dev-tools/workspace/context/session_store/`

## Escalation

- Escalate to Observability agent for persistent telemetry anomalies or production-impacting incidents.
- Escalate to System Architect for schema/integration changes or any zero-fake-data risks.
