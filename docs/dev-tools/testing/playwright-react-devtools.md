# Playwright + React DevTools E2E Suite Workplan (Temp)

## Staging Environment

- Staging preview alias: https://staging.prospectpro.appsmithery.co (set via `npm run deploy:staging:alias`)
- Use this domain for persistent QA, agent, and E2E validation.

## Phase 0 — Readiness

- Confirm `microsoft/playwright-mcp` registry entry resolves with `npm run build:tools` and `npx playwright install`.
- Verify React DevTools npm script (`npm run devtools:react`) and add VS Code task reference.

## Phase 1 — Playwright Test Bed

- Scaffold `playwright.config.ts` under `app/frontend/` with Supabase env loading.
- Add npm scripts (`test:e2e`, `test:e2e:headed`) and tie into MCP `playwright.run_suite`.
- Generate baseline specs for auth, lead search, export, billing via MCP prompts; store under `app/frontend/tests/e2e/`.

## Phase 2 — React DevTools Hooks

- Document inspection workflow in `docs/dev-tools/testing/react-devtools.md`.
- Add task to launch React DevTools alongside `npm run dev -- --open`, capture bridge instructions for agents.

## Phase 3 — Agent & Context Wiring

- Update persona instructions/toolsets to invoke Playwright MCP for regression gates; add React DevTools escalation notes.
- Extend `MCP_MODE_TOOL_MATRIX.md` with E2E tasks and ensure `tool-reference.md` cross-links.

## Phase 4 — CI & Reporting

- Wire GitHub Action job running `npx playwright test --reporter=list,junit`.
- Persist artifacts to `dev-tools/reports/e2e/` and note coverage deltas in `coverage.md`.
- Add cleanup checklist for session_store logs post-run.

> Remove once merged into permanent documentation.
