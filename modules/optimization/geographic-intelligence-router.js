/**
 * Geographic Intelligence Router v1.0
 * Optimizes API calls based on geographic relevance and business location
 * Prevents irrelevant API calls and reduces costs
 */

class GeographicIntelligenceRouter {
  constructor() {
    // State-specific professional licensing authorities
    this.professionalLicensingStates = {
      'CA': { cpa: true, medical: true, legal: true, engineering: true },
      'NY': { cpa: true, medical: true, legal: true, engineering: true },
      'TX': { cpa: true, medical: true, legal: true, engineering: true },
      'FL': { cpa: true, medical: true, legal: true, engineering: true },
      'IL': { cpa: true, medical: true, legal: true, engineering: true },
      // Add more states as needed
    };
    
    // Regional chamber of commerce networks
    this.chamberNetworks = {
      'metropolitan': ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose'],
      'state_capitals': ['Sacramento', 'Albany', 'Austin', 'Tallahassee', 'Springfield'],
      'major_cities': ['Boston', 'Seattle', 'Denver', 'Atlanta', 'Miami', 'Las Vegas', 'Portland', 'Nashville']
    };
    
    // Trade association geographic coverage
    this.tradeAssociationCoverage = {
      spaIndustry: {
        strongPresence: ['CA', 'NY', 'FL', 'TX', 'WA', 'CO'],
        moderatePresence: ['IL', 'MA', 'AZ', 'NC', 'GA'],
        limitedPresence: ['WY', 'ND', 'SD', 'MT', 'DE']
      },
      beautyIndustry: {
        strongPresence: ['CA', 'NY', 'FL', 'TX', 'IL', 'OH'],
        moderatePresence: ['WA', 'OR', 'AZ', 'NC', 'GA', 'VA'],
        limitedPresence: ['VT', 'NH', 'ME', 'WV', 'MS']
      }
    };
    
    // Apollo organizational data coverage (urbanization-based)
    this.apolloCoverage = {
      highCoverage: ['major_metropolitan', 'tech_hubs', 'financial_centers'],
      mediumCoverage: ['state_capitals', 'university_towns', 'industrial_centers'],
      lowCoverage: ['rural_areas', 'small_towns']
    };
    
    this.stats = {
      geographicFiltering: 0,
      stateBasedFiltering: 0,
      urbanizationFiltering: 0,
      apiCallsSaved: 0
    };
  }

  /**
   * Analyze business location and provide geographic intelligence for API routing
   * @param {Object} business - Business object with address information
   * @returns {Object} Geographic intelligence data
   */
  analyzeBusinessLocation(business) {
    const locationData = this.extractLocationData(business);
    const geographicContext = this.buildGeographicContext(locationData);
    const apiRelevance = this.assessAPIRelevance(locationData, geographicContext);
    
    return {
      locationData,
      geographicContext,
      apiRelevance,
      filteringRecommendations: this.generateFilteringRecommendations(apiRelevance)
    };
  }

  /**
   * Extract detailed location information from business address
   * @private
   */
  extractLocationData(business) {
    const address = business.address || '';
    
    // Extract state (2-letter code)
    const stateMatch = address.match(/\b([A-Z]{2})\b/);
    const state = stateMatch ? stateMatch[1] : null;
    
    // Extract city (before state)
    const cityMatch = address.match(/,\s*([^,]+),\s*[A-Z]{2}/);
    const city = cityMatch ? cityMatch[1].trim() : null;
    
    // Extract ZIP code
    const zipMatch = address.match(/\b(\d{5}(?:-\d{4})?)\b/);
    const zipCode = zipMatch ? zipMatch[1] : null;
    
    // Determine urbanization level
    const urbanizationLevel = this.determineUrbanizationLevel(city, zipCode);
    
    // Geographic region
    const region = this.determineRegion(state);
    
    return {
      state,
      city,
      zipCode,
      urbanizationLevel,
      region,
      fullAddress: address
    };
  }

  /**
   * Build comprehensive geographic context
   * @private
   */
  buildGeographicContext(locationData) {
    const { state, city, urbanizationLevel } = locationData;
    
    return {
      hasStateLicensing: this.professionalLicensingStates[state] || null,
      chamberNetworkLevel: this.determineChamberNetworkLevel(city),
      tradeAssociationPresence: this.assessTradeAssociationPresence(state),
      apolloCoverageLevel: this.assessApolloCoverage(urbanizationLevel),
      economicContext: this.assessEconomicContext(locationData),
      businessDensity: this.estimateBusinessDensity(locationData)
    };
  }

