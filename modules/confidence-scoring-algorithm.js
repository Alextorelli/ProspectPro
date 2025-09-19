/**
 * Enhanced Confidence Scoring Algorithm
 * 
 * Comprehensive confidence scoring system that incorporates:
 * - Base business data quality scores
 * - Government API validation results (Phase 1)
 * - Multi-source verification bonuses
 * - Sector-specific scoring adjustments
 * - Risk factor penalties
 * 
 * Phase 1 Government APIs Integration:
 * - California SOS (75% weight, +20 max boost)
 * - SEC EDGAR (65% weight, +25 max boost)
 * - ProPublica Nonprofit (60% weight, +15 max boost)
 * - Companies House UK (70% weight, +20 max boost)
 * 
 * ProspectPro - Zero Fake Data Policy
 */

class EnhancedConfidenceScoring {
  constructor() {
    // Base component weights (total = 100%)
    this.componentWeights = {
      businessName: 0.20,      // 20%
      address: 0.15,           // 15%
      phone: 0.15,             // 15%
      website: 0.15,           // 15%
      email: 0.10,             // 10%
      registration: 0.25       // 25% - highest weight for official registration
    };

    // Government API confidence weights and max boosts
    this.governmentAPIs = {
      californiaSOS: { weight: 0.75, maxBoost: 20, priority: 'HIGH' },
      secEDGAR: { weight: 0.65, maxBoost: 25, priority: 'HIGH' },
      nonprofit: { weight: 0.60, maxBoost: 15, priority: 'MEDIUM' },
      companiesHouseUK: { weight: 0.70, maxBoost: 20, priority: 'MEDIUM' }
    };

    // Multi-source verification bonuses
    this.multiSourceBonuses = {
      twoSources: 10,
      threeSources: 18,
      fourSources: 25,
      allSources: 30
    };

    // Sector-specific scoring adjustments
    this.sectorAdjustments = {
      'Public Company': { multiplier: 1.15, bonus: 15, description: 'SEC registered companies have enhanced credibility' },
      'Nonprofit': { multiplier: 1.10, bonus: 12, description: 'IRS registered nonprofits have good credibility' },
      'UK Company': { multiplier: 1.08, bonus: 10, description: 'Companies House registered businesses have good credibility' },
      'State Registered Business': { multiplier: 1.05, bonus: 8, description: 'State registered businesses have basic credibility' },
      'Unknown': { multiplier: 1.00, bonus: 0, description: 'No sector classification available' }
    };

    // Risk factor penalties
    this.riskPenalties = {
      'High': 15,
      'Very High': 25,
      'Extreme': 40
    };

    // Quality thresholds
    this.qualityThresholds = {
      excellent: 90,    // Top-tier leads
      high: 80,         // High-quality leads
      good: 70,         // Good quality leads
      acceptable: 60,   // Minimum acceptable quality
      poor: 40,         // Below acceptable quality
      veryPoor: 20      // Very poor quality
    };

    console.log('📊 Enhanced Confidence Scoring Algorithm initialized');
  }

