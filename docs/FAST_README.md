**DEPRECATED**: This file has been replaced by `README.md` for MECE clarity. Please update all references and use `/docs/README.md` as the canonical quick reference.

- [MCP Routing Sequence](docs/tooling/mcp-routing-sequence.mmd)
- [Workspace Architecture](docs/tooling/workspace-architecture.mmd)

> All diagrams include guardrails, validation checkpoints, and ZeroFakeData enforcement. See `diagram-guidelines.md` for details.

---

## Phase 6 – Validation & Reporting (2025-10-20)

- All documentation, diagrams, and manifests validated (`npm run docs:prepare`, `npm run docs:update`)
- Lint and tests passed (`npm run lint`, `npm test`)
- Supabase DB tests: no DB tests found, no errors
- Automation scripts usage confirmed (require arguments; guardrails enforced)
- No direct edits to guarded config files; all proposals staged in `settings-troubleshooting.md`
- All progress checkpoints and changelog notes up to date

**All phases complete. Guardrails enforced.**
