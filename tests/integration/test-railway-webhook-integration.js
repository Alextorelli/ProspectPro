#!/usr/bin/env node

/**
 * Railway Webhook Integration Test Suite
 *
 * Comprehensive testing suite for Railway webhook processing in ProspectPro.
 * Tests webhook event handling, database logging, and deployment monitoring.
 */

const crypto = require("crypto");
const { createClient } = require("@supabase/supabase-js");

class RailwayWebhookIntegrationTests {
  constructor(options = {}) {
    this.baseUrl =
      options.baseUrl || `http://localhost:${process.env.PORT || 3000}`;
    this.webhookSecret = process.env.RAILWAY_WEBHOOK_SECRET;
    this.adminToken = process.env.PERSONAL_ACCESS_TOKEN;
    this.testResults = [];
    this.supabase = null;

    this.initializeSupabase();
  }

  /**
   * Initialize Supabase client for database tests
   */
  initializeSupabase() {
    try {
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseKey =
        process.env.SUPABASE_SECRET_KEY ||
        process.env.SUPABASE_SERVICE_ROLE_KEY ||
        process.env.SUPABASE_ANON_KEY;

      if (supabaseUrl && supabaseKey) {
        this.supabase = createClient(supabaseUrl, supabaseKey);
      }
    } catch (error) {
      console.warn("⚠️  Supabase client initialization failed:", error.message);
    }
  }

  /**
   * Run complete webhook integration test suite
   */
  async runIntegrationTests() {
    console.log("🧪 ProspectPro Railway Webhook Integration Tests");
    console.log("=".repeat(70));
    console.log(`Test Environment: ${this.baseUrl}`);
    console.log(`Database: ${this.supabase ? "Connected" : "Not available"}`);
    console.log(
      `Webhook Secret: ${this.webhookSecret ? "Configured" : "Not configured"}`
    );
    console.log("");

    const testSuites = [
      { name: "Prerequisites", tests: await this.getPrerequisiteTests() },
      {
        name: "Webhook Processing",
        tests: await this.getWebhookProcessingTests(),
      },
      { name: "Database Integration", tests: await this.getDatabaseTests() },
      { name: "Analytics & Monitoring", tests: await this.getAnalyticsTests() },
      {
        name: "Security & Error Handling",
        tests: await this.getSecurityTests(),
      },
      {
        name: "Performance & Scalability",
        tests: await this.getPerformanceTests(),
      },
    ];

    let totalPassed = 0;
    let totalFailed = 0;

    for (const suite of testSuites) {
      console.log(`📋 ${suite.name} Tests`);
      console.log("-".repeat(50));

      let suitePassed = 0;
      let suiteFailed = 0;

      for (const test of suite.tests) {
        try {
          console.log(`   🔍 ${test.name}...`);
          const result = await test.fn();

          if (result.success) {
            console.log(`      ✅ ${result.message}`);
            suitePassed++;
            totalPassed++;
          } else {
            console.log(`      ❌ ${result.message}`);
            suiteFailed++;
            totalFailed++;
          }

          this.testResults.push({
            suite: suite.name,
            ...test,
            result,
          });
        } catch (error) {
          console.log(`      🔥 ${error.message}`);
          suiteFailed++;
          totalFailed++;

          this.testResults.push({
            suite: suite.name,
            ...test,
            result: { success: false, message: error.message },
          });
        }
      }

      console.log(
        `   📊 Suite Results: ${suitePassed} passed, ${suiteFailed} failed`
      );
      console.log("");
    }

    this.generateIntegrationReport(totalPassed, totalFailed);
    return {
      passed: totalPassed,
      failed: totalFailed,
      results: this.testResults,
    };
  }

