/**
 * ProPublica Nonprofit Registry Provider
 */

const ProPublicaClient = require("../../api-clients/propublica-nonprofit-client");

class ProPublicaProvider {
  constructor(apiKey = null) {
    this.client = new ProPublicaClient(apiKey);
    this.name = "ProPublica";
  }

  /**
   * Check if this provider is relevant for the business
   */
  isRelevant(business, searchParams = {}) {
    const businessName = business.name || business.businessName || "";
    const category = business.category || business.types?.join(" ") || "";
    const description = business.description || "";

    // Check for nonprofit indicators
    const nonprofitIndicators = [
      "foundation",
      "nonprofit",
      "non-profit",
      "charity",
      "charitable",
      "association",
      "society",
      "institute",
      "center",
      "council",
      "organization",
      "trust",
      "fund",
      "relief",
      "aid",
      "support",
      "community",
      "education",
      "research",
      "religious",
      "church",
    ];

    const textToCheck =
      `${businessName} ${category} ${description}`.toLowerCase();

    return nonprofitIndicators.some((indicator) =>
      textToCheck.includes(indicator)
    );
  }

  /**
   * Validate business through ProPublica nonprofit registry
   */
  async validate(business, searchParams = {}) {
    const businessName = business.name || business.businessName || "";

    if (!businessName) {
      return { error: "No business name provided", source: "propublica" };
    }

    try {
      const result = await this.client.searchNonprofit(businessName);

      return {
        source: "propublica",
        found: result && result.length > 0,
        results: result || [],
        ein: result?.[0]?.ein || null,
        classification: result?.[0]?.ntee_classification || null,
        city: result?.[0]?.city || null,
        state: result?.[0]?.state || null,
        confidence: this.calculateConfidence(result, businessName),
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        source: "propublica",
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
      const resultName = (result.name || result.organization_name || "")
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

module.exports = ProPublicaProvider;
