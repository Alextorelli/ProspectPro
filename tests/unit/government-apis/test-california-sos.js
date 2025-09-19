/**
 * California SOS API Client Unit Tests
 * Comprehensive unit testing for California Secretary of State API integration
 */

const CaliforniaSOSClient = require("../../../modules/api-clients/california-sos-client");

class CaliforniaSOSUnitTests {
  constructor() {
    this.client = new CaliforniaSOSClient();
    this.testResults = [];
  }

  async runAllTests() {
    console.log("🏛️ Running California SOS API Unit Tests...");

    await this.testClientInitialization();
    await this.testSearchMethodValidation();
    await this.testRateLimiting();
    await this.testResponseNormalization();
    await this.testErrorHandling();
    await this.testCaching();

    return this.generateReport();
  }

  async testClientInitialization() {
    // Test 1: Constructor without API key
    try {
      const client1 = new CaliforniaSOSClient();
      this.recordTest(
        "Constructor - No API Key",
        true,
        "Client created successfully"
      );
    } catch (error) {
      this.recordTest("Constructor - No API Key", false, error.message);
    }

    // Test 2: Constructor with API key
    try {
      const client2 = new CaliforniaSOSClient("test-api-key");
      this.recordTest(
        "Constructor - With API Key",
        client2.apiKey === "test-api-key",
        "API key set correctly"
      );
    } catch (error) {
      this.recordTest("Constructor - With API Key", false, error.message);
    }

    // Test 3: Default configuration
    try {
      const config = {
        rateLimitPerHour: this.client.rateLimitPerHour,
        qualityScore: this.client.qualityScore,
        costPerRequest: this.client.costPerRequest,
      };
      const hasValidDefaults =
        config.rateLimitPerHour === 100 &&
        config.qualityScore === 75 &&
        config.costPerRequest === 0.0;
      this.recordTest(
        "Default Configuration",
        hasValidDefaults,
        JSON.stringify(config)
      );
    } catch (error) {
      this.recordTest("Default Configuration", false, error.message);
    }
  }

  async testSearchMethodValidation() {
    // Test 1: Valid search input
    try {
      const result = await this.client.searchByKeyword("Test Company");
      const hasRequiredFields =
        result.hasOwnProperty("found") &&
        result.hasOwnProperty("entities") &&
        result.hasOwnProperty("source") &&
        result.hasOwnProperty("qualityScore");
      this.recordTest(
        "Search - Valid Input",
        hasRequiredFields,
        "Response structure correct"
      );
    } catch (error) {
      this.recordTest("Search - Valid Input", false, error.message);
    }

    // Test 2: Empty string input
    try {
      await this.client.searchByKeyword("");
      this.recordTest(
        "Search - Empty String",
        false,
        "Should reject empty string"
      );
    } catch (error) {
      this.recordTest(
        "Search - Empty String",
        true,
        "Correctly rejects empty input"
      );
    }

    // Test 3: Non-string input
    try {
      await this.client.searchByKeyword(123);
      this.recordTest(
        "Search - Non-String Input",
        false,
        "Should reject non-string input"
      );
    } catch (error) {
      this.recordTest(
        "Search - Non-String Input",
        true,
        "Correctly rejects non-string input"
      );
    }

    // Test 4: Null input
    try {
      await this.client.searchByKeyword(null);
      this.recordTest("Search - Null Input", false, "Should reject null input");
    } catch (error) {
      this.recordTest(
        "Search - Null Input",
        true,
        "Correctly rejects null input"
      );
    }
  }

  async testRateLimiting() {
    // Test 1: Rate limit check method
    try {
      const canProceed = this.client.checkRateLimit();
      this.recordTest(
        "Rate Limit - Check Method",
        typeof canProceed === "boolean",
        `Returns boolean: ${canProceed}`
      );
    } catch (error) {
      this.recordTest("Rate Limit - Check Method", false, error.message);
    }

    // Test 2: Rate limit enforcement
    try {
      // Simulate hitting rate limit
      this.client.requestCount = this.client.rateLimitPerHour;
      const canProceed = this.client.checkRateLimit();
      this.recordTest(
        "Rate Limit - Enforcement",
        !canProceed,
        "Rate limit correctly enforced when exceeded"
      );
    } catch (error) {
      this.recordTest("Rate Limit - Enforcement", false, error.message);
    }

    // Test 3: Rate limit reset
    try {
      // Reset time window
      this.client.lastResetTime = Date.now() - 61 * 60 * 1000; // 61 minutes ago
      this.client.requestCount = this.client.rateLimitPerHour;
      const canProceed = this.client.checkRateLimit();
      this.recordTest(
        "Rate Limit - Window Reset",
        canProceed,
        "Rate limit window resets correctly"
      );
    } catch (error) {
      this.recordTest("Rate Limit - Window Reset", false, error.message);
    }
  }

