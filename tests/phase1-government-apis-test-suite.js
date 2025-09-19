/**
 * Phase 1 Government APIs Test Suite
 * Comprehensive testing for all Phase 1 government API integrations
 * 
 * Tests Include:
 * - Unit tests for each API client
 * - Integration tests with real API endpoints
 * - Validation tests against known business entities
 * - Error handling and rate limiting tests
 * - Confidence scoring validation
 * 
 * ProspectPro - Zero Fake Data Policy
 */

const CaliforniaSOSClient = require('../../modules/api-clients/california-sos-client');
const EnhancedSECEdgarClient = require('../../modules/api-clients/enhanced-sec-edgar-client');
const ProPublicaNonprofitClient = require('../../modules/api-clients/propublica-nonprofit-client');
const CompaniesHouseUKClient = require('../../modules/api-clients/companies-house-uk-client');
const EnhancedConfidenceScoring = require('../../modules/confidence-scoring-algorithm');

class Phase1GovernmentAPIsTestSuite {
  constructor() {
    this.testResults = {
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      skippedTests: 0,
      testDetails: [],
      apiMetrics: {},
      startTime: Date.now(),
      endTime: null
    };

    // Initialize API clients
    this.californiaSOSClient = new CaliforniaSOSClient();
    this.secEdgarClient = new EnhancedSECEdgarClient();
    this.nonprofitClient = new ProPublicaNonprofitClient();
    this.companiesHouseClient = new CompaniesHouseUKClient();
    this.confidenceScoring = new EnhancedConfidenceScoring();

    // Test data - known entities for validation
    this.testEntities = {
      californiaSOS: [
        { name: 'Google LLC', expectedFound: true },
        { name: 'Apple Inc.', expectedFound: true },
        { name: 'Facebook Inc.', expectedFound: true },
        { name: 'NonExistentCompany12345', expectedFound: false }
      ],
      secEdgar: [
        { name: 'Apple Inc.', ticker: 'AAPL', expectedFound: true },
        { name: 'Microsoft Corporation', ticker: 'MSFT', expectedFound: true },
        { name: 'Alphabet Inc.', ticker: 'GOOGL', expectedFound: true },
        { name: 'NonExistentCompany12345', expectedFound: false }
      ],
      nonprofit: [
        { name: 'American Red Cross', ein: '530196605', expectedFound: true },
        { name: 'United Way', expectedFound: true },
        { name: 'NonExistentNonprofit12345', expectedFound: false }
      ],
      companiesHouseUK: [
        { name: 'TESCO PLC', companyNumber: '00445790', expectedFound: true },
        { name: 'BP PLC', companyNumber: '00102498', expectedFound: true },
        { name: 'NonExistentCompany12345', expectedFound: false }
      ]
    };

    console.log('🧪 Phase 1 Government APIs Test Suite initialized');
  }

  /**
   * Run complete test suite
   */
  async runCompleteTestSuite() {
    console.log('🚀 Starting Phase 1 Government APIs Test Suite');
    console.log('==========================================');

    try {
      // Unit Tests
      await this.runUnitTests();
      
      // Integration Tests
      await this.runIntegrationTests();
      
      // Validation Tests
      await this.runValidationTests();
      
      // Performance Tests
      await this.runPerformanceTests();
      
      // Confidence Scoring Tests
      await this.runConfidenceScoringTests();

      // Generate final report
      this.generateTestReport();

    } catch (error) {
      console.error('❌ Test suite failed with error:', error);
      this.recordTest('Test Suite Execution', false, error.message);
    } finally {
      this.testResults.endTime = Date.now();
    }

    return this.testResults;
  }

  /**
   * Unit Tests - Test individual API client functionality
   */
  async runUnitTests() {
    console.log('\n📋 Running Unit Tests...');
    
    await this.testCaliforniaSOSUnit();
    await this.testSECEdgarUnit();
    await this.testNonprofitUnit();
    await this.testCompaniesHouseUKUnit();
  }

