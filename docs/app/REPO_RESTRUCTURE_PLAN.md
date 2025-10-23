# REPO_RESTRUCTURE_PLAN

## Pending Migrations (2025-10-23)

### App documentation

- FAST_README.md → docs/app/APP_README.md
- docs/app/runbooks/\*.md (create consolidated index as docs/app/APP_runbooks.md; migrate existing feature guides)

### Dev-tools documentation

- FAST_README.md → docs/dev-tools/DEV_README.md
- docs/tooling/playbooks/\*.md → docs/dev-tools/DEV_runbooks.md
- docs/tooling/diagram-guidelines.md + related assets → ensure references updated to mermaid manifests

### Integration documentation

- Seed docs/integration/INT_README.md using repo scan outputs
- Aggregate existing integration runbooks into docs/integration/INT_runbooks.md
- Create docs/integration/diagrams/{deployment,data-flow,security}/ and relocate any relevant diagrams from legacy locations

### Shared documentation & standards

- Move CODEBASE_INDEX.md, SYSTEM_REFERENCE.md, and related standards into standards
- Ensure docs/shared/mermaid/diagrams.manifest.json lists new diagram locations

### SKIP MMD Diagrams

- Only recommend moving an mmd file if absolutely necessary due to other file linkages (excluding legacy scripts and configs)

### Indexes & cross-links

- Update REPO_RESTRUCTURE_PLAN.md checkpoints with the moves above
- Refresh index.md to reflect the final diagram paths
- Re-run npm run repo:scan post-migration and log outputs in coverage.md for provenance

## Objective

Deliver the ProspectPro hybrid mono-repo realignment with a diagram-first, automation-aware workflow. Separate production application code under `/app` from dev tooling under `/tooling`, enforce centralized Mermaid standards, and keep Supabase-first architecture plus MCP integrations fully operational.

## Target Directory Layout

