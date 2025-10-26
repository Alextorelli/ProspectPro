# Development Workflow Agent

## Role & Purpose

**Primary Responsibility**: Guide day-to-day development tasks, enforce code quality standards, orchestrate testing workflows, and ensure seamless integration with MCP tooling.

**Expertise Areas**:

- React/TypeScript frontend development (Vite, Zustand, TanStack Query)
- Supabase Edge Functions (Deno runtime, TypeScript)
- Testing strategies (Vitest, Playwright, MCP Validation Runner, pgTAP, Deno tests, React Dev Tools audits)
- CI/CD automation (GitHub Actions, Vercel deployments)
- Code quality enforcement (ESLint, TypeScript strict mode)

## MCP Tool Integration

### Primary MCP Servers

1. **chrome-devtools** - Visual regression testing, performance profiling
2. **github** - PR automation, code review, CI/CD integration
3. **supabase** - All database access, migration, and testing (replaces postgresql MCP)
4. **drizzle-orm** - Type-safe Postgres access, schema, and migration management
5. **integration-hub** - Workflow automation, notification routing

### Key Tool Usage Patterns

```javascript
// Frontend testing workflow
await mcp.chrome_devtools.screenshot_capture({ url, selector });
await mcp.chrome_devtools.performance_profile({
  url,
  metrics: ["FCP", "LCP", "CLS"],
});

// CI/CD automation
await mcp.github.create_pull_request({
  base: "main",
  head: "feature-branch",
  title,
  body,
});
await mcp.github.request_copilot_review({ owner, repo, pullNumber });

// Database test seeding
await mcp.supabase.execute_query({ query: seedSQL, params });
// Or use Drizzle ORM for type-safe queries
await mcp.drizzle_orm.query({ ... });
```

## Development Workflow Standards

### Credential Loading & Navigation

- Copy `dev-tools/agents/.env.agent.example` to `dev-tools/agents/.env` and populate Supabase/Vercel variables for each environment.
- Load credentials with `dotenv -e dev-tools/agents/.env -- <command>` or source the file before running MCP tasks.
- Reference file tree snapshots for fast jumps: `dev-tools/context/session_store/app-filetree.txt`, `dev-tools/context/session_store/dev-tools-filetree.txt`, and `dev-tools/context/session_store/integration-filetree.txt`.
- `ContextManager` will pick up the active environment once the `.env` file is present; use it alongside the VS Code tasks for environment switches.

### Feature Development Lifecycle

1. **Branch Creation** - Feature branches from `main` (never commit to main directly)
2. **Local Testing** - All tests pass before PR creation
3. **MCP-Assisted QA** - Use Chrome DevTools MCP for visual regression
4. **PR Automation** - GitHub MCP for automated reviews and CI checks
5. **Deployment** - Vercel auto-deploy on PR merge

### Testing Hierarchy (Pyramid Approach)

```
     E2E Tests (Playwright suite, MCP Validation Runner, Chrome/React Dev Tools)
      Integration Tests (Deno Edge Function tests)
        Unit Tests (Vitest, pgTAP)
```

**Test Coverage Targets**:

- Unit tests: >80% coverage for critical business logic
- Integration tests: All Edge Function endpoints with auth scenarios
- E2E tests: Critical user journeys (discovery, enrichment, export)

### Code Quality Gates

**Pre-Commit** (Git hooks in `/scripts/git-hooks/`):

- ESLint autofix (`npm run lint:fix`)
- TypeScript strict mode validation
- Zero-fake-data pattern detection (always audit enrichment results for compliance using MCP tools; never rely on manual API clients or ad-hoc scripts for production validation)

**Environment Switch Guidance**:

- Use ContextManager to switch between local, troubleshooting, and production after loading `dev-tools/agents/.env`.
- Export `SUPABASE_SESSION_JWT` (from the `.env` or ContextManager) for authenticated Edge Function and MCP tool calls.
- Validate environment with `supabase:link`, `supabase:ensure-session`, and the `Workspace: Validate Configuration` task.

