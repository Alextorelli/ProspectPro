# MCP Configuration Refactor Scaffolding (Option A Alignment)

_Last updated: 2025-10-22_

## Three-Environment MCP Model

- **Development**: Shared dev infra, relaxed security, rapid iteration
- **Production**: Strict security, monitoring, live user traffic
- **Troubleshooting**: Observability, diagnostics, compliance, incident response

All MCP configs and registry entries now reference this model. See `config/mcp-config.v2.json` for source-of-truth.

## Purpose

This document scaffolds the rewrite of `config/mcp-config.json` so the MCP server topology mirrors the consolidated participant taxonomy (`@ux`, `@platform`, `@devops`, `@secops`, optional `@integrations`) and the environment-aware routing defined in `devops-environment-taxonomy.md`.

## Target Structure

```jsonc
{
  "version": "2.0",
  "description": "ProspectPro MCP Configuration aligned with Option A participants",
  "clusters": {
    "development": {
      "environments": ["sandbox", "development"],
      "participants": ["ux", "platform", "devops"],
      "servers": ["dev-chrome", "dev-supabase", "dev-postgres", "dev-ci"]
    },
    "testing": {
      "environments": ["testing"],
      "participants": ["platform", "devops"],
      "servers": ["qa-integration", "qa-performance", "qa-quality"]
    },
    "staging": {
      "environments": ["staging"],
      "participants": ["platform", "devops", "secops"],
      "servers": ["staging-supabase", "staging-observability", "staging-deploy"]
    },
    "production": {
      "environments": ["production"],
      "participants": ["platform", "secops", "integrations"],
      "servers": ["prod-supabase", "prod-observability", "prod-integrations"]
    },
    "incident": {
      "environments": ["incident"],
      "participants": ["secops", "devops"],
      "servers": ["incident-response", "incident-diagnostics"]
    }
  },
  "servers": {
    "dev-chrome": {
      "participants": ["ux"],
      "tools": ["chrome_devtools", "ui_accessibility_audit"],
      "activationKeywords": ["ui", "ux", "frontend"],
      "env": { "NODE_ENV": "development" }
    },
    "dev-supabase": {
      "participants": ["platform"],
      "tools": ["test_new_api_integration", "compare_api_sources"],
      "activationKeywords": ["api", "database", "supabase"],
      "env": { "SUPABASE_BRANCH": "dev" }
    },
    "prod-observability": {
      "participants": ["secops"],
      "tools": ["environment_health_check", "analyze_logs", "security_scan"],
      "activationKeywords": ["incident", "alert", "prod"],
      "env": { "NODE_ENV": "production" }
    }
    // ... other servers ...
  },
  "routing": {
    "branchRules": {
      "dev/*": "development",
      "test/*": "testing",
      "staging": "staging",
      "main": "production"
    },
    "keywordRules": {
      "incident": "incident",
      "rollback": "incident"
    }
  },
  "globalSettings": {
    "maxConcurrentServers": 3,
    "smartLoading": true,
    "contextOptimization": true
  }
}
```

## Implementation Steps

1. **Extract Current Inventory**

   - `jq '.servers | keys' config/mcp-config.json`
   - Record tool lists per server for reuse or pruning.

2. **Define Clusters**

   - Map each existing server to one of the five clusters (development, testing, staging, production, incident).
   - For any gaps (e.g., missing staging observability), add placeholders referencing MCP registry entries.

3. **Annotate Participants**

   - For each server, assign the Option A participant tags in a `participants` array.
   - Cross-check with `docs/tooling/end-state/chat-participants-taxonomy.md` to ensure coverage.

4. **Update Activation Rules**

   - Replace legacy keyword triggers with ones aligned to participants (e.g., “ux”, “pipeline”, “incident”).
   - Configure `routing.branchRules` to mirror environment detection from `devops-environment-taxonomy.md`.

5. **Ensure Observability Guardrails**

   - Production/incident servers must require explicit `SECOPS_MODE=true` or similar environment flag before activation.
   - Document the guard in `docs/tooling/settings-staging.md` and `devops-agent-runbook.md`.

6. **Validation Checklist**
   - `npm run mcp:chat:validate`
   - `npm run docs:patch:diagrams`
   - Smoke test MCP startup (`npm run mcp:start:production` / development).

## Notes

- Update `dev-tools/mcp-servers/registry.json` in tandem; ensure slugs match the scaffolding above.
- Keep backups of the legacy configuration until Option A routing is validated.
- Record changes in `reports/context/coverage.md` under “Key Changes Since Last Report”.
