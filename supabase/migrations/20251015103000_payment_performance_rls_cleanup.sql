-- =====================================================================
-- MIGRATION: Payment performance + RLS cleanup
-- Safe to run multiple times. Requires role with DDL privileges.
-- =====================================================================
-- 0) Optional safety: ensure schema exists (no-op if already there)
CREATE SCHEMA IF NOT EXISTS public;
-- 1) Create helper/FK indexes (idempotent)
-- Note: No CONCURRENTLY to avoid "cannot run inside a transaction block" in some runners.
DO $$ BEGIN -- payment_methods.user_id
IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
        AND indexname = 'idx_payment_methods_user_id'
) THEN EXECUTE 'CREATE INDEX IF NOT EXISTS idx_payment_methods_user_id ON public.payment_methods (user_id);';
END IF;
-- payment_transactions.campaign_id
IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
        AND indexname = 'idx_payment_transactions_campaign_id'
) THEN EXECUTE 'CREATE INDEX IF NOT EXISTS idx_payment_transactions_campaign_id ON public.payment_transactions (campaign_id);';
END IF;
-- payment_transactions.user_id
IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
        AND indexname = 'idx_payment_transactions_user_id'
) THEN EXECUTE 'CREATE INDEX IF NOT EXISTS idx_payment_transactions_user_id ON public.payment_transactions (user_id);';
END IF;
-- user_subscriptions.tier_id
IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
        AND indexname = 'idx_user_subscriptions_tier_id'
) THEN EXECUTE 'CREATE INDEX IF NOT EXISTS idx_user_subscriptions_tier_id ON public.user_subscriptions (tier_id);';
END IF;
-- user_subscriptions.user_id
IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
        AND indexname = 'idx_user_subscriptions_user_id'
) THEN EXECUTE 'CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON public.user_subscriptions (user_id);';
END IF;
END $$;
-- 2) Enable RLS (idempotent) for target tables
DO $$ BEGIN BEGIN EXECUTE 'ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;';
EXCEPTION
WHEN OTHERS THEN -- ignore if already enabled or insufficient privileges
NULL;
END;
BEGIN EXECUTE 'ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;';
EXCEPTION
WHEN OTHERS THEN NULL;
END;
BEGIN EXECUTE 'ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;';
EXCEPTION
WHEN OTHERS THEN NULL;
END;
END $$;
-- 3) Consolidated RLS policies
-- Pattern: authenticated users can access only their own rows via auth.uid()
-- Note: Use unique policy names and create if not exists via conditional checks.
-- payment_methods policies
DO $$ BEGIN -- SELECT
IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
        AND tablename = 'payment_methods'
        AND policyname = 'payment_methods_authenticated_select'
) THEN EXECUTE $p$ CREATE POLICY "payment_methods_authenticated_select" ON public.payment_methods FOR
SELECT TO authenticated USING (
        user_id = (
            SELECT auth.uid()
        )
    );
$p$;
END IF;
-- INSERT
IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
        AND tablename = 'payment_methods'
        AND policyname = 'payment_methods_authenticated_insert'
) THEN EXECUTE $p$ CREATE POLICY "payment_methods_authenticated_insert" ON public.payment_methods FOR
INSERT TO authenticated WITH CHECK (
        user_id = (
            SELECT auth.uid()
        )
    );
$p$;
END IF;
-- UPDATE
IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
        AND tablename = 'payment_methods'
        AND policyname = 'payment_methods_authenticated_update'
) THEN EXECUTE $p$ CREATE POLICY "payment_methods_authenticated_update" ON public.payment_methods FOR
UPDATE TO authenticated USING (
        user_id = (
            SELECT auth.uid()
        )
    ) WITH CHECK (
        user_id = (
            SELECT auth.uid()
        )
    );
$p$;
END IF;
-- DELETE
IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
        AND tablename = 'payment_methods'
        AND policyname = 'payment_methods_authenticated_delete'
) THEN EXECUTE $p$ CREATE POLICY "payment_methods_authenticated_delete" ON public.payment_methods FOR DELETE TO authenticated USING (
    user_id = (
        SELECT auth.uid()
    )
);
$p$;
END IF;
END $$;
-- payment_transactions policies
DO $$ BEGIN -- SELECT
IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
        AND tablename = 'payment_transactions'
        AND policyname = 'payment_tx_authenticated_select'
) THEN EXECUTE $p$ CREATE POLICY "payment_tx_authenticated_select" ON public.payment_transactions FOR
SELECT TO authenticated USING (
        user_id = (
            SELECT auth.uid()
        )
    );
$p$;
END IF;
-- INSERT
IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
        AND tablename = 'payment_transactions'
        AND policyname = 'payment_tx_authenticated_insert'
) THEN EXECUTE $p$ CREATE POLICY "payment_tx_authenticated_insert" ON public.payment_transactions FOR
INSERT TO authenticated WITH CHECK (
        user_id = (
            SELECT auth.uid()
        )
    );