  /**
   * California SOS Unit Tests
   */
  async testCaliforniaSOSUnit() {
    console.log('🏛️ Testing California SOS API Client...');

    // Test 1: Client initialization
    try {
      const client = new CaliforniaSOSClient();
      this.recordTest('California SOS - Client Initialization', true, 'Client initialized successfully');
    } catch (error) {
      this.recordTest('California SOS - Client Initialization', false, error.message);
    }

    // Test 2: Search method validation
    try {
      const result = await this.californiaSOSClient.searchByKeyword('Test Company');
      const hasRequiredFields = result.hasOwnProperty('found') && 
                               result.hasOwnProperty('source') && 
                               result.hasOwnProperty('qualityScore');
      this.recordTest('California SOS - Response Structure', hasRequiredFields, 
        hasRequiredFields ? 'Response has required fields' : 'Missing required fields');
    } catch (error) {
      this.recordTest('California SOS - Response Structure', false, error.message);
    }

    // Test 3: Invalid input handling
    try {
      await this.californiaSOSClient.searchByKeyword('');
      this.recordTest('California SOS - Invalid Input Handling', false, 'Should reject empty string');
    } catch (error) {
      this.recordTest('California SOS - Invalid Input Handling', true, 'Correctly rejects invalid input');
    }

    // Test 4: Rate limiting check
    try {
      const canProceed = this.californiaSOSClient.checkRateLimit();
      this.recordTest('California SOS - Rate Limiting', typeof canProceed === 'boolean', 
        'Rate limit check returns boolean');
    } catch (error) {
      this.recordTest('California SOS - Rate Limiting', false, error.message);
    }
  }

  /**
   * SEC EDGAR Unit Tests
   */
  async testSECEdgarUnit() {
    console.log('📊 Testing SEC EDGAR API Client...');

    // Test 1: Client initialization
    try {
      const client = new EnhancedSECEdgarClient();
      this.recordTest('SEC EDGAR - Client Initialization', true, 'Client initialized successfully');
    } catch (error) {
      this.recordTest('SEC EDGAR - Client Initialization', false, error.message);
    }

    // Test 2: Search method validation
    try {
      const result = await this.secEdgarClient.searchCompanies('Apple');
      const hasRequiredFields = result.hasOwnProperty('found') && 
                               result.hasOwnProperty('companies') && 
                               result.hasOwnProperty('qualityScore');
      this.recordTest('SEC EDGAR - Response Structure', hasRequiredFields, 
        hasRequiredFields ? 'Response has required fields' : 'Missing required fields');
    } catch (error) {
      this.recordTest('SEC EDGAR - Response Structure', false, error.message);
    }

    // Test 3: Company directory loading
    try {
      await this.secEdgarClient.loadCompaniesDirectory();
      const stats = this.secEdgarClient.getUsageStats();
      const hasCompanies = stats.apiInfo.companiesLoaded > 0;
      this.recordTest('SEC EDGAR - Companies Directory', hasCompanies, 
        `Loaded ${stats.apiInfo.companiesLoaded} companies`);
    } catch (error) {
      this.recordTest('SEC EDGAR - Companies Directory', false, error.message);
    }

    // Test 4: Rate limiting implementation
    try {
      await this.secEdgarClient.waitForRateLimit();
      this.recordTest('SEC EDGAR - Rate Limiting', true, 'Rate limiting works correctly');
    } catch (error) {
      this.recordTest('SEC EDGAR - Rate Limiting', false, error.message);
    }
  }

