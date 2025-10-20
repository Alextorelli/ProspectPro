# REPO_RESTRUCTURE_PLAN

## Objective

Converge ProspectPro to a hybrid mono-repo structure optimized for AI agent workflows, separating application source code (/app) from dev tooling (/tooling), while preserving Supabase-first architecture and MCP integrations.

## Target Directory Layout

/app/
/discovery/
/enrichment/
/export/
/diagnostics/
/frontend/
/backend/
/tooling/
/scripts/
/ci/
/docker/
/vercel/
/monitoring/
/supabase/
/test-automation/
/agent-orchestration/
/integration/

## Ownership Rules

- /app: Production application code only (frontend, backend, edge functions, business logic)
- /tooling: Dev tools, CI/CD, agent orchestration, monitoring, test automation, integration scripts
- Legacy folders (archive, backups, modules, context, workflow, dist, mcp-servers) to be tagged and migrated/archived
- Documentation to be indexed and updated post-migration

## Migration Steps

1. Tag and plan migration for legacy folders
2. Move src, public, supabase/functions into /app (phased)
3. Relocate dev tooling into /tooling subtrees
4. Update build scripts, npm scripts, VS Code tasks, Thunder collections
5. Regenerate documentation and codebase index
6. Validate agent readiness and zero-fake-data compliance

## Notes

- Supabase-first architecture and RLS policies must remain intact
- MCP integrations must be updated to new paths
- All changes staged and verified before cutover

## Ignore File Policy

- All ignore files (.gitignore, .eslintignore, .vercelignore) are maintained at the repository root for clarity and single-source-of-truth enforcement.
- No per-folder ignore files are permitted unless required by CI/CD or build tooling; any such exceptions must be documented here.
- .gitignore: VCS scope, excludes build outputs, logs, environment files, node_modules, and all non-MECE root files. No per-folder .gitignore files allowed.
- .eslintignore: Linting scope, excludes build outputs, logs, Supabase functions, and automation scripts under tooling/. No per-folder .eslintignore files allowed.
- .vercelignore: Frontend build scope, excludes everything except static frontend assets and required configs. No per-folder .vercelignore files allowed.
- Any exception (e.g., for CI/CD or build tooling) must be documented here and justified.

## Root Directory Hygiene

- Only the following root folders and files are permitted:
  - app/
  - tooling/
  - docs/
  - config/
  - reports/
  - .gitignore, .eslintignore, .vercelignore
  - README.md, LICENSE, package.json, package-lock.json, yarn.lock, CHANGELOG.md
  - .github/, .vscode/, .devcontainer/, .husky/, .nvmrc, .npmrc
- All other files/folders must be moved into the appropriate namespace or archived before deletion.
- The folder archive/loose-root-assets/ is used as a temporary quarantine for legacy or loose files pending review or deletion.

### Config Folder Layout

- `config/README.md` records MECE ownership for configuration artifacts.
- `tailwind.config.js`, `postcss.config.js`, `tsconfig*.json`, and `vercel.json` belong to the **app** surface and should only reference files under `app/frontend`.
- `environment-loader.js`, `package-supabase.json`, `supabase.js`, `supabase-ca-2021.crt`, and `otel-config.yml` are **shared** resources consumed by both frontend and Supabase functions.
- `mcp-config.json` and `ignore-validator.allowlists.json` are **tooling** assets used by MCP servers and hygiene scripts.
