-- =====================================================
-- ProspectPro Vault Function 2: vault_decrypt_multiple_secrets
-- =====================================================
-- Decrypt multiple secrets from Supabase Vault in a single query
-- Idempotent: Safe to run multiple times
-- Security: Hardened with SET search_path

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

-- Grant execution permission to service_role (idempotent)
GRANT EXECUTE ON FUNCTION vault_decrypt_multiple_secrets(TEXT[]) TO service_role;

-- Add descriptive comment
COMMENT ON FUNCTION vault_decrypt_multiple_secrets(TEXT[]) IS 'Decrypt multiple secrets from Supabase Vault in a single query with security hardening';