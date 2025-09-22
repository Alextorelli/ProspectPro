/**
 * Dynamic API Validation Router
 * Routes businesses to relevant validation APIs based on geography, industry, and entity type
 * Eliminates unnecessary API calls to improve performance and reduce costs
 */

class ValidationRouter {
  constructor() {
    this.routingRules = {
      geography: {
        CA: ["californiaSOS"],
        California: ["californiaSOS"],
        NY: ["newYorkSOS", "nyTaxParcels"],
        "New York": ["newYorkSOS", "nyTaxParcels"],
        CT: ["newYorkSOS"], // Connecticut uses similar Socrata system
        UK: ["companiesHouseUK"],
        "United Kingdom": ["companiesHouseUK"],
      },

      industry: {
        nonprofit: ["proPublica"],
        foundation: ["proPublica"],
        charity: ["proPublica"],
        "public company": ["secEdgar"],
        corporation: ["secEdgar"],
        inc: ["secEdgar", "californiaSOS", "newYorkSOS"],
        corp: ["secEdgar", "californiaSOS", "newYorkSOS"],
        llc: ["californiaSOS", "newYorkSOS"],
      },

      entityType: {
        "small business": ["californiaSOS", "newYorkSOS"],
        wellness: [], // Skip government registries for small wellness businesses
        spa: [],
        "massage therapy": [],
        "fitness center": [],
        "yoga studio": [],
      },
    };
  }

  /**
   * Determine which validation APIs to use for a business
   * @param {Object} business - Business data
   * @param {Object} searchParams - Search parameters for context
   * @returns {Array} - Array of validator names to use
   */
  getValidatorsForBusiness(business, searchParams = {}) {
    const validators = new Set();

    // Geographic routing
    const location = this.extractLocation(business, searchParams);
    if (location) {
      const geoValidators = this.getValidatorsByGeography(location);
      geoValidators.forEach((v) => validators.add(v));
    }

    // Industry/entity type routing
    const entityType = this.determineEntityType(business, searchParams);
    const industryValidators = this.getValidatorsByIndustry(
      entityType,
      business.name
    );
    industryValidators.forEach((v) => validators.add(v));

    // Skip registries for small wellness businesses unless specific signals
    if (this.isSmallWellnessBusiness(business, searchParams)) {
      return []; // Skip government registries
    }

    return Array.from(validators);
  }

  /**
   * Extract location information from business and search context
   */
  extractLocation(business, searchParams) {
    const sources = [
      business.address,
      business.state,
      business.location,
      searchParams.location,
      searchParams.region,
    ];

    for (const source of sources) {
      if (source && typeof source === "string") {
        // Check for state abbreviations and full names
        for (const [location, validators] of Object.entries(
          this.routingRules.geography
        )) {
          if (source.toLowerCase().includes(location.toLowerCase())) {
            return location;
          }
        }
      }
    }

    return null;
  }

  /**
   * Get validators based on geographic location
   */
  getValidatorsByGeography(location) {
    return this.routingRules.geography[location] || [];
  }

  /**
   * Get validators based on industry/entity type
   */
  getValidatorsByIndustry(entityType, businessName = "") {
    const validators = new Set();
    const nameWords = businessName.toLowerCase().split(/\s+/);

    // Check entity type keywords
    for (const [keyword, validatorList] of Object.entries(
      this.routingRules.industry
    )) {
      if (
        entityType.toLowerCase().includes(keyword) ||
        nameWords.some((word) => word.includes(keyword))
      ) {
        validatorList.forEach((v) => validators.add(v));
      }
    }

    return Array.from(validators);
  }

  /**
   * Determine entity type from business data and search context
   */
  determineEntityType(business, searchParams) {
    const sources = [
      business.category,
      business.businessType,
      business.industry,
      searchParams.businessType,
      searchParams.industry,
    ];

    return sources
      .filter((s) => s && typeof s === "string")
      .join(" ")
      .toLowerCase();
  }

  /**
   * Check if this is a small wellness business that should skip registries
   */
  isSmallWellnessBusiness(business, searchParams) {
    const wellnessKeywords = [
      "wellness",
      "spa",
      "massage",
      "fitness",
      "yoga",
      "acupuncture",
      "therapy",
    ];
    const entityType = this.determineEntityType(business, searchParams);
    const businessName = (business.name || "").toLowerCase();

    const isWellness = wellnessKeywords.some(
      (keyword) =>
        entityType.includes(keyword) || businessName.includes(keyword)
    );

    // Skip registries for wellness businesses unless they have corporate signals
    const hasCorporateSignals =
      businessName.includes("inc") ||
      businessName.includes("corp") ||
      businessName.includes("llc") ||
      businessName.includes("foundation");

    return isWellness && !hasCorporateSignals;
  }

  /**
   * Get routing summary for debugging
   */
  getRoutingSummary(business, searchParams) {
    const validators = this.getValidatorsForBusiness(business, searchParams);
    const location = this.extractLocation(business, searchParams);
    const entityType = this.determineEntityType(business, searchParams);
    const isWellness = this.isSmallWellnessBusiness(business, searchParams);

    return {
      businessName: business.name,
      location,
      entityType,
      isSmallWellnessBusiness: isWellness,
      selectedValidators: validators,
      skippedValidators: [
        "californiaSOS",
        "newYorkSOS",
        "proPublica",
        "secEdgar",
        "companiesHouseUK",
      ].filter((v) => !validators.includes(v)),
    };
  }
}

module.exports = ValidationRouter;
