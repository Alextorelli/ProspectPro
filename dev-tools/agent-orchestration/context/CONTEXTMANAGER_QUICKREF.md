# ContextManager & EnvironmentContextManager Quick Reference

## ContextManager (context-manager.ts)

```ts
import { ContextManager } from "./context-manager";

// Checkpoint current agent state
ContextManager.checkpoint({
  agentId: "<agent_id>",
  notes: "Describe current state or task",
});

// Update scratchpad
ContextManager.updateScratchpad({
  agentId: "<agent_id>",
  update: "New notes or context",
});

// Read current context
const ctx = ContextManager.getContext("<agent_id>");
```

## EnvironmentContextManager

```ts
import { EnvironmentContextManager } from "./context-manager";

// Switch environment (e.g., before deploy)
EnvironmentContextManager.switchEnvironment({
  target: "production", // or 'development', 'troubleshooting'
  reason: "Deploying new edge function",
});

// Get current environment
const env = EnvironmentContextManager.getCurrentEnvironment();
```

_Replace `<agent_id>` with your actual agent directory or ID._
