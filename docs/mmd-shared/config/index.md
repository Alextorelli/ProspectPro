# Mermaid Diagram Suite - Config & Navigation Index

## 📍 Purpose

This index serves as the central navigation hub for all Mermaid diagrams in ProspectPro. All diagrams reference this file in their YAML frontmatter via the `index` field.

## 🗂️ Diagram Inventory

### App Source Diagrams (`docs/app/diagrams/`)

| Diagram | Path | Type |
| ------- | ---- | ---- |
| [API Integration Swimlane](../../app/diagrams/api-integration-swimlane.mmd) | `docs/app/diagrams/api-integration-swimlane.mmd` | flowchart |
| [Application Data Flow](../../app/diagrams/application-data-flow.mmd) | `docs/app/diagrams/application-data-flow.mmd` | flowchart |
| [Application Lifecycle](../../app/diagrams/application-lifecycle.mmd) | `docs/app/diagrams/application-lifecycle.mmd` | stateDiagram-v2 |
| [Application Overview](../../app/diagrams/application-overview.mmd) | `docs/app/diagrams/application-overview.mmd` | flowchart |
| [Auth Flow](../../app/diagrams/auth-flow.mmd) | `docs/app/diagrams/auth-flow.mmd` | sequenceDiagram |
| [Authentication Flow](../../app/diagrams/authentication-flow.mmd) | `docs/app/diagrams/authentication-flow.mmd` | sequenceDiagram |
| [Campaign Lifecycle](../../app/diagrams/campaign-lifecycle.mmd) | `docs/app/diagrams/campaign-lifecycle.mmd` | flowchart |
| [Database Schema](../../app/diagrams/database-schema.mmd) | `docs/app/diagrams/database-schema.mmd` | erDiagram |
| [Frontend Component Hierarchy](../../app/diagrams/frontend-component-hierarchy.mmd) | `docs/app/diagrams/frontend-component-hierarchy.mmd` | mindmap |
| [Frontend Modules](../../app/diagrams/frontend-modules.mmd) | `docs/app/diagrams/frontend-modules.mmd` | mindmap |
| [Prospect Discovery Journey](../../app/diagrams/prospect-discovery-journey.mmd) | `docs/app/diagrams/prospect-discovery-journey.mmd` | flowchart |
| [API Integration Swimlane](../../app/diagrams/ui-edge-trace.mmd) | `docs/app/diagrams/ui-edge-trace.mmd` | flowchart |


### Dev Tools Diagrams (`docs/dev-tools/diagrams/`)

| Diagram | Path | Type |
| ------- | ---- | ---- |
| [Db Architecture](../../dev-tools/diagrams/architecture/DB_Architecture.mmd) | `docs/dev-tools/diagrams/architecture/DB_Architecture.mmd` | erDiagram |
| [Agent Modes](../../dev-tools/diagrams/architecture/agent-modes.mmd) | `docs/dev-tools/diagrams/architecture/agent-modes.mmd` | flowchart |
| [Control Plane](../../dev-tools/diagrams/architecture/control-plane.mmd) | `docs/dev-tools/diagrams/architecture/control-plane.mmd` | graph |
| [Environment Mcp](../../dev-tools/diagrams/architecture/environment-mcp.mmd) | `docs/dev-tools/diagrams/architecture/environment-mcp.mmd` | flowchart |
| [Workflow](../../dev-tools/diagrams/architecture/workflow.mmd) | `docs/dev-tools/diagrams/architecture/workflow.mmd` | flowchart |
| [Pipeline](../../dev-tools/diagrams/automation/pipeline.mmd) | `docs/dev-tools/diagrams/automation/pipeline.mmd` | flowchart |
| [Example Dev Tools](../../dev-tools/diagrams/example-dev-tools.mmd) | `docs/dev-tools/diagrams/example-dev-tools.mmd` | graph |
| [Diagram Index](../../dev-tools/diagrams/navigation/diagram-index.mmd) | `docs/dev-tools/diagrams/navigation/diagram-index.mmd` | graph |
| [Data Pipeline Flowchart](../../dev-tools/diagrams/observability/data-pipeline.mmd) | `docs/dev-tools/diagrams/observability/data-pipeline.mmd` | flowchart |
| [Core Edge Function Sequence](../../dev-tools/diagrams/sequence/core-edge-function-sequence.mmd) | `docs/dev-tools/diagrams/sequence/core-edge-function-sequence.mmd` | sequenceDiagram |
| [Mcp Lifecycle](../../dev-tools/diagrams/sequence/mcp-lifecycle.mmd) | `docs/dev-tools/diagrams/sequence/mcp-lifecycle.mmd` | sequenceDiagram |


### Integration Diagrams (`docs/integration/diagrams/`)

| Diagram | Path | Type |
| ------- | ---- | ---- |
| [Supabase Stack](../../integration/diagrams/architecture/supabase-stack.mmd) | `docs/integration/diagrams/architecture/supabase-stack.mmd` | flowchart |
| [Example Integration](../../integration/diagrams/example-integration.mmd) | `docs/integration/diagrams/example-integration.mmd` | graph |
| [Alerting Mesh](../../integration/diagrams/monitoring/alerting-mesh.mmd) | `docs/integration/diagrams/monitoring/alerting-mesh.mmd` | graph |
| [Package Dependencies](../../integration/diagrams/package-dependencies.mmd) | `docs/integration/diagrams/package-dependencies.mmd` | flowchart |
| [Data Ingestion](../../integration/diagrams/pipelines/data-ingestion.mmd) | `docs/integration/diagrams/pipelines/data-ingestion.mmd` | flowchart |
| [Boundary Checkpoints](../../integration/diagrams/security/boundary-checkpoints.mmd) | `docs/integration/diagrams/security/boundary-checkpoints.mmd` | flowchart |
| [Deployment Pipeline](../../integration/diagrams/sequence/deployment-pipeline.mmd) | `docs/integration/diagrams/sequence/deployment-pipeline.mmd` | sequenceDiagram |


### Legacy Diagrams (`docs/diagrams/`)

> **Note:** These appear to be duplicates or legacy diagrams. Consider consolidating with the domain-specific folders above.

*No diagrams in this category*


## 📊 Summary Statistics

- **Total Diagrams:** 30
- **App Source:** 12
- **Dev Tools:** 11
- **Integration:** 7
- **Legacy/Duplicate:** 0

## ⚠️ Cleanup Recommendations

✅ No cleanup needed. All diagrams are in their proper domain folders.

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
