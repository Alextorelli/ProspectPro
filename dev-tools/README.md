# Dev Tools Suite v5.0 - AI Agent Orchestration Platform

This `/tooling/` directory contains the complete development toolchain for ProspectPro, organized for maximum productivity and AI agent integration.

## Tool Suite Layout

- **Agent Orchestration** (`/agent-orchestration/`): Agent configs, `ContextManager` APIs, and zero-fake-data workflows for coordinating MCP-first automation.
- **Scripts** (`/scripts/`): Shell and Node.js automation for deployment, testing, diagnostics, and operations.
- **Monitoring** (`/monitoring/`): Observability stack configuration (Jaeger, Prometheus, Grafana) and OTel collectors.
- **CI** (`/ci/`): Continuous integration pipelines and automated PR reviews.

## Directory Structure

### `/scripts/`

**Shell and Node.js automation scripts for development workflows**

- `shell/` - Bash scripts for deployment, testing, diagnostics, and operations
- `node/` - JavaScript/Node.js utilities for codegen, API health checks, and test generation

### `/ci/`

**Continuous Integration and Deployment**

- `pipeline.yml` - Unified CI/CD pipeline configuration (GitHub Actions/others)
- `pr-review.js` - Automated PR review triggers for Development Agent

### `/phase-blueprints/`

**Multi-phase MCP optimization playbooks**

- `optimized_mcp_configuration.json` - Canonical MCP server layout for current release
- `phase-0X-*.md` - Stepwise plans for alignment, context workflow, observability, validation, and documentation
- `README.md` - Overview of blueprint lifecycle and adoption guidelines

### `/vercel/`

**Frontend deployment and optimization**

- `vercel.json` - Vercel deploy config/optimizations
- `vercel-healthcheck.sh` - Custom health checks for Vercel

### `/monitoring/`

**Observability and tracing infrastructure**

- `otel/` - OpenTelemetry configuration for tracing agents/app
- `jaeger/` - Jaeger container for trace visualization

### `/supabase/`

**Database and backend tooling**

- `cli-helpers.sh` - CLI wrappers for Supabase operations (migrations/tests)
- `migration-tools.js` - Coordinate DB changes with MCP server
- `troubleshooting-server.js` - Advanced agent-enabled logging and error correlation

### `/test-automation/`

**End-to-end and integration testing**

- `e2e-runner.js` - Orchestrates end-to-end tests with agent validators

### `/agent-orchestration/`

**Multi-agent workflow coordination**

- `agents/` - Role configurations (`config.json`) and instructions aligned with zero-fake-data and MCP-first policies
- `agents/templates/README.md` - Shared templates documenting validation and documentation workflows
- `context/` - `context-manager.ts`, environment schemas, quick references, and README describing the context store strategy
- `context/store/` - Persisted scratchpads and memories managed via `ContextManager.checkpoint()`

### `/integration/third-party/`

**External service integrations**

- `webhook-validator.js` - Automated webhook endpoint validation/alerts
- `stripe-integration.js` - Payment ops automation, with metric tracking
- `zapier-integration.js` - Workflow automations (business ops, notifications)
- `slack-escalation.js` - Event-driven notifications and escalations

## Features Modeled from Implementation Packages

- **AI agent invocation logic:** PR, code review, deployment, and health scripts call MCP servers and agents as described in `implementation_package.json` and `optimized_agent_strategy.json`.
- **Single responsibility:** Each script/module in `/tooling/` is focused, matching your cross-agent and event-driven workflow coordination pattern.
- **Centralized config references:** Read `.env`, tracing endpoints, model/agent configs from `/config/` (not app source).
- **Observability baked in:** All agent calls traced via OpenTelemetry, with correlation and aggregation for debugging, compliance, and ML baseline comparison.
- **Automated error handling + rollback:** Circuit breaker logic and incident response workflows are implemented per the MCP prompt specs.
- **Easy extension and audit:** Suite can be migrated to new projects; simply drop `/tooling/` (and `/config/`) into another mono-repo.

## Documentation Strategy

- `docs/app/SYSTEM_REFERENCE.md` – canonical system map for app + edge functions
- `docs/dev-tools/FAST_README.md` – quick reference for scripts, MCP servers, and validation flows
- `docs/technical/DOCUMENTATION_STANDARDS.md` – source of truth for writing and updating docs
- `dev-tools/agent-orchestration/context/README.md` – context store operations and `ContextManager` APIs
- Agent instructions reference these paths directly to enforce consistent updates during refactors

## Usage

### Development Workflow

1. **Setup:** Run scripts from `/scripts/shell/` for environment setup
2. **Development:** Use `/agent-orchestration/` for multi-agent workflows
3. **Testing:** Execute `/test-automation/` for comprehensive validation
4. **Deployment:** Use `/ci/` and `/vercel/` for production releases
5. **Monitoring:** Check `/monitoring/` for observability and debugging

### AI Agent Integration

- All scripts support MCP server integration for automated workflows
- Tracing enabled via OpenTelemetry for agent call correlation
- Event-driven architecture supports async agent coordination
- Centralized configuration prevents agent context conflicts

## Migration Notes

This structure replaces the previous `dev-tools-suite/` organization with a more focused, agent-ready architecture. Key improvements:

- **Unified scripts location** under `/scripts/` instead of scattered locations
- **Agent orchestration** centralized for multi-agent workflow coordination
- **Third-party integrations** isolated for security and maintenance
- **Observability first** with OpenTelemetry and Jaeger integration
- **CI/CD consolidation** with unified pipeline configuration

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
