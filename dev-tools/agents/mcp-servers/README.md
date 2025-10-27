# ProspectPro Enhanced MCP (Model Context Protocol) Implementation v3.1

## Overview

This directory contains the **enhanced MCP server implementation** that provides AI assistants with comprehensive access to ProspectPro's complete email discovery & verification platform, enrichment APIs, background discovery jobs, contact validation, and **troubleshooting capabilities**. Version 3.1 adds tooling for the v4.3 background discovery pipeline (Census + Foursquare), Supabase session enforcement (auth.getUser), tier-aware cost tracking, and asynchronous job diagnostics.

> Note: `MCP-package.json` mirrors the root `package.json` MCP scripts so reviewers can audit server dependencies without touching the primary manifest. Keep both files aligned when adding scripts or dependencies.

**Architecture**: 3 specialized servers for enrichment production, development, and troubleshooting workflows (PostgreSQL MCP server removed; all DB tooling now via Supabase MCP + Drizzle ORM)  
**Tools**: 42 tools total across all servers (6 troubleshooting + 36 enrichment tools)  
**Status**: Production-ready with tier-aware background discovery + enrichment (v4.3)

## Enhanced MCP Servers v3.0 - Email Discovery & Verification Architecture

## Registry & Server Inventory (2025-10-25)

**Active MCP Servers:**

- Production Server (`production-server.js`)
- Development Server (`development-server.js`)
- Observability Server (`observability-server.js`)

**Retired:**

- PostgreSQL MCP Server (all Postgres/DB tooling now handled by Supabase MCP and Drizzle ORM)

---

### 4. Cognitive Extensions (Sequential + Memory)

ProspectPro ships two lightweight cognitive servers alongside the enrichment stack:

- **Sequential Thinking** (`mcp-tools/sequential/`): streams structured reasoning steps to `dev-tools/agents/context/session_store/sequential-thoughts.jsonl` by default. Override via `SEQUENTIAL_LOG_PATH`; suppress persistence with `DISABLE_THOUGHT_LOGGING=true`.
- **Memory Graph** (`mcp-tools/memory/`): manages a JSONL knowledge graph at `dev-tools/agents/context/session_store/memory.jsonl`. Override via `MCP_MEMORY_FILE_PATH`. A snapshot line is appended whenever `read_graph` is executed.

Run `npm run build:tools` in `dev-tools/agents/mcp-servers/` after editing these packages so the registry (`active-registry.json`) can execute the latest `dist/` output.

### 1. Production Server (`production-server.js`) - **v2.1.0**

**Purpose**: Comprehensive email enrichment monitoring, Hunter.io/NeverBounce analytics, enrichment cost tracking, and deliverability validation (28 tools)

**Enrichment Capabilities**:

- Email discovery status tracking (Hunter.io)
- Email verification monitoring (NeverBounce)
- Apollo API integration monitoring (optional)
- Enrichment cost breakdown per lead
- Deliverability accuracy tracking (95%)
- Circuit breaker status monitoring

### 2. Development Server (`development-server.js`) - **v1.1.0**

**Purpose**: Email enrichment development, Hunter.io/NeverBounce API testing, circuit breaker validation, and deliverability benchmarking (8 tools)

**Enhanced Features**:

- Hunter.io email discovery testing (6 endpoints)
- NeverBounce verification testing (FREE + paid)
- Apollo contact enrichment testing (optional)
- Enrichment orchestrator validation
- Circuit breaker pattern testing
- Caching efficiency benchmarks

### 3. Observability Server (`observability-server.js`) - **v2.0.0**

**Purpose**: Distributed tracing, monitoring, and Supabase diagnostics with OpenTelemetry and Highlight.io error reporting

**Observability & Diagnostics Capabilities** (15 tools):

- `test_edge_function` - Smoke test Edge Functions (tracing + error reporting)
- `validate_database_permissions` - Check RLS policies and DB permissions
- `run_rls_diagnostics` - Generate RLS diagnostic SQL
- `supabase_cli_healthcheck` - CLI status check
- `check_production_deployment` - Full deployment health check
- `vercel_status_check` - Vercel deployment status
- `generate_debugging_commands` - Generate curl/CLI commands
- `collect_and_summarize_logs` - Fetch and analyze logs
- `validate_ci_cd_suite` - Run test suite with tracing
- `query_traces` - Query historical traces
- `generate_trace_report` - Generate trace analysis
- `start_trace` - Start distributed trace
- `add_trace_event` - Add event to active span
- `end_trace` - Complete trace with status
- `health_check` - Server health check

**When to Use Observability Server**:

- Edge Function or enrichment failures
- RLS or database permission issues
- CI/CD or deployment health checks
- Error reporting and tracing validation

---

