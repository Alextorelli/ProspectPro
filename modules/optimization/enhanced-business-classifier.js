/**
 * Enhanced Business Classifier v2.0
 * Intelligent business type detection with confidence scoring
 * Optimizes API routing and reduces irrelevant calls
 */

class EnhancedBusinessClassifier {
  constructor() {
    // Business classification patterns with confidence weights
    this.businessPatterns = {
      spa: {
        keywords: ['spa', 'wellness', 'massage', 'facial', 'relaxation', 'therapeutic', 'healing', 'retreat'],
        negativeKeywords: ['car spa', 'pet spa', 'auto spa'],
        industryTypes: ['health', 'beauty', 'wellness'],
        confidenceWeight: 0.9,
        relevantAPIs: ['spaAssociation', 'chamber'],
        geographicRelevance: 'local' // Local chamber relevance
      },
      beauty: {
        keywords: ['beauty', 'salon', 'hair', 'nail', 'cosmetic', 'barbershop', 'stylist', 'lashes'],
        negativeKeywords: ['beauty supply', 'beauty wholesale'],
        industryTypes: ['beauty', 'personal care'],
        confidenceWeight: 0.85,
        relevantAPIs: ['beautyAssociation', 'chamber'],
        geographicRelevance: 'local'
      },
      accounting: {
        keywords: ['accounting', 'cpa', 'tax', 'bookkeeping', 'financial', 'audit', 'payroll'],
        negativeKeywords: ['account manager', 'account executive'],
        industryTypes: ['financial', 'professional services'],
        confidenceWeight: 0.95,
        relevantAPIs: ['cpaLicensing', 'chamber'],
        geographicRelevance: 'state' // State-level licensing
      },
      professional: {
        keywords: ['law', 'legal', 'attorney', 'consulting', 'architect', 'engineer', 'medical', 'dental'],
        negativeKeywords: ['legal aid', 'legal clinic'],
        industryTypes: ['professional services', 'healthcare'],
        confidenceWeight: 0.8,
        relevantAPIs: ['chamber', 'apollo'],
        geographicRelevance: 'state'
      },
      retail: {
        keywords: ['store', 'shop', 'retail', 'boutique', 'market', 'outlet'],
        negativeKeywords: ['online store', 'e-commerce'],
        industryTypes: ['retail', 'commerce'],
        confidenceWeight: 0.7,
        relevantAPIs: ['chamber', 'apollo'],
        geographicRelevance: 'local'
      },
      restaurant: {
        keywords: ['restaurant', 'cafe', 'diner', 'bistro', 'eatery', 'food', 'kitchen', 'grill'],
        negativeKeywords: ['food truck', 'catering'],
        industryTypes: ['food service', 'hospitality'],
        confidenceWeight: 0.75,
        relevantAPIs: ['chamber'],
        geographicRelevance: 'local'
      }
    };
    
    this.classificationCache = new Map();
    this.stats = {
      classifications: 0,
      cacheHits: 0,
      apiCallsSaved: 0
    };
  }

  /**
   * Classify business with confidence scoring and API recommendations
   * @param {Object} business - Business data to classify
   * @returns {Object} Classification results with API routing recommendations
   */
  classifyBusiness(business) {
    const businessText = this.extractBusinessText(business);
    const cacheKey = this.generateCacheKey(business);
    
    // Check cache first
    if (this.classificationCache.has(cacheKey)) {
      this.stats.cacheHits++;
      return this.classificationCache.get(cacheKey);
    }
    
    const classification = this.performClassification(businessText, business);
    
    // Cache the result
    this.classificationCache.set(cacheKey, classification);
    this.stats.classifications++;
    
    return classification;
  }

  /**
   * Extract relevant text for classification
   * @private
   */
  extractBusinessText(business) {
    const name = (business.businessName || business.name || '').toLowerCase();
    const address = (business.address || '').toLowerCase();
    const description = (business.description || '').toLowerCase();
    
    return {
      name,
      address,
      description,
      fullText: `${name} ${address} ${description}`.trim()
    };
  }

  /**
   * Generate cache key for business
   * @private
   */
  generateCacheKey(business) {
    const name = business.businessName || business.name || '';
    const address = business.address || '';
    return `${name}_${address}`.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
  }

  /**
   * Perform actual business classification
   * @private
   */
  performClassification(businessText, business) {
    const scores = {};
    let bestMatch = null;
    let highestScore = 0;
    
    // Score against each business type
    for (const [type, pattern] of Object.entries(this.businessPatterns)) {
      const score = this.calculateTypeScore(businessText, pattern);
      scores[type] = score;
      
      if (score > highestScore) {
        highestScore = score;
        bestMatch = type;
      }
    }
    
    // Determine classification confidence
    const confidence = this.calculateConfidence(scores, highestScore);
    
    // Generate API routing recommendations
    const apiRecommendations = this.generateAPIRecommendations(
      bestMatch, 
      confidence, 
      business,
      scores
    );
    
    return {
      primaryType: bestMatch,
      confidence,
      scores,
      apiRecommendations,
      geographicScope: bestMatch ? this.businessPatterns[bestMatch].geographicRelevance : 'local',
      processingStrategy: this.determineProcessingStrategy(confidence, apiRecommendations)
    };
  }