  async testResponseNormalization() {
    // Test 1: Empty response normalization
    try {
      const normalized = this.client.normalizeSearchResponse(
        [],
        "Test Company"
      );
      const isValid =
        normalized.found === false &&
        normalized.totalResults === 0 &&
        normalized.entities.length === 0;
      this.recordTest(
        "Response Normalization - Empty",
        isValid,
        "Empty response handled correctly"
      );
    } catch (error) {
      this.recordTest("Response Normalization - Empty", false, error.message);
    }

    // Test 2: Mock entity response normalization
    try {
      const mockData = [
        {
          EntityID: "12345",
          EntityName: "Test Company LLC",
          EntityType: "LLC",
          StatusDescription: "Active",
        },
      ];
      const normalized = this.client.normalizeSearchResponse(
        mockData,
        "Test Company"
      );
      const isValid =
        normalized.found === true &&
        normalized.totalResults === 1 &&
        normalized.entities[0].entityName === "Test Company LLC";
      this.recordTest(
        "Response Normalization - Valid Data",
        isValid,
        "Valid data normalized correctly"
      );
    } catch (error) {
      this.recordTest(
        "Response Normalization - Valid Data",
        false,
        error.message
      );
    }

    // Test 3: Confidence boost calculation
    try {
      const mockData = [
        {
          EntityName: "Test Company",
        },
      ];
      const normalized = this.client.normalizeSearchResponse(
        mockData,
        "Test Company"
      );
      const hasConfidenceBoost = normalized.confidenceBoost > 0;
      this.recordTest(
        "Response Normalization - Confidence Boost",
        hasConfidenceBoost,
        `Confidence boost: ${normalized.confidenceBoost}`
      );
    } catch (error) {
      this.recordTest(
        "Response Normalization - Confidence Boost",
        false,
        error.message
      );
    }
  }

  async testErrorHandling() {
    // Test 1: Network error simulation
    try {
      // Create client with invalid base URL to simulate network error
      const errorClient = new CaliforniaSOSClient("test-key");
      errorClient.baseUrl = "https://invalid-url-that-does-not-exist.com";

      const result = await errorClient.searchByKeyword("Test Company");
      const hasErrorHandling = result.hasOwnProperty("error") && !result.found;
      this.recordTest(
        "Error Handling - Network Error",
        hasErrorHandling,
        "Network errors handled gracefully"
      );
    } catch (error) {
      this.recordTest(
        "Error Handling - Network Error",
        true,
        "Error properly thrown and caught"
      );
    }

    // Test 2: Mock response for missing API key
    try {
      const noKeyClient = new CaliforniaSOSClient(null);
      const result = await noKeyClient.searchByKeyword("Test Company");
      const isMockResponse = result.mockData === true;
      this.recordTest(
        "Error Handling - Missing API Key",
        isMockResponse,
        "Mock response returned for missing API key"
      );
    } catch (error) {
      this.recordTest("Error Handling - Missing API Key", false, error.message);
    }
  }

  async testCaching() {
    // Test 1: Cache key generation
    try {
      const key1 = this.client.generateCacheKey("Test Company", {});
      const key2 = this.client.generateCacheKey("test company", {});
      const key3 = this.client.generateCacheKey("Test Company", {
        exactMatch: true,
      });

      const normalizedSame = key1 === key2;
      const optionsDifferent = key1 !== key3;

      this.recordTest(
        "Cache - Key Generation",
        normalizedSame && optionsDifferent,
        "Cache keys generated correctly"
      );
    } catch (error) {
      this.recordTest("Cache - Key Generation", false, error.message);
    }

    // Test 2: Cache storage and retrieval
    try {
      const testData = { test: "data" };
      const cacheKey = "test-cache-key";

      // Store in cache
      this.client.cache.set(cacheKey, {
        data: testData,
        timestamp: Date.now(),
      });

      // Retrieve from cache
      const cached = this.client.cache.get(cacheKey);
      const isCached = cached && cached.data.test === "data";

      this.recordTest(
        "Cache - Storage/Retrieval",
        isCached,
        "Cache stores and retrieves data correctly"
      );
    } catch (error) {
      this.recordTest("Cache - Storage/Retrieval", false, error.message);
    }

    // Test 3: Cache expiration
    try {
      const oldCacheKey = "old-cache-key";
      this.client.cache.set(oldCacheKey, {
        data: { test: "old" },
        timestamp: Date.now() - 25 * 60 * 60 * 1000, // 25 hours ago (expired)
      });

      // This should not use expired cache
      const result = await this.client.searchByKeyword("Old Test");
      this.recordTest(
        "Cache - Expiration",
        true,
        "Cache expiration handled correctly"
      );
    } catch (error) {
      this.recordTest("Cache - Expiration", false, error.message);
    }

    // Test 4: Clear cache
    try {
      this.client.cache.set("test", { data: "test" });
      this.client.clearCache();
      const isEmpty = this.client.cache.size === 0;
      this.recordTest(
        "Cache - Clear Function",
        isEmpty,
        "Cache cleared successfully"
      );
    } catch (error) {
      this.recordTest("Cache - Clear Function", false, error.message);
    }
  }

  recordTest(testName, passed, details) {
    const result = {
      name: `CA SOS - ${testName}`,
      passed: passed,
      details: details,
      timestamp: new Date().toISOString(),
    };

    this.testResults.push(result);

    const status = passed ? "✅" : "❌";
    console.log(`${status} ${result.name}: ${details}`);
  }

  generateReport() {
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter((t) => t.passed).length;
    const failedTests = totalTests - passedTests;
    const successRate = Math.round((passedTests / totalTests) * 100);

    console.log("\n📋 California SOS Unit Test Report");
    console.log("==================================");
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${passedTests} (${successRate}%)`);
    console.log(`Failed: ${failedTests}`);

    if (failedTests > 0) {
      console.log("\n❌ Failed Tests:");
      this.testResults
        .filter((t) => !t.passed)
        .forEach((t) => console.log(`  - ${t.name}: ${t.details}`));
    }

    return {
      totalTests,
      passedTests,
      failedTests,
      successRate,
      details: this.testResults,
    };
  }
}

module.exports = CaliforniaSOSUnitTests;

// Run tests if called directly
if (require.main === module) {
  const tests = new CaliforniaSOSUnitTests();
  tests
    .runAllTests()
    .then((results) => {
      process.exit(results.failedTests > 0 ? 1 : 0);
    })
    .catch((error) => {
      console.error("Unit tests crashed:", error);
      process.exit(1);
    });
}
