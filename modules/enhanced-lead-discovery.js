/**
 * Enhanced Lead Discovery Algorithm
 * Integrates multiple data sources with cost optimization and intelligent pre-validation
 */

const CaliforniaSOS = require('./api-clients/california-sos-client');
const NewYorkSOS = require('./api-clients/newyork-sos-client');
const NYTaxParcels = require('./api-clients/ny-tax-parcels-client');
const HunterIOClient = require('./api-clients/hunter-io');
const NeverBounceClient = require('./api-clients/neverbounce');

class EnhancedLeadDiscovery {
  constructor(apiKeys = {}) {
    // Initialize all API clients
    this.californiaSOSClient = new CaliforniaSOS();
    this.newYorkSOSClient = new NewYorkSOS();
    this.nyTaxParcelsClient = new NYTaxParcels();
    
    // Paid API clients with cost optimization
    this.hunterClient = apiKeys.hunterIO ? new HunterIOClient(apiKeys.hunterIO) : null;
    this.neverBounceClient = apiKeys.neverBounce ? new NeverBounceClient(apiKeys.neverBounce) : null;
    
    // Cost tracking
    this.totalCost = 0;
    this.apiUsageStats = {};
    
    console.log('🔧 Enhanced Lead Discovery Algorithm initialized');
  }

  /**
   * Main lead discovery pipeline with 4 enhanced stages
   * Stage 1: Discovery + Pre-validation
   * Stage 2: Enrichment + Property Intelligence  
   * Stage 3: Validation + Risk Assessment
   * Stage 4: Quality Scoring + Export Preparation
   */
  async discoverAndValidateLeads(businesses, options = {}) {
    const {
      budgetLimit = 50.00,
      qualityThreshold = 75,
      maxResults = 100
    } = options;

    console.log(`🚀 Starting enhanced lead discovery for ${businesses.length} businesses`);
    console.log(`💰 Budget limit: $${budgetLimit}, Quality threshold: ${qualityThreshold}%`);

    const results = [];
    let processedCount = 0;

    for (const business of businesses.slice(0, maxResults)) {
      try {
        // Check budget before processing each business
        if (this.totalCost >= budgetLimit) {
          console.warn(`⚠️ Budget limit reached: $${this.totalCost.toFixed(2)}`);
          break;
        }

        // Enhanced 4-stage pipeline
        const enhancedBusiness = await this.processBusinessThroughPipeline(business, options);
        
        // Only include businesses that meet quality threshold
        if (enhancedBusiness.finalConfidenceScore >= qualityThreshold) {
          results.push(enhancedBusiness);
        }

        processedCount++;
        
        if (processedCount % 10 === 0) {
          console.log(`✅ Processed ${processedCount} businesses, found ${results.length} qualified leads`);
        }

      } catch (error) {
        console.error(`❌ Error processing business ${business.name}:`, error.message);
      }
    }

    console.log(`🎯 Enhanced discovery complete: ${results.length} qualified leads from ${processedCount} businesses`);
    console.log(`💰 Total cost: $${this.totalCost.toFixed(2)}`);

    return {
      leads: results,
      totalProcessed: processedCount,
      totalCost: this.totalCost,
      usageStats: this.getUsageStats(),
      qualityMetrics: this.calculateQualityMetrics(results)
    };
  }

  /**
   * Process single business through enhanced 4-stage pipeline
   */
  async processBusinessThroughPipeline(business, options) {
    // Stage 1: Discovery + Pre-validation Scoring
    const stage1Result = await this.stage1_DiscoveryAndPreValidation(business);
    
    // Early filtering - only proceed if pre-validation score is promising
    if (stage1Result.preValidationScore < 60) {
      console.log(`⏭️ Skipping ${business.name} - low pre-validation score: ${stage1Result.preValidationScore}`);
      return {
        ...stage1Result,
        finalConfidenceScore: stage1Result.preValidationScore,
        stage: 'pre-validation-filtered'
      };
    }

    // Stage 2: Enrichment + Property Intelligence
    const stage2Result = await this.stage2_EnrichmentAndPropertyIntel(stage1Result);
    
    // Stage 3: Validation + Risk Assessment
    const stage3Result = await this.stage3_ValidationAndRiskAssessment(stage2Result);
    
    // Stage 4: Quality Scoring + Export Preparation
    const finalResult = await this.stage4_QualityScoringAndExport(stage3Result);
    
    return finalResult;
  }

  /**
   * Stage 1: Discovery + Pre-validation Scoring
   */
  async stage1_DiscoveryAndPreValidation(business) {
    console.log(`🔍 Stage 1: Pre-validation for ${business.name}`);
    
    const preValidationScore = this.calculatePreValidationScore(business);
    
    // Free registry validation for high-scoring businesses
    let registryValidation = {};
    
    if (preValidationScore >= 70) {
      registryValidation = await this.validateBusinessRegistration(business);
    }

    return {
      ...business,
      preValidationScore,
      registryValidation,
      stage: 'discovery',
      processingCost: 0 // Stage 1 is free
    };
  }

