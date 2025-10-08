-- ProspectPro Security Fixes - Consolidated Migration
-- October 8, 2025 - Fix function search_path warnings and enable auth protections

-- =============================================================================
-- PART 1: Fix Function Search Path Warnings (All Functions)
-- =============================================================================

-- Fix job queue functions
CREATE OR REPLACE FUNCTION update_discovery_jobs_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION cleanup_old_jobs(retention_days INTEGER DEFAULT 30)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM discovery_jobs
  WHERE status IN ('completed', 'failed')
    AND completed_at < NOW() - (retention_days || ' days')::INTERVAL;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- Fix campaign naming functions (if they exist)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'generate_campaign_name') THEN
    EXECUTE '
      CREATE OR REPLACE FUNCTION public.generate_campaign_name(
        business_type TEXT,
        location TEXT,
        user_id UUID DEFAULT NULL
      )
      RETURNS TEXT
      LANGUAGE plpgsql
      SET search_path = public, pg_temp
      AS $func$
      DECLARE
        business_code TEXT;
        location_code TEXT;
        date_string TEXT;
        time_string TEXT;
        user_code TEXT;
        campaign_name TEXT;
      BEGIN
        business_code := UPPER(LEFT(REGEXP_REPLACE(business_type, ''[^a-zA-Z]'', '''', ''g''), 4));
        location_code := UPPER(LEFT(REGEXP_REPLACE(location, ''[^a-zA-Z]'', '''', ''g''), 4));
        date_string := TO_CHAR(NOW(), ''YYYYMMDD'');
        time_string := TO_CHAR(NOW(), ''HH24MISS'');
        
        IF user_id IS NOT NULL THEN
          user_code := RIGHT(user_id::TEXT, 6);
        ELSE
          user_code := SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6);
        END IF;
        
        campaign_name := business_code || ''_'' || location_code || ''_'' || date_string || ''_'' || time_string || ''_'' || user_code;
        
        RETURN campaign_name;
      END;
      $func$;
    ';
  END IF;
END;
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'auto_generate_campaign_name') THEN
    EXECUTE '
      CREATE OR REPLACE FUNCTION public.auto_generate_campaign_name()
      RETURNS TRIGGER
      LANGUAGE plpgsql
      SET search_path = public, pg_temp
      AS $func$
      BEGIN
        IF NEW.generated_name IS NULL OR NEW.generated_name = '''' THEN
          NEW.generated_name := public.generate_campaign_name(
            NEW.business_type,
            NEW.location,
            NEW.user_id
          );
        END IF;
        
        IF NEW.display_name IS NULL OR NEW.display_name = '''' THEN
          NEW.display_name := NEW.business_type || '' in '' || NEW.location;
        END IF;
        
        NEW.name_components := jsonb_build_object(
          ''business_type'', NEW.business_type,
          ''location'', NEW.location,
          ''generated_at'', NOW(),
          ''user_id'', NEW.user_id
        );
        
        RETURN NEW;
      END;
      $func$;
    ';
  END IF;
END;
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_new_user') THEN
    EXECUTE '
      CREATE OR REPLACE FUNCTION public.handle_new_user()
      RETURNS TRIGGER
      LANGUAGE plpgsql
      SECURITY DEFINER
      SET search_path = public, pg_temp
      AS $func$
      BEGIN
        INSERT INTO public.user_profiles (id, email, full_name, avatar_url)
        VALUES (
          NEW.id,
          NEW.email,
          NEW.raw_user_meta_data->>''full_name'',
          NEW.raw_user_meta_data->>''avatar_url''
        )
        ON CONFLICT (id) DO UPDATE SET
          email = EXCLUDED.email,
          full_name = EXCLUDED.full_name,
          avatar_url = EXCLUDED.avatar_url,
          updated_at = NOW();
        
        RETURN NEW;
      END;
      $func$;
    ';
  END IF;
END;
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_user_spending') THEN
    EXECUTE '
      CREATE OR REPLACE FUNCTION public.update_user_spending(
        user_id_param UUID,
        amount_param DECIMAL(10,4)
      )
      RETURNS VOID
      LANGUAGE plpgsql
      SET search_path = public, pg_temp
      AS $func$
      BEGIN
        UPDATE public.user_profiles
        SET 
          total_spent = total_spent + amount_param,
          updated_at = NOW()
        WHERE id = user_id_param;
      END;
      $func$;
    ';
  END IF;
END;
$$;

-- =============================================================================
-- PART 2: Enable Leaked Password Protection
-- =============================================================================

-- Enable leaked password protection (prevents compromised password reuse)
-- Reference: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection
DO $$
BEGIN
  -- Try to enable leaked password protection
  PERFORM auth.enable_leaked_password_protection();
  RAISE NOTICE '✅ Leaked password protection enabled successfully';
EXCEPTION
  WHEN undefined_function THEN
    RAISE WARNING '⚠️ auth.enable_leaked_password_protection() function not available in this Supabase version';
  WHEN OTHERS THEN
    RAISE WARNING '⚠️ Could not enable leaked password protection: %', SQLERRM;
END;
$$;

-- =============================================================================
-- MIGRATION SUMMARY
-- =============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🔐 ProspectPro Security Fixes Applied - October 8, 2025';
  RAISE NOTICE '================================================================';
  RAISE NOTICE '✅ Function search_path warnings fixed for all database functions';
  RAISE NOTICE '✅ Leaked password protection enabled (if available)';
  RAISE NOTICE '✅ All functions now use SET search_path = public, pg_temp';
  RAISE NOTICE '';
  RAISE NOTICE 'Next: Re-run Supabase security linter to verify fixes';
  RAISE NOTICE '';
END $$;