-- ============================================================================
-- PRODUCTION DATABASE FIXES: Apply to existing Supabase database
-- Run this script in Supabase SQL Editor to fix linter issues
--
-- IMPORTANT NOTES:
-- - Some operations may fail in managed Supabase environments (this is normal)
-- - spatial_ref_sys table cannot be modified (owned by PostGIS)
-- - PostGIS extension may not be movable (non-relocatable)
-- - The script handles these cases gracefully and continues
-- ============================================================================
-- Fix 1: Enable RLS on spatial_ref_sys table (if it exists)
-- Note: This may fail in managed environments where users don't own system tables
DO $$ BEGIN IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
        AND table_name = 'spatial_ref_sys'
) THEN BEGIN -- Enable RLS (may fail in managed environments)
EXECUTE 'ALTER TABLE public.spatial_ref_sys ENABLE ROW LEVEL SECURITY';
-- Create restrictive policy for service role access only
EXECUTE 'CREATE POLICY "spatial_ref_sys_service_access" ON spatial_ref_sys FOR ALL USING (auth.role() = ''service_role'')';
RAISE NOTICE '✅ Fixed: spatial_ref_sys RLS enabled with service role policy';
EXCEPTION
WHEN insufficient_privilege THEN -- This is expected in managed Supabase environments
RAISE NOTICE 'ℹ️  Cannot modify spatial_ref_sys (insufficient privileges - normal in managed environments)';
RAISE NOTICE 'ℹ️  This table is owned by PostGIS and cannot be modified by users';
WHEN OTHERS THEN RAISE NOTICE 'ℹ️  Could not enable RLS on spatial_ref_sys: %',
SQLERRM;
END;
ELSE RAISE NOTICE 'ℹ️  spatial_ref_sys table not found (normal in some environments)';
END IF;
END $$;
-- Fix 2: Move extensions out of public schema
DO $$ BEGIN -- Ensure target schema exists
EXECUTE 'CREATE SCHEMA IF NOT EXISTS extensions';
-- Move pg_trgm if currently in public
BEGIN IF EXISTS (
    SELECT 1
    FROM pg_extension e
        JOIN pg_namespace n ON n.oid = e.extnamespace
    WHERE e.extname = 'pg_trgm'
        AND n.nspname = 'public'
) THEN EXECUTE 'ALTER EXTENSION "pg_trgm" SET SCHEMA extensions';
RAISE NOTICE '✅ Moved extension pg_trgm to schema extensions';
END IF;
EXCEPTION
WHEN OTHERS THEN RAISE NOTICE 'ℹ️  Skipped moving pg_trgm: %',
SQLERRM;
END;
-- Try to move postgis if currently in public
BEGIN IF EXISTS (
    SELECT 1
    FROM pg_extension e
        JOIN pg_namespace n ON n.oid = e.extnamespace
    WHERE e.extname = 'postgis'
        AND n.nspname = 'public'
) THEN EXECUTE 'ALTER EXTENSION "postgis" SET SCHEMA extensions';
RAISE NOTICE '✅ Moved extension postgis to schema extensions';
END IF;
EXCEPTION
WHEN object_not_in_prerequisite_state THEN RAISE NOTICE 'ℹ️  PostGIS extension is non-relocatable (normal in managed environments)';
WHEN insufficient_privilege THEN RAISE NOTICE 'ℹ️  Cannot move postgis extension (insufficient privileges)';
WHEN OTHERS THEN RAISE NOTICE 'ℹ️  Skipped moving postgis: %',
SQLERRM;
END;
END $$;
-- Fix 3: Enable RLS on any missing monitoring tables
DO $$
DECLARE tables_to_check TEXT [] := ARRAY [
    'budget_management',
    'budget_alerts',
    'api_health_monitoring',
    'system_performance_metrics'
  ];