  /**
   * Calculate comprehensive confidence score for a business
   * @param {Object} businessData - Complete business data with all validation results
   * @returns {Object} Complete scoring breakdown and final confidence score
   */
  calculateConfidenceScore(businessData) {
    console.log(`🔍 Calculating confidence score for ${businessData.name}`);

    // Step 1: Calculate base component scores
    const componentScores = this.calculateBaseComponentScores(businessData);
    
    // Step 2: Calculate weighted base score
    const baseScore = this.calculateWeightedBaseScore(componentScores);
    
    // Step 3: Calculate government API confidence boost
    const governmentBoost = this.calculateGovernmentAPIBoost(businessData);
    
    // Step 4: Calculate multi-source verification bonus
    const multiSourceBonus = this.calculateMultiSourceBonus(businessData);
    
    // Step 5: Calculate sector-specific adjustments
    const sectorAdjustment = this.calculateSectorAdjustment(businessData, baseScore);
    
    // Step 6: Apply risk factor penalties
    const riskPenalty = this.calculateRiskPenalty(businessData);
    
    // Step 7: Calculate final confidence score
    const preRiskScore = baseScore + governmentBoost.totalBoost + multiSourceBonus + sectorAdjustment.bonus;
    const finalScore = Math.max(0, Math.min(100, preRiskScore - riskPenalty));
    
    // Step 8: Determine quality tier
    const qualityTier = this.determineQualityTier(finalScore);
    
    // Step 9: Generate detailed scoring breakdown
    const scoringBreakdown = {
      finalConfidenceScore: Math.round(finalScore),
      qualityTier: qualityTier,
      isQualified: finalScore >= this.qualityThresholds.acceptable,
      
      // Component breakdown
      componentScores: componentScores,
      baseScore: Math.round(baseScore),
      
      // Boost breakdown
      governmentAPIBoost: governmentBoost,
      multiSourceBonus: Math.round(multiSourceBonus),
      sectorAdjustment: sectorAdjustment,
      riskPenalty: Math.round(riskPenalty),
      
      // Calculation details
      calculationSteps: {
        step1_baseScore: Math.round(baseScore),
        step2_governmentBoost: Math.round(governmentBoost.totalBoost),
        step3_multiSourceBonus: Math.round(multiSourceBonus),
        step4_sectorAdjustment: Math.round(sectorAdjustment.bonus),
        step5_preRiskScore: Math.round(preRiskScore),
        step6_riskPenalty: Math.round(riskPenalty),
        step7_finalScore: Math.round(finalScore)
      },
      
      // Quality metrics
      confidenceLevel: this.getConfidenceLevel(finalScore),
      recommendedActions: this.getRecommendedActions(businessData, finalScore),
      
      // Metadata
      scoredAt: new Date().toISOString(),
      scoringVersion: '2.0-gov-apis'
    };

    console.log(`📊 Confidence scoring complete: ${Math.round(finalScore)}% (${qualityTier})`);
    return scoringBreakdown;
  }

  /**
   * Calculate base component scores
   */
  calculateBaseComponentScores(businessData) {
    const scores = {};

    // Business Name Score (0-100)
    scores.businessName = this.scoreBusinessName(businessData);
    
    // Address Score (0-100)
    scores.address = this.scoreAddress(businessData);
    
    // Phone Score (0-100)
    scores.phone = this.scorePhone(businessData);
    
    // Website Score (0-100)
    scores.website = this.scoreWebsite(businessData);
    
    // Email Score (0-100)
    scores.email = this.scoreEmail(businessData);
    
    // Registration Score (0-100)
    scores.registration = this.scoreRegistration(businessData);

    return scores;
  }

  /**
   * Calculate weighted base score from components
   */
  calculateWeightedBaseScore(componentScores) {
    let weightedSum = 0;
    
    Object.keys(this.componentWeights).forEach(component => {
      const score = componentScores[component] || 0;
      const weight = this.componentWeights[component];
      weightedSum += (score * weight);
    });
    
    return weightedSum;
  }

  /**
   * Calculate government API confidence boost
   */
  calculateGovernmentAPIBoost(businessData) {
    const boost = {
      sources: {},
      totalBoost: 0,
      sourcesFound: 0,
      details: []
    };

    if (!businessData.governmentValidation?.hasAnyMatch) {
      return boost;
    }

    const gov = businessData.governmentValidation;

    // Process each government API
    Object.keys(this.governmentAPIs).forEach(apiKey => {
      const apiConfig = this.governmentAPIs[apiKey];
      const apiResult = gov[apiKey];
      
      if (apiResult?.found && apiResult.totalResults > 0) {
        // Calculate weighted boost
        const rawBoost = apiResult.confidenceBoost || 0;
        const weightedBoost = Math.min(rawBoost * apiConfig.weight, apiConfig.maxBoost);
        
        boost.sources[apiKey] = {
          found: true,
          rawBoost: rawBoost,
          weightedBoost: Math.round(weightedBoost),
          matches: apiResult.totalResults,
          exactMatches: apiResult.exactMatches || 0,
          priority: apiConfig.priority
        };
        
        boost.totalBoost += weightedBoost;
        boost.sourcesFound++;
        
        boost.details.push(`${apiKey}: +${Math.round(weightedBoost)} (${apiResult.totalResults} matches)`);
      } else {
        boost.sources[apiKey] = { found: false, boost: 0 };
      }
    });

    return boost;
  }

