/**
 * Chamber of Commerce Directory Client
 * Free business membership verification and directory search
 * Integrates with existing US Chamber client and local chamber directories
 */

class ChamberDirectoryClient {
  constructor(apiKey = null) {
    this.apiKey = apiKey;
    this.baseUrl = "https://api.uschamber.org/v1"; // Primary API endpoint
    this.fallbackDirectories = [
      "https://www.uschamber.com/co/search",
      "https://local.uschamber.com/directory",
    ];

    // TTL Cache for optimizing API usage
    this.cache = new Map();
    this.cacheTTL = 86400000; // 24 hours for chamber data

    this.usageStats = {
      searches: 0,
      verifications: 0,
      membershipFound: 0,
      totalCost: 0.0, // Chamber directories are free
      cacheHits: 0,
    };
  }

  // Consistent cache methods following ProspectPro patterns
  getCache(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      this.usageStats.cacheHits++;
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  setCache(key, data) {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  /**
   * Search for Chamber member businesses by type and location
   * @param {string} businessType - Type of business to search for
   * @param {string} location - Location to search in
   * @param {number} limit - Maximum results to return
   * @returns {Promise<Object>} Search results with Chamber verification status
   */
  async searchChamberMembers(businessType, location, limit = 10) {
    const cacheKey = `chamber_search_${businessType}_${location}_${limit}`;
    const cached = this.getCache(cacheKey);
    if (cached) return cached;

    try {
      console.log(
        `🏛️ Searching Chamber directories: ${businessType} in ${location}`
      );
      this.usageStats.searches++;

      // Try primary API first if available
      if (this.apiKey) {
        const primaryResults = await this.searchPrimaryAPI(
          businessType,
          location,
          limit
        );
        if (primaryResults.found) {
          this.setCache(cacheKey, primaryResults);
          return primaryResults;
        }
      }

      // Fallback to directory scraping with rate limiting
      const directoryResults = await this.searchChamberDirectories(
        businessType,
        location
      );
      this.setCache(cacheKey, directoryResults);
      return directoryResults;
    } catch (error) {
      console.error("Chamber Directory search error:", error.message);
      return {
        found: false,
        error: `Chamber Directory error: ${error.message}`,
        source: "chamber_directory",
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
    if (!business.businessName && !business.name) {
      return {
        verified: false,
        error: "Business name required for verification",
        source: "chamber_directory",
      };
    }

    const businessName = business.businessName || business.name;
    const cacheKey = `chamber_verify_${businessName}_${business.address}`;
    const cached = this.getCache(cacheKey);
    if (cached) return cached;

    try {
      console.log(`🔍 Verifying Chamber membership for: ${businessName}`);
      this.usageStats.verifications++;

      // Search for business in chamber directories
      const membershipData = await this.performMembershipVerification(business);

      if (membershipData.verified) {
        this.usageStats.membershipFound++;
      }

      const result = {
        verified: membershipData.verified || false,
        chambers: membershipData.chambers || [],
        membershipLevel: membershipData.level || null,
        memberSince: membershipData.since || null,
        confidenceBoost: membershipData.verified ? 15 : 0,
        source: "chamber_directory",
        timestamp: new Date().toISOString(),
      };

      this.setCache(cacheKey, result);
      return result;
    } catch (error) {
      console.error("Chamber membership verification error:", error.message);
      return {
        verified: false,
        error: error.message,
        source: "chamber_directory",
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Search primary Chamber API (if API key available)
   * @private
   */
  async searchPrimaryAPI(businessType, location, limit) {
    if (!this.apiKey) {
      return { found: false, reason: "No API key configured" };
    }

    const response = await fetch(`${this.baseUrl}/members/search`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
        "User-Agent": "ProspectPro/4.0",
      },
      body: JSON.stringify({
        query: businessType,
        location: location,
        limit: limit,
        include_verification: true,
        active_members_only: true,
      }),
    });

    if (!response.ok) {
      throw new Error(
        `Chamber API error: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    return this.normalizeChamberResponse(data, businessType, location);
  }

  /**
   * Search chamber directories using ethical scraping
   * @private
   */
  async searchChamberDirectories(businessType, location) {
    // Implement ethical directory search with rate limiting
    // This would include robots.txt compliance and respectful scraping
    return {
      found: false,
      businesses: [],
      source: "chamber_directory_scraping",
      message: "Directory scraping implementation pending",
      query: { businessType, location },
    };
  }

  /**
   * Perform business membership verification
   * @private
   */
  async performMembershipVerification(business) {
    // Implementation would check multiple chamber sources
    // For now, return structured placeholder
    return {
      verified: false,
      chambers: [],
      level: null,
      since: null,
      confidence: 0,
    };
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
        source: "chamber_directory",
        query: { businessType, location },
      };
    }

    const businesses = data.members.map((member) =>
      this.normalizeBusinessData(member)
    );

    return {
      found: true,
      businesses,
      source: "chamber_directory",
      query: { businessType, location },
      total_available: data.total_count || businesses.length,
      chamber_info: {
        request_id: data.request_id,
        chambers_searched: data.chambers_searched || [],
      },
    };
  }

  /**
   * Normalize individual business data to ProspectPro format
   * @private
   */
  normalizeBusinessData(member) {
    return {
      businessName: member.business_name || member.name,
      address: this.buildAddress(member),
      phone: member.phone || member.primary_phone,
      website: member.website || member.primary_website,
      email: member.email || member.contact_email,
      chamberMembership: {
        verified: true,
        chamber: member.chamber_name,
        membershipLevel: member.membership_level,
        memberSince: member.member_since,
        benefits: member.membership_benefits || [],
      },
      confidenceScore: 85, // High confidence for chamber members
      source: "chamber_directory",
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
      cache_hit_rate:
        this.usageStats.searches > 0
          ? (
              (this.usageStats.cacheHits / this.usageStats.searches) *
              100
            ).toFixed(1) + "%"
          : "0%",
      membership_rate:
        this.usageStats.verifications > 0
          ? (
              (this.usageStats.membershipFound /
                this.usageStats.verifications) *
              100
            ).toFixed(1) + "%"
          : "0%",
    };
  }

  /**
   * Clear cache and reset usage stats (for testing)
   */
  reset() {
    this.cache.clear();
    this.usageStats = {
      searches: 0,
      verifications: 0,
      membershipFound: 0,
      totalCost: 0.0,
      cacheHits: 0,
    };
  }
}

module.exports = ChamberDirectoryClient;
