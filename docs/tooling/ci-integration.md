# CI & GitHub Integration for Diagrams

> **Acceptance Criteria**
>
> - **Owner:** Dev Tooling Guild → CI/CD Squad
> - **Success Signals:**
>   - Workflow `docs-validation` executes on PRs touching `docs/**` or `docs/diagrams/**`.
>   - Jobs reuse caches from existing docs workflows (no duplicate installs).
>   - Pipeline fails when lint, taxonomy, or compliance anchors are missing.
> - **Dependencies:** `generation-workflow.md`, `diagram-taxonomy.md`, `.github/actions/*` shared steps.

## Workflow Outline

```yaml
jobs:
	docs-validation:
		needs: docs-build # reuse existing docs build job outputs
		steps:
			- checkout
			- setup-node (cache=docs-build)
			- run: npm run docs:prepare -- --no-preview
			- run: npm run docs:audit
```

## Enforcement

- Fail build on:
  - Mermaid lint errors
  - Missing taxonomy tags/anchors
  - Orphans outside domain folders
- Archive reports to workflow artifacts for review.

## Follow-up

- Add status badge to `docs/tooling/README.md` once workflow is live.
