# ProspectPro VS Code Tasks Reference

_Auto-generated from `.vscode/tasks.json` — Last updated: 2025-10-20_

**Quick Access**: Press `Ctrl+Shift+P` → "Tasks: Run Task" → Select from list below

---

## 🗂️ Task Categories

- [Supabase & Database](#supabase-database)
- [Edge Functions](#edge-functions)
- [Testing & Diagnostics](#testing-diagnostics)
- [Build & Deployment](#build-deployment)
- [Documentation](#documentation)
- [Roadmap Management](#roadmap-management)
- [Miscellaneous](#miscellaneous)

---

## Supabase & Database

| Task Label | Command | Script/Config | Inputs | Description |
|------------|---------|---------------|--------|-------------|
| **Supabase: Ensure Session** | `bash -lc source scripts/operations/ensure-supabase-cli-session.sh` | [`source scripts/operations/ensure-supabase-cli-session.sh`](../scripts/source scripts/operations/ensure-supabase-cli-session.sh) | None | No description available |
| **Supabase: Reset Auth Emulator** | `bash -lc ./scripts/operations/reset-auth-emulator.sh` | [`scripts/operations/reset-auth-emulator.sh`](../scripts/operations/reset-auth-emulator.sh) | None | No description available |
| **Supabase: Link Project** | `npm run supabase:link` | Multiple | None | Runs: Supabase: Ensure Session |
| **Supabase: Pull Public Schema** | `npm run supabase:db:pull` | Multiple | None | Runs: Supabase: Ensure Session |
| **Supabase: Generate Types** | `npm run supabase:types` | Multiple | None | Runs: Supabase: Ensure Session |
| **Supabase: List Migrations** | `npm run supabase:migrations:list` | Multiple | None | Runs: Supabase: Ensure Session |
| **Supabase: Push Database** | `npm run supabase:db:push` | Multiple | None | Runs: Supabase: Ensure Session |
| **Supabase: Start Local Stack** | `npm run supabase:start:local` | Multiple | None | No description available |
| **Database: Create Migration** | `bash -lc cd supabase && source ../scripts/operations/ensure-supabase-cli-session.sh && npx --yes supabase@latest migration new ${input:migrationName}` | [`cd supabase && source scripts/operations/ensure-supabase-cli-session.sh && npx --yes supabase@latest migration new ${input:migrationName}`](../scripts/cd supabase && source scripts/operations/ensure-supabase-cli-session.sh && npx --yes supabase@latest migration new ${input:migrationName}) | migrationName | No description available |
| **Supabase: Serve Local Functions** | `npm run edge:serve` | Multiple | None | Runs: Supabase: Ensure Session |
| **Test: Run Database Tests** | `npm run supabase:test:db` | Multiple | None | Runs: Supabase: Ensure Session |
| **Context: Fetch Supabase Snapshot** | `node scripts/context/fetch-supabase-context.js` | [`scripts/context/fetch-supabase-context.js`](../scripts/context/fetch-supabase-context.js) | None | No description available |
| **Supabase: Fetch Logs** | `bash -lc mkdir -p reports/logs && source scripts/operations/ensure-supabase-cli-session.sh && npx --yes supabase@latest functions logs ${input:functionName} --since=${input:sinceTime} > reports/logs/supabase-logs-$(date +%Y%m%d-%H%M%S).log && echo 'Logs saved to reports/logs/supabase-logs-$(date +%Y%m%d-%H%M%S).log'` | Multiple | None | Runs: Supabase: Ensure Session |
| **Supabase: Analyze Logs** | `bash -lc source scripts/operations/ensure-supabase-cli-session.sh && ./scripts/diagnostics/edge-function-diagnostics.sh ${input:logFile}` | Multiple | None | Runs: Supabase: Ensure Session |

## Edge Functions

| Task Label | Command | Script/Config | Inputs | Description |
|------------|---------|---------------|--------|-------------|
| **Edge Functions: Deploy Function** | `bash -lc cd supabase && source ../scripts/operations/ensure-supabase-cli-session.sh && npx --yes supabase@latest functions deploy ${input:functionName} --no-verify-jwt` | Multiple | None | Runs: Supabase: Ensure Session |
| **Edge Functions: Deploy Critical Set** | `npm run deploy:critical` | Multiple | None | Runs: Supabase: Ensure Session |
| **Edge Functions: Deploy Discovery Group** | `npm run deploy:discovery` | Multiple | None | Runs: Supabase: Ensure Session |
| **Edge Functions: Deploy Enrichment Group** | `npm run deploy:enrichment` | Multiple | None | Runs: Supabase: Ensure Session |
| **Edge Functions: Deploy Export Functions** | `npm run deploy:exports` | Multiple | None | Runs: Supabase: Ensure Session |
| **Edge Functions: Deploy Diagnostics** | `bash -lc cd supabase && source ../scripts/operations/ensure-supabase-cli-session.sh && npx --yes supabase@latest functions deploy test-google-places --no-verify-jwt && npx --yes supabase@latest functions deploy test-new-auth --no-verify-jwt && npx --yes supabase@latest functions deploy auth-diagnostics --no-verify-jwt` | Multiple | None | Runs: Supabase: Ensure Session |
| **Edge Functions: Deploy All Functions** | `Sequential composite` | Multiple | None | Runs: Edge Functions: Deploy Discovery Group → Edge Functions: Deploy Enrichment Group → Edge Functions: Deploy Export Functions → Edge Functions: Deploy Diagnostics |
| **Edge Functions: List Functions** | `npm run edge:list` | Multiple | None | Runs: Supabase: Ensure Session |
| **Edge Functions: Live Logs (All)** | `npm run edge:logs` | Multiple | None | Runs: Supabase: Ensure Session |
| **Edge Functions: Error Logs Only** | `npm run edge:logs:errors` | Multiple | None | Runs: Supabase: Ensure Session |
| **Logs: Edge Function** | `bash -lc cd supabase && source ../scripts/operations/ensure-supabase-cli-session.sh && npx --yes supabase@latest functions logs ${input:functionName} --follow` | Multiple | None | Runs: Supabase: Ensure Session |
| **Edge Functions: Test Business Discovery (Local)** | `npm run edge:test:local` | Multiple | None | No description available |
| **Edge Functions: Full Development Workflow** | `Sequential composite` | Multiple | None | Runs: Supabase: Ensure Session → Supabase: Link Project → Edge Functions: List Functions → Supabase: Serve Local Functions |
| **Edge Functions: Production Deploy Workflow** | `Sequential composite` | Multiple | None | Runs: Supabase: Ensure Session → Edge Functions: Deploy Critical Set → Edge Functions: Live Logs (All) |
| **Test: Run Edge Function Tests (Local, Auth Required)** | `bash -lc export SUPABASE_SESSION_JWT='${input:sessionJWT}' && npm run supabase:test:functions` | Multiple | None | Runs: Supabase: Ensure Session |
| **Test: Edge Functions (Force Bypass)** | `bash -lc ./scripts/testing/run-edge-tests-force.sh` | Multiple | None | Runs: Supabase: Ensure Session |

## Testing & Diagnostics

| Task Label | Command | Script/Config | Inputs | Description |
|------------|---------|---------------|--------|-------------|
| **Test: Discovery Pipeline** | `bash -lc cd ${workspaceFolder} && ./scripts/testing/test-discovery-pipeline.sh` | Multiple | None | Runs: Supabase: Ensure Session |
| **Test: Enrichment Chain** | `bash -lc cd ${workspaceFolder} && ./scripts/testing/test-enrichment-chain.sh` | Multiple | None | Runs: Supabase: Ensure Session |
| **Test: Export Flow** | `bash -lc cd ${workspaceFolder} && ./scripts/testing/test-export-flow.sh` | Multiple | None | Runs: Supabase: Ensure Session |
| **Test: Full Stack Validation** | `Sequential composite` | Multiple | None | Runs: Test: Discovery Pipeline → Test: Enrichment Chain → Test: Export Flow |
| **Test: Campaign Validation** | `bash -lc ${workspaceFolder}/scripts/testing/campaign-validation.sh ${input:sessionJWT}` | [`${workspaceFolder}/scripts/testing/campaign-validation.sh ${input:sessionJWT}`](../scripts/${workspaceFolder}/scripts/testing/campaign-validation.sh ${input:sessionJWT}) | sessionJWT | No description available |
| **Test: Auth Patterns** | `bash -lc ${workspaceFolder}/scripts/testing/test-auth-patterns.sh ${input:sessionJWT}` | [`${workspaceFolder}/scripts/testing/test-auth-patterns.sh ${input:sessionJWT}`](../scripts/${workspaceFolder}/scripts/testing/test-auth-patterns.sh ${input:sessionJWT}) | sessionJWT | No description available |
| **Diagnostics: Full Campaign** | `bash -lc ${workspaceFolder}/scripts/diagnostics/edge-function-diagnostics.sh ${input:sessionJWT}` | [`${workspaceFolder}/scripts/diagnostics/edge-function-diagnostics.sh ${input:sessionJWT}`](../scripts/${workspaceFolder}/scripts/diagnostics/edge-function-diagnostics.sh ${input:sessionJWT}) | sessionJWT | No description available |

## Build & Deployment

| Task Label | Command | Script/Config | Inputs | Description |
|------------|---------|---------------|--------|-------------|
| **Deploy: Full Automated Frontend** | `npm run lint && npm test && npm run build && npx --yes vercel@latest --prod --confirm --scope appsmithery --project prospect-pro --cwd dist` |  | None | No description available |
| **Build: Frontend Production** | `npm run build` | Multiple | None | No description available |
| **Deploy: Vercel Production** | `bash -lc cd dist && npx --yes vercel@latest --prod` | Multiple | None | Runs: Build: Frontend Production |

## Documentation

| Task Label | Command | Script/Config | Inputs | Description |
|------------|---------|---------------|--------|-------------|
| **Docs: Update All Documentation** | `npm run docs:update` | Multiple | None | No description available |
| **Docs: Update System Reference (Legacy)** | `npm run system:reference` | Multiple | None | No description available |
| **Docs: Update Codebase Index (Legacy)** | `npm run codebase:index` | Multiple | None | No description available |
| **Docs: Bootstrap Tooling Diagrams** | `npm run docs:bootstrap` |  | None | No description available |

## Roadmap Management

| Task Label | Command | Script/Config | Inputs | Description |
|------------|---------|---------------|--------|-------------|
| **🚀 Create Epic (Guided)** | `npm run roadmap:epic` | Multiple | None | No description available |
| **🗂️ Batch Generate Epics** | `npm run roadmap:batch` | Multiple | None | No description available |
| **🗂️ Batch Generate Epics + Project** | `npm run roadmap:batch -- --project` | Multiple | None | No description available |
| **🛠️ Start Epic Scaffolding** | `npm run roadmap:start -- ${input:epicKey}` | Multiple | epicKey | No description available |
| **📋 Roadmap: Pull Open Items** | `npm run roadmap:pull` | Multiple | None | No description available |
| **Roadmap: Sync Epics to GitHub** | `bash ${workspaceFolder}/scripts/roadmap/sync-epics-to-github.sh` | [`${workspaceFolder}/scripts/roadmap/sync-epics-to-github.sh`](../scripts/${workspaceFolder}/scripts/roadmap/sync-epics-to-github.sh) | None | No description available |

## Miscellaneous

| Task Label | Command | Script/Config | Inputs | Description |
|------------|---------|---------------|--------|-------------|
| **Workspace: Dev Hygiene Check** | `npm run validate:ignores` | Multiple | None | No description available |
| **Start Codespace** | `Sequential composite` | Multiple | None | Runs: Supabase: Ensure Session → Supabase: Link Project → GitHub: Ensure Auth (Non-blocking) → MCP: Start All Servers |
| **Close Codespace** | `Sequential composite` | Multiple | None | Runs: MCP: Stop All Servers → Docs: Update All Documentation → Workspace: Validate Configuration → Git: Remind to Push Before Exit |
| **GitHub: Ensure Auth (Non-blocking)** | `bash -lc if command -v gh >/dev/null 2>&1; then gh auth status || echo "⚠️ GitHub CLI not authenticated. Run: gh auth login"; else echo "⚠️ GitHub CLI not installed"; fi` | Multiple | None | No description available |
| **MCP: Start All Servers** | `npm run mcp:start` | Multiple | None | No description available |
| **MCP: Stop All Servers** | `npm run mcp:stop` | Multiple | None | No description available |
| **Observability: Start Stack** | `bash -lc cd tooling/observability && docker-compose -f docker-compose.jaeger.yml up -d` | Multiple | None | No description available |
| **Observability: Stop Stack** | `bash -lc cd tooling/observability && docker-compose -f docker-compose.jaeger.yml down` | Multiple | None | No description available |
| **Observability: View Prometheus** | `echo Open Prometheus at: http://localhost:9090` | Multiple | None | No description available |
| **Observability: View Grafana** | `echo Open Grafana at: http://localhost:3000 (admin/admin)` | Multiple | None | No description available |
| **Observability: MCP Server** | `npm run start:observability` | `${workspaceFolder}/mcp-servers` | None | No description available |
| **🌐 Open Project 5** | `npm run roadmap:open` | Multiple | None | No description available |
| **🔍 Project Dashboard** | `npm run roadmap:dashboard` | Multiple | None | No description available |
| **Context: Fetch Repo Snapshot** | `node scripts/context/fetch-repo-context.js` | [`scripts/context/fetch-repo-context.js`](../scripts/context/fetch-repo-context.js) | None | No description available |
| **Context: Cache Session JWT** | `node scripts/context/cache-session.js ${input:sessionJWT}` | [`scripts/context/cache-session.js`](../scripts/context/cache-session.js) | sessionJWT | No description available |
| **Workspace: Validate Configuration** | `bash -lc ${workspaceFolder}/.vscode/validate-workspace-config.sh` | Multiple | None | No description available |
| **Workspace: Validate Configuration** | `bash -lc ${workspaceFolder}/.vscode/validate-workspace-config.sh` | Multiple | None | No description available |
| **Workspace: Verify Toolchain** | `bash -lc ./scripts/diagnostics/verify-toolchain.sh` | [`scripts/diagnostics/verify-toolchain.sh`](../scripts/diagnostics/verify-toolchain.sh) | None | No description available |
| **Git: Remind to Push Before Exit** | `bash -c git status && echo 'REMINDER: Commit and push your changes before closing Codespace!'` | Multiple | None | No description available |
| **DevTools: Start React DevTools** | `npm run devtools:react` |  | None | No description available |
| **MCP: Start Suite** | `./tooling/scripts/shell/start-mcp.sh` |  | None | No description available |
| **MCP: Stop Suite** | `./tooling/scripts/shell/stop-mcp.sh` |  | None | No description available |
| **npm: mcp:prod** | `npm run mcp:prod` | [`package.json`](../package.json) | None | No description available |