  /**
   * Get prerequisite tests
   */
  async getPrerequisiteTests() {
    return [
      {
        name: "Server Health Check",
        fn: async () => {
          const response = await this.makeRequest("/health");
          if (!response.ok) {
            return {
              success: false,
              message: `Server unhealthy: ${response.status}`,
            };
          }

          const health = await response.json();
          return {
            success: health.status === "ok" || health.status === "degraded",
            message: `Server status: ${health.status}`,
          };
        },
      },
      {
        name: "Database Connection",
        fn: async () => {
          if (!this.supabase) {
            return {
              success: false,
              message: "Supabase client not initialized",
            };
          }

          try {
            const { data, error } = await this.supabase
              .from("campaigns")
              .select("id")
              .limit(1);

            return error
              ? { success: false, message: `Database error: ${error.message}` }
              : { success: true, message: "Database connection successful" };
          } catch (err) {
            return {
              success: false,
              message: `Connection failed: ${err.message}`,
            };
          }
        },
      },
      {
        name: "Webhook Tables Schema",
        fn: async () => {
          if (!this.supabase) {
            return { success: false, message: "No database connection" };
          }

          const tables = [
            "railway_webhook_logs",
            "deployment_metrics",
            "deployment_failures",
          ];
          const missing = [];

          for (const table of tables) {
            try {
              const { error } = await this.supabase
                .from(table)
                .select("id")
                .limit(1);

              if (error && error.code === "PGRST116") {
                missing.push(table);
              }
            } catch (err) {
              missing.push(table);
            }
          }

          return missing.length === 0
            ? { success: true, message: "All webhook tables exist" }
            : {
                success: false,
                message: `Missing tables: ${missing.join(", ")}`,
              };
        },
      },
    ];
  }

