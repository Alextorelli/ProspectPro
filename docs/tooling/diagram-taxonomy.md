# Diagram Taxonomy & Reporting

> **Acceptance Criteria**
>
> - **Owner:** Dev Tooling Guild → Documentation QA
> - **Success Signals:**
>   - 100% of diagrams contain a domain tag comment in the first five lines.
>   - Preflight report lists zero “missing taxonomy” items on green-path builds.
>   - Compliance anchors (`ZeroFakeData`, `SchemaCheckpoint`) are surfaced in the audit when absent.
> - **Dependencies:** `diagram-guidelines.md`, `generation-workflow.md`, `docs/shared/mermaid/config/mermaid.json`.

## Tag Syntax

Insert both domain and compliance anchors at the top of each `.mmd` file:

```mermaid
%% domain:dev-tools %%
%% anchors: ZeroFakeData, SchemaCheckpoint %%
```

- **domain:** `dev-tools`, `app-source`, or `integration`.
- **anchors:** comma-separated list; must include required anchors per domain (see guidelines).

## Preflight Report

- Script outputs a markdown table summarizing:
  - Missing domain tag
  - Missing anchors
  - Unknown domain keyword
- On success, `MermaidChart.openPreview` launches automatically during `npm run docs:prepare`.

## Enforcement Rules

1. Tag comment must appear before any Mermaid directives (`%%{init:...`).
2. Domain keyword must match folder location; mismatch raises an error.
3. Anchors listed must exist in `docs/shared/mermaid/config/mermaid.json`; unknown anchors trigger warnings.
4. Reports are archived under `dev-tools/reports/diagram-taxonomy/` (future enhancement).
