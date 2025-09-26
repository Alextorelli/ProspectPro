# ProspectPro — Technical Overview

This document provides an end‑to‑end, implementation‑level overview of ProspectPro’s architecture, runtime, database schema, modules, and operational flows. It’s intended for developers deploying, extending, or operating the system.

## 1. System Architecture

- Platform: Node.js/Express backend, static frontend in `public/`
- Database: Supabase (PostgreSQL) with RLS
- External APIs: Google Places (discovery), Scrapingdog (scraping), Hunter.io (email discovery), NeverBounce (email validation)
- Deployment: Railway (Nixpacks). App exposes `/health`, `/diag`, `/metrics`, `/ready`, and business APIs.
- Observability: Prometheus metrics via `/metrics`, deployment monitoring via Railway webhooks

### 1.1 Key Modules

- `server.js`: Application entrypoint. Initializes Express, security middleware, metrics, health endpoints, routes, and async boot phases.
- `config/supabase.js`: Lazy Supabase client initialization, diagnostics (`testConnection()`), and cached diagnostics accessors.
- `modules/`:
  - `enhanced-lead-discovery.js`, `enhanced-lead-discovery-orchestrator.js`: Core lead discovery pipeline and orchestration.
  - `api-clients/`: Google Places, Hunter.io, NeverBounce, Scrapingdog, and state/registry clients.
  - `validators/`: Pre-validation and data quality checks to enforce “zero fake data”.
  - `prometheus-metrics.js`: Custom metrics (HTTP, DB, API costs, boot phases, webhook events).
  - `railway-webhook-monitor.js`: Processes Railway webhooks, logs to DB, computes idempotency, dashboard diagnostics.
  - `security-hardening.js`: App-layer security middleware and logging.
- `api/`:
  - `business-discovery.js`: HTTP routes for discovering and enriching leads.
  - `dashboard-export.js`, `export.js`: Export endpoints.

### 1.2 MCP (Model Context Protocol) Infrastructure v2.0

**Architecture**: Consolidated AI-enhanced development infrastructure providing intelligent assistants with direct access to ProspectPro systems.

- `mcp-servers/production-server.js`: **28 tools** across 5 capability areas:

  - Database Analytics (4 tools): Query leads, campaign stats, quality analysis, API costs
  - System Monitoring (7 tools): Health checks, diagnostics, logs, Docker status, configuration validation
  - API Testing (8 tools): Google Places, Foursquare, Hunter.io, NeverBounce testing with cost tracking
  - Filesystem Analysis (6 tools): Project structure, code patterns, fake data detection, error handling
  - Production Monitoring (3 tools): Health endpoints, deployment status, system metrics

- `mcp-servers/development-server.js`: **8 specialized tools** for development workflows:
  - New API Integration (4 tools): US Chamber, BBB, LinkedIn, ZoomInfo API testing
  - Development Utilities (2 tools): Performance benchmarking, API client templates
  - Code Generation (2 tools): Boilerplate generation, test suite creation

**Benefits**: 60% reduction in server processes (5→2), 100% tool preservation, enhanced AI productivity.
**Integration**: Auto-configured in VS Code, comprehensive test coverage via `npm run test`.

## 2. Data Pipeline (4 Stages)

1. Discovery (free): Google Places + Yellow Pages scrapers; extracts core business candidates.
2. Enrichment (paid): Scrapingdog for site content, Hunter.io for email discovery, owner discovery.
3. Validation: Data/website validation, DNS checks, NeverBounce email deliverability.
4. Export: Only verified, complete leads pass confidence thresholds and RLS policies.

### 2.1 Cost Controls & Budgets

- Budget caps via env: `DAILY_BUDGET_LIMIT`, `MONTHLY_BUDGET_LIMIT`, `PER_LEAD_COST_LIMIT`.
- Pre-validation threshold (`MIN_PREVALIDATION_SCORE`) gates expensive API calls.
- API usage/cost tracking persisted in `api_costs`/analytics tables.

## 3. Database Schema & Security

- Schema files: `database/01-05*.sql` and `all-phases-consolidated.sql`.
- Monitoring tables: `railway_webhook_logs`, `deployment_metrics`, `deployment_failures` (Phase 3) with indexes (Phase 3) and RLS enabled (Phase 5).
- Hardening:
  - Function `search_path` pinned across functions to clear `function_search_path_mutable` lints.
  - Extension management: `pg_trgm` moved to `extensions` schema for new installs; PostGIS may remain in `public` for existing installs (non-relocatable).
  - RLS on user tables and analytics; system table constraints handled gracefully (managed DB limitations).
