# Diagram Guidelines for ProspectPro

**Configuration Guard:** All changes to `.vscode/` and `.github/` must be staged and approved via [`../config/settings-staging.md`](../config/settings-staging.md). Do not edit these directories directly during refactors or automation.

## Centralized Mermaid Configuration

- All diagrams must use the shared config in [`../config/mermaid.config.json`](../config/mermaid.config.json) for theme, palette, typography, and padding.
- Use `%%{init: { 'theme': 'dark', 'themeVariables': {...}, 'flowchart': { 'defaultRenderer': 'elk', 'elk': { 'elk.algorithm': 'layered', 'elk.spacing.nodeNode': 40 } } }}%%` at the top of each diagram, referencing the config file for palette and style.
- Use only grayscale/dark theme colors; do not use per-domain or colored subgraph backgrounds. All diagrams should be visually neutral and accessible.
- For layout, use ELK (`elk.algorithm: layered`) for all flowcharts and ensure diagrams are aligned symmetrically (vertical or horizontal as appropriate). Set `elk.direction` to match the intended axis.

## Compliance Anchors

- Every diagram must include:
  - Validation checkpoint block (schema, session, diagnostics)
- Use snippet blocks from [`../config/mermaid.json`](../config/mermaid.json) for common nodes and compliance anchors.

## Prompts & Snippet Reuse

- Use snippet blocks from [`../config/mermaid.json`](../config/mermaid.json) for all common nodes (e.g., ContextManager, ZeroFakeData, architecture-beta skeleton).
- For sequence diagrams, use the `sequenceParticipant` snippet for each participant.
- For validation, always include the `validationCheckpointBlock` snippet.

## Plugin & CLI Workflow

- Author or edit diagrams in `.mmd` files with YAML front-matter.
- Preview diagrams in VS Code using the Mermaid Chart extension.
- Run `npm run docs:prepare` to lint diagrams and refresh documentation references.
- Run `npm run docs:update` to refresh documentation references.
- Run `npm run lint` to validate diagram-associated markdown syntax.

## Validation Checkpoints

- Every diagram must include a validation checkpoint block for schema, session, and diagnostics.
- Zero-fake-data constraints must be explicitly called out in ER diagrams and context flows.

## Zero-Fake-Data Enforcement

- All contact/email nodes must reference real, verified data sources.
- Use the ZeroFakeData snippet for any validation or enrichment step.
- Document constraints in both diagram context and ERD attributes.

## Consistency & Changelog

- Use stable node IDs and script/function path references for all nodes.
- Note all diagram changes in the changelog, referencing snippet usage for traceability.

## Automated Diagram Patch Workflow

1. **Detect Changes** – [`../scripts/generate-diagrams.mjs`](../scripts/generate-diagrams.mjs) (invoked by `npm run docs:prepare`) identifies modified `.mmd` files using the tracked manifest and enforces `.vscode/` / `.github/` guardrails.
2. **Normalize Config** – Each changed diagram gains a `%%{init: { 'theme': 'dark', 'themeVariables': {...}, 'flowchart': { 'defaultRenderer': 'elk', 'elk': { 'elk.algorithm': 'layered', 'elk.spacing.nodeNode': 40 } } }}%%` header (from config file) if missing, and tabs are converted to spaces for consistent linting.
3. **Compliance Warning** – Diagrams without explicit `ZeroFakeData` references emit a warning to stderr for manual follow-up.
4. **Regenerate References** – Run `npm run docs:prepare` to call the bundle script, skip SVG rendering, and regenerate documentation references.
5. **Record Provenance** – Document diagram-touching workstreams in `dev-tools/context/session_store/coverage.md` or linked runbooks to maintain auditability.
6. **CI/CD Enforcement (Next)** – Extend pipelines to require `npm run docs:prepare` and `npm run mcp:chat:validate` before merges; integrate with the VS Code task "Docs: Prepare".

---

_Last updated: 2025-10-25_
