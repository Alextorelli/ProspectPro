/**
 * Companies House UK Provider for UK Business Validation
 * Placeholder implementation for UK business registry validation
 */

class CompaniesHouseUKProvider {
  constructor(apiKey = null) {
    this.apiKey = apiKey;
    this.name = "Companies House UK";
  }

  /**
   * Check if this provider is relevant for the business
   * Looks for UK-based businesses or international companies with UK presence
   */
  isRelevant(business, searchParams = {}) {
    const businessName = business.name || business.businessName || "";
    const address = business.address || "";
    const state = business.state || "";
    const country = business.country || "";

    // Check for UK geographic indicators
    const ukIndicators = [
      "uk",
      "united kingdom",
      "england",
      "scotland",
      "wales",
      "northern ireland",
      "london",
      "manchester",
      "birmingham",
      "leeds",
      "glasgow",
      "liverpool",
      "bristol",
      "sheffield",
      "edinburgh",
      "leicester",
      "coventry",
      "cardiff",
    ];

    // Check for UK business structure indicators
    const ukBusinessIndicators = [
      "ltd",
      "limited",
      "plc",
      "llp",
      "cic",
      "community interest company",
    ];

    const textToCheck =
      `${businessName} ${address} ${state} ${country}`.toLowerCase();

    const hasUKGeography = ukIndicators.some((indicator) =>
      textToCheck.includes(indicator)
    );
    const hasUKBusinessStructure = ukBusinessIndicators.some((indicator) =>
      textToCheck.includes(indicator)
    );

    return hasUKGeography || hasUKBusinessStructure;
  }

  /**
   * Validate business through Companies House UK registry
   * Currently returns a placeholder response
   */
  async validate(business, searchParams = {}) {
    const businessName = business.name || business.businessName || "";

    if (!businessName) {
      return {
        error: "No business name provided",
        source: "companies-house-uk",
      };
    }

    // Placeholder implementation
    return {
      source: "companies-house-uk",
      found: false,
      results: [],
      companyNumber: null,
      companyType: null,
      status: null,
      confidence: 0,
      placeholder: true,
      message: "Companies House UK validation not yet implemented",
      timestamp: new Date().toISOString(),
    };
  }
}

module.exports = CompaniesHouseUKProvider;
