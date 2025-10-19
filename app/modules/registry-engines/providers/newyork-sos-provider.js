/**
 * New York SOS Registry Provider
 */

const NewYorkSOS = require("../../api-clients/newyork-sos-client");

class NewYorkSOSProvider {
  constructor(apiKey = null) {
    this.client = new NewYorkSOS(apiKey);
    this.name = "New York SOS";
  }

  /**
   * Check if this provider is relevant for the business
   */
  isRelevant(business, searchParams = {}) {
    // Check if business is in New York or Connecticut (NY SOS covers both)
    const state = business.state || searchParams.state || "";
    const address = business.address || "";

    return (
      state.toLowerCase().includes("ny") ||
      state.toLowerCase().includes("new york") ||
      state.toLowerCase().includes("ct") ||
      state.toLowerCase().includes("connecticut") ||
      address.toLowerCase().includes(", ny") ||
      address.toLowerCase().includes(", ct") ||
      address.toLowerCase().includes("new york") ||
      address.toLowerCase().includes("connecticut")
    );
  }

  /**
   * Validate business through New York SOS
   */
  async validate(business, searchParams = {}) {
    const businessName = business.name || business.businessName || "";

    if (!businessName) {
      return { error: "No business name provided", source: "newyork_sos" };
    }

    try {
      const result = await this.client.searchBusiness(businessName);

      return {
        source: "newyork_sos",
        found: result && result.length > 0,
        results: result || [],
        entityType: result?.[0]?.entity_type || null,
        status: result?.[0]?.status || null,
        registrationDate: result?.[0]?.filing_date || null,
        confidence: this.calculateConfidence(result, businessName),
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        source: "newyork_sos",
        error: error.message,
        found: false,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Calculate confidence score based on name matching
   */
  calculateConfidence(results, targetName) {
    if (!results || results.length === 0) return 0;

    const normalizedTarget = targetName
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .trim();
    let bestMatch = 0;

    results.forEach((result) => {
      const resultName = (result.entity_name || result.name || "")
        .toLowerCase()
        .replace(/[^\w\s]/g, "")
        .trim();
      const similarity = this.stringSimilarity(normalizedTarget, resultName);
      bestMatch = Math.max(bestMatch, similarity);
    });

    return Math.round(bestMatch * 100);
  }

  /**
   * Calculate string similarity
   */
  stringSimilarity(str1, str2) {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1.0;

    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  /**
   * Calculate Levenshtein distance
   */
  levenshteinDistance(str1, str2) {
    const matrix = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }
}

module.exports = NewYorkSOSProvider;
