# Generate an optimized refactoring strategy for the requirements below:

**Context:** the testing suite exists to give each canonical agent a portable, app-agnostic profile capable of driving full-stack validation (Vitest, Playwright, Deno) through simple, automated tasks surfaced in both Task CLI and VS Code’s native Run/Debug UX. Task automation lives primarily in each agent’s `taskfile.yaml`, working alongside its config, `instructions`, and `toolset` to form a complete “Agent Profile”; .vscode only exposes lightweight shims.

**End-state overview:**

- **Repo layout:** app holds the product UI and Supabase backend, dev-tools houses agent profiles, automation, observability, and inventories, and integration retains partner connectors plus environment specs. Session-store captures working notes; reports stay under reports.
- **Dev-tools suite:** Canonical agents (\_development-workflow, \_observability, \_production-ops, \_system-architect) each ship with aligned configs, toolsets, instructions, and taskfiles that trigger lint, unit, integration, and cross-browser E2E checks, plus telemetry sync and MCP routines.
- **Workspace flow:** Developers open the repo, install deps once, then run the curated agent tasks (via Task CLI or VS Code tasks), which cascade across Vitest, Playwright, and Deno pipelines, update documentation/inventories, and log provenance. Automation keeps editor settings, MCP servers, and inventories consistent so teams can move between projects without retooling.

This delivers a portable, automation-first toolkit that mirrors production workflows while remaining cleanly separated from application-specific code.

**Generate & Inspect**

- `npm run repo:scan` (already run) writes fresh trees to session_store:
  - `repo-tree-summary.txt` – one-line-per-path, good for spotting stray roots.
  - `app-filetree.txt`, `dev-tools-filetree.txt`, `integration-filetree.txt` – domain-specific drill-downs.

Optional coarse view: `SUMMARY_DEPTH=2 npm run repo:scan:summary` for a two-level tree.

**Scrub Workflow**

1. Open `repo-tree-summary.txt` to spot unexpected top-level dirs/files.
2. Dive into the domain-specific inventories to confirm whether paths belong to the canonical structure (app, dev-tools, integration).
3. For each suspect folder, cross-check copilot-instructions.md + `REPO_RESTRUCTURE_PLAN.md` to avoid removing sanctioned assets.
4. When you’re ready, delete in bulk (e.g. `rm -rf path1 path2`) or stage moves, then rerun `npm run repo:scan` to confirm the tree.
5. Log decisions/provenance in coverage.md so agent history stays consistent.

Once the clutter is gone, we can turn to the rewiring strategy with a clean snapshot.
