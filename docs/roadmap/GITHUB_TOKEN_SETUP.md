# GitHub Project Automation - Token Setup Guide

## Overview

ProspectPro's roadmap automation suite requires a GitHub Personal Access Token (PAT) with **project** scope to interact with GitHub Projects v2. The default `GITHUB_TOKEN` provided by Codespaces lacks this permission.

## Quick Setup

### 1. Generate Project-Scoped PAT

**Fine-Grained Token (Recommended)**:

1. Visit https://github.com/settings/tokens?type=beta
2. Click **"Generate new token"**
3. Configure:
   - **Token name**: `ProspectPro Roadmap Automation`
   - **Expiration**: 90 days (or custom)
   - **Repository access**: Select `Alextorelli/ProspectPro` only
   - **Repository permissions**:
     - Issues: Read and write
     - Contents: Read-only
   - **Account permissions** (scroll down):
     - **Projects**: Read and write ← **CRITICAL**
4. Generate and copy token (starts with `github_pat_`)

**Classic Token (Alternative)**:

1. Visit https://github.com/settings/tokens
2. Click **"Generate new token (classic)"**
3. Select scopes:
   - ✅ `repo` (Full repository access)
   - ✅ `project` (Full project access)
4. Generate and copy token (starts with `ghp_`)

### 2. Configure in Codespaces

**Option A: Current Session (Temporary)**

```bash
export GH_PROJECT_TOKEN="github_pat_YOUR_TOKEN_HERE"
```

**Option B: Persistent Across Sessions**

```bash
# Add to ~/.bashrc
echo 'export GH_PROJECT_TOKEN="github_pat_YOUR_TOKEN"' >> ~/.bashrc
source ~/.bashrc
```

**Option C: Codespaces Secret (Recommended)**

1. Go to https://github.com/settings/codespaces
2. Under **"Codespaces secrets"** → **"New secret"**
3. Name: `GH_PROJECT_TOKEN`
4. Value: Your PAT
5. Repository access: Select `ProspectPro`
6. Restart Codespace for changes to take effect

### 3. Verify Setup

```bash
# Check token is available
echo $GH_PROJECT_TOKEN

# Verify gh CLI can access projects
gh project list --owner Alextorelli

# Expected output: List of projects including "ProspectPro Roadmap"
```

## Affected Workflows

The following scripts/tasks require `GH_PROJECT_TOKEN`:

### VS Code Tasks

- **🗂️ Batch Generate Epics + Project** - Creates epics and adds to Project 5
- **📋 Roadmap: Pull Open Items** - Fetches Project 5 status
- **Roadmap: Sync Epics to GitHub** - Creates issues and links to project

### npm Scripts

```bash
npm run roadmap:batch -- --project  # Requires GH_PROJECT_TOKEN
npm run roadmap:pull                # Requires GH_PROJECT_TOKEN
```

### Direct Scripts

```bash
bash scripts/roadmap/sync-epics-to-github.sh  # Requires GH_PROJECT_TOKEN
bash scripts/seed-roadmap.sh                  # Requires GH_PROJECT_TOKEN
node scripts/roadmap-batch.js --project       # Requires GH_PROJECT_TOKEN
node scripts/roadmap-pull.js                  # Requires GH_PROJECT_TOKEN
```

## Token Precedence

All scripts follow this token resolution order:

1. `GH_PROJECT_TOKEN` (project-scoped PAT) - **Preferred**
2. `GITHUB_TOKEN` (Codespaces default) - Fallback (lacks project scope)

## Troubleshooting

### Error: "Resource not accessible by integration"

**Cause**: Token lacks `project` scope

**Solution**:

1. Generate new PAT with project permissions (see setup above)
2. Set `GH_PROJECT_TOKEN` environment variable
3. Retry command

### Error: "No GitHub token found"

**Cause**: Neither `GH_PROJECT_TOKEN` nor `GITHUB_TOKEN` is set

**Solution**:

```bash
export GH_PROJECT_TOKEN="github_pat_YOUR_TOKEN"
```

### Error: "GitHub CLI not authenticated"

**Cause**: `gh` CLI can't use the token

**Solution**:

```bash
# Authenticate gh CLI with your token
gh auth login --with-token <<< "$GH_PROJECT_TOKEN"

# Verify
gh auth status
```

### Token Shows in Codespaces but Scripts Fail

**Cause**: Terminal session started before secret was added

**Solution**:

```bash
# Reload environment
source ~/.bashrc

# Or restart terminal/Codespace
```

## Security Best Practices

- ✅ Use **fine-grained tokens** with minimal scope (single repo, project only)
- ✅ Set **90-day expiration** and rotate regularly
- ✅ Store in **Codespaces secrets** (never commit to repo)
- ❌ Never share tokens or commit to version control
- ❌ Don't use classic tokens with excessive scopes (`admin:org`, etc.)

## Additional Resources

- [GitHub PAT Documentation](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token)
- [Codespaces Secrets Guide](https://docs.github.com/en/codespaces/managing-your-codespaces/managing-encrypted-secrets-for-your-codespaces)
- [GitHub Projects v2 API](https://docs.github.com/en/issues/planning-and-tracking-with-projects/automating-your-project/using-the-api-to-manage-projects)
