/**
 * Comprehensive Apollo.io API Client
 * Implements all major Apollo API v1 endpoints with cost optimization and circuit breaker patterns
 *
 * Features:
 * - People Search & Enrichment with mobile phone revelation
 * - Organization Search & Enrichment
 * - Bulk processing capabilities
 * - Credit tracking and cost optimization
 * - Circuit breaker protection
 * - Comprehensive error handling
 *
 * Apollo API Endpoints Implemented:
 * 1. People Search (/api/v1/mixed_people/search)
 * 2. People Enrichment (/api/v1/people/match)
 * 3. Bulk People Enrichment (/api/v1/people/bulk_match)
 * 4. Organization Search (/api/v1/mixed_companies/search)
 * 5. Organization Enrichment (/api/v1/organizations/enrich)
 * 6. Bulk Organization Enrichment (/api/v1/organizations/bulk_enrich)
 * 7. API Usage Stats (/api/v1/auth/api_usage_stats)
 * 8. Complete Organization Info (/api/v1/organizations/{id})
 */

const axios = require("axios");

class ComprehensiveApolloClient {
  constructor(apiKey, options = {}) {
    this.apiKey = apiKey;
    this.baseURL = "https://api.apollo.io/api/v1";
    this.defaultTimeout = options.timeout || 30000;

    // Cost tracking
    this.totalCreditsUsed = 0;
    this.requestCount = 0;
    this.costTracking = {
      peopleSearch: { requests: 0, credits: 0 },
      peopleEnrichment: { requests: 0, credits: 0 },
      organizationSearch: { requests: 0, credits: 0 },
      organizationEnrichment: { requests: 0, credits: 0 },
      bulkOperations: { requests: 0, credits: 0 },
    };

    // Circuit breaker pattern for each endpoint
    this.circuitBreakers = {
      peopleSearch: { failures: 0, lastFailure: null, threshold: 5 },
      peopleEnrichment: { failures: 0, lastFailure: null, threshold: 5 },
      organizationSearch: { failures: 0, lastFailure: null, threshold: 5 },
      organizationEnrichment: { failures: 0, lastFailure: null, threshold: 5 },
      bulk: { failures: 0, lastFailure: null, threshold: 3 },
    };

    // Rate limiting
    this.rateLimits = {
      requestsPerMinute: 120, // Apollo default
      currentMinute: new Date().getMinutes(),
      requestsThisMinute: 0,
    };

    console.log("🚀 Comprehensive Apollo.io Client initialized");
    console.log(`📊 API Key: ${this.apiKey.substring(0, 8)}...`);
  }

