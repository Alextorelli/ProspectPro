# Deployment Checklist Template

## Pre-Deployment Validation

- [ ] Run `npm run lint` and `npm test` to ensure code quality
- [ ] Execute `npm run supabase:test:db` for database tests
- [ ] Validate agent contexts with `npm run validate:contexts`
- [ ] Check MCP servers status with `npm run mcp:start`

## Frontend Deployment

- [ ] Build production bundle with `npm run build`
- [ ] Deploy to Vercel with `npx vercel@latest --prod --confirm --scope appsmithery --project prospect-pro --cwd dist`
- [ ] Verify deployment URL and health checks

## Backend Deployment

- [ ] Deploy Edge Functions with `npm run deploy:critical`
- [ ] Monitor function logs with `npm run edge:logs`
- [ ] Test authentication flows in production

## Post-Deployment Monitoring

- [ ] Check Supabase dashboard for errors
- [ ] Monitor application performance metrics
- [ ] Validate data integrity and user flows
- [ ] Update deployment logs in session store
