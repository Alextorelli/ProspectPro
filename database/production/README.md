# ProspectPro Production Schema Bundle

These migrations replace the ad-hoc patch files that previously lived in `database/`. Apply them in lexical order to provision a fresh environment or when re-baselining Supabase after a clean reset.

- `001_core_schema.sql` – core tables, indexes, RLS, triggers, analytics views.
- `002_user_functions.sql` – user-aware helpers, security validators, anonymous campaign linking.
- `003_deduplication.sql` – per-user deduplication ledger and helper routines.
- `004_enrichment_cache.sql` – enrichment cache tables, views, and cache maintenance helpers.

All scripts are idempotent and safe to run multiple times. After modifying this folder, regenerate the codebase index with `npm run codebase:index`.
