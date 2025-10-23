# MCP Client Service Layer

**Safeguarded MCP Integration Layer for ProspectPro Agent Orchestration**

## Overview

This module provides a portable, testable service layer for MCP (Model Context Protocol) client management, configuration fallback, workspace safety, retry strategies, and telemetry integration. Designed for maximum flexibility within the hybrid-mono structure, avoiding direct VS Code API coupling until extension wiring.

## Quick Start

```typescript
import {
  MCPClientManager,
  ConfigLocator,
  WorkspaceContext,
  NoOpTelemetrySink,
} from "@prospectpro/mcp-service-layer";

// 1. Setup components with dependency injection
const manager = new MCPClientManager({
  configLocator: new ConfigLocator("/workspace"),
  workspaceContext: new WorkspaceContext({ injectedRoot: "/workspace" }),
  telemetrySink: new NoOpTelemetrySink(),
});

// 2. Initialize and use
await manager.initialize();
const client = await manager.getClient("my-server");
const tools = await client.listTools();
await manager.destroyAll();
```

## Configuration

Create MCP server configuration in one of these locations (fallback order):

1. `.vscode/mcp_config.json` (primary)
2. `config/mcp-config.json` (fallback)

```json
{
  "mcpServers": {
    "development": {
      "command": "node",
      "args": ["./dev-server.js"],
      "timeout": 5000
    },
    "production": {
      "command": "python",
      "args": ["-m", "prod_server"],
      "env": { "NODE_ENV": "production" },
      "timeout": 10000
    }
  }
}
```

## Architecture Components

### ConfigLocator

Handles fallback configuration loading with structured error reporting.

```typescript
const configLocator = new ConfigLocator(
  "/workspace", // workspace root
  ".vscode/mcp_config.json", // primary path (optional)
  "config/mcp-config.json" // fallback path (optional)
);

const result = configLocator.loadConfig();
// Returns: { config, source, warnings }
```

### WorkspaceContext

Safe workspace root resolution with dependency injection support.

```typescript
// Via injection (recommended for testing)
const context = new WorkspaceContext({
  injectedRoot: "/workspace",
});

// Via VS Code API (for extension integration)
const context = new WorkspaceContext({
  vscodeWorkspaceFolders: vscode.workspace.workspaceFolders,
});

const root = context.getWorkspaceRoot(); // throws if undefined
```

### MCPClientManager

Core client lifecycle management with caching, retries, and telemetry.

```typescript
const manager = new MCPClientManager({
  configLocator,
  workspaceContext,
  telemetrySink,
  retryOptions: {
    // optional
    maxAttempts: 3,
    baseDelayMs: 1000,
    maxDelayMs: 30000,
    backoffMultiplier: 2,
    jitter: true,
  },
});

// Initialize (loads config, validates)
await manager.initialize();

// Get clients (cached automatically)
const client1 = await manager.getClient("server-name");
const client2 = await manager.getClient("server-name"); // same instance

// Use client
const tools = await client1.listTools();
const result = await client1.callTool("tool-name", { param: "value" });

// Cleanup
await manager.dispose(client1); // dispose individual client
await manager.destroyAll(); // dispose all clients
```

### TelemetrySink

Lightweight telemetry interface for observability integration.

```typescript
// Custom implementation
class MyTelemetrySink implements TelemetrySink {
  info(message: string, properties?: Record<string, any>): void {
    console.log(`[INFO] ${message}`, properties);
  }

  warn(message: string, properties?: Record<string, any>): void {
    console.warn(`[WARN] ${message}`, properties);
  }

  error(
    message: string,
    error?: Error,
    properties?: Record<string, any>
  ): void {
    console.error(`[ERROR] ${message}`, error, properties);
  }

  event(event: TelemetryEvent): void {
    console.log(`[EVENT] ${event.name}`, event.properties);
  }
}

// Or use the tracing-enabled implementation
import { TracingTelemetrySink } from "@prospectpro/mcp-service-layer";

const telemetrySink = new TracingTelemetrySink({
  serviceName: "my-mcp-service",
  serviceVersion: "1.0.0",
});

// This will create OpenTelemetry spans and events
telemetrySink.info("Service started", { port: 3000 });
```

### Tracing Integration

The service layer includes built-in OpenTelemetry tracing support:

