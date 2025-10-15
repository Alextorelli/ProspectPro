begin;
select plan(8);
-- Test core tables exist
SELECT has_table(
        'public',
        'payment_methods',
        'payment_methods table should exist'
    );
SELECT has_table(
        'public',
        'payment_transactions',
        'payment_transactions table should exist'
    );
SELECT has_table(
        'public',
        'user_subscriptions',
        'user_subscriptions table should exist'
    );
-- Test RLS is enabled
SELECT row_security_on('public', 'payment_methods');
SELECT row_security_on('public', 'payment_transactions');
SELECT row_security_on('public', 'user_subscriptions');
-- Test key policies exist
SELECT policies_are(
        'public',
        'payment_methods',
        ARRAY ['payment_methods_authenticated_select', 'payment_methods_authenticated_insert']
    );
-- Test indexes exist for performance
SELECT has_index(
        'public',
        'payment_methods',
        'idx_payment_methods_user_id'
    );
select *
from finish();
rollback;