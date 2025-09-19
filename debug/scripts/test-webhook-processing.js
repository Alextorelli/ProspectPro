#!/usr/bin/env node

/**
 * Railway Webhook Test Suite
 *
 * Tests webhook processing functionality and simulates Railway deployment events
 * for ProspectPro deployment monitoring system.
 */

const crypto = require("crypto");

class RailwayWebhookTester {
  constructor(options = {}) {
    this.baseUrl =
      options.baseUrl || `http://localhost:${process.env.PORT || 3000}`;
    this.webhookSecret = process.env.RAILWAY_WEBHOOK_SECRET;
    this.adminToken = process.env.PERSONAL_ACCESS_TOKEN;
    this.testResults = [];
  }

  /**
   * Run comprehensive webhook testing
   */
  async runTests() {
    console.log("🧪 ProspectPro Railway Webhook Test Suite");
    console.log("=".repeat(60));
    console.log(`Base URL: ${this.baseUrl}`);
    console.log(
      `Webhook Secret: ${this.webhookSecret ? "Configured" : "Not configured"}`
    );
    console.log("");

    const tests = [
      { name: "Server Health Check", fn: () => this.testServerHealth() },
      {
        name: "Webhook Endpoint Accessibility",
        fn: () => this.testWebhookEndpoint(),
      },
      {
        name: "Deployment Success Event",
        fn: () => this.testDeploymentSuccess(),
      },
      {
        name: "Deployment Failure Event",
        fn: () => this.testDeploymentFailure(),
      },
      { name: "Deployment Crash Event", fn: () => this.testDeploymentCrash() },
      { name: "Build Start Event", fn: () => this.testBuildStart() },
      { name: "Service Connection Events", fn: () => this.testServiceEvents() },
      {
        name: "Webhook Signature Verification",
        fn: () => this.testSignatureVerification(),
      },
      { name: "Invalid Event Handling", fn: () => this.testInvalidEvents() },
      {
        name: "Deployment Status Dashboard",
        fn: () => this.testDeploymentDashboard(),
      },
    ];

    let passed = 0;
    let failed = 0;

    for (const test of tests) {
      console.log(`🔍 ${test.name}...`);
      try {
        const result = await test.fn();
        if (result.success) {
          console.log(`   ✅ ${result.message}`);
          passed++;
        } else {
          console.log(`   ❌ ${result.message}`);
          failed++;
        }
        this.testResults.push({ ...test, result });
      } catch (error) {
        console.log(`   🔥 ${error.message}`);
        this.testResults.push({
          ...test,
          result: { success: false, message: error.message },
        });
        failed++;
      }
      console.log("");
    }

    this.generateTestReport(passed, failed);
    return { passed, failed, results: this.testResults };
  }

  /**
   * Test server health endpoint
   */
  async testServerHealth() {
    const response = await this.makeRequest("/health");

    if (!response.ok) {
      return {
        success: false,
        message: `Health check failed: ${response.status}`,
      };
    }

    const healthData = await response.json();

    if (healthData.status === "ok" || healthData.status === "degraded") {
      return {
        success: true,
        message: `Server healthy (${healthData.status}), uptime: ${Math.round(
          healthData.supabase?.durationMs || 0
        )}ms`,
      };
    }

    return {
      success: false,
      message: `Unexpected health status: ${healthData.status}`,
    };
  }

  /**
   * Test webhook endpoint basic accessibility
   */
  async testWebhookEndpoint() {
    const testPayload = { type: "test", timestamp: Date.now() };

    const response = await this.makeRequest("/railway-webhook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(testPayload),
    });

    // Accept both 200 (processed) and 401 (signature required) as success
    if (response.status === 200) {
      const responseData = await response.json();
      return {
        success: true,
        message: `Webhook endpoint accessible, processed ${
          responseData.eventType || "test"
        } event`,
      };
    } else if (response.status === 401) {
      return {
        success: true,
        message: "Webhook endpoint accessible (signature verification active)",
      };
    }

