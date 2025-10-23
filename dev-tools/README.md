# Dev Tools Suite v5.0 - AI Agent Orchestration Platform

The `dev-tools/` directory contains ProspectPro’s complete automation stack: AI agents, CI/CD tooling, diagnostics, and workspace governance assets.

## Tool Suite Layout

- **Agents** (`/agents/`): Persona workflows, shared context manager, MCP client package, and MCP server runtime.
- **Automation** (`/automation/`): CI/CD orchestration, taxonomy refreshers, and diagram pipelines.
- **Scripts** (`/scripts/`): Shell and Node.js utilities for deployment, diagnostics, docs, roadmap, and setup tasks.
- **Testing** (`/testing/`): Unit, integration, e2e, and fixtures powering automation assurance.
- **Reports** (`/reports/`): Diagnostics, observability snapshots, and validation archives aligned with operations guide.
- **Config** (`/config/`): Tooling configuration (ESLint, TypeScript, Vite, MCP, observability) referenced across agents and scripts.
- **Workspace** (`/workspace/`): Session store inventories, restructure plans, and sandbox templates for day-to-day work.

## Directory Structure

### `/agents/`

**Multi-agent workflow coordination and runtime assets**

- `workflows/` – Persona instruction packs and orchestration configs.
- `context/` – Context manager sources, schemas, and store templates.
- `mcp/` – MCP client/package code powering agent connectivity.
- `mcp-servers/` – Production, development, and troubleshooting MCP servers (registry lives here).

### `/automation/`

**Continuous integration and scripted release automation**

- `ci-cd/` – Pipeline definitions and diagram/taxonomy automation (`pipeline.yml`, `repo_scan.sh`, `stage-taxonomy.sh`, etc.).

### `/scripts/`

**Reusable automation entry points**

- `automation/`, `context/`, `deployment/`, `diagnostics/`, `docs/`, `operations/`, `roadmap/`, `setup/`, `tooling/`, `validation/`, plus Node utilities under `node/`.
- Prefer VS Code tasks or npm scripts that wrap these helpers before adding new entry points.

### `/testing/`

**Quality gates for the automation stack**

- `unit/`, `integration/`, `e2e/`, `fixtures/`, `utils/` – Test suites and data supporting MCP agents and Supabase workflows.

### `/reports/`

**Tracked telemetry and diagnostics output**

- `diagnostics/`, `monitoring/`, `observability/`, `validation/` – Store curated artifacts only (temporary logs belong in `dev-tools/workspace/context/session_store/`).

### `/config/`

**Shared configuration for the toolchain**

- ESLint, TypeScript, Vite, MCP, and observability configs consumed by agents, servers, and scripts.

### `/workspace/`

**Operational workspace assets**

- `context/session_store/` – Live inventories, coverage logs, and restructure plans.
- Templates, scratchpads, and VS Code validation helpers for day-to-day development.

## Features Modeled from Implementation Packages

- **AI agent invocation logic:** Automation scripts call MCP servers and agents defined under `/agents/`.
- **Single responsibility:** Each script/module aligns with MECE directory boundaries.
- **Centralized config references:** Shared configs live in `/dev-tools/config/`; app code consumes them via documented imports.
- **Observability baked in:** MCP servers and scripts emit OTEL data captured under `/reports/` and observability tooling.
- **Automated error handling + rollback:** Circuit breakers and incident playbooks live beside the agents that execute them.

## Usage

### Development Workflow

1. **Setup:** Use npm tasks or `dev-tools/scripts/setup/` helpers for environment bootstrap.
2. **Development:** Invoke persona workflows under `/agents/workflows/` when driving change.
3. **Testing:** Run suites from `/testing/` or associated VS Code tasks for coverage.
4. **Deployment:** Leverage automation in `/automation/ci-cd/` and `/scripts/deployment/` before releasing.
5. **Monitoring:** Persist telemetry outputs under `/reports/` per operations guide.

### AI Agent Integration

- MCP server registry resides in `/agents/mcp-servers/registry.json`; keep it in sync with `config/mcp-config.json`.
- Context manager schemas live under `/agents/context/`; reference them from workflows and tests.
- GitHub webhook and platform automations now live in `integration/platform/**` (see `/integration/platform/github/` for webhook handlers).

## Migration Notes

The current structure supersedes the legacy `agent-orchestration/` + scattered script layout. When relocating artifacts, update:

- VS Code tasks and npm scripts that reference old paths.
- Documentation sections (e.g., platform playbooks, settings staging).
- Session store inventories (`dev-tools/workspace/context/session_store/*`).

## Requirements

- Node.js 18+
- Bash 4+
- Docker (for local development)
- Supabase CLI (for backend operations)
- OpenTelemetry collector (for tracing)

## Contributing

When adding new tools:

1. Follow single responsibility principle
2. Include MCP server integration where applicable
3. Add OpenTelemetry tracing for agent calls
4. Update this README with new functionality
5. Test integration with existing agent workflows
