# MCP Client Service Layer

**Safeguarded MCP Integration Layer for ProspectPro Agent Orchestration**

## Overview

This module provides a portable, testable service layer for MCP (Model Context Protocol) client management, configuration fallback, workspace safety, retry strategies, and telemetry integration. Designed for maximum flexibility within the hybrid-mono structure, avoiding direct VS Code API coupling until extension wiring.

## Guardrails & Safeguards

- **No Direct .vscode/.github Edits:** All configuration proposals staged in `docs/tooling/settings-staging.md`.
- **Dependency Inversion:** All components injectable for testing; no hardcoded VS Code APIs.
- **Error Handling:** Structured warnings and actionable errors; no silent failures.
- **Telemetry Integration:** Lightweight hooks for observability without coupling to specific sinks.
- **Workspace Safety:** Helpers for safe workspace root resolution; no unsafe array access.

## Components

### ConfigLocator

- Fallback config loading: `.vscode/mcp_config.json` → `config/mcp-config.json`
- Returns parsed JSON + source metadata
- Emits structured warnings for missing/invalid files

### WorkspaceContext

- Safe workspace root resolution via injected path or VS Code API
- Descriptive errors when workspace undefined
- Supports dependency injection for portability

### MCPClientManager

- Lifecycle management: `initialize`, `getClient`, `dispose`, `destroyAll`
- Configurable retry/backoff with cancellation
- Telemetry hooks for all operations

### ChatModeLoader

- Parameterized manifest loading from base path (default: `.github/chatmodes`)
- Validation and warnings for missing files

### TelemetrySink

- Lightweight interface: `info`, `warn`, `error`, `event`
- Default no-op implementation
- Extensible for future observability integrations

## TODOs

- [ ] Implement ConfigLocator with fallback logic
- [ ] Add WorkspaceContext safety helpers
- [ ] Scaffold MCPClientManager with retry strategy
- [ ] Wire TelemetrySink interface
- [ ] Add ChatModeLoader parameterization
- [ ] Create Jest test suites for all components
- [ ] Update documentation in platform-playbooks.md and FAST_README.md
- [ ] Stage extension wiring proposals in settings-staging.md

## Testing

Run tests: `npm test` (Jest suite in `__tests__/`)

## Integration Notes

- Phase 3B: Extension wiring (chat participants, tools registration)
- Phase 3C: VS Code API integration and UI hooks
- All changes logged in `reports/context/agent-chat-integration-plan.tmp.md`
