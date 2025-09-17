# ProspectPro Database Manual Setup Guide

## Prerequisites
- ✅ Supabase project: https://sriycekxdqnesdsgwiuc.supabase.co
- ✅ Service role key configured
- ✅ Schema files available: 6 files

## Quick Setup (Recommended)

### Option 1: Supabase SQL Editor
1. Open: https://sriycekxdqnesdsgwiuc.supabase.co/project/default/sql
2. Copy and paste the content from: `database/all-phases-consolidated.sql`
3. Click "Run" to execute the complete schema

### Option 2: Individual Phase Files
Execute these files in order:
- `database/all-phases-consolidated.sql`
- `database/01-database-foundation.sql`
- `database/02-leads-and-enrichment.sql`
- `database/03-monitoring-and-analytics.sql`
- `database/04-functions-and-procedures.sql`
- `database/05-security-and-rls.sql`

## Tables That Will Be Created

### Core Tables
- **enhanced_leads** - Main business data with confidence scoring
- **campaigns** - User session tracking
- **api_costs** - Cost tracking per API call
- **validation_results** - Data quality validation

### Monitoring Tables  
- **service_health_metrics** - System health monitoring
- **webhook_events** - Railway webhook processing logs

### Security Features
- **Row Level Security (RLS)** policies on all tables
- **User isolation** with auth.uid() policies
- **Admin access** controls

## Validation

After setup, verify with:
```bash
node database/validate-setup.js --check-tables
```

## Troubleshooting

### If you see "Legacy API keys are disabled"
This is expected - manually execute the SQL in Supabase Dashboard instead.

### If tables already exist
The SQL includes `IF NOT EXISTS` clauses, so it's safe to re-run.

## Next Steps
1. Complete database setup as described above
2. Run: `npm start` to test the full application
3. Access: http://localhost:3000/health to verify connectivity

Generated: 2025-09-17T06:04:00.371Z
