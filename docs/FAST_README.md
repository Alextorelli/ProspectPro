# FAST_README

> **Configuration Guard:** Stage all workspace configuration edits in `docs/tooling/settings-staging.md`; `.vscode/` and `.github/` stay locked until the guard is explicitly lifted.

---

## Platform Playbooks (Phase 2)

- [Supabase, Vercel, MCP Playbooks](docs/tooling/platform-playbooks.md)
  - Supabase: CLI, logs, auth guard, edge deploy, troubleshooting
  - Vercel: build, deploy, validation, troubleshooting
  - MCP: diagnostics, troubleshooting, reports

> **Phase 2:** Platform playbooks expanded. All automation/config proposals must be staged in `docs/tooling/settings-staging.md` per configuration guard.

---

## Key Diagrams (Phase 5)

- [Agent Orchestration Sequence](docs/tooling/agent-orchestration.mmd)
- [Context Orchestration Sequence](docs/tooling/context-orchestration.mmd)
- [MCP Routing Sequence](docs/tooling/mcp-routing-sequence.mmd)
- [Workspace Architecture](docs/tooling/workspace-architecture.mmd)

> All diagrams include guardrails, validation checkpoints, and ZeroFakeData enforcement. See `diagram-guidelines.md` for details.
