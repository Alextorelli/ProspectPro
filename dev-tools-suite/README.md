# ProspectPro Dev-Tools Suite (Overhaul Workspace)

## Structure: Toolchain → Runtime → Assets

This suite is organized for AI agent and CI/CD clarity:

- `agents/` — Instructions, configs, and templates for AI agents by role (e.g., `system-architect`, `observability`).
- `config/` — Templates and environment files for all tools and services.
  - `templates/`, `env/`
- `evaluation/` — Benchmarks, datasets, and reports for system testing and quality.
  - `benchmarks/`, `reports/`
- `mcp-servers/` — MCP server code, split by environment (`production`, `development`, `troubleshooting`).
- `monitoring/` — Observability assets by stack (`otel/`, `jaeger/`).
- `scripts/` — Automation and utility scripts, grouped by runtime and capability.
  - `shell/`, `node/`, `python/`, `automation/`, `coordination/`, `deployment/`, `improvement/`, `optimization/`, `metrics/`
- `workflows/` — Automated processes and CI/CD pipelines.
  - `github-actions/`, `supabase/`, `thunder/`
- `docs/` — Documentation for the dev-tools suite.

### Migration Plan

- Legacy folders remain until all new assets are validated.
- New scripts and configs go in the new structure only.
- After validation, migrate or deprecate legacy content.

See `implementation_guide.md` for phased build-out.