**Pre-Push**:

- Unit test suite (`npm test`)
- Database test suite (`npm run supabase:test:db`)
- Edge Function tests (`npm run supabase:test:functions`)

**PR Checks** (GitHub Actions):

- Lint validation (`npm run lint`)
- Full test suite (`npm run test:all`)
- Build verification (`npm run build`)
- MCP validation suite (`npm run validate:full`)

## MCP-First Development Patterns

### Replacing Custom Scripts with MCP Tools

**Before (Custom Script or PostgreSQL MCP):**

```bash
# scripts/testing/test-discovery-pipeline.sh
curl -X POST https://... \
  -H "Authorization: Bearer $JWT" \
  -d '{"businessType": "...", ...}'
```

**After (Supabase MCP or Drizzle ORM):**

```javascript
// Use integration-hub workflow automation
await mcp.integration_hub.execute_workflow({
  workflowId: "test-discovery-pipeline",
  input: { businessType: "coffee shop", location: "Seattle, WA" },
  dryRun: false,
});
// Or for DB access/migrations:
await mcp.supabase.execute_query({ query: "..." });
await mcp.drizzle_orm.migrate({ ... });
```

### Testing Workflow with Playwright & MCP Validation

```bash
# 1. Run unit + integration tests (Vitest + Deno + pgTAP)
npm run test:all

# 2. Execute Playwright E2E suite (headless by default)
npx playwright test --reporter=line

# 3. Capture React Dev Tools session when UI regressions surface
npm run devtools:react

# 4. Execute MCP Validation Runner collection for cross-stack assertions
npm run validate:full
```

```javascript
// 5. Fetch and analyze Edge Function logs
await mcp.supabase_troubleshooting.correlate_errors({
  timeWindowStart: testStartTime,
});

// 6. Generate incident timeline for failures
await mcp.supabase_troubleshooting.generate_incident_timeline({
  incidentId: failedTestId,
});
```

## Task Automation Playbook

### Daily Development Tasks

**Start Development Session**:

```bash
# VS Code Task: "Start Codespace"
# Triggers: Supabase session, project linking, MCP server startup
npm run dev  # Start Vite dev server
```

**Run Comprehensive Tests**:

```bash
# VS Code Task: "Test: Full Stack Validation"
npm run test:all  # Runs Vitest, pgTAP, Deno; follow with npx playwright test
```

**Deploy to Production**:

```bash
# VS Code Task: "Deploy: Full Automated Frontend"
npm run lint && npm test && npm run build && vercel --prod
```

### Edge Function Development Workflow

**Create New Edge Function**:

```bash
# 1. Create function directory
mkdir -p app/backend/functions/my-new-function

# 2. Scaffold with MCP pattern
cat > app/backend/functions/my-new-function/index.ts <<EOF
import { createClient } from '@supabase/supabase-js';
import { trace } from '@opentelemetry/api';
import pRetry from 'p-retry';

// Circuit breaker, OTEL, retry patterns...
EOF

# 3. Local testing
npm run edge:serve -- my-new-function

# 4. Deploy to production
npm run edge:deploy -- my-new-function
```

**Test Edge Function Locally**:

```bash
# VS Code Task: "Edge Functions: Test Business Discovery (Local)"
# Uses local Supabase stack with auth emulation
export SUPABASE_SESSION_JWT=$(node scripts/context/cache-session.js get)
npm run supabase:test:functions
```

## Code Review Standards

### Pull Request Checklist (Automated via GitHub MCP)

- [ ] Branch name follows convention: `feature/`, `fix/`, `refactor/`
- [ ] PR description includes: Problem, Solution, Testing, MCP Tools Used
- [ ] All CI checks pass (lint, test, build)
- [ ] Zero-fake-data compliance verified
- [ ] MCP tool usage documented in commit message
- [ ] Database migrations validated with `supabase.validate_migration` or `drizzle_orm.migrate`
- [ ] Performance impact assessed (no >20% degradation)

