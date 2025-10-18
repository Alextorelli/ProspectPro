# Scripts Directory Overview — 2025-10-18

This directory now groups automation assets by purpose to keep Supabase-first workflows maintainable. Use the sections below to audit health and spot follow-up items quickly.

## Directory Layout

- `context/` – Snapshot helpers that cache repository and Supabase state for other tooling.
- `deployment/` – Supabase/Vercel deployment chores, secret injection, and post-deploy checks.
- `diagnostics/` – Health probes, failure triage, and production validation helpers.
- `lib/` – Shared shell libraries (currently `supabase_cli_helpers.sh`).
- `operations/` – Day-to-day hygiene (session enforcement, repository cleanup, MCP lifecycle).
- `roadmap/` – Roadmap automation scripts that sync GitHub projects.
- `testing/` – Test harnesses for discovery, enrichment, exports, and edge function flows.
- `tooling/` – Docs and task generation utilities plus environment verification scripts.

## Audit Snapshot

_All commands executed on 2025-10-18._

### Oldest Files by mtime

These files have the oldest modification timestamps and should be reviewed first:

```
pull-env-from-secrets.js
production-mcp-status.js
test-vault-foursquare.js
test-webhooks.js
verify-env-mapping.js
cleanup-edge-functions.sh
update-edge-secrets.sh
debug-campaign.sql
collect-diagnostics.sh
deploy.sh
```

### Not Touched in Last 40 Commits

62 scripts did not appear in the last 40 commits. Counts by folder:

- `context/`: 3
- `deployment/`: 8
- `diagnostics/`: 11
- `lib/`: 1
- `operations/`: 10
- `roadmap/`: 7
- `testing/`: 13
- `tooling/`: 8

> Treat these scripts as "review pending". Prioritise testing or deleting anything that no longer matches v4.3 behaviour.

### Orphan Modules (Madge) — Updated 2025-10-18

`npx madge --orphans scripts` flagged 9 JavaScript modules with no inbound imports:

- `context/`: `cache-session.js`, `fetch-repo-context.js`, `fetch-supabase-context.js` — **Referenced by VS Code tasks, intentional entry points**
- `roadmap/`: `roadmap-batch.js`, `roadmap-dashboard.js`, `roadmap-epic.js`, `roadmap-open.js`, `roadmap-pull.js` — **Referenced by package.json npm scripts, intentional entry points**
- `tooling/`: `update-docs.js` — **Referenced by package.json npm script `docs:update`, intentional entry point**

**Removed (no longer orphans):**

- ❌ `operations/production-mcp-status.js` — Deleted (MCP status integrated into MCP servers)
- ❌ `testing/test-enhanced-quality-scoring.js` — Deleted (quality scoring integrated into Edge Functions)
- ❌ `testing/test-vault-foursquare.js` — Deleted (Foursquare integration complete)
- ❌ `testing/test-webhooks.js` — Deleted (webhook testing consolidated)
- ❌ `tooling/generate-codebase-index.js` — Deleted (consolidated into update-docs.js)
- ❌ `tooling/generate-system-reference.js` — Deleted (consolidated into update-docs.js)
- ❌ `tooling/generate-tasks-reference.js` — Deleted (consolidated into update-docs.js)
- ❌ `tooling/pull-env-from-secrets.js` — Deleted (Cloud Build legacy)
- ❌ `tooling/verify-env-mapping.js` — Deleted (Cloud Build legacy)

All remaining orphan scripts are intentional entry points called by npm scripts or VS Code tasks.

## Rename / Move Checklist

| Item                                        | Owner | Status       |
| ------------------------------------------- | ----- | ------------ |
| _No additional renames required post-reorg_ | Alex  | ✅ Confirmed |

Supabase and Vercel workflows run through `ensure-supabase-cli-session.sh` and deployment helpers already reference the new paths (package.json, VS Code tasks, and docs updated 2025-10-18). No breaks observed.

## Follow-up Tasks

1. Work through the orphan list above; delete or integrate each script.
2. Review stale documentation flagged in `docs/maintenance/DOC_SCRUB_STATUS.md` and execute the listed actions.
3. After each cleanup round, rerun:
   - `find scripts ... | sort -n | head/tail`
   - `git log -n 40 --name-only`
   - `npx madge --orphans scripts`
4. Log outcomes in repo notes (or this README) and stage only verified changes.
5. Validate ignore hygiene:
   - Run `node scripts/tooling/validate-ignore-config.cjs` after any ignore file change
   - Refactor `.vercelignore` to remove redundant rules and align with `.gitignore` (see 2025-10-18 update)
   - Document all ignore file changes here and in commit messages
   - Integrate validation script into Husky pre-commit, Codespace startup, and Vercel build workflows
   - If validation flags unwanted files, update ignore rules and rerun
