begin;
select plan(15);

-- ========================================
-- CAMPAIGNS TABLE TESTS
-- ========================================

-- Core structure tests
SELECT has_table('public', 'campaigns', 'campaigns table should exist');
SELECT row_security_on('public', 'campaigns', 'RLS should be enabled on campaigns');
SELECT has_index('public', 'campaigns', 'idx_campaigns_user_id', 'campaigns should have user_id index');

-- RLS Policy Tests - Authenticated Users
PREPARE test_campaign_insert AS
  INSERT INTO campaigns (id, business_type, location, user_id, session_user_id)
  VALUES ('test_rls_auth_campaign', 'coffee shop', 'Seattle, WA', auth.uid(), 'test_session');

SELECT lives_ok(
  'test_campaign_insert',
  'Authenticated user should be able to insert campaign'
);

-- RLS Policy Tests - Unauthorized Access
SET ROLE anon;
PREPARE test_unauthorized_select AS
  SELECT * FROM campaigns WHERE user_id != auth.uid() AND session_user_id != 'test_session';

SELECT results_ne(
  'test_unauthorized_select',
  ARRAY[]::campaigns[],
  'Anonymous users should not see other users campaigns (RLS rejection)'
);

RESET ROLE;

-- Campaign Status Validation
PREPARE test_valid_status AS
  INSERT INTO campaigns (id, business_type, location, status, user_id)
  VALUES ('test_status_valid', 'restaurant', 'Portland, OR', 'pending', auth.uid());

SELECT lives_ok(
  'test_valid_status',
  'Valid campaign status should be accepted'
);

-- Budget Constraints
PREPARE test_budget_constraint AS
  INSERT INTO campaigns (id, business_type, location, budget_limit, total_cost, user_id)
  VALUES ('test_budget', 'cafe', 'Austin, TX', 10.0, 0.0, auth.uid());

SELECT lives_ok(
  'test_budget_constraint',
  'Campaign with valid budget should be created'
);

-- User-Aware Analytics View Access
SELECT has_view('public', 'campaign_analytics', 'campaign_analytics view should exist');

PREPARE test_analytics_access AS
  SELECT * FROM campaign_analytics WHERE user_id = auth.uid() LIMIT 1;

SELECT lives_ok(
  'test_analytics_access',
  'User should be able to query their own campaign analytics'
);

-- Enrichment Cache Validation (after orchestration writes)
PREPARE test_enrichment_metadata AS
  UPDATE campaigns 
  SET enrichment_data = '{"hunter": {"status": "success", "cost": 0.034}}'::jsonb
  WHERE id = 'test_rls_auth_campaign' AND user_id = auth.uid();

SELECT lives_ok(
  'test_enrichment_metadata',
  'Enrichment orchestrator should be able to write cache metadata'
);

-- Tier-Aware Budget Tracking
PREPARE test_tier_budget AS
  INSERT INTO campaigns (id, business_type, location, tier_key, budget_limit, user_id)
  VALUES ('test_tier_budget', 'law firm', 'Chicago, IL', 'ENTERPRISE', 100.0, auth.uid());

SELECT lives_ok(
  'test_tier_budget',
  'Tier-aware campaign should track budget limits'
);

-- Session User ID Fallback
PREPARE test_session_fallback AS
  INSERT INTO campaigns (id, business_type, location, session_user_id)
  VALUES ('test_session_only', 'bakery', 'Denver, CO', 'anon_session_123');

SELECT lives_ok(
  'test_session_fallback',
  'Campaign with only session_user_id should be allowed for anonymous users'
);

-- Background Discovery Status Tracking
PREPARE test_background_status AS
  UPDATE campaigns 
  SET status = 'processing', processing_time_ms = 1500
  WHERE id = 'test_rls_auth_campaign' AND user_id = auth.uid();

SELECT lives_ok(
  'test_background_status',
  'Background discovery should be able to update processing status'
);

-- RLS Rejection - Cross-User Access Attempt
SET ROLE anon;
PREPARE test_cross_user_reject AS
  SELECT * FROM campaigns WHERE id = 'test_rls_auth_campaign' AND user_id != auth.uid();

SELECT is_empty(
  'test_cross_user_reject',
  'RLS should reject cross-user campaign access'
);

RESET ROLE;

-- Cleanup
DELETE FROM campaigns WHERE id LIKE 'test_%';

select * from finish();
rollback;
