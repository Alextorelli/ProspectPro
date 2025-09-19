// ZeroBounce Email Validation Client for Supabase Edge Functions
// TypeScript/Deno port with cost optimization

export interface EmailValidationResult {
  email: string;
  isValid: boolean;
  confidence: number;
  status: string;
  subStatus?: string;
  freeEmail: boolean;
  disposable: boolean;
  toxicDomain: boolean;
  didYouMean?: string;
  mx: {
    found: boolean;
    record: string;
  };
  smtp: {
    provider: string;
    connected: boolean;
  };
  source: string;
  cost: number;
  timestamp: string;
  processingTimeMs?: number;
}

export interface BulkValidationResult {
  results: EmailValidationResult[];
  totalValidated: number;
  totalCost: string;
  validEmails: number;
  confidence: number;
}

export class ZeroBounceClient {
  private apiKey: string;
  private baseUrl = "https://api.zerobounce.net/v2";
  private requestCount = 0;
  private dailyLimit = 100; // Free tier limit
  private costPerValidation = 0.007; // ~$0.007 per validation
  private dailyBudget = 0.7; // $0.70 daily limit for free tier
  private dailySpend = 0;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || Deno.env.get("ZEROBOUNCE_API_KEY") || "";
    if (!this.apiKey) {
      console.warn("⚠️ ZeroBounce API key not configured");
    }
  }

  /**
   * Validate single email address
   */
  async validateEmail(email: string): Promise<EmailValidationResult> {
    if (!this.apiKey) {
      throw new Error("ZeroBounce API key not configured");
    }

    if (this.dailySpend >= this.dailyBudget) {
      throw new Error("ZeroBounce daily budget limit reached");
    }

    try {
      const url = `${this.baseUrl}/validate?api_key=${this.apiKey}&email=${encodeURIComponent(email)}`;

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
  async validateBulkEmails(emails: string[], maxBudget = 5.0): Promise<BulkValidationResult> {
    const results: EmailValidationResult[] = [];
    let totalCost = 0;

    for (const email of emails) {
      if (totalCost + this.costPerValidation > maxBudget) {
        console.warn(`⚠️ ZeroBounce bulk validation stopped at budget limit: $${maxBudget}`);
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
          freeEmail: false,
          disposable: false,
          toxicDomain: false,
          mx: { found: false, record: "" },
          smtp: { provider: "", connected: false },
          source: "ZeroBounce",
          cost: this.costPerValidation,
          timestamp: new Date().toISOString(),
        });
      }
    }

    return {
      results,
      totalValidated: results.length,
      totalCost: totalCost.toFixed(3),
      validEmails: results.filter((r) => r.isValid).length,
      confidence: results.length > 0 ? Math.round(results.reduce((sum, r) => sum + r.confidence, 0) / results.length) : 0,
    };
  }

  /**
   * Enhanced email validation with multiple checks
   */
  async enhancedEmailValidation(
    email: string,
    options: {
      skipDisposable?: boolean;
      skipFreeEmails?: boolean;
      requireMX?: boolean;
      minConfidence?: number;
    } = {}
  ): Promise<EmailValidationResult> {
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
      }

      if (skipFreeEmails && result.freeEmail) {
        result.confidence = Math.max(result.confidence - 20, 20);
      }

      if (requireMX && !result.mx.found) {
        result.isValid = false;
        result.confidence = 5;
      }

      if (result.toxicDomain) {
        result.isValid = false;
        result.confidence = 0;
      }

      // Final confidence check
      if (result.confidence < minConfidence) {
        result.isValid = false;
      }

      return result;
    } catch (error) {
      return {
        email,
        isValid: false,
        confidence: 0,
        status: "error",
        freeEmail: false,
        disposable: false,
        toxicDomain: false,
        mx: { found: false, record: "" },
        smtp: { provider: "", connected: false },
        source: "ZeroBounce",
        cost: this.costPerValidation,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Get account credits and usage information
   */
  async getAccountInfo(): Promise<any> {
    if (!this.apiKey) {
      return { error: "API key not configured" };
    }

    try {
      const response = await fetch(`${this.baseUrl}/getcredits?api_key=${this.apiKey}`);
      const data = await response.json();

      return {
        credits: data.Credits || 0,
        requestCount: this.requestCount,
        dailySpend: this.dailySpend.toFixed(3),
        costPerValidation: this.costPerValidation,
      };
    } catch (error) {
      return { error: (error as Error).message };
    }
  }

  /**
   * Check if we can make another validation request within budget
   */
  canMakeRequest(budgetLimit?: number): boolean {
    const budget = budgetLimit || this.dailyBudget;
    return this.dailySpend + this.costPerValidation <= budget;
  }

  /**
   * Normalize ZeroBounce response to match ProspectPro format
   */
  private normalizeZeroBounceResponse(data: any, email: string): EmailValidationResult {
    const statusMapping: { [key: string]: { isValid: boolean; confidence: number } } = {
      valid: { isValid: true, confidence: 95 },
      invalid: { isValid: false, confidence: 5 },
      "catch-all": { isValid: true, confidence: 75 },
      unknown: { isValid: false, confidence: 30 },
      spamtrap: { isValid: false, confidence: 0 },
      abuse: { isValid: false, confidence: 0 },
      do_not_mail: { isValid: false, confidence: 0 },
    };

    const mapping = statusMapping[data.status] || { isValid: false, confidence: 0 };

    return {
      email: email,
      isValid: mapping.isValid,
      confidence: mapping.confidence,
      status: data.status,
      subStatus: data.sub_status,
      freeEmail: data.free_email || false,
      disposable: data.disposable || false,
      toxicDomain: data.toxic || false,
      didYouMean: data.did_you_mean,
      mx: {
        found: data.mx_found || false,
        record: data.mx_record || "",
      },
      smtp: {
        provider: data.smtp_provider || "",
        connected: data.smtp_connected || false,
      },
      source: "ZeroBounce",
      cost: this.costPerValidation,
      timestamp: new Date().toISOString(),
      processingTimeMs: data.process_time_ms || null,
    };
  }

  /**
   * Get usage statistics
   */
  getUsageStats(): any {
    return {
      totalRequests: this.requestCount,
      totalCost: this.dailySpend.toFixed(3),
      costPerValidation: this.costPerValidation,
      remainingBudget: (this.dailyBudget - this.dailySpend).toFixed(3),
    };
  }
}