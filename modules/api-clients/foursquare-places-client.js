/**
 * Foursquare Places API Client
 *
 * Provides Points of Interest (POI) data and business location intelligence
 * - Search for places by name, category, or location
 * - Detailed place information including categories, ratings, and photos
 * - Location-based business discovery and validation
 * - Geographic search capabilities with radius and bounding box support
 *
 * API Documentation: https://docs.foursquare.com/data-products/docs/places-api/
 * Authentication: OAuth 2.0 with Client ID and Client Secret
 * Rate Limits: 950 requests per day for free tier
 *
 * ProspectPro - Zero Fake Data Policy
 */

require("dotenv").config();

class FoursquarePlacesClient {
  constructor(clientId = null, clientSecret = null) {
    this.clientId = clientId || process.env.FOURSQUARE_CLIENT_ID;
    this.clientSecret = clientSecret || process.env.FOURSQUARE_CLIENT_SECRET;
    this.baseUrl = "https://api.foursquare.com/v3";

    // Rate limiting configuration
    this.rateLimitPerDay = 950; // Free tier limit
    this.requestCount = 0;
    this.lastResetTime = Date.now();
    this.rateLimitWindow = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

    // Caching for performance
    this.cache = new Map();
    this.cacheTimeout = 6 * 60 * 60 * 1000; // 6 hours for location data

    // Quality scoring configuration
    this.qualityScore = 70; // Good quality score for Foursquare data
    this.costPerRequest = 0.0; // Free tier

    // Request statistics
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      cachedResponses: 0,
      errorCount: 0,
      rateLimitHits: 0,
      lastRequestTime: null,
    };

    // Foursquare category mappings for business classification
    this.businessCategories = {
      // Food & Dining
      "4d4b7105d754a06374d81259": "Food",
      "4bf58dd8d48988d1c4941735": "Restaurant",

      // Retail & Shopping
      "4d4b7105d754a06378d81259": "Shop & Service",
      "4bf58dd8d48988d1fd941735": "Shopping Mall",

      // Professional Services
      "4d4b7105d754a06379d81259": "Professional & Other Places",
      "4bf58dd8d48988d124941735": "Office",

      // Health & Medical
      "4d4b7105d754a0637cd81259": "Health & Medical",
      "4bf58dd8d48988d177941735": "Doctor's Office",

      // Arts & Entertainment
      "4d4b7104d754a06370d81259": "Arts & Entertainment",
      "4bf58dd8d48988d1e5931735": "Music Venue",

      // Travel & Transportation
      "4d4b7105d754a06379d81259": "Travel & Transport",
      "4bf58dd8d48988d1ed931735": "Airport",

      // Education
      "4d4b7105d754a06372d81259": "College & University",
      "4bf58dd8d48988d198941735": "College Academic Building",

      // Religious
      "4d4b7105d754a06373d81259": "Spiritual Center",
      "4bf58dd8d48988d131941735": "Spiritual Center",

      // Sports & Recreation
      "4d4b7105d754a06377d81259": "Outdoors & Recreation",
      "4bf58dd8d48988d176941735": "Gym",

      // Nightlife
      "4d4b7105d754a06376d81259": "Nightlife Spot",
      "4bf58dd8d48988d11b941735": "Pub",
    };

