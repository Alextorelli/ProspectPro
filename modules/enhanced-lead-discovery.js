/**
 * Enhanced Lead Discovery Algorithm
 * Integrates multiple data sources with cost optimization and intelligent pre-validation
 */

const CaliforniaSOS = require("./api-clients/california-sos-client");
const NewYorkSOS = require("./api-clients/newyork-sos-client");
const NYTaxParcels = require("./api-clients/ny-tax-parcels-client");
const GooglePlacesClient = require("./api-clients/google-places");
const HunterIOClient = require("./api-clients/hunter-io");
const NeverBounceClient = require("./api-clients/neverbounce");
const SECEdgarClient = require("./api-clients/enhanced-sec-edgar-client");
const ProPublicaClient = require("./api-clients/propublica-nonprofit-client");
const FoursquareClient = require("./api-clients/foursquare-places-client");

class EnhancedLeadDiscovery {
  constructor(apiKeys = {}) {
    // Initialize all API clients
    this.californiaSOSClient = new CaliforniaSOS();
    this.newYorkSOSClient = new NewYorkSOS();
    this.nyTaxParcelsClient = new NYTaxParcels();

    // Google Places client for contact enrichment
    this.googlePlacesClient = apiKeys.googlePlaces
      ? new GooglePlacesClient(apiKeys.googlePlaces)
      : null;

    // Government API clients for small business validation
    this.proPublicaClient = new ProPublicaClient();
    this.foursquareClient = new FoursquareClient(apiKeys.foursquare);

    // Paid API clients with cost optimization
    this.hunterClient = apiKeys.hunterIO
      ? new HunterIOClient(apiKeys.hunterIO)
      : null;
    this.neverBounceClient = apiKeys.neverBounce
      ? new NeverBounceClient(apiKeys.neverBounce)
      : null;

    // Cost tracking
    this.totalCost = 0;
    this.apiUsageStats = {};

    // High Priority: API Prioritization & Caching
    this.cache = new Map(); // Simple in-memory cache
    this.cacheTTL = 3600000; // 1 hour in milliseconds

    console.log(
      "🔧 Enhanced Lead Discovery Algorithm initialized with government APIs and caching"
    );
  }

