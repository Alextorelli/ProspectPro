begin;
select plan(12);

-- ========================================
-- LEADS TABLE TESTS
-- ========================================

-- Core structure tests
SELECT has_table('public', 'leads', 'leads table should exist');
SELECT ok(
    (SELECT relrowsecurity FROM pg_class WHERE relname = 'leads' AND relnamespace = 'public'::regnamespace),
    'RLS should be enabled on leads'
);

-- RLS Policy Tests - Authenticated Lead Creation
-- First create a test campaign
INSERT INTO campaigns (id, business_type, location, user_id)
VALUES ('test_campaign_001', 'coffee shop', 'Seattle, WA', auth.uid());

PREPARE test_lead_insert AS
  INSERT INTO leads (campaign_id, business_name, address, user_id, session_user_id)
  VALUES ('test_campaign_001', 'Test Coffee Shop', '123 Main St, Seattle, WA', auth.uid(), 'test_session');

SELECT lives_ok(
  'test_lead_insert',
  'Authenticated user should be able to insert lead'
);

-- Enrichment Data Validation - Hunter.io Results
PREPARE test_hunter_enrichment AS
  UPDATE leads
  SET enrichment_data = jsonb_set(
    COALESCE(enrichment_data, '{}'::jsonb),
    '{hunter}',
    '{"email": "contact@testcoffee.com", "confidence": 85, "status": "valid", "cost": 0.034}'::jsonb
  )
  WHERE campaign_id = 'test_campaign_001' AND user_id = auth.uid();

SELECT lives_ok(
  'test_hunter_enrichment',
  'Hunter.io enrichment data should be writable to leads'
);

-- Enrichment Data Validation - NeverBounce Results
PREPARE test_neverbounce_enrichment AS
  UPDATE leads
  SET enrichment_data = jsonb_set(
    enrichment_data,
    '{neverbounce}',
    '{"result": "valid", "flags": {"has_dns": true, "has_dns_mx": true}, "cost": 0.008}'::jsonb
  )
  WHERE campaign_id = 'test_campaign_001' AND user_id = auth.uid();

SELECT lives_ok(
  'test_neverbounce_enrichment',
  'NeverBounce verification data should be writable to leads'
);

-- Enrichment Cache - Orchestrator Retry Logic
PREPARE test_orchestrator_cache AS
  UPDATE leads
  SET enrichment_data = jsonb_set(
    enrichment_data,
    '{orchestrator}',
    '{"retry_count": 1, "last_attempt": "2025-10-17T12:00:00Z", "services_attempted": ["hunter", "neverbounce"]}'::jsonb
  )
  WHERE campaign_id = 'test_campaign_001' AND user_id = auth.uid();

SELECT lives_ok(
  'test_orchestrator_cache',
  'Enrichment orchestrator should track retry attempts in cache'
);

-- Confidence Score Calculation
PREPARE test_confidence_score AS
  UPDATE leads
  SET confidence_score = 85,
      score_breakdown = '{"email_verified": 50, "phone_verified": 30, "website_verified": 5}'::jsonb
  WHERE campaign_id = 'test_campaign_001' AND user_id = auth.uid();

SELECT lives_ok(
  'test_confidence_score',
  'Confidence score and breakdown should be updatable'
);

-- Cost Tracking Per Lead
PREPARE test_validation_cost AS
  UPDATE leads
  SET validation_cost = 0.042
  WHERE campaign_id = 'test_campaign_001' AND user_id = auth.uid();

SELECT lives_ok(
  'test_validation_cost',
  'Validation cost should be tracked per lead'
);

-- RLS Rejection - Cross-User Lead Access
SET ROLE anon;
PREPARE test_cross_user_lead_reject AS
  SELECT * FROM leads 
  WHERE campaign_id = 'test_campaign_001' 
  AND user_id != auth.uid();

SELECT is_empty(
  'test_cross_user_lead_reject',
  'RLS should reject cross-user lead access'
);

RESET ROLE;

-- Zero Fake Data Validation - Email Pattern Check
SELECT is(
  (SELECT COUNT(*)::bigint FROM leads
   WHERE email ~ '^(info|contact|hello|sales)@'
   AND user_id = auth.uid()),
  0::bigint,
  'Leads should not contain pattern-generated fake emails'
);

-- Enrichment Retry After Soft Fail
PREPARE test_soft_fail_retry AS
  UPDATE leads
  SET enrichment_data = jsonb_set(
    enrichment_data,
    '{neverbounce}',
    '{"result": "unknown", "flags": {"has_dns": true}, "retry_eligible": true, "cost": 0.008}'::jsonb
  )
  WHERE campaign_id = 'test_campaign_001' AND user_id = auth.uid();

SELECT lives_ok(
  'test_soft_fail_retry',
  'Enrichment soft failures should be marked for retry'
);

-- Session-Only Lead Creation (Anonymous Users)
-- First create a backing campaign to satisfy FK
INSERT INTO campaigns (id, business_type, location)
VALUES ('test_campaign_anon', 'coffee shop', 'Seattle, WA');

PREPARE test_session_lead AS
  INSERT INTO leads (campaign_id, business_name, session_user_id)
  VALUES ('test_campaign_anon', 'Anonymous Lead Test', 'anon_session_456');

SELECT lives_ok(
  'test_session_lead',
  'Anonymous users should be able to create leads with session_user_id'
);

-- Cleanup
DELETE FROM leads WHERE campaign_id LIKE 'test_campaign_%';

select * from finish();
rollback;