```typescript
import { TracingTelemetrySink } from "@prospectpro/mcp-service-layer";

const tracingSink = new TracingTelemetrySink({
  serviceName: "prospectpro-mcp-client",
  serviceVersion: "1.0.0",
});

// All MCP operations will be automatically traced
const manager = new MCPClientManager({
  // ... other options
  telemetrySink: tracingSink,
});

// Manual span creation for custom operations
const span = tracingSink.startSpan("custom-operation", {
  operation: "data-processing",
  batchSize: 100,
});

try {
  // Your operation here
  await processData();
  span.setAttribute("success", true);
} catch (error) {
  span.recordException(error);
  span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
} finally {
  span.end();
}
```

````

### ChatModeLoader

Parameterized loading of chat mode manifests.

```typescript
const loader = new ChatModeLoader();

// Load from default path (.github/chatmodes)
const manifest = loader.loadManifest("smart-debug");

// Load from custom path
const customManifest = loader.loadManifest("custom-mode", "/custom/path");
````

## Testing

The package includes comprehensive test coverage:

```bash
# Run all tests
npm test

# Run specific test suites
npm test -- ConfigLocator
npm test -- MCPClientManager
npm test -- integration

# Run with coverage
npm run test:coverage
```

### Test Structure

- **Unit Tests:** `__tests__/*.test.ts` - Individual component testing
- **Integration Tests:** `__tests__/*.integration.test.ts` - Full lifecycle testing
- **Usage Examples:** `examples/usage-example.ts` - Executable examples

## Error Handling

The service layer provides structured error handling:

```typescript
try {
  await manager.initialize();
} catch (error) {
  if (error.message.includes("No valid MCP config found")) {
    // Handle missing configuration
  }
}

try {
  const client = await manager.getClient("unknown-server");
} catch (error) {
  if (error.message.includes("not found in config")) {
    // Handle unknown server
  }
}
```

## Retry Strategy

Built-in exponential backoff with jitter for resilient connections:

```typescript
const manager = new MCPClientManager({
  // ... other options
  retryOptions: {
    maxAttempts: 5, // max retry attempts
    baseDelayMs: 500, // initial delay
    maxDelayMs: 60000, // max delay cap
    backoffMultiplier: 2, // exponential factor
    jitter: true, // add randomization
  },
});
```

## Concurrent Access

The manager handles concurrent client requests safely:

```typescript
// These will return the same client instance
const [client1, client2, client3] = await Promise.all([
  manager.getClient("server-name"),
  manager.getClient("server-name"),
  manager.getClient("server-name"),
]);

console.log((client1 === client2) === client3); // true
```

## Development & Extension Integration

### Mock Adapter for Development

The package includes a mock MCP adapter for development and testing:

```typescript
import { MockMCPClientAdapter } from "@prospectpro/mcp-service-layer";

const manager = new MCPClientManager({
  // ... other options
  clientAdapter: new MockMCPClientAdapter(), // provides mock responses
});
```

### Production Integration

For production, integrate with the actual MCP SDK:

```typescript
class ProductionMCPAdapter implements MCPClientAdapter {
  async createClient(
    serverName: string,
    config: MCPServerConfig
  ): Promise<MCPClient> {
    // Use actual MCP SDK to create clients
    return new ProductionMCPClient(serverName, config);
  }

  async dispose(): Promise<void> {
    // Cleanup MCP SDK resources
  }
}
```

## Guardrails & Safeguards

- **No Direct .vscode/.github Edits:** All configuration proposals staged in `docs/tooling/settings-troubleshooting.md`
- **Dependency Inversion:** All components injectable for testing; no hardcoded VS Code APIs
- **Error Handling:** Structured warnings and actionable errors; no silent failures
- **Telemetry Integration:** Lightweight hooks for observability without coupling to specific sinks
- **Workspace Safety:** Helpers for safe workspace root resolution; no unsafe array access
- **Connection Pooling:** Automatic caching and reuse of connected clients
- **Graceful Degradation:** Fallback configuration paths and structured error reporting

## Development Scripts

```bash
# Install dependencies
npm install

# Run tests
npm test
npm run test:watch
npm run test:coverage

# Build TypeScript
npm run build

# Lint code
npm run lint
npm run lint:fix

# Run usage example
npm run example
```

## Integration Roadmap

- **Phase 3A:** ✅ Core service layer implementation
- **Phase 3B:** Extension wiring (chat participants, command registration)
- **Phase 3C:** VS Code API integration and UI components
- **Phase 4:** Production deployment and monitoring integration

All changes logged in `dev-tools/context/session_store/agent-chat-integration-plan.tmp.md`
