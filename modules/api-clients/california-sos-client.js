/**
 * California Secretary of State API Client
 *
 * Provides business entity verification using CA SOS Business Entity Public Search API
 * - Keyword search for business entities
 * - Entity details retrieval by number
 * - Rate limiting and error handling
 * - Response normalization for ProspectPro pipeline
 *
 * API Documentation: https://calico.sos.ca.gov/cbc/v1/api/
 * Authentication: Ocp-Apim-Subscription-Key header
 *
 * ProspectPro - Zero Fake Data Policy
 */

require("dotenv").config();

class CaliforniaSOSClient {
  constructor(apiKey = null) {
    this.apiKey = apiKey || process.env.CALIFORNIA_SOS_API_KEY;
    this.baseUrl =
      process.env.CALIFORNIA_SOS_BASE_URL ||
      "https://calico.sos.ca.gov/cbc/v1/api";

    // Rate limiting configuration
    this.rateLimitPerHour = 100; // Conservative estimate
    this.requestCount = 0;
    this.lastResetTime = Date.now();
    this.rateLimitWindow = 60 * 60 * 1000; // 1 hour in milliseconds

    // Caching for performance
    this.cache = new Map();
    this.cacheTimeout = 24 * 60 * 60 * 1000; // 24 hours

    // Quality scoring configuration
    this.qualityScore = 75; // High quality score for official CA data
    this.costPerRequest = 0.0; // Free API

    // Request statistics
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      cachedResponses: 0,
      errorCount: 0,
      lastRequestTime: null,
    };

