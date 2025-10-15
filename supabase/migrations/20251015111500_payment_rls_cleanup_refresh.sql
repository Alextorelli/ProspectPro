-- =====================================================================
-- MIGRATION: Payment performance RLS refresh (idempotent)
-- Purpose: enforce canonical indexes + RLS policies for payment tables
-- =====================================================================
-- 1) Ensure supporting indexes exist (idempotent)
CREATE INDEX IF NOT EXISTS idx_payment_methods_user_id ON public.payment_methods (user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_campaign_id ON public.payment_transactions (campaign_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_user_id ON public.payment_transactions (user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_tier_id ON public.user_subscriptions (tier_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON public.user_subscriptions (user_id);
-- 2) Enforce row level security on target tables
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods FORCE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions FORCE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions FORCE ROW LEVEL SECURITY;
-- 3) Remove legacy/duplicate policies so canonical ones can be applied cleanly
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
        'Users can view own payment methods',
        'Users can insert own payment methods',
        'Users can update own payment methods',
        'Users can delete own payment methods',
        'Users can view own transactions',
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
-- 4) Upsert canonical policies for each table
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
        AND tablename = 'payment_methods'
        AND policyname = 'payment_methods_authenticated_select'
) THEN EXECUTE 'CREATE POLICY payment_methods_authenticated_select ON public.payment_methods FOR SELECT TO authenticated USING (user_id = auth.uid())';
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
        AND tablename = 'payment_methods'
        AND policyname = 'payment_methods_authenticated_insert'
) THEN EXECUTE 'CREATE POLICY payment_methods_authenticated_insert ON public.payment_methods FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid())';
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
        AND tablename = 'payment_methods'
        AND policyname = 'payment_methods_authenticated_update'
) THEN EXECUTE 'CREATE POLICY payment_methods_authenticated_update ON public.payment_methods FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid())';
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
        AND tablename = 'payment_methods'
        AND policyname = 'payment_methods_authenticated_delete'
) THEN EXECUTE 'CREATE POLICY payment_methods_authenticated_delete ON public.payment_methods FOR DELETE TO authenticated USING (user_id = auth.uid())';
END IF;
END $$;
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
        AND tablename = 'payment_transactions'
        AND policyname = 'payment_tx_authenticated_select'
) THEN EXECUTE 'CREATE POLICY payment_tx_authenticated_select ON public.payment_transactions FOR SELECT TO authenticated USING (user_id = auth.uid())';
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
        AND tablename = 'payment_transactions'
        AND policyname = 'payment_tx_authenticated_insert'
) THEN EXECUTE 'CREATE POLICY payment_tx_authenticated_insert ON public.payment_transactions FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid())';
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
        AND tablename = 'payment_transactions'
        AND policyname = 'payment_tx_authenticated_update'
) THEN EXECUTE 'CREATE POLICY payment_tx_authenticated_update ON public.payment_transactions FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid())';
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
        AND tablename = 'payment_transactions'
        AND policyname = 'payment_tx_authenticated_delete'
) THEN EXECUTE 'CREATE POLICY payment_tx_authenticated_delete ON public.payment_transactions FOR DELETE TO authenticated USING (user_id = auth.uid())';
END IF;
END $$;
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
        AND tablename = 'user_subscriptions'
        AND policyname = 'user_subs_authenticated_select'
) THEN EXECUTE 'CREATE POLICY user_subs_authenticated_select ON public.user_subscriptions FOR SELECT TO authenticated USING (user_id = auth.uid())';
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
        AND tablename = 'user_subscriptions'
        AND policyname = 'user_subs_authenticated_insert'
) THEN EXECUTE 'CREATE POLICY user_subs_authenticated_insert ON public.user_subscriptions FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid())';
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
        AND tablename = 'user_subscriptions'
        AND policyname = 'user_subs_authenticated_update'
) THEN EXECUTE 'CREATE POLICY user_subs_authenticated_update ON public.user_subscriptions FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid())';
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
        AND tablename = 'user_subscriptions'
        AND policyname = 'user_subs_authenticated_delete'
) THEN EXECUTE 'CREATE POLICY user_subs_authenticated_delete ON public.user_subscriptions FOR DELETE TO authenticated USING (user_id = auth.uid())';
END IF;
END $$;
-- 5) Remove placeholder/legacy indexes if they still linger
DROP INDEX IF EXISTS public.payment_methods_user_id_idx_old;
DROP INDEX IF EXISTS public.payment_transactions_campaign_id_idx_old;
DROP INDEX IF EXISTS public.payment_transactions_user_id_idx_old;
DROP INDEX IF EXISTS public.user_subscriptions_user_id_idx_old;
-- 6) Refresh planner statistics for updated tables
ANALYZE public.payment_methods;
ANALYZE public.payment_transactions;
ANALYZE public.user_subscriptions;
-- 7) Diagnostics message
DO $$ BEGIN RAISE NOTICE '✅ Payment RLS refresh complete: indexes, policies, and FORCE RLS applied.';
END $$;