  /**
   * Assess API relevance based on geographic factors
   * @private
   */
  assessAPIRelevance(locationData, geographicContext) {
    const relevance = {
      professionalLicensing: this.assessProfessionalLicensingRelevance(locationData, geographicContext),
      chamberVerification: this.assessChamberRelevance(locationData, geographicContext),
      tradeAssociations: this.assessTradeAssociationRelevance(locationData, geographicContext),
      apolloEnrichment: this.assessApolloRelevance(locationData, geographicContext)
    };
    
    return relevance;
  }

  /**
   * Assess professional licensing API relevance
   * @private
   */
  assessProfessionalLicensingRelevance(locationData, geographicContext) {
    const { state } = locationData;
    const { hasStateLicensing } = geographicContext;
    
    if (!state || !hasStateLicensing) {
      return {
        relevant: false,
        confidence: 0,
        reason: 'No state licensing authority data available'
      };
    }
    
    return {
      relevant: true,
      confidence: 0.9,
      state,
      licensingTypes: hasStateLicensing,
      reason: 'State has comprehensive professional licensing'
    };
  }

  /**
   * Assess chamber of commerce API relevance
   * @private
   */
  assessChamberRelevance(locationData, geographicContext) {
    const { city } = locationData;
    const { chamberNetworkLevel, businessDensity } = geographicContext;
    
    let confidence = 0.5; // Base confidence for chamber membership
    
    if (chamberNetworkLevel === 'metropolitan') {
      confidence = 0.9;
    } else if (chamberNetworkLevel === 'major_cities') {
      confidence = 0.8;
    } else if (chamberNetworkLevel === 'state_capitals') {
      confidence = 0.7;
    }
    
    // Adjust for business density
    if (businessDensity === 'high') {
      confidence = Math.min(0.95, confidence + 0.1);
    } else if (businessDensity === 'low') {
      confidence = Math.max(0.2, confidence - 0.2);
    }
    
    return {
      relevant: confidence > 0.3,
      confidence,
      chamberNetworkLevel,
      reason: `${chamberNetworkLevel} area with ${businessDensity} business density`
    };
  }

  /**
   * Assess trade association API relevance
   * @private
   */
  assessTradeAssociationRelevance(locationData, geographicContext) {
    const { state } = locationData;
    const { tradeAssociationPresence } = geographicContext;
    
    const spaRelevance = this.calculateTradeAssociationRelevance(state, tradeAssociationPresence.spa);
    const beautyRelevance = this.calculateTradeAssociationRelevance(state, tradeAssociationPresence.beauty);
    
    return {
      spa: spaRelevance,
      beauty: beautyRelevance,
      overall: Math.max(spaRelevance.confidence, beautyRelevance.confidence)
    };
  }

  /**
   * Assess Apollo API relevance
   * @private
   */
  assessApolloRelevance(locationData, geographicContext) {
    const { urbanizationLevel } = locationData;
    const { apolloCoverageLevel, economicContext } = geographicContext;
    
    let confidence = 0.4; // Base confidence
    
    if (apolloCoverageLevel === 'high') {
      confidence = 0.9;
    } else if (apolloCoverageLevel === 'medium') {
      confidence = 0.6;
    } else {
      confidence = 0.3;
    }
    
    // Adjust for economic context
    if (economicContext.businessMaturity === 'high') {
      confidence = Math.min(0.95, confidence + 0.1);
    }
    
    return {
      relevant: confidence > 0.4,
      confidence,
      coverageLevel: apolloCoverageLevel,
      reason: `${apolloCoverageLevel} Apollo coverage in ${urbanizationLevel} area`
    };
  }

