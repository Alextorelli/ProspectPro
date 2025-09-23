/**
 * Database Migration Script for Supabase Vault
 * Run this script in the Supabase SQL Editor to enable Vault functionality
 * 
 * ProspectPro - Secrets Management Migration
 */

-- Step 1: Enable Vault Extension
CREATE EXTENSION IF NOT EXISTS "vault" WITH SCHEMA "vault";

-- Step 2: Create ProspectPro API secrets
DO $$
DECLARE
    secret_configs RECORD[] := ARRAY[
        ROW('GOOGLE_PLACES_API_KEY', 'Google Places API key for business discovery'),
        ROW('FOURSQUARE_API_KEY', 'Foursquare API key for location enrichment'),
        ROW('HUNTER_IO_API_KEY', 'Hunter.io API key for email discovery'),
        ROW('ZEROBOUNCE_API_KEY', 'ZeroBounce API key for email validation'),
        ROW('NEVERBOUNCE_API_KEY', 'NeverBounce API key for email validation'),
        ROW('SCRAPINGDOG_API_KEY', 'ScrapingDog API key for web scraping'),
        ROW('APOLLO_API_KEY', 'Apollo.io API key for contact enrichment'),
        ROW('PERSONAL_ACCESS_TOKEN', 'Personal access token for admin functions')
    ];
    config RECORD;
    vault_secret_id UUID;
    placeholder_value TEXT := 'CONFIGURE_IN_SUPABASE_DASHBOARD';
BEGIN
    FOREACH config IN ARRAY secret_configs LOOP
        BEGIN
            SELECT vault.create_secret(
                placeholder_value,
                config.f1,  -- secret name
                config.f2   -- description
            ) INTO vault_secret_id;
            
            RAISE NOTICE 'Created vault secret: % (ID: %)', config.f1, vault_secret_id;
        EXCEPTION 
            WHEN unique_violation THEN
                RAISE NOTICE 'Vault secret % already exists, skipping', config.f1;
            WHEN OTHERS THEN
                RAISE WARNING 'Failed to create vault secret %: %', config.f1, SQLERRM;
        END;
    END LOOP;
END $$;

-- Step 3: Create helper view for secret management
CREATE OR REPLACE VIEW vault_secrets_management AS
SELECT 
    s.name,
    s.description,
    s.created_at,
    s.updated_at,
    CASE 
        WHEN ds.decrypted_secret = 'CONFIGURE_IN_SUPABASE_DASHBOARD' THEN 'NEEDS_CONFIG'
        WHEN ds.decrypted_secret IS NOT NULL AND LENGTH(ds.decrypted_secret) > 10 THEN 'CONFIGURED'
        WHEN ds.decrypted_secret IS NOT NULL THEN 'SET_BUT_SHORT'
        ELSE 'NOT_SET'
    END as configuration_status,
    CASE 
        WHEN ds.decrypted_secret IS NOT NULL THEN 
            LEFT(ds.decrypted_secret, 8) || '...' || RIGHT(ds.decrypted_secret, 2)
        ELSE 'Not configured'
    END as value_preview
FROM vault.secrets s
LEFT JOIN vault.decrypted_secrets ds ON s.id = ds.id
WHERE s.name IN (
    'GOOGLE_PLACES_API_KEY',
    'FOURSQUARE_API_KEY', 
    'HUNTER_IO_API_KEY',
    'ZEROBOUNCE_API_KEY',
    'NEVERBOUNCE_API_KEY',
    'SCRAPINGDOG_API_KEY',
    'APOLLO_API_KEY',
    'PERSONAL_ACCESS_TOKEN'
)
ORDER BY s.name;

-- Step 4: Grant necessary permissions
GRANT SELECT ON vault_secrets_management TO service_role;
GRANT USAGE ON SCHEMA vault TO service_role;
GRANT SELECT ON vault.decrypted_secrets TO service_role;

-- Step 5: Verification query (check results)
SELECT 
    COUNT(*) as total_secrets_created,
    COUNT(CASE WHEN configuration_status = 'CONFIGURED' THEN 1 END) as configured_secrets,
    COUNT(CASE WHEN configuration_status = 'NEEDS_CONFIG' THEN 1 END) as needs_config
FROM vault_secrets_management;

-- Success message
SELECT 'Vault setup complete! Configure secrets via Supabase Dashboard.' as status;