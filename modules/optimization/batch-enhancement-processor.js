/**
 * Batch Enhancement Processor v1.0
 * Optimizes P1 enhancement processing through intelligent batching and parallel execution
 * Reduces API calls and improves performance
 */

const EnhancedBusinessClassifier = require('./enhanced-business-classifier');

class BatchEnhancementProcessor {
  constructor(enhancementClients, options = {}) {
    this.clients = enhancementClients;
    this.classifier = new EnhancedBusinessClassifier();
    this.options = {
      maxBatchSize: options.maxBatchSize || 10,
      maxParallelBatches: options.maxParallelBatches || 3,
      enableGeographicFiltering: options.enableGeographicFiltering !== false,
      costThreshold: options.costThreshold || 50.0,
      ...options
    };
    
    this.stats = {
      totalBusinesses: 0,
      totalAPICallsSaved: 0,
      totalProcessingTime: 0,
      batchesProcessed: 0,
      cacheHits: 0,
      geographicFiltering: 0
    };
    
    // Shared cache across all enhancement processing
    this.sharedCache = new Map();
    this.cacheTTL = 604800000; // 7 days
  }

  /**
   * Process enhancements for multiple businesses with intelligent batching
   * @param {Array} businesses - Array of business objects to enhance
   * @param {Object} enhancementOptions - Enhancement options (apollo, chamber, etc.)
   * @returns {Promise<Array>} Enhanced business objects
   */
  async processEnhancements(businesses, enhancementOptions) {
    const startTime = Date.now();
    console.log(`🚀 Starting batch enhancement processing for ${businesses.length} businesses`);
    
    // Step 1: Classify all businesses
    const classifiedBusinesses = this.classifyBusinesses(businesses);
    
    // Step 2: Group businesses by optimization strategy
    const processingGroups = this.groupBusinessesForProcessing(classifiedBusinesses, enhancementOptions);
    
    // Step 3: Process groups in parallel
    const enhancedBusinesses = await this.processGroups(processingGroups, enhancementOptions);
    
    // Update statistics
    const processingTime = Date.now() - startTime;
    this.updateStats(businesses.length, processingTime);
    
    console.log(`✅ Batch processing complete: ${enhancedBusinesses.length} businesses in ${processingTime}ms`);
    console.log(`📊 API calls saved: ${this.stats.totalAPICallsSaved}`);
    
    return enhancedBusinesses;
  }

  /**
   * Classify all businesses for intelligent routing
   * @private
   */
  classifyBusinesses(businesses) {
    console.log('🧠 Classifying businesses for optimal API routing...');
    
    return businesses.map(business => {
      const classification = this.classifier.classifyBusiness(business);
      const geographicFilter = this.classifier.getGeographicFilter(business, classification.primaryType);
      
      return {
        ...business,
        classification,
        geographicFilter,
        processingStrategy: this.determineProcessingStrategy(classification, geographicFilter)
      };
    });
  }

  /**
   * Group businesses by processing strategy for batching
   * @private
   */
  groupBusinessesForProcessing(classifiedBusinesses, enhancementOptions) {
    const groups = {
      highPriorityParallel: [],
      mediumPriorityParallel: [],
      sequentialProcessing: [],
      skipProcessing: []
    };
    
    classifiedBusinesses.forEach(business => {
      const { classification, processingStrategy } = business;
      
      // Skip businesses with no relevant enhancements
      if (classification.confidence === 'low' && !this.hasRelevantEnhancements(classification, enhancementOptions)) {
        groups.skipProcessing.push(business);
        return;
      }
      
      // Group by processing strategy
      if (processingStrategy === 'parallel' && classification.confidence === 'high') {
        groups.highPriorityParallel.push(business);
      } else if (processingStrategy === 'parallel') {
        groups.mediumPriorityParallel.push(business);
      } else {
        groups.sequentialProcessing.push(business);
      }
    });
    
    console.log(`📋 Processing groups: High Priority: ${groups.highPriorityParallel.length}, Medium: ${groups.mediumPriorityParallel.length}, Sequential: ${groups.sequentialProcessing.length}, Skipped: ${groups.skipProcessing.length}`);
    
    return groups;
  }

