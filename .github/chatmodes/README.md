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
