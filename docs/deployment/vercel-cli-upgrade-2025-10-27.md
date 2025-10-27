# Vercel CLI Upgrade (48.6.0) – 2025-10-27

## Summary

- Upgraded workspace `devDependency` `vercel` to **48.6.0** to pull in the latest CLI binaries and address the highest-priority `npm audit` advisories tied to the older `41.x` line.
- Transitive packages (`@vercel/node`, `@vercel/redwood`, `@vercel/remix-builder`, `@vercel/static-build`) now source updated `path-to-regexp`, `semver`, `cookie`, and `estree-util-value-to-estree` versions; this clears the previously acknowledged CVEs from the `41.x` tree.
- `npm audit` still reports eight remaining vulnerabilities after the upgrade, driven by new `path-to-regexp@8.3.0` and `undici@5.28.x` dependencies bundled with Vercel 48; these advisories exist upstream and currently lack patched releases.

## Runtime Expectations

- **Node requirement**: Vercel CLI 48 requires Node 18+ (16 is deprecated). Repository standard remains Node 20.x. Use `nvm use 20` (or ASDF equivalent) before invoking CLI to match production builds and avoid EBADENGINE warnings.
- **Auth tokens**: No token format changes. Existing `VERCEL_TOKEN` entries in `.env.agent.local` remain valid.
- **Deploy command**: `npx vercel@48.6.0 --prod --confirm --scope appsmithery --project prospect-pro --cwd dist` remains the canonical smoke deploy path.

## Operational Notes

- Local smoke deploys (`Deploy: Full Automated Frontend` VS Code task) continue to run lint → test → build → vercel deploy with the upgraded CLI.
- Vercel CLI 48 warns (instead of failing) when legacy project settings use deprecated default regions; confirm the `scope` and `project` flags to bypass interactive prompts.
- Current `npm audit` output suggests downgrading to `vercel@41.0.2`; do **not** follow that guidance, as it reintroduces the original CVEs. Track upstream fixes for `path-to-regexp@>=8.3.0` and `undici@5.28.x` instead.
- CI/CD agents should pin the same CLI version to avoid mixed dependency trees; update any external pipelines invoking `vercel` to `48.6.0`.

## Follow-up

- Monitor upstream release notes: https://github.com/vercel/vercel/releases/tag/vercel%4048.6.0
- Re-run `npm audit` during the next dependency review cycle to confirm no regressions and catch patches for the outstanding `path-to-regexp` and `undici` advisories.
