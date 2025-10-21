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

## Automated Diagram Patch Plan (Preview)

1. **Detect Changes** – During `npm run docs:prepare`, capture the staged `.mmd` files via `git diff --name-only --cached`. Prevent execution if `.vscode/` or `.github/` contain unstaged edits.
2. **Validate Syntax** – Run `npm run docs:render:diagrams` followed by `npm run docs:lint:mermaid` (future script) to surface syntax issues before patching.
3. **Apply Standard Patch** – For each changed diagram, invoke `scripts/docs/patch-diagrams.sh` (to be implemented) which will:
   - Normalize config headers (`%% config: theme: dark, layout: dagre` or approved variants).
   - Inject required validation checkpoints and zero-fake-data guard nodes.
   - Enforce indentation and whitespace style (tabs prohibited).
4. **Regenerate References** – Trigger `npm run docs:update` to refresh cross-file references after patches.
5. **Record Provenance** – Append summary entries to `reports/context/coverage.md` detailing diagrams touched, automation timestamp, and validation output.
6. **Gate CI/CD** – Block merges unless `npm run mcp:chat:validate` and the diagram patch script both exit cleanly. Surface failures via VS Code task `Docs: Prepare`.

> **Implementation Note:** The plan is staged here for governance review. Once approved, add the new script and update `package.json` with a `docs:patch:diagrams` task that chains validation, patching, and regeneration.

---

_Last updated: 2025-10-20_
