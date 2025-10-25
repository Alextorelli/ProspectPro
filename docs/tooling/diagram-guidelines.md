# Mermaid Diagram Guidelines

> **Acceptance Criteria**
>
> - **Owner:** Dev Tooling Guild (docs tooling squad)
> - **Success Signals:**
>   - Every committed `.mmd` references a domain pattern from this guide.
>   - Taxonomy preflight links the offending file to the relevant section here.
>   - Snippet anchors (`ZeroFakeData`, `SchemaCheckpoint`) appear in all diagrams flagged “compliance required”.
> - **Dependencies:** `mermaid.config.json`, `snippets/mermaid.json`, `diagram-taxonomy.md`.

## Domain Patterns

| Domain          | Primary Diagram Types                                          | Required Anchors                          | Example Path                               |
| --------------- | -------------------------------------------------------------- | ----------------------------------------- | ------------------------------------------ |
| **Dev Tools**   | Architecture (architecture-beta), ERD, automation flows        | `ZeroFakeData`, `SchemaCheckpoint`        | `docs/diagrams/dev-tools/architecture/`    |
| **App Source**  | State diagrams, sequence flows, navigation mindmaps, API flows | `SchemaCheckpoint` when auth/RLS involved | `docs/diagrams/app-source/state-diagrams/` |
| **Integration** | Deployment, monitoring/observability, security                 | `ZeroFakeData` for data movement          | `docs/diagrams/integration/deployment/`    |

## Snippet Usage

- Pull compliance anchors and reusable shapes from `docs/tooling/snippets/mermaid.json`.
- Extend snippets when new compliance anchors are introduced; update this guide accordingly.

## Authoring Checklist

1. Copy the correct template/snippet for the domain.
2. Insert taxonomy tag comments (see `diagram-taxonomy.md`).
3. Ensure required anchors appear before running generation.
4. Execute `npm run docs:prepare` for lint + preview.
5. Add reciprocal entry in `docs/tooling/end-state/index.md`.

## References

- Styling: `docs/tooling/mermaid.config.json`
- Automation pipeline: `docs/tooling/generation-workflow.md`
- Taxonomy rules: `docs/tooling/diagram-taxonomy.md`