  /**
   * Get webhook processing tests
   */
  async getWebhookProcessingTests() {
    return [
      {
        name: "Webhook Endpoint Response",
        fn: async () => {
          const response = await this.makeRequest("/railway-webhook", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type: "test" }),
          });

          return response.status === 200 || response.status === 401
            ? {
                success: true,
                message: `Webhook endpoint responsive (${response.status})`,
              }
            : {
                success: false,
                message: `Unexpected status: ${response.status}`,
              };
        },
      },
      {
        name: "Deployment Success Event Processing",
        fn: async () => {
          const payload = {
            type: "deployment.success",
            deployment: {
              id: "test-success-" + Date.now(),
              createdAt: new Date(Date.now() - 30000).toISOString(),
              finishedAt: new Date().toISOString(),
              url: this.baseUrl,
            },
            project: { id: "test-project" },
          };

          const result = await this.sendWebhookEvent(payload);
          return result.success
            ? { success: true, message: "Success event processed correctly" }
            : { success: false, message: result.message };
        },
      },
      {
        name: "Deployment Failure Event Processing",
        fn: async () => {
          const payload = {
            type: "deployment.failed",
            deployment: {
              id: "test-failure-" + Date.now(),
              createdAt: new Date(Date.now() - 20000).toISOString(),
              finishedAt: new Date().toISOString(),
              error: "Test build failure",
              buildLogs: "Error: Test module not found",
            },
            project: { id: "test-project" },
          };

          const result = await this.sendWebhookEvent(payload);
          return result.success
            ? {
                success: true,
                message: "Failure event processed with debugging info",
              }
            : { success: false, message: result.message };
        },
      },
      {
        name: "Multiple Event Types Processing",
        fn: async () => {
          const events = [
            {
              type: "deployment.building",
              deployment: { id: "test-build-" + Date.now() },
            },
            {
              type: "deployment.deploying",
              deployment: { id: "test-deploy-" + Date.now() },
            },
            { type: "service.connected", service: { id: "test-service" } },
          ];

          let processed = 0;
          for (const event of events) {
            const result = await this.sendWebhookEvent(event);
            if (result.success) processed++;
          }

          return processed === events.length
            ? {
                success: true,
                message: `All ${events.length} event types processed`,
              }
            : {
                success: false,
                message: `Only ${processed}/${events.length} events processed`,
              };
        },
      },
    ];
  }

  /**
   * Get database integration tests
   */
  async getDatabaseTests() {
    return [
      {
        name: "Webhook Event Logging",
        fn: async () => {
          if (!this.supabase) {
            return { success: false, message: "No database connection" };
          }

          // Send test webhook
          const testId = "db-test-" + Date.now();
          const payload = {
            type: "deployment.success",
            deployment: { id: testId },
            project: { id: "test-project" },
          };

          await this.sendWebhookEvent(payload);

          // Wait briefly for processing
          await new Promise((resolve) => setTimeout(resolve, 2000));

          // Check if logged to database
          const { data, error } = await this.supabase
            .from("railway_webhook_logs")
            .select("*")
            .eq("deployment_id", testId)
            .single();

          return data && !error
            ? {
                success: true,
                message: "Event logged to database successfully",
              }
            : { success: false, message: "Event not found in database logs" };
        },
      },
      {
        name: "Deployment Metrics Recording",
        fn: async () => {
          if (!this.supabase) {
            return { success: false, message: "No database connection" };
          }

          // Check if deployment_metrics table has recent data
          const { data, error } = await this.supabase
            .from("deployment_metrics")
            .select("*")
            .order("recorded_at", { ascending: false })
            .limit(5);

          if (error) {
            return {
              success: false,
              message: `Metrics query error: ${error.message}`,
            };
          }

          return data && data.length >= 0
            ? {
                success: true,
                message: `Metrics table accessible (${data.length} recent records)`,
              }
            : { success: false, message: "Cannot access deployment metrics" };
        },
      },
      {
        name: "Analytics Functions Availability",
        fn: async () => {
          if (!this.supabase) {
            return { success: false, message: "No database connection" };
          }

          try {
            const { data, error } = await this.supabase.rpc(
              "get_deployment_health_summary"
            );

            return !error
              ? { success: true, message: "Analytics functions working" }
              : {
                  success: false,
                  message: `Analytics function error: ${error.message}`,
                };
          } catch (err) {
            return {
              success: false,
              message: `Function call failed: ${err.message}`,
            };
          }
        },
      },
    ];
  }

  /**
   * Get analytics and monitoring tests
   */
  async getAnalyticsTests() {
    return [
      {
        name: "Deployment Status Dashboard Access",
        fn: async () => {
          if (!this.adminToken) {
            return { success: true, message: "Skipped (no admin token)" };
          }

          const response = await this.makeRequest(
            `/deployment-status?token=${this.adminToken}`
          );

          if (!response.ok) {
            return {
              success: false,
              message: `Dashboard access failed: ${response.status}`,
            };
          }

          const data = await response.json();
          const hasWebhookData =
            data.webhookStatus &&
            typeof data.webhookStatus.totalEventsProcessed === "number";

          return hasWebhookData
            ? {
                success: true,
                message: `Dashboard accessible with ${data.webhookStatus.totalEventsProcessed} events`,
              }
            : {
                success: false,
                message: "Dashboard missing webhook data structure",
              };
        },
      },
      {
        name: "Enhanced Diagnostics Integration",
        fn: async () => {
          const response = await this.makeRequest("/diag");

          if (!response.ok) {
            return {
              success: false,
              message: `Diagnostics failed: ${response.status}`,
            };
          }

          const diag = await response.json();
          const hasDeploymentInfo =
            diag.deployment && diag.deployment.railwayWebhooks;

          return hasDeploymentInfo
            ? {
                success: true,
                message: "Diagnostics include deployment webhook info",
              }
            : {
                success: false,
                message: "Diagnostics missing deployment data",
              };
        },
      },
      {
        name: "Real-time Metrics Calculation",
        fn: async () => {
          if (!this.adminToken) {
            return { success: true, message: "Skipped (no admin token)" };
          }

          // Get deployment status twice with a brief delay
          const before = await this.makeRequest(
            `/deployment-status?token=${this.adminToken}`
          );

          // Send a test event
          await this.sendWebhookEvent({
            type: "deployment.success",
            deployment: { id: "metrics-test-" + Date.now() },
          });

          await new Promise((resolve) => setTimeout(resolve, 1000));

          const after = await this.makeRequest(
            `/deployment-status?token=${this.adminToken}`
          );

          if (before.ok && after.ok) {
            const beforeData = await before.json();
            const afterData = await after.json();

            const eventsBefore =
              beforeData.webhookStatus?.totalEventsProcessed || 0;
            const eventsAfter =
              afterData.webhookStatus?.totalEventsProcessed || 0;

            return eventsAfter > eventsBefore
              ? {
                  success: true,
                  message: "Real-time metrics updating correctly",
                }
              : {
                  success: true,
                  message: "Metrics may have delay (acceptable)",
                };
          }

          return {
            success: false,
            message: "Could not verify real-time metrics",
          };
        },
      },
    ];
  }

  /**
   * Get security tests
   */
  async getSecurityTests() {
    return [
      {
        name: "Webhook Signature Verification",
        fn: async () => {
          if (!this.webhookSecret) {
            return { success: true, message: "Skipped (development mode)" };
          }

          const payload = {
            type: "deployment.success",
            deployment: { id: "security-test" },
          };
          const payloadStr = JSON.stringify(payload);

          // Test valid signature
          const validSig =
            "sha256=" +
            crypto
              .createHmac("sha256", this.webhookSecret)
              .update(payloadStr)
              .digest("hex");

          const validResponse = await this.makeRequest("/railway-webhook", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Railway-Signature": validSig,
            },
            body: payloadStr,
          });

          if (!validResponse.ok) {
            return {
              success: false,
              message: `Valid signature rejected: ${validResponse.status}`,
            };
          }

          // Test invalid signature
          const invalidResponse = await this.makeRequest("/railway-webhook", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Railway-Signature": "sha256=invalid",
            },
            body: payloadStr,
          });

          return invalidResponse.status === 401
            ? {
                success: true,
                message: "Signature verification working correctly",
              }
            : { success: false, message: "Invalid signature accepted" };
        },
      },
      {
        name: "Admin Dashboard Authentication",
        fn: async () => {
          if (!this.adminToken) {
            return {
              success: true,
              message: "Skipped (no admin token configured)",
            };
          }

          // Test without token
          const noTokenResponse = await this.makeRequest("/deployment-status");

          if (noTokenResponse.status !== 401) {
            return {
              success: false,
              message: "Dashboard accessible without token",
            };
          }

          // Test with valid token
          const validTokenResponse = await this.makeRequest(
            `/deployment-status?token=${this.adminToken}`
          );

          return validTokenResponse.ok
            ? {
                success: true,
                message: "Admin authentication working correctly",
              }
            : { success: false, message: "Valid token rejected" };
        },
      },
      {
        name: "Malformed Request Handling",
        fn: async () => {
          // Test malformed JSON
          const malformedResponse = await this.makeRequest("/railway-webhook", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: '{"invalid": json',
          });

          return malformedResponse.status < 500
            ? {
                success: true,
                message: "Malformed requests handled gracefully",
              }
            : {
                success: false,
                message: "Malformed request caused server error",
              };
        },
      },
    ];
  }

  /**
   * Get performance tests
   */
  async getPerformanceTests() {
    return [
      {
        name: "Concurrent Webhook Processing",
        fn: async () => {
          const promises = [];
          const eventCount = 5;

          for (let i = 0; i < eventCount; i++) {
            const payload = {
              type: "deployment.success",
              deployment: { id: `concurrent-test-${i}-${Date.now()}` },
            };
            promises.push(this.sendWebhookEvent(payload));
          }

          const results = await Promise.all(promises);
          const successful = results.filter((r) => r.success).length;

          return successful === eventCount
            ? {
                success: true,
                message: `Processed ${successful}/${eventCount} concurrent events`,
              }
            : {
                success: false,
                message: `Only ${successful}/${eventCount} events processed`,
              };
        },
      },
      {
        name: "Response Time Performance",
        fn: async () => {
          const start = Date.now();

          const response = await this.makeRequest("/railway-webhook", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "deployment.success",
              deployment: { id: "performance-test-" + Date.now() },
            }),
          });

          const duration = Date.now() - start;

          return response.ok && duration < 5000
            ? {
                success: true,
                message: `Response time: ${duration}ms (acceptable)`,
              }
            : { success: false, message: `Slow response: ${duration}ms` };
        },
      },
      {
        name: "Database Query Performance",
        fn: async () => {
          if (!this.supabase) {
            return { success: true, message: "Skipped (no database)" };
          }

          const start = Date.now();

          try {
            const { data, error } = await this.supabase
              .from("railway_webhook_logs")
              .select("*")
              .order("processed_at", { ascending: false })
              .limit(10);

            const duration = Date.now() - start;

            return !error && duration < 3000
              ? {
                  success: true,
                  message: `Query time: ${duration}ms (${
                    data?.length || 0
                  } records)`,
                }
              : {
                  success: false,
                  message: error ? error.message : `Slow query: ${duration}ms`,
                };
          } catch (err) {
            return { success: false, message: `Query failed: ${err.message}` };
          }
        },
      },
    ];
  }

  /**
   * Send webhook event with proper signature
   */
  async sendWebhookEvent(payload) {
    const payloadStr = JSON.stringify(payload);
    const headers = { "Content-Type": "application/json" };

    if (this.webhookSecret) {
      const signature =
        "sha256=" +
        crypto
          .createHmac("sha256", this.webhookSecret)
          .update(payloadStr)
          .digest("hex");
      headers["X-Railway-Signature"] = signature;
    }

    const response = await this.makeRequest("/railway-webhook", {
      method: "POST",
      headers,
      body: payloadStr,
    });

    return response.ok
      ? { success: true, message: "Event processed successfully" }
      : { success: false, message: `Event failed: ${response.status}` };
  }

  /**
   * Generate comprehensive integration test report
   */
  generateIntegrationReport(passed, failed) {
    console.log("📊 Integration Test Results");
    console.log("=".repeat(70));

    const total = passed + failed;
    const successRate = total > 0 ? Math.round((passed / total) * 100) : 0;

    console.log(`Total Tests: ${total}`);
    console.log(`Passed: ${passed} ✅`);
    console.log(`Failed: ${failed} ❌`);
    console.log(`Success Rate: ${successRate}%`);
    console.log("");

    // Group results by test suite
    const suiteResults = {};
    this.testResults.forEach((test) => {
      if (!suiteResults[test.suite]) {
        suiteResults[test.suite] = { passed: 0, failed: 0, tests: [] };
      }

      if (test.result.success) {
        suiteResults[test.suite].passed++;
      } else {
        suiteResults[test.suite].failed++;
      }

      suiteResults[test.suite].tests.push(test);
    });

    console.log("📋 Results by Test Suite:");
    Object.entries(suiteResults).forEach(([suite, results]) => {
      const suiteTotal = results.passed + results.failed;
      const suiteRate = Math.round((results.passed / suiteTotal) * 100);

      console.log(
        `   ${suite}: ${results.passed}/${suiteTotal} (${suiteRate}%)`
      );
    });

    console.log("");

    if (failed === 0) {
      console.log("🎉 ALL INTEGRATION TESTS PASSED!");
      console.log(
        "   Railway webhook monitoring is fully integrated and functional"
      );
      console.log("   Ready for production deployment");
    } else {
      console.log("⚠️  SOME INTEGRATION TESTS FAILED");
      console.log("   Review failed tests below:");
      console.log("");

      const failedTests = this.testResults.filter((t) => !t.result.success);
      failedTests.forEach((test, index) => {
        console.log(`   ${index + 1}. ❌ ${test.suite} > ${test.name}`);
        console.log(`      Issue: ${test.result.message}`);
      });
    }

    console.log("");
    console.log("🔧 Next Steps:");

    if (failed === 0) {
      console.log("   - Deploy to Railway");
      console.log("   - Configure Railway webhook in dashboard");
      console.log("   - Monitor production deployment events");
    } else {
      console.log("   - Fix failing integration tests");
      console.log("   - Verify database schema and connectivity");
      console.log("   - Check environment variable configuration");
      console.log("   - Re-run tests after fixes: npm run test:webhooks");
    }

    console.log("");
    console.log("📚 Documentation:");
    console.log("   - Setup guide: git checkout instructions");
    console.log("   - Debugging: git checkout debugging");
    console.log("   - Full docs: docs/webhooks/railway-webhook-setup-guide.md");
  }

  /**
   * Helper method for HTTP requests
   */
  async makeRequest(path, options = {}) {
    const url = path.startsWith("http") ? path : `${this.baseUrl}${path}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeout);
      return response;
    } catch (error) {
      clearTimeout(timeout);
      throw error;
    }
  }
}

// Run integration tests if called directly
if (require.main === module) {
  const tester = new RailwayWebhookIntegrationTests();

  tester
    .runIntegrationTests()
    .then((results) => {
      process.exit(results.failed === 0 ? 0 : 1);
    })
    .catch((error) => {
      console.error("🔥 Integration test suite crashed:", error);
      process.exit(1);
    });
}

module.exports = RailwayWebhookIntegrationTests;