  /**
   * Create axios instance with common configuration
   */
  createAxiosInstance(timeout = this.defaultTimeout) {
    return axios.create({
      baseURL: this.baseURL,
      timeout,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
        "X-Api-Key": this.apiKey,
      },
    });
  }

  /**
   * Check circuit breaker status
   */
  isCircuitOpen(endpoint) {
    const breaker = this.circuitBreakers[endpoint];
    if (!breaker) return false;

    if (breaker.failures >= breaker.threshold) {
      const cooldownPeriod = 5 * 60 * 1000; // 5 minutes
      if (Date.now() - breaker.lastFailure < cooldownPeriod) {
        return true;
      } else {
        // Reset circuit breaker after cooldown
        breaker.failures = 0;
        breaker.lastFailure = null;
        return false;
      }
    }
    return false;
  }

  /**
   * Record circuit breaker failure
   */
  recordFailure(endpoint) {
    if (this.circuitBreakers[endpoint]) {
      this.circuitBreakers[endpoint].failures++;
      this.circuitBreakers[endpoint].lastFailure = Date.now();
    }
  }

  /**
   * Record circuit breaker success
   */
  recordSuccess(endpoint) {
    if (this.circuitBreakers[endpoint]) {
      this.circuitBreakers[endpoint].failures = 0;
      this.circuitBreakers[endpoint].lastFailure = null;
    }
  }

  /**
   * Check and enforce rate limits
   */
  async enforceRateLimit() {
    const currentMinute = new Date().getMinutes();
    if (currentMinute !== this.rateLimits.currentMinute) {
      this.rateLimits.currentMinute = currentMinute;
      this.rateLimits.requestsThisMinute = 0;
    }

    if (
      this.rateLimits.requestsThisMinute >= this.rateLimits.requestsPerMinute
    ) {
      const waitTime = (60 - new Date().getSeconds()) * 1000;
      console.warn(`⏳ Rate limit reached, waiting ${waitTime}ms`);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }

    this.rateLimits.requestsThisMinute++;
  }

  /**
   * Track credit usage (estimated based on operation type)
   */
  trackCredits(operation, credits = 1) {
    this.totalCreditsUsed += credits;
    if (this.costTracking[operation]) {
      this.costTracking[operation].requests++;
      this.costTracking[operation].credits += credits;
    }
  }

  /**
   * 1. People Search API
   * Search for people using various filters
   * Consumes credits per API call
   */
  async searchPeople(filters = {}, options = {}) {
    if (this.isCircuitOpen("peopleSearch")) {
      throw new Error("People Search circuit breaker is open");
    }

    await this.enforceRateLimit();

    const client = this.createAxiosInstance();
    const startTime = Date.now();

    // Default pagination and limits
    const searchParams = {
      page: filters.page || 1,
      per_page: Math.min(filters.per_page || 25, 100),
      ...filters,
    };

    try {
      console.log(
        `🔍 Apollo People Search - Page ${searchParams.page}, Limit ${searchParams.per_page}`
      );

      const response = await client.post("/mixed_people/search", searchParams);
      this.requestCount++;
      this.recordSuccess("peopleSearch");
      this.trackCredits("peopleSearch", 1);

      const people = response.data?.people || [];
      const totalPages = response.data?.pagination?.total_pages || 1;
      const totalEntries = response.data?.pagination?.total_entries || 0;

      console.log(
        `✅ Found ${people.length} people (${totalEntries} total, ${totalPages} pages)`
      );
      console.log(`⏱️  Response time: ${Date.now() - startTime}ms`);

      return {
        success: true,
        people,
        pagination: response.data?.pagination,
        totalEntries,
        responseTime: Date.now() - startTime,
        creditsUsed: 1,
      };
    } catch (error) {
      this.recordFailure("peopleSearch");
      console.error(
        "❌ People Search failed:",
        error.response?.data || error.message
      );

      return {
        success: false,
        error: error.response?.data || error.message,
        responseTime: Date.now() - startTime,
        creditsUsed: 0,
      };
    }
  }

  /**
   * 2. People Enrichment API
   * Enrich data for a single person with mobile phone revelation
   * Consumes credits per successful enrichment
   */
  async enrichPerson(personData, options = {}) {
    if (this.isCircuitOpen("peopleEnrichment")) {
      throw new Error("People Enrichment circuit breaker is open");
    }

    await this.enforceRateLimit();

    const client = this.createAxiosInstance();
    const startTime = Date.now();

    // Enable mobile phone and personal email revelation by default
    const enrichmentParams = {
      reveal_personal_emails: options.revealPersonalEmails !== false,
      reveal_phone_number: options.revealPhoneNumber !== false,
      ...personData,
    };

    try {
      console.log(
        `🔍 Apollo Person Enrichment - ${personData.first_name || "Unknown"} ${
          personData.last_name || "Unknown"
        }`
      );
      if (enrichmentParams.reveal_phone_number) {
        console.log("📱 Mobile phone revelation enabled");
      }

      const response = await client.post("/people/match", enrichmentParams);
      this.requestCount++;
      this.recordSuccess("peopleEnrichment");
      this.trackCredits("peopleEnrichment", 1);

      const person = response.data?.person;
      const matched = response.data?.person !== null;

      console.log(
        `${matched ? "✅" : "⚠️"} Person ${matched ? "enriched" : "not found"}`
      );
      if (matched && person) {
        console.log(
          `📧 Emails: ${person.email ? 1 : 0} work, ${
            person.personal_emails?.length || 0
          } personal`
        );
        console.log(`📞 Phone: ${person.sanitized_phone || "Not found"}`);
      }
      console.log(`⏱️  Response time: ${Date.now() - startTime}ms`);

      return {
        success: true,
        person,
        matched,
        responseTime: Date.now() - startTime,
        creditsUsed: matched ? 1 : 0,
      };
    } catch (error) {
      this.recordFailure("peopleEnrichment");
      console.error(
        "❌ Person Enrichment failed:",
        error.response?.data || error.message
      );

      return {
        success: false,
        error: error.response?.data || error.message,
        responseTime: Date.now() - startTime,
        creditsUsed: 0,
      };
    }
  }

  /**
   * 3. Bulk People Enrichment API
   * Enrich data for up to 10 people in a single call
   */
  async bulkEnrichPeople(peopleArray, options = {}) {
    if (this.isCircuitOpen("bulk")) {
      throw new Error("Bulk operations circuit breaker is open");
    }

    if (!Array.isArray(peopleArray) || peopleArray.length === 0) {
      throw new Error("People array is required and must not be empty");
    }

    if (peopleArray.length > 10) {
      throw new Error("Maximum 10 people allowed per bulk enrichment call");
    }

    await this.enforceRateLimit();

    const client = this.createAxiosInstance();
    const startTime = Date.now();

    const bulkParams = {
      reveal_personal_emails: options.revealPersonalEmails !== false,
      reveal_phone_number: options.revealPhoneNumber !== false,
      people: peopleArray,
    };

    try {
      console.log(
        `🔍 Apollo Bulk People Enrichment - ${peopleArray.length} people`
      );

      const response = await client.post("/people/bulk_match", bulkParams);
      this.requestCount++;
      this.recordSuccess("bulk");

      const people = response.data?.people || [];
      const matchedCount = people.filter((p) => p !== null).length;
      this.trackCredits("bulkOperations", matchedCount);

      console.log(`✅ ${matchedCount}/${peopleArray.length} people enriched`);
      console.log(`⏱️  Response time: ${Date.now() - startTime}ms`);

      return {
        success: true,
        people,
        matchedCount,
        totalRequested: peopleArray.length,
        responseTime: Date.now() - startTime,
        creditsUsed: matchedCount,
      };
    } catch (error) {
      this.recordFailure("bulk");
      console.error(
        "❌ Bulk People Enrichment failed:",
        error.response?.data || error.message
      );

      return {
        success: false,
        error: error.response?.data || error.message,
        responseTime: Date.now() - startTime,
        creditsUsed: 0,
      };
    }
  }

  /**
   * 4. Organization Search API
   * Search for organizations using various filters
   */
  async searchOrganizations(filters = {}, options = {}) {
    if (this.isCircuitOpen("organizationSearch")) {
      throw new Error("Organization Search circuit breaker is open");
    }

    await this.enforceRateLimit();

    const client = this.createAxiosInstance();
    const startTime = Date.now();

    const searchParams = {
      page: filters.page || 1,
      per_page: Math.min(filters.per_page || 25, 100),
      ...filters,
    };

    try {
      console.log(
        `🏢 Apollo Organization Search - Page ${searchParams.page}, Limit ${searchParams.per_page}`
      );

      const response = await client.post(
        "/mixed_companies/search",
        searchParams
      );
      this.requestCount++;
      this.recordSuccess("organizationSearch");
      this.trackCredits("organizationSearch", 1);

      const organizations = response.data?.organizations || [];
      const totalPages = response.data?.pagination?.total_pages || 1;
      const totalEntries = response.data?.pagination?.total_entries || 0;

      console.log(
        `✅ Found ${organizations.length} organizations (${totalEntries} total, ${totalPages} pages)`
      );
      console.log(`⏱️  Response time: ${Date.now() - startTime}ms`);

      return {
        success: true,
        organizations,
        pagination: response.data?.pagination,
        totalEntries,
        responseTime: Date.now() - startTime,
        creditsUsed: 1,
      };
    } catch (error) {
      this.recordFailure("organizationSearch");
      console.error(
        "❌ Organization Search failed:",
        error.response?.data || error.message
      );

      return {
        success: false,
        error: error.response?.data || error.message,
        responseTime: Date.now() - startTime,
        creditsUsed: 0,
      };
    }
  }

  /**
   * 5. Organization Enrichment API
   * Enrich data for a single organization
   */
  async enrichOrganization(organizationData, options = {}) {
    if (this.isCircuitOpen("organizationEnrichment")) {
      throw new Error("Organization Enrichment circuit breaker is open");
    }

    await this.enforceRateLimit();

    const client = this.createAxiosInstance();
    const startTime = Date.now();

    try {
      console.log(
        `🏢 Apollo Organization Enrichment - ${
          organizationData.domain || organizationData.name || "Unknown"
        }`
      );

      const response = await client.get("/organizations/enrich", {
        params: organizationData,
      });
      this.requestCount++;
      this.recordSuccess("organizationEnrichment");
      this.trackCredits("organizationEnrichment", 1);

      const organization = response.data?.organization;
      const matched = response.data?.organization !== null;

      console.log(
        `${matched ? "✅" : "⚠️"} Organization ${
          matched ? "enriched" : "not found"
        }`
      );
      if (matched && organization) {
        console.log(
          `🏢 ${organization.name} - ${
            organization.industry || "Unknown industry"
          }`
        );
        console.log(
          `👥 Employees: ${organization.estimated_num_employees || "Unknown"}`
        );
      }
      console.log(`⏱️  Response time: ${Date.now() - startTime}ms`);

      return {
        success: true,
        organization,
        matched,
        responseTime: Date.now() - startTime,
        creditsUsed: matched ? 1 : 0,
      };
    } catch (error) {
      this.recordFailure("organizationEnrichment");
      console.error(
        "❌ Organization Enrichment failed:",
        error.response?.data || error.message
      );

      return {
        success: false,
        error: error.response?.data || error.message,
        responseTime: Date.now() - startTime,
        creditsUsed: 0,
      };
    }
  }

  /**
   * 6. Bulk Organization Enrichment API
   * Enrich data for multiple organizations
   */
  async bulkEnrichOrganizations(organizationsArray, options = {}) {
    if (this.isCircuitOpen("bulk")) {
      throw new Error("Bulk operations circuit breaker is open");
    }

    if (!Array.isArray(organizationsArray) || organizationsArray.length === 0) {
      throw new Error("Organizations array is required and must not be empty");
    }

    await this.enforceRateLimit();

    const client = this.createAxiosInstance();
    const startTime = Date.now();

    const bulkParams = {
      organizations: organizationsArray,
    };

    try {
      console.log(
        `🏢 Apollo Bulk Organization Enrichment - ${organizationsArray.length} organizations`
      );

      const response = await client.post(
        "/organizations/bulk_enrich",
        bulkParams
      );
      this.requestCount++;
      this.recordSuccess("bulk");

      const organizations = response.data?.organizations || [];
      const matchedCount = organizations.filter((org) => org !== null).length;
      this.trackCredits("bulkOperations", matchedCount);

      console.log(
        `✅ ${matchedCount}/${organizationsArray.length} organizations enriched`
      );
      console.log(`⏱️  Response time: ${Date.now() - startTime}ms`);

      return {
        success: true,
        organizations,
        matchedCount,
        totalRequested: organizationsArray.length,
        responseTime: Date.now() - startTime,
        creditsUsed: matchedCount,
      };
    } catch (error) {
      this.recordFailure("bulk");
      console.error(
        "❌ Bulk Organization Enrichment failed:",
        error.response?.data || error.message
      );

      return {
        success: false,
        error: error.response?.data || error.message,
        responseTime: Date.now() - startTime,
        creditsUsed: 0,
      };
    }
  }

  /**
   * 7. Get Complete Organization Info
   * Retrieve detailed information for a specific organization by ID
   */
  async getOrganizationById(organizationId, options = {}) {
    if (this.isCircuitOpen("organizationEnrichment")) {
      throw new Error("Organization operations circuit breaker is open");
    }

    await this.enforceRateLimit();

    const client = this.createAxiosInstance();
    const startTime = Date.now();

    try {
      console.log(`🏢 Apollo Organization Details - ID: ${organizationId}`);

      const response = await client.get(`/organizations/${organizationId}`);
      this.requestCount++;
      this.recordSuccess("organizationEnrichment");
      this.trackCredits("organizationEnrichment", 1);

      const organization = response.data?.organization;

      console.log(`✅ Organization details retrieved`);
      if (organization) {
        console.log(
          `🏢 ${organization.name} - ${
            organization.industry || "Unknown industry"
          }`
        );
        console.log(`🌐 Website: ${organization.website_url || "None"}`);
      }
      console.log(`⏱️  Response time: ${Date.now() - startTime}ms`);

      return {
        success: true,
        organization,
        responseTime: Date.now() - startTime,
        creditsUsed: 1,
      };
    } catch (error) {
      this.recordFailure("organizationEnrichment");
      console.error(
        "❌ Get Organization Details failed:",
        error.response?.data || error.message
      );

      return {
        success: false,
        error: error.response?.data || error.message,
        responseTime: Date.now() - startTime,
        creditsUsed: 0,
      };
    }
  }

  /**
   * 8. API Usage Stats
   * Check current API usage and credit consumption
   */
  async getUsageStats() {
    const client = this.createAxiosInstance();
    const startTime = Date.now();

    try {
      console.log("📊 Checking Apollo API Usage Stats");

      const response = await client.post("/auth/api_usage_stats");
      this.requestCount++;

      const usage = response.data || {};

      console.log("✅ Usage stats retrieved");
      console.log(`⏱️  Response time: ${Date.now() - startTime}ms`);

      return {
        success: true,
        usage,
        responseTime: Date.now() - startTime,
      };
    } catch (error) {
      console.error(
        "❌ Get Usage Stats failed:",
        error.response?.data || error.message
      );

      return {
        success: false,
        error: error.response?.data || error.message,
        responseTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Advanced Combined Search and Enrichment
   * Search for people and immediately enrich the results
   */
  async searchAndEnrichPeople(searchFilters = {}, enrichmentOptions = {}) {
    console.log("🔄 Starting combined People Search + Enrichment");

    // Step 1: Search for people
    const searchResult = await this.searchPeople(searchFilters);
    if (!searchResult.success || !searchResult.people.length) {
      return {
        success: false,
        error: "No people found in search",
        searchResult,
        enrichedPeople: [],
      };
    }

    console.log(
      `🔍 Found ${searchResult.people.length} people, starting enrichment...`
    );

    // Step 2: Enrich each person (with batch processing)
    const enrichedPeople = [];
    const batchSize = 10; // Apollo bulk limit

    for (let i = 0; i < searchResult.people.length; i += batchSize) {
      const batch = searchResult.people.slice(i, i + batchSize);

      // Prepare people data for enrichment
      const enrichmentBatch = batch
        .map((person) => ({
          first_name: person.first_name,
          last_name: person.last_name,
          email: person.email,
          organization_name: person.organization?.name,
          domain: person.organization?.primary_domain,
        }))
        .filter((person) => person.first_name && person.last_name);

      if (enrichmentBatch.length > 0) {
        const enrichResult = await this.bulkEnrichPeople(
          enrichmentBatch,
          enrichmentOptions
        );
        if (enrichResult.success) {
          enrichedPeople.push(...enrichResult.people);
        }
      }
    }

    console.log(
      `✅ Combined operation complete: ${enrichedPeople.length} people enriched`
    );

    return {
      success: true,
      searchResult,
      enrichedPeople: enrichedPeople.filter((person) => person !== null),
      totalFound: searchResult.people.length,
      totalEnriched: enrichedPeople.filter((person) => person !== null).length,
      totalCreditsUsed:
        searchResult.creditsUsed +
        enrichedPeople.filter((person) => person !== null).length,
    };
  }

  /**
   * Get comprehensive client statistics
   */
  getStats() {
    return {
      totalRequests: this.requestCount,
      totalCreditsUsed: this.totalCreditsUsed,
      costBreakdown: this.costTracking,
      circuitBreakerStatus: this.circuitBreakers,
      averageResponseTime:
        this.requestCount > 0
          ? Object.values(this.costTracking).reduce(
              (sum, cat) => sum + (cat.responseTime || 0),
              0
            ) / this.requestCount
          : 0,
    };
  }

  /**
   * Reset statistics and circuit breakers
   */
  reset() {
    this.totalCreditsUsed = 0;
    this.requestCount = 0;
    this.costTracking = {
      peopleSearch: { requests: 0, credits: 0 },
      peopleEnrichment: { requests: 0, credits: 0 },
      organizationSearch: { requests: 0, credits: 0 },
      organizationEnrichment: { requests: 0, credits: 0 },
      bulkOperations: { requests: 0, credits: 0 },
    };

    // Reset circuit breakers
    Object.keys(this.circuitBreakers).forEach((key) => {
      this.circuitBreakers[key].failures = 0;
      this.circuitBreakers[key].lastFailure = null;
    });

    console.log("📊 Apollo client statistics reset");
  }
}

module.exports = ComprehensiveApolloClient;
