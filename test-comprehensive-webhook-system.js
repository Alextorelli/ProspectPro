#!/usr/bin/env node

/**
 * Comprehensive Webhook System Test
 * Tests all three Supabase webhook implementations:
 * 1. Lead Enrichment Webhooks (database/09-lead-processing-webhooks.sql)
 * 2. Cost Alert Webhooks (database/10-cost-monitoring-webhooks.sql)
 * 3. Campaign Lifecycle Webhooks (database/11-campaign-webhooks.sql)
 */

require("dotenv").config();

const { createClient } = require("@supabase/supabase-js");
const fetch = require("node-fetch");

class WebhookSystemTester {
  constructor() {
    // Initialize Supabase client
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Webhook endpoints
    this.webhookBaseUrl =
      process.env.WEBHOOK_BASE_URL || "http://localhost:3000";
    this.webhookToken =
      process.env.WEBHOOK_AUTH_TOKEN || process.env.PERSONAL_ACCESS_TOKEN;

    // Test configuration
    this.testResults = {
      leadEnrichment: { passed: 0, failed: 0, tests: [] },
      costAlert: { passed: 0, failed: 0, tests: [] },
      campaignLifecycle: { passed: 0, failed: 0, tests: [] },
      overall: { passed: 0, failed: 0 },
    };
  }

