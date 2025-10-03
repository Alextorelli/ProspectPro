import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

/**
 * Hunter.io Comprehensive Email Discovery & Verification Edge Function
 * Implements all Hunter.io API endpoints with cost optimization
 *
 * Pricing:
 * - Email Count (Domain Search stats): FREE
 * - Domain Search: $0.034 per search
 * - Email Finder: $0.034 per request
 * - Email Verifier: $0.01 per verification
 * - Person/Company Enrichment: $0.034 per enrichment
 *
 * Features:
 * - Circuit breakers per endpoint
 * - Cost tracking and budgeting
 * - Confidence scoring
 * - Smart email prioritization
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface HunterRequest {
  action:
    | "domain-search"
    | "email-finder"
    | "email-verifier"
    | "email-count"
    | "person-enrichment"
    | "company-enrichment";

  // Domain search parameters
  domain?: string;
  companyName?: string;
  limit?: number;

  // Email finder parameters
  firstName?: string;
  lastName?: string;

  // Email verifier parameters
  email?: string;

  // Enrichment parameters
  personEmail?: string;

  // Budget control
  maxCostPerRequest?: number;
}

interface HunterResponse {
  success: boolean;
  action: string;
  data?: any;
  cost: number;
  confidence?: number;
  metadata?: {
    requests_remaining?: number;
    requests_used?: number;
    reset_date?: string;
  };
  error?: string;
}

class HunterAPIClient {
  private apiKey: string;
  private baseURL = "https://api.hunter.io/v2";
  private circuitBreaker = {
    emailCount: { failures: 0, lastFailure: 0, threshold: 3 },
    domainSearch: { failures: 0, lastFailure: 0, threshold: 3 },
    emailFinder: { failures: 0, lastFailure: 0, threshold: 3 },
    emailVerifier: { failures: 0, lastFailure: 0, threshold: 3 },
    enrichment: { failures: 0, lastFailure: 0, threshold: 3 },
  };
  private cache = new Map();
  private cacheTTL = 24 * 60 * 60 * 1000; // 24 hours

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * FREE: Get email count for a domain (doesn't count against quota)
   */
  async getEmailCount(domain: string): Promise<HunterResponse> {
    const endpoint = "emailCount";

    // Check circuit breaker
    if (this.isCircuitOpen(endpoint)) {
      throw new Error(`Circuit breaker open for ${endpoint}`);
    }

    try {
      const url = `${this.baseURL}/email-count?domain=${encodeURIComponent(
        domain
      )}&api_key=${this.apiKey}`;

      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.errors?.[0]?.details || "Email count failed");
      }

      this.resetCircuitBreaker(endpoint);

      return {
        success: true,
        action: "email-count",
        data: {
          domain,
          total: data.data.total,
          personal_emails: data.data.personal_emails,
          generic_emails: data.data.generic_emails,
        },
        cost: 0, // FREE
        metadata: {
          requests_remaining: data.meta.requests?.remaining,
          requests_used: data.meta.requests?.used,
        },
      };
    } catch (error) {
      this.recordFailure(endpoint);
      throw error;
    }
  }

  /**
   * PAID: Domain search - find all emails for a domain
   * Cost: $0.034 per search
   */
  async domainSearch(domain: string, limit = 10): Promise<HunterResponse> {
    const endpoint = "domainSearch";
    const cost = 0.034;

    // Check circuit breaker
    if (this.isCircuitOpen(endpoint)) {
      throw new Error(`Circuit breaker open for ${endpoint}`);
    }

    // Check cache first
    const cacheKey = `domain_search_${domain}_${limit}`;
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      console.log(`📦 Using cached domain search for ${domain}`);
      return { ...cached.data, cost: 0 }; // No cost for cached results
    }

    try {
      const url = `${this.baseURL}/domain-search?domain=${encodeURIComponent(
        domain
      )}&limit=${limit}&api_key=${this.apiKey}`;

      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.errors?.[0]?.details || "Domain search failed");
      }

      this.resetCircuitBreaker(endpoint);

      const result: HunterResponse = {
        success: true,
        action: "domain-search",
        data: {
          domain,
          organization: data.data.organization,
          emails: data.data.emails.map((email: any) => ({
            value: email.value,
            type: email.type,
            confidence: email.confidence,
            firstName: email.first_name,
            lastName: email.last_name,
            position: email.position,
            seniority: email.seniority,
            department: email.department,
            linkedin: email.linkedin,
            twitter: email.twitter,
            phone_number: email.phone_number,
          })),
          pattern: data.data.pattern,
          webmail: data.data.webmail,
        },
        cost,
        confidence: data.data.emails.length > 0 ? 85 : 0,
        metadata: {
          requests_remaining: data.meta.requests?.remaining,
          requests_used: data.meta.requests?.used,
        },
      };

      // Cache the result
      this.cache.set(cacheKey, {
        data: result,
        timestamp: Date.now(),
      });

      return result;
    } catch (error) {
      this.recordFailure(endpoint);
      throw error;
    }
  }

  /**
   * PAID: Email finder - find email for a specific person
   * Cost: $0.034 per request
   */
  async emailFinder(
    domain: string,
    firstName: string,
    lastName: string
  ): Promise<HunterResponse> {
    const endpoint = "emailFinder";
    const cost = 0.034;

    // Check circuit breaker
    if (this.isCircuitOpen(endpoint)) {
      throw new Error(`Circuit breaker open for ${endpoint}`);
    }

    // Check cache first
    const cacheKey = `email_finder_${domain}_${firstName}_${lastName}`;
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      console.log(`📦 Using cached email finder for ${firstName} ${lastName}`);
      return { ...cached.data, cost: 0 };
    }

    try {
      const url = `${this.baseURL}/email-finder?domain=${encodeURIComponent(
        domain
      )}&first_name=${encodeURIComponent(
        firstName
      )}&last_name=${encodeURIComponent(lastName)}&api_key=${this.apiKey}`;

      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.errors?.[0]?.details || "Email finder failed");
      }

      this.resetCircuitBreaker(endpoint);

      const result: HunterResponse = {
        success: true,
        action: "email-finder",
        data: {
          email: data.data.email,
          firstName: data.data.first_name,
          lastName: data.data.last_name,
          position: data.data.position,
          company: data.data.company,
          linkedin: data.data.linkedin,
          twitter: data.data.twitter,
          phone_number: data.data.phone_number,
          score: data.data.score,
          verification: data.data.verification,
        },
        cost,
        confidence: data.data.score || 0,
        metadata: {
          requests_remaining: data.meta.requests?.remaining,
          requests_used: data.meta.requests?.used,
        },
      };

      // Cache the result
      this.cache.set(cacheKey, {
        data: result,
        timestamp: Date.now(),
      });

      return result;
    } catch (error) {
      this.recordFailure(endpoint);
      throw error;
    }
  }

  /**
   * PAID: Email verifier - verify email deliverability
   * Cost: $0.01 per verification
   */
  async emailVerifier(email: string): Promise<HunterResponse> {
    const endpoint = "emailVerifier";
    const cost = 0.01;

    // Check circuit breaker
    if (this.isCircuitOpen(endpoint)) {
      throw new Error(`Circuit breaker open for ${endpoint}`);
    }

    // Check cache first
    const cacheKey = `email_verifier_${email}`;
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      console.log(`📦 Using cached email verification for ${email}`);
      return { ...cached.data, cost: 0 };
    }

    try {
      const url = `${this.baseURL}/email-verifier?email=${encodeURIComponent(
        email
      )}&api_key=${this.apiKey}`;

      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.errors?.[0]?.details || "Email verification failed"
        );
      }

      this.resetCircuitBreaker(endpoint);

      const result: HunterResponse = {
        success: true,
        action: "email-verifier",
        data: {
          email: data.data.email,
          status: data.data.status,
          result: data.data.result,
          score: data.data.score,
          regexp: data.data.regexp,
          gibberish: data.data.gibberish,
          disposable: data.data.disposable,
          webmail: data.data.webmail,
          mx_records: data.data.mx_records,
          smtp_server: data.data.smtp_server,
          smtp_check: data.data.smtp_check,
          accept_all: data.data.accept_all,
          block: data.data.block,
        },
        cost,
        confidence: data.data.score || 0,
        metadata: {
          requests_remaining: data.meta.requests?.remaining,
          requests_used: data.meta.requests?.used,
        },
      };

      // Cache the result
      this.cache.set(cacheKey, {
        data: result,
        timestamp: Date.now(),
      });

      return result;
    } catch (error) {
      this.recordFailure(endpoint);
      throw error;
    }
  }

  /**
   * PAID: Person enrichment - get details about a person
   * Cost: $0.034 per enrichment
   */
  async personEnrichment(email: string): Promise<HunterResponse> {
    const endpoint = "enrichment";
    const cost = 0.034;

    // Check circuit breaker
    if (this.isCircuitOpen(endpoint)) {
      throw new Error(`Circuit breaker open for ${endpoint}`);
    }

    try {
      const url = `${this.baseURL}/email-enrichment?email=${encodeURIComponent(
        email
      )}&api_key=${this.apiKey}`;

      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.errors?.[0]?.details || "Person enrichment failed"
        );
      }

      this.resetCircuitBreaker(endpoint);

      return {
        success: true,
        action: "person-enrichment",
        data: {
          email: data.data.email,
          firstName: data.data.first_name,
          lastName: data.data.last_name,
          company: data.data.company,
          position: data.data.position,
          seniority: data.data.seniority,
          department: data.data.department,
          linkedin: data.data.linkedin,
          twitter: data.data.twitter,
          phone_number: data.data.phone_number,
        },
        cost,
        confidence: 80,
        metadata: {
          requests_remaining: data.meta.requests?.remaining,
          requests_used: data.meta.requests?.used,
        },
      };
    } catch (error) {
      this.recordFailure(endpoint);
      throw error;
    }
  }

  /**
   * PAID: Company enrichment - get details about a company
   * Cost: $0.034 per enrichment
   */
  async companyEnrichment(domain: string): Promise<HunterResponse> {
    const endpoint = "enrichment";
    const cost = 0.034;

    // Check circuit breaker
    if (this.isCircuitOpen(endpoint)) {
      throw new Error(`Circuit breaker open for ${endpoint}`);
    }

    try {
      const url = `${
        this.baseURL
      }/domain-enrichment?domain=${encodeURIComponent(domain)}&api_key=${
        this.apiKey
      }`;

      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.errors?.[0]?.details || "Company enrichment failed"
        );
      }

      this.resetCircuitBreaker(endpoint);

      return {
        success: true,
        action: "company-enrichment",
        data: {
          domain: data.data.domain,
          organization: data.data.organization,
          country: data.data.country,
          description: data.data.description,
          industry: data.data.industry,
          size: data.data.size,
          founded: data.data.founded,
          revenue: data.data.revenue,
          linkedin: data.data.linkedin,
          twitter: data.data.twitter,
          facebook: data.data.facebook,
          technologies: data.data.technologies,
        },
        cost,
        confidence: 75,
        metadata: {
          requests_remaining: data.meta.requests?.remaining,
          requests_used: data.meta.requests?.used,
        },
      };
    } catch (error) {
      this.recordFailure(endpoint);
      throw error;
    }
  }

  // Circuit breaker management
  private isCircuitOpen(endpoint: string): boolean {
    const breaker = this.circuitBreaker[endpoint];
    if (!breaker) return false;

    // Reset after 5 minutes
    if (Date.now() - breaker.lastFailure > 5 * 60 * 1000) {
      breaker.failures = 0;
      return false;
    }

    return breaker.failures >= breaker.threshold;
  }

  private recordFailure(endpoint: string): void {
    const breaker = this.circuitBreaker[endpoint];
    if (breaker) {
      breaker.failures++;
      breaker.lastFailure = Date.now();
    }
  }

  private resetCircuitBreaker(endpoint: string): void {
    const breaker = this.circuitBreaker[endpoint];
    if (breaker) {
      breaker.failures = 0;
    }
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log(`🔍 Hunter.io Email Enrichment Edge Function`);

    // Get Hunter.io API key
    const hunterApiKey = Deno.env.get("HUNTER_IO_API_KEY");
    if (!hunterApiKey) {
      throw new Error("Hunter.io API key not configured");
    }

    // Parse request
    const requestData: HunterRequest = await req.json();
    const { action, maxCostPerRequest = 2.0 } = requestData;

    console.log(`📋 Action: ${action}`);

    // Initialize Hunter.io client
    const hunterClient = new HunterAPIClient(hunterApiKey);

    // Route to appropriate action
    let result: HunterResponse;

    switch (action) {
      case "email-count":
        if (!requestData.domain) {
          throw new Error("domain is required for email-count");
        }
        result = await hunterClient.getEmailCount(requestData.domain);
        break;

      case "domain-search":
        if (!requestData.domain) {
          throw new Error("domain is required for domain-search");
        }
        result = await hunterClient.domainSearch(
          requestData.domain,
          requestData.limit || 10
        );
        break;

      case "email-finder":
        if (
          !requestData.domain ||
          !requestData.firstName ||
          !requestData.lastName
        ) {
          throw new Error(
            "domain, firstName, and lastName are required for email-finder"
          );
        }
        result = await hunterClient.emailFinder(
          requestData.domain,
          requestData.firstName,
          requestData.lastName
        );
        break;

      case "email-verifier":
        if (!requestData.email) {
          throw new Error("email is required for email-verifier");
        }
        result = await hunterClient.emailVerifier(requestData.email);
        break;

      case "person-enrichment":
        if (!requestData.personEmail) {
          throw new Error("personEmail is required for person-enrichment");
        }
        result = await hunterClient.personEnrichment(requestData.personEmail);
        break;

      case "company-enrichment":
        if (!requestData.domain) {
          throw new Error("domain is required for company-enrichment");
        }
        result = await hunterClient.companyEnrichment(requestData.domain);
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    // Check cost limit
    if (result.cost > maxCostPerRequest) {
      console.warn(
        `⚠️ Cost limit exceeded: $${result.cost} > $${maxCostPerRequest}`
      );
    }

    console.log(`✅ Hunter.io ${action} completed - Cost: $${result.cost}`);

    return new Response(
      JSON.stringify({
        ...result,
        timestamp: new Date().toISOString(),
        version: "1.0",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Hunter.io enrichment error:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
