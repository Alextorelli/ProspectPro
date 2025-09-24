-- Add JavaScript-callable function for vault API key retrieval
-- This function provides a clean interface for Node.js applications to access vault secrets

-- Create function to decrypt and return a single secret
CREATE OR REPLACE FUNCTION vault_decrypt_secret(secret_name TEXT)
RETURNS TABLE(
    secret_key TEXT,
    decrypted_secret TEXT,
    status TEXT,
    error_message TEXT
)
SET search_path = 'vault, public'
AS $$
DECLARE
    secret_id UUID;
    decrypted_value TEXT;
BEGIN
    -- Initialize return values
    secret_key := secret_name;
    decrypted_secret := NULL;
    status := 'ERROR';
    error_message := NULL;

    BEGIN
        -- Find the secret ID by name
        SELECT vs.id INTO secret_id
        FROM vault.secrets vs
        WHERE vs.name = secret_name
        LIMIT 1;

        -- If secret not found, return not found status
        IF secret_id IS NULL THEN
            status := 'NOT_FOUND';
            error_message := 'Secret not found in vault: ' || secret_name;
            RETURN NEXT;
            RETURN;
        END IF;

        -- Decrypt the secret using vault function
        SELECT vds.decrypted_secret INTO decrypted_value
        FROM vault.decrypted_secrets vds
        WHERE vds.id = secret_id;

        -- Check if decrypted value is valid
        IF decrypted_value IS NULL OR decrypted_value = '' THEN
            status := 'EMPTY';
            error_message := 'Secret exists but has no value: ' || secret_name;
        ELSIF decrypted_value = 'PLACEHOLDER_VALUE_SET_VIA_DASHBOARD' THEN
            status := 'PLACEHOLDER';
            error_message := 'Secret contains placeholder value, needs real API key: ' || secret_name;
        ELSE
            -- Success - return the decrypted secret
            decrypted_secret := decrypted_value;
            status := 'SUCCESS';
            error_message := NULL;
        END IF;

        RETURN NEXT;
        RETURN;

    EXCEPTION
        WHEN insufficient_privilege THEN
            status := 'ACCESS_DENIED';
            error_message := 'Insufficient privileges to access vault secret: ' || secret_name;
            RETURN NEXT;
        WHEN OTHERS THEN
            status := 'ERROR';
            error_message := 'Database error accessing vault: ' || SQLERRM;
            RETURN NEXT;
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execution permission to service_role
GRANT EXECUTE ON FUNCTION vault_decrypt_secret(TEXT) TO service_role;

-- Create function to get multiple secrets at once (for efficiency)
CREATE OR REPLACE FUNCTION vault_decrypt_multiple_secrets(secret_names TEXT[])
RETURNS TABLE(
    secret_key TEXT,
    decrypted_secret TEXT,
    status TEXT,
    error_message TEXT
)
SET search_path = 'vault, public'
AS $$
DECLARE
    secret_name TEXT;
BEGIN
    -- Loop through each secret name and decrypt
    FOREACH secret_name IN ARRAY secret_names LOOP
        RETURN QUERY
        SELECT * FROM vault_decrypt_secret(secret_name);
    END LOOP;
    
    RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execution permission
GRANT EXECUTE ON FUNCTION vault_decrypt_multiple_secrets(TEXT[]) TO service_role;

-- Create diagnostic function for vault status
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

-- Grant execution permission
GRANT EXECUTE ON FUNCTION vault_diagnostic_check() TO service_role;

-- Add helpful comments
COMMENT ON FUNCTION vault_decrypt_secret(TEXT) IS 'Decrypt a single secret from Supabase Vault - callable from Node.js applications';
COMMENT ON FUNCTION vault_decrypt_multiple_secrets(TEXT[]) IS 'Decrypt multiple secrets from Supabase Vault in a single query';
COMMENT ON FUNCTION vault_diagnostic_check() IS 'Comprehensive vault configuration and health check';