  /**
   * Process all groups with optimal strategies
   * @private
   */
  async processGroups(groups, enhancementOptions) {
    const results = [];
    
    // Process high priority group first (parallel)
    if (groups.highPriorityParallel.length > 0) {
      const highPriorityResults = await this.processParallelGroup(
        groups.highPriorityParallel, 
        enhancementOptions, 
        'high'
      );
      results.push(...highPriorityResults);
    }
    
    // Process medium priority group (parallel, but limited concurrency)
    if (groups.mediumPriorityParallel.length > 0) {
      const mediumPriorityResults = await this.processParallelGroup(
        groups.mediumPriorityParallel, 
        enhancementOptions, 
        'medium'
      );
      results.push(...mediumPriorityResults);
    }
    
    // Process sequential group
    if (groups.sequentialProcessing.length > 0) {
      const sequentialResults = await this.processSequentialGroup(
        groups.sequentialProcessing, 
        enhancementOptions
      );
      results.push(...sequentialResults);
    }
    
    // Add skipped businesses with minimal enhancement data
    groups.skipProcessing.forEach(business => {
      results.push({
        ...business,
        enhancementData: {
          skipped: true,
          reason: 'Low relevance classification'
        }
      });
    });
    
    return results;
  }

  /**
   * Process group with parallel execution
   * @private
   */
  async processParallelGroup(businesses, enhancementOptions, priority) {
    console.log(`⚡ Processing ${businesses.length} businesses in parallel (${priority} priority)`);
    
    const batches = this.createBatches(businesses, this.options.maxBatchSize);
    const maxConcurrency = priority === 'high' ? this.options.maxParallelBatches : Math.max(1, Math.floor(this.options.maxParallelBatches / 2));
    
    const results = [];
    
    // Process batches with controlled concurrency
    for (let i = 0; i < batches.length; i += maxConcurrency) {
      const batchSlice = batches.slice(i, i + maxConcurrency);
      const batchPromises = batchSlice.map(batch => this.processBatch(batch, enhancementOptions));
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults.flat());
      
      this.stats.batchesProcessed += batchSlice.length;
    }
    
