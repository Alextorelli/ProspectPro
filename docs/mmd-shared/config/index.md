# Mermaid Diagram Suite - Config & Navigation Index

## 📍 Purpose

This index serves as the central navigation hub for all Mermaid diagrams in ProspectPro. All diagrams reference this file in their YAML frontmatter via the `index` field.

## 🗂️ Diagram Inventory

### App Source Diagrams (`docs/app/diagrams/`)

| Diagram                                                                             | Path                                                 | Type            |
| ----------------------------------------------------------------------------------- | ---------------------------------------------------- | --------------- |
| [API Integration Swimlane](../../app/diagrams/api-integration-swimlane.mmd)         | `docs/app/diagrams/api-integration-swimlane.mmd`     | flowchart       |
| [Application Data Flow](../../app/diagrams/application-data-flow.mmd)               | `docs/app/diagrams/application-data-flow.mmd`        | flowchart       |
| [Application Lifecycle](../../app/diagrams/application-lifecycle.mmd)               | `docs/app/diagrams/application-lifecycle.mmd`        | stateDiagram-v2 |
| [Application Overview](../../app/diagrams/application-overview.mmd)                 | `docs/app/diagrams/application-overview.mmd`         | flowchart       |
| [Auth Flow](../../app/diagrams/auth-flow.mmd)                                       | `docs/app/diagrams/auth-flow.mmd`                    | sequenceDiagram |
| [Authentication Flow](../../app/diagrams/authentication-flow.mmd)                   | `docs/app/diagrams/authentication-flow.mmd`          | sequenceDiagram |
| [Campaign Lifecycle](../../app/diagrams/campaign-lifecycle.mmd)                     | `docs/app/diagrams/campaign-lifecycle.mmd`           | flowchart       |
| [Database Schema](../../app/diagrams/database-schema.mmd)                           | `docs/app/diagrams/database-schema.mmd`              | erDiagram       |
| [Frontend Component Hierarchy](../../app/diagrams/frontend-component-hierarchy.mmd) | `docs/app/diagrams/frontend-component-hierarchy.mmd` | mindmap         |
| [Frontend Modules](../../app/diagrams/frontend-modules.mmd)                         | `docs/app/diagrams/frontend-modules.mmd`             | mindmap         |
| [Prospect Discovery Journey](../../app/diagrams/prospect-discovery-journey.mmd)     | `docs/app/diagrams/prospect-discovery-journey.mmd`   | flowchart       |
| [API Integration Swimlane](../../app/diagrams/ui-edge-trace.mmd)                    | `docs/app/diagrams/ui-edge-trace.mmd`                | flowchart       |

### Dev Tools Diagrams (`docs/dev-tools/diagrams/`)

| Diagram                                                                                          | Path                                                               | Type            |
| ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------ | --------------- |
| [Db Architecture](../../dev-tools/diagrams/architecture/DB_Architecture.mmd)                     | `docs/dev-tools/diagrams/architecture/DB_Architecture.mmd`         | erDiagram       |
| [Agent Modes](../../dev-tools/diagrams/architecture/agent-modes.mmd)                             | `docs/dev-tools/diagrams/architecture/agent-modes.mmd`             | flowchart       |
| [Control Plane](../../dev-tools/diagrams/architecture/control-plane.mmd)                         | `docs/dev-tools/diagrams/architecture/control-plane.mmd`           | graph           |
| [Environment Mcp](../../dev-tools/diagrams/architecture/environment-mcp.mmd)                     | `docs/dev-tools/diagrams/architecture/environment-mcp.mmd`         | flowchart       |
| [Workflow](../../dev-tools/diagrams/architecture/workflow.mmd)                                   | `docs/dev-tools/diagrams/architecture/workflow.mmd`                | flowchart       |
| [Example Dev Tools](../../dev-tools/diagrams/example-dev-tools.mmd)                              | `docs/dev-tools/diagrams/example-dev-tools.mmd`                    | graph           |
| [Core Edge Function Sequence](../../dev-tools/diagrams/sequence/core-edge-function-sequence.mmd) | `docs/dev-tools/diagrams/sequence/core-edge-function-sequence.mmd` | sequenceDiagram |

### Integration Diagrams (`docs/integration/diagrams/`)

| Diagram                                                                     | Path                                                 | Type      |
| --------------------------------------------------------------------------- | ---------------------------------------------------- | --------- |
| [Example Integration](../../integration/diagrams/example-integration.mmd)   | `docs/integration/diagrams/example-integration.mmd`  | graph     |
| [Package Dependencies](../../integration/diagrams/package-dependencies.mmd) | `docs/integration/diagrams/package-dependencies.mmd` | flowchart |

