-- Enable Supabase Vault Extension for Enhanced Secret Management
-- This migration replaces the custom app_secrets table with Supabase's native Vault

-- Enable the vault extension
CREATE EXTENSION IF NOT EXISTS "vault" WITH SCHEMA "vault";

-- Grant necessary permissions for vault usage
GRANT USAGE ON SCHEMA vault TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA vault TO service_role;

-- Migrate existing secrets from app_secrets to vault (if app_secrets table exists)
DO $$
DECLARE
    secret_record RECORD;
    vault_secret_id UUID;
BEGIN
    -- Check if app_secrets table exists before migration
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'app_secrets') THEN
        -- Migrate each secret from app_secrets to vault
        FOR secret_record IN SELECT key, value FROM app_secrets LOOP
            -- Create vault secret (will skip if already exists)
            BEGIN
                SELECT vault.create_secret(
                    secret_record.value,
                    secret_record.key,
                    'ProspectPro API Key: ' || secret_record.key
                ) INTO vault_secret_id;
                
                RAISE NOTICE 'Migrated secret: % -> vault ID: %', secret_record.key, vault_secret_id;
            EXCEPTION 
                WHEN unique_violation THEN
                    RAISE NOTICE 'Secret % already exists in vault, skipping', secret_record.key;
                WHEN OTHERS THEN
                    RAISE WARNING 'Failed to migrate secret %: %', secret_record.key, SQLERRM;
            END;
        END LOOP;
    END IF;
END $$;

-- Create or update standard API key secrets in vault (with error handling for duplicates)
DO $$
DECLARE
    secret_names TEXT[] := ARRAY[
        'GOOGLE_PLACES_API_KEY',
        'FOURSQUARE_API_KEY', 
        'HUNTER_IO_API_KEY',
        'ZEROBOUNCE_API_KEY',
        'NEVERBOUNCE_API_KEY',
        'SCRAPINGDOG_API_KEY',
        'APOLLO_API_KEY',
        'PERSONAL_ACCESS_TOKEN'
    ];
    secret_name TEXT;
    vault_secret_id UUID;
    placeholder_value TEXT := 'PLACEHOLDER_VALUE_SET_VIA_DASHBOARD';
BEGIN
    FOREACH secret_name IN ARRAY secret_names LOOP
        BEGIN
            SELECT vault.create_secret(
                placeholder_value,
                secret_name,
                'ProspectPro API Key: ' || secret_name || ' - Update via Supabase Dashboard'
            ) INTO vault_secret_id;
            
            RAISE NOTICE 'Created vault secret: % -> ID: %', secret_name, vault_secret_id;
        EXCEPTION 
            WHEN unique_violation THEN
                RAISE NOTICE 'Vault secret % already exists, skipping creation', secret_name;
            WHEN OTHERS THEN
                RAISE WARNING 'Failed to create vault secret %: %', secret_name, SQLERRM;
        END;
    END LOOP;
END $$;

-- Create a view for easier secret management (read-only)
CREATE OR REPLACE VIEW vault_secrets_summary AS
SELECT 
    vs.name,
    vs.description,
    vs.created_at,
    vs.updated_at,
    CASE 
        WHEN vds.decrypted_secret IS NOT NULL THEN 'SET'
        ELSE 'NOT_SET'
    END as status,
    LEFT(vds.decrypted_secret, 8) || '...' as preview
FROM vault.secrets vs
LEFT JOIN vault.decrypted_secrets vds ON vs.id = vds.id
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
ORDER BY vs.name;

-- Grant permissions on the summary view
GRANT SELECT ON vault_secrets_summary TO service_role;

-- Add RLS policy for vault access (restrict to service_role)
CREATE POLICY "Service role can read vault secrets" ON vault.secrets
    FOR SELECT USING (auth.role() = 'service_role');

CREATE POLICY "Service role can read decrypted secrets" ON vault.decrypted_secrets  
    FOR SELECT USING (auth.role() = 'service_role');

-- Optional: Create backup of app_secrets before potential cleanup
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'app_secrets') THEN
        CREATE TABLE IF NOT EXISTS app_secrets_backup AS 
        SELECT *, NOW() as backup_created_at FROM app_secrets;
        
        RAISE NOTICE 'Created backup table: app_secrets_backup';
    END IF;
END $$;

-- Add comments for documentation
COMMENT ON EXTENSION vault IS 'Supabase Vault extension for secure secret storage';
COMMENT ON VIEW vault_secrets_summary IS 'Summary view of ProspectPro API key secrets in vault';

-- Performance monitoring
CREATE OR REPLACE FUNCTION get_vault_performance_stats()
RETURNS TABLE(
    total_secrets INTEGER,
    secrets_with_values INTEGER,
    avg_secret_age_days NUMERIC,
    last_updated TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_secrets,
        COUNT(vds.decrypted_secret)::INTEGER as secrets_with_values,
        AVG(EXTRACT(days FROM NOW() - vs.created_at))::NUMERIC as avg_secret_age_days,
        MAX(vs.updated_at) as last_updated
    FROM vault.secrets vs
    LEFT JOIN vault.decrypted_secrets vds ON vs.id = vds.id
    WHERE vs.name IN (
        'GOOGLE_PLACES_API_KEY',
        'FOURSQUARE_API_KEY', 
        'HUNTER_IO_API_KEY',
        'ZEROBOUNCE_API_KEY',
        'NEVERBOUNCE_API_KEY',
        'SCRAPINGDOG_API_KEY',
        'APOLLO_API_KEY',
        'PERSONAL_ACCESS_TOKEN'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execution permission
GRANT EXECUTE ON FUNCTION get_vault_performance_stats() TO service_role;

-- Rollback procedures (commented out - uncomment if rollback needed)
/*
-- ROLLBACK SCRIPT (run manually if needed):
-- 1. Restore from backup
-- INSERT INTO app_secrets SELECT key, value, updated_at FROM app_secrets_backup WHERE backup_created_at = (SELECT MAX(backup_created_at) FROM app_secrets_backup);

-- 2. Drop vault objects
-- DROP VIEW IF EXISTS vault_secrets_summary;
-- DROP FUNCTION IF EXISTS get_vault_performance_stats();
-- DROP POLICY IF EXISTS "Service role can read vault secrets" ON vault.secrets;
-- DROP POLICY IF EXISTS "Service role can read decrypted secrets" ON vault.decrypted_secrets;

-- 3. Remove vault extension (be very careful!)
-- DROP EXTENSION IF EXISTS "vault";
*/