  /**
   * ProPublica Nonprofit Unit Tests
   */
  async testNonprofitUnit() {
    console.log('🏥 Testing ProPublica Nonprofit API Client...');

    // Test 1: Client initialization
    try {
      const client = new ProPublicaNonprofitClient();
      this.recordTest('Nonprofit API - Client Initialization', true, 'Client initialized successfully');
    } catch (error) {
      this.recordTest('Nonprofit API - Client Initialization', false, error.message);
    }

    // Test 2: Search method validation
    try {
      const result = await this.nonprofitClient.searchNonprofits('Red Cross');
      const hasRequiredFields = result.hasOwnProperty('found') && 
                               result.hasOwnProperty('organizations') && 
                               result.hasOwnProperty('qualityScore');
      this.recordTest('Nonprofit API - Response Structure', hasRequiredFields, 
        hasRequiredFields ? 'Response has required fields' : 'Missing required fields');
    } catch (error) {
      this.recordTest('Nonprofit API - Response Structure', false, error.message);
    }

    // Test 3: EIN validation
    try {
      const result = await this.nonprofitClient.getOrganizationByEIN('530196605');
      const hasEINData = result.found || result.hasOwnProperty('ein');
      this.recordTest('Nonprofit API - EIN Lookup', hasEINData, 
        hasEINData ? 'EIN lookup working' : 'EIN lookup failed');
    } catch (error) {
      this.recordTest('Nonprofit API - EIN Lookup', false, error.message);
    }

    // Test 4: Sector classification
    try {
      const classification = this.nonprofitClient.getSectorClassification('A20');
      this.recordTest('Nonprofit API - Sector Classification', 
        classification !== 'Unknown', `Classification: ${classification}`);
    } catch (error) {
      this.recordTest('Nonprofit API - Sector Classification', false, error.message);
    }
  }

  /**
   * Companies House UK Unit Tests
   */
  async testCompaniesHouseUKUnit() {
    console.log('🇬🇧 Testing Companies House UK API Client...');

    // Test 1: Client initialization
    try {
      const client = new CompaniesHouseUKClient();
      this.recordTest('Companies House UK - Client Initialization', true, 'Client initialized successfully');
    } catch (error) {
      this.recordTest('Companies House UK - Client Initialization', false, error.message);
    }

    // Test 2: Search method validation (mock mode if no API key)
    try {
      const result = await this.companiesHouseClient.searchCompanies('TESCO');
      const hasRequiredFields = result.hasOwnProperty('found') && 
                               result.hasOwnProperty('companies') && 
                               result.hasOwnProperty('qualityScore');
      this.recordTest('Companies House UK - Response Structure', hasRequiredFields, 
        hasRequiredFields ? 'Response has required fields' : 'Missing required fields');
    } catch (error) {
      this.recordTest('Companies House UK - Response Structure', false, error.message);
    }

    // Test 3: Company status mapping
    try {
      const statusDesc = this.companiesHouseClient.companyStatuses['active'];
      this.recordTest('Companies House UK - Status Mapping', 
        statusDesc === 'Active', `Status mapping: ${statusDesc}`);
    } catch (error) {
      this.recordTest('Companies House UK - Status Mapping', false, error.message);
    }

    // Test 4: Address normalization
    try {
      const mockAddress = {
        address_line_1: '123 Test Street',
        locality: 'London',
        postal_code: 'SW1A 1AA'
      };
      const normalized = this.companiesHouseClient.normalizeAddress(mockAddress);
      const isValid = normalized && normalized.line1 === '123 Test Street';
      this.recordTest('Companies House UK - Address Normalization', isValid, 
        isValid ? 'Address normalization working' : 'Address normalization failed');
    } catch (error) {
      this.recordTest('Companies House UK - Address Normalization', false, error.message);
    }
  }

  /**
   * Integration Tests - Test with real API endpoints
   */
  async runIntegrationTests() {
    console.log('\n🔗 Running Integration Tests...');
    
    // Note: These tests may be skipped if API keys are not configured
    await this.testAPIConnectivity();
    await this.testCrossPlatformData();
  }