  /**
   * Generate API filtering recommendations
   * @private
   */
  generateFilteringRecommendations(apiRelevance) {
    const recommendations = {
      callAPIs: [],
      skipAPIs: [],
      conditionalAPIs: [],
      costOptimizations: []
    };
    
    // Professional Licensing
    if (apiRelevance.professionalLicensing.relevant) {
      recommendations.callAPIs.push({
        api: 'professionalLicensing',
        confidence: apiRelevance.professionalLicensing.confidence,
        state: apiRelevance.professionalLicensing.state
      });
    } else {
      recommendations.skipAPIs.push({
        api: 'professionalLicensing',
        reason: apiRelevance.professionalLicensing.reason
      });
      this.stats.apiCallsSaved++;
    }
    
    // Chamber Verification
    if (apiRelevance.chamberVerification.relevant) {
      if (apiRelevance.chamberVerification.confidence > 0.7) {
        recommendations.callAPIs.push({
          api: 'chamberVerification',
          confidence: apiRelevance.chamberVerification.confidence
        });
      } else {
        recommendations.conditionalAPIs.push({
          api: 'chamberVerification',
          condition: 'if_business_established',
          confidence: apiRelevance.chamberVerification.confidence
        });
      }
    } else {
      recommendations.skipAPIs.push({
        api: 'chamberVerification',
        reason: 'Low chamber network presence'
      });
      this.stats.apiCallsSaved++;
    }
    
    // Trade Associations
    if (apiRelevance.tradeAssociations.spa.relevant) {
      recommendations.callAPIs.push({
        api: 'spaAssociation',
        confidence: apiRelevance.tradeAssociations.spa.confidence
      });
    } else {
      recommendations.skipAPIs.push({
        api: 'spaAssociation',
        reason: 'Limited spa industry presence'
      });
    }
    
    if (apiRelevance.tradeAssociations.beauty.relevant) {
      recommendations.callAPIs.push({
        api: 'beautyAssociation',
        confidence: apiRelevance.tradeAssociations.beauty.confidence
      });
    } else {
      recommendations.skipAPIs.push({
        api: 'beautyAssociation',
        reason: 'Limited beauty industry presence'
      });
    }
    
    // Apollo Enrichment
    if (apiRelevance.apolloEnrichment.relevant) {
      if (apiRelevance.apolloEnrichment.confidence > 0.7) {
        recommendations.callAPIs.push({
          api: 'apolloEnrichment',
          confidence: apiRelevance.apolloEnrichment.confidence,
          costJustified: true
        });
      } else {
        recommendations.conditionalAPIs.push({
          api: 'apolloEnrichment',
          condition: 'if_high_value_business',
          confidence: apiRelevance.apolloEnrichment.confidence,
          cost: 1.0
        });
      }
    } else {
      recommendations.skipAPIs.push({
        api: 'apolloEnrichment',
        reason: 'Low Apollo coverage area'
      });
      recommendations.costOptimizations.push({
        type: 'apollo_skip',
        savings: 1.0,
        reason: 'Geographic coverage limitations'
      });
    }
    
    return recommendations;
  }

  /**
   * Helper methods for geographic analysis
   */
  
  determineUrbanizationLevel(city, zipCode) {
    if (!city) return 'unknown';
    
    const metropolitanAreas = this.chamberNetworks.metropolitan;
    const majorCities = this.chamberNetworks.major_cities;
    
    if (metropolitanAreas.some(metro => city.toLowerCase().includes(metro.toLowerCase()))) {
      return 'metropolitan';
    }
    
    if (majorCities.some(major => city.toLowerCase().includes(major.toLowerCase()))) {
      return 'major_city';
    }
    
    // Simple heuristic based on population indicators
    if (zipCode && this.isHighPopulationZip(zipCode)) {
      return 'suburban';
    }
    
    return 'small_town';
  }

  determineRegion(state) {
    const regions = {
      'west': ['CA', 'WA', 'OR', 'NV', 'AZ', 'UT', 'CO', 'WY', 'MT', 'ID'],
      'south': ['TX', 'FL', 'GA', 'NC', 'SC', 'VA', 'TN', 'KY', 'WV', 'AL', 'MS', 'LA', 'AR', 'OK'],
      'midwest': ['IL', 'IN', 'OH', 'MI', 'WI', 'MN', 'IA', 'MO', 'ND', 'SD', 'NE', 'KS'],
      'northeast': ['NY', 'PA', 'NJ', 'CT', 'RI', 'MA', 'VT', 'NH', 'ME']
    };
    
    for (const [region, states] of Object.entries(regions)) {
      if (states.includes(state)) return region;
    }
    
    return 'other';
  }

  determineChamberNetworkLevel(city) {
    if (!city) return 'unknown';
    
    const cityLower = city.toLowerCase();
    
    if (this.chamberNetworks.metropolitan.some(metro => cityLower.includes(metro.toLowerCase()))) {
      return 'metropolitan';
    }
    
    if (this.chamberNetworks.major_cities.some(major => cityLower.includes(major.toLowerCase()))) {
      return 'major_cities';
    }
    
    if (this.chamberNetworks.state_capitals.some(capital => cityLower.includes(capital.toLowerCase()))) {
      return 'state_capitals';
    }
    
    return 'local';
  }