  /**
   * High Priority: API Prioritization & Caching - Cache getter/setter
   */
  getCache(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  setCache(key, data) {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  /**
   * High Priority: Dynamic - Real-Time Campaign Feedback
   */
  generateRealTimeFeedback(scoredBusinesses, options) {
    const totalProcessed = scoredBusinesses.length;
    const qualified = scoredBusinesses.filter(
      (b) => b.finalConfidenceScore >= options.qualityThreshold
    ).length;
    const qualificationRate =
      totalProcessed > 0 ? (qualified / totalProcessed) * 100 : 0;

    const avgConfidence =
      totalProcessed > 0
        ? scoredBusinesses.reduce((sum, b) => sum + b.finalConfidenceScore, 0) /
          totalProcessed
        : 0;

    const recommendations = [];
    if (qualificationRate < 30) {
      recommendations.push(
        "Consider lowering quality threshold or expanding search radius"
      );
    }
    if (this.totalCost > options.budgetLimit * 0.8) {
      recommendations.push(
        "Approaching budget limit - consider pausing expensive validations"
      );
    }

    return {
      processed: totalProcessed,
      qualified,
      qualificationRate: Math.round(qualificationRate),
      averageConfidence: Math.round(avgConfidence),
      totalCost: this.totalCost,
      recommendations,
      timestamp: new Date().toISOString(),
    };
  }
  async discoverAndValidateLeads(businesses, options = {}) {
    const {
      budgetLimit = 50.0,
      qualityThreshold = 50,
      maxResults = 100,
      enableRealTimeFeedback = true, // High Priority: Dynamic - Real-Time Campaign Feedback
      interactiveTuning = true, // High Priority: Dynamic - Interactive Parameter Tuning
    } = options;

    console.log(
      `🚀 Starting enhanced lead discovery for ${businesses.length} businesses`
    );
    console.log(
      `💰 Budget limit: $${budgetLimit}, Quality threshold: ${qualityThreshold}%`
    );

    // High Priority: Module Disaggregation - Run stages separately
    const preValidated = await this.runDiscoveryStage(
      businesses.slice(0, maxResults),
      options
    );
    const filteredForEnrichment = preValidated.filter(
      (b) => b.preValidationScore >= 40
    ); // Adaptive threshold

    const enriched = await this.runEnrichmentStage(
      filteredForEnrichment,
      options
    );
    const validated = await this.runValidationStage(enriched, options);
    const scored = await this.runScoringStage(validated, options);

    // High Priority: Dynamic - Real-Time Campaign Feedback
    const feedback = this.generateRealTimeFeedback(scored, options);
    if (enableRealTimeFeedback) {
      console.log("📊 Real-Time Feedback:", feedback);
    }

    // Filter final results
    const results = scored.filter(
      (b) => b.finalConfidenceScore >= qualityThreshold
    );

    console.log(
      `🎯 Enhanced discovery complete: ${results.length} qualified leads from ${businesses.length} businesses`
    );
    console.log(`💰 Total cost: $${this.totalCost.toFixed(2)}`);

    return {
      leads: results,
      totalProcessed: businesses.length,
      totalCost: this.totalCost,
      usageStats: this.getUsageStats(),
      qualityMetrics: this.calculateQualityMetrics(results),
      realTimeFeedback: feedback,
    };
  }

  // Stage wrapper methods to match expected interface
  async runDiscoveryStage(businesses, options) {
    console.log(
      `🔍 Running discovery stage for ${businesses.length} businesses`
    );
    const results = [];
    for (const business of businesses) {
      try {
        const result = await this.stage1_DiscoveryAndPreValidation(business);
        results.push(result);
      } catch (error) {
        console.error(`Error in discovery stage for ${business.name}:`, error);
        results.push({ ...business, preValidationScore: 0, isValid: false });
      }
    }
    return results;
  }

  async runEnrichmentStage(businesses, options) {
    console.log(
      `🔧 Running enrichment stage for ${businesses.length} businesses`
    );
    const results = [];
    for (const business of businesses) {
      try {
        const result = await this.stage2_EnrichmentAndPropertyIntel(business);
        results.push(result);
      } catch (error) {
        console.error(`Error in enrichment stage for ${business.name}:`, error);
        results.push(business);
      }
    }
    return results;
  }

  async runValidationStage(businesses, options) {
    console.log(
      `✅ Running validation stage for ${businesses.length} businesses`
    );
    const results = [];
    for (const business of businesses) {
      try {
        const result = await this.stage3_ValidationAndRiskAssessment(business);
        results.push(result);
      } catch (error) {
        console.error(`Error in validation stage for ${business.name}:`, error);
        results.push(business);
      }
    }
    return results;
  }

  async runScoringStage(businesses, options) {
    console.log(`📊 Running scoring stage for ${businesses.length} businesses`);
    const results = [];
    for (const business of businesses) {
      try {
        const result = await this.stage4_QualityScoringAndExport(business);
        results.push(result);
      } catch (error) {
        console.error(`Error in scoring stage for ${business.name}:`, error);
        results.push(business);
      }
    }
    return results;
  }

  /**
   * Process single business through enhanced 4-stage pipeline
   */
  async processBusinessThroughPipeline(business, options) {
    // Prioritize Foursquare and other free APIs first
    let discoveryResult = await this.foursquareClient.searchPlaces(
      business.name,
      {
        near: business.address,
        limit: 10,
      }
    );
    if (discoveryResult.found && discoveryResult.places.length > 0) {
      business.foursquareData = discoveryResult;
    }
    // Now run standard pre-validation
    const stage1Result = await this.stage1_DiscoveryAndPreValidation(business);
    // Early filtering - only proceed if pre-validation score is promising
    if (stage1Result.preValidationScore < 50) {
      console.log(
        `⏭️ Skipping ${business.name} - low pre-validation score: ${stage1Result.preValidationScore}`
      );
      return {
        ...stage1Result,
        finalConfidenceScore: stage1Result.preValidationScore,
        stage: "pre-validation-filtered",
      };
    }
    // Google Places discovery with pagination
    let googleResults = [];
    if (this.googlePlacesClient) {
      let pageToken = null;
      let pagesFetched = 0;
      do {
        const response = await this.googlePlacesClient.textSearch({
          query: `${business.name} in ${business.address}`,
          type: "establishment",
          pagetoken: pageToken,
        });
        if (response && response.results) {
          googleResults = googleResults.concat(response.results);
        }
        pageToken = response.next_page_token || null;
        pagesFetched++;
      } while (pageToken && pagesFetched < 3); // Fetch up to 3 pages
      business.googlePlacesResults = googleResults;
    }
    // Stage 2: Enrichment + Property Intelligence
    const stage2Result = await this.stage2_EnrichmentAndPropertyIntel(
      stage1Result
    );
    // Stage 3: Validation + Risk Assessment
    const stage3Result = await this.stage3_ValidationAndRiskAssessment(
      stage2Result
    );
    // Stage 4: Quality Scoring + Export Preparation
    const finalResult = await this.stage4_QualityScoringAndExport(stage3Result);
    return finalResult;
  }

  /**
   * Stage 1: Discovery + Pre-validation Scoring
   */
  async stage1_DiscoveryAndPreValidation(business) {
    console.log(`🔍 Stage 1: Pre-validation for ${business.name}`);

    const preValidationScore = this.calculatePreValidationScore(business);

    // Soften registry validation: allow for scores >= 50
    let registryValidation = {};
    if (preValidationScore >= 50) {
      registryValidation = await this.validateBusinessRegistration(business);
    }

    return {
      ...business,
      preValidationScore,
      registryValidation,
      stage: "discovery",
      processingCost: 0, // Stage 1 is free
    };
  }

  /**
   * Stage 2: Enrichment + Property Intelligence + Location Data
   * High Priority: API Prioritization & Caching
   */
  async stage2_EnrichmentAndPropertyIntel(businessData) {
    console.log(`🏢 Stage 2: Property intel for ${businessData.name}`);

    let propertyData = {};
    let emailDiscovery = {};
    let foursquareData = {};
    let googlePlacesDetails = {};
    let stageCost = 0;

    // Google Places Details Enrichment (paid but essential for contact info)
    if (this.googlePlacesClient && businessData.placeId) {
      const cacheKey = `google_details_${businessData.placeId}`;
      googlePlacesDetails = this.getCache(cacheKey);
      if (!googlePlacesDetails) {
        try {
          console.log(`📞 Fetching contact details for ${businessData.name}`);
          googlePlacesDetails = await this.googlePlacesClient.getPlaceDetails(
            businessData.placeId
          );
          this.setCache(cacheKey, googlePlacesDetails);
          stageCost += 0.017; // Google Places Details API cost

          // Enrich business data with contact information
          if (googlePlacesDetails.phone) {
            businessData.phone = googlePlacesDetails.phone;
          }
          if (googlePlacesDetails.website) {
            businessData.website = googlePlacesDetails.website;
          }
          if (googlePlacesDetails.hours) {
            businessData.hours = googlePlacesDetails.hours;
          }
        } catch (error) {
          console.warn(
            `⚠️ Google Places details failed for ${businessData.name}:`,
            error.message
          );
          googlePlacesDetails = { found: false, error: error.message };
        }
      } else {
        // Apply cached contact details
        if (googlePlacesDetails.phone)
          businessData.phone = googlePlacesDetails.phone;
        if (googlePlacesDetails.website)
          businessData.website = googlePlacesDetails.website;
        if (googlePlacesDetails.hours)
          businessData.hours = googlePlacesDetails.hours;
      }
    }

    // High Priority: API Prioritization - Free APIs first
    // Property intelligence (free)
    if (businessData.address) {
      const cacheKey = `property_${businessData.address}`;
      propertyData = this.getCache(cacheKey);
      if (!propertyData) {
        propertyData = await this.nyTaxParcelsClient.getPropertyData(
          businessData.address
        );
        this.setCache(cacheKey, propertyData);
      }
    }

    // Foursquare location intelligence (free) - Prioritized
    if (businessData.name && businessData.address) {
      const cacheKey = `foursquare_${businessData.name}_${businessData.address}`;
      foursquareData = this.getCache(cacheKey);
      if (!foursquareData) {
        try {
          foursquareData = await this.foursquareClient.searchPlaces(
            businessData.name,
            {
              near: businessData.address,
              limit: 5,
            }
          );
          this.setCache(cacheKey, foursquareData);
        } catch (error) {
          console.warn(
            `⚠️ Foursquare search failed for ${businessData.name}:`,
            error.message
          );
          foursquareData = { found: false, error: error.message };
        }
      }
    }

    // Email discovery (paid - selective usage, cached)
    if (
      this.hunterClient &&
      businessData.website &&
      businessData.preValidationScore >= 80
    ) {
      const domain = this.extractDomainFromWebsite(businessData.website);
      const cacheKey = `email_${domain}`;
      emailDiscovery = this.getCache(cacheKey);
      if (!emailDiscovery) {
        emailDiscovery = await this.hunterClient.domainSearch(domain);
        this.setCache(cacheKey, emailDiscovery);
        stageCost += emailDiscovery.cost || 0;
      }
    }

    return {
      ...businessData,
      propertyIntelligence: propertyData,
      foursquareData,
      emailDiscovery,
      googlePlacesDetails,
      stage: "enrichment",
      processingCost: stageCost,
    };
  }

  /**
   * Stage 3: Validation + Risk Assessment
   * High Priority: API Prioritization & Caching
   */
  async stage3_ValidationAndRiskAssessment(businessData) {
    console.log(`✅ Stage 3: Validation for ${businessData.name}`);

    let emailValidation = {};
    let websiteValidation = {};
    let stageCost = 0;

    // Website validation (free, cached)
    if (businessData.website) {
      const cacheKey = `website_${businessData.website}`;
      websiteValidation = this.getCache(cacheKey);
      if (!websiteValidation) {
        websiteValidation = await this.validateWebsiteAccessibility(
          businessData.website
        );
        this.setCache(cacheKey, websiteValidation);
      }
    }

    // Email validation (paid - selective usage, cached)
    if (
      this.neverBounceClient &&
      businessData.emailDiscovery?.emails?.length > 0
    ) {
      const priorityEmails = businessData.emailDiscovery.emails.slice(0, 2);
      const cacheKey = `email_validation_${priorityEmails.join("_")}`;
      emailValidation = this.getCache(cacheKey);
      if (!emailValidation) {
        const verificationResults =
          await this.neverBounceClient.verifyEmailBatch(
            priorityEmails.map((e) => e.value || e)
          );
        emailValidation = {
          results: verificationResults,
          bestEmail: verificationResults.find((r) => r.isDeliverable),
          deliverableCount: verificationResults.filter((r) => r.isDeliverable)
            .length,
        };
        this.setCache(cacheKey, emailValidation);
        stageCost += verificationResults.reduce(
          (sum, r) => sum + (r.cost || 0),
          0
        );
      }
    }

    this.totalCost += stageCost;

    return {
      ...businessData,
      emailValidation,
      websiteValidation,
      stage: "validation",
      processingCost: (businessData.processingCost || 0) + stageCost,
    };
  }

  /**
   * Stage 4: Quality Scoring + Export Preparation
   */
  async stage4_QualityScoringAndExport(businessData) {
    console.log(`🎯 Stage 4: Final scoring for ${businessData.name}`);

    const qualityScores = this.calculateQualityScores(businessData);
    const finalConfidenceScore =
      this.calculateFinalConfidenceScore(qualityScores);

    return {
      ...businessData,
      qualityScores,
      finalConfidenceScore,
      exportReady: finalConfidenceScore >= 50,
      stage: "completed",
      completedAt: new Date().toISOString(),
    };
  }

  /**
   * Calculate pre-validation score to filter businesses early
   */
  calculatePreValidationScore(business) {
    let score = 0;

    // Business name quality (25 points max)
    if (business.name) {
      score += !this.isGenericBusinessName(business.name) ? 25 : 15;
    }

    // Address completeness (20 points max)
    if (business.address) {
      score += this.isCompleteAddress(business.address) ? 20 : 15;
    }

    // Phone number format (20 points max)
    if (business.phone) {
      score +=
        this.isValidPhoneFormat(business.phone) &&
        !this.isFakePhone(business.phone)
          ? 20
          : 10;
    }

    // Google rating and review indicators (15 points max)
    if (business.rating >= 4.0 && business.user_ratings_total >= 10) {
      score += 15;
    } else if (business.rating >= 3.5) {
      score += 10;
    }

    // Website presence (20 points max)
    if (business.website && business.website !== "http://example.com") {
      score += 20;
    } else if (business.website) {
      score += 10;
    }

    return Math.min(score, 100);
  }

  /**
   * Validate business registration with state registries and federal sources
   */
  async validateBusinessRegistration(business) {
    console.log(`📋 Validating business registration for ${business.name}`);

    const results = await Promise.allSettled([
      this.californiaSOSClient.searchBusiness(business.name),
      this.newYorkSOSClient.searchBusiness(business.name),
      this.proPublicaClient.searchNonprofits(business.name),
    ]);

    const caResult =
      results[0].status === "fulfilled" ? results[0].value : { found: false };
    const nyResult =
      results[1].status === "fulfilled" ? results[1].value : { found: false };
    const proPublicaResult =
      results[2].status === "fulfilled" ? results[2].value : { found: false };

    return {
      california: caResult,
      newYork: nyResult,
      proPublica: proPublicaResult,
      registeredInAnyState: caResult.found || nyResult.found,
      isNonprofit: proPublicaResult.found,
      confidence: Math.max(
        caResult.confidence || 0,
        nyResult.confidence || 0,
        proPublicaResult.confidence || 0
      ),
    };
  }

  /**
   * Validate website accessibility
   */
  async validateWebsiteAccessibility(website) {
    try {
      const startTime = Date.now();
      const response = await fetch(website, {
        method: "HEAD",
        timeout: 5000,
        headers: {
          "User-Agent": "ProspectPro-WebsiteValidator/1.0",
        },
      });

      const responseTime = Date.now() - startTime;
      const isAccessible = response.status >= 200 && response.status < 400;

      return {
        url: website,
        accessible: isAccessible,
        statusCode: response.status,
        responseTime,
        confidence: isAccessible ? 95 : 10,
        checkedAt: new Date().toISOString(),
      };
    } catch (error) {
      return {
        url: website,
        accessible: false,
        error: error.message,
        confidence: 5,
        checkedAt: new Date().toISOString(),
      };
    }
  }

  /**
   * Calculate quality scores across all data points
   */
  calculateQualityScores(businessData) {
    return {
      businessNameScore: this.scoreBusinessName(businessData),
      addressScore: this.scoreAddress(businessData),
      phoneScore: this.scorePhone(businessData),
      websiteScore: this.scoreWebsite(businessData),
      emailScore: this.scoreEmail(businessData),
      registrationScore: this.scoreRegistration(businessData),
      propertyScore: this.scoreProperty(businessData),
      foursquareScore: this.scoreFoursquare(businessData),
      nonprofitScore: this.scoreNonprofit(businessData),
    };
  }

  /**
   * Calculate final confidence score
   */
  calculateFinalConfidenceScore(qualityScores) {
    const weights = {
      businessNameScore: 0.12,
      addressScore: 0.12,
      phoneScore: 0.15,
      websiteScore: 0.12,
      emailScore: 0.15,
      registrationScore: 0.12,
      propertyScore: 0.05,
      foursquareScore: 0.1,
      nonprofitScore: 0.07,
    };

    let weightedSum = 0;
    let totalWeight = 0;

    for (const [metric, score] of Object.entries(qualityScores)) {
      if (score > 0) {
        weightedSum += score * weights[metric];
        totalWeight += weights[metric];
      }
    }

    return totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
  }

  // Helper methods for validation and scoring
  isGenericBusinessName(name) {
    const genericPatterns = [
      /business\s+(llc|inc|corp)/i,
      /company\s+(llc|inc|corp)/i,
      /^(business|company)$/i,
      /test\s*business/i,
    ];
    return genericPatterns.some((pattern) => pattern.test(name));
  }

  isCompleteAddress(address) {
    return (
      address &&
      address.length > 10 &&
      /\d/.test(address) &&
      /[a-zA-Z]/.test(address) &&
      !address.includes("Main St, Main St")
    ); // Avoid obvious fakes
  }

  isValidPhoneFormat(phone) {
    return /^\+?[\d\s\-\(\)]{10,}$/.test(phone);
  }

  isFakePhone(phone) {
    return (
      phone.includes("555-") ||
      phone.includes("(555)") ||
      phone.includes("000-000")
    );
  }

  extractDomainFromWebsite(website) {
    try {
      const url = new URL(website);
      return url.hostname.replace("www.", "");
    } catch {
      return website
        .replace(/^https?:\/\//, "")
        .replace("www.", "")
        .split("/")[0];
    }
  }

  // Scoring methods
  scoreBusinessName(data) {
    if (!data.name) return 0;
    return this.isGenericBusinessName(data.name) ? 30 : 90;
  }

  scoreAddress(data) {
    if (!data.address) return 0;
    if (data.propertyIntelligence?.found) return 95;
    return this.isCompleteAddress(data.address) ? 80 : 40;
  }

  scorePhone(data) {
    if (!data.phone) return 0;
    if (this.isFakePhone(data.phone)) return 10;
    return this.isValidPhoneFormat(data.phone) ? 85 : 30;
  }

  scoreWebsite(data) {
    if (!data.website) return 0;
    if (data.websiteValidation?.accessible) return 95;
    return data.website !== "http://example.com" ? 50 : 10;
  }

  scoreEmail(data) {
    if (!data.emailValidation?.bestEmail) return 0;
    return data.emailValidation.bestEmail.confidence || 50;
  }

  scoreRegistration(data) {
    if (!data.registryValidation) return 50;
    return data.registryValidation.registeredInAnyState ? 90 : 20;
  }

  scoreProperty(data) {
    if (!data.propertyIntelligence?.found) return 50;
    return data.propertyIntelligence.isCommercial ? 90 : 70;
  }

  scoreFoursquare(data) {
    if (!data.foursquareData?.found) return 50;
    const places = data.foursquareData.places || [];
    if (places.length === 0) return 30;

    // Score based on number of matching places and their ratings
    const avgRating =
      places.reduce((sum, place) => sum + (place.rating || 0), 0) /
      places.length;
    const score = Math.min(places.length * 15 + avgRating * 10, 95);
    return Math.max(score, 60); // Minimum score for found places
  }

  scoreNonprofit(data) {
    if (!data.registryValidation?.proPublica) return 50;
    return data.registryValidation.proPublica.found ? 95 : 70;
  }

  calculateQualityMetrics(results) {
    if (!results.length) return {};

    return {
      averageConfidence: Math.round(
        results.reduce((sum, r) => sum + r.finalConfidenceScore, 0) /
          results.length
      ),
      registrationVerified: results.filter(
        (r) => r.registryValidation?.registeredInAnyState
      ).length,
      federalRegistration: results.filter(
        (r) => r.registryValidation?.registeredFederally
      ).length,
      nonprofits: results.filter((r) => r.registryValidation?.isNonprofit)
        .length,
      websitesAccessible: results.filter((r) => r.websiteValidation?.accessible)
        .length,
      emailsVerified: results.filter(
        (r) => r.emailValidation?.bestEmail?.isDeliverable
      ).length,
      propertiesFound: results.filter((r) => r.propertyIntelligence?.found)
        .length,
      commercialProperties: results.filter(
        (r) => r.propertyIntelligence?.isCommercial
      ).length,
      foursquareMatches: results.filter((r) => r.foursquareData?.found).length,
    };
  }

  getUsageStats() {
    const stats = {};

    // Only include stats for initialized clients
    if (this.californiaSOSClient && this.californiaSOSClient.getUsageStats) {
      stats.californiaSOSRequests = this.californiaSOSClient.getUsageStats();
    }
    if (this.newYorkSOSClient && this.newYorkSOSClient.getUsageStats) {
      stats.newYorkSOSRequests = this.newYorkSOSClient.getUsageStats();
    }
    if (this.nyTaxParcelsClient && this.nyTaxParcelsClient.getUsageStats) {
      stats.nyTaxParcelsRequests = this.nyTaxParcelsClient.getUsageStats();
    }
    if (this.secEdgarClient && this.secEdgarClient.getUsageStats) {
      stats.secEdgarRequests = this.secEdgarClient.getUsageStats();
    }
    if (this.proPublicaClient && this.proPublicaClient.getUsageStats) {
      stats.proPublicaRequests = this.proPublicaClient.getUsageStats();
    }
    if (this.foursquareClient && this.foursquareClient.getUsageStats) {
      stats.foursquareRequests = this.foursquareClient.getUsageStats();
    }
    if (this.hunterClient && this.hunterClient.getUsageStats) {
      stats.hunterIOUsage = this.hunterClient.getUsageStats();
    }
    if (this.neverBounceClient && this.neverBounceClient.getUsageStats) {
      stats.neverBounceUsage = this.neverBounceClient.getUsageStats();
    }
    if (this.googlePlacesClient && this.googlePlacesClient.getUsageStats) {
      stats.googlePlacesUsage = this.googlePlacesClient.getUsageStats();
    }

    return stats;
  }
}

module.exports = EnhancedLeadDiscovery;
