# Dev Tools Suite v5.0 - AI Agent Orchestration Platform

This `/tooling/` directory contains the complete development toolchain for ProspectPro, organized for maximum productivity and AI agent integration.

## Directory Structure  

### `/scripts/`

**Shell and Node.js automation scripts for development workflows**

- `shell/` - Bash scripts for deployment, testing, diagnostics, and operations
- `node/` - JavaScript/Node.js utilities for codegen, API health checks, and test generation

### `/ci/`

**Continuous Integration and Deployment**

- `pipeline.yml` - Unified CI/CD pipeline configuration (GitHub Actions/others)
- `pr-review.js` - Automated PR review triggers for Development Agent

### `/docker/`

**Containerization and local development**

- `Dockerfile.dev` - Development environment setup
- `Dockerfile.ci` - Build/test container image

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

- `context-manager.js` - Redis-based shared context store for agent workflows
- `workflow-engine.js` - Event-driven workflow orchestration (multi-agent)
- `event-bus.js` - Async MCP event integration, message passing

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