**Note:** All database and migration tooling is now handled by the Supabase MCP (hosted endpoint) and Drizzle ORM (for type-safe queries/migrations). No standalone PostgreSQL MCP server remains in the registry or package scripts as of 2025-10-25.

## Quick Start

```bash
# Start production monitoring
npm run start:production

# Start development server
npm run start:development


# Start observability server (for diagnostics, tracing, and error reporting)
npm run start:observability

# Start all servers
npm run start:all

# Test all servers
npm run test
```

## 🚨 Quick Troubleshooting (NEW in v3.0)

### Frontend Shows "Discovery Failed" or "API request failed: 404"

**IMMEDIATE DIAGNOSIS** with Observability MCP Server:

```bash
npm run start:observability
```

In your AI assistant, use these MCP tools in systematic order:

1. `test_edge_function` - Verify backend works independently of frontend
2. `validate_database_permissions` - Verify RLS policies are configured correctly
3. `run_rls_diagnostics` - Generate diagnostic SQL for RLS
4. `check_production_deployment` - Validate frontend/backend deployment status
5. `generate_debugging_commands` - Get custom debugging scripts for your config

**Manual Quick Test** (if MCP not available):

```bash
# Test background discovery function directly (requires Supabase session JWT)
curl -X POST 'https://sriycekxdqnesdsgwiuc.supabase.co/functions/v1/business-discovery-background' \
  -H 'Authorization: Bearer SUPABASE_SESSION_JWT' \
  -H 'Content-Type: application/json' \
  -d '{"businessType": "coffee shop", "location": "Seattle, WA", "tierKey": "PROFESSIONAL", "maxResults": 2, "sessionUserId": "mcp-diagnostics"}'
```

Follow up with the dedicated auth diagnostics:

```bash
curl -X POST 'https://sriycekxdqnesdsgwiuc.supabase.co/functions/v1/test-new-auth' \
  -H 'Authorization: Bearer SUPABASE_SESSION_JWT' \
  -H 'Content-Type: application/json' \
  -d '{"diagnostics":true}'

curl -X POST 'https://sriycekxdqnesdsgwiuc.supabase.co/functions/v1/test-official-auth' \
  -H 'Authorization: Bearer SUPABASE_SESSION_JWT' \
  -H 'Content-Type: application/json' \
  -d '{}'

./scripts/test-auth-patterns.sh SUPABASE_SESSION_JWT
```

**Expected Results**: Real business data response = backend working, frontend issue  
**If 401 error**: Authentication or RLS policy issue

### 3. VS Code Configuration

The consolidated MCP configuration is automatically set up in `.vscode/settings.json`:

```json
{
  "mcp.enable": true,
  "mcp.servers": {
    "prospectpro-production": {
      "enabled": true,
      "autoStart": true,
      "description": "Enhanced Production Server - 28 tools"
    },
    "prospectpro-development": {
      "enabled": true,
      "autoStart": false,
      "description": "Development Server - 8 specialized tools"
    }
  }
}
```

### 4. Environment Requirements

Consolidated servers require the same environment variables as the main application:

- `SUPABASE_URL`: Database connection
- `SUPABASE_SECRET_KEY`: Database access
- API keys for external services (Google Places, Hunter.io, NeverBounce, Foursquare)
- Development server requires additional API keys for new integrations (US Chamber, BBB, etc.)

## Usage Examples

### Database Queries via AI

```
"Show me the top 10 leads with confidence scores above 85"
"Analyze lead quality patterns for restaurants in New York"
"What are the API costs for the last 24 hours?"
```

### API Testing via AI

```
"Test the Google Places API with a search for 'coffee shops in Seattle'"
"Simulate lead discovery for 'restaurants' in 'San Francisco'"
"Verify the email address john@example.com"
```

### Codebase Analysis via AI

```
"Analyze the project structure and identify key components"
"Check for any fake data generation patterns in the code"
"Find all error handling patterns in API clients"
```

### System Monitoring via AI

```
"Check the overall system health status"
"Analyze recent application logs for errors"
"Generate a performance report with recommendations"
```

## Advanced AI Workflows

### 1. Lead Quality Analysis

AI can now directly query your database to provide insights like:

- "Which business types have the highest confidence scores?"
- "What's the correlation between email confidence and overall lead quality?"
- "Show me leads that failed validation and why"

### 2. API Cost Optimization

AI can analyze your API usage patterns:

- "Which APIs are costing the most money?"
- "Are we approaching any quota limits?"
- "Suggest optimizations to reduce API costs"

### 3. Code Quality Assurance

AI can continuously monitor code quality:

- "Are there any patterns that could lead to fake data generation?"
- "Analyze error handling coverage across all modules"
- "Check if all API clients follow the same patterns"

### 4. System Performance Monitoring

AI can provide system insights:

- "Is the system performing optimally?"
- "What are the largest files that might be slowing down development?"
- "Are there any configuration issues that need attention?"

## Consolidated MCP Server Management

### Consolidated Server Commands

```bash
# Start production server (28 tools - auto-starts with VS Code)
npm run start:production

# Start development server (8 tools - manual start)
npm run start:development

# Start both servers for comprehensive development
npm run start:all
```

### Server Status Monitoring

```bash
# Test both consolidated servers
npm run test

# Check detailed test results and performance metrics
cat test-results.json

# Validate specific server capabilities
node -e "console.log(require('./production-server.js').tools.length + ' production tools')"
node -e "console.log(require('./development-server.js').tools.length + ' development tools')"
```

### Performance Benefits

**Consolidation Results**:

- **Servers**: 5 → 2 (60% reduction)
- **Memory Usage**: ~40% reduction in MCP processes
- **Startup Time**: ~50% faster initialization
- **Tools Available**: 36 total (100% preservation)
- **Test Coverage**: Comprehensive validation suite

## Security Considerations

### Data Access Control

- MCP servers use the same authentication as the main application
- Database access is limited to read-only operations where appropriate
- API keys are passed through environment variables only

### AI Context Boundaries

- MCP servers provide structured access to prevent unauthorized operations
- Each server has defined capabilities and cannot exceed its scope
- Error handling prevents sensitive information leakage

## Troubleshooting

### Common Issues

1. **MCP Servers Not Starting**

   - Check dependencies: `npm run mcp:install`
   - Verify environment variables are set
   - Run tests: `npm run mcp:test`

2. **VS Code Not Recognizing MCP**

   - Restart VS Code after configuration changes
   - Check `.vscode/mcp-config.json` syntax
   - Verify MCP is enabled in settings

3. **Database Connection Issues**

   - Check Supabase credentials
   - Verify database server status
   - Run diagnostics: `curl http://localhost:3000/diag`

4. **API Testing Failures**

   - Verify API keys are configured
   - Check API quota limits
   - Test individual APIs outside MCP first

5. **Blank Screen After Campaign Completion**

- Run `npm install && npm run build` to ensure the v4.3.1 null-safe store is bundled before redeploying `/dist`.
- Confirm the browser console is clear of React runtime error 185 using dev tools.
- If the issue persists, tail the background discovery logs (`supabase functions logs business-discovery-background --follow`) to verify Supabase is still emitting lead batches.

## Development Notes

### Adding New MCP Tools

1. Add tool definition to the server's `tools/list` handler
2. Implement tool execution in `tools/call` handler
3. Update this documentation
4. Add tests to `test-servers.js`

### Best Practices

- Keep tools focused on specific functionality
- Provide detailed error messages
- Include usage examples in tool descriptions
- Implement proper error handling and validation
- Cache expensive operations where appropriate

## Migration from v1.0 (Individual Servers)

### What Changed in v2.0 Consolidation

**Before (v1.0)**:

- 5 separate servers: database, api, filesystem, monitoring, production
- Complex management and startup procedures
- Higher memory overhead
- Context switching between servers

**After (v2.0)**:

- 2 consolidated servers: production (28 tools) + development (8 tools)
- Simplified management and configuration
- Optimized resource usage
- Unified tool access patterns

### Backward Compatibility

All 36 original tools are preserved with identical functionality. AI workflows continue to work without changes.

### Archived Components

Original individual servers are preserved in `/archive/mcp-servers-individual/` for reference.

## Integration with ProspectPro Architecture

The consolidated MCP implementation enhances ProspectPro's core principles:

### Zero Fake Data Policy ✅

- **Production server** actively monitors for fake data patterns (6 filesystem analysis tools)
- All database queries return real, validated business data (4 database tools)
- API testing uses actual external service endpoints (8 API testing tools)
- **Development server** includes templates that enforce real data patterns

### Cost Optimization ✅

- **Consolidated architecture** reduces infrastructure overhead by 60%
- API tracking and quota monitoring (8 API tools in production server)
- Budget analysis and cost breakdown reporting (database analytics)
- Performance benchmarking tools (development server)

### Performance Monitoring ✅

- **Enhanced monitoring capabilities** (7 system monitoring tools)
- Real-time health checks and diagnostics
- Comprehensive performance analysis and recommendations
- Docker integration and deployment tracking

### AI-Enhanced Development Workflow

This v2.0 consolidated MCP implementation transforms ProspectPro development into a **streamlined AI-enhanced workflow** where intelligent assistants have direct access to:

- **Real business data** through optimized database analytics
- **Live API testing** with cost and performance monitoring
- **Comprehensive system insights** through unified diagnostics
- **Development acceleration** through specialized tooling

**Result**: 60% fewer processes, 100% functionality preservation, enhanced AI productivity.