### Legacy Diagrams (`docs/diagrams/`)

> **Note:** These appear to be duplicates or legacy diagrams. Consider consolidating with the domain-specific folders above.

| Diagram                                                                              | Path                                                          | Type            |
| ------------------------------------------------------------------------------------ | ------------------------------------------------------------- | --------------- |
| [Agent Modes](../../diagrams/dev-tools/architecture/agent-modes.mmd)                 | `docs/diagrams/dev-tools/architecture/agent-modes.mmd`        | flowchart       |
| [Control Plane](../../diagrams/dev-tools/architecture/control-plane.mmd)             | `docs/diagrams/dev-tools/architecture/control-plane.mmd`      | graph           |
| [Environment Mcp](../../diagrams/dev-tools/architecture/environment-mcp.mmd)         | `docs/diagrams/dev-tools/architecture/environment-mcp.mmd`    | flowchart       |
| [Workflow](../../diagrams/dev-tools/architecture/workflow.mmd)                       | `docs/diagrams/dev-tools/architecture/workflow.mmd`           | flowchart       |
| [Pipeline](../../diagrams/dev-tools/automation/pipeline.mmd)                         | `docs/diagrams/dev-tools/automation/pipeline.mmd`             | flowchart       |
| [Diagram Index](../../diagrams/dev-tools/navigation/diagram-index.mmd)               | `docs/diagrams/dev-tools/navigation/diagram-index.mmd`        | graph           |
| [Data Pipeline Flowchart](../../diagrams/dev-tools/observability/data-pipeline.mmd)  | `docs/diagrams/dev-tools/observability/data-pipeline.mmd`     | flowchart       |
| [Mcp Lifecycle](../../diagrams/dev-tools/sequence/mcp-lifecycle.mmd)                 | `docs/diagrams/dev-tools/sequence/mcp-lifecycle.mmd`          | sequenceDiagram |
| [Supabase Stack](../../diagrams/integration/architecture/supabase-stack.mmd)         | `docs/diagrams/integration/architecture/supabase-stack.mmd`   | flowchart       |
| [Alerting Mesh](../../diagrams/integration/monitoring/alerting-mesh.mmd)             | `docs/diagrams/integration/monitoring/alerting-mesh.mmd`      | graph           |
| [Data Ingestion](../../diagrams/integration/pipelines/data-ingestion.mmd)            | `docs/diagrams/integration/pipelines/data-ingestion.mmd`      | flowchart       |
| [Boundary Checkpoints](../../diagrams/integration/security/boundary-checkpoints.mmd) | `docs/diagrams/integration/security/boundary-checkpoints.mmd` | flowchart       |
| [Deployment Pipeline](../../diagrams/integration/sequence/deployment-pipeline.mmd)   | `docs/diagrams/integration/sequence/deployment-pipeline.mmd`  | sequenceDiagram |

## 📊 Summary Statistics

- **Total Diagrams:** 34
- **App Source:** 12
- **Dev Tools:** 7
- **Integration:** 2
- **Legacy/Duplicate:** 13

## ⚠️ Cleanup Recommendations

The `docs/diagrams/` folder contains diagrams that may be duplicates:

**Recommended Actions:**

1. Review legacy diagrams for duplicates
2. Consolidate to domain-specific folders (`docs/app/diagrams/`, `docs/dev-tools/diagrams/`, `docs/integration/diagrams/`)
3. Update all references in documentation
4. Remove the legacy `docs/diagrams/` folder after consolidation

## 🔧 Configuration Files

- [Mermaid Config](./mermaid.config.json) - Theme, layout, and rendering settings
- [Icon Registry](./icon-registry.json) - Semantic emoji/icon mapping
- [Puppeteer Config](./puppeteer.config.json) - Browser automation settings

## 📚 Documentation

- [Enhanced Diagram Standards](../guidelines/enhanced-diagram-standards.md)
- [Mermaid Syntax Guide](../guidelines/mermaid-syntax-guide.md)
- [Suite README](../README.md)
- [Migration Summary](../MIGRATION_SUMMARY.md)
- [Maintenance Checklist](../MAINTENANCE_CHECKLIST.md)

## 🚀 Quick Actions

- **Validate all diagrams:** `npm run docs:validate`
- **Fix formatting issues:** `npm run docs:fix`
- **Generate new diagrams:** `bash docs/mmd-shared/scripts/scaffold-diagrams.sh`
- **Regenerate this index:** `python3 docs/mmd-shared/scripts/generate-index.py`

---

**Last Updated:** 2025-10-26  
**Maintained by:** ProspectPro DevTools Team  
**Auto-generated:** This file is generated from actual .mmd files. Do not edit manually.