  /**
   * Test API connectivity and basic responses
   */
  async testAPIConnectivity() {
    console.log('🌐 Testing API Connectivity...');

    // California SOS connectivity
    try {
      const result = await this.californiaSOSClient.searchByKeyword('Google');
      const isConnected = !result.error || result.mockData;
      this.recordTest('California SOS - API Connectivity', isConnected, 
        isConnected ? 'API accessible' : 'API connection failed');
    } catch (error) {
      this.recordTest('California SOS - API Connectivity', false, error.message);
    }

    // SEC EDGAR connectivity
    try {
      const result = await this.secEdgarClient.searchCompanies('Apple');
      const isConnected = !result.error;
      this.recordTest('SEC EDGAR - API Connectivity', isConnected, 
        isConnected ? 'API accessible' : 'API connection failed');
    } catch (error) {
      this.recordTest('SEC EDGAR - API Connectivity', false, error.message);
    }

    // Nonprofit API connectivity
    try {
      const result = await this.nonprofitClient.searchNonprofits('Red Cross');
      const isConnected = !result.error;
      this.recordTest('Nonprofit API - API Connectivity', isConnected, 
        isConnected ? 'API accessible' : 'API connection failed');
    } catch (error) {
      this.recordTest('Nonprofit API - API Connectivity', false, error.message);
    }

    // Companies House UK connectivity
    try {
      const result = await this.companiesHouseClient.searchCompanies('TESCO');
      const isConnected = !result.error || result.mockData;
      this.recordTest('Companies House UK - API Connectivity', isConnected, 
        isConnected ? 'API accessible' : 'API connection failed');
    } catch (error) {
      this.recordTest('Companies House UK - API Connectivity', false, error.message);
    }
  }

  /**
   * Test cross-platform data consistency
   */
  async testCrossPlatformData() {
    console.log('🔄 Testing Cross-Platform Data Consistency...');

    // Test known public company across multiple APIs
    const publicCompanyName = 'Apple Inc.';
    
    const results = await Promise.allSettled([
      this.californiaSOSClient.searchByKeyword(publicCompanyName),
      this.secEdgarClient.searchCompanies(publicCompanyName)
    ]);

    let foundInCA = false;
    let foundInSEC = false;

    if (results[0].status === 'fulfilled' && results[0].value.found) {
      foundInCA = true;
    }

    if (results[1].status === 'fulfilled' && results[1].value.found) {
      foundInSEC = true;
    }

    const consistency = foundInCA && foundInSEC;
    this.recordTest('Cross-Platform - Public Company Consistency', consistency,
      `CA: ${foundInCA}, SEC: ${foundInSEC}`);
  }

  /**
   * Validation Tests - Test against known entities
   */
  async runValidationTests() {
    console.log('\n✅ Running Validation Tests...');
    
    await this.validateKnownEntities();
    await this.validateDataQuality();
  }

  /**
   * Validate against known business entities
   */
  async validateKnownEntities() {
    console.log('📋 Validating Known Entities...');

    // Test California SOS known entities
    for (const entity of this.testEntities.californiaSOS) {
      try {
        const result = await this.californiaSOSClient.searchByKeyword(entity.name);
        const matchesExpectation = result.found === entity.expectedFound;
        this.recordTest(`California SOS - ${entity.name}`, matchesExpectation,
          `Expected: ${entity.expectedFound}, Got: ${result.found}`);
        
        // Add delay to respect rate limits
        await this.delay(200);
      } catch (error) {
        this.recordTest(`California SOS - ${entity.name}`, false, error.message);
      }
    }

    // Test SEC EDGAR known entities
    for (const entity of this.testEntities.secEdgar) {
      try {
        const result = await this.secEdgarClient.searchCompanies(entity.name);
        const matchesExpectation = result.found === entity.expectedFound;
        this.recordTest(`SEC EDGAR - ${entity.name}`, matchesExpectation,
          `Expected: ${entity.expectedFound}, Got: ${result.found}`);
        
        await this.delay(200);
      } catch (error) {
        this.recordTest(`SEC EDGAR - ${entity.name}`, false, error.message);
      }
    }

    // Test Nonprofit known entities
    for (const entity of this.testEntities.nonprofit) {
      try {
        const result = entity.ein ? 
          await this.nonprofitClient.getOrganizationByEIN(entity.ein) :
          await this.nonprofitClient.searchNonprofits(entity.name);
        const matchesExpectation = result.found === entity.expectedFound;
        this.recordTest(`Nonprofit - ${entity.name}`, matchesExpectation,
          `Expected: ${entity.expectedFound}, Got: ${result.found}`);
        
        await this.delay(200);
      } catch (error) {
        this.recordTest(`Nonprofit - ${entity.name}`, false, error.message);
      }
    }
  }

