# Diagram Generation & Linting Workflow

- Use `docs/scripts/generate-diagrams.sh` to inject config and lint diagrams.
- Supports `--init-config <config.json>` for custom theming.
- Lints with `npx @mermaid-js/mermaid-cli -p`.
- SVG export: set `RENDER_STATIC=true`.
