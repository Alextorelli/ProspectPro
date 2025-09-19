require("dotenv").config();

/**
 * ZeroBounce Email Verification Client for ProspectPro
 * Enhanced email validation with detailed deliverability analysis
 * Integrates with existing NeverBounce for redundant validation
 */

// Handle fetch for different Node.js versions
let fetch;
try {
  fetch = globalThis.fetch || require("node-fetch");
} catch (error) {
  console.warn("Fetch not available, some features may be limited");
  fetch = () => Promise.reject(new Error("Fetch not available"));
}

class ZeroBounceClient {
  constructor(apiKey) {
    this.apiKey = apiKey || process.env.ZEROBOUNCE_API_KEY;
    this.baseUrl = "https://api.zerobounce.net/v2";
    this.requestCount = 0;
    this.dailyLimit = 100; // Free tier limit
    this.costPerValidation = 0.007; // ~$0.007 per validation
    this.dailyBudget = 0.7; // $0.70 daily limit for free tier
    this.dailySpend = 0;

    if (!this.apiKey) {
      console.warn("⚠️ ZeroBounce API key not configured");
    }
  }

  /**
   * Validate single email address
   * Returns detailed deliverability analysis
   */
  async validateEmail(email) {
    if (!this.apiKey) {
      throw new Error("ZeroBounce API key not configured");
    }

    if (this.dailySpend >= this.dailyBudget) {
      throw new Error("ZeroBounce daily budget limit reached");
    }

    try {
      const url = `${this.baseUrl}/validate?api_key=${
        this.apiKey
      }&email=${encodeURIComponent(email)}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "User-Agent": "ProspectPro/1.0 Email Validation",
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("ZeroBounce API key invalid");
        }
        if (response.status === 429) {
          throw new Error("ZeroBounce rate limit exceeded");
        }
        throw new Error(`ZeroBounce API returned ${response.status}`);
      }

      const data = await response.json();
      this.requestCount++;
      this.dailySpend += this.costPerValidation;

      return this.normalizeZeroBounceResponse(data, email);
    } catch (error) {
      console.error("ZeroBounce validation failed:", error);
      throw error;
    }
  }

  /**
   * Bulk email validation (for batch processing)
   */
  async validateBulkEmails(emails, maxBudget = 5.0) {
    const results = [];
    let totalCost = 0;

    for (const email of emails) {
      if (totalCost + this.costPerValidation > maxBudget) {
        console.warn(
          `⚠️ ZeroBounce bulk validation stopped at budget limit: $${maxBudget}`
        );
        break;
      }

      try {
        const result = await this.validateEmail(email);
        results.push(result);
        totalCost += this.costPerValidation;

        // Rate limiting - 10 requests per second max
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        results.push({
          email,
          isValid: false,
          confidence: 0,
          status: "error",
          error: error.message,
          source: "ZeroBounce",
          cost: this.costPerValidation,
        });
      }
    }

    return {
      results,
      totalValidated: results.length,
      totalCost: totalCost.toFixed(3),
      validEmails: results.filter((r) => r.isValid).length,
      confidence:
        results.length > 0
          ? Math.round(
              results.reduce((sum, r) => sum + r.confidence, 0) / results.length
            )
          : 0,
    };
  }

  /**
   * Normalize ZeroBounce response to match ProspectPro format
   */
  normalizeZeroBounceResponse(data, email) {
    const statusMapping = {
      valid: { isValid: true, confidence: 95 },
      invalid: { isValid: false, confidence: 5 },
      "catch-all": { isValid: true, confidence: 75 },
      unknown: { isValid: false, confidence: 30 },
      spamtrap: { isValid: false, confidence: 0 },
      abuse: { isValid: false, confidence: 0 },
      do_not_mail: { isValid: false, confidence: 0 },
    };

    const mapping = statusMapping[data.status] || {
      isValid: false,
      confidence: 0,
    };

    return {
      email: email,
      isValid: mapping.isValid,
      confidence: mapping.confidence,
      status: data.status,
      subStatus: data.sub_status,
      freeEmail: data.free_email,
      disposable: data.disposable,
      toxicDomain: data.toxic,
      didYouMean: data.did_you_mean,
      mx: {
        found: data.mx_found,
        record: data.mx_record,
      },
      smtp: {
        provider: data.smtp_provider,
        connected: data.smtp_connected,
      },
      source: "ZeroBounce",
      cost: this.costPerValidation,
      timestamp: new Date().toISOString(),
      processingTimeMs: data.process_time_ms || null,
    };
  }

  /**
   * Get account credits and usage information
   */
  async getAccountInfo() {
    if (!this.apiKey) {
      return { error: "API key not configured" };
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/getcredits?api_key=${this.apiKey}`
      );
      const data = await response.json();

      return {
        credits: data.Credits || 0,
        requestCount: this.requestCount,
        dailySpend: this.dailySpend.toFixed(3),
        costPerValidation: this.costPerValidation,
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Check if we can make another validation request within budget
   */
  canMakeRequest(budgetLimit = null) {
    const budget = budgetLimit || this.dailyBudget;
    return this.dailySpend + this.costPerValidation <= budget;
  }

  /**
   * Enhanced email validation with multiple checks
   * Combines format validation, domain verification, and deliverability
   */
  async enhancedEmailValidation(email, options = {}) {
    const {
      skipDisposable = true,
      skipFreeEmails = false,
      requireMX = true,
      minConfidence = 80,
    } = options;

    try {
      const result = await this.validateEmail(email);

      // Apply business rules
      if (skipDisposable && result.disposable) {
        result.isValid = false;
        result.confidence = 10;
        result.reason = "Disposable email address";
      }

      if (skipFreeEmails && result.freeEmail) {
        result.confidence = Math.max(result.confidence - 20, 20);
        result.reason = "Free email provider";
      }

      if (requireMX && !result.mx.found) {
        result.isValid = false;
        result.confidence = 5;
        result.reason = "No MX record found";
      }

      if (result.toxicDomain) {
        result.isValid = false;
        result.confidence = 0;
        result.reason = "Toxic domain detected";
      }

      // Final confidence check
      if (result.confidence < minConfidence) {
        result.isValid = false;
        result.reason =
          result.reason ||
          `Confidence below threshold (${result.confidence}% < ${minConfidence}%)`;
      }

      return result;
    } catch (error) {
      return {
        email,
        isValid: false,
        confidence: 0,
        status: "error",
        error: error.message,
        source: "ZeroBounce",
        cost: this.costPerValidation,
      };
    }
  }

  /**
   * Get usage statistics
   */
  getUsageStats() {
    return {
      totalRequests: this.requestCount,
      totalCost: this.totalCost,
      costPerValidation: 0.007,
      creditsRemaining: this.creditsRemaining || null,
      rateLimitRemaining: this.rateLimitRemaining || null,
    };
  }
}

module.exports = ZeroBounceClient;