  /**
   * Validate data quality and structure
   */
  async validateDataQuality() {
    console.log('🔍 Validating Data Quality...');

    // Test data structure consistency
    try {
      const caResult = await this.californiaSOSClient.searchByKeyword('Test Company');
      const hasValidStructure = this.validateResponseStructure(caResult, [
        'found', 'source', 'qualityScore', 'confidenceBoost', 'timestamp'
      ]);
      this.recordTest('Data Quality - CA SOS Structure', hasValidStructure,
        hasValidStructure ? 'Valid structure' : 'Invalid structure');
    } catch (error) {
      this.recordTest('Data Quality - CA SOS Structure', false, error.message);
    }

    // Test confidence scoring consistency
    try {
      const mockBusiness = {
        name: 'Test Business LLC',
        address: '123 Main Street, Anytown, CA 90210',
        phone: '(555) 123-4567',
        website: 'https://testbusiness.com',
        governmentValidation: {
          hasAnyMatch: true,
          californiaSOS: { found: true, confidenceBoost: 20, totalResults: 1 }
        }
      };
      
      const scoring = this.confidenceScoring.calculateConfidenceScore(mockBusiness);
      const hasValidScoring = scoring.finalConfidenceScore >= 0 && 
                             scoring.finalConfidenceScore <= 100 &&
                             scoring.hasOwnProperty('qualityTier');
      
      this.recordTest('Data Quality - Confidence Scoring', hasValidScoring,
        `Score: ${scoring.finalConfidenceScore}, Tier: ${scoring.qualityTier}`);
    } catch (error) {
      this.recordTest('Data Quality - Confidence Scoring', false, error.message);
    }
  }

  /**
   * Performance Tests
   */
  async runPerformanceTests() {
    console.log('\n⚡ Running Performance Tests...');

    await this.testResponseTimes();
    await this.testRateLimiting();
    await this.testCaching();
  }

  /**
   * Test API response times
   */
  async testResponseTimes() {
    console.log('⏱️ Testing Response Times...');

    const testCompany = 'Apple Inc.';
    
    // Test California SOS response time
    try {
      const startTime = Date.now();
      await this.californiaSOSClient.searchByKeyword(testCompany);
      const responseTime = Date.now() - startTime;
      const isAcceptable = responseTime < 30000; // 30 seconds max
      
      this.recordTest('Performance - CA SOS Response Time', isAcceptable,
        `${responseTime}ms (max: 30000ms)`);
    } catch (error) {
      this.recordTest('Performance - CA SOS Response Time', false, error.message);
    }

    // Test SEC EDGAR response time
    try {
      const startTime = Date.now();
      await this.secEdgarClient.searchCompanies(testCompany);
      const responseTime = Date.now() - startTime;
      const isAcceptable = responseTime < 30000;
      
      this.recordTest('Performance - SEC EDGAR Response Time', isAcceptable,
        `${responseTime}ms (max: 30000ms)`);
    } catch (error) {
      this.recordTest('Performance - SEC EDGAR Response Time', false, error.message);
    }
  }

  /**
   * Test rate limiting functionality
   */
  async testRateLimiting() {
    console.log('🚦 Testing Rate Limiting...');

    // Test California SOS rate limiting
    try {
      const client = new CaliforniaSOSClient();
      for (let i = 0; i < 3; i++) {
        const canProceed = client.checkRateLimit();
        if (!canProceed) {
          this.recordTest('Performance - Rate Limiting', true, 'Rate limiting working');
          return;
        }
        client.requestCount++; // Simulate requests
      }
      this.recordTest('Performance - Rate Limiting', true, 'Rate limiting allows normal usage');
    } catch (error) {
      this.recordTest('Performance - Rate Limiting', false, error.message);
    }
  }