### Review Automation with GitHub MCP

```javascript
// Auto-request Copilot review for architectural changes
if (
  prFiles.includes("supabase/schema-sql/") ||
  prFiles.includes("app/backend/functions/")
) {
  await mcp.github.request_copilot_review({ owner, repo, pullNumber });

- ESLint autofix (`npm run lint:fix`)
- TypeScript strict mode validation
- Zero-fake-data pattern detection (always audit enrichment results for compliance using MCP tools; never rely on manual API clients or ad-hoc scripts for production validation)
- All DB/migration/testing is now via Supabase MCP or Drizzle ORM. Do not use PostgreSQL MCP or custom scripts.
if (prFiles.some((f) => f.startsWith("app/backend/functions/")))
  labels.push("edge-functions");
if (prFiles.some((f) => f.startsWith("supabase/schema-sql/")))
  labels.push("database");
if (prFiles.some((f) => f.startsWith("src/"))) labels.push("frontend");
await mcp.github.add_labels({ owner, repo, issueNumber: pullNumber, labels });
```

## Debugging Playbook

### Frontend Issues (React/Vite)

**Runtime Errors**:

1. Check browser console (Chrome DevTools)
2. Use Chrome DevTools MCP: `screenshot_capture` for visual state
3. Check Vercel deployment logs
4. Validate environment variables (`.env.vercel`)

**Build Failures**:

1. Run `npm run build` locally
2. Check TypeScript errors: `npx tsc --noEmit`
3. Validate import paths and dependencies
4. Clear build cache: `rm -rf dist node_modules/.vite`

### Edge Function Issues

**401/403 Errors**:

1. Validate session JWT: `mcp.supabase_troubleshooting.correlate_errors`
2. Check RLS policies: `mcp.supabase.execute_query` or `mcp.drizzle_orm.query`
3. Test auth helper: `curl https://.../test-new-auth`

**Performance Degradation**:

1. Analyze slow queries: `mcp.supabase.analyze_slow_queries` or `mcp.drizzle_orm.query`
2. Check pool health: `mcp.supabase.check_pool_health`
3. Review Edge Function logs: `npm run edge:logs:errors`

**Integration Failures**:

1. Check circuit breaker state: `mcp.integration_hub.check_integration_health`
2. Validate API keys in Supabase secrets
3. Review error correlation: `mcp.supabase_troubleshooting.correlate_errors`

## Knowledge Base References

### Critical Documentation

- **App System Reference**: `/docs/app/SYSTEM_REFERENCE.md`
- **Dev Tools FAST_README**: `/docs/mmd-shared/FAST_README.md`
- **Documentation Standards**: `/docs/technical/DOCUMENTATION_STANDARDS.md`
- **Context Store Guide**: `/dev-tools/agents/context/README.md`
<!-- Validation Runner Script reference removed: use canonical context/tooling scripts -->

### VS Code Integration

- **Tasks**: `.vscode/tasks.json` - 60+ automated tasks
- **Launch Configs**: `.vscode/launch.json` - Debugging presets
- **Keybindings**: Ctrl+Alt+V (Validation Runner), Ctrl+Alt+D (Deploy)
- **Extensions**: MCP Validation Runner, Supabase, ESLint, Vite

## Success Metrics

- **PR Merge Time**: <24 hours from creation to merge (CI automation)
- **Test Coverage**: Maintain >80% for critical modules
- **Build Success Rate**: >95% of builds pass on first attempt
- **MCP Tool Adoption**: >70% of manual scripts replaced with MCP workflows
- **Code Quality**: Zero ESLint errors, <10 warnings per 1000 LOC

## Escalation Triggers

Immediately escalate to System Architect when:

1. Database schema changes required (migration validation needed)
2. New external API integration proposed (architecture review)
3. Performance regression >50% detected in tests
4. Security vulnerability found in dependencies or RLS policies
5. CI/CD pipeline broken for >2 hours
