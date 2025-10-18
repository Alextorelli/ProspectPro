# ProspectPro Chat Modes

**5 Specialized AI Agent Modes for Premium Request Optimization**

## Directory Purpose

This directory contains custom GitHub Copilot chat modes optimized for ProspectPro's Supabase-first serverless architecture. Each mode is designed to eliminate 80-90% of premium requests through intelligent batching, repository awareness, and automated workflows.

### Available Modes

1. **smart-debug.md** - Comprehensive debugging with ProspectPro-specific diagnostic patterns

   - Use for: Authentication issues, migration conflicts, Edge Function errors, API failures
   - Key features: One-shot solutions, existing script integration, automatic prevention measures

2. **feature-delivery.md** - End-to-end feature implementation with testing and deployment

   - Use for: New feature development, API integrations, database schema changes
   - Key features: Stepwise execution, Thunder Client test generation, production deployment

3. **production-support.md** - Production monitoring and rapid issue resolution

   - Use for: Service outages, performance degradation, integration failures
   - Key features: Incident classification, rollback procedures, post-mortem templates

4. **api-research.md** - API evaluation and integration planning

   - Use for: New API provider evaluation, cost-benefit analysis, integration design
   - Key features: Zero fake data compliance, cost optimization, production-ready code

5. **cost-optimization.md** - Performance analysis and cost reduction strategies
   - Use for: API cost analysis, cache optimization, query performance, infrastructure efficiency
   - Key features: ROI projections, implementation roadmaps, monitoring dashboards

## Activation Workflow

### GitHub Copilot Chat Integration

1. **Open Copilot Chat**: `Ctrl+Alt+I` or click Copilot icon in sidebar
2. **Reference Mode**: Type `@workspace` then reference the mode file:
   ```
   @workspace Use /workspaces/ProspectPro/.github/chat-modes/smart-debug.md to diagnose authentication failures
   ```
3. **Attach Context**: Use `#file` to attach relevant files or error logs
4. **Execute**: Copilot will follow the mode's protocol for comprehensive solutions

### Mode Selection Guide

**Use smart-debug when:**

- You see error messages or failures
- Services aren't responding correctly
- Authentication/session issues occur
- Deployment fails unexpectedly

**Use feature-delivery when:**

- Implementing new capabilities
- Adding API integrations
- Modifying database schema
- Building new Edge Functions

**Use production-support when:**

- Production service is degraded
- Performance issues detected
- Integration failures occur
- Incident response needed

**Use api-research when:**

- Evaluating new data providers
- Comparing API alternatives
- Planning integration architecture
- Analyzing cost tradeoffs

**Use cost-optimization when:**

- API costs exceed budget
- Cache hit rates are low
- Database queries are slow
- System efficiency needs improvement

## Required Tooling

### MCP Servers (Model Context Protocol)

ProspectPro includes 3 specialized MCP servers for automated diagnostics:

```bash
# Start all MCP servers
npm run mcp:start

# Start specific servers
npm run mcp:prod              # Production monitoring
npm run mcp:dev               # Development tools
npm run mcp:troubleshooting   # Diagnostic tools
```

**MCP Troubleshooting Tools** (used by smart-debug mode):

- `test_edge_function` - Test Edge Function connectivity
- `validate_database_permissions` - Check RLS policies
- `diagnose_anon_key_mismatch` - Compare frontend/backend auth
- `run_rls_diagnostics` - Generate RLS diagnostic queries

### Thunder Client Test Collections

API testing is automated via Thunder Client collections in `/thunder-collection/`:

```bash
# Sync environment variables from Vercel/Supabase
npm run thunder:env:sync

# Run test suites (via Thunder Client extension)
# - ProspectPro-Auth.json: Authentication tests
# - ProspectPro-Discovery.json: Business discovery tests
# - ProspectPro-Enrichment.json: Enrichment orchestrator tests
# - ProspectPro-Export.json: Campaign export tests
# - ProspectPro-Database.json: Database health checks
```

