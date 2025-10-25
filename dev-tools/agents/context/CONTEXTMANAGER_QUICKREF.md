# ContextManager & EnvironmentContextManager Quick Reference

## ContextManager (context-manager.ts)

```ts
import { ContextManager } from "./context-manager";

// Checkpoint current agent state
ContextManager.checkpoint({
  agentId: "development-workflow", // or system-architect, observability, production-ops
  notes:
    "Describe current state or task. All DB/migration/testing via Supabase MCP or Drizzle ORM.",
});

// Update scratchpad
ContextManager.updateScratchpad({
  agentId: "development-workflow",
  update:
    "New notes or context. Use MCP-first workflows and Drizzle ORM for queries.",
});

// Read current context
const ctx = ContextManager.getContext("development-workflow");
```

## EnvironmentContextManager

```ts
import { EnvironmentContextManager } from "./context-manager";

// Switch environment (e.g., before deploy)
EnvironmentContextManager.switchEnvironment({
  target: "production", // or 'development', 'troubleshooting'
  reason:
    "Deploying new edge function. All DB/migration/testing via Supabase MCP or Drizzle ORM.",
});

// Get current environment
const env = EnvironmentContextManager.getCurrentEnvironment();
```

// All DB/migration/testing is handled via Supabase MCP and Drizzle ORM. Do not use legacy PostgreSQL MCP, custom scripts, or deprecated tools.
// Always reference canonical automation scripts in scripts/operations/ at the repo root. Use --dry-run and environment-loader contract for safe diagnostics and context recovery.