  /**
   * Calculate multi-source verification bonus
   */
  calculateMultiSourceBonus(businessData) {
    if (!businessData.governmentValidation?.hasAnyMatch) {
      return 0;
    }

    const sourcesWithMatches = Object.keys(this.governmentAPIs).filter(apiKey => {
      return businessData.governmentValidation[apiKey]?.found;
    });

    const sourceCount = sourcesWithMatches.length;
    
    if (sourceCount >= 4) {
      return this.multiSourceBonuses.allSources;
    } else if (sourceCount === 3) {
      return this.multiSourceBonuses.threeSources;
    } else if (sourceCount === 2) {
      return this.multiSourceBonuses.twoSources;
    } else {
      return 0;
    }
  }

  /**
   * Calculate sector-specific adjustments
   */
  calculateSectorAdjustment(businessData, baseScore) {
    const sectorType = businessData.sectorClassification?.primary || 'Unknown';
    const adjustment = this.sectorAdjustments[sectorType] || this.sectorAdjustments['Unknown'];
    
    // Apply multiplier to base score and add flat bonus
    const multipliedScore = baseScore * adjustment.multiplier;
    const additionalPoints = multipliedScore - baseScore;
    
    return {
      sectorType: sectorType,
      multiplier: adjustment.multiplier,
      bonus: Math.round(adjustment.bonus + additionalPoints),
      description: adjustment.description,
      confidence: businessData.sectorClassification?.confidence || 0
    };
  }

  /**
   * Calculate risk factor penalties
   */
  calculateRiskPenalty(businessData) {
    if (!businessData.riskAssessment) {
      return 0;
    }

    const riskLevel = businessData.riskAssessment.riskLevel;
    const penalty = this.riskPenalties[riskLevel] || 0;
    
    // Additional penalties for specific risk factors
    let additionalPenalty = 0;
    const riskFactors = businessData.riskAssessment.riskFactors || [];
    
    riskFactors.forEach(factor => {
      if (factor.includes('fake phone')) {
        additionalPenalty += 10;
      }
      if (factor.includes('no website')) {
        additionalPenalty += 5;
      }
      if (factor.includes('no state registration')) {
        additionalPenalty += 15;
      }
    });

    return penalty + additionalPenalty;
  }

  /**
   * Determine quality tier based on final score
   */
  determineQualityTier(score) {
    if (score >= this.qualityThresholds.excellent) return 'Excellent';
    if (score >= this.qualityThresholds.high) return 'High';
    if (score >= this.qualityThresholds.good) return 'Good';
    if (score >= this.qualityThresholds.acceptable) return 'Acceptable';
    if (score >= this.qualityThresholds.poor) return 'Poor';
    return 'Very Poor';
  }

  /**
   * Get confidence level description
   */
  getConfidenceLevel(score) {
    if (score >= 90) return 'Very High Confidence';
    if (score >= 80) return 'High Confidence';
    if (score >= 70) return 'Good Confidence';
    if (score >= 60) return 'Moderate Confidence';
    if (score >= 40) return 'Low Confidence';
    return 'Very Low Confidence';
  }

  /**
   * Get recommended actions based on score and data quality
   */
  getRecommendedActions(businessData, score) {
    const actions = [];

    if (score < this.qualityThresholds.acceptable) {
      actions.push('Review and enhance data quality before export');
      
      if (!businessData.governmentValidation?.hasAnyMatch) {
        actions.push('Consider additional validation sources');
      }
      
      if (!businessData.website || !businessData.websiteValidation?.accessible) {
        actions.push('Verify website accessibility');
      }
      
      if (!businessData.emailValidation?.bestEmail) {
        actions.push('Discover and validate business email');
      }
    } else if (score >= this.qualityThresholds.high) {
      actions.push('High-quality lead ready for export');
      actions.push('Prioritize for immediate outreach');
    } else {
      actions.push('Good quality lead suitable for export');
    }

    return actions;
  }

  // Individual scoring methods

