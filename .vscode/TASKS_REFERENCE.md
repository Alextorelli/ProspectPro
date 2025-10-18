# ProspectPro VS Code Tasks Reference

_Auto-generated from `.vscode/tasks.json` — Last updated: 2025-10-18_

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
| **Supabase: Ensure Session** | `bash source scripts/operations/ensure-supabase-cli-session.sh` | [`scripts/operations/ensure-supabase-cli-session.sh`](../scripts/operations/ensure-supabase-cli-session.sh) | None | Authenticates Supabase CLI session (prerequisite for most tasks) |
| **Supabase: Link Project** | `npm run supabase:link` | [`package.json`](../package.json), Multiple | None | Runs: Ensure Session |
| **Supabase: Pull Public Schema** | `npm run supabase:db:pull` | [`package.json`](../package.json), Multiple | None | Runs: Ensure Session |
| **Supabase: Generate Types** | `npm run supabase:types` | [`package.json`](../package.json), Multiple | None | Runs: Ensure Session |
| **Supabase: List Migrations** | `npm run supabase:migrations:list` | [`package.json`](../package.json), Multiple | None | Runs: Ensure Session |
| **Supabase: Push Database** | `npm run supabase:db:push` | [`package.json`](../package.json), Multiple | None | Runs: Ensure Session |
| **Supabase: Start Local Stack** | `npm run supabase:start:local` | [`package.json`](../package.json) | None | No description available |
| **Database: Create Migration** | `bash cd supabase && source ../scripts/operations/ensure-supabase-cli-session.sh && npx --yes supabase@latest migration new ${input:migrationName}` | [`../scripts/operations/ensure-supabase-cli-session.sh`](../../scripts/operations/ensure-supabase-cli-session.sh) | `migrationName` | Creates a new migration file with descriptive name |
| **Supabase: Serve Local Functions** | `npm run edge:serve` | [`package.json`](../package.json), Multiple | None | Runs: Ensure Session |

---

## Edge Functions

| Task Label | Command | Script/Config | Inputs | Description |
|------------|---------|---------------|--------|-------------|
| **Edge Functions: Deploy Function** | `bash cd supabase && source ../scripts/operations/ensure-supabase-cli-session.sh && npx --yes supabase@latest functions deploy ${input:functionName} --no-verify-jwt` | [`../scripts/operations/ensure-supabase-cli-session.sh`](../../scripts/operations/ensure-supabase-cli-session.sh), Multiple | `functionName` | Runs: Ensure Session |
| **Edge Functions: Deploy Critical Set** | `npm run deploy:critical` | [`package.json`](../package.json), Multiple | None | Runs: Ensure Session |
| **Edge Functions: Deploy Discovery Group** | `npm run deploy:discovery` | [`package.json`](../package.json), Multiple | None | Runs: Ensure Session |
| **Edge Functions: Deploy Enrichment Group** | `npm run deploy:enrichment` | [`package.json`](../package.json), Multiple | None | Runs: Ensure Session |
| **Edge Functions: Deploy Export Functions** | `npm run deploy:exports` | [`package.json`](../package.json), Multiple | None | Runs: Ensure Session |
| **Edge Functions: Deploy Diagnostics** | `bash cd supabase && source ../scripts/operations/ensure-supabase-cli-session.sh && npx --yes supabase@latest functions deploy test-google-places --no-verify-jwt && npx --yes supabase@latest functions deploy test-new-auth --no-verify-jwt && npx --yes supabase@latest functions deploy auth-diagnostics --no-verify-jwt` | [`../scripts/operations/ensure-supabase-cli-session.sh`](../../scripts/operations/ensure-supabase-cli-session.sh), Multiple | None | Runs: Ensure Session |
| **Edge Functions: Deploy All Functions** | `Sequential composite` | Multiple | None | Runs: Deploy Discovery Group → Deploy Enrichment Group → Deploy Export Functions → Deploy Diagnostics |
| **Edge Functions: List Functions** | `npm run edge:list` | [`package.json`](../package.json), Multiple | None | Runs: Ensure Session |
| **Edge Functions: Live Logs (All)** | `npm run edge:logs` | [`package.json`](../package.json), Multiple | None | Runs: Ensure Session |
| **Edge Functions: Error Logs Only** | `npm run edge:logs:errors` | [`package.json`](../package.json), Multiple | None | Runs: Ensure Session |
| **Logs: Edge Function** | `bash cd supabase && source ../scripts/operations/ensure-supabase-cli-session.sh && npx --yes supabase@latest functions logs ${input:functionName} --follow` | [`../scripts/operations/ensure-supabase-cli-session.sh`](../../scripts/operations/ensure-supabase-cli-session.sh), Multiple | `functionName` | Runs: Ensure Session |
| **Edge Functions: Test Business Discovery (Local)** | `npm run edge:test:local` | [`package.json`](../package.json) | None | Tests local Edge Function against `localhost:54321` |
| **Edge Functions: Full Development Workflow** | `Sequential composite` | Multiple | None | Runs: Ensure Session → Link Project → List Functions → Serve Local Functions |
| **Edge Functions: Production Deploy Workflow** | `Sequential composite` | Multiple | None | Runs: Ensure Session → Deploy Critical Set → Live Logs (All) |

