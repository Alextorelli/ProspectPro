# Supabase CLI Migration Playbook (v2.51+)

ProspectPro follows Supabase's current migration workflow. Use the commands below to manage schema changes with the supported CLI interface (dashboard logs and `npx` invocations).

## Quick Reference

| Task                              | Command                                                           |
| --------------------------------- | ----------------------------------------------------------------- |
| Create a new migration            | `npx --yes supabase@latest migration new <name>`                  |
| View pending/applied migrations   | `npx --yes supabase@latest migration list`                        |
| Fetch historical migrations       | `npx --yes supabase@latest migration fetch --name <migration>`    |
| Repair migration history          | `npx --yes supabase@latest migration repair --status in_progress` |
| Squash migrations                 | `npx --yes supabase@latest migration squash`                      |
| Apply migrations locally          | `npx --yes supabase@latest migration up`                          |
| Push migrations to linked project | `npx --yes supabase@latest db push`                               |

> All commands assume you run them from the repository root (`/workspaces/ProspectPro`) with the project already linked via `supabase link --project-ref sriycekxdqnesdsgwiuc`.

## Workflow

1. **Generate migration file**

   ```bash
   npx --yes supabase@latest migration new ledger_api_usage_hotfix
   ```

   Edit the generated SQL under `supabase/migrations/`.

2. **Validate locally** (optional for ProspectPro's serverless flow):

   ```bash
   npx --yes supabase@latest migration up --dry-run
   ```

3. **Push to remote**

   ```bash
   npx --yes supabase@latest db push --linked
   ```

   Supabase CLI reads `supabase/config.toml`, so no `--project-ref` flag is required.

4. **Confirm state**
   ```bash
   npx --yes supabase@latest migration list --output json | jq '.remote'
   ```

## Troubleshooting

- **Authentication**: Always `source scripts/ensure-supabase-cli-session.sh` before running CLI commands. The helper handles device-code login with `--no-browser` support.
- **Project linkage**: If commands report "project not linked", run `npx --yes supabase@latest link --project-ref sriycekxdqnesdsgwiuc` once from repo root.
- **Secret inspection**: `supabase secrets list` now returns hashes only. Retrieve actual values from the Supabase dashboard or load them via `scripts/setup-edge-auth-env.sh`.
- **Logs**: The CLI removed `supabase logs functions`. Use the Supabase dashboard (Edge Functions → <slug> → Logs) for runtime output.

## References

- https://supabase.com/docs/reference/cli/supabase-migration
- https://supabase.com/docs/reference/cli/supabase-migration-new
- https://supabase.com/docs/reference/cli/supabase-migration-list
- https://supabase.com/docs/reference/cli/supabase-migration-fetch
- https://supabase.com/docs/reference/cli/supabase-migration-repair
- https://supabase.com/docs/reference/cli/supabase-migration-squash
- https://supabase.com/docs/reference/cli/supabase-migration-up
