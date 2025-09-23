-- Create app_secrets table for centralized secret management
CREATE TABLE IF NOT EXISTS app_secrets (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW()
);
-- Enable RLS for security
ALTER TABLE app_secrets ENABLE ROW LEVEL SECURITY;
-- Only allow privileged service role to read
CREATE POLICY "Service role can read secrets" ON app_secrets
  FOR SELECT USING (auth.role() = 'service_role');
