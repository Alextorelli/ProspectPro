# Agent Templates & Patterns

## Template Directory

This directory contains reusable agent configuration patterns and templates for ProspectPro's MCP-first AI agent architecture.

## Available Templates

### 1. MCP Tool Consumer Template

**Use Case**: Agents that primarily consume MCP tools for automation
**Example Agents**: Development Workflow, Observability, Production Ops

**Template Structure**:

```json
{
  "name": "<agent-name>",
  "version": "2.0.0",
  "role": "<role-description>",
  "capabilities": ["<capability-1>", "<capability-2>"],
  "mcp_dependencies": {
    "primary": ["<server-1>", "<server-2>"],
    "secondary": ["<server-3>"]
  },
  "tools_access": ["<server>.<tool-1>", "<server>.<tool-2>"],
  "knowledge_base": {
    "<category>": "<path-to-docs>"
  },
  "escalation_criteria": ["<condition-1>", "<condition-2>"]
}
```

### 2. Architecture Decision Template

**Use Case**: System Architect agent for design reviews and ADRs
**Key Sections**: Decision context, MCP tool impact, implementation plan

**Template Structure**:

```markdown
# ADR-XXX: [Decision Title]

## Status: [Proposed|Accepted|Deprecated]

## Context

What problem are we solving? Include current state, pain points, and requirements.

## Decision

What architecture change are we making? Include:

- Technical approach
- MCP server/tool involvement
- Database schema changes (if any)
- Performance implications

## Consequences

- **Positive**: Performance, cost, maintainability improvements
- **Negative**: Migration effort, temporary complexity
- **Neutral**: Documentation updates required

## MCP Tool Impact

Which MCP servers/tools are affected?

- postgresql: [describe impact]
- supabase-troubleshooting: [describe impact]
- integration-hub: [describe impact]

## Implementation Plan

1. Schema changes (validate with postgresql.validate_migration)
2. Edge Function updates
3. MCP tool modifications
4. Testing & validation steps
5. Deployment sequence
6. Rollback procedure
```

### 3. Incident Response Template

**Use Case**: Production Ops and Observability agents for P0/P1 incidents
**Key Sections**: Detection, investigation, mitigation, communication

**Template Structure**:

```markdown
# Incident: [INC-YYYY-MM-DD-NNN]

## Severity: [P0|P1|P2|P3]

## Status: [Investigating|Mitigating|Resolved|Post-Mortem]

## Detection (Timestamp)

How was the incident detected?

- Automated alert from observability agent
- User report
- Monitoring dashboard

## Impact Assessment

- Affected services: [business-discovery, enrichment, export, auth]
- Error rate: [percentage]
- Users impacted: [number or "all"]
- Data integrity: [compromised|intact]

## Investigation (MCP Tools Used)

1. Error correlation: `mcp.supabase_troubleshooting.correlate_errors`
2. Incident timeline: `mcp.supabase_troubleshooting.generate_incident_timeline`
3. Integration health: `mcp.integration_hub.check_integration_health`
4. Database health: `mcp.postgresql.check_pool_health`

## Root Cause Analysis

What caused the incident?

- Technical failure point
- Code changes involved (git commit SHA)
- Configuration issues
- External dependency failure

## Mitigation Steps

1. Immediate actions taken (rollback, circuit breaker activation)
2. MCP workflows executed
3. Service restoration timeline

## Communication Log

- [Timestamp] Initial alert sent to Slack/PagerDuty
- [Timestamp] Status page updated
- [Timestamp] Resolution communicated

## Prevention Measures

1. New detection rules for observability agent
2. Runbook updates
3. Code/config changes to prevent recurrence
4. Testing improvements

## Post-Mortem Follow-up

- Engineering review scheduled: [Date]
- Action items created: [GitHub issue links]
- Documentation updated: [File paths]
```

### 4. MCP Server Implementation Template

**Use Case**: Creating new MCP servers with circuit breakers and OTEL
**Key Sections**: Tool definitions, circuit breaker logic, OTEL spans

**Template Structure** (`/mcp-servers/new-server.js`):