  log(message, level = "info") {
    const timestamp = new Date().toISOString();
    const prefix =
      {
        info: "📝",
        success: "✅",
        error: "❌",
        warning: "⚠️",
      }[level] || "📝";

    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async runTest(testName, testFn, category) {
    try {
      this.log(`Running test: ${testName}`, "info");
      const result = await testFn();

      this.testResults[category].passed++;
      this.testResults[category].tests.push({
        name: testName,
        status: "passed",
        result,
      });
      this.log(`Test passed: ${testName}`, "success");

      return result;
    } catch (error) {
      this.testResults[category].failed++;
      this.testResults[category].tests.push({
        name: testName,
        status: "failed",
        error: error.message,
      });
      this.log(`Test failed: ${testName} - ${error.message}`, "error");
      throw error;
    }
  }

  // Test 1: Lead Enrichment Webhook System
  async testLeadEnrichmentWebhooks() {
    this.log("🔍 Testing Lead Enrichment Webhook System", "info");

    // Test 1.1: Webhook endpoint health
    await this.runTest(
      "Lead enrichment webhook health check",
      async () => {
        const response = await fetch(
          `${this.webhookBaseUrl}/api/webhooks/lead-enrichment/health`
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(`Health check failed: ${response.status}`);
        }

        return { status: data.status, integrations: data.integrations };
      },
      "leadEnrichment"
    );

    // Test 1.2: Create test lead and trigger enrichment webhook
    await this.runTest(
      "Lead enrichment database trigger",
      async () => {
        // Insert test lead to trigger webhook
        const testLead = {
          business_name: `Test Webhook Business ${Date.now()}`,
          address: "123 Test Street, Test City, CA 90210",
          phone: "(555) 123-4567",
          website: "https://example.com",
          email: "test@example.com",
          confidence_score: 85,
          source: "webhook_test",
          campaign_id: 1,
          enrichment_stage: "stage1",
          is_qualified: false,
        };

        const { data, error } = await this.supabase
          .from("enhanced_leads")
          .insert(testLead)
          .select()
          .single();

        if (error) throw error;

        // Wait for webhook processing
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Check webhook log
        const { data: webhookLogs } = await this.supabase
          .from("webhook_logs")
          .select("*")
          .eq("trigger_table", "enhanced_leads")
          .eq("record_id", data.id)
          .order("created_at", { ascending: false })
          .limit(1);

        return {
          leadId: data.id,
          webhookTriggered: webhookLogs?.length > 0,
          webhookStatus: webhookLogs?.[0]?.status,
        };
      },
      "leadEnrichment"
    );

    // Test 1.3: Lead status update webhook
    await this.runTest(
      "Lead status update webhook",
      async () => {
        // Get existing test lead
        const { data: leads } = await this.supabase
          .from("enhanced_leads")
          .select("id")
          .eq("source", "webhook_test")
          .limit(1);

        if (!leads?.length) {
          throw new Error("No test lead found");
        }

        const leadId = leads[0].id;

        // Update lead status to trigger webhook
        const { error } = await this.supabase
          .from("enhanced_leads")
          .update({
            enrichment_stage: "stage2",
            is_qualified: true,
            confidence_score: 95,
          })
          .eq("id", leadId);

        if (error) throw error;

        // Wait for webhook processing
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Check webhook log for status update
        const { data: webhookLogs } = await this.supabase
          .from("webhook_logs")
          .select("*")
          .eq("trigger_table", "enhanced_leads")
          .eq("record_id", leadId)
          .eq("webhook_type", "lead_status_update")
          .order("created_at", { ascending: false })
          .limit(1);

        return {
          leadId,
          statusUpdateWebhook: webhookLogs?.length > 0,
          webhookStatus: webhookLogs?.[0]?.status,
        };
      },
      "leadEnrichment"
    );
  }

  // Test 2: Cost Alert Webhook System
  async testCostAlertWebhooks() {
    this.log("💰 Testing Cost Alert Webhook System", "info");

    // Test 2.1: Cost alert webhook health
    await this.runTest(
      "Cost alert webhook health check",
      async () => {
        const response = await fetch(
          `${this.webhookBaseUrl}/api/webhooks/cost-alert/health`
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(`Health check failed: ${response.status}`);
        }

        return { status: data.status, integrations: data.integrations };
      },
      "costAlert"
    );

    // Test 2.2: Add high-cost API call to trigger daily spend alert
    await this.runTest(
      "Daily spend threshold alert",
      async () => {
        // Insert high-cost API call to trigger daily spend alert ($50 threshold)
        const { error } = await this.supabase.from("api_costs").insert({
          api_name: "test_api_webhook",
          endpoint: "test_daily_spend",
          cost: 55.0, // Above $50 daily threshold
          currency: "USD",
          campaign_id: 1,
          request_details: { test_type: "daily_spend_alert" },
          created_at: new Date(),
        });

        if (error) throw error;

        // Wait for webhook processing
        await new Promise((resolve) => setTimeout(resolve, 3000));

        // Check cost alert history
        const { data: alerts } = await this.supabase
          .from("cost_alert_history")
          .select("*")
          .eq("alert_type", "daily_spend")
          .order("created_at", { ascending: false })
          .limit(1);

        return {
          alertTriggered: alerts?.length > 0,
          alertStatus: alerts?.[0]?.alert_status,
          thresholdValue: alerts?.[0]?.threshold_value,
        };
      },
      "costAlert"
    );

    // Test 2.3: Test cost per lead alert
    await this.runTest(
      "Cost per lead threshold alert",
      async () => {
        // Insert expensive lead cost
        const { data: lead } = await this.supabase
          .from("enhanced_leads")
          .select("id")
          .limit(1)
          .single();

        if (!lead) throw new Error("No test lead available");

        // Insert high cost per lead ($0.30 vs $0.25 threshold)
        const { error } = await this.supabase.from("api_costs").insert({
          api_name: "test_api_webhook",
          endpoint: "test_cost_per_lead",
          cost: 0.3, // Above $0.25 per lead threshold
          currency: "USD",
          campaign_id: 1,
          lead_id: lead.id,
          request_details: { test_type: "cost_per_lead_alert" },
          created_at: new Date(),
        });

        if (error) throw error;

        // Wait for webhook processing
        await new Promise((resolve) => setTimeout(resolve, 3000));

        // Check cost alert history
        const { data: alerts } = await this.supabase
          .from("cost_alert_history")
          .select("*")
          .eq("alert_type", "cost_per_lead")
          .order("created_at", { ascending: false })
          .limit(1);

        return {
          alertTriggered: alerts?.length > 0,
          alertStatus: alerts?.[0]?.alert_status,
          leadId: lead.id,
        };
      },
      "costAlert"
    );
  }

  // Test 3: Campaign Lifecycle Webhook System
  async testCampaignLifecycleWebhooks() {
    this.log("📋 Testing Campaign Lifecycle Webhook System", "info");

    // Test 3.1: Campaign lifecycle webhook health
    await this.runTest(
      "Campaign lifecycle webhook health check",
      async () => {
        const response = await fetch(
          `${this.webhookBaseUrl}/api/webhooks/campaign-lifecycle/health`
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(`Health check failed: ${response.status}`);
        }

        return { status: data.status, integrations: data.integrations };
      },
      "campaignLifecycle"
    );

    let testCampaignId;

    // Test 3.2: Campaign creation webhook
    await this.runTest(
      "Campaign creation webhook trigger",
      async () => {
        // Create test campaign
        const testCampaign = {
          name: `Webhook Test Campaign ${Date.now()}`,
          user_id: "test-user-webhook",
          search_query: "test businesses",
          location: "Test City, CA",
          business_type: "restaurant",
          target_count: 50,
          budget_limit: 25.0,
          status: "created",
        };

        const { data, error } = await this.supabase
          .from("campaigns")
          .insert(testCampaign)
          .select()
          .single();

        if (error) throw error;
        testCampaignId = data.id;

        // Wait for webhook processing
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Check campaign lifecycle log
        const { data: lifecycleLogs } = await this.supabase
          .from("campaign_lifecycle_log")
          .select("*")
          .eq("campaign_id", testCampaignId)
          .eq("lifecycle_event", "created");

        return {
          campaignId: testCampaignId,
          webhookTriggered: lifecycleLogs?.length > 0,
          webhookSent: lifecycleLogs?.[0]?.webhook_sent,
        };
      },
      "campaignLifecycle"
    );

    // Test 3.3: Campaign status change webhook
    await this.runTest(
      "Campaign status update webhook",
      async () => {
        if (!testCampaignId) {
          throw new Error("Test campaign not available");
        }

        // Update campaign status to trigger webhook
        const { error } = await this.supabase
          .from("campaigns")
          .update({ status: "processing" })
          .eq("id", testCampaignId);

        if (error) throw error;

        // Wait for webhook processing
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Check lifecycle log for status change
        const { data: lifecycleLogs } = await this.supabase
          .from("campaign_lifecycle_log")
          .select("*")
          .eq("campaign_id", testCampaignId)
          .eq("lifecycle_event", "processing_started")
          .order("created_at", { ascending: false })
          .limit(1);

        return {
          campaignId: testCampaignId,
          statusChangeWebhook: lifecycleLogs?.length > 0,
          newStatus: "processing",
        };
      },
      "campaignLifecycle"
    );

    // Test 3.4: Campaign completion webhook
    await this.runTest(
      "Campaign completion webhook",
      async () => {
        if (!testCampaignId) {
          throw new Error("Test campaign not available");
        }

        // Complete campaign with results
        const { error } = await this.supabase
          .from("campaigns")
          .update({
            status: "completed",
            leads_found: 15,
            total_cost: 12.5,
            completed_at: new Date(),
          })
          .eq("id", testCampaignId);

        if (error) throw error;

        // Wait for webhook processing
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Check lifecycle log for completion
        const { data: lifecycleLogs } = await this.supabase
          .from("campaign_lifecycle_log")
          .select("*")
          .eq("campaign_id", testCampaignId)
          .eq("lifecycle_event", "completed")
          .order("created_at", { ascending: false })
          .limit(1);

        return {
          campaignId: testCampaignId,
          completionWebhook: lifecycleLogs?.length > 0,
          leadsFound: 15,
          totalCost: 12.5,
        };
      },
      "campaignLifecycle"
    );
  }

  // Cleanup test data
  async cleanupTestData() {
    this.log("🧹 Cleaning up test data", "info");

    try {
      // Clean up test leads
      await this.supabase
        .from("enhanced_leads")
        .delete()
        .eq("source", "webhook_test");

      // Clean up test campaigns
      await this.supabase
        .from("campaigns")
        .delete()
        .like("name", "Webhook Test Campaign%");

      // Clean up test API costs
      await this.supabase
        .from("api_costs")
        .delete()
        .eq("api_name", "test_api_webhook");

      this.log("Test data cleanup completed", "success");
    } catch (error) {
      this.log(`Test cleanup failed: ${error.message}`, "warning");
    }
  }

  // Generate test report
  generateReport() {
    const categories = ["leadEnrichment", "costAlert", "campaignLifecycle"];
    let totalPassed = 0;
    let totalFailed = 0;

    console.log("\n" + "=".repeat(60));
    console.log("📊 WEBHOOK SYSTEM TEST REPORT");
    console.log("=".repeat(60));

    categories.forEach((category) => {
      const result = this.testResults[category];
      totalPassed += result.passed;
      totalFailed += result.failed;

      console.log(`\n🔸 ${category.toUpperCase()}`);
      console.log(`   Passed: ${result.passed} | Failed: ${result.failed}`);

      result.tests.forEach((test) => {
        const status = test.status === "passed" ? "✅" : "❌";
        console.log(`   ${status} ${test.name}`);
        if (test.error) {
          console.log(`      Error: ${test.error}`);
        }
      });
    });

    console.log("\n" + "=".repeat(60));
    console.log(
      `📈 OVERALL RESULTS: ${totalPassed} passed, ${totalFailed} failed`
    );
    console.log(
      `🎯 Success Rate: ${(
        (totalPassed / (totalPassed + totalFailed)) *
        100
      ).toFixed(1)}%`
    );
    console.log("=".repeat(60) + "\n");

    return {
      totalPassed,
      totalFailed,
      successRate: (totalPassed / (totalPassed + totalFailed)) * 100,
      categories: this.testResults,
    };
  }

  async run() {
    this.log("🚀 Starting Comprehensive Webhook System Test", "info");
    this.log(`Webhook Base URL: ${this.webhookBaseUrl}`, "info");
    this.log(`Auth Token Configured: ${!!this.webhookToken}`, "info");

    try {
      // Test all webhook systems
      await this.testLeadEnrichmentWebhooks();
      await this.testCostAlertWebhooks();
      await this.testCampaignLifecycleWebhooks();

      // Generate and display report
      const report = this.generateReport();

      // Cleanup test data
      await this.cleanupTestData();

      // Exit with appropriate code
      process.exit(report.totalFailed === 0 ? 0 : 1);
    } catch (error) {
      this.log(`Critical test failure: ${error.message}`, "error");
      await this.cleanupTestData();
      process.exit(1);
    }
  }
}

// Run the test if called directly
if (require.main === module) {
  const tester = new WebhookSystemTester();
  tester.run().catch(console.error);
}

module.exports = WebhookSystemTester;