  /**
   * Stage 2: Enrichment + Property Intelligence
   */
  async stage2_EnrichmentAndPropertyIntel(businessData) {
    console.log(`🏢 Stage 2: Property intel for ${businessData.name}`);
    
    let propertyData = {};
    let emailDiscovery = {};
    let stageCost = 0;

    // Property intelligence (free)
    if (businessData.address) {
      propertyData = await this.nyTaxParcelsClient.getPropertyData(businessData.address);
    }

    // Email discovery (paid - selective usage)
    if (this.hunterClient && businessData.website && businessData.preValidationScore >= 80) {
      const domain = this.extractDomainFromWebsite(businessData.website);
      emailDiscovery = await this.hunterClient.domainSearch(domain);
      stageCost += emailDiscovery.cost || 0;
    }

    return {
      ...businessData,
      propertyIntelligence: propertyData,
      emailDiscovery,
      stage: 'enrichment',
      processingCost: stageCost
    };
  }

  /**
   * Stage 3: Validation + Risk Assessment  
   */
  async stage3_ValidationAndRiskAssessment(businessData) {
    console.log(`✅ Stage 3: Validation for ${businessData.name}`);
    
    let emailValidation = {};
    let websiteValidation = {};
    let stageCost = 0;

    // Website validation (free)
    if (businessData.website) {
      websiteValidation = await this.validateWebsiteAccessibility(businessData.website);
    }

    // Email validation (paid - selective usage)
    if (this.neverBounceClient && businessData.emailDiscovery?.emails?.length > 0) {
      const priorityEmails = businessData.emailDiscovery.emails.slice(0, 2); // Limit to 2 best emails
      const verificationResults = await this.neverBounceClient.verifyEmailBatch(priorityEmails.map(e => e.value || e));
      emailValidation = {
        results: verificationResults,
        bestEmail: verificationResults.find(r => r.isDeliverable),
        deliverableCount: verificationResults.filter(r => r.isDeliverable).length
      };
      stageCost += verificationResults.reduce((sum, r) => sum + (r.cost || 0), 0);
    }

    this.totalCost += stageCost;

    return {
      ...businessData,
      emailValidation,
      websiteValidation,
      stage: 'validation',
      processingCost: (businessData.processingCost || 0) + stageCost
    };
  }

  /**
   * Stage 4: Quality Scoring + Export Preparation
   */
  async stage4_QualityScoringAndExport(businessData) {
    console.log(`🎯 Stage 4: Final scoring for ${businessData.name}`);
    
    const qualityScores = this.calculateQualityScores(businessData);
    const finalConfidenceScore = this.calculateFinalConfidenceScore(qualityScores);
    
    return {
      ...businessData,
      qualityScores,
      finalConfidenceScore,
      exportReady: finalConfidenceScore >= 75,
      stage: 'completed',
      completedAt: new Date().toISOString()
    };
  }

  /**
   * Calculate pre-validation score to filter businesses early
   */
  calculatePreValidationScore(business) {
    let score = 0;
    
    // Business name quality (25 points max)
    if (business.name) {
      if (!this.isGenericBusinessName(business.name)) {
        score += 25;
      } else {
        score += 10; // Some points for having a name
      }
    }

    // Address completeness (20 points max)
    if (business.address) {
      if (this.isCompleteAddress(business.address)) {
        score += 20;
      } else {
        score += 10;
      }
    }

    // Phone number format (20 points max)
    if (business.phone) {
      if (this.isValidPhoneFormat(business.phone) && !this.isFakePhone(business.phone)) {
        score += 20;
      }
    }

    // Google rating and review indicators (15 points max)
    if (business.rating >= 4.0 && business.user_ratings_total >= 10) {
      score += 15;
    } else if (business.rating >= 3.5) {
      score += 8;
    }

    // Website presence (20 points max)
    if (business.website && business.website !== 'http://example.com') {
      score += 20;
    }

    return Math.min(score, 100);
  }

  /**
   * Validate business registration with state registries
   */
  async validateBusinessRegistration(business) {
    console.log(`📋 Validating business registration for ${business.name}`);
    
    const results = await Promise.allSettled([
      this.californiaSOSClient.searchBusiness(business.name),
      this.newYorkSOSClient.searchBusiness(business.name)
    ]);

    const caResult = results[0].status === 'fulfilled' ? results[0].value : { found: false };
    const nyResult = results[1].status === 'fulfilled' ? results[1].value : { found: false };

    return {
      california: caResult,
      newYork: nyResult,
      registeredInAnyState: caResult.found || nyResult.found,
      confidence: Math.max(caResult.confidence || 0, nyResult.confidence || 0)
    };
  }

  /**
   * Validate website accessibility
   */
  async validateWebsiteAccessibility(website) {
    try {
      const startTime = Date.now();
      const response = await fetch(website, {
        method: 'HEAD',
        timeout: 5000,
        headers: {
          'User-Agent': 'ProspectPro-WebsiteValidator/1.0'
        }
      });
      
      const responseTime = Date.now() - startTime;
      const isAccessible = response.status >= 200 && response.status < 400;
      
      return {
        url: website,
        accessible: isAccessible,
        statusCode: response.status,
        responseTime,
        confidence: isAccessible ? 95 : 10,
        checkedAt: new Date().toISOString()
      };
      
    } catch (error) {
      return {
        url: website,
        accessible: false,
        error: error.message,
        confidence: 5,
        checkedAt: new Date().toISOString()
      };
    }
  }

