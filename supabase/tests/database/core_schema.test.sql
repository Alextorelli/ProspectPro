begin;
select plan(8);

-- Core ProspectPro tables must exist
SELECT has_table('public', 'campaigns', 'campaigns table should exist');
SELECT has_table('public', 'leads', 'leads table should exist');
SELECT has_table('public', 'dashboard_exports', 'dashboard_exports table should exist');

-- RLS must be enabled on user-facing tables
SELECT row_security_on('public', 'campaigns');
SELECT row_security_on('public', 'leads');
SELECT row_security_on('public', 'dashboard_exports');

-- Supporting objects
SELECT has_view('public', 'campaign_analytics', 'campaign_analytics view should exist');
SELECT has_index('public', 'campaigns', 'idx_campaigns_user_id');

select *
from finish();
rollback;
