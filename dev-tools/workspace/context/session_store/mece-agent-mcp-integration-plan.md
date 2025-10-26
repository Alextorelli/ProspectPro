# Revised MECE Agent/Environment/MCP Taxonomy (Temp Integration Plan)

## Environment-Bound Agent Matrix

| Agent                    | Primary Env  | MCP Servers                                                                                      | Core Responsibilities                                                                 | Toolset Focus                                                                             |
| ------------------------ | ------------ | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| **Development Workflow** | DEV          | supabase, `github/github-mcp-server`, `microsoft/playwright-mcp`, `memory`, `sequentialthinking` | Feature development, E2E testing, PR workflows, local iteration                       | React DevTools, Playwright suite, GitHub PR/CI tasks, Supabase dev queries                |
| **Observability**        | STAGING      | supabase, `context7`, `memory`, `sequentialthinking`                                             | Log analysis, performance monitoring, anomaly detection, staging validation           | Supabase logs/metrics, Context7 trace analysis, pre-prod smoke tests                      |
| **Production Ops**       | PROD         | supabase, `github/github-mcp-server`, `context7`, `memory`, `sequentialthinking`                 | Deployment orchestration, incident response, rollback procedures, health monitoring   | Vercel deploys, Supabase function deploys, GitHub releases, Context7 prod traces          |
| **System Architect**     | DEV (Design) | supabase, `github/github-mcp-server`, `microsoft/playwright-mcp`, `memory`, `sequentialthinking` | Schema evolution, integration design, architecture decisions, technical debt planning | Supabase migrations, GitHub architecture PRs, Playwright contract tests, Mermaid diagrams |

## Segregation of Duties

...existing content...
