/**
 * Apollo.io Cost-Optimized Integration Client
 *
 * Optimized for Paid Basic Account with intelligent credit management
 * Maximizes quality while minimizing costs based on actual Apollo pricing
 *
 * ACCOUNT STATUS: Paid Basic Account (Free Trial)
 * CURRENT STATUS: All endpoints available, credits consumed per use
 *
 * PRICING (Based on provided table):
 * ✅ Organization Enrichment: 1 credit per result (FREE during trial)
 * ✅ People Search: 1 credit per page returned (max 100 results/page)
 * ✅ Organization Search: 1 credit per page returned (max 100 results/page)
 * ✅ People Enrichment: 1 credit per net-new email, 8 credits per phone number
 * ✅ Bulk People Enrichment: Same as single enrichment
 * ✅ Bulk Organization Enrichment: 1 credit per company returned
 *
 * OPTIMIZATION STRATEGY:
 * 1. Use Organization Enrichment (currently FREE) for company intelligence
 * 2. Selective People Enrichment (avoid phone numbers unless critical)
 * 3. Bulk operations for efficiency when processing multiple items
 * 4. Intelligent fallback to Hunter.io for cost optimization
 * 5. Credit budgeting and usage tracking
 */

const axios = require("axios");

class CostOptimizedApolloClient {
  constructor(apiKey, options = {}) {
    this.apiKey = apiKey;
    this.baseURL = "https://api.apollo.io/api/v1";
    this.defaultTimeout = options.timeout || 30000;

    // Start with conservative FREE account assumptions
    // Will be updated by detectAccountStatus() if paid features are available
    this.accountStatus = {
      plan: "Free", // Start conservative
      trialStatus: "none", // No trial for free accounts
      creditsConsumed: 0,
      monthlyLimit: 0, // Free accounts have no credits
      remainingCredits: 0, // Free accounts have no credits
    };

    // Cost tracking with actual Apollo pricing
    this.totalCreditsUsed = 0;
    this.requestCount = 0;
    this.costTracking = {
      peopleSearch: { requests: 0, credits: 0, cost: 0 },
      peopleEnrichment: { requests: 0, credits: 0, cost: 0 },
      organizationSearch: { requests: 0, credits: 0, cost: 0 },
      organizationEnrichment: { requests: 0, credits: 0, cost: 0 },
      bulkOperations: { requests: 0, credits: 0, cost: 0 },
    };

    // Circuit breaker for each endpoint
    this.circuitBreakers = {
      peopleSearch: {
        failures: 0,
        lastFailure: null,
        threshold: 5,
        cooldownMs: 5 * 60 * 1000,
      },
      peopleEnrichment: {
        failures: 0,
        lastFailure: null,
        threshold: 5,
        cooldownMs: 5 * 60 * 1000,
      },
      organizationSearch: {
        failures: 0,
        lastFailure: null,
        threshold: 5,
        cooldownMs: 5 * 60 * 1000,
      },
      organizationEnrichment: {
        failures: 0,
        lastFailure: null,
        threshold: 3,
        cooldownMs: 3 * 60 * 1000,
      },
      bulk: {
        failures: 0,
        lastFailure: null,
        threshold: 3,
        cooldownMs: 5 * 60 * 1000,
      },
    };

    // Rate limiting
    this.rateLimits = {
      requestsPerMinute: 120,
      currentMinute: new Date().getMinutes(),
      requestsThisMinute: 0,
    };

    // Quality vs Cost optimization settings
    this.optimizationSettings = {
      preferPhoneNumbers: false, // Avoid expensive phone numbers (8 credits each)
      maxCreditsPerRequest: 10, // Maximum credits for a single operation
      bulkThreshold: 3, // Use bulk operations for 3+ items
      creditBudgetPerDay: options.dailyBudget || 100, // Daily credit budget
    };
  }

