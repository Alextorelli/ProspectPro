/**
 * ENHANCED HUNTER.IO CLIENT WITH CIRCUIT BREAKER
 *
 * Production-ready Hunter.io integration with:
 * - Exponential backoff for rate limiting
 * - Circuit breaker pattern for API failures
 * - Comprehensive error handling and logging
 * - Budget management and cost optimization
 * - Request queuing and retry logic
 *
 * Fixes the critical 429 rate limiting issues that cause email discovery failure
 */

const axios = require("axios");
const { performance } = require("perf_hooks");

class EnhancedHunterIOClient {
  constructor(apiKey, config = {}) {
    this.apiKey = apiKey;
    this.baseUrl = "https://api.hunter.io/v2";

    // Configuration with production-ready defaults
    this.config = {
      // Budget Management
      monthlyBudget: config.monthlyBudget || 500,
      dailyBudget:
        config.dailyBudget || Math.floor((config.monthlyBudget || 500) / 30),
      maxCostPerRequest: config.maxCostPerRequest || 0.15,

      // Rate Limiting
      maxConcurrentRequests: config.maxConcurrentRequests || 2,
      baseDelayMs: config.baseDelayMs || 1000,
      maxRetries: config.maxRetries || 3,

      // Circuit Breaker
      failureThreshold: config.failureThreshold || 5,
      recoveryTimeoutMs: config.recoveryTimeoutMs || 300000, // 5 minutes

      // API Costs (per Hunter.io pricing)
      domainSearchCost: 0.098,
      emailVerificationCost: 0.049,
      emailFinderCost: 0.098,

      ...config,
    };

    // Circuit Breaker State
    this.circuitBreaker = {
      state: "CLOSED", // CLOSED, OPEN, HALF_OPEN
      failures: 0,
      lastFailureTime: null,
      successCount: 0,
    };

    // Request Queue and Rate Limiting
    this.requestQueue = [];
    this.activeRequests = 0;
    this.isProcessingQueue = false;

    // Performance Tracking
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      rateLimitedRequests: 0,
      totalCost: 0,
      averageResponseTime: 0,
      totalResponseTime: 0,
      lastResetTime: Date.now(),
    };