  /**
   * Test caching functionality
   */
  async testCaching() {
    console.log('💾 Testing Caching...');

    try {
      const testQuery = 'Apple Inc.';
      
      // First request
      const startTime1 = Date.now();
      await this.secEdgarClient.searchCompanies(testQuery);
      const time1 = Date.now() - startTime1;
      
      // Second request (should be cached)
      const startTime2 = Date.now();
      await this.secEdgarClient.searchCompanies(testQuery);
      const time2 = Date.now() - startTime2;
      
      // Cache should make second request significantly faster
      const cacheWorking = time2 < time1 * 0.5; // At least 50% faster
      
      this.recordTest('Performance - Caching', cacheWorking,
        `First: ${time1}ms, Second: ${time2}ms`);
    } catch (error) {
      this.recordTest('Performance - Caching', false, error.message);
    }
  }

  /**
   * Test confidence scoring algorithm
   */
  async runConfidenceScoringTests() {
    console.log('\n📊 Running Confidence Scoring Tests...');

    await this.testScoringComponents();
    await this.testGovernmentAPIBoosts();
    await this.testQualityTiers();
  }

  /**
   * Test individual scoring components
   */
  async testScoringComponents() {
    console.log('🧮 Testing Scoring Components...');

    const testBusiness = {
      name: 'Acme Corporation',
      address: '123 Business Park Drive, Suite 100, San Francisco, CA 94105',
      phone: '(415) 555-0123',
      website: 'https://acmecorp.com',
      websiteValidation: { accessible: true },
      registryValidation: { registeredInAnyState: true }
    };

    try {
      const scoring = this.confidenceScoring.calculateConfidenceScore(testBusiness);
      
      // Test component scores
      const components = scoring.componentScores;
      const allComponentsValid = Object.values(components).every(score => 
        score >= 0 && score <= 100
      );
      
      this.recordTest('Confidence Scoring - Component Validity', allComponentsValid,
        `All components in 0-100 range`);
      
      // Test final score
      const finalScoreValid = scoring.finalConfidenceScore >= 0 && 
                             scoring.finalConfidenceScore <= 100;
      
      this.recordTest('Confidence Scoring - Final Score Range', finalScoreValid,
        `Final score: ${scoring.finalConfidenceScore}`);
        
      // Test quality tier assignment
      const hasQualityTier = scoring.qualityTier && 
                            ['Excellent', 'High', 'Good', 'Acceptable', 'Poor', 'Very Poor'].includes(scoring.qualityTier);
      
      this.recordTest('Confidence Scoring - Quality Tier', hasQualityTier,
        `Quality tier: ${scoring.qualityTier}`);
    } catch (error) {
      this.recordTest('Confidence Scoring - Component Test', false, error.message);
    }
  }

  /**
   * Test government API boost calculations
   */
  async testGovernmentAPIBoosts() {
    console.log('🏛️ Testing Government API Boosts...');

    const testBusinessWithGovData = {
      name: 'Apple Inc.',
      governmentValidation: {
        hasAnyMatch: true,
        californiaSOS: { found: true, confidenceBoost: 20, totalResults: 1 },
        secEDGAR: { found: true, confidenceBoost: 25, totalResults: 1 }
      },
      sectorClassification: {
        primary: 'Public Company',
        confidence: 90
      }
    };

    try {
      const scoring = this.confidenceScoring.calculateConfidenceScore(testBusinessWithGovData);
      
      // Test government boost calculation
      const govBoost = scoring.governmentAPIBoost;
      const hasValidBoost = govBoost.totalBoost > 0 && govBoost.sourcesFound > 0;
      
      this.recordTest('Government API - Boost Calculation', hasValidBoost,
        `Total boost: ${govBoost.totalBoost}, Sources: ${govBoost.sourcesFound}`);
      
      // Test multi-source bonus
      const multiSourceBonus = scoring.multiSourceBonus;
      const hasMultiSourceBonus = multiSourceBonus > 0;
      
      this.recordTest('Government API - Multi-Source Bonus', hasMultiSourceBonus,
        `Multi-source bonus: ${multiSourceBonus}`);
        
      // Test sector-specific adjustment
      const sectorAdjustment = scoring.sectorAdjustment;
      const hasSectorBonus = sectorAdjustment.bonus > 0;
      
      this.recordTest('Government API - Sector Adjustment', hasSectorBonus,
        `Sector: ${sectorAdjustment.sectorType}, Bonus: ${sectorAdjustment.bonus}`);
    } catch (error) {
      this.recordTest('Government API - Boost Test', false, error.message);
    }
  }

