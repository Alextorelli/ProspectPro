# Database notes and PostGIS guidance

This file documents important repository decisions and special-case treatments for database objects that are created and managed by extensions (notably PostGIS). It is intended to help operators and CI/lint rules understand why certain linter warnings are intentionally acknowledged.

## PostGIS and `public.spatial_ref_sys`

- The PostGIS extension installs several objects into the `public` schema by default. One such table is `public.spatial_ref_sys` which stores coordinate reference system definitions used by PostGIS functions and types.

- Supabase and many PostgreSQL installations place the `postgis` extension in the `public` schema. The `postgis` extension and the objects it creates are generally considered "system/extension-managed" and are non-relocatable in many environments.

- Linter findings that flag `public.spatial_ref_sys` as having RLS disabled can be safely acknowledged:

  - Enabling Row Level Security (RLS) on `public.spatial_ref_sys` is not generally necessary and may interfere with PostGIS internals or client libraries that expect the table to be globally queryable.
  - If your security posture requires that all tables have RLS, evaluate carefully and test in a staging environment before enabling RLS on extension-managed tables. A permissive policy (e.g., allowing only the `service_role`) can be created, but this is rarely required for `spatial_ref_sys`.

- Recommended action:
  - Keep `postgis` and its objects in `public` (default).
  - Document the deviation in CI: add a suppression/exception rule for `public.spatial_ref_sys` (or extension-managed tables) in your linter configuration rather than applying RLS to that table.
  - If you must enable RLS on `public.spatial_ref_sys`, do so only after thorough testing and with a reversible change (the repository can include an optional migration script under `database/patches/` with clear warnings).

## Why we made this choice

- This project treats all PostGIS-created objects as extension-managed. Applying RLS to them is usually unnecessary and can cause subtle failures. Documenting this explicitly prevents noisy linter failures and helps reviewers understand the trade-off.

## Optional Scripts

If you still want an optional, reversible snippet to enable RLS for `public.spatial_ref_sys`, place it behind a manual approval process and test in staging first. Example (NOT recommended for production without testing):

```sql
-- OPTIONAL: enable RLS on public.spatial_ref_sys (use with caution)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'spatial_ref_sys' AND policyname = 'Allow service_role')
  THEN
    ALTER TABLE public.spatial_ref_sys ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Allow service_role" ON public.spatial_ref_sys FOR ALL USING (auth.role() = 'service_role');
    RAISE NOTICE 'Enabled RLS on public.spatial_ref_sys and created policy "Allow service_role"';
  ELSE
    RAISE NOTICE 'Policy already exists or RLS already enabled on public.spatial_ref_sys';
  END IF;
END $$;
```

Add such a snippet only when you have approvals and a rollback plan.

---

If you'd like, I can:

- add a CI linter suppression example to the repository (e.g., how to exclude `public.spatial_ref_sys`), or
- add the optional snippet into `database/patches/optional-enable-spatial-rls.sql` with a prominent warning.

Which would you like me to do next?
