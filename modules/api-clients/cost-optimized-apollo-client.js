/**
 * Apollo.io Cost-Optimized Integration Client
 *
 * Based on test results, this client focuses on FREE Apollo.io endpoints
 * and provides intelligent fallback strategies for paid features
 *
 * WORKING ENDPOINTS (Free Plan):
 * ✅ Organization Enrichment (/api/v1/organizations/enrich)
 *
 * PAID ENDPOINTS (Require Plan Upgrade):
 * ❌ People Search (/api/v1/mixed_people/search)
 * ❌ People Enrichment (/api/v1/people/match)
 * ❌ Organization Search (/api/v1/mixed_companies/search)
 * ❌ Bulk Operations
 *
 * INTEGRATION STRATEGY:
 * 1. Use free Organization Enrichment for company data
 * 2. Combine with existing Hunter.io for people data
 * 3. Provide upgrade path messaging for premium features
 * 4. Maximize value from free tier capabilities
 */

const axios = require("axios");

class CostOptimizedApolloClient {
  constructor(apiKey, options = {}) {
    this.apiKey = apiKey;
    this.baseURL = "https://api.apollo.io/api/v1";
    this.defaultTimeout = options.timeout || 30000;

    // Cost tracking
    this.totalCreditsUsed = 0;
    this.requestCount = 0;
    this.costTracking = {
      organizationEnrichment: { requests: 0, credits: 0, cost: 0 },
    };

    // Circuit breaker for organization enrichment
    this.circuitBreaker = {
      failures: 0,
      lastFailure: null,
      threshold: 5,
      cooldownMs: 5 * 60 * 1000, // 5 minutes
    };

    // Rate limiting
    this.rateLimits = {
      requestsPerMinute: 120,
      currentMinute: new Date().getMinutes(),
      requestsThisMinute: 0,
    };

    console.log("🎯 Cost-Optimized Apollo.io Client initialized");
    console.log(`📊 API Key: ${this.apiKey.substring(0, 8)}...`);
    console.log(
      "💰 Focus: FREE Organization Enrichment + Premium Integration Strategy"
    );
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
   * Check circuit breaker status
   */
  isCircuitOpen() {
    if (this.circuitBreaker.failures >= this.circuitBreaker.threshold) {
      const timeSinceLastFailure = Date.now() - this.circuitBreaker.lastFailure;
      if (timeSinceLastFailure < this.circuitBreaker.cooldownMs) {
        return true;
      } else {
        // Reset circuit breaker after cooldown
        this.circuitBreaker.failures = 0;
        this.circuitBreaker.lastFailure = null;
        return false;
      }
    }
    return false;
  }

  /**
   * Record success/failure for circuit breaker
   */
  recordResult(success) {
    if (success) {
      this.circuitBreaker.failures = 0;
      this.circuitBreaker.lastFailure = null;
    } else {
      this.circuitBreaker.failures++;
      this.circuitBreaker.lastFailure = Date.now();
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
   * FREE: Organization Enrichment
   * The only working endpoint on free plan - maximize its value
   */
  async enrichOrganization(orgData, options = {}) {
    if (this.isCircuitOpen()) {
      throw new Error("Apollo Organization Enrichment circuit breaker is open");
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
      this.recordResult(true);

      const organization = response.data?.organization;
      const matched = organization !== null;

      if (matched) {
        // Track successful enrichment
        this.totalCreditsUsed += 1;
        this.costTracking.organizationEnrichment.requests++;
        this.costTracking.organizationEnrichment.credits++;
        // Estimate cost at $0.05 per enrichment (industry average)
        this.costTracking.organizationEnrichment.cost += 0.05;

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
          estimatedCost: 0.05,
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
      this.recordResult(false);
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
   * PREMIUM: People Search (Requires Paid Plan)
   * Returns upgrade message and integration strategy
   */
  async searchPeople(filters = {}) {
    console.log("💰 Apollo People Search requires Premium Plan");
    console.log(
      "🔄 Recommendation: Use Hunter.io Domain Search as alternative"
    );
    console.log(
      "📈 Upgrade to Apollo Premium for advanced people search filters"
    );

    return {
      success: false,
      requiresUpgrade: true,
      feature: "People Search",
      alternativeService: "Hunter.io Domain Search",
      upgradeMessage:
        "Apollo People Search requires a paid plan. Consider Hunter.io as an alternative.",
      estimatedMonthlyCost: "$39+ per month for Apollo Pro Plan",
    };
  }

  /**
   * PREMIUM: People Enrichment (Requires Paid Plan)
   * Returns upgrade message with mobile phone revelation info
   */
  async enrichPerson(personData, options = {}) {
    console.log("💰 Apollo People Enrichment requires Premium Plan");
    console.log("📱 Premium Feature: Mobile phone number revelation");
    console.log(
      "🔄 Recommendation: Use Hunter.io Email Finder + NeverBounce verification"
    );

    return {
      success: false,
      requiresUpgrade: true,
      feature: "People Enrichment with Mobile Phone Revelation",
      alternativeService: "Hunter.io + NeverBounce",
      upgradeMessage:
        "Apollo People Enrichment with mobile phone revelation requires a paid plan.",
      estimatedMonthlyCost: "$39+ per month for Apollo Pro Plan",
    };
  }

  /**
   * Multi-Source Organization Intelligence
   * Combine Apollo Organization Enrichment with domain analysis
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

    // 1. Apollo Organization Enrichment (Free)
    try {
      const apolloResult = await this.enrichOrganization({ domain });
      if (apolloResult.success && apolloResult.matched) {
        intelligence.apolloData = apolloResult.organization;
        intelligence.confidence += 40; // Apollo contributes 40 points
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
      recommendNextSteps: this.generateRecommendations(intelligence),
    };
  }

  /**
   * Generate actionable recommendations based on intelligence
   */
  generateRecommendations(intelligence) {
    const recommendations = [];

    if (intelligence.apolloData) {
      recommendations.push({
        action: "Email Discovery",
        service: "Hunter.io Domain Search",
        reason: `Use Hunter.io to find verified emails for ${intelligence.apolloData.name}`,
        priority: "High",
      });

      if (intelligence.apolloData.employees > 50) {
        recommendations.push({
          action: "People Discovery",
          service: "Hunter.io + Apollo Premium",
          reason:
            "Large organization - consider Apollo Pro for advanced people search",
          priority: "Medium",
        });
      }
    }

    if (intelligence.emails.length > 0) {
      recommendations.push({
        action: "Email Verification",
        service: "NeverBounce",
        reason: "Verify generated email patterns for deliverability",
        priority: "High",
      });
    }

    if (intelligence.confidence < 50) {
      recommendations.push({
        action: "Manual Research",
        service: "Website Scraping + LinkedIn",
        reason: "Low confidence - supplement with manual research",
        priority: "Medium",
      });
    }

    return recommendations;
  }

  /**
   * Get Apollo integration statistics
   */
  getStats() {
    return {
      totalRequests: this.requestCount,
      totalCreditsUsed: this.totalCreditsUsed,
      estimatedCost: this.costTracking.organizationEnrichment.cost,
      organizationEnrichments:
        this.costTracking.organizationEnrichment.requests,
      circuitBreakerStatus:
        this.circuitBreaker.failures >= this.circuitBreaker.threshold
          ? "OPEN"
          : "CLOSED",
      averageResponseTime:
        this.requestCount > 0
          ? this.costTracking.organizationEnrichment.responseTime /
            this.requestCount
          : 0,
      freeFeatures: [
        "Organization Enrichment",
        "Domain Intelligence",
        "Email Pattern Generation",
      ],
      premiumFeatures: [
        "People Search ($39+/month)",
        "People Enrichment with Mobile Phone ($39+/month)",
        "Bulk Operations ($39+/month)",
        "Organization Search ($39+/month)",
      ],
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
   * Reset statistics
   */
  reset() {
    this.totalCreditsUsed = 0;
    this.requestCount = 0;
    this.costTracking = {
      organizationEnrichment: { requests: 0, credits: 0, cost: 0 },
    };
    this.circuitBreaker.failures = 0;
    this.circuitBreaker.lastFailure = null;

    console.log("📊 Apollo client statistics reset");
  }
}

module.exports = CostOptimizedApolloClient;
