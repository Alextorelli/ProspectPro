begin;
select plan(7);

-- Core ProspectPro tables must exist
SELECT has_table('public', 'campaigns', 'campaigns table should exist');
SELECT has_table('public', 'leads', 'leads table should exist');
SELECT has_table('public', 'dashboard_exports', 'dashboard_exports table should exist');

-- RLS must be enabled on user-facing tables
SELECT ok(
    (SELECT relrowsecurity FROM pg_class WHERE relname = 'campaigns' AND relnamespace = 'public'::regnamespace),
    'RLS enabled on campaigns'
);
SELECT ok(
    (SELECT relrowsecurity FROM pg_class WHERE relname = 'leads' AND relnamespace = 'public'::regnamespace),
    'RLS enabled on leads'
);
SELECT ok(
    (SELECT relrowsecurity FROM pg_class WHERE relname = 'dashboard_exports' AND relnamespace = 'public'::regnamespace),
    'RLS enabled on dashboard_exports'
);

-- Supporting objects
SELECT has_view('public', 'campaign_analytics', 'campaign_analytics view should exist');

select *
from finish();
rollback;