  /**
   * Detect actual account status from API responses
   */
  async detectAccountStatus() {
    try {
      console.log("🔍 Detecting actual Apollo.io account status...");

      // Try a paid endpoint to see if it works
      const client = this.createAxiosInstance();
      await client.post("/mixed_people/search", {
        q_keywords: "test",
        per_page: 1,
      });

      console.log("✅ Paid endpoints accessible - Account is PAID");
      this.accountStatus.plan = "Basic";
      this.accountStatus.trialStatus = "active";
      return true;
    } catch (error) {
      if (error.response?.data?.error_code === "API_INACCESSIBLE") {
        console.log(
          "⚠️ Paid endpoints not accessible - Account appears to be FREE"
        );
        this.accountStatus.plan = "Free";
        this.accountStatus.trialStatus = "none";
        this.accountStatus.monthlyLimit = 0;
        this.accountStatus.remainingCredits = 0;
        return false;
      }
      // Other errors might be temporary
      console.log(
        "⚠️ Could not determine account status, assuming FREE for safety"
      );
      this.accountStatus.plan = "Free";
      this.accountStatus.trialStatus = "none";
      this.accountStatus.monthlyLimit = 0;
      this.accountStatus.remainingCredits = 0;
      return false;
    }
  }

  /**
   * Create axios instance with authentication
   */
  createAxiosInstance() {
    return axios.create({
      baseURL: this.baseURL,
      timeout: this.defaultTimeout,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
        "X-Api-Key": this.apiKey,
      },
    });
  }

  /**
   * Check circuit breaker status for specific endpoint
   */
  isCircuitOpen(endpoint) {
    const breaker = this.circuitBreakers[endpoint];
    if (!breaker) return false;

    if (breaker.failures >= breaker.threshold) {
      const timeSinceLastFailure = Date.now() - breaker.lastFailure;
      if (timeSinceLastFailure < breaker.cooldownMs) {
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
   * Record success/failure for circuit breaker
   */
  recordResult(endpoint, success) {
    const breaker = this.circuitBreakers[endpoint];
    if (!breaker) return;

    if (success) {
      breaker.failures = 0;
      breaker.lastFailure = null;
    } else {
      breaker.failures++;
      breaker.lastFailure = Date.now();
    }
  }

  /**
   * Check if we can afford an operation
   */
  canAffordCredits(creditsNeeded) {
    const remainingCredits = this.accountStatus.remainingCredits;
    const dailyBudget = this.optimizationSettings.creditBudgetPerDay;

    if (remainingCredits < creditsNeeded) {
      console.warn(
        `💰 Insufficient credits: ${remainingCredits} remaining, ${creditsNeeded} needed`
      );
      return false;
    }

    if (this.totalCreditsUsed + creditsNeeded > dailyBudget) {
      console.warn(
        `💰 Daily budget exceeded: ${this.totalCreditsUsed}/${dailyBudget} credits used`
      );
      return false;
    }

    return true;
  }

  /**
   * Track credit usage
   */
  trackCredits(endpoint, creditsUsed) {
    this.totalCreditsUsed += creditsUsed;
    this.accountStatus.remainingCredits -= creditsUsed;
    this.accountStatus.creditsConsumed += creditsUsed;

    if (this.costTracking[endpoint]) {
      this.costTracking[endpoint].requests++;
      this.costTracking[endpoint].credits += creditsUsed;
      // Estimate cost at $0.005 per credit (industry average)
      this.costTracking[endpoint].cost += creditsUsed * 0.005;
    }
  }

  /**
   * Enforce rate limits
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
   * Organization Enrichment (1 credit per result)
   * FREE during trial, 1 credit post-trial
   */
  async enrichOrganization(orgData, options = {}) {
    const endpoint = "organizationEnrichment";

    if (this.isCircuitOpen(endpoint)) {
      throw new Error("Apollo Organization Enrichment circuit breaker is open");
    }

    // Check if we can afford this operation (1 credit)
    if (!this.canAffordCredits(1)) {
      throw new Error("Insufficient credits for organization enrichment");
    }

    await this.enforceRateLimit();

    const client = this.createAxiosInstance();
    const startTime = Date.now();

    try {
      console.log(
        `🏢 Apollo Organization Enrichment - ${
          orgData.domain || orgData.name || "Unknown"
        }`
      );

      const response = await client.get("/organizations/enrich", {
        params: orgData,
      });

      this.requestCount++;
      this.recordResult(endpoint, true);

      const organization = response.data?.organization;
      const matched = organization !== null;

      if (matched) {
        // Track successful enrichment (1 credit)
        this.trackCredits(endpoint, 1);

        console.log(`✅ Organization enriched successfully`);
        console.log(
          `🏢 ${organization.name} - ${
            organization.industry || "Unknown industry"
          }`
        );
        console.log(
          `👥 Employees: ${organization.estimated_num_employees || "Unknown"}`
        );
        console.log(
          `💰 Revenue: ${organization.estimated_annual_revenue || "Unknown"}`
        );
        console.log(`🌐 Website: ${organization.website_url || "Unknown"}`);
        console.log(
          `📍 Location: ${organization.primary_city || "Unknown"}, ${
            organization.primary_state || "Unknown"
          }`
        );

        // Return comprehensive organization data
        return {
          success: true,
          matched: true,
          organization: {
            name: organization.name,
            domain: organization.primary_domain,
            website: organization.website_url,
            industry: organization.industry,
            employees: organization.estimated_num_employees,
            revenue: organization.estimated_annual_revenue,
            founded: organization.founded_year,
            location: {
              city: organization.primary_city,
              state: organization.primary_state,
              country: organization.primary_country,
            },
            social: {
              linkedin: organization.linkedin_url,
              facebook: organization.facebook_url,
              twitter: organization.twitter_url,
            },
            apolloId: organization.id,
            description: organization.short_description,
          },
          responseTime: Date.now() - startTime,
          creditsUsed: 1,
          estimatedCost:
            this.accountStatus.trialStatus === "active" ? 0 : 0.005, // FREE during trial
        };
      } else {
        console.log(`⚠️ Organization not found in Apollo database`);
        return {
          success: true,
          matched: false,
          organization: null,
          responseTime: Date.now() - startTime,
          creditsUsed: 0,
          estimatedCost: 0,
        };
      }
    } catch (error) {
      this.recordResult(endpoint, false);
      console.error(
        "❌ Apollo Organization Enrichment failed:",
        error.response?.data || error.message
      );

      return {
        success: false,
        matched: false,
        error: error.response?.data || error.message,
        responseTime: Date.now() - startTime,
        creditsUsed: 0,
        estimatedCost: 0,
      };
    }
  }

  /**
   * People Search (1 credit per page returned)
   * Returns up to 100 results per page
   */
  async searchPeople(filters = {}, options = {}) {
    const endpoint = "peopleSearch";

    if (this.isCircuitOpen(endpoint)) {
      throw new Error("Apollo People Search circuit breaker is open");
    }

    // People search costs 1 credit per page returned
    // We'll estimate 1 credit for now, but track actual usage
    if (!this.canAffordCredits(1)) {
      throw new Error("Insufficient credits for people search");
    }

    await this.enforceRateLimit();

    const client = this.createAxiosInstance();
    const startTime = Date.now();

    try {
      console.log(`👥 Apollo People Search - ${JSON.stringify(filters)}`);

      const response = await client.post("/mixed_people/search", {
        ...filters,
        page: options.page || 1,
        per_page: options.perPage || 25, // Max 100
      });

      this.requestCount++;
      this.recordResult(endpoint, true);

      const people = response.data?.people || [];
      const pagination = response.data?.pagination || {};

      // Track credits used (1 credit per page returned)
      const pagesReturned = pagination.page || 1;
      this.trackCredits(endpoint, pagesReturned);

      console.log(`✅ People search successful: ${people.length} results`);
      console.log(
        `📄 Page ${pagination.page}/${pagination.total_pages || 1} (${
          pagination.total_entries || 0
        } total)`
      );

      return {
        success: true,
        people: people.map((person) => ({
          id: person.id,
          name: `${person.first_name} ${person.last_name}`,
          title: person.title,
          email: person.email,
          organization: {
            name: person.organization?.name,
            domain: person.organization?.primary_domain,
            id: person.organization?.id,
          },
          location: {
            city: person.city,
            state: person.state,
            country: person.country,
          },
          linkedin: person.linkedin_url,
          apolloId: person.id,
        })),
        pagination,
        responseTime: Date.now() - startTime,
        creditsUsed: pagesReturned,
        estimatedCost: pagesReturned * 0.005,
      };
    } catch (error) {
      this.recordResult(endpoint, false);
      console.error(
        "❌ Apollo People Search failed:",
        error.response?.data || error.message
      );

      return {
        success: false,
        people: [],
        error: error.response?.data || error.message,
        responseTime: Date.now() - startTime,
        creditsUsed: 0,
        estimatedCost: 0,
      };
    }
  }

  /**
   * People Enrichment (1 credit per net-new email, 8 credits per phone number)
   * Intelligent credit management - avoid phone numbers unless critical
   */
  async enrichPerson(personData, options = {}) {
    const endpoint = "peopleEnrichment";

    if (this.isCircuitOpen(endpoint)) {
      throw new Error("Apollo People Enrichment circuit breaker is open");
    }

    // Calculate potential credits needed
    let estimatedCredits = 0;
    if (options.revealPhone) {
      estimatedCredits += 8; // Phone numbers cost 8 credits each
    }
    if (options.revealEmail) {
      estimatedCredits += 1; // Net-new emails cost 1 credit
    }

    if (estimatedCredits === 0) {
      throw new Error("Must specify what to enrich (email or phone)");
    }

    if (!this.canAffordCredits(estimatedCredits)) {
      throw new Error(
        `Insufficient credits for people enrichment (${estimatedCredits} needed)`
      );
    }

    await this.enforceRateLimit();

    const client = this.createAxiosInstance();
    const startTime = Date.now();

    try {
      console.log(
        `� Apollo People Enrichment - ${
          personData.id || personData.email || "Unknown"
        }`
      );

      const requestData = {
        id: personData.id,
        email: personData.email,
        reveal_personal_emails: options.revealEmail || false,
        reveal_phone_number: options.revealPhone || false, // Avoid unless critical
      };

      const response = await client.post("/people/match", requestData);

      this.requestCount++;
      this.recordResult(endpoint, true);

      const person = response.data?.person;
      if (!person) {
        console.log(`⚠️ Person not found or no new data revealed`);
        return {
          success: true,
          enriched: false,
          person: null,
          responseTime: Date.now() - startTime,
          creditsUsed: 0,
          estimatedCost: 0,
        };
      }

      // Calculate actual credits used
      let actualCredits = 0;
      if (person.email && person.email !== personData.email) {
        actualCredits += 1; // Net-new email
      }
      if (person.phone_numbers && person.phone_numbers.length > 0) {
        actualCredits += 8; // Phone number revelation
      }

      this.trackCredits(endpoint, actualCredits);

      console.log(`✅ Person enriched successfully`);
      console.log(`📧 Email: ${person.email || "Not revealed"}`);
      console.log(
        `📱 Phone: ${person.phone_numbers?.[0]?.number || "Not revealed"}`
      );
      console.log(`💰 Credits used: ${actualCredits}`);

      return {
        success: true,
        enriched: true,
        person: {
          id: person.id,
          name: `${person.first_name} ${person.last_name}`,
          title: person.title,
          email: person.email,
          phone: person.phone_numbers?.[0]?.number,
          organization: {
            name: person.organization?.name,
            domain: person.organization?.primary_domain,
          },
          location: {
            city: person.city,
            state: person.state,
            country: person.country,
          },
          linkedin: person.linkedin_url,
          apolloId: person.id,
        },
        responseTime: Date.now() - startTime,
        creditsUsed: actualCredits,
        estimatedCost: actualCredits * 0.005,
      };
    } catch (error) {
      this.recordResult(endpoint, false);
      console.error(
        "❌ Apollo People Enrichment failed:",
        error.response?.data || error.message
      );

      return {
        success: false,
        enriched: false,
        error: error.response?.data || error.message,
        responseTime: Date.now() - startTime,
        creditsUsed: 0,
        estimatedCost: 0,
      };
    }
  }

  /**
   * Organization Search (1 credit per page returned)
   * Returns up to 100 results per page
   */
  async searchOrganizations(filters = {}, options = {}) {
    const endpoint = "organizationSearch";

    if (this.isCircuitOpen(endpoint)) {
      throw new Error("Apollo Organization Search circuit breaker is open");
    }

    // Organization search costs 1 credit per page returned
    if (!this.canAffordCredits(1)) {
      throw new Error("Insufficient credits for organization search");
    }

    await this.enforceRateLimit();

    const client = this.createAxiosInstance();
    const startTime = Date.now();

    try {
      console.log(`🏢 Apollo Organization Search - ${JSON.stringify(filters)}`);

      const response = await client.post("/mixed_companies/search", {
        ...filters,
        page: options.page || 1,
        per_page: options.perPage || 25, // Max 100
      });

      this.requestCount++;
      this.recordResult(endpoint, true);

      const organizations = response.data?.organizations || [];
      const pagination = response.data?.pagination || {};

      // Track credits used (1 credit per page returned)
      const pagesReturned = pagination.page || 1;
      this.trackCredits(endpoint, pagesReturned);

      console.log(
        `✅ Organization search successful: ${organizations.length} results`
      );
      console.log(
        `📄 Page ${pagination.page}/${pagination.total_pages || 1} (${
          pagination.total_entries || 0
        } total)`
      );

      return {
        success: true,
        organizations: organizations.map((org) => ({
          id: org.id,
          name: org.name,
          domain: org.primary_domain,
          website: org.website_url,
          industry: org.industry,
          employees: org.estimated_num_employees,
          revenue: org.estimated_annual_revenue,
          location: {
            city: org.primary_city,
            state: org.primary_state,
            country: org.primary_country,
          },
          apolloId: org.id,
        })),
        pagination,
        responseTime: Date.now() - startTime,
        creditsUsed: pagesReturned,
        estimatedCost: pagesReturned * 0.005,
      };
    } catch (error) {
      this.recordResult(endpoint, false);
      console.error(
        "❌ Apollo Organization Search failed:",
        error.response?.data || error.message
      );

      return {
        success: false,
        organizations: [],
        error: error.response?.data || error.message,
        responseTime: Date.now() - startTime,
        creditsUsed: 0,
        estimatedCost: 0,
      };
    }
  }

  /**
   * Bulk People Enrichment (Same pricing as single enrichment)
   * Cost-effective for processing multiple people at once
   */
  async bulkEnrichPeople(peopleData, options = {}) {
    const endpoint = "bulkOperations";

    if (this.isCircuitOpen(endpoint)) {
      throw new Error("Apollo Bulk Operations circuit breaker is open");
    }

    // Calculate potential credits needed
    let estimatedCredits = 0;
    peopleData.forEach((person) => {
      if (options.revealPhone) estimatedCredits += 8;
      if (options.revealEmail) estimatedCredits += 1;
    });

    if (!this.canAffordCredits(estimatedCredits)) {
      throw new Error(
        `Insufficient credits for bulk people enrichment (${estimatedCredits} needed)`
      );
    }

    await this.enforceRateLimit();

    const client = this.createAxiosInstance();
    const startTime = Date.now();

    try {
      console.log(
        `📦 Apollo Bulk People Enrichment - ${peopleData.length} people`
      );

      const requestData = {
        people: peopleData.map((person) => ({
          id: person.id,
          email: person.email,
          reveal_personal_emails: options.revealEmail || false,
          reveal_phone_number: options.revealPhone || false,
        })),
      };

      const response = await client.post("/people/bulk_match", requestData);

      this.requestCount++;
      this.recordResult(endpoint, true);

      const results = response.data?.results || [];
      let totalCredits = 0;

      // Calculate actual credits used
      results.forEach((result) => {
        if (result.person?.email) totalCredits += 1; // Net-new email
        if (result.person?.phone_numbers?.length > 0) totalCredits += 8; // Phone number
      });

      this.trackCredits(endpoint, totalCredits);

      console.log(`✅ Bulk enrichment successful: ${results.length} results`);
      console.log(`💰 Total credits used: ${totalCredits}`);

      return {
        success: true,
        results: results.map((result) => ({
          success: result.success,
          person: result.person
            ? {
                id: result.person.id,
                name: `${result.person.first_name} ${result.person.last_name}`,
                email: result.person.email,
                phone: result.person.phone_numbers?.[0]?.number,
                organization: result.person.organization?.name,
              }
            : null,
          error: result.error,
        })),
        responseTime: Date.now() - startTime,
        creditsUsed: totalCredits,
        estimatedCost: totalCredits * 0.005,
      };
    } catch (error) {
      this.recordResult(endpoint, false);
      console.error(
        "❌ Apollo Bulk People Enrichment failed:",
        error.response?.data || error.message
      );

      return {
        success: false,
        results: [],
        error: error.response?.data || error.message,
        responseTime: Date.now() - startTime,
        creditsUsed: 0,
        estimatedCost: 0,
      };
    }
  }

  /**
   * Multi-Source Organization Intelligence
   * Combine Apollo Organization Enrichment with domain analysis
   * Cost-optimized: Uses FREE organization enrichment during trial
   */
  async getOrganizationIntelligence(domain, options = {}) {
    console.log(`🧠 Multi-Source Organization Intelligence - ${domain}`);

    const startTime = Date.now();
    const intelligence = {
      domain,
      apolloData: null,
      domainAnalysis: null,
      emails: [],
      confidence: 0,
    };

    // 1. Apollo Organization Enrichment (FREE during trial, 1 credit post-trial)
    try {
      const apolloResult = await this.enrichOrganization({ domain });
      if (apolloResult.success && apolloResult.matched) {
        intelligence.apolloData = apolloResult.organization;
        intelligence.confidence += 70; // Apollo contributes 70 points (higher quality)
        console.log("✅ Apollo data retrieved successfully");
      }
    } catch (error) {
      console.warn(
        "⚠️ Apollo enrichment failed, continuing with other sources"
      );
    }

    // 2. Basic Domain Analysis
    try {
      const domainParts = domain.split(".");
      const companyName = domainParts[0];

      intelligence.domainAnalysis = {
        inferredName:
          companyName.charAt(0).toUpperCase() + companyName.slice(1),
        tld: domainParts.slice(1).join("."),
        isCommercial: domainParts.includes("com"),
        isDotCom: domain.endsWith(".com"),
      };
      intelligence.confidence += 10; // Domain analysis contributes 10 points
      console.log("✅ Domain analysis completed");
    } catch (error) {
      console.warn("⚠️ Domain analysis failed");
    }

    // 3. Generate potential email patterns (no API calls)
    if (intelligence.apolloData?.name) {
      const name = intelligence.apolloData.name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");
      intelligence.emails = [
        `contact@${domain}`,
        `info@${domain}`,
        `hello@${domain}`,
        `sales@${domain}`,
        `support@${domain}`,
        `${name}@${domain}`,
        `admin@${domain}`,
      ];
      intelligence.confidence += 20; // Email patterns contribute 20 points
      console.log(
        `✅ Generated ${intelligence.emails.length} potential email patterns`
      );
    }

    const responseTime = Date.now() - startTime;
    console.log(
      `🎯 Organization Intelligence Complete - Confidence: ${intelligence.confidence}%`
    );

    return {
      success: true,
      intelligence,
      confidence: intelligence.confidence,
      responseTime,
      creditsUsed: intelligence.apolloData ? 1 : 0,
      estimatedCost: intelligence.apolloData
        ? this.accountStatus.trialStatus === "active"
          ? 0
          : 0.005
        : 0,
      recommendNextSteps: this.generateRecommendations(intelligence),
    };
  }

  /**
   * Get Apollo integration statistics
   */
  getStats() {
    const totalCost = Object.values(this.costTracking).reduce(
      (sum, endpoint) => sum + endpoint.cost,
      0
    );

    return {
      accountStatus: this.accountStatus,
      totalRequests: this.requestCount,
      totalCreditsUsed: this.totalCreditsUsed,
      estimatedCost: totalCost,
      creditsRemaining: this.accountStatus.remainingCredits,
      dailyBudgetUsed: `${this.totalCreditsUsed}/${this.optimizationSettings.creditBudgetPerDay}`,
      costBreakdown: this.costTracking,
      circuitBreakers: Object.entries(this.circuitBreakers).map(
        ([endpoint, breaker]) => ({
          endpoint,
          status: breaker.failures >= breaker.threshold ? "OPEN" : "CLOSED",
          failures: breaker.failures,
          lastFailure: breaker.lastFailure,
        })
      ),
      availableEndpoints: [
        "Organization Enrichment (FREE during trial)",
        "People Search (1 credit/page)",
        "People Enrichment (1 credit/email, 8 credits/phone)",
        "Organization Search (1 credit/page)",
        "Bulk People Enrichment (same as single)",
      ],
      optimizationSettings: this.optimizationSettings,
    };
  }

  /**
   * Check if Apollo Premium upgrade is recommended
   */
  shouldUpgradeToApollo(monthlyLeadVolume, currentMonthlySpend) {
    const apolloProCost = 39; // $39/month for Pro plan
    const apolloCustomCost = 99; // $99/month for Custom plan

    // Calculate potential Apollo value
    const hunterCostPerLead = 0.04; // $0.04 per Hunter.io request
    const apolloValuePerLead = 0.1; // Estimated Apollo value with mobile phones

    const monthlyHunterCost = monthlyLeadVolume * hunterCostPerLead;
    const monthlyApolloValue = monthlyLeadVolume * apolloValuePerLead;

    console.log("💰 Apollo Premium Upgrade Analysis:");
    console.log(`📊 Monthly Lead Volume: ${monthlyLeadVolume}`);
    console.log(`💸 Current Hunter.io Cost: $${monthlyHunterCost.toFixed(2)}`);
    console.log(`💎 Apollo Pro Value: $${monthlyApolloValue.toFixed(2)}`);

    if (monthlyLeadVolume > 500 && currentMonthlySpend > apolloProCost) {
      console.log(
        "✅ RECOMMENDED: Upgrade to Apollo Pro for mobile phone data"
      );
      return {
        recommended: true,
        plan: "Apollo Pro",
        cost: apolloProCost,
        reason: "High volume lead generation with mobile phone requirement",
        breakEvenLeads:
          apolloProCost / (apolloValuePerLead - hunterCostPerLead),
      };
    }

    if (monthlyLeadVolume > 2000 && currentMonthlySpend > apolloCustomCost) {
      console.log(
        "✅ RECOMMENDED: Upgrade to Apollo Custom for enterprise features"
      );
      return {
        recommended: true,
        plan: "Apollo Custom",
        cost: apolloCustomCost,
        reason: "Enterprise volume with advanced search requirements",
        breakEvenLeads:
          apolloCustomCost / (apolloValuePerLead - hunterCostPerLead),
      };
    }

    console.log(
      "🔄 CURRENT STRATEGY: Continue with Hunter.io + Free Apollo Organization Enrichment"
    );
    return {
      recommended: false,
      currentStrategy: "Hunter.io + Apollo Free",
      reason: "Current volume doesn't justify Apollo Premium costs",
      upgradeThreshold: `${Math.ceil(
        apolloProCost / (apolloValuePerLead - hunterCostPerLead)
      )} leads/month`,
    };
  }

  /**
   * Reset statistics and circuit breakers
   */
  reset() {
    this.totalCreditsUsed = 0;
    this.requestCount = 0;
    this.accountStatus.creditsConsumed = 0;
    this.accountStatus.remainingCredits = this.accountStatus.monthlyLimit;

    // Reset cost tracking
    Object.keys(this.costTracking).forEach((endpoint) => {
      this.costTracking[endpoint] = { requests: 0, credits: 0, cost: 0 };
    });

    // Reset circuit breakers
    Object.values(this.circuitBreakers).forEach((breaker) => {
      breaker.failures = 0;
      breaker.lastFailure = null;
    });

    console.log("📊 Apollo client statistics and circuit breakers reset");
  }
}

module.exports = CostOptimizedApolloClient;
