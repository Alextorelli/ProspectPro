# ProspectPro Database Setup (Supabase UI)

This guide walks you through setting up the database in Supabase using the SQL editor and UI. It reflects Supabase editor constraints and our final schema.

## Prerequisites

- A Supabase project (free tier is fine)
- Your project `SUPABASE_URL` and `SUPABASE_SECRET_KEY`

## Step 1 — Enable required extensions

1. Open Supabase → SQL Editor
2. Paste and run the first section of `database/all-phases-consolidated.sql` (Phase 01) or run the entire file (recommended).

> Note: Our scripts already handle:
>
> - `pgcrypto`, `uuid-ossp`, `postgis`, `pg_trgm`
> - Domains via guarded DO/EXECUTE blocks (no `CREATE DOMAIN IF NOT EXISTS`)
> - Moving `postgis` and `pg_trgm` out of the `public` schema into `extensions` (lint clearance)

![SQL Editor Extensions](images/sql-editor-extensions.png)

## Step 2 — Run the full schema

1. In the SQL Editor, paste the full contents of `database/all-phases-consolidated.sql`
2. Click Run and wait for success notices from each phase

![Run Consolidated Schema](images/run-consolidated-schema.png)

## Step 3 — Validate installation

1. Paste and run `database/VALIDATION_QUERIES.sql`
2. Confirm:
   - All required extensions and domains appear
   - Core + analytics tables are present
   - `campaign_analytics.timestamp_date` exists and the dashboard index is present
   - Functions listed; RLS enabled and policies present
   - Materialized view `lead_analytics_summary` exists
   - Smoke tests: `refresh_analytics_views()` returns true; search/geospatial queries return successfully
   - Security hardening applied: anon/authenticated do NOT have `SELECT` on `lead_analytics_summary` and `deployment_analytics`
   - Extensions are not in `public` (ideally `extensions`); `spatial_ref_sys` table should no longer be in `public`

![Validation Results](images/validation-results.png)

## Step 4 — RLS quick check

- Use the commented helpers in `VALIDATION_QUERIES.sql` to simulate `auth.uid()` and verify policies restrict rows as expected.

![RLS Simulation](images/rls-simulation.png)

## Editor Constraints We Account For

- No `CREATE DOMAIN IF NOT EXISTS` → Guarded DO/EXECUTE
- No `CREATE INDEX CONCURRENTLY` in the editor
- Geospatial uses `geography(Point,4326)` with GIST index
- `campaign_analytics.timestamp_date` is trigger-maintained; use it for date filters instead of `DATE(timestamp)`

## Lint Clearance (Supabase Database Linter)

Our scripts include two changes to clear common security lints:

- Function search_path pinning: All public functions are altered (when present) to `SET search_path = public, extensions, pg_temp`.
- Extension relocation: `postgis` and `pg_trgm` are moved from `public` to an `extensions` schema.

If you previously installed PostGIS into `public`, the relocation in Phase 1 (or Phase 5.10a for upgrades) will move objects like `spatial_ref_sys` out of `public`, eliminating the `RLS Disabled in Public` lint on that table.

## Troubleshooting

- Domain creation errors: Ensure you ran the DO/EXECUTE blocks from the consolidated script
- IMMUTABLE index errors: Don’t add expression indexes on `DATE(timestamp)`. Use `timestamp_date` instead
- PostGIS function errors: Verify `postgis` extension is enabled and the `location_coordinates` column exists
- Function signature errors: Re-run `04-functions-and-procedures.sql` (included in consolidated)

### Lint: RLS disabled in public on `spatial_ref_sys`

This table is created by PostGIS when the extension lives in `public`. Our scripts relocate `postgis` to an `extensions` schema; re-run the consolidated script (or Phase 5.10 in the security script) to move it out of `public`.

## What’s Next

- Set environment variables in Railway and deploy the app
- Use `/diag` and `/health` endpoints to verify connectivity