    if (!this.clientId || !this.clientSecret) {
      console.warn(
        "⚠️ Foursquare API credentials not found. Set FOURSQUARE_CLIENT_ID and FOURSQUARE_CLIENT_SECRET environment variables."
      );
    }
  }

  /**
   * Search for places by query and location
   * @param {string} query - Search query (business name, category, etc.)
   * @param {Object} options - Search options
   * @param {string} options.near - Location string (e.g., "New York, NY")
   * @param {number} options.ll - Latitude and longitude as "lat,lng"
   * @param {number} options.radius - Search radius in meters (max 100000)
   * @param {string} options.categories - Comma-separated category IDs
   * @param {number} options.limit - Maximum results (max 50)
   * @returns {Object} Search results with normalized structure
   */
  async searchPlaces(query, options = {}) {
    if (!query || typeof query !== "string") {
      throw new Error("Search query is required and must be a string");
    }

    if (!this.clientId || !this.clientSecret) {
      console.warn(
        "⚠️ Foursquare API credentials not configured, returning mock response"
      );
      return this.getMockResponse(query);
    }

    // Check cache first
    const cacheKey = `foursquare_search_${query
      .toLowerCase()
      .trim()}_${JSON.stringify(options)}`;
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
        "Foursquare rate limit exceeded. Please try again later."
      );
    }

    try {
      const searchParams = new URLSearchParams({
        query: query.trim(),
        limit: Math.min(options.limit || 20, 50), // Max 50 results
      });

      // Add location parameters
      if (options.near) {
        searchParams.append("near", options.near);
      } else if (options.ll) {
        searchParams.append("ll", options.ll);
      }

      // Add optional parameters
      if (options.radius && options.radius <= 100000) {
        searchParams.append("radius", options.radius.toString());
      }
      if (options.categories) {
        searchParams.append("categories", options.categories);
      }

      const response = await this.makeRequest(`/places/search?${searchParams}`);
      const normalizedResponse = this.normalizeSearchResponse(
        response,
        query,
        options
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
      console.error("Foursquare search error:", error.message);

      return {
        found: false,
        totalResults: 0,
        places: [],
        error: error.message,
        source: "Foursquare Places API",
        apiCost: this.costPerRequest,
        qualityScore: 0,
        confidenceBoost: 0,
        searchQuery: query,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Get detailed information about a specific place
   * @param {string} placeId - Foursquare place ID (FSQ ID)
   * @param {Object} options - Options for additional data
   * @param {boolean} options.includePhotos - Include photos in response
   * @param {boolean} options.includeTips - Include tips/reviews
   * @returns {Object} Place details with normalized structure
   */
  async getPlaceDetails(placeId, options = {}) {
    if (!placeId) {
      throw new Error("Place ID is required");
    }

    if (!this.clientId || !this.clientSecret) {
      console.warn("⚠️ Foursquare API credentials not configured");
      return { found: false, error: "API credentials not configured" };
    }

    // Check cache
    const cacheKey = `foursquare_place_${placeId}_${JSON.stringify(options)}`;
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
        "Foursquare rate limit exceeded. Please try again later."
      );
    }

    try {
      let endpoint = `/places/${placeId}`;

      // Add fields parameter for additional data
      const fields = ["name", "location", "categories", "geocodes", "tel"];

      if (options.includePhotos) {
        fields.push("photos");
      }
      if (options.includeTips) {
        fields.push("tips");
      }

      endpoint += `?fields=${fields.join(",")}`;

      const response = await this.makeRequest(endpoint);
      const normalizedResponse = this.normalizePlaceResponse(
        response,
        placeId,
        options
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
      console.error("Foursquare place details error:", error.message);

      return {
        found: false,
        placeId,
        error: error.message,
        source: "Foursquare Places API",
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Search for places near a specific location
   * @param {string} location - Location string or coordinates
   * @param {Object} options - Search options
   * @param {string} options.query - Optional search query
   * @param {number} options.radius - Search radius in meters
   * @param {string} options.categories - Category filter
   * @param {number} options.limit - Maximum results
   * @returns {Object} Nearby places search results
   */
  async searchNearby(location, options = {}) {
    const searchOptions = {
      ...options,
      near: typeof location === "string" ? location : undefined,
      ll: typeof location === "string" ? undefined : location,
    };

    return this.searchPlaces(options.query || "", searchOptions);
  }

  /**
   * Get places by category
   * @param {string} categoryId - Foursquare category ID
   * @param {Object} options - Search options
   * @param {string} options.near - Location string
   * @param {number} options.ll - Latitude and longitude
   * @param {number} options.radius - Search radius
   * @param {number} options.limit - Maximum results
   * @returns {Object} Category-specific search results
   */
  async searchByCategory(categoryId, options = {}) {
    if (!categoryId) {
      throw new Error("Category ID is required");
    }

    const searchOptions = {
      ...options,
      categories: categoryId,
    };

    return this.searchPlaces("", searchOptions);
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

    return this.requestCount < this.rateLimitPerDay;
  }

  /**
   * Make authenticated request to Foursquare API
   */
  async makeRequest(endpoint, retries = 3) {
    const headers = {
      Authorization: process.env.FOURSQUARE_SERVICE_API_KEY,
      Accept: "application/json",
      "User-Agent": "ProspectPro/2.0 Business Discovery System",
    };

    const url = `${this.baseUrl}${endpoint}`;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await fetch(url, {
          headers,
          timeout: 30000, // 30 second timeout
        });

        // Track request
        this.requestCount++;
        this.stats.totalRequests++;
        this.stats.lastRequestTime = new Date().toISOString();

        if (response.ok) {
          this.stats.successfulRequests++;
          return await response.json();
        }

        // Handle specific error codes
        if (response.status === 400) {
          throw new Error("Bad Request - Invalid parameters");
        } else if (response.status === 401) {
          throw new Error("Authentication failed - Invalid API credentials");
        } else if (response.status === 403) {
          throw new Error("Forbidden - API access denied");
        } else if (response.status === 404) {
          throw new Error("Place not found");
        } else if (response.status === 429) {
          this.stats.rateLimitHits++;
          if (attempt < retries) {
            const delay = Math.pow(2, attempt) * 2000; // Exponential backoff
            console.log(
              `Foursquare rate limit hit. Waiting ${delay}ms before retry ${attempt}/${retries}`
            );
            await new Promise((resolve) => setTimeout(resolve, delay));
            continue;
          }
          throw new Error(
            "Foursquare rate limit exceeded - Please try again later"
          );
        } else if (response.status >= 500) {
          if (attempt < retries) {
            const delay = Math.pow(2, attempt) * 1000;
            console.log(
              `Foursquare server error ${response.status}. Retrying in ${delay}ms`
            );
            await new Promise((resolve) => setTimeout(resolve, delay));
            continue;
          }
          throw new Error(`Foursquare server error: ${response.status}`);
        } else {
          throw new Error(`Foursquare API error: ${response.status}`);
        }
      } catch (error) {
        if (attempt === retries) {
          throw error;
        }
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  /**
   * Get OAuth access token using client credentials
   */
  async getAccessToken() {
    // Check if we have a cached token
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      const response = await fetch(
        "https://foursquare.com/oauth2/access_token",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Basic ${Buffer.from(
              `${this.clientId}:${this.clientSecret}`
            ).toString("base64")}`,
          },
          body: new URLSearchParams({
            grant_type: "client_credentials",
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Token request failed: ${response.status}`);
      }

      const data = await response.json();
      this.accessToken = data.access_token;

      // Set expiry time (typically 1 hour, but use shorter buffer)
      this.tokenExpiry = Date.now() + (data.expires_in - 300) * 1000; // 5 min buffer

      return this.accessToken;
    } catch (error) {
      console.error("Failed to get Foursquare access token:", error.message);
      throw new Error("Authentication failed - Could not obtain access token");
    }
  }

  /**
   * Normalize search response for ProspectPro pipeline
   */
  normalizeSearchResponse(data, searchQuery, options) {
    const results = data?.results || [];
    const places = Array.isArray(results) ? results : [];

    // Calculate confidence boost based on match quality
    let confidenceBoost = 0;
    let exactMatches = 0;

    places.forEach((place) => {
      if (
        place.name &&
        place.name.toLowerCase() === searchQuery.toLowerCase()
      ) {
        exactMatches++;
      }
    });

    if (exactMatches > 0) {
      confidenceBoost = 15; // Good confidence for exact matches
    } else if (places.length > 0) {
      confidenceBoost = 8; // Moderate confidence for location matches
    }

    return {
      found: places.length > 0,
      totalResults: places.length,
      exactMatches,
      places: places.map((place) => ({
        fsqId: place.fsq_id || null,
        name: place.name || null,

        // Location information
        address: place.location?.address || null,
        city: place.location?.locality || null,
        region: place.location?.region || null,
        postalCode: place.location?.postcode || null,
        country: place.location?.country || null,
        formattedAddress: place.location?.formatted_address || null,

        // Geographic coordinates
        latitude: place.geocodes?.main?.latitude || null,
        longitude: place.geocodes?.main?.longitude || null,

        // Categories and classification
        categories:
          place.categories?.map((cat) => ({
            id: cat.id,
            name: cat.name,
            icon: cat.icon?.prefix + "64" + cat.icon?.suffix || null,
          })) || [],
        primaryCategory: place.categories?.[0]?.name || null,
        businessType: this.classifyBusinessType(place.categories),

        // Contact information
        telephone: place.tel || null,
        website: place.website || null,

        // Additional metadata
        distance: place.distance || null,
        timezone: place.timezone || null,

        // Validation metadata
        source: "Foursquare Places API",
        sourceId: place.fsq_id,
        lastVerified: new Date().toISOString(),
        dataQuality: "crowdsourced_location_data",
      })),

      // ProspectPro metadata
      source: "Foursquare Places API",
      apiCost: this.costPerRequest,
      qualityScore: this.qualityScore,
      confidenceBoost,
      searchQuery,
      searchOptions: options,

      // Performance metrics
      cached: false,
      processingTime: Date.now(),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Normalize place details response
   */
  normalizePlaceResponse(data, placeId, options) {
    if (!data) {
      return {
        found: false,
        placeId,
        source: "Foursquare Places API",
        timestamp: new Date().toISOString(),
      };
    }

    return {
      found: true,
      placeId,
      placeDetails: {
        fsqId: data.fsq_id || placeId,
        name: data.name || null,

        // Location details
        location: {
          address: data.location?.address || null,
          city: data.location?.locality || null,
          region: data.location?.region || null,
          postalCode: data.location?.postcode || null,
          country: data.location?.country || null,
          formattedAddress: data.location?.formatted_address || null,
        },

        // Geographic information
        geocodes: {
          main: {
            latitude: data.geocodes?.main?.latitude || null,
            longitude: data.geocodes?.main?.longitude || null,
          },
          roof: {
            latitude: data.geocodes?.roof?.latitude || null,
            longitude: data.geocodes?.roof?.longitude || null,
          },
        },

        // Categories
        categories:
          data.categories?.map((cat) => ({
            id: cat.id,
            name: cat.name,
            icon: cat.icon?.prefix + "64" + cat.icon?.suffix || null,
          })) || [],
        primaryCategory: data.categories?.[0]?.name || null,
        businessType: this.classifyBusinessType(data.categories),

        // Contact information
        telephone: data.tel || null,
        website: data.website || null,

        // Additional data
        timezone: data.timezone || null,
        photos: options.includePhotos ? data.photos || [] : undefined,
        tips: options.includeTips ? data.tips || [] : undefined,
      },

      source: "Foursquare Places API",
      qualityScore: this.qualityScore,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Classify business type from Foursquare categories
   */
  classifyBusinessType(categories) {
    if (!categories || categories.length === 0) {
      return "Unknown";
    }

    // Check primary category first
    const primaryCategory = categories[0];
    if (primaryCategory && this.businessCategories[primaryCategory.id]) {
      return this.businessCategories[primaryCategory.id];
    }

    // Check all categories for matches
    for (const category of categories) {
      if (this.businessCategories[category.id]) {
        return this.businessCategories[category.id];
      }
    }

    // Fallback to broader classification
    const categoryName = primaryCategory?.name?.toLowerCase() || "";
    if (categoryName.includes("restaurant") || categoryName.includes("food")) {
      return "Food & Dining";
    } else if (
      categoryName.includes("shop") ||
      categoryName.includes("store")
    ) {
      return "Retail";
    } else if (
      categoryName.includes("office") ||
      categoryName.includes("professional")
    ) {
      return "Professional Services";
    } else if (
      categoryName.includes("health") ||
      categoryName.includes("medical")
    ) {
      return "Health & Medical";
    }

    return "Other";
  }

  /**
   * Mock response for testing when API credentials not available
   */
  getMockResponse(searchQuery) {
    return {
      found: false,
      totalResults: 0,
      places: [],
      error:
        "API credentials not configured - this would search Foursquare Places database",
      source: "Foursquare Places API (Mock)",
      apiCost: this.costPerRequest,
      qualityScore: 0,
      confidenceBoost: 0,
      searchQuery,
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
        dailyLimit: this.rateLimitPerDay,
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
        isConfigured: !!(this.clientId && this.clientSecret),
        tokenValid: !!(this.accessToken && this.tokenExpiry > Date.now()),
      },
    };
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
    console.log("Foursquare Places API cache cleared");
  }

  /**
   * Clear access token (force refresh)
   */
  clearToken() {
    this.accessToken = null;
    this.tokenExpiry = null;
    console.log("Foursquare access token cleared");
  }
}

module.exports = FoursquarePlacesClient;