  /**
   * Calculate type score for business text against pattern
   * @private
   */
  calculateTypeScore(businessText, pattern) {
    let score = 0;
    const maxScore = 100;
    
    // Positive keyword matching
    const positiveMatches = pattern.keywords.filter(keyword => 
      businessText.fullText.includes(keyword)
    ).length;
    score += (positiveMatches / pattern.keywords.length) * 60;
    
    // Negative keyword penalty
    const negativeMatches = pattern.negativeKeywords.filter(keyword => 
      businessText.fullText.includes(keyword)
    ).length;
    score -= negativeMatches * 20;
    
    // Business name relevance (higher weight)
    const nameMatches = pattern.keywords.filter(keyword => 
      businessText.name.includes(keyword)
    ).length;
    score += (nameMatches / pattern.keywords.length) * 30;
    
    // Apply confidence weight
    score *= pattern.confidenceWeight;
    
    return Math.max(0, Math.min(maxScore, score));
  }

  /**
   * Calculate overall classification confidence
   * @private
   */
  calculateConfidence(scores, highestScore) {
    const scoresArray = Object.values(scores);
    const secondHighest = scoresArray.sort((a, b) => b - a)[1] || 0;
    
    // High confidence if clear winner
    if (highestScore > 70 && (highestScore - secondHighest) > 20) {
      return 'high';
    }
    
    // Medium confidence if moderate score
    if (highestScore > 40) {
      return 'medium';
    }
    
    // Low confidence for unclear classifications
    return 'low';
  }

  /**
   * Generate smart API routing recommendations
   * @private
   */
  generateAPIRecommendations(primaryType, confidence, business, scores) {
    const recommendations = {
      highPriority: [], // Definitely call these APIs
      mediumPriority: [], // Call if budget allows
      lowPriority: [], // Skip unless specifically requested
      skipAPIs: [] // Don't call these APIs
    };
    
    if (!primaryType || confidence === 'low') {
      // For unclear classifications, only use chamber (always relevant)
      recommendations.mediumPriority.push('chamber');
      recommendations.skipAPIs.push('spaAssociation', 'beautyAssociation', 'cpaLicensing');
      return recommendations;
    }
    
    const pattern = this.businessPatterns[primaryType];
    
    // High confidence - use all relevant APIs
    if (confidence === 'high') {
      recommendations.highPriority = [...pattern.relevantAPIs];
      
      // Add Apollo for professional services
      if (['accounting', 'professional'].includes(primaryType) && business.website) {
        recommendations.highPriority.push('apollo');
      }
    }
    
    // Medium confidence - be more selective
    if (confidence === 'medium') {
      recommendations.mediumPriority = [...pattern.relevantAPIs];
      
      // Only add Apollo for high-value professional services
      if (primaryType === 'accounting' && business.website) {
        recommendations.mediumPriority.push('apollo');
      }
    }
    
    // Always consider chamber verification for established businesses
    if (!recommendations.highPriority.includes('chamber') && 
        !recommendations.mediumPriority.includes('chamber')) {
      recommendations.mediumPriority.push('chamber');
    }
    
    // Skip irrelevant APIs
    const allAPIs = ['spaAssociation', 'beautyAssociation', 'cpaLicensing', 'apollo', 'chamber'];
    const relevantAPIs = [...recommendations.highPriority, ...recommendations.mediumPriority];
    recommendations.skipAPIs = allAPIs.filter(api => !relevantAPIs.includes(api));
    
    return recommendations;
  }

  /**
   * Determine optimal processing strategy
   * @private
   */
  determineProcessingStrategy(confidence, apiRecommendations) {
    const totalAPIs = apiRecommendations.highPriority.length + apiRecommendations.mediumPriority.length;
    
    if (totalAPIs <= 2) {
      return 'parallel'; // Fast parallel processing
    }
    
    if (confidence === 'high' && totalAPIs <= 4) {
      return 'parallel'; // High confidence, parallel worth it
    }
    
    return 'sequential'; // Conservative sequential processing
  }

  /**
   * Get geographic filtering recommendations
   */
  getGeographicFilter(business, primaryType) {
    if (!primaryType) return { scope: 'local', filterByState: false };
    
    const pattern = this.businessPatterns[primaryType];
    const businessLocation = this.extractLocation(business);
    
    return {
      scope: pattern.geographicRelevance,
      filterByState: pattern.geographicRelevance === 'state',
      state: businessLocation.state,
      city: businessLocation.city,
      relevantForLicensing: ['accounting', 'professional'].includes(primaryType)
    };
  }

  /**
   * Extract location information from business
   * @private
   */
  extractLocation(business) {
    const address = business.address || '';
    
    // Simple state extraction (could be enhanced with geocoding)
    const stateMatch = address.match(/\b([A-Z]{2})\b/);
    const state = stateMatch ? stateMatch[1] : null;
    
    // Simple city extraction
    const cityMatch = address.match(/,\s*([^,]+),\s*[A-Z]{2}/);
    const city = cityMatch ? cityMatch[1].trim() : null;
    
    return { state, city };
  }

  /**
   * Estimate API call savings from classification
   */
  estimateAPISavings(businesses) {
    let totalSavings = 0;
    
    businesses.forEach(business => {
      const classification = this.classifyBusiness(business);
      const skippedAPIs = classification.apiRecommendations.skipAPIs.length;
      totalSavings += skippedAPIs;
    });
    
    this.stats.apiCallsSaved += totalSavings;
    return totalSavings;
  }

  /**
   * Get performance statistics
   */
  getStats() {
    return {
      ...this.stats,
      cacheHitRate: this.stats.cacheHits / Math.max(1, this.stats.classifications),
      apiSavingsRate: this.stats.apiCallsSaved / Math.max(1, this.stats.classifications * 4) // 4 potential APIs per business
    };
  }

  /**
   * Reset statistics
   */
  reset() {
    this.stats = {
      classifications: 0,
      cacheHits: 0,
      apiCallsSaved: 0
    };
    this.classificationCache.clear();
  }
}

module.exports = EnhancedBusinessClassifier;