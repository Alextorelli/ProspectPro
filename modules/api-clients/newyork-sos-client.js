/**
 * New York State Business Registry API Client
 * Uses Socrata Open Data API - free access
 */

class NewYorkSOS {
  constructor() {
    this.baseURL = 'https://data.ny.gov/resource/n9v6-gdp6.json';
    this.requestCount = 0;
    this.rateLimitDelay = 150; // Be respectful to free API
  }

  /**
   * Search for business entity in NY state records
   * @param {string} businessName - Business name to search
   * @returns {Promise<Object>} Business registration data
   */
  async searchBusiness(businessName) {
    try {
      await this.respectRateLimit();
      
      // Use Socrata API's $where clause for flexible name matching
      const query = `$where=upper(entity_name) like upper('%${businessName.replace(/'/g, "''")}%')&$limit=5`;
      const response = await fetch(`${this.baseURL}?${query}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'ProspectPro-LeadValidation/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`New York SOS API error: ${response.status}`);
      }

      const data = await response.json();
      this.requestCount++;
      
      const match = data.find(entity => 
        entity.entity_name?.toLowerCase().includes(businessName.toLowerCase())
      );

      return {
        found: !!match,
        entityName: match?.entity_name || null,
        entityType: match?.entity_type || null,
        county: match?.county || null,
        incorporationDate: match?.incorporation_date || null,
        status: match?.current_entity_status || 'Not Found',
        confidence: match ? 80 : 0,
        source: 'New York Secretary of State'
      };

    } catch (error) {
      console.warn('New York SOS API request failed:', error.message);
      return {
        found: false,
        error: error.message,
        confidence: 0,
        source: 'New York Secretary of State'
      };
    }
  }

  /**
   * Rate limiting for respectful API usage
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
      source: 'New York SOS'
    };
  }
}

module.exports = NewYorkSOS;