# Revised MECE Agent/Environment/MCP Taxonomy

## Environment-Bound Agent Matrix

| ------------------------ | ------------ | ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| **Development Workflow** | DEV | supabase, `github/github-mcp-server`, `microsoft/playwright-mcp`, `context7`, `memory`, `sequentialthinking`, `utility` | Feature development, E2E testing, PR workflows, local iteration | React DevTools, Playwright suite, GitHub PR/CI tasks, Supabase dev queries, Context7 code search |
| **Observability** | STAGING | supabase, `memory`, `sequentialthinking`, `utility` | Log analysis, performance monitoring, anomaly detection, staging validation | Supabase logs/metrics, pre-prod smoke tests |
| **Production Ops** | PROD | supabase, `github/github-mcp-server`, `memory`, `sequentialthinking`, `utility` | Deployment orchestration, incident response, rollback procedures, health monitoring | Vercel deploys, Supabase function deploys, GitHub releases |
| **System Architect** | DEV (Design) | supabase, `github/github-mcp-server`, `microsoft/playwright-mcp`, `context7`, `memory`, `sequentialthinking`, `utility` | Schema evolution, integration design, architecture decisions, technical debt planning | Supabase migrations, GitHub architecture PRs, Playwright contract tests, Mermaid diagrams, Context7 code graph |
| Agent | Primary Env | MCP Servers | Core Responsibilities | Toolset Focus |
| ------------------------ | ------------ | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| **Development Workflow** | DEV | supabase, `github/github-mcp-server`, `microsoft/playwright-mcp`, `context7`, `utility` | Feature development, E2E testing, PR workflows, local iteration | React DevTools, Playwright suite, GitHub PR/CI tasks, Supabase dev queries, Context7 code search |
| **Observability** | STAGING | supabase, `utility` | Log analysis, performance monitoring, anomaly detection, staging validation | Supabase logs/metrics, pre-prod smoke tests |
| **Production Ops** | PROD | supabase, `github/github-mcp-server`, `utility` | Deployment orchestration, incident response, rollback procedures, health monitoring | Vercel deploys, Supabase function deploys, GitHub releases |
| **System Architect** | DEV (Design) | supabase, `github/github-mcp-server`, `microsoft/playwright-mcp`, `context7`, `utility` | Schema evolution, integration design, architecture decisions, technical debt planning | Supabase migrations, GitHub architecture PRs, Playwright contract tests, Mermaid diagrams, Context7 code graph |

## Segregation of Duties

**Development Workflow** (DEV-only)

- Owns feature branches, local testing, PR creation
- Cannot deploy to staging/prod
- Uses Playwright for E2E validation before PR
- Shares context via `memory` MCP with other agents

**Observability** (STAGING-focused)

- Monitors staging deployments post-merge
- Analyzes logs/traces via Context7 + Supabase
- Escalates issues to Production Ops or Development Workflow
- Cannot make code changes; read-only on GitHub

**Production Ops** (PROD-only)

- Executes verified deployments (frontend via Vercel, functions via Supabase CLI)
- Owns incident response and rollbacks
- Uses Context7 for production trace analysis
- Creates hotfix PRs via GitHub MCP, hands implementation to Development Workflow

**System Architect** (Cross-env design authority)

- Reviews/approves schema migrations across all environments
- Designs integration contracts tested via Playwright
- Cannot directly deploy; hands implementation to appropriate agent
- Maintains architecture diagrams and technical decisions in docs

## Context Management Integration

All agents inherit from `agents-manifest.json`:

```json
{
  "sharedMcpServers": ["utility"],
  "contextStore": "dev-tools/agents/context/store/agents/",
  "sessionStore": "dev-tools/workspace/context/session_store/",
  "environments": {
    "development": "integration/environments/development.json",
    "staging": "integration/environments/staging.json",
    "production": "integration/environments/production.json"
  }
}
```

**Utility MCP**: Sole provider for all infrastructure, memory, and sequential thinking tools. Handles fetch (HTTP/HTML), filesystem (read/write), git status, timezone conversion, knowledge graph, and stepwise reasoning for all agents. Operates within `ALLOWED_PATH` sandbox for security. All memory and sequential thought operations are now routed through Utility MCP endpoints; legacy MCPs have been fully removed from the codebase and manifests.

## Secret Management Workflow

- **Provider of Record**: Store production secrets in their authoritative providers (Vercel, Supabase, GitHub Actions, etc.).
- **Template**: `dev-tools/agents/.env.agent.example` lists all required keys; update it with new key names only.
- **Local Hydration**: Before validation, export provider secrets into the git-ignored `dev-tools/agents/.env.agent.local` file using provider CLIs (e.g., `vercel env pull`, `supabase secrets list`) or a future helper script (`npm run secrets:pull`).
- **Usage**: Run agent workflows and validation commands with `dotenv -e dev-tools/agents/.env.agent.local -- <command>`.
- **Compliance**: Never commit real secret values—only the template and manifest should live in source control.

## Implementation Plan

### Phase 1: Registry Cleanup

