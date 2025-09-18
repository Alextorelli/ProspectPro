-- ProspectPro - Railway Webhook Hardening
-- Adds idempotency key and unique index to prevent duplicate webhook inserts
-- Safe to run multiple times (idempotent)

DO $$
BEGIN
  RAISE NOTICE '🔒 Webhook Hardening: Starting';
END $$;

-- 1) Add idempotency_key column if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'railway_webhook_logs'
      AND column_name = 'idempotency_key'
  ) THEN
    ALTER TABLE public.railway_webhook_logs
      ADD COLUMN idempotency_key TEXT;
    RAISE NOTICE '✅ Added column public.railway_webhook_logs.idempotency_key';
  ELSE
    RAISE NOTICE 'ℹ️ Column idempotency_key already exists';
  END IF;
END $$;

-- 2) Backfill idempotency_key for existing rows using a stable hash
--    Prefer deployment_id when present; otherwise hash of event_type + processed_at + payload
DO $$
DECLARE
  updated_count INTEGER := 0;
BEGIN
  UPDATE public.railway_webhook_logs AS r
  SET idempotency_key = COALESCE(
        NULLIF(r.deployment_id, ''),
        encode(
          digest(
            COALESCE(r.event_type, '') || '|' ||
            COALESCE(r.processed_at::text, '') || '|' ||
            COALESCE(r.event_data::text, ''),
            'sha256'
          ),
          'hex'
        )
      )
  WHERE r.idempotency_key IS NULL;

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE '🔧 Backfilled idempotency_key for % rows', updated_count;
END $$;

-- 3) Add unique index to enforce idempotency
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' AND indexname = 'ux_railway_webhook_idempotency'
  ) THEN
    CREATE UNIQUE INDEX ux_railway_webhook_idempotency
      ON public.railway_webhook_logs (idempotency_key);
    RAISE NOTICE '✅ Created unique index ux_railway_webhook_idempotency';
  ELSE
    RAISE NOTICE 'ℹ️ Unique index ux_railway_webhook_idempotency already exists';
  END IF;
END $$;

-- 4) Optional: tighten RLS to allow only service role inserts
--    Keep existing RLS enablement from Phase 5.
--    If a strict policy is desired, uncomment and run the following:
--
-- DO $$
-- BEGIN
--   IF NOT EXISTS (
--     SELECT 1 FROM pg_policies 
--     WHERE schemaname = 'public' AND tablename = 'railway_webhook_logs' AND policyname = 'service_role_insert_only'
--   ) THEN
--     CREATE POLICY "service_role_insert_only" ON public.railway_webhook_logs
--       FOR INSERT TO authenticated
--       WITH CHECK (auth.role() = 'service_role');
--     RAISE NOTICE '✅ Created policy service_role_insert_only on railway_webhook_logs';
--   END IF;
-- END $$;

DO $$
BEGIN
  RAISE NOTICE '🔒 Webhook Hardening: Complete';
END $$;
