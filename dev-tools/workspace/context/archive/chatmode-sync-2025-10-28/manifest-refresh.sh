#!/bin/bash
set -e

REPO_ROOT="/workspaces/ProspectPro"
CHATMODES_DIR="$REPO_ROOT/.github/chatmodes"
MANIFEST="$CHATMODES_DIR/chatmode-manifest.json"
README="$CHATMODES_DIR/README.md"

echo "=== Refreshing Chatmode Manifest & README ==="

# Rebuild manifest with new npm scripts
cat > "$MANIFEST" << 'EOF'
{
  "version": "2.0.0",
  "chatmodes": [
    {
      "id": "development-workflow",
      "name": "Development Workflow",
      "file": "Development Workflow.chatmode.md",
      "workflows": [
        "dev-tools/agents/workflows/development-workflow.instructions.md",
        "dev-tools/agents/workflows/development-workflow.toolset.jsonc"
      ]
    },
    {
      "id": "production-ops",
      "name": "Production Ops",
      "file": "Production Ops.chatmode.md",
      "workflows": [
        "dev-tools/agents/workflows/production-ops.instructions.md",
        "dev-tools/agents/workflows/production-ops.toolset.jsonc"
      ]
    },
    {
      "id": "observability",
      "name": "Observability",
      "file": "Observability.chatmode.md",
      "workflows": [
        "dev-tools/agents/workflows/observability.instructions.md",
        "dev-tools/agents/workflows/observability.toolset.jsonc"
      ]
    },
    {
      "id": "system-architect",
      "name": "System Architect",
      "file": "System Architect.chatmode.md",
      "workflows": [
        "dev-tools/agents/workflows/system-architect.instructions.md",
        "dev-tools/agents/workflows/system-architect.toolset.jsonc"
      ]
    }
  ],
  "deployment": {
    "scripts": {
      "env:pull": "Sync Vercel environment variables",
      "deploy:preview": "Deploy preview build to Vercel",
      "deploy:staging:alias": "Alias preview to staging subdomain",
      "deploy:prod": "Full production deployment with validation"
    },
    "staging": {
      "domain": "staging.prospectpro.appsmithery.co",
      "workflow": "Preview deploy + alias via npm scripts"
    }
  }
}
EOF

# Rebuild README summary
cat > "$README" << 'EOF'
# Custom Agent Chat Modes

## Available Modes

| Mode | File | Workflows |
|------|------|-----------|
| Development Workflow | `Development Workflow.chatmode.md` | `development-workflow.{instructions,toolset}` |
| Production Ops | `Production Ops.chatmode.md` | `production-ops.{instructions,toolset}` |
| Observability | `Observability.chatmode.md` | `observability.{instructions,toolset}` |
| System Architect | `System Architect.chatmode.md` | `system-architect.{instructions,toolset}` |

## Deployment Scripts

- `npm run env:pull` - Sync Vercel environment variables
- `npm run deploy:preview` - Deploy preview build
- `npm run deploy:staging:alias` - Alias to staging subdomain
- `npm run deploy:prod` - Full production deployment

## Staging Workflow

1. Deploy preview: `npm run deploy:preview`
2. Get preview URL from output
3. Alias to staging: `npm run deploy:staging:alias`

See `chatmode-manifest.json` for full configuration.
EOF

echo "=== Manifest & README Refresh Complete ==="