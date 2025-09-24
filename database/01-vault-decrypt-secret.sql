-- =====================================================
-- ProspectPro Vault Function 1: vault_decrypt_secret
-- =====================================================
-- Decrypt a single secret from Supabase Vault
-- Idempotent: Safe to run multiple times
-- Security: Hardened with SET search_path

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

-- Grant execution permission to service_role (idempotent)
GRANT EXECUTE ON FUNCTION vault_decrypt_secret(TEXT) TO service_role;

-- Add descriptive comment
COMMENT ON FUNCTION vault_decrypt_secret(TEXT) IS 'Decrypt a single secret from Supabase Vault - callable from Node.js applications with security hardening';