- Webhook idempotency: `database/06-webhook-hardening.sql` adds `idempotency_key` and unique index to `railway_webhook_logs`.

## 4. Runtime & Endpoints

- Health & Diagnostics:
  - `/health` — status with boot/supabase diagnostics
  - `/ready` — readiness requiring privileged DB connection
  - `/diag` — sanitized env snapshot + deployment status
  - `/metrics` — Prometheus metrics
  - `/loop-metrics` — event loop delay snapshot
- Webhooks:
  - `POST /railway-webhook` — validates HMAC or token, upserts to `railway_webhook_logs` by `idempotency_key`, updates in-memory deployment status.
- Admin & Business:
  - `/deployment-status?token=PERSONAL_ACCESS_TOKEN` — deployment analytics
  - `/api/business/*` — discovery/enrichment endpoints
  - `/api/export/*` — exports
  - `/admin-dashboard.html` — admin dashboard (token-protected)

## 5. Boot & Resilience

- `modules/boot-debugger.js` tracks startup phases (dependencies-load, core-init, middleware-setup, google-places-init, auth-setup, health-endpoints, server-bind, supabase-test) and logs structured reports.
- Degraded start mode: `ALLOW_DEGRADED_START=true` lets the server boot if DB is temporarily unavailable. Retry logic attempts to recover.
- Global safety nets: `unhandledRejection` / `uncaughtException` handlers emit metrics and logs.

## 6. Observability & Metrics

- `prometheus-metrics.js` defines and records:
  - HTTP request histograms
  - Supabase connection success/failure and durations
  - API usage/costs by provider/operation
  - Boot phase durations and success/fail counts
  - Webhook events and processing durations
- `/metrics` exposes metrics in Prometheus format.

## 7. Deployment Workflow

- Railway: Nixpacks build (`railway.toml`), start command `node server.js`, `/health` as healthcheck path.
- Webhooks: Railway → `POST /railway-webhook` → DB log → dashboards and analytics
- Environment management: variables injected by Railway; local dev via `.env` + `dotenv`.

## 8. Validation & Tests

- SQL validation: `database/VALIDATION_QUERIES.sql` to check function search_path, extension schemas, and RLS statuses.
- Webhook tests: `tests/integration/test-railway-webhook-integration.js`, E2E runner in `tests/e2e/test-railway-webhook-e2e.js`.
- Debug scripts (optional): `debug/scripts/*` for environment and webhook validation.

## 9. Security Considerations

- Zero fake data policy enforced by validators; reject fake patterns for name/phone/address/email.
- Website verification (HTTP 200–399), DNS validation, and NeverBounce ≥80% confidence.
- RLS enabled broadly; policies ensure user isolation and service-role privileges for system writes.
- Sanitized diagnostics: `/diag` redacts secret-like env keys.

## 10. Common Ops Tasks

- Rollback: Select previous successful deployment in Railway.
- Rotate secrets: Update env vars in Railway and redeploy.
- Analyze deployment health: Query views (e.g., `get_deployment_health_summary()`) and `/deployment-status`.
- Cost governance: Inspect `api_costs` and dashboard analytics; tune thresholds via env.

## 11. Known Constraints

- PostGIS relocation is restricted in managed environments; acceptable to remain in `public` for existing installs.
- System tables like `spatial_ref_sys` may not be modifiable (ownership), handled via graceful exceptions in SQL.

## 12. File Map (selected)

- `server.js` — main server
- `modules/railway-webhook-monitor.js` — webhook processing and analytics
- `modules/prometheus-metrics.js` — metrics
- `modules/enhanced-lead-discovery.js` — lead pipeline core
- `modules/api-clients/*` — external API integrations
- `mcp-servers/production-server.js` — consolidated MCP server (28 tools)
- `mcp-servers/development-server.js` — development MCP server (8 tools)
- `mcp-servers/test-servers.js` — MCP comprehensive test suite
- `database/03-monitoring-and-analytics.sql` — analytics/webhook tables + indexes
- `database/05-security-and-rls.sql` — RLS + security policies
- `database/06-webhook-hardening.sql` — webhook idempotency
- `public/*` — front-end assets and dashboards

---

For deployment steps and webhook specifics, see `DEPLOYMENT.md` and `docs/WEBHOOKS.md`.
