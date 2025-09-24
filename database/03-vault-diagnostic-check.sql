-- =====================================================
-- ProspectPro Vault Function 3: vault_diagnostic_check
-- =====================================================
-- Comprehensive vault configuration and health check
-- Idempotent: Safe to run multiple times
-- Security: Hardened with SET search_path including pg_catalog for system tables

CREATE OR REPLACE FUNCTION vault_diagnostic_check()
RETURNS TABLE(
    check_name TEXT,
    status TEXT,
    details TEXT,
    recommendation TEXT
)
SET search_path = 'vault, public, pg_catalog'
AS $$
DECLARE
    vault_enabled BOOLEAN := FALSE;
    secret_count INTEGER := 0;
    configured_secrets INTEGER := 0;
BEGIN
    -- Check if vault extension is enabled
    BEGIN
        SELECT EXISTS(
            SELECT 1 FROM pg_extension WHERE extname = 'vault'
        ) INTO vault_enabled;
        
        IF vault_enabled THEN
            check_name := 'vault_extension';
            status := 'ENABLED';
            details := 'Supabase Vault extension is active';
            recommendation := 'Vault is properly configured';
            RETURN NEXT;
        ELSE
            check_name := 'vault_extension';
            status := 'DISABLED';
            details := 'Supabase Vault extension not found';
            recommendation := 'Run: CREATE EXTENSION "vault" WITH SCHEMA "vault"';
            RETURN NEXT;
            RETURN;
        END IF;
    EXCEPTION
        WHEN OTHERS THEN
            check_name := 'vault_extension';
            status := 'ERROR';
            details := 'Failed to check vault extension: ' || SQLERRM;
            recommendation := 'Check database permissions and extension availability';
            RETURN NEXT;
            RETURN;
    END;

    -- Check vault secrets
    BEGIN
        SELECT COUNT(*) INTO secret_count
        FROM vault.secrets
        WHERE name IN (
            'GOOGLE_PLACES_API_KEY',
            'FOURSQUARE_API_KEY', 
            'HUNTER_IO_API_KEY',
            'ZEROBOUNCE_API_KEY',
            'NEVERBOUNCE_API_KEY',
            'SCRAPINGDOG_API_KEY',
            'APOLLO_API_KEY',
            'PERSONAL_ACCESS_TOKEN'
        );

        check_name := 'vault_secrets_total';
        status := CASE WHEN secret_count > 0 THEN 'FOUND' ELSE 'EMPTY' END;
        details := secret_count || ' ProspectPro secrets found in vault';
        recommendation := CASE 
            WHEN secret_count = 0 THEN 'Run vault setup migration to create standard API key placeholders'
            ELSE 'Secrets are configured in vault'
        END;
        RETURN NEXT;

        -- Check configured secrets (non-placeholder values)
        SELECT COUNT(*) INTO configured_secrets
        FROM vault.secrets vs
        JOIN vault.decrypted_secrets vds ON vs.id = vds.id
        WHERE vs.name IN (
            'GOOGLE_PLACES_API_KEY',
            'FOURSQUARE_API_KEY', 
            'HUNTER_IO_API_KEY',
            'ZEROBOUNCE_API_KEY',
            'NEVERBOUNCE_API_KEY',
            'SCRAPINGDOG_API_KEY',
            'APOLLO_API_KEY',
            'PERSONAL_ACCESS_TOKEN'
        )
        AND vds.decrypted_secret IS NOT NULL
        AND vds.decrypted_secret != 'PLACEHOLDER_VALUE_SET_VIA_DASHBOARD'
        AND vds.decrypted_secret != '';

        check_name := 'vault_secrets_configured';
        status := CASE 
            WHEN configured_secrets = 0 THEN 'NONE'
            WHEN configured_secrets < secret_count THEN 'PARTIAL'
            ELSE 'COMPLETE'
        END;
        details := configured_secrets || '/' || secret_count || ' secrets have real values';
        recommendation := CASE 
            WHEN configured_secrets = 0 THEN 'Add real API keys via Supabase Dashboard → Database → Vault'
            WHEN configured_secrets < secret_count THEN 'Complete API key configuration in Supabase Vault'
            ELSE 'All API keys are configured'
        END;
        RETURN NEXT;

    EXCEPTION
        WHEN OTHERS THEN
            check_name := 'vault_secrets_check';
            status := 'ERROR';
            details := 'Failed to access vault secrets: ' || SQLERRM;
            recommendation := 'Check vault permissions and schema access';
            RETURN NEXT;
    END;

    RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execution permission to service_role (idempotent)
GRANT EXECUTE ON FUNCTION vault_diagnostic_check() TO service_role;

-- Add descriptive comment
COMMENT ON FUNCTION vault_diagnostic_check() IS 'Comprehensive vault configuration and health check with security hardening';