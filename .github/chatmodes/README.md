# ProspectPro Chat Modes (Persona Aligned)

ProspectPro ships **four chat participants** that mirror the MCP agent personas. Each mode produces a full plan in one response and enforces Supabase-first, MCP-first, zero-fake-data governance.

| Mode File | Mission | Trigger Scenarios | Core MCP Servers |
| --- | --- | --- | --- |
| `System Architect.chatmode.md` | Architecture reviews, schema planning, integration design | New migrations, external services, structural refactors | `postgresql`, `supabase-troubleshooting`, `integration-hub` |
| `Production Ops.chatmode.md` | Deployments, incident response, rollback orchestration | Shipping edge/frontend updates, outages, rollback calls | `integration-hub`, `supabase-troubleshooting`, `postgresql`, `github` |
| `Observability.chatmode.md` | OTEL spans, diagnostics, compliance monitoring | Error spikes, latency regressions, zero-fake-data audits | `supabase-troubleshooting`, `postgresql`, `integration-hub` |
| `Development Workflow.chatmode.md` | Feature delivery, testing automation, MCP adoption | Feature work, QA pipelines, PR preparation | `chrome-devtools`, `github`, `integration-hub`, `postgresql` |

## Activation Workflow
1. Open Copilot Chat (`Ctrl+Alt+I`).
2. Reference a mode: `@workspace Apply .github/chatmodes/System Architect.chatmode.md to review this migration`.
3. Attach supporting files (`#file scripts/operations/ensure-supabase-cli-session.sh`).
4. Execute the plan returned by the persona (diagnosis → actions → validation → traceability).

## Mandatory Tasks
- `npm run mcp:chat:sync` *(VS Code task: MCP: Sync Chat Participants)*
- `npm run mcp:chat:validate` *(VS Code task: MCP: Run Chat Validation)*
- `npm run docs:update && npm run lint && npm test && npm run supabase:test:db`

## Governance Guardrails
- Stage all `.github/` / `.vscode/` changes in `docs/tooling/settings-staging.md` with rationale, risk, rollback.
- Archive chatmode rollouts under `reports/context/archive/`.
- Audit enrichment changes with MCP tools to maintain zero-fake-data compliance.
- Keep OTEL spans, circuit breakers, and Supabase auth helpers intact when delivering fixes.

## Maintenance Checklist
- [ ] Chatmode prompts match latest personas and tooling
- [ ] `chatmode-manifest.json` regenerated and committed
- [ ] Documentation (`README.md`, `IMPLEMENTATION_SUMMARY.md`, platform playbooks) updated
- [ ] Validation pipeline executed and logged in staging doc
- [ ] Archive created with manifest + validation output

## Reference
- Agent instructions: `dev-tools/agent-orchestration/agents/**`
- MCP registry: `dev-tools/mcp-servers/registry.json`
- Governance: `docs/tooling/settings-staging.md`
- System architecture: `docs/technical/SYSTEM_REFERENCE.md`

Keep chatmodes synchronized with their agent counterparts so Codespaces automation, MCP tooling, and governance stay aligned.