  /**
   * Score business name quality (0-100)
   */
  scoreBusinessName(data) {
    if (!data.name) return 0;
    
    const name = data.name.toLowerCase();
    let score = 50; // Base score
    
    // Penalty for generic names
    const genericPatterns = [
      'company llc', 'business inc', 'corp', 'store', 'shop',
      'enterprise', 'group', 'services', 'solutions'
    ];
    
    if (genericPatterns.some(pattern => name.includes(pattern))) {
      score -= 30;
    } else {
      score += 20; // Specific name bonus
    }
    
    // Length bonus
    if (name.length > 10 && name.length < 50) {
      score += 10;
    }
    
    // Word count bonus (indicates specificity)
    const wordCount = name.split(' ').length;
    if (wordCount >= 2 && wordCount <= 5) {
      score += 10;
    }
    
    // Special character penalties (indicates fake data)
    if (name.includes('test') || name.includes('example') || name.includes('sample')) {
      score = 10;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Score address quality (0-100)
   */
  scoreAddress(data) {
    if (!data.address) return 0;
    
    const address = data.address.toLowerCase();
    let score = 40; // Base score
    
    // Property intelligence boost
    if (data.propertyIntelligence?.found) {
      score += 40;
      if (data.propertyIntelligence.isCommercial) {
        score += 10;
      }
    }
    
    // Completeness check
    const hasNumber = /\d+/.test(address);
    const hasStreetType = /\b(st|street|ave|avenue|rd|road|blvd|boulevard|dr|drive|ln|lane|ct|court|way|pl|place)\b/.test(address);
    const hasCity = address.includes(',');
    const hasState = /\b[A-Z]{2}\b/.test(data.address);
    const hasZip = /\d{5}/.test(address);
    
    if (hasNumber) score += 8;
    if (hasStreetType) score += 8;
    if (hasCity) score += 8;
    if (hasState) score += 8;
    if (hasZip) score += 8;
    
    // Fake address penalties
    const fakePatterns = [
      '123 main st', '100 main st', 'fake address',
      '111 test st', 'example address'
    ];
    
    if (fakePatterns.some(pattern => address.includes(pattern))) {
      score = 10;
    }
    
    // Sequential address pattern penalty
    const sequentialPattern = /\d{3,4}\s+(main|first|second|third)\s+st/;
    if (sequentialPattern.test(address)) {
      score -= 20;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Score phone quality (0-100)
   */
  scorePhone(data) {
    if (!data.phone) return 0;
    
    const phone = data.phone.replace(/\D/g, ''); // Remove non-digits
    let score = 30; // Base score
    
    // Format validation
    if (phone.length === 10) {
      score += 30;
    } else if (phone.length === 11 && phone.startsWith('1')) {
      score += 25;
    } else {
      return 20; // Invalid length
    }
    
    // Area code validation
    const areaCode = phone.substring(0, 3);
    const fakeAreaCodes = ['555', '000', '111', '999'];
    
    if (fakeAreaCodes.includes(areaCode)) {
      return 10; // Fake phone number
    } else {
      score += 25;
    }
    
    // Exchange code validation
    const exchangeCode = phone.substring(3, 6);
    if (exchangeCode === '000' || exchangeCode === '555') {
      return 15;
    } else {
      score += 15;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Score website quality (0-100)
   */
  scoreWebsite(data) {
    if (!data.website) return 0;
    
    const website = data.website.toLowerCase();
    let score = 30; // Base score
    
    // Accessibility boost
    if (data.websiteValidation?.accessible) {
      score += 50;
    } else if (data.websiteValidation) {
      score += 20; // Attempted validation
    } else {
      score += 10; // URL provided but not validated
    }
    
    // Domain quality
    if (website.includes('.com') || website.includes('.org') || website.includes('.net')) {
      score += 10;
    }
    
    // Fake website penalties
    const fakePatterns = [
      'example.com', 'test.com', 'fake.com', 'sample.com',
      'placeholder.com', 'tempsite.com'
    ];
    
    if (fakePatterns.some(pattern => website.includes(pattern))) {
      return 10;
    }
    
    // SSL bonus
    if (website.startsWith('https://')) {
      score += 10;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Score email quality (0-100)
   */
  scoreEmail(data) {
    if (!data.emailValidation?.bestEmail) return 0;
    
    const emailData = data.emailValidation.bestEmail;
    let score = 30; // Base score
    
    // Deliverability score
    if (emailData.confidence) {
      score += Math.round(emailData.confidence * 0.5); // Scale confidence to 50 points max
    }
    
    // Verification bonus
    if (emailData.isDeliverable) {
      score += 20;
    }
    
    // Domain match bonus
    if (data.website && emailData.email) {
      const websiteDomain = this.extractDomainFromWebsite(data.website);
      const emailDomain = emailData.email.split('@')[1];
      
      if (websiteDomain === emailDomain) {
        score += 15; // Domain consistency bonus
      }
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Score registration quality (0-100)
   */
  scoreRegistration(data) {
    let score = 10; // Base score (business exists)
    
    // State registry validation
    if (data.registryValidation?.registeredInAnyState) {
      score += 30;
    }
    
    // Government API validation boosts (already factored into government boost)
    // This is the base registration score without government APIs
    
    // Business intelligence data
    if (data.businessIntelligence?.hasFinancialData) {
      score += 20;
    }
    
    // Sector classification
    if (data.sectorClassification?.primary !== 'Unknown') {
      score += 20;
    }
    
    // Multiple registration sources
    const registrationSources = [];
    if (data.registryValidation?.california?.found) registrationSources.push('CA');
    if (data.registryValidation?.newYork?.found) registrationSources.push('NY');
    
    if (registrationSources.length > 1) {
      score += 20; // Multi-state registration bonus
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Extract domain from website URL
   */
  extractDomainFromWebsite(website) {
    try {
      const url = new URL(website);
      return url.hostname.replace('www.', '');
    } catch {
      return website.replace(/^https?:\/\//, '').replace('www.', '').split('/')[0];
    }
  }

  /**
   * Batch score multiple businesses
   */
  batchCalculateConfidence(businesses) {
    return businesses.map(business => {
      const scoring = this.calculateConfidenceScore(business);
      return {
        ...business,
        confidenceScoring: scoring,
        finalConfidenceScore: scoring.finalConfidenceScore,
        qualityTier: scoring.qualityTier,
        isQualified: scoring.isQualified
      };
    });
  }

  /**
   * Generate scoring analytics for a batch of businesses
   */
  generateScoringAnalytics(scoredBusinesses) {
    const analytics = {
      totalBusinesses: scoredBusinesses.length,
      qualified: scoredBusinesses.filter(b => b.isQualified).length,
      qualityTierDistribution: {},
      averageScore: 0,
      scoreDistribution: {
        excellent: 0,
        high: 0,
        good: 0,
        acceptable: 0,
        poor: 0,
        veryPoor: 0
      },
      governmentValidation: {
        hasAnyMatch: scoredBusinesses.filter(b => b.governmentValidation?.hasAnyMatch).length,
        averageBoost: 0,
        sourceDistribution: {}
      }
    };

    // Calculate averages
    const totalScore = scoredBusinesses.reduce((sum, b) => sum + b.finalConfidenceScore, 0);
    analytics.averageScore = Math.round(totalScore / scoredBusinesses.length);

    // Quality tier distribution
    scoredBusinesses.forEach(business => {
      const tier = business.qualityTier;
      analytics.qualityTierDistribution[tier] = (analytics.qualityTierDistribution[tier] || 0) + 1;
      
      // Score distribution
      const score = business.finalConfidenceScore;
      if (score >= 90) analytics.scoreDistribution.excellent++;
      else if (score >= 80) analytics.scoreDistribution.high++;
      else if (score >= 70) analytics.scoreDistribution.good++;
      else if (score >= 60) analytics.scoreDistribution.acceptable++;
      else if (score >= 40) analytics.scoreDistribution.poor++;
      else analytics.scoreDistribution.veryPoor++;
    });

    // Government validation analytics
    const govValidatedBusinesses = scoredBusinesses.filter(b => b.governmentValidation?.hasAnyMatch);
    if (govValidatedBusinesses.length > 0) {
      const totalGovBoost = govValidatedBusinesses.reduce(
        (sum, b) => sum + (b.confidenceScoring?.governmentAPIBoost?.totalBoost || 0), 0
      );
      analytics.governmentValidation.averageBoost = Math.round(totalGovBoost / govValidatedBusinesses.length);
    }

    return analytics;
  }
}

module.exports = EnhancedConfidenceScoring;