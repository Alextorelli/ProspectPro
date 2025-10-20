# Workspace Status Checklist

## Automated Setup/Config
- [ ] `git pull` run
- [ ] `npm install` run
- [ ] `npm run codebase:index` run
- [ ] `source scripts/ensure-supabase-cli-session.sh` run
- [ ] `vercel env pull .env.vercel` run
- [ ] `npm run thunder:env:sync` run
- [ ] `npm run docs:prepare` run

## Manual Setup
- [ ] Agent mode selected in VS Code Agent menu
- [ ] MCP servers started (`npm run start:production`/`start:development`/`start:troubleshooting`)
- [ ] MCP sockets visible in VS Code MCP panel
- [ ] Context store/ledgers reviewed and updated if needed
- [ ] Environment switched via `EnvironmentContextManager.switchEnvironment(...)` if required

## Manual Testing & Config
- [ ] `SUPABASE_SESSION_JWT` exported in terminal
- [ ] `npm run supabase:test:db` run
- [ ] `npm run supabase:test:functions` run
- [ ] Thunder tests run (shortcut or `npm run thunder:test`)
- [ ] Thunder reports reviewed in `thunder-collection/reports/`
- [ ] `./scripts/campaign-validation.sh` run
- [ ] Curl probes from `docs/edge-auth-testing.md` executed
- [ ] Logs tailed for edge functions
- [ ] `npm run build` and (optional) `npm run preview` run

## Automated Revised Integration, Testing, Deployment
- [ ] `npm run docs:update` run
- [ ] CI/CD tasks run as needed
- [ ] Edge functions deployed (`npm run edge:deploy -- <slug>`)
- [ ] Frontend deployed (`npm run build && cd dist && vercel --prod`)
- [ ] SYSTEM_REFERENCE.md checklist signed off

---
*Check off each item as you proceed. Update this file as needed for your workflow.*
