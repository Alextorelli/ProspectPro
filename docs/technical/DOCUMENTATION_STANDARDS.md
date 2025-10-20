# Documentation Standards (ProspectPro)

## Tiered Content

1. FAST_README.md per domain (≤1 screen, links to deep dives)
2. Detail sheets in docs/app/** or docs/tooling/**
3. Diagrams: All .mmd/.mermaid sources live in docs/diagrams/{app,tooling}/. Tooling diagrams must be referenced from docs/tooling/FAST_README.md. Rendered SVGs are cached in .docs-cache and ignored by git.
4. Auto-generated manifest (.docs-cache/manifest.json) tracks hashes for all diagram sources.

## Structure

- app/: frontend, Supabase functions, data models
- docs/tooling/: MCP, scripts, CI
- docs/diagrams/{app,tooling}/: diagrams only, no rendered assets; sources only
- .docs-cache/: cached SVGs and manifest (not committed)

## Change Control

- PRs touching app/** or dev-tools/** must update FAST_README and relevant .mmd/.mermaid files
- Checklist enforced in PR template
- Diagrams must be bootstrapped with the VS Code task or npm run docs:bootstrap on first add

## Automation

- Use generate-diagrams.mjs for differential diagram rendering
- npm run docs:prepare validates structure, diagrams, and manifests
- npm run docs:bootstrap or VS Code task "Docs: Bootstrap Tooling Diagrams" will force initial render and manifest seeding for new diagrams
- VS Code task: Docs: Refresh Differential Diagrams (runs docs:prepare)
