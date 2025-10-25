> - **Owner:** Dev Tooling Guild → Information Architecture Squad
> - **Success Signals:**
>   - Every diagram listed here links back to its `.mmd` and vice versa.
>   - Index is grouped by domain and kept alphabetically sorted.
>   - Quarterly review confirms no orphaned diagrams.
> - **Dependencies:** `diagram-guidelines.md`, `diagram-taxonomy.md`.

# MECE Diagram Index

> **Acceptance Criteria**
>
> - **Owner:** Dev Tooling Guild → Information Architecture Squad
> - **Success Signals:**
>   - Every diagram listed here links back to its `.mmd` and vice versa.
>   - Index is grouped by domain and kept alphabetically sorted.
>   - Quarterly review confirms no orphaned diagrams.
> - **Dependencies:** `diagram-guidelines.md`, `diagram-taxonomy.md`.

## Pipeline Views (Integration → Dev Tools → App)

| Diagram                                                                                  | Type      | Path                                                       |
| ---------------------------------------------------------------------------------------- | --------- | ---------------------------------------------------------- |
| [Agent Modes & Context Engine](../../diagrams/dev-tools/architecture/agent-modes.mmd)    | Flowchart | `docs/diagrams/dev-tools/architecture/agent-modes.mmd`     |
| [Environment to MCP Tool Map](../../diagrams/dev-tools/architecture/environment-mcp.mmd) | Flowchart | `docs/diagrams/dev-tools/architecture/environment-mcp.mmd` |
| [Discovery & Enrichment Workflow](../../diagrams/dev-tools/architecture/workflow.mmd)    | Flowchart | `docs/diagrams/dev-tools/architecture/workflow.mmd`        |

## Dev Tools (Automation & Observability)

| Diagram                                                                              | Type                  | Path                                                      |
| ------------------------------------------------------------------------------------ | --------------------- | --------------------------------------------------------- |
| [Control Plane Overview](../../diagrams/dev-tools/architecture/control-plane.mmd)    | Architecture (C4-ish) | `docs/diagrams/dev-tools/architecture/control-plane.mmd`  |
| [Automation Pipeline Flow](../../diagrams/dev-tools/automation/pipeline.mmd)         | Flowchart             | `docs/diagrams/dev-tools/automation/pipeline.mmd`         |
| [MCP Server Lifecycle](../../diagrams/dev-tools/sequence/mcp-lifecycle.mmd)          | Sequence              | `docs/diagrams/dev-tools/sequence/mcp-lifecycle.mmd`      |
| [Observability Data Paths](../../diagrams/dev-tools/observability/data-pipeline.mmd) | Sankey / Flow         | `docs/diagrams/dev-tools/observability/data-pipeline.mmd` |
| [Diagram Compliance Map](../../diagrams/dev-tools/navigation/diagram-index.mmd)      | Node-link index       | `docs/diagrams/dev-tools/navigation/diagram-index.mmd`    |

## App Source (Product Experience)

| Diagram                                                                             | Type                   | Path                                                      |
| ----------------------------------------------------------------------------------- | ---------------------- | --------------------------------------------------------- |
| [Frontend Module Tree](../../diagrams/app-source/structure/frontend-modules.mmd)    | Hierarchical / Mindmap | `docs/diagrams/app-source/structure/frontend-modules.mmd` |
| [Authenticated Flow](../../diagrams/app-source/sequence/auth-flow.mmd)              | Sequence               | `docs/diagrams/app-source/sequence/auth-flow.mmd`         |
| [Campaign Lifecycle](../../diagrams/app-source/state/campaign-lifecycle.mmd)        | State machine          | `docs/diagrams/app-source/state/campaign-lifecycle.mmd`   |
| [Edge Function Request Routing](../../diagrams/app-source/flow/request-routing.mmd) | Flowchart              | `docs/diagrams/app-source/flow/request-routing.mmd`       |
| [UI ↔ Edge Function Trace](../../diagrams/app-source/swimlane/ui-edge-trace.mmd)    | Swimlane               | `docs/diagrams/app-source/swimlane/ui-edge-trace.mmd`     |

## Integration (Platform & External Services)

| Diagram                                                                                       | Type                 | Path                                                          |
| --------------------------------------------------------------------------------------------- | -------------------- | ------------------------------------------------------------- |
| [Supabase Infrastructure Stack](../../diagrams/integration/architecture/supabase-stack.mmd)   | Architecture         | `docs/diagrams/integration/architecture/supabase-stack.mmd`   |
| [Third-Party Data Ingestion](../../diagrams/integration/pipelines/data-ingestion.mmd)         | Flowchart            | `docs/diagrams/integration/pipelines/data-ingestion.mmd`      |
| [Deployment Pipeline](../../diagrams/integration/sequence/deployment-pipeline.mmd)            | Sequence             | `docs/diagrams/integration/sequence/deployment-pipeline.mmd`  |
| [Monitoring & Alerting Mesh](../../diagrams/integration/monitoring/alerting-mesh.mmd)         | Architecture / Graph | `docs/diagrams/integration/monitoring/alerting-mesh.mmd`      |
| [Security Boundary Checkpoints](../../diagrams/integration/security/boundary-checkpoints.mmd) | Layered diagram      | `docs/diagrams/integration/security/boundary-checkpoints.mmd` |

---

**Reciprocal linking:** Each `.mmd` file must link back to this index. Use a comment at the top:

```mermaid
%% index: [relative/path/to/docs/tooling/end-state/index.md] %%
```

**Update provenance:** After diagram creation/migration, log in `dev-tools/workspace/context/session_store/coverage.md`.