ProspectPro/
├── 📁 app/ # APP SOURCE DOMAIN
│ ├── frontend/ # React application
│ │ ├── src/
│ │ │ ├── components/ # Reusable UI components
│ │ │ ├── pages/ # Route-based page components
│ │ │ ├── hooks/ # Custom React hooks
│ │ │ ├── stores/ # Zustand state management
│ │ │ ├── services/ # API client services
│ │ │ ├── types/ # TypeScript definitions
│ │ │ └── utils/ # Helper functions
│ │ ├── public/ # Static assets
│ │ └── tests/ # Frontend unit tests
│ │
│ ├── backend/ # Supabase functions & schemas
│ │ ├── functions/ # Edge functions
│ │ │ ├── business-discovery/ # Lead generation functions
│ │ │ ├── enrichment/ # Data enrichment functions
│ │ │ ├── exports/ # Export/campaign functions
│ │ │ └── shared/ # Shared utilities
│ │ ├── schemas/ # Database schemas
│ │ │ ├── migrations/ # SQL migration files
│ │ │ └── types/ # Generated TypeScript types
│ │ └── tests/ # Backend function tests
│ │
│ └── shared/ # Shared between frontend/backend
│ ├── types/ # Common TypeScript types
│ ├── constants/ # Application constants
│ └── validators/ # Data validation schemas
│
├── 📁 dev-tools/ # DEV TOOLS DOMAIN
│ ├── automation/ # Build & deployment automation
│ │ ├── ci-cd/ # CI/CD workflows & scripts
│ │ ├── deployment/ # Deployment orchestration
│ │ └── releases/ # Release management
│ │
│ ├── testing/ # Testing infrastructure
│ │ ├── e2e/ # End-to-end tests
│ │ ├── integration/ # Integration tests
│ │ ├── load/ # Performance testing
│ │ └── fixtures/ # Test data & mocks
│ │
│ ├── monitoring/ # Observability & analytics
│ │ ├── telemetry/ # OpenTelemetry setup
│ │ ├── logging/ # Logging configuration
│ │ ├── metrics/ # Custom metrics
│ │ └── alerts/ # Alert definitions
│ │
│ ├── agents/ # AI agent orchestration
│ │ ├── mcp-servers/ # Model Context Protocol servers
│ │ ├── workflows/ # Agent workflow definitions
│ │ └── prompts/ # Prompt templates & chains
│ │
│ ├── scripts/ # Development scripts
│ │ ├── setup/ # Environment setup
│ │ ├── maintenance/ # Cleanup & maintenance
│ │ ├── data/ # Data management scripts
│ │ └── utils/ # Utility scripts
│ │
│ ├── config/ # Tool configurations
│ │ ├── eslint/ # ESLint configurations
│ │ ├── typescript/ # TypeScript configurations
│ │ ├── vite/ # Vite build configurations
│ │ └── jest/ # Test configurations
│ │
│ └── workspace/ # Developer workspace tools
│ ├── vscode/ # VS Code extensions & settings
│ ├── codespaces/ # GitHub Codespaces setup
│ └── templates/ # Code generation templates
│
├── 📁 integration/ # INTEGRATION DOMAIN
│ ├── platform/ # Platform integrations
│ │ ├── supabase/ # Supabase-specific configs
│ │ ├── vercel/ # Vercel deployment configs
│ │ ├── github/ # GitHub Actions & workflows
│ │ └── external-apis/ # Third-party API integrations
│ │
│ ├── infrastructure/ # Infrastructure as code
│ │ ├── terraform/ # Terraform configurations (if used)
│ │ ├── docker/ # Container definitions
│ │ └── k8s/ # Kubernetes manifests (if used)
│ │
│ ├── security/ # Security & compliance
│ │ ├── auth/ # Authentication configurations
│ │ ├── secrets/ # Secret management templates
│ │ └── compliance/ # Security compliance files
│ │
│ ├── data/ # Data pipeline integrations
│ │ ├── etl/ # Extract, transform, load processes
│ │ ├── backup/ # Backup & recovery procedures
│ │ └── sync/ # Data synchronization
│ │
│ └── environments/ # Environment-specific configs
│ ├── development/ # Dev environment setup
│ ├── staging/ # Staging environment
│ └── production/ # Production environment
│
├── 📁 docs/ # DOCUMENTATION DOMAIN
│ ├── app/ # App source documentation
│ │ ├── api/ # API documentation
│ │ ├── components/ # Component documentation
│ │ ├── user-guides/ # End-user documentation
│ │ └── diagrams/ # App-specific Mermaid diagrams
│ │ ├── user-flows/ # User journey diagrams
│ │ ├── state-machines/ # State transition diagrams
│ │ └── api-flows/ # API interaction diagrams
│ │
│ ├── dev-tools/ # Dev tools documentation
│ │ ├── setup/ # Development setup guides
│ │ ├── workflows/ # Development workflows
│ │ ├── tooling/ # Tool-specific documentation
│ │ └── diagrams/ # Dev tools Mermaid diagrams
│ │ ├── architecture/ # System architecture
│ │ ├── ci-cd/ # CI/CD pipeline diagrams
│ │ └── agent-flows/ # AI agent workflows
│ │
│ ├── integration/ # Integration documentation
│ │ ├── platform/ # Platform integration guides
│ │ ├── deployment/ # Deployment procedures
│ │ ├── security/ # Security documentation
│ │ └── diagrams/ # Integration Mermaid diagrams
│ │ ├── deployment/ # Deployment flows
│ │ ├── data-flow/ # Data pipeline diagrams
│ │ └── security/ # Security architecture
│ │
│ └── shared/ # Cross-cutting documentation
│ ├── mermaid/ # Mermaid configuration & standards
│ │ ├── config/ # Global Mermaid configurations
│ │ ├── templates/ # Diagram templates
│ │ └── guidelines/ # Diagram style guidelines
│ ├── standards/ # Coding & documentation standards
│ └── troubleshooting/ # Common issues & solutions
│
├── 📁 scripts/ # ROOT LEVEL SCRIPTS
│ ├── setup/ # Initial repository setup
│ ├── maintenance/ # Repository maintenance
│ └── docs/ # Documentation generation scripts
│
└── 📁 config/ # ROOT LEVEL CONFIGS
├── typescript/ # Global TypeScript config
├── package-configs/ # Package.json configurations
└── environment/ # Environment variable templates

