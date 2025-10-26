# Mermaid Shared Config Index

This index documents the shared configuration, theming, and standards for all diagrams in the ProspectPro workspace.

## Config Files

- [mermaid.config.json](mermaid.config.json): Theme, palette, and renderer options
- [icon-registry.json](icon-registry.json): Emoji/icon mapping for semantic nodes
- [enhanced-diagram-standards.md](../guidelines/enhanced-diagram-standards.md): Frontmatter, shapes, chaining, and validation
- [navigation-index.md](../navigation-index.md): Canonical navigation and chaining map

## Usage

- All diagrams must include the frontmatter block as shown in the standards.
- Use only shapes, classDefs, and icons defined in the config.
- Validate diagrams with `npm run docs:prepare` before merging.

## Chaining & Navigation

- Use `click` statements and reciprocal links for cross-diagram navigation.
- Reference this index in all diagram frontmatter for traceability.

---

For questions, see [enhanced-diagram-standards.md](../guidelines/enhanced-diagram-standards.md).
| [boundary checkpoints](docs/diagrams/integration/security/boundary-checkpoints.mmd) | `docs/diagrams/integration/security/boundary-checkpoints.mmd` |

| [deployment pipeline](docs/diagrams/integration/sequence/deployment-pipeline.mmd) | `docs/diagrams/integration/sequence/deployment-pipeline.mmd` |