    return {
      success: false,
      message: `Unexpected response: ${response.status}`,
    };
  }

  /**
   * Test deployment success event processing
   */
  async testDeploymentSuccess() {
    const payload = {
      type: "deployment.success",
      deployment: {
        id: "test-deploy-success-" + Date.now(),
        createdAt: new Date(Date.now() - 45000).toISOString(), // 45 seconds ago
        finishedAt: new Date().toISOString(),
        url: this.baseUrl,
        meta: { branch: "main" },
      },
      project: { id: "test-project" },
      environment: { id: "production" },
    };

    return await this.sendWebhookEvent(
      payload,
      "Deployment success event processed successfully"
    );
  }

  /**
   * Test deployment failure event processing
   */
  async testDeploymentFailure() {
    const payload = {
      type: "deployment.failed",
      deployment: {
        id: "test-deploy-failure-" + Date.now(),
        createdAt: new Date(Date.now() - 30000).toISOString(),
        finishedAt: new Date().toISOString(),
        error: "Module not found: test-module",
        buildLogs:
          "Error: Cannot find module 'test-module'\n    at require (internal/modules/cjs/loader.js:123:45)",
        meta: { branch: "main" },
      },
      project: { id: "test-project" },
      environment: { id: "production" },
    };

    return await this.sendWebhookEvent(
      payload,
      "Deployment failure event processed with debugging recommendations"
    );
  }

  /**
   * Test deployment crash event processing
   */
  async testDeploymentCrash() {
    const payload = {
      type: "deployment.crashed",
      deployment: {
        id: "test-deploy-crash-" + Date.now(),
        createdAt: new Date(Date.now() - 60000).toISOString(),
        crashedAt: new Date().toISOString(),
        crashLogs:
          "Error: connect ECONNREFUSED 127.0.0.1:5432\n    at TCPConnectWrap.afterConnect",
        restartCount: 2,
        exitCode: 1,
      },
      project: { id: "test-project" },
      environment: { id: "production" },
    };

    return await this.sendWebhookEvent(
      payload,
      "Deployment crash event processed with recovery recommendations"
    );
  }

  /**
   * Test build start event processing
   */
  async testBuildStart() {
    const payload = {
      type: "deployment.building",
      deployment: {
        id: "test-deploy-building-" + Date.now(),
        createdAt: new Date().toISOString(),
        meta: {
          branch: "main",
          commitSha: "abc123def456",
        },
      },
      project: { id: "test-project" },
      environment: { id: "production" },
    };

    return await this.sendWebhookEvent(
      payload,
      "Build start event processed, timeout monitoring enabled"
    );
  }

  /**
   * Test service connection events
   */
  async testServiceEvents() {
    const disconnectPayload = {
      type: "service.disconnected",
      service: { id: "test-service" },
      reason: "Health check timeout",
    };

    const connectPayload = {
      type: "service.connected",
      service: { id: "test-service" },
    };

    // Test disconnection
    const disconnectResult = await this.sendWebhookEvent(disconnectPayload);
    if (!disconnectResult.success) {
      return disconnectResult;
    }

    // Test connection
    const connectResult = await this.sendWebhookEvent(connectPayload);
    if (!connectResult.success) {
      return connectResult;
    }

    return {
      success: true,
      message: "Service connection/disconnection events processed",
    };
  }

  /**
   * Test webhook signature verification
   */
  async testSignatureVerification() {
    if (!this.webhookSecret) {
      return {
        success: true,
        message: "Skipped (no webhook secret configured - development mode)",
      };
    }

    const payload = {
      type: "deployment.success",
      deployment: { id: "signature-test-" + Date.now() },
      project: { id: "test-project" },
    };

    const payloadString = JSON.stringify(payload);

    // Test with correct signature
    const correctSignature =
      "sha256=" +
      crypto
        .createHmac("sha256", this.webhookSecret)
        .update(payloadString, "utf8")
        .digest("hex");

    const validResponse = await this.makeRequest("/railway-webhook", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Railway-Signature": correctSignature,
      },
      body: payloadString,
    });

    if (!validResponse.ok) {
      return {
        success: false,
        message: `Valid signature rejected: ${validResponse.status}`,
      };
    }

    // Test with incorrect signature
    const invalidResponse = await this.makeRequest("/railway-webhook", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Railway-Signature": "sha256=invalid_signature_here",
      },
      body: payloadString,
    });

    if (invalidResponse.status !== 401) {
      return {
        success: false,
        message: `Invalid signature accepted: ${invalidResponse.status}`,
      };
    }

    return {
      success: true,
      message: "Signature verification working correctly",
    };
  }

  /**
   * Test invalid event handling
   */
  async testInvalidEvents() {
    // Test with invalid event type
    const invalidTypePayload = {
      type: "invalid.event.type",
      project: { id: "test-project" },
    };

    const invalidTypeResult = await this.sendWebhookEvent(invalidTypePayload);
    if (!invalidTypeResult.success) {
      return {
        success: false,
        message: "Invalid event type should be handled gracefully",
      };
    }

    // Test with malformed payload
    const malformedResponse = await this.makeRequest("/railway-webhook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: '{"invalid": json malformed',
    });

    if (malformedResponse.status === 500) {
      return { success: false, message: "Malformed JSON caused server error" };
    }

    return { success: true, message: "Invalid events handled gracefully" };
  }

  /**
   * Test deployment status dashboard access
   */
  async testDeploymentDashboard() {
    if (!this.adminToken) {
      return {
        success: true,
        message: "Skipped (no PERSONAL_ACCESS_TOKEN configured)",
      };
    }

    // Test with valid token
    const validResponse = await this.makeRequest(
      `/deployment-status?token=${this.adminToken}`
    );

    if (!validResponse.ok) {
      return {
        success: false,
        message: `Dashboard access failed: ${validResponse.status}`,
      };
    }

    const dashboardData = await validResponse.json();

    if (!dashboardData.webhookStatus) {
      return {
        success: false,
        message: "Dashboard missing webhook status information",
      };
    }

    // Test without token (should fail)
    const noTokenResponse = await this.makeRequest("/deployment-status");

    if (noTokenResponse.status !== 401) {
      return {
        success: false,
        message: "Dashboard accessible without token (security issue)",
      };
    }

    return {
      success: true,
      message: `Dashboard accessible, ${
        dashboardData.webhookStatus.totalEventsProcessed || 0
      } events processed`,
    };
  }

  /**
   * Send webhook event with optional signature
   */
  async sendWebhookEvent(
    payload,
    successMessage = "Event processed successfully"
  ) {
    const payloadString = JSON.stringify(payload);
    const headers = { "Content-Type": "application/json" };

    // Add signature if webhook secret is configured
    if (this.webhookSecret) {
      const signature =
        "sha256=" +
        crypto
          .createHmac("sha256", this.webhookSecret)
          .update(payloadString, "utf8")
          .digest("hex");
      headers["X-Railway-Signature"] = signature;
    }

    const response = await this.makeRequest("/railway-webhook", {
      method: "POST",
      headers,
      body: payloadString,
    });

    if (!response.ok) {
      return {
        success: false,
        message: `Event processing failed: ${response.status} ${response.statusText}`,
      };
    }

    const responseData = await response.json();
    return {
      success: true,
      message: `${successMessage} (${responseData.eventType})`,
    };
  }

  /**
   * Generate comprehensive test report
   */
  generateTestReport(passed, failed) {
    console.log("📊 Test Results Summary");
    console.log("=".repeat(60));

    const total = passed + failed;
    const successRate = total > 0 ? Math.round((passed / total) * 100) : 0;

    console.log(`Total Tests: ${total}`);
    console.log(`Passed: ${passed} ✅`);
    console.log(`Failed: ${failed} ❌`);
    console.log(`Success Rate: ${successRate}%`);
    console.log("");

    if (failed === 0) {
      console.log("🎉 ALL TESTS PASSED!");
      console.log("   Railway webhook monitoring is fully functional");
    } else {
      console.log("⚠️  SOME TESTS FAILED");
      console.log(
        "   Review failed tests and fix issues before production deployment"
      );
    }

    console.log("");
    console.log("📋 Detailed Test Results:");

    this.testResults.forEach((test, index) => {
      const status = test.result.success ? "✅" : "❌";
      console.log(`   ${index + 1}. ${status} ${test.name}`);
      if (!test.result.success) {
        console.log(`      Issue: ${test.result.message}`);
      }
    });

    console.log("");
    console.log("🔧 Recommendations:");

    const failedTests = this.testResults.filter((t) => !t.result.success);
    if (failedTests.length === 0) {
      console.log("   - Deploy to Railway if not already deployed");
      console.log("   - Configure Railway webhook in dashboard");
      console.log("   - Monitor webhook events in production");
    } else {
      console.log("   - Fix failing tests before production deployment");
      console.log("   - Verify server is running: npm start");
      console.log("   - Check environment variables");
      console.log("   - Review webhook configuration");
    }

    console.log("");
    console.log("📚 Next Steps:");
    console.log("   - Run: git checkout instructions");
    console.log("   - Review: docs/webhooks/railway-webhook-setup-guide.md");
    console.log("   - Test: Deploy a change to trigger real webhook events");
  }

  /**
   * Helper method for HTTP requests with timeout
   */
  async makeRequest(path, options = {}) {
    const url = path.startsWith("http") ? path : `${this.baseUrl}${path}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeout);
      return response;
    } catch (error) {
      clearTimeout(timeout);
      if (error.name === "AbortError") {
        throw new Error("Request timeout (10 seconds)");
      }
      throw error;
    }
  }
}

// Run tests if called directly
if (require.main === module) {
  const tester = new RailwayWebhookTester();
  tester
    .runTests()
    .then((results) => {
      if (results.failed === 0) {
        process.exit(0);
      } else {
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error("🔥 Test suite crashed:", error);
      process.exit(1);
    });
}

module.exports = RailwayWebhookTester;
