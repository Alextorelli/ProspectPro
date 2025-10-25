# Diagram Generation & Linting Workflow

> **Acceptance Criteria**
>
> - **Owner:** Dev Tooling Guild → Automation Subteam
> - **Success Signals:**
>   - `npm run docs:prepare` invokes the unified script and fails on lint/taxonomy errors.
>   - CI job `docs-validation` reuses the same pipeline with zero drift.
>   - SVG exports are produced only when `RENDER_STATIC=true` is set (local or CI toggle).
> - **Dependencies:** `docs/shared/mermaid/config/mermaid.config.json`, `diagram-taxonomy.md`, `.github/workflows/docs-validation.yml`.

## Script Responsibilities

1. Inject `docs/shared/mermaid/config/mermaid.config.json` into every `.mmd` (unless overridden via `--init-config`).
2. Run syntax lint with `npx @mermaid-js/mermaid-cli -p <file>`; aggregate failures.
3. Optionally render SVG when `RENDER_STATIC=true` or `--render` flag supplied.
4. Emit taxonomy report via helper (see `diagram-taxonomy.md`).

## Usage

```bash
# Standard generation + lint
docs/scripts/generate-diagrams.sh

# Custom config + SVG export
RENDER_STATIC=true docs/scripts/generate-diagrams.sh --init-config docs/shared/mermaid/config/mermaid.config.json
```

## Integration Points

- `npm run docs:prepare` → calls script, opens Mermaid preview.
- CI workflow `docs-validation` → ensures lint + taxonomy pass before merge.
- MCP tooling (`diagram_patch`) → may call script post-normalization.

## Failure Handling

- Script exits non-zero on lint failure, missing anchors, or taxonomy violations.
- Generated SVGs written alongside `.mmd` (same base name). Clean-up handled by gitignore or future automation.
