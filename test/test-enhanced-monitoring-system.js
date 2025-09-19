/**
 * Enhanced Monitoring System Integration Test
 * Tests the complete monitoring stack: database schema, API endpoints,
 * usage monitoring, cost budgeting, and dashboard integration
 */

const { createClient } = require("@supabase/supabase-js");
const EnhancedApiUsageMonitor = require("../modules/enhanced-api-usage-monitor");
const CostBudgetingSystem = require("../modules/cost-budgeting-system");

class MonitoringSystemIntegrationTest {
  constructor() {
    this.supabaseUrl = process.env.SUPABASE_URL;
    this.supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

    this.supabase = null;
    if (this.supabaseUrl && this.supabaseKey) {
      this.supabase = createClient(this.supabaseUrl, this.supabaseKey);
    }

    this.apiMonitor = new EnhancedApiUsageMonitor();
    this.budgetSystem = new CostBudgetingSystem();

    this.testResults = {
      passed: 0,
      failed: 0,
      errors: [],
      details: [],
    };

    console.log("🧪 Enhanced Monitoring System Integration Test initialized");
  }

  /**
   * Run complete test suite
   */
  async runAllTests() {
    console.log("\n🚀 Starting Enhanced Monitoring System Tests...\n");

    try {
      // Database schema tests
      await this.testDatabaseSchema();

      // API usage monitoring tests
      await this.testApiUsageMonitoring();

      // Cost budgeting system tests
      await this.testCostBudgetingSystem();

      // Dashboard API tests
      await this.testDashboardApi();

      // Integration flow tests
      await this.testIntegrationFlows();

      // Performance tests
      await this.testSystemPerformance();

      this.printTestSummary();
    } catch (error) {
      console.error("❌ Test suite failed with error:", error);
      this.testResults.errors.push(error.message);
    }
  }

  /**
   * Test database schema and table structure
   */
  async testDatabaseSchema() {
    console.log("📊 Testing Database Schema...");

    const tables = [
      "api_data_sources",
      "enhanced_api_usage",
      "lead_validation_pipeline",
      "campaign_analytics",
      "budget_management",
      "budget_alerts",
      "api_health_monitoring",
      "system_performance_metrics",
    ];

    for (const tableName of tables) {
      try {
        const { data, error } = await this.supabase
          .from(tableName)
          .select("*")
          .limit(1);

        if (error) {
          this.recordFailure(
            `Table ${tableName} not accessible: ${error.message}`
          );
        } else {
          this.recordSuccess(`Table ${tableName} exists and is accessible`);
        }
      } catch (error) {
        this.recordFailure(
          `Error testing table ${tableName}: ${error.message}`
        );
      }
    }

    // Test table relationships and constraints
    await this.testTableRelationships();
  }

  /**
   * Test API usage monitoring functionality
   */
  async testApiUsageMonitoring() {
    console.log("📈 Testing API Usage Monitoring...");

    try {
      // Test request tracking
      const requestDetails = {
        campaignId: "test-campaign-001",
        sessionId: "test-session-001",
        sourceName: "google_places",
        endpoint: "/textsearch/json",
        requestParams: {
          query: "restaurants in San Francisco",
          maxResults: 20,
        },
        queryType: "discovery",
        businessQuery: "restaurants",
        locationQuery: "San Francisco",
      };

      const requestTracking = await this.apiMonitor.trackApiRequest(
        requestDetails
      );

      if (requestTracking.blocked) {
        this.recordSuccess(`Rate limiting working: ${requestTracking.reason}`);
      } else if (requestTracking.requestId) {
        this.recordSuccess("API request tracking successful");

        // Test response tracking
        const responseDetails = {
          responseCode: 200,
          responseTimeMs: 850,
          resultsReturned: 15,
          success: true,
          actualCost: 0.032,
          dataQualityScore: 85,
          usefulResults: 12,
        };

        const responseTracking = await this.apiMonitor.trackApiResponse(
          requestTracking.requestId,
          responseDetails
        );

        if (responseTracking.success) {
          this.recordSuccess("API response tracking successful");
        } else {
          this.recordFailure("API response tracking failed");
        }
      } else {
        this.recordFailure("API request tracking failed");
      }

      // Test usage analytics
      const analytics = await this.apiMonitor.getUsageAnalytics("24h");
      if (analytics.error) {
        this.recordFailure(`Usage analytics failed: ${analytics.error}`);
      } else {
        this.recordSuccess("Usage analytics retrieval successful");
      }
    } catch (error) {
      this.recordFailure(`API monitoring test error: ${error.message}`);
    }
  }

