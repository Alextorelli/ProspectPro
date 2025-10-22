# ProspectPro Context Store

ProspectPro uses a persistent context store to coordinate MCP-aware agents while keeping working memory manageable. The implementation follows the **Write → Select → Compress → Isolate** pattern defined in the MCP context management playbook.

## Directory Layout

```
context/
├── README.md                 # This file
├── context-manager.ts        # Node module for managing context lifecycle
├── schemas/
│   ├── agent-context.schema.json
│   ├── environment-context.schema.json
│   └── task-ledger.schema.json
└── store/
    ├── agents/               # Per-agent working state (scratchpad + memories)
    ├── environments/         # Environment snapshots (prod, troubleshooting, dev)
    ├── ledgers/              # Task and incident ledgers
    └── shared/               # Shared knowledge (schemas, cost thresholds, rate limits)
```

## Core Concepts

| Principle    | Implementation                                                                                                                                                                                                                                                                   |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Write**    | All agent state is persisted to JSON files inside `store/`. Scratchpads capture current work; long-term memories include Supabase config, cost thresholds, and external API limits. Every write goes through `ContextManager.checkpoint()` so state survives Codespace restarts. |
| **Select**   | `ContextManager.select()` accepts filters (agent id, task id, time range, keywords) and returns the smallest relevant slice. Memories are tagged with `topic`, `environment`, and `recency` metadata to enable retrieval without loading the full file.                          |
| **Compress** | When memories grow beyond configured thresholds, `ContextManager.compress()` produces lightweight summaries that keep the last N detailed entries plus a synthetic synopsis. Summaries carry provenance metadata (`derivedFrom`) so original items can be restored if needed.    |
| **Isolate**  | Each agent gets an isolated namespace under `store/agents/<agentId>/`. Environment-specific overlays (production, troubleshooting, development) are applied at runtime and permissions are enforced through `EnvironmentContextManager`.                                                 |

## Environment Contexts

- `store/environments/production.json` → Read-only context (no write operations, deployment approvals required)
- `store/environments/development.json` → Unrestricted context for rapid iteration
- `store/environments/troubleshooting.json` → Diagnostics, context recovery, and safe dry-run operations

`EnvironmentContextManager.switchEnvironment()` checkpoints current state, applies the target environment overlay, and locks permissions that are not allowed (e.g., production write operations). Environment transitions are recorded in the task ledger for auditability.

### Dry-Run Flag & Environment Loader Contract

- All automation scripts support the `--dry-run` flag for safe diagnostics and context recovery.
- Always source `config/environment-loader.v2.js` before agent or MCP tool execution.
- Use `scripts/automation/lib/participant-routing.sh` for participant-aware routing in all agent orchestration flows.
- Reference new automation scripts: `context-snapshot.sh`, `vercel-validate.sh`, `redis-observability.sh` for troubleshooting and diagnostics.

## Task Ledgers

Task and incident ledgers live in `store/ledgers/`. Each ledger entry follows `task-ledger.schema.json` and captures:

- Current status (`in_progress`, `blocked`, `completed`)
- Owning agent and collaborators
- Context snapshot hashes for reproducibility
- MCP tools used and notable outputs (trimmed to preserve context window)
- Escalation history and environment switches

## Usage Patterns

```ts
import {
  ContextManager,
  EnvironmentContextManager,
} from "./context-manager.js";

const context = new ContextManager();
const envs = new EnvironmentContextManager();

// 1. Load agent scratchpad and append a note
await context.updateScratchpad({
  agentId: "development-workflow",
  data: {
    currentTask: "implement-campaign-export",
    notes: ["MCP validation suite passes in troubleshooting"],
  },
});

// 2. Retrieve only troubleshooting-related memories with recent activity
const memories = await context.select({
  agentId: "development-workflow",
  filters: { environment: "troubleshooting", sinceMinutes: 120 },
});

// 3. Switch environment with a recorded reason
await envs.switchEnvironment({
  agentId: "production-ops",
  target: "production",
  reason: "P0 incident response",
  requireApproval: true,
});

// 4. Compress an oversized scratchpad automatically
await context.compress({ agentId: "observability", maxItems: 50 });
```

## Automation Hooks

- **MCP Tasks**: Agents call the context manager before MCP tool invocations to load only relevant state
- **Supabase CLI Tasks**: Task-ledger entries capture migration validations and deployment history
- **Incident Response**: Observability agent records correlated errors and timelines inside incident ledgers
- **Session Recovery**: `ContextManager.restore()` rebuilds agent state after Codespace or MCP restarts

## Compliance Checklist

- [x] Persistent scratchpads, memories, and ledgers (Write)
- [x] Retrieval filters for task relevance, recency, and environment (Select)
- [x] Automatic summarization and pruning to keep context windows lean (Compress)
- [x] Agent- and environment-level isolation with permission enforcement (Isolate)
- [x] Environment-aware context switching with approvals for production
- [x] Audit trail of handoffs and environment transitions

The context store is the single source of truth for cross-agent coordination. Agents MUST go through the context manager APIs rather than reading files directly to ensure consistency with MCP workflows. For troubleshooting, always use dry-run and validate environment mapping before running agents or workflows.