    console.log("🚀 Enhanced Hunter.io Client initialized");
    console.log(`   💰 Budget: $${this.config.dailyBudget}/day`);
    console.log(
      `   ⚡ Rate Limit: ${this.config.maxConcurrentRequests} concurrent requests`
    );
    console.log(
      `   🔧 Circuit Breaker: ${this.config.failureThreshold} failure threshold`
    );
  }

  /**
   * MAIN EMAIL DISCOVERY METHOD
   * Orchestrates the complete email discovery process with error handling
   */
  async discoverBusinessEmails(businessData) {
    const startTime = performance.now();

    console.log(
      `📧 Hunter.io discovery starting: ${businessData.business_name}`
    );

    const result = {
      business_name: businessData.business_name,
      domain: this.extractDomain(businessData.website),
      emails: [],
      hunter_used: false,
      cost: 0,
      confidence_scores: [],
      processing_time: 0,
      success: false,
      error: null,
      api_calls_made: 0,
    };

    try {
      // Pre-flight checks
      if (!result.domain || this.isInvalidDomain(result.domain)) {
        throw new Error(`Invalid domain: ${result.domain}`);
      }

      if (!this.canMakeRequest()) {
        throw new Error("Hunter.io budget/rate limit reached");
      }

      if (!this.isCircuitBreakerClosed()) {
        throw new Error(
          "Hunter.io circuit breaker is open - service temporarily unavailable"
        );
      }

      // STEP 1: Domain search for email patterns and addresses
      console.log(`🔍 Searching domain: ${result.domain}`);
      const domainResult = await this.domainSearchWithRetry(result.domain);

      if (
        domainResult &&
        domainResult.emails &&
        domainResult.emails.length > 0
      ) {
        result.emails.push(...domainResult.emails);
        result.cost += domainResult.cost || 0;
        result.api_calls_made++;
        result.hunter_used = true;

        console.log(
          `✅ Domain search found ${domainResult.emails.length} emails`
        );
      }

      // STEP 2: Targeted email finder for known contacts
      if (
        businessData.owner_name &&
        this.canMakeAdditionalRequest(result.cost)
      ) {
        const ownerEmail = await this.findPersonEmailWithRetry(
          result.domain,
          businessData.owner_name
        );

        if (ownerEmail) {
          // Check for duplicates before adding
          const isDuplicate = result.emails.some(
            (email) =>
              email.value.toLowerCase() === ownerEmail.value.toLowerCase()
          );

          if (!isDuplicate) {
            result.emails.push(ownerEmail);
            console.log(`👤 Found owner email: ${ownerEmail.value}`);
          }

          result.cost += this.config.emailFinderCost;
          result.api_calls_made++;
        }
      }

      // STEP 3: Email verification for high-priority emails
      if (
        result.emails.length > 0 &&
        this.canMakeAdditionalRequest(result.cost)
      ) {
        const verifiedEmails = await this.verifyPriorityEmails(result.emails);
        result.emails = verifiedEmails;
      }

      // Calculate success metrics
      result.confidence_scores = result.emails.map(
        (email) => email.confidence || 0
      );
      result.processing_time = performance.now() - startTime;
      result.success = result.emails.length > 0;

      this.recordSuccess(result.cost, result.processing_time);

      console.log(
        `🎉 Hunter.io success: ${
          result.emails.length
        } emails, $${result.cost.toFixed(3)}, ${Math.round(
          result.processing_time
        )}ms`
      );
      return result;
    } catch (error) {
      result.error = error.message;
      result.processing_time = performance.now() - startTime;

      this.recordFailure(error);

      console.error(
        `❌ Hunter.io failed for ${businessData.business_name}: ${error.message}`
      );
      return result;
    }
  }

  /**
   * DOMAIN SEARCH WITH RETRY LOGIC
   * Implements exponential backoff for rate limiting
   */
  async domainSearchWithRetry(domain, retryCount = 0) {
    try {
      return await this.queueRequest(() => this.performDomainSearch(domain));
    } catch (error) {
      if (this.isRateLimitError(error) && retryCount < this.config.maxRetries) {
        const backoffDelay = this.calculateBackoffDelay(retryCount);
        console.warn(
          `⚠️ Rate limited, waiting ${backoffDelay}ms before retry ${
            retryCount + 1
          }`
        );

        await this.delay(backoffDelay);
        return this.domainSearchWithRetry(domain, retryCount + 1);
      }

      throw error;
    }
  }

  /**
   * PERSON EMAIL FINDER WITH RETRY LOGIC
   */
  async findPersonEmailWithRetry(domain, fullName, retryCount = 0) {
    try {
      return await this.queueRequest(() =>
        this.performPersonEmailSearch(domain, fullName)
      );
    } catch (error) {
      if (this.isRateLimitError(error) && retryCount < this.config.maxRetries) {
        const backoffDelay = this.calculateBackoffDelay(retryCount);
        console.warn(
          `⚠️ Rate limited, waiting ${backoffDelay}ms before retry ${
            retryCount + 1
          }`
        );

        await this.delay(backoffDelay);
        return this.findPersonEmailWithRetry(domain, fullName, retryCount + 1);
      }

      throw error;
    }
  }

  /**
   * REQUEST QUEUE MANAGEMENT
   * Ensures we don't exceed concurrent request limits
   */
  async queueRequest(requestFunction) {
    return new Promise((resolve, reject) => {
      this.requestQueue.push({ requestFunction, resolve, reject });
      this.processQueue();
    });
  }

  async processQueue() {
    if (
      this.isProcessingQueue ||
      this.activeRequests >= this.config.maxConcurrentRequests
    ) {
      return;
    }

    this.isProcessingQueue = true;

    while (
      this.requestQueue.length > 0 &&
      this.activeRequests < this.config.maxConcurrentRequests
    ) {
      const { requestFunction, resolve, reject } = this.requestQueue.shift();

      this.activeRequests++;

      requestFunction()
        .then(resolve)
        .catch(reject)
        .finally(() => {
          this.activeRequests--;
          // Add delay between requests to respect rate limits
          setTimeout(() => this.processQueue(), this.config.baseDelayMs);
        });
    }

    this.isProcessingQueue = false;
  }

  /**
   * CORE API CALLS
   */
  async performDomainSearch(domain) {
    const startTime = performance.now();

    try {
      const response = await axios.get(`${this.baseUrl}/domain-search`, {
        params: {
          domain: domain,
          api_key: this.apiKey,
          limit: 10,
          offset: 0,
          type: "personal",
        },
        timeout: 15000,
      });

      const responseTime = performance.now() - startTime;
      this.stats.totalResponseTime += responseTime;
      this.stats.totalRequests++;

      if (response.data && response.data.data) {
        const emails = this.processEmailResults(
          response.data.data.emails || []
        );

        return {
          emails: emails,
          pattern: response.data.data.pattern,
          organization: response.data.data.organization,
          confidence: response.data.data.confidence || 0,
          cost: this.config.domainSearchCost,
          response_time: responseTime,
        };
      }

      return {
        emails: [],
        cost: this.config.domainSearchCost,
        response_time: responseTime,
      };
    } catch (error) {
      const responseTime = performance.now() - startTime;
      this.stats.totalRequests++;
      this.stats.failedRequests++;

      if (error.response && error.response.status === 429) {
        this.stats.rateLimitedRequests++;
        throw new Error(
          `Hunter.io rate limit exceeded (429): ${error.message}`
        );
      }

      if (error.response && error.response.status === 401) {
        throw new Error("Hunter.io API key invalid or expired");
      }

      if (error.response && error.response.status >= 500) {
        throw new Error(
          `Hunter.io server error (${error.response.status}): ${error.message}`
        );
      }

      throw new Error(`Hunter.io domain search failed: ${error.message}`);
    }
  }

  async performPersonEmailSearch(domain, fullName) {
    const startTime = performance.now();

    // Parse full name
    const nameParts = fullName.trim().split(/\s+/);
    const firstName = nameParts[0];
    const lastName = nameParts[nameParts.length - 1];

    if (!firstName || !lastName) {
      throw new Error("Invalid name format for person email search");
    }

    try {
      const response = await axios.get(`${this.baseUrl}/email-finder`, {
        params: {
          domain: domain,
          first_name: firstName,
          last_name: lastName,
          api_key: this.apiKey,
        },
        timeout: 15000,
      });

      const responseTime = performance.now() - startTime;
      this.stats.totalResponseTime += responseTime;
      this.stats.totalRequests++;

      if (response.data && response.data.data && response.data.data.email) {
        return {
          value: response.data.data.email,
          type: "personal",
          confidence: response.data.data.confidence || 75,
          sources: response.data.data.sources || ["hunter_io_finder"],
          first_name: response.data.data.first_name,
          last_name: response.data.data.last_name,
          position: response.data.data.position,
          response_time: responseTime,
        };
      }

      return null;
    } catch (error) {
      const responseTime = performance.now() - startTime;
      this.stats.totalRequests++;
      this.stats.failedRequests++;

      if (error.response && error.response.status === 429) {
        this.stats.rateLimitedRequests++;
        throw new Error(
          `Hunter.io rate limit exceeded (429): ${error.message}`
        );
      }

      throw new Error(`Hunter.io person email search failed: ${error.message}`);
    }
  }

  /**
   * EMAIL VERIFICATION FOR PRIORITY EMAILS
   */
  async verifyPriorityEmails(emails) {
    const priorityEmails = emails
      .filter((email) => this.isPriorityEmail(email.value))
      .slice(0, 3); // Limit to top 3 to control costs

    if (priorityEmails.length === 0) return emails;

    console.log(`🔍 Verifying ${priorityEmails.length} priority emails...`);

    const verificationPromises = priorityEmails.map(async (email) => {
      try {
        const verification = await this.verifyEmailWithRetry(email.value);
        return {
          ...email,
          verification: verification,
          confidence: verification
            ? Math.max(email.confidence || 0, verification.score || 0)
            : email.confidence,
        };
      } catch (error) {
        console.warn(
          `⚠️ Email verification failed for ${email.value}: ${error.message}`
        );
        return email;
      }
    });

    const verifiedPriorityEmails = await Promise.allSettled(
      verificationPromises
    );

    // Merge back with non-priority emails
    const updatedEmails = [...emails];
    verifiedPriorityEmails.forEach((result, index) => {
      if (result.status === "fulfilled") {
        const originalIndex = emails.indexOf(priorityEmails[index]);
        if (originalIndex >= 0) {
          updatedEmails[originalIndex] = result.value;
        }
      }
    });

    return updatedEmails;
  }

  async verifyEmailWithRetry(email, retryCount = 0) {
    try {
      const response = await axios.get(`${this.baseUrl}/email-verifier`, {
        params: {
          email: email,
          api_key: this.apiKey,
        },
        timeout: 10000,
      });

      if (response.data && response.data.data) {
        return {
          result: response.data.data.result,
          score: response.data.data.score || 0,
          deliverable: response.data.data.result === "deliverable",
          confidence: this.mapScoreToConfidence(response.data.data.score),
        };
      }

      return null;
    } catch (error) {
      if (this.isRateLimitError(error) && retryCount < this.config.maxRetries) {
        const backoffDelay = this.calculateBackoffDelay(retryCount);
        await this.delay(backoffDelay);
        return this.verifyEmailWithRetry(email, retryCount + 1);
      }

      throw error;
    }
  }

  /**
   * CIRCUIT BREAKER IMPLEMENTATION
   */
  isCircuitBreakerClosed() {
    const currentTime = Date.now();

    switch (this.circuitBreaker.state) {
      case "CLOSED":
        return true;

      case "OPEN":
        if (
          currentTime - this.circuitBreaker.lastFailureTime >
          this.config.recoveryTimeoutMs
        ) {
          this.circuitBreaker.state = "HALF_OPEN";
          this.circuitBreaker.successCount = 0;
          console.log(
            "🔄 Hunter.io circuit breaker: HALF_OPEN (attempting recovery)"
          );
          return true;
        }
        return false;

      case "HALF_OPEN":
        return true;

      default:
        return false;
    }
  }

  recordSuccess(cost, responseTime) {
    this.stats.successfulRequests++;
    this.stats.totalCost += cost;

    // Update circuit breaker
    if (this.circuitBreaker.state === "HALF_OPEN") {
      this.circuitBreaker.successCount++;

      if (this.circuitBreaker.successCount >= 3) {
        this.circuitBreaker.state = "CLOSED";
        this.circuitBreaker.failures = 0;
        console.log("✅ Hunter.io circuit breaker: CLOSED (recovered)");
      }
    } else if (this.circuitBreaker.state === "CLOSED") {
      // Gradually reduce failure count on success
      this.circuitBreaker.failures = Math.max(
        0,
        this.circuitBreaker.failures - 1
      );
    }
  }

  recordFailure(error) {
    this.stats.failedRequests++;
    this.circuitBreaker.failures++;
    this.circuitBreaker.lastFailureTime = Date.now();

    if (this.circuitBreaker.failures >= this.config.failureThreshold) {
      this.circuitBreaker.state = "OPEN";
      console.error(
        `🚫 Hunter.io circuit breaker: OPEN (${this.circuitBreaker.failures} failures)`
      );
      console.error(`   Last error: ${error.message}`);
      console.error(
        `   Recovery attempt in ${Math.floor(
          this.config.recoveryTimeoutMs / 60000
        )} minutes`
      );
    }
  }

  /**
   * UTILITY FUNCTIONS
   */
  canMakeRequest() {
    // Check daily budget
    if (this.stats.totalCost >= this.config.dailyBudget) {
      console.warn(
        `⚠️ Hunter.io daily budget reached: $${this.stats.totalCost.toFixed(2)}`
      );
      return false;
    }

    // Check circuit breaker
    if (!this.isCircuitBreakerClosed()) {
      return false;
    }

    return true;
  }

  canMakeAdditionalRequest(currentCost) {
    return (
      currentCost + this.config.maxCostPerRequest <= this.config.dailyBudget
    );
  }

  isRateLimitError(error) {
    return (
      error.message.includes("429") ||
      error.message.toLowerCase().includes("rate limit") ||
      (error.response && error.response.status === 429)
    );
  }

  calculateBackoffDelay(retryCount) {
    // Exponential backoff with jitter: 2^retryCount * baseDelay + random jitter
    const exponentialDelay = Math.pow(2, retryCount) * this.config.baseDelayMs;
    const jitter = Math.random() * 1000; // Add up to 1 second random jitter
    return Math.min(exponentialDelay + jitter, 30000); // Max 30 seconds
  }

  processEmailResults(emails) {
    if (!emails || !Array.isArray(emails)) return [];

    return emails
      .filter(
        (email) => email && email.value && this.isValidEmailFormat(email.value)
      )
      .map((email) => ({
        value: email.value,
        type: email.type || "professional",
        confidence: email.confidence || 50,
        sources: ["hunter_io_domain_search"],
        first_name: email.first_name,
        last_name: email.last_name,
        position: email.position,
        department: email.department,
      }))
      .sort((a, b) => (b.confidence || 0) - (a.confidence || 0));
  }

  isPriorityEmail(email) {
    const address = email.toLowerCase();
    const highPriorityPatterns = [
      "ceo@",
      "owner@",
      "president@",
      "manager@",
      "director@",
    ];
    const lowPriorityPatterns = [
      "noreply@",
      "donotreply@",
      "automated@",
      "no-reply@",
    ];

    if (lowPriorityPatterns.some((pattern) => address.includes(pattern))) {
      return false;
    }

    return (
      highPriorityPatterns.some((pattern) => address.includes(pattern)) ||
      address.includes("admin") ||
      (address.split("@")[0].includes(".") && !address.includes("info"))
    );
  }

  extractDomain(website) {
    if (!website) return null;
    try {
      const url = website.startsWith("http") ? website : `https://${website}`;
      return new URL(url).hostname.replace("www.", "");
    } catch {
      return null;
    }
  }

  isInvalidDomain(domain) {
    const invalidPatterns = [
      "localhost",
      "127.0.0.1",
      "example.com",
      "test.com",
      "facebook.com",
      "instagram.com",
      "twitter.com",
      "linkedin.com",
      "gmail.com",
      "yahoo.com",
      "hotmail.com",
    ];
    return (
      !domain || invalidPatterns.some((pattern) => domain.includes(pattern))
    );
  }

  isValidEmailFormat(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  mapScoreToConfidence(score) {
    if (!score) return 50;
    if (score >= 90) return 95;
    if (score >= 80) return 85;
    if (score >= 70) return 75;
    if (score >= 60) return 65;
    return 50;
  }

  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get performance statistics
   */
  getPerformanceStats() {
    return {
      ...this.stats,
      successRate:
        this.stats.totalRequests > 0
          ? (
              (this.stats.successfulRequests / this.stats.totalRequests) *
              100
            ).toFixed(1)
          : 0,
      rateLimitRate:
        this.stats.totalRequests > 0
          ? (
              (this.stats.rateLimitedRequests / this.stats.totalRequests) *
              100
            ).toFixed(1)
          : 0,
      averageResponseTime:
        this.stats.totalRequests > 0
          ? (this.stats.totalResponseTime / this.stats.totalRequests).toFixed(0)
          : 0,
      costPerSuccessfulRequest:
        this.stats.successfulRequests > 0
          ? (this.stats.totalCost / this.stats.successfulRequests).toFixed(3)
          : 0,
      circuitBreakerState: this.circuitBreaker.state,
      remainingBudget: Math.max(
        0,
        this.config.dailyBudget - this.stats.totalCost
      ).toFixed(2),
    };
  }

  /**
   * Reset daily statistics (call this daily)
   */
  resetDailyStats() {
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      rateLimitedRequests: 0,
      totalCost: 0,
      averageResponseTime: 0,
      totalResponseTime: 0,
      lastResetTime: Date.now(),
    };

    console.log("🔄 Hunter.io daily statistics reset");
  }
}

module.exports = EnhancedHunterIOClient;
