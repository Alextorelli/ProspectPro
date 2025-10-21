# Diagram Guidelines for ProspectPro

> **Configuration Guard:** All changes to `.vscode/` and `.github/` must be staged and approved via `docs/tooling/settings-staging.md`. Do not edit these directories directly during refactors or automation.

## Prompts & Snippet Reuse

- Use snippet blocks from `docs/tooling/snippets/mermaid.json` for all common nodes (e.g., ContextManager, ZeroFakeData, architecture-beta skeleton).
- For sequence diagrams, use the `sequenceParticipant` snippet for each participant.
- For validation, always include the `validationCheckpointBlock` snippet.

## Plugin & CLI Workflow

- Author or edit diagrams in `.mmd` files with YAML front-matter.
- Preview diagrams in VS Code using the Mermaid Chart extension.
- Run `npm run docs:render:diagrams` to render all diagrams via CLI.
- Run `npm run docs:prepare` to update the diagram manifest.
- Run `npm run docs:update` to refresh documentation references.
- Run `npm run lint` to validate diagram and markdown syntax.

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

1. **Detect Changes** – `scripts/docs/patch-diagrams.sh` (invoked by `npm run docs:render:diagrams` and available via `npm run docs:patch:diagrams`) identifies modified `.mmd` files using `git diff --name-only HEAD -- '*.mmd'` and enforces `.vscode/` / `.github/` guardrails.
2. **Normalize Config** – Each changed diagram gains a `%% config: theme: dark` header (respecting YAML front matter) if missing, and tabs are converted to spaces for consistent linting.
3. **Compliance Warning** – Diagrams without explicit `ZeroFakeData` references emit a warning to stderr for manual follow-up.
4. **Regenerate References** – Run `npm run docs:prepare` to call the patch script, skip SVG rendering, and regenerate documentation references.
5. **Record Provenance** – Document diagram-touching workstreams in `reports/context/coverage.md` or linked runbooks to maintain auditability.
6. **CI/CD Enforcement (Next)** – Extend pipelines to require `npm run docs:patch:diagrams` and `npm run mcp:chat:validate` before merges; integrate with VS Code task "Docs: Prepare".

---

_Last updated: 2025-10-20_
