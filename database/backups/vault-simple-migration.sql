-- Simple Vault-only Migration for ProspectPro
-- Enable Supabase Vault Extension for Enhanced Secret Management

-- Enable the vault extension
CREATE EXTENSION IF NOT EXISTS "vault" WITH SCHEMA "vault";

-- Create standard API key secrets in vault 
-- Note: These will be created with placeholder values - update via dashboard
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
    placeholder_value TEXT := 'UPDATE_VIA_SUPABASE_DASHBOARD';
BEGIN
    FOREACH secret_name IN ARRAY secret_names LOOP
        BEGIN
            SELECT vault.create_secret(
                placeholder_value,
                secret_name,
                'ProspectPro API Key - ' || secret_name
            ) INTO vault_secret_id;
            
            RAISE NOTICE 'Created vault secret: %', secret_name;
        EXCEPTION 
            WHEN unique_violation THEN
                RAISE NOTICE 'Secret % already exists in vault', secret_name;
            WHEN OTHERS THEN
                RAISE WARNING 'Failed to create secret %: %', secret_name, SQLERRM;
        END;
    END LOOP;
END $$;

-- Create a simple view to check vault secrets
CREATE OR REPLACE VIEW vault_secrets_status AS
SELECT 
    s.name,
    s.description,
    s.created_at,
    CASE 
        WHEN ds.decrypted_secret = 'UPDATE_VIA_SUPABASE_DASHBOARD' THEN 'NEEDS_UPDATE'
        WHEN ds.decrypted_secret IS NOT NULL THEN 'SET'
        ELSE 'NOT_SET'
    END as status
FROM vault.secrets s
LEFT JOIN vault.decrypted_secrets ds ON s.id = ds.id
WHERE s.name LIKE '%API_KEY%' OR s.name = 'PERSONAL_ACCESS_TOKEN'
ORDER BY s.name;