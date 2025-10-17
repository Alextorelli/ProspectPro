# ProspectPro VS Code Tasks Reference

_Auto-generated from `.vscode/tasks.json` — Last updated: 2025-10-17_

**Quick Access**: Press `Ctrl+Shift+P` → "Tasks: Run Task" → Select from list below

---

## 🗂️ Task Categories

- [Supabase & Database](#supabase--database)
- [Edge Functions](#edge-functions)
- [Testing & Diagnostics](#testing--diagnostics)
- [Build & Deployment](#build--deployment)
- [Documentation](#documentation)
- [Roadmap Management](#roadmap-management)
- [Miscellaneous](#miscellaneous)

---

## Supabase & Database

| Task Label | Command | Script/Config | Inputs | Description |
|------------|---------|---------------|--------|-------------|
| **Supabase: Ensure Session** | `bash cd supabase && source ../scripts/ensure-supabase-cli-session.sh` | [`../scripts/ensure-supabase-cli-session.sh`](../../scripts/ensure-supabase-cli-session.sh) | None | Authenticates Supabase CLI session (prerequisite for most tasks) |
| **Supabase: Link Project** | `npm run supabase:link` | [`package.json`](../package.json), Multiple | None | Runs: Ensure Session |
| **Supabase: List Migrations** | `npm run supabase:migrations:list` | [`package.json`](../package.json), Multiple | None | Runs: Ensure Session |
| **Supabase: Push Database** | `npm run supabase:db:push` | [`package.json`](../package.json), Multiple | None | Runs: Ensure Session |
| **Supabase: Generate Types** | `npm run supabase:types` | [`package.json`](../package.json), Multiple | None | Runs: Ensure Session |
| **Supabase: Pull Public Schema** | `npm run supabase:db:pull` | [`package.json`](../package.json), Multiple | None | Runs: Ensure Session |
| **Supabase: Full Workflow** | `Sequential composite` | Multiple | None | Runs: Ensure Session → Link Project → List Migrations |
| **Database: Create Migration** | `bash cd supabase && source ../scripts/ensure-supabase-cli-session.sh && npx --yes supabase@latest migration new ${input:migrationName}` | [`../scripts/ensure-supabase-cli-session.sh`](../../scripts/ensure-supabase-cli-session.sh) | `migrationName` | Creates a new migration file with descriptive name |
| **Supabase: Serve Local Functions** | `npm run edge:serve` | [`package.json`](../package.json), Multiple | None | Runs: Ensure Session |

---

## Edge Functions

| Task Label | Command | Script/Config | Inputs | Description |
|------------|---------|---------------|--------|-------------|
| **Edge Functions: Deploy Function** | `bash cd supabase && source ../scripts/ensure-supabase-cli-session.sh && npx --yes supabase@latest functions deploy ${input:functionName} --no-verify-jwt` | [`../scripts/ensure-supabase-cli-session.sh`](../../scripts/ensure-supabase-cli-session.sh), Multiple | `functionName` | Runs: Ensure Session |
| **Edge Functions: Deploy Critical Set** | `npm run deploy:critical` | [`package.json`](../package.json), Multiple | None | Runs: Ensure Session |
| **Edge Functions: Deploy Discovery Group** | `npm run deploy:discovery` | [`package.json`](../package.json), Multiple | None | Runs: Ensure Session |
| **Edge Functions: Deploy Enrichment Group** | `npm run deploy:enrichment` | [`package.json`](../package.json), Multiple | None | Runs: Ensure Session |
| **Edge Functions: Deploy Export Functions** | `npm run deploy:exports` | [`package.json`](../package.json), Multiple | None | Runs: Ensure Session |
| **Edge Functions: Deploy Diagnostics** | `bash cd supabase && source ../scripts/ensure-supabase-cli-session.sh && npx --yes supabase@latest functions deploy test-google-places --no-verify-jwt && npx --yes supabase@latest functions deploy test-new-auth --no-verify-jwt && npx --yes supabase@latest functions deploy auth-diagnostics --no-verify-jwt` | [`../scripts/ensure-supabase-cli-session.sh`](../../scripts/ensure-supabase-cli-session.sh), Multiple | None | Runs: Ensure Session |
| **Edge Functions: Deploy All Functions** | `Sequential composite` | Multiple | None | Runs: Deploy Discovery Group → Deploy Enrichment Group → Deploy Export Functions → Deploy Diagnostics |
| **Edge Functions: List Functions** | `npm run edge:list` | [`package.json`](../package.json), Multiple | None | Runs: Ensure Session |
| **Edge Functions: Live Logs (All)** | `npm run edge:logs` | [`package.json`](../package.json), Multiple | None | Runs: Ensure Session |
| **Edge Functions: Error Logs Only** | `npm run edge:logs:errors` | [`package.json`](../package.json), Multiple | None | Runs: Ensure Session |
| **Logs: Edge Function** | `bash cd supabase && source ../scripts/ensure-supabase-cli-session.sh && npx --yes supabase@latest functions logs ${input:functionName} --follow` | [`../scripts/ensure-supabase-cli-session.sh`](../../scripts/ensure-supabase-cli-session.sh), Multiple | `functionName` | Runs: Ensure Session |
| **Edge Functions: Test Business Discovery (Local)** | `npm run edge:test:local` | [`package.json`](../package.json) | None | Tests local Edge Function against `localhost:54321` |
| **Edge Functions: Full Development Workflow** | `Sequential composite` | Multiple | None | Runs: Ensure Session → Link Project → List Functions → Serve Local Functions |
| **Edge Functions: Production Deploy Workflow** | `Sequential composite` | Multiple | None | Runs: Ensure Session → Deploy Critical Set → Live Logs (All) |

---

## Testing & Diagnostics

| Task Label | Command | Script/Config | Inputs | Description |
|------------|---------|---------------|--------|-------------|
| **Test: Run Database Tests** | `npm run supabase:test:db` | [`package.json`](../package.json), Multiple | None | Runs: Ensure Session |
| **Test: Run Edge Function Tests** | `npm run supabase:test:functions` | [`package.json`](../package.json), Multiple | None | Runs: Ensure Session |
| **Test: Discovery Pipeline** | `bash cd ${workspaceFolder} && ./scripts/test-discovery-pipeline.sh` | [`./scripts/test-discovery-pipeline.sh`](.././scripts/test-discovery-pipeline.sh), Multiple | `sessionJWT` | Runs: Ensure Session |
| **Test: Enrichment Chain** | `bash cd ${workspaceFolder} && ./scripts/test-enrichment-chain.sh` | [`./scripts/test-enrichment-chain.sh`](.././scripts/test-enrichment-chain.sh), Multiple | `sessionJWT` | Runs: Ensure Session |
| **Test: Export Flow** | `bash cd ${workspaceFolder} && ./scripts/test-export-flow.sh` | [`./scripts/test-export-flow.sh`](.././scripts/test-export-flow.sh), Multiple | `sessionJWT` | Runs: Ensure Session |
| **Test: Full Stack Validation** | `Sequential composite` | Multiple | None | Runs: Discovery Pipeline → Enrichment Chain → Export Flow |
| **Test: Campaign Validation** | `bash ${workspaceFolder}/scripts/campaign-validation.sh ${input:sessionJWT}` | [`scripts/campaign-validation.sh`](../scripts/campaign-validation.sh) | `sessionJWT` | Validates campaign creation and lead generation |
| **Test: Auth Patterns** | `bash ${workspaceFolder}/scripts/test-auth-patterns.sh ${input:sessionJWT}` | [`scripts/test-auth-patterns.sh`](../scripts/test-auth-patterns.sh) | `sessionJWT` | Tests authentication helpers and RLS policies |
| **Diagnostics: Full Campaign** | `bash ${workspaceFolder}/scripts/edge-function-diagnostics.sh ${input:sessionJWT}` | [`scripts/edge-function-diagnostics.sh`](../scripts/edge-function-diagnostics.sh) | `sessionJWT` | Comprehensive Edge Function health check |

---

## Build & Deployment

| Task Label | Command | Script/Config | Inputs | Description |
|------------|---------|---------------|--------|-------------|
| **MCP: Start All Servers** | `npm run mcp:start` | [`package.json`](../package.json) | None | Starts all MCP servers (background task) |
| **Build: Frontend Production** | `npm run build` | [`package.json`](../package.json) | None | Builds React/Vite frontend to `/dist` |
| **Deploy: Vercel Production** | `bash cd dist && npx --yes vercel@latest --prod` | Multiple | None | Runs: Build: Frontend Production |

---

## Documentation

| Task Label | Command | Script/Config | Inputs | Description |
|------------|---------|---------------|--------|-------------|
| **Docs: Update All Documentation** | `npm run docs:update` | [`package.json`](../package.json) | None | Regenerates `CODEBASE_INDEX.md`, `SYSTEM_REFERENCE.md`, and **TASKS_REFERENCE.md** |
| **Docs: Update System Reference (Legacy)** | `npm run system:reference` | [`package.json`](../package.json) | None | Updates `SYSTEM_REFERENCE.md` only |
| **Docs: Update Codebase Index (Legacy)** | `npm run codebase:index` | [`package.json`](../package.json) | None | Updates `CODEBASE_INDEX.md` only |

---

## Roadmap Management

| Task Label | Command | Script/Config | Inputs | Description |
|------------|---------|---------------|--------|-------------|
| **🚀 Create Epic (Guided)** | `npm run roadmap:epic` | [`package.json`](../package.json) | Interactive prompts | Creates a new epic from template with guided prompts |
| **🗂️ Batch Generate Epics** | `npm run roadmap:batch` | [`package.json`](../package.json) | None | Generates epics from [`docs/roadmap/batch.json`](../docs/roadmap/batch.json) |
| **🗂️ Batch Generate Epics + Project** | `npm run roadmap:batch -- --project` | [`package.json`](../package.json) | None | Generates epics AND adds draft items to GitHub Project 5 |
| **🌐 Open Project 5** | `npm run roadmap:open` | [`package.json`](../package.json) | None | Opens GitHub Project 5 board in browser |
| **🔍 Project Dashboard** | `npm run roadmap:dashboard` | [`package.json`](../package.json) | None | Shows epic summary (priority, phase, points, labels) |
| **🛠️ Start Epic Scaffolding** | `npm run roadmap:start -- ${input:epicKey}` | [`package.json`](../package.json) | `epicKey` | Scaffolds lib/, components/, Edge Function stubs for epic |
| **📋 Roadmap: Pull Open Items** | `npm run roadmap:pull` | [`package.json`](../package.json) | None | Pulls open items from Project 5 → [`docs/roadmap/project-open-items.md`](../docs/roadmap/project-open-items.md) |

---

## Miscellaneous

| Task Label | Command | Script/Config | Inputs | Description |
|------------|---------|---------------|--------|-------------|
| **Context: Fetch Repo Snapshot** | `node` | CLI | None | Captures current git branch, status, and diff summary to `.cache/agent/context/repo-context.json` |
| **Context: Fetch Supabase Snapshot** | `node` | CLI | None | Summarizes Edge Function directories and verify_jwt settings to `.cache/agent/context/supabase-functions.json` |
| **Context: Cache Session JWT** | `node` | CLI | `sessionJWT` | Stores the provided session JWT locally at `.cache/agent/context/session.json` |
| **Workspace: Validate Configuration** | `bash ${workspaceFolder}/.vscode/validate-workspace-config.sh` | [`.vscode/validate-workspace-config.sh`](../.vscode/validate-workspace-config.sh) | None | Validates workspace config and environment setup |

---

## Input Prompts Reference

| Input ID | Type | Description | Options/Default |
|----------|------|-------------|-----------------|
| `functionName` | Dropdown | Supabase Edge Function | 16 functions (default: `business-discovery-background`) |
| `migrationName` | Text | Database migration name | Freeform text |
| `sessionJWT` | Text | Supabase session JWT (required for authenticated tests) | Freeform (obtain via `supabase.auth.getSession()`) |
| `epicKey` | Text | Epic key (kebab-case) | Freeform kebab-case |

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+P` → "Tasks: Run Task" | Opens task picker |
| `Ctrl+Shift+B` | Runs default build task |
| `Ctrl+Shift+T` | Runs default test task |

---

## Task Dependencies

### Composite Workflows

**Supabase: Full Workflow**
1. Supabase: Ensure Session
2. Supabase: Link Project
3. Supabase: List Migrations

**Edge Functions: Full Development Workflow**
1. Supabase: Ensure Session
2. Supabase: Link Project
3. Edge Functions: List Functions
4. Supabase: Serve Local Functions

**Edge Functions: Production Deploy Workflow**
1. Supabase: Ensure Session
2. Edge Functions: Deploy Critical Set
3. Edge Functions: Live Logs (All)

**Edge Functions: Deploy All Functions**
1. Edge Functions: Deploy Discovery Group
2. Edge Functions: Deploy Enrichment Group
3. Edge Functions: Deploy Export Functions
4. Edge Functions: Deploy Diagnostics

**Test: Full Stack Validation**
1. Test: Discovery Pipeline
2. Test: Enrichment Chain
3. Test: Export Flow

---

## Related Documentation

- [Supabase CLI Reference](https://supabase.com/docs/reference/cli)
- [Edge Functions Guide](../docs/SUPABASE_EDGE_FUNCTIONS.md)
- [Testing Guide](../docs/QUICK_TESTING_GUIDE.md)
- [Deployment Checklist](../docs/DEPLOYMENT_CHECKLIST.md)
- [Roadmap Implementation](../docs/roadmap/)
- [System Reference](../docs/technical/SYSTEM_REFERENCE.md)
- [Codebase Index](../docs/technical/CODEBASE_INDEX.md)

---

**Maintenance**: This file is regenerated by `npm run docs:update`. Manual edits will be overwritten.