---

## Testing & Diagnostics

| Task Label | Command | Script/Config | Inputs | Description |
|------------|---------|---------------|--------|-------------|
| **Test: Run Database Tests** | `npm run supabase:test:db` | [`package.json`](../package.json), Multiple | None | Runs: Ensure Session |
| **Test: Run Edge Function Tests (Local, Auth Required)** | `bash export SUPABASE_SESSION_JWT='${input:sessionJWT}' && npm run supabase:test:functions` | Multiple | `sessionJWT` | Runs: Ensure Session |
| **Test: Discovery Pipeline** | `bash cd ${workspaceFolder} && ./scripts/test-discovery-pipeline.sh` | [`./scripts/test-discovery-pipeline.sh`](.././scripts/test-discovery-pipeline.sh), Multiple | `sessionJWT` | Runs: Ensure Session |
| **Test: Enrichment Chain** | `bash cd ${workspaceFolder} && ./scripts/test-enrichment-chain.sh` | [`./scripts/test-enrichment-chain.sh`](.././scripts/test-enrichment-chain.sh), Multiple | `sessionJWT` | Runs: Ensure Session |
| **Test: Export Flow** | `bash cd ${workspaceFolder} && ./scripts/test-export-flow.sh` | [`./scripts/test-export-flow.sh`](.././scripts/test-export-flow.sh), Multiple | `sessionJWT` | Runs: Ensure Session |
| **Test: Full Stack Validation** | `Sequential composite` | Multiple | None | Runs: Discovery Pipeline → Enrichment Chain → Export Flow |
| **Test: Campaign Validation** | `bash ${workspaceFolder}/scripts/testing/campaign-validation.sh ${input:sessionJWT}` | [`scripts/testing/campaign-validation.sh`](../scripts/testing/campaign-validation.sh) | `sessionJWT` | Validates campaign creation and lead generation |
| **Test: Auth Patterns** | `bash ${workspaceFolder}/scripts/testing/test-auth-patterns.sh ${input:sessionJWT}` | [`scripts/testing/test-auth-patterns.sh`](../scripts/testing/test-auth-patterns.sh) | `sessionJWT` | Tests authentication helpers and RLS policies |
| **Diagnostics: Full Campaign** | `bash ${workspaceFolder}/scripts/diagnostics/edge-function-diagnostics.sh ${input:sessionJWT}` | [`scripts/diagnostics/edge-function-diagnostics.sh`](../scripts/diagnostics/edge-function-diagnostics.sh) | `sessionJWT` | Comprehensive Edge Function health check |

---

## Build & Deployment

| Task Label | Command | Script/Config | Inputs | Description |
|------------|---------|---------------|--------|-------------|
| **MCP: Start All Servers** | `npm run mcp:start` | [`package.json`](../package.json) | None | Starts all MCP servers (background task) |
| **MCP: Stop All Servers** | `npm run mcp:stop` | [`package.json`](../package.json) | None | No description available |
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
| **🗂️ Batch Generate Epics + Project** | `npm run roadmap:batch -- --project` | [`package.json`](../package.json) | None | Generates epics AND adds draft items to GitHub Project 5 (requires GH_PROJECT_TOKEN with project scope) |
| **🌐 Open Project 5** | `npm run roadmap:open` | [`package.json`](../package.json) | None | Opens GitHub Project 5 board in browser |
| **🔍 Project Dashboard** | `npm run roadmap:dashboard` | [`package.json`](../package.json) | None | Displays local epic files with metadata (priority, phase, points) |
| **🛠️ Start Epic Scaffolding** | `npm run roadmap:start -- ${input:epicKey}` | [`package.json`](../package.json) | `epicKey` | Creates feature stub, lib module, and Edge Function scaffold for epic |
| **📋 Roadmap: Pull Open Items** | `npm run roadmap:pull` | [`package.json`](../package.json) | None | Fetches open items from GitHub Project 5 and saves to markdown (requires GH_PROJECT_TOKEN) |

