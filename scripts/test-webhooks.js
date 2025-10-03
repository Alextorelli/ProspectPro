#!/usr/bin/env node

/**
 * ProspectPro Webhook Testing Script
 * Tests all three webhook endpoints after deployment
 */

const CLOUD_RUN_URL = process.argv[2];
const WEBHOOK_TOKEN = process.argv[3];

if (!CLOUD_RUN_URL || !WEBHOOK_TOKEN) {
  console.log("Usage: node test-webhooks.js <CLOUD_RUN_URL> <WEBHOOK_TOKEN>");
  console.log(
    "Example: node test-webhooks.js https://prospectpro-xyz-uc.a.run.app wh_abc123..."
  );
  process.exit(1);
}

async function testWebhook(endpoint, payload) {
  try {
    const response = await fetch(`${CLOUD_RUN_URL}/api/webhooks/${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${WEBHOOK_TOKEN}`,
      },
      body: JSON.stringify(payload),
    });

    const result = await response.text();
    console.log(`✅ ${endpoint}: ${response.status} - ${result}`);
    return true;
  } catch (error) {
    console.log(`❌ ${endpoint}: ${error.message}`);
    return false;
  }
}

async function runTests() {
  console.log("🧪 Testing ProspectPro Webhooks...\n");

  // Test campaign lifecycle webhook
  await testWebhook("campaign-lifecycle", {
    campaign_id: "test-123",
    event: "test",
    status: "active",
  });

  // Test cost alert webhook
  await testWebhook("cost-alert", {
    alert_type: "test",
    threshold: 100,
    current_spend: 50,
  });

  // Test lead enrichment webhook
  await testWebhook("lead-enrichment", {
    lead_id: "test-456",
    business_name: "Test Business",
    enrichment_status: "test",
  });

  console.log("\n✅ Webhook tests completed!");
}

runTests().catch(console.error);