    if (!this.apiKey) {
      console.warn(
        "⚠️ California SOS API key not found. This API requires a subscription key from https://calico.sos.ca.gov"
      );
      console.warn(
        "💡 To get access: Contact California Secretary of State API team for subscription"
      );
    }
  }

  /**
   * Legacy method for backward compatibility
   */
  async searchBusiness(businessName) {
    return this.searchByKeyword(businessName);
  }

  /**
   * Check if we're within rate limits
   */
  checkRateLimit() {
    const now = Date.now();

    // Reset counter if window has passed
    if (now - this.lastResetTime >= this.rateLimitWindow) {
      this.requestCount = 0;
      this.lastResetTime = now;
    }

    return this.requestCount < this.rateLimitPerHour;
  }

  /**
   * Generate cache key for request
   */
  generateCacheKey(searchTerm, options = {}) {
    return `ca_sos_${searchTerm.toLowerCase().trim()}_${JSON.stringify(
      options
    )}`;
  }

  /**
   * Search for business entities by keyword
   * @param {string} businessName - Business name to search for
   * @param {Object} options - Search options
   * @param {boolean} options.exactMatch - Whether to search for exact matches only
   * @param {string} options.createdDateStart - Filter by creation date start (YYYY-MM-DD)
   * @param {string} options.createdDateEnd - Filter by creation date end (YYYY-MM-DD)
   * @returns {Object} Search results with normalized structure
   */
  async searchByKeyword(businessName, options = {}) {
    if (!this.apiKey) {
      console.warn(
        "⚠️ California SOS API key not configured, returning mock response"
      );
      return this.getMockResponse(businessName);
    }

    if (!businessName || typeof businessName !== "string") {
      throw new Error("Business name is required and must be a string");
    }

    // Check cache first
    const cacheKey = this.generateCacheKey(businessName, options);
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        this.stats.cachedResponses++;
        return cached.data;
      }
      this.cache.delete(cacheKey);
    }

    // Rate limit check
    if (!this.checkRateLimit()) {
      throw new Error(
        "California SOS rate limit exceeded. Please try again later."
      );
    }

    try {
      const searchParams = new URLSearchParams({
        "search-term": businessName.trim(),
        "begins-with": options.exactMatch ? "true" : "false",
      });

      // Add optional date filters
      if (options.createdDateStart) {
        searchParams.append("created-date-start", options.createdDateStart);
      }
      if (options.createdDateEnd) {
        searchParams.append("created-date-end", options.createdDateEnd);
      }

      const response = await this.makeRequest(
        `/BusinessEntityKeywordSearch?${searchParams}`
      );
      const normalizedResponse = this.normalizeSearchResponse(
        response,
        businessName
      );

      // Cache successful responses
      this.cache.set(cacheKey, {
        data: normalizedResponse,
        timestamp: Date.now(),
      });

      this.stats.successfulRequests++;
      return normalizedResponse;
    } catch (error) {
      this.stats.errorCount++;
      console.error("California SOS search error:", error.message);

      // Return structured error response
      return {
        found: false,
        totalResults: 0,
        entities: [],
        error: error.message,
        source: "California Secretary of State",
        apiCost: this.costPerRequest,
        qualityScore: 0,
        confidenceBoost: 0,
        searchTerm: businessName,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Get detailed information about a specific business entity
   * @param {string} entityNumber - CA SOS entity number
   * @returns {Object} Entity details with normalized structure
   */
  async getEntityDetails(entityNumber) {
    if (!this.apiKey) {
      console.warn("⚠️ California SOS API key not configured");
      return { found: false, error: "API key not configured" };
    }

    if (!entityNumber) {
      throw new Error("Entity number is required");
    }

    // Check cache
    const cacheKey = `ca_sos_entity_${entityNumber}`;
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        this.stats.cachedResponses++;
        return cached.data;
      }
      this.cache.delete(cacheKey);
    }

    // Rate limit check
    if (!this.checkRateLimit()) {
      throw new Error(
        "California SOS rate limit exceeded. Please try again later."
      );
    }

    try {
      const response = await this.makeRequest(
        `/BusinessEntityDetails?entity-number=${encodeURIComponent(
          entityNumber
        )}`
      );
      const normalizedResponse = this.normalizeEntityResponse(
        response,
        entityNumber
      );

      // Cache successful responses
      this.cache.set(cacheKey, {
        data: normalizedResponse,
        timestamp: Date.now(),
      });

      this.stats.successfulRequests++;
      return normalizedResponse;
    } catch (error) {
      this.stats.errorCount++;
      console.error("California SOS entity details error:", error.message);

      return {
        found: false,
        entityNumber,
        error: error.message,
        source: "California Secretary of State",
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Check API server status
   */
  async checkServerStatus() {
    try {
      const response = await this.makeRequest("/ServerStatus");
      return {
        status: "operational",
        response,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: "error",
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Make HTTP request to CA SOS API
   */
  async makeRequest(endpoint, retries = 3) {
    const headers = {
      "Ocp-Apim-Subscription-Key": this.apiKey,
      Accept: "application/json",
      "User-Agent": "ProspectPro/2.0 Business Validation System",
    };

    const url = `${this.baseUrl}${endpoint}`;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await fetch(url, {
          headers,
          timeout: 30000, // 30 second timeout
        });

        // Handle different response statuses
        if (response.ok) {
          this.requestCount++;
          this.stats.totalRequests++;
          this.stats.lastRequestTime = new Date().toISOString();
          return await response.json();
        }

        // Handle specific error codes
        if (response.status === 400) {
          throw new Error("Bad Request - Invalid parameters or no match found");
        } else if (response.status === 401 || response.status === 403) {
          throw new Error("Authentication failed - Invalid API key");
        } else if (response.status === 429) {
          // Rate limit exceeded - wait and retry
          if (attempt < retries) {
            const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
            console.log(
              `Rate limit exceeded. Waiting ${delay}ms before retry ${attempt}/${retries}`
            );
            await new Promise((resolve) => setTimeout(resolve, delay));
            continue;
          }
          throw new Error("Rate limit exceeded - Please try again later");
        } else if (response.status >= 500) {
          // Server error - retry with backoff
          if (attempt < retries) {
            const delay = Math.pow(2, attempt) * 1000;
            console.log(
              `Server error ${response.status}. Retrying in ${delay}ms`
            );
            await new Promise((resolve) => setTimeout(resolve, delay));
            continue;
          }
          throw new Error(`California SOS server error: ${response.status}`);
        } else {
          throw new Error(`California SOS API error: ${response.status}`);
        }
      } catch (error) {
        if (attempt === retries) {
          throw error;
        }
        // Wait before retry
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  /**
   * Normalize search response for ProspectPro pipeline
   */
  normalizeSearchResponse(data, searchTerm) {
    const entities = Array.isArray(data) ? data : [];

    // Calculate confidence boost based on match quality
    let confidenceBoost = 0;
    let exactMatches = 0;

    entities.forEach((entity) => {
      if (
        entity.EntityName &&
        entity.EntityName.toLowerCase() === searchTerm.toLowerCase()
      ) {
        exactMatches++;
      }
    });

    if (exactMatches > 0) {
      confidenceBoost = 20; // High confidence for exact matches
    } else if (entities.length > 0) {
      confidenceBoost = 10; // Moderate confidence for partial matches
    }

    return {
      found: entities.length > 0,
      totalResults: entities.length,
      exactMatches,
      entities: entities.map((entity) => ({
        entityId: entity.EntityID || null,
        entityNumber: entity.EntityNumber || entity.EntityID,
        entityName: entity.EntityName || null,
        entityType: entity.EntityType || null,
        status: entity.StatusDescription || entity.Status || null,
        statusDescription: entity.StatusDescription || null,
        jurisdiction: entity.Jurisdiction || "California",
        registrationDate:
          entity.RegistrationDate || entity.FormationDate || null,
        lastUpdated: entity.LastUpdated || null,

        // Agent information
        agentName: entity.AgentName || null,
        agentType: entity.AgentType || null,
        agentAddress: entity.AgentAddress || null,

        // Address information
        principalAddress: entity.PrincipalAddress || null,
        mailingAddress: entity.MailingAddress || null,

        // Business details
        purpose: entity.Purpose || null,
        ceoName: entity.CEOName || null,
        cfoCfoName: entity.CFOName || null,
        secretaryName: entity.SecretaryName || null,

        // Validation metadata
        source: "California Secretary of State",
        sourceId: entity.EntityID || entity.EntityNumber,
        lastVerified: new Date().toISOString(),
        dataQuality: "official_government_record",
      })),

      // ProspectPro metadata
      source: "California Secretary of State",
      apiCost: this.costPerRequest,
      qualityScore: this.qualityScore,
      confidenceBoost,
      searchTerm,

      // Performance metrics
      cached: false,
      processingTime: Date.now(),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Normalize entity details response
   */
  normalizeEntityResponse(data, entityNumber) {
    if (!data) {
      return {
        found: false,
        entityNumber,
        source: "California Secretary of State",
        timestamp: new Date().toISOString(),
      };
    }

    return {
      found: true,
      entityNumber,
      entityDetails: {
        entityId: data.EntityID || null,
        entityNumber: data.EntityNumber || entityNumber,
        entityName: data.EntityName || null,
        entityType: data.EntityType || null,
        status: data.StatusDescription || data.Status || null,
        jurisdiction: data.Jurisdiction || "California",
        registrationDate: data.RegistrationDate || null,
        lastUpdated: data.LastUpdated || null,

        // Complete entity information
        agentName: data.AgentName || null,
        agentType: data.AgentType || null,
        principalAddress: data.PrincipalAddress || null,
        mailingAddress: data.MailingAddress || null,
        purpose: data.Purpose || null,

        // Officers
        ceoName: data.CEOName || null,
        cfoName: data.CFOName || null,
        secretaryName: data.SecretaryName || null,

        // Additional fields
        sicCode: data.SICCode || null,
        sicDescription: data.SICDescription || null,
      },
      source: "California Secretary of State",
      qualityScore: this.qualityScore,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Mock response for testing when API key not available
   */
  getMockResponse(businessName) {
    return {
      found: false,
      totalResults: 0,
      entities: [],
      error:
        "API key not configured - this would search California SOS database",
      source: "California Secretary of State (Mock)",
      apiCost: this.costPerRequest,
      qualityScore: 0,
      confidenceBoost: 0,
      searchTerm: businessName,
      timestamp: new Date().toISOString(),
      mockData: true,
    };
  }

  /**
   * Get usage statistics
   */
  getUsageStats() {
    return {
      ...this.stats,
      rateLimitStatus: {
        currentPeriodRequests: this.requestCount,
        hourlyLimit: this.rateLimitPerHour,
        resetTime: new Date(
          this.lastResetTime + this.rateLimitWindow
        ).toISOString(),
      },
      cacheStats: {
        entriesCount: this.cache.size,
        hitRate:
          this.stats.totalRequests > 0
            ? this.stats.cachedResponses / this.stats.totalRequests
            : 0,
      },
      apiInfo: {
        qualityScore: this.qualityScore,
        costPerRequest: this.costPerRequest,
        isConfigured: !!this.apiKey,
      },
    };
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
    console.log("California SOS API cache cleared");
  }
}

module.exports = CaliforniaSOSClient;
