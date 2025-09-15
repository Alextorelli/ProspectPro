/**
 * California Secretary of State Business Entity API Client
 * Free API for business validation and verification
 */

class CaliforniaSOS {
  constructor() {
    this.baseURL = 'https://calico.sos.ca.gov/cbc/v1/api';
    this.requestCount = 0;
    this.rateLimitDelay = 100; // 100ms between requests to be respectful
  }

  /**
   * Search for business entity by name
   * @param {string} businessName - Business name to search
   * @returns {Promise<Object>} Business registration data
   */
  async searchBusiness(businessName) {
    try {
      await this.respectRateLimit();
      
      const response = await fetch(`${this.baseURL}/search?name=${encodeURIComponent(businessName)}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'ProspectPro-LeadValidation/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`California SOS API error: ${response.status}`);
      }

      const data = await response.json();
      this.requestCount++;
      
      return {
        found: data.businesses && data.businesses.length > 0,
        registrationStatus: data.businesses?.[0]?.status || 'Not Found',
        entityType: data.businesses?.[0]?.entityType || null,
        registrationDate: data.businesses?.[0]?.registrationDate || null,
        registeredAgent: data.businesses?.[0]?.registeredAgent || null,
        address: data.businesses?.[0]?.address || null,
        confidence: data.businesses?.length > 0 ? 85 : 0,
        source: 'California Secretary of State'
      };

    } catch (error) {
      console.warn('California SOS API request failed:', error.message);
      return {
        found: false,
        error: error.message,
        confidence: 0,
        source: 'California Secretary of State'
      };
    }
  }

  /**
   * Rate limiting to be respectful to the free API
   */
  async respectRateLimit() {
    if (this.requestCount > 0) {
      await new Promise(resolve => setTimeout(resolve, this.rateLimitDelay));
    }
  }

  /**
   * Get API usage statistics
   */
  getUsageStats() {
    return {
      requestCount: this.requestCount,
      estimatedCost: 0, // Free API
      source: 'California SOS'
    };
  }
}

module.exports = CaliforniaSOS;