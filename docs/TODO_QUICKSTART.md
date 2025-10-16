# Quick Start: TODO List in ProspectPro

This is a quick reference for creating and managing TODO lists in ProspectPro. For detailed instructions, see [TODO_LIST_GUIDE.md](TODO_LIST_GUIDE.md).

## 🚀 Quick Start (30 seconds)

### Create a GitHub Issue with TODO List

1. Go to: https://github.com/Alextorelli/ProspectPro/issues/new
2. Click **"New issue"**
3. Add a title and paste this template:

```markdown
## TODO: [Your Task Name]

### Tasks
- [ ] Step 1: Description
- [ ] Step 2: Description
- [ ] Step 3: Description

### Success Criteria
- [ ] All tasks completed
- [ ] Tests passing
- [ ] Documentation updated
```

4. Click **"Submit new issue"**
5. Done! ✅

## 📝 Common TODO Patterns

### Feature Development
```markdown
- [ ] Plan feature requirements
- [ ] Create Edge Function
- [ ] Update database schema
- [ ] Add frontend UI
- [ ] Write tests
- [ ] Deploy to production
- [ ] Update documentation
```

### Bug Fix
```markdown
- [ ] Reproduce bug locally
- [ ] Identify root cause
- [ ] Implement fix
- [ ] Add regression test
- [ ] Verify in production
- [ ] Update CHANGELOG
```

### Documentation
```markdown
- [ ] Identify documentation gaps
- [ ] Write/update documentation
- [ ] Add code examples
- [ ] Review for accuracy
- [ ] Get peer review
- [ ] Publish updates
```

## 🎯 Where to Put TODOs

| **Type** | **Where** | **When** |
|----------|-----------|----------|
| Feature work | GitHub Issue | Trackable tasks |
| Bug tracking | GitHub Issue | All bugs |
| Code notes | `// TODO:` comments | Quick reminders |
| Project planning | `TODO.md` | High-level tracking |
| PR checklist | PR description | Code review process |

## ✅ Checkbox Syntax

```markdown
- [ ] Not started
- [x] Completed
- [ ] Subtask
  - [x] Sub-subtask (indented with 2 spaces)
```

## 🔗 Linking

```markdown
- [ ] Fix bug (see #123)
- [ ] Implement feature (closes #456)
- [ ] Update docs (related to PR #789)
```

## 📱 Using GitHub CLI

```bash
# Create new issue with TODO
gh issue create --title "Add feature X" --body "- [ ] Task 1\n- [ ] Task 2"

# List your issues
gh issue list --assignee @me

# Update issue
gh issue comment 123 --body "Progress update: completed task 1"
```

## 🎨 Best Practices

1. **Be Specific**: "Add email verification to campaign-export" not "Fix stuff"
2. **Break Down**: Large tasks → smaller subtasks
3. **Link Issues**: Reference related issues and PRs
4. **Update Often**: Check off tasks as you complete them
5. **Set Priorities**: 🔴 Critical, 🟡 High, 🟢 Nice to have

## 📚 More Resources

- **Full Guide**: [TODO_LIST_GUIDE.md](TODO_LIST_GUIDE.md)
- **Project TODO**: [TODO.md](../TODO.md)
- **Contributing**: [.github/CONTRIBUTING.md](../.github/CONTRIBUTING.md)
- **GitHub Issues**: https://github.com/Alextorelli/ProspectPro/issues

## 🔄 Example: Complete TODO for a Small Task

```markdown
## TODO: Add Cost Tracking to Export Function

**Priority**: 🟡 High  
**Assignee**: @developer  
**Labels**: enhancement, backend  

### Context
Users need to see API costs in their export summary.

### Tasks
- [ ] Update `campaign-export-user-aware` function
- [ ] Add cost calculation logic
- [ ] Include costs in CSV export
- [ ] Update export UI to show costs
- [ ] Add tests for cost calculation
- [ ] Deploy to production

### Success Criteria
- [ ] Costs appear in export CSV
- [ ] Calculation matches database records
- [ ] Tests pass with 95% coverage
- [ ] Documentation updated

### Links
- Database schema: `/supabase/schema-sql/001_core_schema.sql`
- Export function: `/supabase/functions/campaign-export-user-aware/`
- Related issue: #234
```

## 💡 Pro Tips

- **Use emojis** for visual organization (🔴🟡🟢✅🚀📝)
- **Add estimates** in task descriptions (e.g., "~2 hours")
- **Set deadlines** in issue milestones
- **Celebrate** by checking off completed tasks! ✨

---

**Ready to create your first TODO?** Go to [GitHub Issues](https://github.com/Alextorelli/ProspectPro/issues/new) and start tracking your work!