**Thunder Client Integration in VS Code:**

1. Install extension: `rangav.vscode-thunder-client`
2. Open Thunder Client sidebar
3. Navigate to Collections → ProspectPro-\*
4. Run individual requests or entire collections

### Supabase CLI Integration

All modes leverage Supabase CLI for Edge Functions and database operations:

```bash
# Ensure Supabase session (run before any CLI commands)
source scripts/operations/ensure-supabase-cli-session.sh

# Deploy Edge Functions
cd supabase && npx --yes supabase@latest functions deploy <function-name> --no-verify-jwt

# View logs
cd supabase && npx --yes supabase@latest functions logs <function-name> --follow

# Database operations
cd supabase && npx --yes supabase@latest db pull --schema public
cd supabase && npx --yes supabase@latest db push
```

## Response Optimization Patterns

### Batching Multi-Step Operations

Each mode is designed to provide **complete solutions in one response**:

❌ **Before (10-15 requests):**

1. "What's the error?"
2. "Check the logs"
3. "Try this fix"
4. "Still broken, try this"
5. "Now deploy"
6. "Check if it worked"
   ... etc

✅ **After (1-2 requests):**

1. "Smart debug: Auth issue" → Complete diagnosis, fix, verification, prevention
2. "Confirm deployed" → Done

### Repository-Aware Context

All modes understand ProspectPro's infrastructure:

- Supabase-first Edge Functions architecture
- User-aware RLS policies and session management
- Existing auth scripts (`scripts/operations/ensure-supabase-cli-session.sh`)
- Thunder Client test collections
- MCP diagnostic tools
- Zero fake data policy compliance

### Stepwise Execution (Feature Delivery)

For complex features, mode guides user through phases:

1. **Analysis** → Present plan, wait for "next"
2. **Implementation** → Write code, wait for "next"
3. **Testing** → Generate tests, wait for "next"
4. **Deployment** → Ship to production, wait for "next"
5. **Documentation** → Update docs, complete

## Maintenance

### Updating Chat Modes

After modifying any mode configuration:

```bash
# Regenerate documentation indices
npm run docs:update

# Verify changes don't break existing workflows
npm run supabase:test:db        # Database tests
npm run supabase:test:functions # Edge Function tests

# Commit with descriptive message
git add .github/chat-modes/
git commit -m "docs: update chat mode [mode-name] - [description]"
git push
```

### Documentation Links

- **System Reference**: `docs/technical/SYSTEM_REFERENCE.md`
- **Codebase Index**: `docs/technical/CODEBASE_INDEX.md`
- **Edge Function Docs**: `docs/technical/EDGE_FUNCTIONS.md`
- **Thunder Client Tests**: `thunder-collection/README.md`
- **MCP Server Docs**: `mcp-servers/README.md`

### Quality Checks

Before committing chat mode changes:

- [ ] Mode follows ProspectPro's Supabase-first architecture
- [ ] References existing scripts and tools (no reinventing wheel)
- [ ] Includes specific file paths and command examples
- [ ] Maintains zero fake data policy compliance
- [ ] Provides complete solutions (minimal back-and-forth)
- [ ] Links to relevant documentation and test collections

## Quick Reference

### Common Commands

```bash
# Start working session
source scripts/operations/ensure-supabase-cli-session.sh
npm run mcp:start

# Test changes
npm run supabase:test:db
npm run supabase:test:functions

# Deploy to production
cd supabase && npx --yes supabase@latest functions deploy <function-name> --no-verify-jwt
npm run build && cd dist && vercel --prod

# Update documentation
npm run docs:update
```

### Emergency Procedures

For production issues, use **production-support.md** mode:

1. Assess impact (Critical/High/Medium)
2. Follow triage commands in mode
3. Execute immediate mitigation
4. Document in post-mortem template
5. Implement prevention measures

---

**Note**: These chat modes are optimized for Alex's workflow (no coding experience, heavily reliant on AI assistance, GitHub Codespaces environment). They prioritize immediate problem resolution over educational explanations.
