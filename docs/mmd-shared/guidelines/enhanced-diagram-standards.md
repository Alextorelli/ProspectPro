# Enhanced Diagram Standards & Guidelines

## Frontmatter Template

```
---
accTitle: <Diagram Accessible Title>
accDescr: <Short description>
domain: <domain>
type: <flowchart|sequenceDiagram|stateDiagram-v2|erDiagram|mindmap|c4>
title: <Diagram Title>
index: ../../../../mmd-shared/config/index.md
---
```

## Shape Catalog

- Rectangle: `[Node]` or `([Node])`
- Rounded: `([Node])`
- Circle: `((Node))`
- Diamond: `{Node}` or `{{Node}}`
- Parallelogram: `[/Node/]`
- Subroutine: `[[Node]]`
- Hexagon: `{{Node}}`
- Stadium: `([Node])`
- Cylinder: `[(Node)]`
- Cloud: `((Node))`
- Note: `>Note]` or `Note<`

## Emoji & Icon Guidance

- Use icons from `icon-registry.json` for semantic clarity.
- Place emoji in node labels for quick scanning.

## Chaining Protocol

- Use `click` statements to link diagrams.
- Add `parent`/`children` comments for navigation.
- Use reciprocal links in frontmatter.

## Validation Checklist

- All diagrams must have full frontmatter.
- Use only supported shapes and classDefs from config.
- Validate with `npm run docs:prepare`.
- Cross-link diagrams using navigation index.

---

For more, see [navigation-index.md](../navigation-index.md) and [icon-registry.json](../config/icon-registry.json).