---

## Miscellaneous

| Task Label | Command | Script/Config | Inputs | Description |
|------------|---------|---------------|--------|-------------|
| **Start Codespace** | `Sequential composite` | Multiple | None | Runs: Ensure Session → Link Project → GitHub: Ensure Auth (Non-blocking) → MCP: Start All Servers |
| **Close Codespace** | `Sequential composite` | Multiple | None | Runs: MCP: Stop All Servers → Docs: Update All Documentation → Workspace: Validate Configuration → Git: Remind to Push Before Exit |
| **GitHub: Ensure Auth (Non-blocking)** | `bash if command -v gh >/dev/null 2>&1; then gh auth status || echo "⚠️ GitHub CLI not authenticated. Run: gh auth login"; else echo "⚠️ GitHub CLI not installed"; fi` | CLI | None | No description available |
| **Roadmap: Sync Epics to GitHub** | `bash ${workspaceFolder}/scripts/roadmap/sync-epics-to-github.sh` | [`scripts/roadmap/sync-epics-to-github.sh`](../scripts/roadmap/sync-epics-to-github.sh) | None | Creates GitHub issues from local epic files and attaches them to Project 5 (requires GH_PROJECT_TOKEN) |
| **Context: Fetch Repo Snapshot** | `node` | CLI | None | Captures current git branch, status, and diff summary to `.cache/agent/context/repo-context.json` |
| **Context: Fetch Supabase Snapshot** | `node` | CLI | None | Summarizes Edge Function directories and verify_jwt settings to `.cache/agent/context/supabase-functions.json` |
| **Context: Cache Session JWT** | `node` | CLI | `sessionJWT` | Stores the provided session JWT locally at `.cache/agent/context/session.json` |
| **Workspace: Validate Configuration** | `bash ${workspaceFolder}/.vscode/validate-workspace-config.sh` | [`.vscode/validate-workspace-config.sh`](../.vscode/validate-workspace-config.sh) | None | Validates workspace config and environment setup |
| **Thunder: Run Auth Tests** | `echo` | CLI | None | No description available |
| **Thunder: Run Discovery Tests** | `echo` | CLI | None | No description available |
| **Thunder: Run Enrichment Tests** | `echo` | CLI | None | No description available |
| **Thunder: Run Export Tests** | `echo` | CLI | None | No description available |
| **Thunder: Run Database Tests** | `echo` | CLI | None | No description available |
| **Thunder: Run Full Test Suite** | `Sequential composite` | Multiple | None | Runs: Thunder: Run Auth Tests → Thunder: Run Discovery Tests → Thunder: Run Enrichment Tests → Thunder: Run Export Tests → Thunder: Run Database Tests |
| **Thunder: Sync Environment Variables** | `bash echo 'Syncing Thunder Client environment from Vercel/Supabase...' && npx --yes vercel@latest env pull .env.thunder --yes && echo 'Environment synced to .env.thunder'` | CLI | None | No description available |
| **Workspace: Verify Toolchain** | `bash ./scripts/diagnostics/verify-toolchain.sh` | [`./scripts/diagnostics/verify-toolchain.sh`](.././scripts/diagnostics/verify-toolchain.sh) | None | No description available |
| **Git: Remind to Push Before Exit** | `bash git status && echo 'REMINDER: Commit and push your changes before closing Codespace!'` | CLI | None | No description available |
| **Git: Commit and Push All** | `bash git add . && git commit -m 'Codespace close: doc update, MCP stop, codebase index' || echo 'No changes to commit.' && git push` | CLI | None | No description available |
| **npm: mcp:prod** | `N/A` | CLI | None | No description available |

---

## Input Prompts Reference

| Input ID | Type | Description | Options/Default |
|----------|------|-------------|-----------------|
| `functionName` | Dropdown | Supabase Edge Function | 16 functions (default: `business-discovery-background`) |
| `migrationName` | Text | Database migration name | Freeform text |
| `sessionJWT` | Text | Paste SUPABASE_SESSION_JWT (kept in memory only) | Freeform (obtain via `supabase.auth.getSession()`) |
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