```javascript
#!/usr/bin/env node

/**
 * [Server Name] MCP Server
 *
 * Purpose: [Brief description]
 * Capabilities: [List of tools]
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import pRetry from "p-retry";
import pTimeout from "p-timeout";

// Circuit breaker state
const circuitBreaker = {
  failures: 0,
  lastFailure: null,
  state: "CLOSED",
  threshold: 5,
  timeout: 60000,
};

function checkCircuitBreaker() {
  /* implementation */
}
function recordSuccess() {
  /* implementation */
}
function recordFailure() {
  /* implementation */
}

class NewMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: "prospectpro-new-server",
        version: "1.0.0",
      },
      {
        capabilities: { tools: {} },
      }
    );
    this.setupToolHandlers();
  }

  setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: "tool_name",
          description: "Tool description",
          inputSchema: {
            type: "object",
            properties: {
              /* schema */
            },
            required: ["param1"],
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        checkCircuitBreaker();

        if (name === "tool_name") {
          const result = await pTimeout(
            pRetry(
              async () => {
                // Tool implementation with retries
              },
              { retries: 3 }
            ),
            { milliseconds: 30000 }
          );

          recordSuccess();
          return result;
        }

        throw new Error(`Unknown tool: ${name}`);
      } catch (error) {
        recordFailure();
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                error: error.message,
                circuitBreakerState: circuitBreaker.state,
              }),
            },
          ],
          isError: true,
        };
      }
    });
  }

  async connect() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("[Server Name] MCP Server running on stdio");
  }
}

// Start server
const server = new NewMCPServer();
server.connect().catch((error) => {
  console.error("Failed to start MCP server:", error);
  process.exit(1);
});

process.on("SIGINT", () => {
  console.error("Shutting down...");
  process.exit(0);
});
```

### 5. Testing Workflow Template

**Use Case**: Development Workflow agent for comprehensive testing
**Key Sections**: Unit tests, integration tests, E2E tests, Thunder Client

**Template Structure** (`/scripts/testing/test-new-feature.sh`):

```bash
#!/bin/bash
set -euo pipefail

# Test script for [Feature Name]
# Invoked by: Development Workflow Agent
# MCP Tools: chrome-devtools, github, postgresql, integration-hub

FEATURE_NAME="$1"
TEST_ENV="${2:-local}"

echo "Testing ${FEATURE_NAME} in ${TEST_ENV} environment..."

# 1. Unit tests
echo "Running unit tests..."
npm run test -- --grep="${FEATURE_NAME}"

# 2. Database integration tests
echo "Running database tests..."
npm run supabase:test:db

# 3. Edge Function tests (requires session JWT)
if [[ -n "${SUPABASE_SESSION_JWT:-}" ]]; then
  echo "Running Edge Function tests..."
  npm run supabase:test:functions
else
  echo "Skipping Edge Function tests (SUPABASE_SESSION_JWT not set)"
fi

# 4. Thunder Client API tests
echo "Running Thunder Client tests..."
npm run thunder:test

# 5. Chrome DevTools visual regression (if frontend changes)
if [[ "${TEST_ENV}" == "production" ]]; then
  echo "Running visual regression tests..."
  # MCP call to chrome-devtools server
  mcp chrome_devtools screenshot_capture --url=https://prospect-fyhedobh1-appsmithery.vercel.app
fi

echo "All tests passed for ${FEATURE_NAME}!"
```

## Agent Collaboration Patterns

### Pattern 1: Feature Development Flow

```
Developer Request
  ↓
Development Workflow Agent (analyze requirements)
  ↓
System Architect Agent (design review, schema validation)
  ↓
Development Workflow Agent (implement, test)
  ↓
Observability Agent (validate trace coverage)
  ↓
Production Ops Agent (deploy with health checks)
```

### Pattern 2: Incident Response Flow

```
Automated Alert (Observability Agent)
  ↓
Production Ops Agent (triage severity, notify team)
  ↓
Observability Agent (correlate errors, generate timeline)
  ↓
System Architect Agent (root cause analysis, design fix)
  ↓
Development Workflow Agent (implement fix, test)
  ↓
Production Ops Agent (deploy hotfix, verify resolution)
  ↓
All Agents (post-mortem, runbook updates)
```

### Pattern 3: Database Migration Flow

```
System Architect Agent (design schema change, create migration SQL)
  ↓
MCP postgresql.validate_migration (syntax check, rollback test)
  ↓
Development Workflow Agent (test migration in local environment)
  ↓
Observability Agent (baseline performance metrics)
  ↓
Production Ops Agent (execute migration in production)
  ↓
Observability Agent (monitor post-migration performance)
  ↓
Production Ops Agent (rollback if errors detected)
```

