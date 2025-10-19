/**
 * SEC Edgar Provider for Public Company Validation
 */

const SECEdgarClient = require("../../api-clients/api-sec-edgar-enhanced-client");

class SECEdgarProvider {
  constructor(userAgent = "ProspectPro Lead Discovery Tool") {
    this.client = new SECEdgarClient(userAgent);
    this.name = "SEC Edgar";
  }

  /**
   * Check if this provider is relevant for the business
   */
  isRelevant(business, searchParams = {}) {
    const businessName = business.name || business.businessName || "";
    const category = business.category || business.types?.join(" ") || "";
    const description = business.description || "";

    // Check for public company indicators
    const publicCompanyIndicators = [
      "corp",
      "corporation",
      "inc",
      "incorporated",
      "ltd",
      "limited",
      "llc",
      "company",
      "enterprises",
      "holdings",
      "group",
      "systems",
      "technologies",
      "solutions",
      "services",
      "international",
      "global",
    ];

    // Check for corporate/enterprise signals
    const corporateSignals = [
      "publicly traded",
      "stock",
      "nasdaq",
      "nyse",
      "shares",
      "ticker",
      "securities",
      "public company",
      "fortune",
      "enterprise",
      "headquarters",
    ];

    const textToCheck =
      `${businessName} ${category} ${description}`.toLowerCase();

    // Higher relevance for explicit corporate signals
    const hasCorporateSignals = corporateSignals.some((signal) =>
      textToCheck.includes(signal)
    );
    if (hasCorporateSignals) return true;

    // Secondary relevance for business structure indicators
    const hasBusinessIndicators = publicCompanyIndicators.some((indicator) =>
      textToCheck.includes(indicator)
    );

    // Additional check for business size indicators (large companies more likely to be public)
    const sizeIndicators = [
      "national",
      "international",
      "global",
      "nationwide",
      "chain",
    ];
    const hasSizeIndicators = sizeIndicators.some((indicator) =>
      textToCheck.includes(indicator)
    );

    return (
      hasBusinessIndicators && (hasSizeIndicators || businessName.length > 10)
    );
  }

  /**
   * Validate business through SEC Edgar database
   */
  async validate(business, searchParams = {}) {
    const businessName = business.name || business.businessName || "";

    if (!businessName) {
      return { error: "No business name provided", source: "sec-edgar" };
    }

    try {
      const result = await this.client.searchCompany(businessName);

      return {
        source: "sec-edgar",
        found: result && result.length > 0,
        results: result || [],
        cik: result?.[0]?.cik || null,
        ticker: result?.[0]?.ticker || null,
        title: result?.[0]?.title || null,
        sicDescription: result?.[0]?.sic_description || null,
        confidence: this.calculateConfidence(result, businessName),
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        source: "sec-edgar",
        error: error.message,
        found: false,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Calculate confidence score based on name matching and business signals
   */
  calculateConfidence(results, targetName) {
    if (!results || results.length === 0) return 0;

    const normalizedTarget = this.normalizeCompanyName(targetName);
    let bestMatch = 0;

    results.forEach((result) => {
      const resultName = this.normalizeCompanyName(
        result.title || result.name || ""
      );
      const similarity = this.companySimilarity(normalizedTarget, resultName);
      bestMatch = Math.max(bestMatch, similarity);
    });

    return Math.round(bestMatch * 100);
  }

  /**
   * Normalize company name for better matching
   */
  normalizeCompanyName(name) {
    return name
      .toLowerCase()
      .replace(
        /\b(corp|corporation|inc|incorporated|ltd|limited|llc|company|co)\b/g,
        ""
      )
      .replace(/[^\w\s]/g, "")
      .trim();
  }

  /**
   * Calculate company name similarity with corporate structure awareness
   */
  companySimilarity(str1, str2) {
    // Direct match gets highest score
    if (str1 === str2) return 1.0;

    // Check if one is a subset of the other (common in corporate naming)
    if (str1.includes(str2) || str2.includes(str1)) {
      const shorter = str1.length < str2.length ? str1 : str2;
      const longer = str1.length >= str2.length ? str1 : str2;
      return (shorter.length / longer.length) * 0.9; // Slightly penalize partial matches
    }

    // Fallback to Levenshtein distance
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

module.exports = SECEdgarProvider;