$p$;
END IF;
-- UPDATE
IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
        AND tablename = 'payment_transactions'
        AND policyname = 'payment_tx_authenticated_update'
) THEN EXECUTE $p$ CREATE POLICY "payment_tx_authenticated_update" ON public.payment_transactions FOR
UPDATE TO authenticated USING (
        user_id = (
            SELECT auth.uid()
        )
    ) WITH CHECK (
        user_id = (
            SELECT auth.uid()
        )
    );
$p$;
END IF;
-- DELETE
IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
        AND tablename = 'payment_transactions'
        AND policyname = 'payment_tx_authenticated_delete'
) THEN EXECUTE $p$ CREATE POLICY "payment_tx_authenticated_delete" ON public.payment_transactions FOR DELETE TO authenticated USING (
    user_id = (
        SELECT auth.uid()
    )
);
$p$;
END IF;
END $$;
-- user_subscriptions policies
DO $$ BEGIN -- SELECT
IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
        AND tablename = 'user_subscriptions'
        AND policyname = 'user_subs_authenticated_select'
) THEN EXECUTE $p$ CREATE POLICY "user_subs_authenticated_select" ON public.user_subscriptions FOR
SELECT TO authenticated USING (
        user_id = (
            SELECT auth.uid()
        )
    );
$p$;
END IF;
-- INSERT
IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
        AND tablename = 'user_subscriptions'
        AND policyname = 'user_subs_authenticated_insert'
) THEN EXECUTE $p$ CREATE POLICY "user_subs_authenticated_insert" ON public.user_subscriptions FOR
INSERT TO authenticated WITH CHECK (
        user_id = (
            SELECT auth.uid()
        )
    );
$p$;
END IF;
-- UPDATE
IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
        AND tablename = 'user_subscriptions'
        AND policyname = 'user_subs_authenticated_update'
) THEN EXECUTE $p$ CREATE POLICY "user_subs_authenticated_update" ON public.user_subscriptions FOR
UPDATE TO authenticated USING (
        user_id = (
            SELECT auth.uid()
        )
    ) WITH CHECK (
        user_id = (
            SELECT auth.uid()
        )
    );
$p$;
END IF;
-- DELETE
IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
        AND tablename = 'user_subscriptions'
        AND policyname = 'user_subs_authenticated_delete'
) THEN EXECUTE $p$ CREATE POLICY "user_subs_authenticated_delete" ON public.user_subscriptions FOR DELETE TO authenticated USING (
    user_id = (
        SELECT auth.uid()
    )
);
$p$;
END IF;
END $$;
-- 4) Drop redundant/duplicate policies (if you had older ones)
-- Replace the names below with the exact legacy policy names to remove.
-- Safe-guarded to only drop if they exist.
DO $$
DECLARE rec RECORD;
BEGIN FOR rec IN
SELECT schemaname,
    tablename,
    policyname
FROM pg_policies
WHERE schemaname = 'public'
    AND tablename IN (
        'payment_methods',
        'payment_transactions',
        'user_subscriptions'
    )
    AND policyname IN (
        -- Add legacy policy names to drop here:
        'old_payment_methods_select',
        'old_payment_methods_insert',
        'old_payment_methods_update',
        'old_payment_methods_delete',
        'old_payment_tx_select',
        'old_payment_tx_insert',
        'old_payment_tx_update',
        'old_payment_tx_delete',
        'old_user_subs_select',
        'old_user_subs_insert',
        'old_user_subs_update',
        'old_user_subs_delete'
    ) LOOP EXECUTE format(
        'DROP POLICY IF EXISTS %I ON %I.%I;',
        rec.policyname,
        rec.schemaname,
        rec.tablename
    );
END LOOP;
END $$;
-- 5) Drop duplicate/unused indexes (if applicable)
-- Replace with the exact duplicate index names you want to remove.
DO $$ BEGIN -- Example placeholders; update to actual duplicates if any:
IF EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
        AND indexname = 'payment_methods_user_id_idx_old'
) THEN EXECUTE 'DROP INDEX IF EXISTS public.payment_methods_user_id_idx_old;';
END IF;
IF EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
        AND indexname = 'payment_transactions_campaign_id_idx_old'
) THEN EXECUTE 'DROP INDEX IF EXISTS public.payment_transactions_campaign_id_idx_old;';
END IF;
IF EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
        AND indexname = 'user_subscriptions_user_id_idx_old'
) THEN EXECUTE 'DROP INDEX IF EXISTS public.user_subscriptions_user_id_idx_old;';
END IF;
END $$;
-- 6) Analyze updated tables to refresh planner stats
ANALYZE public.payment_methods;
ANALYZE public.payment_transactions;
ANALYZE public.user_subscriptions;
-- =====================================================================
-- END MIGRATION
-- =====================================================================