## Governance & Ownership

- `/app`: Production surfaces only (frontend, backend, edge functions, business logic). Keep Supabase RLS, auth, and discovery/enrichment/export flows intact.
- `/tooling`: Dev tooling, automation, MCP assets, CI/CD, diagnostics, and agent orchestration. Guarded directories (`.vscode/`, `.github/`) require staging in `docs/tooling/settings-staging.md` prior to edits.
- `archive/loose-root-assets/`: Temporary quarantine for legacy files pending migration or deletion.
- Root hygiene: Only canonical top-level folders and repo metadata remain at the project root (README, package manifests, ignore files, .github/, .vscode/, .devcontainer/, etc.).

## End-to-End Migration Plan

## Source-First Migration Action Plan (2025-10-23)

1. **Draft move list:**

- Compare `reports/context/pre-move-tree.txt` to the target layout in this plan.
- Note affected imports, scripts, and tests for each batch.

2. **Move application source first:**

- Shift frontend, backend, shared libs, and Supabase function trees into their final `/app/**` subdirectories.
- Update import paths, Supabase references, and run `npm run lint`, `npm test`, `npm run supabase:test:db`, and `npm run repo:scan` after each batch.
- Log each move and validation run in `reports/context/coverage.md`.

3. **Introduce the integration domain:**

- Scaffold `/integration/{platform,infrastructure,security,data,environments}`.
- Relocate Supabase/Vercel/GitHub configs and infra scripts; refresh cross-links to the new `/app` paths.
- Re-run `npm run repo:scan` and targeted integration tests; document results in `coverage.md`.

4. **Migrate dev tooling last:**

- Move legacy `tooling/`, automation scripts, and MCP assets into `/dev-tools/**` once source/integration paths are stable.
- Update npm scripts, VS Code tasks, and workflows to the new locations, then rerun `repo:scan` + lint/tests.
- Record the moves, validation outputs, and any rollbacks in `coverage.md` and `workspace_status.md`.

5. **Finalise root hygiene:**

- Remove or archive remaining legacy folders/loose documentation, ensuring rollback tarballs under `archive/loose-root-assets/`.
- After structure stabilises, rebuild documentation and automation configs per the restructure plan.

## Remaining Alignment Tasks

- Phase the relocation of `/app/frontend`, `/app/backend/functions`, and supporting tooling into the target layout while keeping Supabase auth + RLS intact.
- Update VS Code tasks, npm scripts, and MCP tooling to match new paths after the diagram automation branch merges.
- Document ZeroFakeData checks, context snapshots, and diagnostics alignment in `reports/context/coverage.md` for Phase 5/6 sign-offs.

This plan supersedes prior guidance; follow the phased approach above for all restructuring and diagram automation work.

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
2. Move src, public, app/backend/functions into /app (phased)
3. Relocate dev tooling into /tooling subtrees
4. Integrate MCP troubleshooting server telemetry tools (`capture_api_trace`, `compare_campaign_costs`, `predict_campaign_roi`) into diagnostics and automation scripts. Update build scripts, npm scripts, VS Code tasks, and MCP validation collections. All Thunder/Jaeger references are deprecated; use MCP tools and Supabase logs for observability.
5. Regenerate documentation, diagrams, and codebase index to reflect new telemetry flows and validation checkpoints.
6. Validate agent readiness, ZeroFakeData compliance, and operational coverage. Ensure context snapshots and diagnostics outputs are aligned with new folder structure and coverage standards.

## Notes

- Supabase-first architecture and RLS policies must remain intact
- MCP integrations must be updated to new paths
- All changes staged and verified before cutover

## Progress Update (2025-10-23)

- Directory migration completed: all source, dev tools, and integration folders have been moved to their MECE-aligned locations per plan.
- Repo scan automation added (`scripts/docs/repo_scan.sh`); generated summary and domain file trees for diagram refresh.
- No changes to migration plan required; all blockers resolved.
- Next phase: migrate and update documentation files to match new structure and standards, then proceed to automation overhaul (Phase 5).

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
