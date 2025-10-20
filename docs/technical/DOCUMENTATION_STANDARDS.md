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

## Diagram Accessibility & Meta Guidelines

- All diagrams must use descriptive node labels (e.g., "Context Store (Redis)", not just "Context Store").
- Add Mermaid accessibility meta-comments to each diagram:
  - `%% accTitle: <Short Title>`
  - `%% accDescr: <1-2 sentence description>`
- Use `%%{init: {"theme": "forest"}}%%` or similar for visual clarity and apply the shared color palette:
  - App: `#2563eb` (blue)
  - Dev-Tools: `#f97316` (orange)
  - Docs: `#16a34a` (green)
  - Config: `#64748b` (slate)
  - Reports: `#facc15` (yellow)
- Prefer subgraphs for logical grouping (e.g., "MCP Fleet", "Context Hub").
- Keep diagrams agent-parseable but human-friendly.

- Automation

- Use generate-diagrams.mjs for differential diagram rendering
- `npm run docs:prepare` validates structure, diagrams, and manifests
- `npm run docs:bootstrap` or VS Code task "Docs: Bootstrap Tooling Diagrams" will force initial render and manifest seeding for new diagrams
- VS Code task: Docs: Refresh Differential Diagrams (runs docs:prepare)
- Keyboard shortcut: `Ctrl+Alt+P` previews Mermaid diagrams in VS Code
