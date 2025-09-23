/**
 * US Chamber of Commerce API Client
 * Real API integration example for ProspectPro using MCP-assisted development
 */

class USChamberAPIClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = "https://api.uschamber.org/v1"; // Example endpoint
    this.usageStats = {
      requests: 0,
      totalCost: 0,
      businessesFound: 0,
      verificationRequests: 0,
    };

    // TTL Cache for optimizing API usage
    this.cache = new Map();
    this.cacheTTL = 3600000; // 1 hour in milliseconds
  }

  // Consistent cache methods following ProspectPro patterns
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
   * Search for Chamber member businesses
   * @param {string} businessType - Type of business to search for
   * @param {string} location - Location to search in
   * @param {number} limit - Maximum results to return
   * @returns {Promise<Object>} Search results with Chamber verification status
   */
  async searchChamberMembers(businessType, location, limit = 10) {
    // API key validation
    if (!this.apiKey) {
      return {
        found: false,
        error: "US Chamber API key not configured",
        source: "us_chamber",
      };
    }

    // Check cache first
    const cacheKey = `chamber_search_${businessType}_${location}_${limit}`;
    const cached = this.getCache(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      console.log(
        `🏛️  Searching US Chamber API: ${businessType} in ${location}`
      );

      const response = await fetch(`${this.baseUrl}/members/search`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
          "User-Agent": "ProspectPro/3.0",
        },
        body: JSON.stringify({
          query: businessType,
          location: location,
          limit: limit,
          include_verification: true,
          active_members_only: true,
        }),
      });

      // Track usage for cost monitoring
      this.usageStats.requests++;
      this.usageStats.totalCost += 0.025; // $0.025 per search (example pricing)

      if (!response.ok) {
        throw new Error(
          `Chamber API error: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();

      // Normalize response to ProspectPro format
      const normalizedResponse = this.normalizeChamberResponse(
        data,
        businessType,
        location
      );

      // Cache successful responses
      this.setCache(cacheKey, normalizedResponse);

      this.usageStats.businessesFound +=
        normalizedResponse.businesses?.length || 0;

      return normalizedResponse;
    } catch (error) {
      console.error("US Chamber API error:", error.message);
      return {
        found: false,
        error: `US Chamber API error: ${error.message}`,
        source: "us_chamber",
        query: { businessType, location, limit },
      };
    }
  }

  /**
   * Verify a business's Chamber membership status
   * @param {Object} business - Business data to verify
   * @returns {Promise<Object>} Verification results
   */
  async verifyMembership(business) {
    if (!this.apiKey) {
      return { verified: false, error: "API key not configured" };
    }

    const cacheKey = `chamber_verify_${business.name}_${business.address}`;
    const cached = this.getCache(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const response = await fetch(`${this.baseUrl}/members/verify`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          business_name: business.name,
          address: business.address,
          phone: business.phone,
        }),
      });

      this.usageStats.requests++;
      this.usageStats.verificationRequests++;
      this.usageStats.totalCost += 0.015; // $0.015 per verification

      const data = await response.json();

      const result = {
        verified: data.is_member || false,
        membership_level: data.membership_level || null,
        member_since: data.member_since || null,
        chamber_location: data.chamber_location || null,
        confidence_score: data.confidence_score || 0,
        source: "us_chamber",
      };

      this.setCache(cacheKey, result);
      return result;
    } catch (error) {
      return {
        verified: false,
        error: error.message,
        source: "us_chamber",
      };
    }
  }

  /**
   * Get Chamber business directory information
   * @param {string} chamberId - Specific chamber ID to search
   * @param {string} category - Business category
   * @returns {Promise<Object>} Chamber directory results
   */
  async getChamberDirectory(chamberId, category = null) {
    if (!this.apiKey) {
      return { found: false, error: "API key not configured" };
    }

    try {
      const params = new URLSearchParams({
        chamber_id: chamberId,
        ...(category && { category }),
      });

      const response = await fetch(
        `${this.baseUrl}/chambers/${chamberId}/directory?${params}`,
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
        }
      );

      this.usageStats.requests++;
      this.usageStats.totalCost += 0.02; // $0.020 per directory query

      const data = await response.json();

      return {
        found: true,
        chamber_info: data.chamber_info,
        businesses:
          data.members?.map((member) => this.normalizeBusinessData(member)) ||
          [],
        total_count: data.total_count || 0,
        source: "us_chamber_directory",
      };
    } catch (error) {
      return {
        found: false,
        error: error.message,
        source: "us_chamber_directory",
      };
    }
  }

  /**
   * Normalize Chamber API response to ProspectPro format
   * @private
   */
  normalizeChamberResponse(data, businessType, location) {
    if (!data.members || !Array.isArray(data.members)) {
      return {
        found: false,
        businesses: [],
        source: "us_chamber",
        query: { businessType, location },
      };
    }

    const businesses = data.members.map((member) =>
      this.normalizeBusinessData(member)
    );

    return {
      found: true,
      businesses,
      source: "us_chamber",
      query: { businessType, location },
      total_available: data.total_count || businesses.length,
      api_info: {
        request_id: data.request_id,
        search_radius: data.search_radius,
        chamber_coverage: data.chamber_coverage,
      },
    };
  }

  /**
   * Normalize individual business data to ProspectPro format
   * @private
   */
  normalizeBusinessData(member) {
    return {
      // Core business info
      name: member.business_name || member.name,
      address: member.address || this.buildAddress(member),
      phone: member.phone || member.contact_phone,
      website: member.website || member.web_url,

      // Chamber-specific data
      chamber_member: true,
      membership_level: member.membership_level || "standard",
      member_since: member.member_since || null,
      chamber_location: member.chamber?.name || null,

      // Business classification
      business_type: member.category || member.business_category,
      industry: member.industry_classification,

      // Contact enhancement
      contact_person: member.primary_contact?.name || null,
      contact_title: member.primary_contact?.title || null,

      // Additional verification data
      verification_status: "chamber_verified",
      data_source: "us_chamber",
      confidence_boost: 15, // Chamber membership adds credibility

      // Metadata
      chamber_data: {
        member_id: member.id,
        chamber_id: member.chamber?.id,
        verified_business: true,
        public_profile: member.public_profile || false,
      },
    };
  }

  /**
   * Build formatted address from member data
   * @private
   */
  buildAddress(member) {
    const parts = [
      member.street_address,
      member.city,
      member.state,
      member.zip_code,
    ].filter(Boolean);

    return parts.join(", ");
  }

  /**
   * Get usage statistics for cost monitoring
   * @returns {Object} Usage and cost statistics
   */
  getUsageStats() {
    return {
      ...this.usageStats,
      cache_size: this.cache.size,
      average_cost_per_business:
        this.usageStats.businessesFound > 0
          ? (
              this.usageStats.totalCost / this.usageStats.businessesFound
            ).toFixed(4)
          : 0,
    };
  }

  /**
   * Clear cache and reset usage stats (for testing)
   */
  reset() {
    this.cache.clear();
    this.usageStats = {
      requests: 0,
      totalCost: 0,
      businessesFound: 0,
      verificationRequests: 0,
    };
  }
}

module.exports = USChamberAPIClient;
