# ProspectPro Config Catalog

> Regenerate docs with `npm run docs:update` after modifying configuration files.

## Directory Purpose

- `app` surface (Vite/Tailwind/PostCSS/TypeScript tooling) keeps the frontend self-contained under `app/frontend`.
- `shared` settings (Supabase deployment, Observability) apply across both frontend and Edge Functions.
- `tooling` automation (MCP, ignore hygiene, Supabase CLI guards) power the supporting infrastructure.

## File Map

| File                               | Scope   | Notes                                                                   |
| ---------------------------------- | ------- | ----------------------------------------------------------------------- |
| `tailwind.config.js`               | app     | Frontend design tokens and MECE taxonomy references                     |
| `postcss.config.js`                | app     | PostCSS pipeline for Vite build                                         |
| `tsconfig.json`                    | app     | Vite+React compiler options (extends `/app/frontend/tsconfig.app.json`) |
| `tsconfig.node.json`               | app     | Node/Vitest config aligned with root Vite file                          |
| `vercel.json`                      | app     | Static deployment rules for Vercel                                      |
| `package-supabase.json`            | shared  | Supabase CLI project metadata                                           |
| `supabase.js`                      | shared  | Supabase client environment loader                                      |
| `environment-loader.js`            | shared  | Merges `.env`, Vault, and Codespace secrets                             |
| `otel-config.yml`                  | shared  | Observability stack (Jaeger/Prometheus)                                 |
| `supabase-ca-2021.crt`             | shared  | Supabase certificate bundle                                             |
| `mcp-config.json`                  | tooling | MCP server manifest (production/development/troubleshooting)            |
| `ignore-validator.allowlists.json` | tooling | Source control hygiene exceptions                                       |

## Standards

1. Changes in this folder **must** maintain alignment with the MECE layout (app / shared / tooling).
2. Update `docs/technical/REPO_RESTRUCTURE_PLAN.md` when introducing new config artifacts.
3. Run `npm run validate:ignores` after edits affecting ignore policy.

---

## 2025-10-22: Dev Tools Integration Update

- MCP config now references Supabase, React DevTools, Vercel CLI, Redis, and environment loader.
- Integration steps for environment loader added to startup scripts and VS Code tasks.
- Direct integration with frontend and Supabase functions highlighted.