target_table TEXT;
BEGIN FOREACH target_table IN ARRAY tables_to_check LOOP IF EXISTS (
    SELECT 1
    FROM information_schema.tables t
    WHERE t.table_schema = 'public'
        AND t.table_name = target_table
) THEN -- Enable RLS if not already enabled
IF NOT EXISTS (
    SELECT 1
    FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
        AND c.relname = target_table
        AND c.relrowsecurity = true
) THEN EXECUTE format(
    'ALTER TABLE %I ENABLE ROW LEVEL SECURITY',
    target_table
);
EXECUTE format(
    'CREATE POLICY "Service role can access all %I" ON %I FOR ALL USING (auth.role() = ''service_role'')',
    target_table,
    target_table
);
RAISE NOTICE '✅ Enabled RLS on table: %',
target_table;
ELSE RAISE NOTICE 'ℹ️  RLS already enabled on table: %',
target_table;
END IF;
ELSE RAISE NOTICE 'ℹ️  Table not found: %',
target_table;
END IF;
END LOOP;
END $$;
-- Fix 4: Set search_path on all functions to prevent mutable warnings
DO $$
DECLARE rec RECORD;
BEGIN -- Get all functions in public schema
FOR rec IN (
    SELECT p.oid::regprocedure::text AS sig,
        p.proname
    FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
        AND p.proname NOT LIKE 'pg_%' -- Skip PostgreSQL built-in functions
        AND p.proname NOT IN ('auth.uid', 'auth.role', 'auth.jwt') -- Skip auth functions
) LOOP BEGIN -- Set search_path if not already set
IF NOT EXISTS (
    SELECT 1
    FROM pg_proc p2
    WHERE p2.oid::regprocedure::text = rec.sig
        AND p2.proconfig IS NOT NULL
        AND array_to_string(p2.proconfig, ',') LIKE '%search_path%'
) THEN EXECUTE format(
    'ALTER FUNCTION %s SET search_path = public, extensions, pg_temp',
    rec.sig
);
RAISE NOTICE '✅ Set search_path on function: %',
rec.proname;
END IF;
EXCEPTION
WHEN OTHERS THEN RAISE NOTICE 'ℹ️  Could not set search_path on function %: %',
rec.proname,
SQLERRM;
END;
END LOOP;
END $$;
-- Fix 5: Validate that fixes were applied
DO $$
DECLARE rls_count INTEGER;
extension_count INTEGER;
function_count INTEGER;
BEGIN -- Count tables with RLS enabled
SELECT COUNT(*) INTO rls_count
FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
    AND c.relkind = 'r'
    AND c.relrowsecurity = true
    AND c.relname NOT LIKE 'pg_%';
-- Exclude system tables
-- Count extensions in public schema
SELECT COUNT(*) INTO extension_count
FROM pg_extension e
    JOIN pg_namespace n ON n.oid = e.extnamespace
WHERE n.nspname = 'public'
    AND e.extname NOT IN ('plpgsql', 'uuid-ossp');
-- These are OK in public
-- Count functions with search_path set
SELECT COUNT(*) INTO function_count
FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
    AND p.proconfig IS NOT NULL
    AND array_to_string(p.proconfig, ',') LIKE '%search_path%'
    AND p.proname NOT LIKE 'pg_%'
    AND p.proname NOT IN ('auth.uid', 'auth.role', 'auth.jwt');
RAISE NOTICE '';
RAISE NOTICE '🎯 PRODUCTION DATABASE FIXES APPLIED';
RAISE NOTICE '=====================================';
RAISE NOTICE '✅ Tables with RLS enabled: %',
rls_count;
RAISE NOTICE 'ℹ️  Extensions in public schema: % (some may be non-movable)',
extension_count;
RAISE NOTICE '✅ Functions with search_path set: %',
function_count;
RAISE NOTICE '';
RAISE NOTICE 'Notes:';
RAISE NOTICE '- spatial_ref_sys: Cannot be modified in managed environments (normal)';
RAISE NOTICE '- PostGIS extension: May remain in public schema (non-relocatable)';
RAISE NOTICE '- These limitations are expected in Supabase managed databases';
RAISE NOTICE '';
RAISE NOTICE 'Next Steps:';
RAISE NOTICE '1. ✅ Run Supabase linter again to verify remaining issues';
RAISE NOTICE '2. 🔄 Re-run your application tests';
RAISE NOTICE '3. 📊 Check that all functionality still works';
RAISE NOTICE '';
END $$;