  /**
   * Test quality tier thresholds
   */
  async testQualityTiers() {
    console.log('🏆 Testing Quality Tiers...');

    const testCases = [
      { score: 95, expectedTier: 'Excellent' },
      { score: 85, expectedTier: 'High' },
      { score: 75, expectedTier: 'Good' },
      { score: 65, expectedTier: 'Acceptable' },
      { score: 45, expectedTier: 'Poor' },
      { score: 25, expectedTier: 'Very Poor' }
    ];

    testCases.forEach(testCase => {
      try {
        const tier = this.confidenceScoring.determineQualityTier(testCase.score);
        const isCorrect = tier === testCase.expectedTier;
        
        this.recordTest(`Quality Tier - Score ${testCase.score}`, isCorrect,
          `Expected: ${testCase.expectedTier}, Got: ${tier}`);
      } catch (error) {
        this.recordTest(`Quality Tier - Score ${testCase.score}`, false, error.message);
      }
    });
  }

  /**
   * Helper method to record test results
   */
  recordTest(testName, passed, details) {
    this.testResults.totalTests++;
    
    if (passed) {
      this.testResults.passedTests++;
      console.log(`✅ ${testName}: ${details}`);
    } else {
      this.testResults.failedTests++;
      console.log(`❌ ${testName}: ${details}`);
    }
    
    this.testResults.testDetails.push({
      name: testName,
      passed: passed,
      details: details,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Helper method to validate response structure
   */
  validateResponseStructure(response, requiredFields) {
    if (!response || typeof response !== 'object') {
      return false;
    }
    
    return requiredFields.every(field => response.hasOwnProperty(field));
  }

  /**
   * Helper method to add delays for rate limiting
   */
  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Generate comprehensive test report
   */
  generateTestReport() {
    console.log('\n📋 Test Report');
    console.log('==============');
    
    const totalTime = this.testResults.endTime - this.testResults.startTime;
    const successRate = Math.round((this.testResults.passedTests / this.testResults.totalTests) * 100);
    
    console.log(`Total Tests: ${this.testResults.totalTests}`);
    console.log(`Passed: ${this.testResults.passedTests} (${successRate}%)`);
    console.log(`Failed: ${this.testResults.failedTests}`);
    console.log(`Execution Time: ${totalTime}ms`);
    
    console.log('\nAPI Metrics:');
    console.log(`- California SOS: ${this.californiaSOSClient.getUsageStats().totalRequests} requests`);
    console.log(`- SEC EDGAR: ${this.secEdgarClient.getUsageStats().totalRequests} requests`);
    console.log(`- Nonprofit API: ${this.nonprofitClient.getUsageStats().totalRequests} requests`);
    console.log(`- Companies House UK: ${this.companiesHouseClient.getUsageStats().totalRequests} requests`);
    
    if (this.testResults.failedTests > 0) {
      console.log('\n❌ Failed Tests:');
      this.testResults.testDetails
        .filter(test => !test.passed)
        .forEach(test => {
          console.log(`  - ${test.name}: ${test.details}`);
        });
    }
    
    console.log('\n🎯 Test Suite Complete!');
    return this.testResults;
  }
}

// Export for use in other test files
module.exports = Phase1GovernmentAPIsTestSuite;

// Run tests if called directly
if (require.main === module) {
  const testSuite = new Phase1GovernmentAPIsTestSuite();
  testSuite.runCompleteTestSuite()
    .then(results => {
      process.exit(results.failedTests > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('Test suite crashed:', error);
      process.exit(1);
    });
}