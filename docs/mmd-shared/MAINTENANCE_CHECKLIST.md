# Mermaid Diagram Suite - Maintenance Checklist

## ✅ Daily/Regular Tasks

### Before Creating New Diagrams

- [ ] Review [Enhanced Diagram Standards](./guidelines/enhanced-diagram-standards.md)
- [ ] Check [Icon Registry](./config/icon-registry.json) for semantic icons
- [ ] Verify diagram type matches content (flowchart, erDiagram, etc.)

### After Creating/Editing Diagrams

- [ ] Run `npm run docs:validate` to check YAML frontmatter
- [ ] Preview diagram in VS Code or Mermaid Live Editor
- [ ] Verify accessibility fields (`accTitle`, `accDescr`) are meaningful
- [ ] Check cross-links to related diagrams work

## 🔧 Troubleshooting Workflow

### Syntax Errors

```bash
# 1. Identify the error
npm run docs:validate

# 2. Auto-fix common issues
npm run docs:fix

# 3. Re-validate
npm run docs:validate

# 4. Preview to confirm
# (Use VS Code Mermaid extension)
```

### Missing YAML Frontmatter

```bash
python3 docs/mmd-shared/scripts/add-yaml-frontmatter.py
```

### Duplicate Tags/Headers

```bash
python3 docs/mmd-shared/scripts/fix-all-diagrams.py
```

## 📦 Pre-Commit Checklist

- [ ] All diagrams validate: `npm run docs:validate`
- [ ] No console errors in VS Code Mermaid extension
- [ ] YAML frontmatter complete (all 6 required fields)
- [ ] Diagram renders correctly in preview
- [ ] No duplicate `%%{init:...}` blocks
- [ ] No duplicate diagram type declarations
- [ ] No legacy `%%` comment tags

## 🚀 Pre-Deploy Checklist

- [ ] Run full validation: `npm run docs:validate`
- [ ] Generate diagram index: `npm run docs:prepare`
- [ ] Spot-check critical diagrams for rendering
- [ ] Verify all cross-links resolve
- [ ] Check accessibility compliance (accTitle/accDescr)

## 🔄 Monthly Maintenance

- [ ] Review and update [Enhanced Diagram Standards](./guidelines/enhanced-diagram-standards.md)
- [ ] Update [Icon Registry](./config/icon-registry.json) with new semantic icons
- [ ] Audit diagrams for outdated content
- [ ] Check for broken cross-links
- [ ] Update [Config Index](./config/index.md) with new diagrams

## 📊 Metrics to Track

- Total diagram count: `find docs -name "*.mmd" | wc -l`
- Diagrams passing validation: `npm run docs:validate`
- Diagrams with legacy tags: `grep -r "^%% domain:" docs/**/*.mmd`
- Diagrams missing frontmatter: Check validation output

## 🆘 Emergency Fixes

### All Diagrams Broken

```bash
# Restore from backup or git
git checkout HEAD -- docs/app/diagrams docs/dev-tools/diagrams docs/integration/diagrams

# Re-run migration
npm run docs:fix
npm run docs:validate
```

### Single Diagram Broken

```bash
# Revert single file
git checkout HEAD -- path/to/diagram.mmd

# Re-apply formatting
npm run docs:fix
```

## 📝 Documentation Updates

When adding new diagram types or standards:

1. Update `guidelines/enhanced-diagram-standards.md`
2. Add examples to `guidelines/mermaid-syntax-guide.md`
3. Update `config/icon-registry.json` if new icons needed
4. Document in `README.md`
5. Add validation rules to `scripts/check-tags.mjs` if needed

## 🔗 Quick Links

- [Mermaid Suite README](./README.md)
- [Migration Summary](./MIGRATION_SUMMARY.md)
- [Enhanced Standards](./guidelines/enhanced-diagram-standards.md)
- [Config Index](./config/index.md)
- [Mermaid Docs](https://mermaid.js.org/)

---

**Last Updated:** 2025-01-26  
**Next Review:** 2025-02-26