- Remove from `active-registry.json`: `production`, `development`, `troubleshooting`, `postgresql`, `integration-hub`, `stripe`, `postman`, `apify`
- Delete unused tool modules:
  - `mcp-tools/production-server-tools.js`
  - `mcp-tools/development-server-tools.js`
  - `mcp-tools/supabase-troubleshooting-server-tools.js`
  - `mcp-tools/postgresql-server-tools.js`
  - `mcp-tools/integration-hub-server-tools.js`
- Update `MCP-package.json` scripts to reference only the six canonical MCPs
- Refresh `tool-reference.md` to match

### Phase 2: Manifest & Context Wiring

Expand `agents-manifest.json`:

```json
{
  "agents": {
    "development-workflow": {
      "defaultEnv": "development",
      "mcpServers": [
        "supabase",
        "github/github-mcp-server",
        "microsoft/playwright-mcp"
      ],
      "requiredSecrets": [
        "AGENT_DEV_SUPABASE_URL",
        "AGENT_DEV_SUPABASE_ANON_KEY",
        "GITHUB_TOKEN"
      ]
    },
    "observability": {
      "defaultEnv": "staging",
      "mcpServers": ["supabase"],
      "requiredSecrets": ["AGENT_STAGING_SUPABASE_URL"]
    },
    "production-ops": {
      "defaultEnv": "production",
      "mcpServers": ["supabase", "github/github-mcp-server"],
      "requiredSecrets": [
        "AGENT_PROD_SUPABASE_URL",
        "VERCEL_TOKEN",
        "GITHUB_TOKEN"
      ]
    },
    "system-architect": {
      "defaultEnv": "development",
      "mcpServers": [
        "supabase",
        "github/github-mcp-server",
        "microsoft/playwright-mcp"
      ],
      "requiredSecrets": ["AGENT_DEV_SUPABASE_URL", "GITHUB_TOKEN"]
    }
  }
}
```

Update `.env.agent.example` to enumerate all required secrets per agent.

### Phase 3: Workflow & Toolset Updates

For each agent in `dev-tools/agents/workflows/{agent}/`:

**`config.json`** - Add environment binding:

```json
{
  "name": "development-workflow",
  "version": "2.1.0",
  "environment": "development",
  "mcp_servers": [
    "supabase",
    "github/github-mcp-server",
    "microsoft/playwright-mcp"
  ]
}
```

**`toolset.jsonc`** - Replace legacy tools:

```jsonc
{
  "development-workflow-tools": {
    "supabase": ["execute_query", "run_migration", "deploy_function"],
    "github": ["create_pull_request", "list_workflow_runs", "create_issue"],
    "playwright": ["run_suite", "screenshot_capture", "trace_analysis"],
    "react-devtools": ["inspect_component", "profile_render"]
  }
}
```

**`instructions.md`** - Update MCP references:

- Remove Chrome DevTools, Thunder Client, Postman references
- Add Playwright MCP and React DevTools workflows
- Cite environment constraints (e.g., "Development Workflow operates exclusively in DEV; escalate staging issues to Observability")

### Phase 4: Documentation Sync

- **`MCP_MODE_TOOL_MATRIX.md`**: Rebuild with 4 agents × 6 MCPs matrix
- **README.md**: Update "Agent Orchestration" section with new taxonomy
- **`mcp-integration-plan.md`**: Add Phase 5 marking environment-bound validation complete
- **`e2e-playwright-reactdevtools-workplan.md`**: Link to Development Workflow as primary E2E owner

### Phase 5: Validation (Complete)

All legacy `memory` and `sequentialthinking` MCPs have been removed from manifests, workflow configs, and toolsets. Utility MCP is now the sole provider for memory and sequential tools. Validation steps performed:

- Built and tested Utility MCP tools (`npm run build:tools --prefix dev-tools/agents/mcp-servers`)
- Installed dependencies and rebuilt Utility MCP (`cd dev-tools/agents/mcp-servers/utility && npm install && npm run build`)
- Validated agent MCP access and canonical secrets for all agents
- Ran Utility MCP self-test (`node utility/dist/index.js --test`)
- Confirmed all workflow configs and manifests reference only Utility MCP for memory/sequential tools
- Updated documentation and tool references to reflect the new structure
- Logged results in `phase-5-validation-log.md` and `coverage.md`

**Result:** Environment-bound agent validation is complete. Utility MCP is the unified provider for all infrastructure, memory, and sequential thinking tools. The codebase, manifests, and documentation are now fully MECE-compliant and up to date.

## Key Benefits of This Structure

1. **MECE Compliance**: Each agent owns exactly one environment for execution; no overlapping deployment authority
2. **Clear Escalation Paths**: Observability → Production Ops → Development Workflow based on issue scope
3. **Audit Trail**: Memory MCP stores cross-agent context; Sequential Thinking MCP preserves reasoning chains per agent
4. **Secrets Isolation**: Per-environment credentials prevent accidental cross-env operations
5. **Tooling Efficiency**: Supabase MCP consolidates all DB/Edge Function access; eliminates redundant server implementations
6. **Context7 Optimization**: Context7 is leveraged only by Development Workflow and System Architect agents for code search, dependency graphing, and symbol analysis—maximizing value for code planning and authoring while keeping runtime/ops agents focused on observability and deployment.
7. **Utility MCP Standardization**: Shared fetch/fs/git/time infrastructure eliminates tool duplication across agents; sandboxed filesystem access prevents unauthorized file operations
