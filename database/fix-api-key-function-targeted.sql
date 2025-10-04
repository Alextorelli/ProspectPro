-- TARGETED FIX: validate_api_key_format search_path issue
-- October 3, 2025 - Force explicit search_path setting

-- Method 1: Complete function drop and recreation with explicit syntax
DROP FUNCTION IF EXISTS public.validate_api_key_format(TEXT);

-- Recreate with very explicit syntax
CREATE FUNCTION public.validate_api_key_format(api_key TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
IMMUTABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validate new Supabase API key formats
  IF api_key LIKE 'sb_publishable_%' THEN 
    RETURN true; 
  END IF;
  
  IF api_key LIKE 'sb_secret_%' THEN 
    RETURN true; 
  END IF;
  
  -- Legacy JWT support
  IF api_key LIKE 'eyJ%' AND LENGTH(api_key) > 100 THEN 
    RETURN true; 
  END IF;
  
  RETURN false;
END;
$$;

-- Update function comment
COMMENT ON FUNCTION public.validate_api_key_format(TEXT) IS 
'Validates new Supabase API key format (sb_publishable_*/sb_secret_*) with explicit search_path for security compliance';

-- Method 2: Alternative approach using ALTER FUNCTION (if creation doesn't work)
-- Uncomment if the above CREATE FUNCTION still doesn't set search_path properly:

-- ALTER FUNCTION public.validate_api_key_format(TEXT) SET search_path = public;

-- Immediate verification - this should now show both functions with proper search_path
SELECT 
  p.proname AS function_name,
  p.prosrc LIKE '%search_path%' AS has_search_path_in_source,
  CASE 
    WHEN p.prosrc LIKE '%SET search_path = public%' THEN 'Fixed: search_path = public'
    WHEN p.prosrc LIKE '%search_path%' THEN 'Has search_path setting'  
    ELSE 'No explicit search_path'
  END AS search_path_status,
  -- Additional check: look at function configuration
  pg_get_functiondef(p.oid) LIKE '%SET search_path%' AS function_def_has_search_path
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN ('validate_api_key_format', 'validate_security_configuration')
ORDER BY p.proname;

-- Test the function to ensure it works
SELECT public.validate_api_key_format('sb_publishable_GaGU6ZiyiO6ncO7kU2qAvA_SFuCyYaM') AS test_result;

-- Final status check
SELECT public.validate_security_configuration() AS final_security_status;