  assessTradeAssociationPresence(state) {
    const spaPresence = this.getAssociationPresenceLevel(state, this.tradeAssociationCoverage.spaIndustry);
    const beautyPresence = this.getAssociationPresenceLevel(state, this.tradeAssociationCoverage.beautyIndustry);
    
    return {
      spa: spaPresence,
      beauty: beautyPresence
    };
  }

  getAssociationPresenceLevel(state, coverage) {
    if (coverage.strongPresence.includes(state)) {
      return { level: 'strong', confidence: 0.9 };
    } else if (coverage.moderatePresence.includes(state)) {
      return { level: 'moderate', confidence: 0.6 };
    } else if (coverage.limitedPresence.includes(state)) {
      return { level: 'limited', confidence: 0.3 };
    } else {
      return { level: 'unknown', confidence: 0.1 };
    }
  }

  calculateTradeAssociationRelevance(state, presence) {
    return {
      relevant: presence.confidence > 0.4,
      confidence: presence.confidence,
      presenceLevel: presence.level,
      reason: `${presence.level} association presence in ${state}`
    };
  }

  assessApolloCoverage(urbanizationLevel) {
    const coverageMap = {
      'metropolitan': 'high',
      'major_city': 'high',
      'suburban': 'medium',
      'small_town': 'low',
      'unknown': 'low'
    };
    
    return coverageMap[urbanizationLevel] || 'low';
  }

  assessEconomicContext(locationData) {
    const { urbanizationLevel, region } = locationData;
    
    // Simple heuristic for economic context
    let businessMaturity = 'medium';
    
    if (urbanizationLevel === 'metropolitan') {
      businessMaturity = 'high';
    } else if (urbanizationLevel === 'small_town') {
      businessMaturity = 'low';
    }
    
    return {
      businessMaturity,
      region
    };
  }

  estimateBusinessDensity(locationData) {
    const { urbanizationLevel } = locationData;
    
    const densityMap = {
      'metropolitan': 'high',
      'major_city': 'high',
      'suburban': 'medium',
      'small_town': 'low',
      'unknown': 'low'
    };
    
    return densityMap[urbanizationLevel] || 'low';
  }

  isHighPopulationZip(zipCode) {
    // Simple heuristic - could be enhanced with actual demographic data
    const firstDigit = parseInt(zipCode[0]);
    
    // ZIP codes starting with 0, 1, 2, 9 often indicate high-population areas
    return [0, 1, 2, 9].includes(firstDigit);
  }

  /**
   * Batch process multiple businesses for geographic optimization
   */
  batchAnalyzeBusinessLocations(businesses) {
    const analysisResults = businesses.map(business => ({
      business,
      geographicIntelligence: this.analyzeBusinessLocation(business)
    }));
    
    // Update statistics
    this.stats.geographicFiltering += businesses.length;
    
    return analysisResults;
  }

  /**
   * Get cost savings estimate from geographic filtering
   */
  estimateCostSavings(businesses) {
    let totalSavings = 0;
    
    businesses.forEach(business => {
      const intelligence = this.analyzeBusinessLocation(business);
      const skippedAPIs = intelligence.filteringRecommendations.skipAPIs;
      
      skippedAPIs.forEach(skipped => {
        if (skipped.api === 'apolloEnrichment') {
          totalSavings += 1.0; // Apollo cost savings
        }
        // Other APIs are free, but save processing time
      });
    });
    
    return {
      totalCostSavings: totalSavings,
      averageSavingsPerBusiness: totalSavings / businesses.length,
      apiCallsSaved: this.stats.apiCallsSaved
    };
  }

  /**
   * Get performance statistics
   */
  getStats() {
    return {
      ...this.stats,
      efficiency: {
        geographicFilteringRate: this.stats.geographicFiltering > 0 ? this.stats.apiCallsSaved / this.stats.geographicFiltering : 0,
        costOptimizationRate: this.stats.apiCallsSaved / Math.max(1, this.stats.geographicFiltering * 4) // 4 potential APIs
      }
    };
  }

  /**
   * Reset statistics
   */
  reset() {
    this.stats = {
      geographicFiltering: 0,
      stateBasedFiltering: 0,
      urbanizationFiltering: 0,
      apiCallsSaved: 0
    };
  }
}

module.exports = GeographicIntelligenceRouter;