    return results;
  }

  /**
   * Process group sequentially for careful handling
   * @private
   */
  async processSequentialGroup(businesses, enhancementOptions) {
    console.log(`🔄 Processing ${businesses.length} businesses sequentially`);
    
    const results = [];
    
    for (const business of businesses) {
      try {
        const enhanced = await this.processSingleBusiness(business, enhancementOptions);
        results.push(enhanced);
      } catch (error) {
        console.error(`Error processing business ${business.businessName}:`, error.message);
        results.push({
          ...business,
          enhancementData: {
            error: error.message,
            timestamp: new Date().toISOString()
          }
        });
      }
    }
    
    return results;
  }

  /**
   * Process a single batch of businesses
   * @private
   */
  async processBatch(batch, enhancementOptions) {
    const results = [];
    
    // Group batch by geographic location for location-based optimizations
    const locationGroups = this.groupByLocation(batch);
    
    for (const [location, businesses] of Object.entries(locationGroups)) {
      const locationResults = await this.processLocationGroup(businesses, enhancementOptions, location);
      results.push(...locationResults);
    }
    
    return results;
  }

  /**
   * Process businesses in the same location together
   * @private
   */
  async processLocationGroup(businesses, enhancementOptions, location) {
    console.log(`📍 Processing ${businesses.length} businesses in ${location}`);
    
    // Extract unique enhancement types needed for this location
    const neededEnhancements = this.analyzeNeededEnhancements(businesses, enhancementOptions);
    
    // Process all businesses in parallel with location-optimized API calls
    const enhancementPromises = businesses.map(business => 
      this.processSingleBusiness(business, enhancementOptions, neededEnhancements)
    );
    
    return await Promise.all(enhancementPromises);
  }

  /**
   * Process a single business with intelligent enhancement selection
   * @private
   */
  async processSingleBusiness(business, enhancementOptions, locationEnhancements = null) {
    const { classification, geographicFilter } = business;
    const cacheKey = this.generateCacheKey(business);
    
    // Check shared cache
    const cached = this.getFromSharedCache(cacheKey);
    if (cached) {
      this.stats.cacheHits++;
      return { ...business, enhancementData: cached };
    }
    
    const enhancements = {};
    const enhancementPromises = [];
    
    // Determine which APIs to call based on classification
    const apiRecommendations = classification.apiRecommendations;
    
    // Trade Associations (Free)
    if (enhancementOptions.tradeAssociations && this.shouldCallAPI('tradeAssociations', apiRecommendations)) {
      enhancementPromises.push(
        this.callTradeAssociationAPIs(business, classification).then(result => {
          enhancements.tradeAssociations = result;
        }).catch(error => {
          console.error('Trade association error:', error.message);
        })
      );
    }
    
    // Professional Licensing (Free, but state-dependent)
    if (enhancementOptions.professionalLicensing && this.shouldCallAPI('professionalLicensing', apiRecommendations) && geographicFilter.relevantForLicensing) {
      enhancementPromises.push(
        this.callProfessionalLicensingAPIs(business, geographicFilter).then(result => {
          enhancements.professionalLicenses = result;
        }).catch(error => {
          console.error('Professional licensing error:', error.message);
        })
      );
    }
    
    // Chamber Verification (Free, location-based)
    if (enhancementOptions.chamberVerification && this.shouldCallAPI('chamber', apiRecommendations)) {
      enhancementPromises.push(
        this.callChamberAPI(business, geographicFilter).then(result => {
          enhancements.chamberMembership = result;
        }).catch(error => {
          console.error('Chamber verification error:', error.message);
        })
      );
    }
    
    // Apollo Discovery (Premium, selective)
    if (enhancementOptions.apolloDiscovery && this.shouldCallAPI('apollo', apiRecommendations) && business.website) {
      enhancementPromises.push(
        this.callApolloAPI(business, classification).then(result => {
          enhancements.apolloData = result;
        }).catch(error => {
          console.error('Apollo enrichment error:', error.message);
          enhancements.apolloData = { success: false, cost: 1.0, error: error.message };
        })
      );
    }
    
    // Wait for all enhancements to complete
    if (enhancementPromises.length > 0) {
      await Promise.all(enhancementPromises);
    }
    
    // Calculate total confidence boost
    let totalConfidenceBoost = 0;
    if (enhancements.tradeAssociations?.length > 0) {
      totalConfidenceBoost += enhancements.tradeAssociations.reduce((sum, ta) => sum + (ta.confidenceBoost || 0), 0);
    }
    if (enhancements.professionalLicenses?.length > 0) {
      totalConfidenceBoost += enhancements.professionalLicenses.reduce((sum, pl) => sum + (pl.confidenceBoost || 0), 0);
    }
    if (enhancements.chamberMembership?.verified) {
      totalConfidenceBoost += enhancements.chamberMembership.confidenceBoost || 0;
    }
    if (enhancements.apolloData?.success) {
      totalConfidenceBoost += 30;
    }
    
    // Add processing metadata
    enhancements.processingMetadata = {
      classification: classification.primaryType,
      confidence: classification.confidence,
      apiCallsSaved: apiRecommendations.skipAPIs.length,
      totalConfidenceBoost,
      geographicScope: geographicFilter.scope,
      timestamp: new Date().toISOString()
    };
    
    // Cache the result
    this.setInSharedCache(cacheKey, enhancements);
    
    return {
      ...business,
      enhancementData: enhancements,
      optimizedScore: (business.optimizedScore || 0) + totalConfidenceBoost
    };
  }

  /**
   * Call trade association APIs based on business classification
   * @private
   */
  async callTradeAssociationAPIs(business, classification) {
    const results = [];
    
    if (classification.primaryType === 'spa' && this.clients.spaAssociation) {
      const spaResult = await this.clients.spaAssociation.verifySpaMembership(business);
      if (spaResult.verified) results.push(spaResult);
    }
    
    if (classification.primaryType === 'beauty' && this.clients.beautyAssociation) {
      const beautyResult = await this.clients.beautyAssociation.verifyBeautyMembership(business);
      if (beautyResult.verified) results.push(beautyResult);
    }
    
    return results;
  }

  /**
   * Call professional licensing APIs with geographic filtering
   * @private
   */
  async callProfessionalLicensingAPIs(business, geographicFilter) {
    const results = [];
    
    if (geographicFilter.state && this.clients.cpaLicensing) {
      const cpaResult = await this.clients.cpaLicensing.verifyCPALicense(business);
      if (cpaResult.licensedCPA) results.push(cpaResult);
    }
    
    return results;
  }

  /**
   * Call chamber API with location optimization
   * @private
   */
  async callChamberAPI(business, geographicFilter) {
    // This would call actual chamber API - simulated for now
    const businessName = business.businessName.toLowerCase();
    const isLikelyMember = businessName.includes('chamber') || Math.random() > 0.7;
    
    return {
      verified: isLikelyMember,
      chambers: isLikelyMember ? [`${geographicFilter.city || 'Local'} Chamber of Commerce`] : [],
      membershipLevel: isLikelyMember ? 'Professional Member' : null,
      confidenceBoost: isLikelyMember ? 15 : 0,
      source: 'chamber_directory'
    };
  }

  /**
   * Call Apollo API with classification-based filtering
   * @private
   */
  async callApolloAPI(business, classification) {
    if (this.clients.apollo) {
      return await this.clients.apollo.enrichOrganization(business);
    }
    
    // Simulated Apollo response
    return {
      success: Math.random() > 0.3,
      cost: 1.0,
      ownerContacts: [
        {
          name: 'John Smith',
          title: 'Owner',
          email: `john@${this.extractDomain(business.website)}`
        }
      ]
    };
  }

  // Helper methods
  determineProcessingStrategy(classification, geographicFilter) {
    if (classification.confidence === 'high' && classification.apiRecommendations.highPriority.length <= 3) {
      return 'parallel';
    }
    return 'sequential';
  }

  hasRelevantEnhancements(classification, enhancementOptions) {
    const relevantAPIs = [...classification.apiRecommendations.highPriority, ...classification.apiRecommendations.mediumPriority];
    return relevantAPIs.some(api => {
      if (api === 'spaAssociation' || api === 'beautyAssociation') return enhancementOptions.tradeAssociations;
      if (api === 'cpaLicensing') return enhancementOptions.professionalLicensing;
      if (api === 'chamber') return enhancementOptions.chamberVerification;
      if (api === 'apollo') return enhancementOptions.apolloDiscovery;
      return false;
    });
  }

  shouldCallAPI(enhancementType, apiRecommendations) {
    const apiMapping = {
      'tradeAssociations': ['spaAssociation', 'beautyAssociation'],
      'professionalLicensing': ['cpaLicensing'],
      'chamber': ['chamber'],
      'apollo': ['apollo']
    };
    
    const relevantAPIs = [...apiRecommendations.highPriority, ...apiRecommendations.mediumPriority];
    return apiMapping[enhancementType]?.some(api => relevantAPIs.includes(api)) || false;
  }

  createBatches(items, batchSize) {
    const batches = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }

  groupByLocation(businesses) {
    const groups = {};
    businesses.forEach(business => {
      const location = business.geographicFilter?.city || business.geographicFilter?.state || 'unknown';
      if (!groups[location]) groups[location] = [];
      groups[location].push(business);
    });
    return groups;
  }

  analyzeNeededEnhancements(businesses, enhancementOptions) {
    const needed = new Set();
    businesses.forEach(business => {
      const { classification } = business;
      const relevantAPIs = [...classification.apiRecommendations.highPriority, ...classification.apiRecommendations.mediumPriority];
      relevantAPIs.forEach(api => needed.add(api));
    });
    return Array.from(needed);
  }

  generateCacheKey(business) {
    const name = (business.businessName || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    const address = (business.address || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    return `enhancement_${name}_${address}`;
  }

  getFromSharedCache(key) {
    const cached = this.sharedCache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.data;
    }
    this.sharedCache.delete(key);
    return null;
  }

  setInSharedCache(key, data) {
    this.sharedCache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  extractDomain(website) {
    try {
      const url = new URL(website.startsWith('http') ? website : `https://${website}`);
      return url.hostname.replace('www.', '');
    } catch {
      return 'example.com';
    }
  }

  updateStats(businessCount, processingTime) {
    this.stats.totalBusinesses += businessCount;
    this.stats.totalProcessingTime += processingTime;
    this.stats.totalAPICallsSaved += this.classifier.getStats().apiCallsSaved;
  }

  getPerformanceStats() {
    return {
      ...this.stats,
      averageProcessingTimePerBusiness: this.stats.totalProcessingTime / Math.max(1, this.stats.totalBusinesses),
      cacheHitRate: this.stats.cacheHits / Math.max(1, this.stats.totalBusinesses),
      apiSavingsRate: this.stats.totalAPICallsSaved / Math.max(1, this.stats.totalBusinesses * 4),
      classifierStats: this.classifier.getStats()
    };
  }

  reset() {
    this.stats = {
      totalBusinesses: 0,
      totalAPICallsSaved: 0,
      totalProcessingTime: 0,
      batchesProcessed: 0,
      cacheHits: 0,
      geographicFiltering: 0
    };
    this.classifier.reset();
    this.sharedCache.clear();
  }
}

module.exports = BatchEnhancementProcessor;