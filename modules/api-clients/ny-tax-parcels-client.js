/**
 * NY Tax Parcels API Client
 * GIS REST API for property intelligence and asset verification
 */

class NYTaxParcels {
  constructor() {
    this.baseURL = 'https://gis.ny.gov/gisdata/rest/services/NYS_Civil_Boundaries_SDE/NYS_Tax_Parcels/MapServer/0/query';
    this.requestCount = 0;
    this.rateLimitDelay = 200; // Conservative rate limiting
  }

  /**
   * Get property information for address validation
   * @param {string} address - Business address to verify
   * @returns {Promise<Object>} Property ownership and assessment data
   */
  async getPropertyData(address) {
    try {
      await this.respectRateLimit();
      
      // Query parameters for GIS REST API
      const params = new URLSearchParams({
        where: `PROP_ADDR LIKE '%${address.replace(/'/g, "''")}%'`,
        outFields: 'PROP_ADDR,OWNER_NAME,PROP_CLASS,TOTAL_AV,LAND_AV',
        f: 'json',
        resultRecordCount: 5
      });

      const response = await fetch(`${this.baseURL}?${params}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'ProspectPro-PropertyValidation/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`NY Tax Parcels API error: ${response.status}`);
      }

      const data = await response.json();
      this.requestCount++;
      
      const property = data.features?.[0]?.attributes;

      return {
        found: !!property,
        propertyAddress: property?.PROP_ADDR || null,
        ownerName: property?.OWNER_NAME || null,
        propertyClass: property?.PROP_CLASS || null,
        assessedValue: property?.TOTAL_AV || null,
        landValue: property?.LAND_AV || null,
        confidence: property ? 75 : 0,
        source: 'NY State Tax Parcels',
        isCommercial: this.isCommercialProperty(property?.PROP_CLASS)
      };

    } catch (error) {
      console.warn('NY Tax Parcels API request failed:', error.message);
      return {
        found: false,
        error: error.message,
        confidence: 0,
        source: 'NY State Tax Parcels'
      };
    }
  }

  /**
   * Determine if property class indicates commercial use
   * @param {string} propertyClass - NY property classification code
   */
  isCommercialProperty(propertyClass) {
    if (!propertyClass) return false;
    
    const commercialCodes = ['400', '401', '402', '411', '412', '414', '415', '416', '417'];
    return commercialCodes.some(code => propertyClass.startsWith(code));
  }

  /**
   * Rate limiting for GIS API
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
      estimatedCost: 0, // Free GIS API
      source: 'NY Tax Parcels'
    };
  }
}

module.exports = NYTaxParcels;