## MCP Tool Composition Patterns

### Pattern 1: Multi-Step Workflow (Integration Hub)

```javascript
// Campaign export with notification
await mcp.integration_hub.execute_workflow({
  workflowId: "campaign-export",
  input: { campaignId, format: "csv" },
  dryRun: false,
});

// Workflow steps executed internally:
// 1. validate_campaign (supabase-troubleshooting)
// 2. generate_csv (internal)
// 3. upload_storage (supabase)
// 4. send_notification (integration-hub)
```

### Pattern 2: Error Correlation + Incident Timeline

```javascript
// 1. Aggregate errors from last hour
const errors = await mcp.supabase_troubleshooting.correlate_errors({
  timeWindowStart: new Date(Date.now() - 3600000).toISOString(),
});

// 2. Generate timeline for top incident
await mcp.supabase_troubleshooting.generate_incident_timeline({
  incidentId: errors.correlatedErrors[0].incidentId,
});

// 3. Notify production ops
await mcp.integration_hub.send_notification({
  channel: "slack",
  recipient: process.env.INCIDENT_WEBHOOK_URL,
  message: `Incident ${incidentId} detected - ${errors.summary}`,
  severity: "critical",
});
```

### Pattern 3: Database Health + Performance Analysis

```javascript
// 1. Check pool utilization
const poolHealth = await mcp.postgresql.check_pool_health();

// 2. If utilization >80%, analyze slow queries
if (poolHealth.utilizationPercent > 80) {
  const slowQueries = await mcp.postgresql.analyze_slow_queries({
    thresholdMs: 500,
    limit: 10,
  });

  // 3. Explain top slow query
  const explanation = await mcp.postgresql.explain_query({
    query: slowQueries.slowQueries[0].query,
    analyze: true,
  });

  // 4. Escalate to system architect for optimization
  await mcp.integration_hub.send_notification({
    channel: "slack",
    recipient: process.env.ARCHITECT_ALERT_WEBHOOK,
    message: `Database pool at ${poolHealth.utilizationPercent}% - optimization needed`,
    severity: "warning",
    metadata: { slowQueries, explanation },
  });
}
```

## Anti-Patterns (Avoid These)

### ❌ Direct Database Mutations Without Validation

```javascript
// WRONG: Skip migration validation
await db.query("ALTER TABLE campaigns ADD COLUMN new_field TEXT");

// CORRECT: Always validate first
await mcp.postgresql.validate_migration({
  migrationSql: "ALTER TABLE campaigns ADD COLUMN new_field TEXT",
  rollback: true,
});
```

### ❌ Missing Circuit Breaker Protection

```javascript
// WRONG: Direct external API call without protection
const result = await fetch(externalAPI);

// CORRECT: Use integration-hub with circuit breaker
await mcp.integration_hub.check_integration_health();
const result = await pRetry(() => fetch(externalAPI), { retries: 3 });
```

### ❌ Bypassing MCP Tools for Manual Scripts

```javascript
// WRONG: Custom bash script for testing
exec('curl -X POST https://... | grep "success"');

// CORRECT: Use MCP workflow automation
await mcp.integration_hub.execute_workflow({
  workflowId: "test-discovery-pipeline",
  input: { businessType, location },
});
```

## Template Usage Guide

**For New Agents**:

1. Copy `config.json` template
2. Customize `mcp_dependencies` and `tools_access`
3. Create `instructions.md` with role-specific playbooks
4. Register in `/mcp-servers/registry.json` if MCP server

**For New MCP Servers**:

1. Copy `new-server.js` template
2. Implement tools in `setupToolHandlers()`
3. Add circuit breaker logic per external dependency
4. Register in `.vscode/mcp_config.json`
5. Update `/mcp-servers/registry.json` with capabilities

**For New Workflows**:

1. Identify agent collaboration pattern (development, incident, migration)
2. Map MCP tool sequence
3. Create testing script template
4. Document in agent `instructions.md`

## Maintenance

**Template Updates**:

- Review quarterly for new MCP patterns
- Update when new MCP servers added
- Incorporate lessons from incident post-mortems
- Keep synchronized with `.github/copilot-instructions.md`

**Version Control**:

- Templates versioned with agent configs (v2.0.0)
- Breaking changes require major version bump
- Document changes in `/docs/technical/agent-architecture.md`
