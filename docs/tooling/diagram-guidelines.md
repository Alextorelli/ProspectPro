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

---

_Last updated: 2025-10-20_