  /**
   * Test cost budgeting system
   */
  async testCostBudgetingSystem() {
    console.log("💰 Testing Cost Budgeting System...");

    try {
      // Test budget availability check
      const budgetCheck = await this.budgetSystem.checkBudgetAvailability(
        "google_places",
        0.05,
        "test-campaign-001"
      );

      if (budgetCheck.allowed !== undefined) {
        this.recordSuccess("Budget availability check working");
      } else {
        this.recordFailure("Budget availability check failed");
      }

      // Test cost recording
      const costDetails = {
        campaignId: "test-campaign-001",
        sessionId: "test-session-001",
        sourceName: "google_places",
        actualCost: 0.032,
        requestId: "test-request-001",
        resultsGenerated: 15,
        qualityScore: 85,
      };

      const costRecording = await this.budgetSystem.recordActualCost(
        costDetails
      );
      if (costRecording.success) {
        this.recordSuccess("Cost recording successful");
      } else {
        this.recordFailure(`Cost recording failed: ${costRecording.reason}`);
      }

      // Test optimization recommendations
      const recommendations =
        await this.budgetSystem.generateOptimizationRecommendations();
      if (Array.isArray(recommendations)) {
        this.recordSuccess("Optimization recommendations generated");
      } else {
        this.recordFailure("Optimization recommendations failed");
      }
    } catch (error) {
      this.recordFailure(`Cost budgeting test error: ${error.message}`);
    }
  }

