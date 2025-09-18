# ProspectPro Database Manual Setup Guide

## Prerequisites

- ✅ Supabase project: https://sriycekxdqnesdsgwiuc.supabase.co
- ✅ Service role key configured
- ✅ Schema files available: 6 files

## Quick Setup (Recommended)

### Option 1: Single-shot setup (preferred)

1. Open: your Supabase project's SQL editor
2. Paste and run: `database/all-phases-consolidated.sql`
3. Then run: `database/VALIDATION_QUERIES.sql` to verify

### Option 2: Per-phase execution (advanced)

Run in order, verifying after each phase:

- `database/01-database-foundation.sql`
- `database/02-leads-and-enrichment.sql`
- `database/03-monitoring-and-analytics.sql`
- `database/04-functions-and-procedures.sql`
- `database/05-security-and-rls.sql`

## Tables That Will Be Created

### Core Tables

- **campaigns** - Campaign configuration and budgets
- **system_settings** - Per-user config (RLS enforced)
- **service_health_metrics** - System monitoring
- **enhanced_leads** - Main business data with confidence scoring
- **lead_emails** / **lead_social_profiles** - Enrichment artifacts

### Monitoring & Analytics Tables

- **campaign_analytics** - Metrics with `timestamp_date` trigger-maintained column
- **api_cost_tracking** - Per-API cost metrics
- **lead_qualification_metrics** - Aggregations with generated columns
- **dashboard_exports** - Export audit
- **lead_analytics_summary** - Materialized view for dashboards

### Security Features

- **Row Level Security (RLS)** policies on all tables
- **User isolation** with auth.uid() policies
- **Admin access** controls

## Validation

After setup, verify with the SQL file:

1. Run `database/VALIDATION_QUERIES.sql` in Supabase SQL editor
2. Optionally: `SELECT validate_rls_security();`

## Troubleshooting

### If the SQL Editor reports transaction errors

Use the per-phase files; scripts are compatible with single-transaction editor (no CONCURRENTLY), and domains are created via guarded DO/EXECUTE.

### If tables already exist

All scripts are idempotent (`IF NOT EXISTS`, guarded `DO $$` blocks). It's safe to re-run.

## Next Steps

1. Complete database setup as described above
2. Run: `npm start` to test the full application
3. Access: `http://localhost:3000/health` to verify connectivity

Generated: 2025-09-17T06:04:00.371Z