  /**
   * Calculate quality scores across all data points
   */
  calculateQualityScores(businessData) {
    return {
      businessNameScore: this.scoreBusinessName(businessData),
      addressScore: this.scoreAddress(businessData),
      phoneScore: this.scorePhone(businessData),
      websiteScore: this.scoreWebsite(businessData),
      emailScore: this.scoreEmail(businessData),
      registrationScore: this.scoreRegistration(businessData),
      propertyScore: this.scoreProperty(businessData)
    };
  }

  /**
   * Calculate final confidence score
   */
  calculateFinalConfidenceScore(qualityScores) {
    const weights = {
      businessNameScore: 0.15,
      addressScore: 0.15,
      phoneScore: 0.20,
      websiteScore: 0.15,
      emailScore: 0.20,
      registrationScore: 0.10,
      propertyScore: 0.05
    };

    let weightedSum = 0;
    let totalWeight = 0;

    for (const [metric, score] of Object.entries(qualityScores)) {
      if (score > 0) {
        weightedSum += score * weights[metric];
        totalWeight += weights[metric];
      }
    }

    return totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
  }

  // Helper methods for validation and scoring
  isGenericBusinessName(name) {
    const genericPatterns = [
      /business\s+(llc|inc|corp)/i,
      /company\s+(llc|inc|corp)/i,
      /^(business|company)$/i,
      /test\s*business/i
    ];
    return genericPatterns.some(pattern => pattern.test(name));
  }

  isCompleteAddress(address) {
    return address && 
           address.length > 10 && 
           /\d/.test(address) && 
           /[a-zA-Z]/.test(address) &&
           !address.includes('Main St, Main St'); // Avoid obvious fakes
  }

  isValidPhoneFormat(phone) {
    return /^\+?[\d\s\-\(\)]{10,}$/.test(phone);
  }

  isFakePhone(phone) {
    return phone.includes('555-') || phone.includes('(555)') || phone.includes('000-000');
  }

  extractDomainFromWebsite(website) {
    try {
      const url = new URL(website);
      return url.hostname.replace('www.', '');
    } catch {
      return website.replace(/^https?:\/\//, '').replace('www.', '').split('/')[0];
    }
  }

  // Scoring methods
  scoreBusinessName(data) {
    if (!data.name) return 0;
    return this.isGenericBusinessName(data.name) ? 30 : 90;
  }

  scoreAddress(data) {
    if (!data.address) return 0;
    if (data.propertyIntelligence?.found) return 95;
    return this.isCompleteAddress(data.address) ? 80 : 40;
  }

  scorePhone(data) {
    if (!data.phone) return 0;
    if (this.isFakePhone(data.phone)) return 10;
    return this.isValidPhoneFormat(data.phone) ? 85 : 30;
  }

  scoreWebsite(data) {
    if (!data.website) return 0;
    if (data.websiteValidation?.accessible) return 95;
    return data.website !== 'http://example.com' ? 50 : 10;
  }

  scoreEmail(data) {
    if (!data.emailValidation?.bestEmail) return 0;
    return data.emailValidation.bestEmail.confidence || 50;
  }

  scoreRegistration(data) {
    if (!data.registryValidation) return 50;
    return data.registryValidation.registeredInAnyState ? 90 : 20;
  }

  scoreProperty(data) {
    if (!data.propertyIntelligence?.found) return 50;
    return data.propertyIntelligence.isCommercial ? 90 : 70;
  }

  calculateQualityMetrics(results) {
    if (!results.length) return {};
    
    return {
      averageConfidence: Math.round(results.reduce((sum, r) => sum + r.finalConfidenceScore, 0) / results.length),
      registrationVerified: results.filter(r => r.registryValidation?.registeredInAnyState).length,
      websitesAccessible: results.filter(r => r.websiteValidation?.accessible).length,
      emailsVerified: results.filter(r => r.emailValidation?.bestEmail?.isDeliverable).length,
      propertiesFound: results.filter(r => r.propertyIntelligence?.found).length,
      commercialProperties: results.filter(r => r.propertyIntelligence?.isCommercial).length
    };
  }

  getUsageStats() {
    const stats = {
      californiaSOSRequests: this.californiaSOSClient.getUsageStats(),
      newYorkSOSRequests: this.newYorkSOSClient.getUsageStats(),
      nyTaxParcelsRequests: this.nyTaxParcelsClient.getUsageStats()
    };

    if (this.hunterClient) {
      stats.hunterIOUsage = this.hunterClient.getUsageStats();
    }

    if (this.neverBounceClient) {
      stats.neverBounceUsage = this.neverBounceClient.getUsageStats();
    }

    return stats;
  }
}

module.exports = EnhancedLeadDiscovery;