  /**
   * Test dashboard API endpoints
   */
  async testDashboardApi() {
    console.log("📊 Testing Dashboard API...");

    const endpoints = [
      "/api/dashboard-metrics/metrics",
      "/api/dashboard-metrics/api-usage",
      "/api/dashboard-metrics/quality-metrics",
      "/api/dashboard-metrics/budget-analytics",
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(
          `http://localhost:3000${endpoint}?timeRange=24h`
        );

        if (response.ok) {
          const data = await response.json();
          if (data && typeof data === "object") {
            this.recordSuccess(`Dashboard API ${endpoint} working`);
          } else {
            this.recordFailure(
              `Dashboard API ${endpoint} returned invalid data`
            );
          }
        } else {
          this.recordFailure(
            `Dashboard API ${endpoint} returned ${response.status}`
          );
        }
      } catch (error) {
        this.recordFailure(
          `Dashboard API ${endpoint} test error: ${error.message}`
        );
      }
    }
  }

  /**
   * Test integration flows
   */
  async testIntegrationFlows() {
    console.log("🔄 Testing Integration Flows...");

    try {
      // Test end-to-end flow: Request → Monitor → Budget → Alert
      const campaignId = "integration-test-001";
      const sessionId = "integration-session-001";

      // 1. Start tracking a request
      const requestStart = await this.apiMonitor.trackApiRequest({
        campaignId,
        sessionId,
        sourceName: "hunter_io",
        endpoint: "/domain-search",
        requestParams: { domain: "example.com", limit: 10 },
        queryType: "enrichment",
        businessQuery: "email discovery",
      });

      if (requestStart.requestId) {
        // 2. Check budget before proceeding
        const budgetCheck = await this.budgetSystem.checkBudgetAvailability(
          "hunter_io",
          0.04,
          campaignId
        );

        if (budgetCheck.allowed) {
          // 3. Complete the request
          const requestComplete = await this.apiMonitor.trackApiResponse(
            requestStart.requestId,
            {
              responseCode: 200,
              responseTimeMs: 1200,
              resultsReturned: 8,
              success: true,
              actualCost: 0.04,
              dataQualityScore: 92,
              usefulResults: 8,
            }
          );

          if (requestComplete.success) {
            // 4. Record cost in budget system
            const costRecord = await this.budgetSystem.recordActualCost({
              campaignId,
              sessionId,
              sourceName: "hunter_io",
              actualCost: 0.04,
              requestId: requestStart.requestId,
              resultsGenerated: 8,
              qualityScore: 92,
            });

            if (costRecord.success) {
              this.recordSuccess("End-to-end integration flow successful");
            } else {
              this.recordFailure("Integration flow: cost recording failed");
            }
          } else {
            this.recordFailure("Integration flow: request completion failed");
          }
        } else {
          this.recordSuccess(
            "Integration flow: budget controls working (request blocked)"
          );
        }
      } else {
        this.recordFailure("Integration flow: request tracking failed");
      }
    } catch (error) {
      this.recordFailure(`Integration flow test error: ${error.message}`);
    }
  }

  /**
   * Test system performance
   */
  async testSystemPerformance() {
    console.log("⚡ Testing System Performance...");

    try {
      // Test concurrent request handling
      const concurrentRequests = Array.from({ length: 10 }, (_, i) =>
        this.apiMonitor.trackApiRequest({
          campaignId: `perf-test-${i}`,
          sessionId: `perf-session-${i}`,
          sourceName: "google_places",
          endpoint: "/textsearch/json",
          requestParams: { query: `test query ${i}` },
          queryType: "discovery",
        })
      );

      const startTime = Date.now();
      const results = await Promise.all(concurrentRequests);
      const endTime = Date.now();

      const processingTime = endTime - startTime;
      const successfulRequests = results.filter((r) => r.requestId).length;

      if (successfulRequests >= 8 && processingTime < 5000) {
        this.recordSuccess(
          `Performance test passed: ${successfulRequests}/10 requests in ${processingTime}ms`
        );
      } else {
        this.recordFailure(
          `Performance test failed: ${successfulRequests}/10 requests in ${processingTime}ms`
        );
      }

      // Test database query performance
      if (this.supabase) {
        const dbStartTime = Date.now();
        const { data, error } = await this.supabase
          .from("enhanced_api_usage")
          .select("*")
          .limit(100);
        const dbEndTime = Date.now();

        const dbQueryTime = dbEndTime - dbStartTime;
        if (!error && dbQueryTime < 1000) {
          this.recordSuccess(
            `Database performance good: ${dbQueryTime}ms for 100 records`
          );
        } else {
          this.recordFailure(
            `Database performance issue: ${dbQueryTime}ms or error: ${error?.message}`
          );
        }
      }
    } catch (error) {
      this.recordFailure(`Performance test error: ${error.message}`);
    }
  }

  /**
   * Test table relationships and constraints
   */
  async testTableRelationships() {
    try {
      // Test foreign key relationships
      const relationshipTests = [
        {
          name: "enhanced_api_usage → campaigns",
          query: async () =>
            this.supabase
              .from("enhanced_api_usage")
              .select("campaign_id, campaigns(id)")
              .limit(1),
        },
        {
          name: "budget_alerts → budget_management",
          query: async () =>
            this.supabase
              .from("budget_alerts")
              .select("budget_id, budget_management(id)")
              .limit(1),
        },
      ];

      for (const test of relationshipTests) {
        try {
          const { data, error } = await test.query();
          if (!error) {
            this.recordSuccess(`Relationship ${test.name} working`);
          } else {
            this.recordFailure(
              `Relationship ${test.name} failed: ${error.message}`
            );
          }
        } catch (error) {
          this.recordFailure(
            `Relationship test ${test.name} error: ${error.message}`
          );
        }
      }
    } catch (error) {
      this.recordFailure(`Table relationships test error: ${error.message}`);
    }
  }

  /**
   * Helper methods for test recording
   */
  recordSuccess(message) {
    this.testResults.passed++;
    this.testResults.details.push({ status: "✅", message });
    console.log(`  ✅ ${message}`);
  }

  recordFailure(message) {
    this.testResults.failed++;
    this.testResults.details.push({ status: "❌", message });
    this.testResults.errors.push(message);
    console.log(`  ❌ ${message}`);
  }

  /**
   * Print comprehensive test summary
   */
  printTestSummary() {
    console.log("\n📋 Test Results Summary");
    console.log("=".repeat(50));
    console.log(`✅ Passed: ${this.testResults.passed}`);
    console.log(`❌ Failed: ${this.testResults.failed}`);
    console.log(
      `📊 Total Tests: ${this.testResults.passed + this.testResults.failed}`
    );
    console.log(
      `🎯 Success Rate: ${(
        (this.testResults.passed /
          (this.testResults.passed + this.testResults.failed)) *
        100
      ).toFixed(1)}%`
    );

    if (this.testResults.failed > 0) {
      console.log("\n❌ Failures:");
      this.testResults.errors.forEach((error) => console.log(`  • ${error}`));
    }

    console.log("\n📈 Detailed Results:");
    this.testResults.details.forEach((detail) => {
      console.log(`  ${detail.status} ${detail.message}`);
    });

    // System health assessment
    const healthScore =
      (this.testResults.passed /
        (this.testResults.passed + this.testResults.failed)) *
      100;
    console.log("\n🏥 System Health Assessment:");

    if (healthScore >= 95) {
      console.log("  🟢 EXCELLENT - System fully operational");
    } else if (healthScore >= 85) {
      console.log("  🟡 GOOD - Minor issues detected");
    } else if (healthScore >= 70) {
      console.log("  🟠 FAIR - Several issues need attention");
    } else {
      console.log("  🔴 POOR - Major issues require immediate attention");
    }

    console.log(`\n🔧 Enhanced Monitoring System Test Complete\n`);
  }

  /**
   * Generate test report for documentation
   */
  generateTestReport() {
    const report = {
      testRun: {
        timestamp: new Date().toISOString(),
        duration: "N/A", // Would track actual duration
        environment: process.env.NODE_ENV || "development",
      },
      results: this.testResults,
      systemHealth: {
        score: (
          (this.testResults.passed /
            (this.testResults.passed + this.testResults.failed)) *
          100
        ).toFixed(1),
        status: this.testResults.failed === 0 ? "healthy" : "needs_attention",
      },
      recommendations: this.generateRecommendations(),
    };

    return report;
  }

  /**
   * Generate recommendations based on test results
   */
  generateRecommendations() {
    const recommendations = [];

    if (this.testResults.failed > 0) {
      recommendations.push(
        "Address failing tests before production deployment"
      );
    }

    if (this.testResults.errors.some((e) => e.includes("database"))) {
      recommendations.push("Check database connection and schema");
    }

    if (this.testResults.errors.some((e) => e.includes("API"))) {
      recommendations.push(
        "Verify API endpoint availability and authentication"
      );
    }

    if (recommendations.length === 0) {
      recommendations.push("System is healthy and ready for production");
    }

    return recommendations;
  }
}

// Export for use in other test files
module.exports = MonitoringSystemIntegrationTest;

// Run tests if this file is executed directly
if (require.main === module) {
  const testSuite = new MonitoringSystemIntegrationTest();
  testSuite.runAllTests().catch(console.error);
}
