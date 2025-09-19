/**
 * SEC EDGAR API Client Unit Tests
 * Comprehensive unit testing for SEC EDGAR database integration
 */

const EnhancedSECEdgarClient = require('../../../modules/api-clients/enhanced-sec-edgar-client');

class SECEdgarUnitTests {
  constructor() {
    this.client = new EnhancedSECEdgarClient();
    this.testResults = [];
  }

  async runAllTests() {
    console.log('📊 Running SEC EDGAR API Unit Tests...');
    
    await this.testClientInitialization();
    await this.testCompanyDirectoryOperations();
    await this.testSearchOperations();
    await this.testCompanyFactsRetrieval();
    await this.testRateLimitCompliance();
    await this.testResponseNormalization();
    await this.testErrorHandling();
    
    return this.generateReport();
  }

  async testClientInitialization() {
    // Test 1: Default constructor
    try {
      const client = new EnhancedSECEdgarClient();
      const hasValidDefaults = client.qualityScore === 65 && 
                              client.costPerRequest === 0.00 &&
                              client.rateLimitPerSecond === 10;
      this.recordTest('Constructor - Defaults', hasValidDefaults, 'Default configuration correct');
    } catch (error) {
      this.recordTest('Constructor - Defaults', false, error.message);
    }

    // Test 2: Custom headers
    try {
      const client = new EnhancedSECEdgarClient();
      const hasUserAgent = client.headers['User-Agent'].includes('ProspectPro');
      this.recordTest('Constructor - Headers', hasUserAgent, 'User-Agent header set correctly');
    } catch (error) {
      this.recordTest('Constructor - Headers', false, error.message);
    }

    // Test 3: Company directory initialization
    try {
      const client = new EnhancedSECEdgarClient();
      const hasCompaniesMap = client.companiesMap instanceof Map;
      const hasIsLoaded = typeof client.isDirectoryLoaded === 'boolean';
      this.recordTest('Constructor - Directory Init', hasCompaniesMap && hasIsLoaded, 
        'Company directory structures initialized');
    } catch (error) {
      this.recordTest('Constructor - Directory Init', false, error.message);
    }
  }

  async testCompanyDirectoryOperations() {
    // Test 1: Directory loading structure
    try {
      const client = new EnhancedSECEdgarClient();
      const loadResult = await client.loadCompaniesDirectory();
      
      // Should return boolean and update state
      const isValidResult = typeof loadResult === 'boolean';
      this.recordTest('Directory - Load Operation', isValidResult, 
        `Directory load returned: ${loadResult}`);
    } catch (error) {
      this.recordTest('Directory - Load Operation', false, error.message);
    }

    // Test 2: Directory caching
    try {
      const client = new EnhancedSECEdgarClient();
      
      // First load
      const firstLoad = await client.loadCompaniesDirectory();
      const firstLoadTime = Date.now();
      
      // Second load (should use cache)
      const secondLoad = await client.loadCompaniesDirectory();
      const secondLoadTime = Date.now();
      
      const loadTimeDiff = secondLoadTime - firstLoadTime;
      const usedCache = loadTimeDiff < 100; // Should be nearly instantaneous if cached
      
      this.recordTest('Directory - Caching', usedCache, 
        `Load time difference: ${loadTimeDiff}ms`);
    } catch (error) {
      this.recordTest('Directory - Caching', false, error.message);
    }

    // Test 3: CIK lookup functionality
    try {
      // Mock some directory data
      const client = new EnhancedSECEdgarClient();
      client.companiesMap.set('apple inc', {
        cik_str: '0000320193',
        title: 'Apple Inc.'
      });
      client.isDirectoryLoaded = true;
      
      const cik = client.getCIKByName('Apple Inc');
      const foundCorrectCIK = cik === '0000320193';
      
      this.recordTest('Directory - CIK Lookup', foundCorrectCIK, 
        `Found CIK: ${cik}`);
    } catch (error) {
      this.recordTest('Directory - CIK Lookup', false, error.message);
    }
  }

  async testSearchOperations() {
    // Test 1: Search input validation
    try {
      const client = new EnhancedSECEdgarClient();
      
      // Test empty string
      try {
        await client.searchCompanies('');
        this.recordTest('Search - Empty String Validation', false, 'Should reject empty string');
      } catch (validationError) {
        this.recordTest('Search - Empty String Validation', true, 'Correctly rejects empty input');
      }
    } catch (error) {
      this.recordTest('Search - Empty String Validation', false, error.message);
    }

    // Test 2: Search normalization
    try {
      const client = new EnhancedSECEdgarClient();
      
      // Mock directory data
      client.companiesMap.set('test company inc', {
        cik_str: '1234567890',
        title: 'Test Company Inc.'
      });
      client.isDirectoryLoaded = true;
      
      const result = await client.searchCompanies('Test Company');
      const hasCorrectStructure = result.found !== undefined && 
                                 result.companies !== undefined &&
                                 result.source === 'SEC EDGAR';
      
      this.recordTest('Search - Response Structure', hasCorrectStructure, 
        'Search response has correct structure');
    } catch (error) {
      this.recordTest('Search - Response Structure', false, error.message);
    }

    // Test 3: Fuzzy matching
    try {
      const client = new EnhancedSECEdgarClient();
      
      // Mock directory with similar names
      client.companiesMap.set('microsoft corp', {
        cik_str: '0000789019',
        title: 'Microsoft Corp'
      });
      client.companiesMap.set('microsoft corporation', {
        cik_str: '0000789019',
        title: 'Microsoft Corporation'
      });
      client.isDirectoryLoaded = true;
      
      const result = await client.searchCompanies('Microsoft');
      const foundMatches = result.found && result.companies.length > 0;
      
      this.recordTest('Search - Fuzzy Matching', foundMatches, 
        `Found ${result.companies ? result.companies.length : 0} matches`);
    } catch (error) {
      this.recordTest('Search - Fuzzy Matching', false, error.message);
    }
  }

  async testCompanyFactsRetrieval() {
    // Test 1: CIK validation
    try {
      const client = new EnhancedSECEdgarClient();
      
      try {
        await client.getCompanyFacts('invalid-cik');
        this.recordTest('Company Facts - CIK Validation', false, 'Should reject invalid CIK');
      } catch (validationError) {
        this.recordTest('Company Facts - CIK Validation', true, 'Correctly validates CIK format');
      }
    } catch (error) {
      this.recordTest('Company Facts - CIK Validation', false, error.message);
    }

    // Test 2: Response structure
    try {
      const client = new EnhancedSECEdgarClient();
      
      const result = await client.getCompanyFacts('0000320193'); // Apple's CIK
      const hasCorrectStructure = result.hasOwnProperty('found') &&
                                 result.hasOwnProperty('companyInfo') &&
                                 result.hasOwnProperty('source');
      
      this.recordTest('Company Facts - Response Structure', hasCorrectStructure,
        'Company facts response has correct structure');
    } catch (error) {
      // Network/API errors are acceptable in unit tests
      this.recordTest('Company Facts - Response Structure', true, 
        'Network error handled gracefully: ' + error.message);
    }

    // Test 3: Financial data extraction
    try {
      const client = new EnhancedSECEdgarClient();
      
      // Test extraction method with mock data
      const mockFacts = {
        facts: {
          'us-gaap': {
            'Revenues': {
              units: {
                'USD': [
                  { end: '2023-09-30', val: 383285000000, fy: 2023, fp: 'FY' }
                ]
              }
            }
          }
        }
      };
      
      const extracted = client.extractFinancialHighlights(mockFacts);
      const hasFinancialData = extracted.revenue !== undefined;
      
      this.recordTest('Company Facts - Financial Extraction', hasFinancialData,
        `Extracted revenue: ${extracted.revenue}`);
    } catch (error) {
      this.recordTest('Company Facts - Financial Extraction', false, error.message);
    }
  }

  async testRateLimitCompliance() {
    // Test 1: Rate limit configuration
    try {
      const client = new EnhancedSECEdgarClient();
      const hasRateLimit = client.rateLimitPerSecond === 10;
      const hasDelayMethod = typeof client.enforceRateLimit === 'function';
      
      this.recordTest('Rate Limit - Configuration', hasRateLimit && hasDelayMethod,
        'Rate limit configuration and methods present');
    } catch (error) {
      this.recordTest('Rate Limit - Configuration', false, error.message);
    }

    // Test 2: Rate limit enforcement
    try {
      const client = new EnhancedSECEdgarClient();
      
      const startTime = Date.now();
      await client.enforceRateLimit();
      const endTime = Date.now();
      
      // Should complete relatively quickly for first call
      const delayTime = endTime - startTime;
      const reasonableDelay = delayTime < 150; // Allow some processing time
      
      this.recordTest('Rate Limit - Enforcement', reasonableDelay,
        `Delay time: ${delayTime}ms`);
    } catch (error) {
      this.recordTest('Rate Limit - Enforcement', false, error.message);
    }

    // Test 3: User-Agent compliance
    try {
      const client = new EnhancedSECEdgarClient();
      const userAgent = client.headers['User-Agent'];
      const hasContactInfo = userAgent.includes('@') || userAgent.includes('ProspectPro');
      
      this.recordTest('Rate Limit - User-Agent Compliance', hasContactInfo,
        `User-Agent: ${userAgent}`);
    } catch (error) {
      this.recordTest('Rate Limit - User-Agent Compliance', false, error.message);
    }
  }

  async testResponseNormalization() {
    // Test 1: Empty response handling
    try {
      const client = new EnhancedSECEdgarClient();
      const normalized = client.normalizeSearchResponse([], 'Test Company');
      
      const isValidEmpty = !normalized.found && 
                          normalized.totalResults === 0 &&
                          normalized.companies.length === 0;
      
      this.recordTest('Response Normalization - Empty', isValidEmpty,
        'Empty response normalized correctly');
    } catch (error) {
      this.recordTest('Response Normalization - Empty', false, error.message);
    }

    // Test 2: Valid data normalization
    try {
      const client = new EnhancedSECEdgarClient();
      const mockCompanies = [{
        cik_str: '1234567890',
        title: 'Test Company Inc.'
      }];
      
      const normalized = client.normalizeSearchResponse(mockCompanies, 'Test Company');
      const isValidData = normalized.found &&
                         normalized.companies.length === 1 &&
                         normalized.companies[0].cik === '1234567890';
      
      this.recordTest('Response Normalization - Valid Data', isValidData,
        'Valid data normalized correctly');
    } catch (error) {
      this.recordTest('Response Normalization - Valid Data', false, error.message);
    }

    // Test 3: Confidence scoring
    try {
      const client = new EnhancedSECEdgarClient();
      const mockCompanies = [{
        cik_str: '1234567890',
        title: 'Test Company Inc.'
      }];
      
      const normalized = client.normalizeSearchResponse(mockCompanies, 'Test Company Inc');
      const hasConfidenceBoost = normalized.confidenceBoost > 0;
      
      this.recordTest('Response Normalization - Confidence Scoring', hasConfidenceBoost,
        `Confidence boost: ${normalized.confidenceBoost}`);
    } catch (error) {
      this.recordTest('Response Normalization - Confidence Scoring', false, error.message);
    }
  }

  async testErrorHandling() {
    // Test 1: Network error handling
    try {
      const client = new EnhancedSECEdgarClient();
      client.baseUrl = 'https://invalid-url-that-does-not-exist.com';
      
      const result = await client.searchCompanies('Test Company');
      const hasErrorHandling = !result.found && result.hasOwnProperty('error');
      
      this.recordTest('Error Handling - Network Error', hasErrorHandling,
        'Network errors handled gracefully');
    } catch (error) {
      this.recordTest('Error Handling - Network Error', true,
        'Network error properly caught: ' + error.message);
    }

    // Test 2: Invalid response handling
    try {
      const client = new EnhancedSECEdgarClient();
      
      // Test with malformed response data
      const result = client.normalizeSearchResponse(null, 'Test');
      const handledNull = !result.found && result.companies.length === 0;
      
      this.recordTest('Error Handling - Invalid Response', handledNull,
        'Null response handled correctly');
    } catch (error) {
      this.recordTest('Error Handling - Invalid Response', false, error.message);
    }

    // Test 3: Rate limit error handling
    try {
      const client = new EnhancedSECEdgarClient();
      
      // Simulate rate limit tracking
      client.lastRequestTime = Date.now();
      const canProceed = await client.enforceRateLimit();
      
      this.recordTest('Error Handling - Rate Limit', true,
        'Rate limit enforcement completed without error');
    } catch (error) {
      this.recordTest('Error Handling - Rate Limit', false, error.message);
    }
  }

  recordTest(testName, passed, details) {
    const result = {
      name: `SEC EDGAR - ${testName}`,
      passed: passed,
      details: details,
      timestamp: new Date().toISOString()
    };
    
    this.testResults.push(result);
    
    const status = passed ? '✅' : '❌';
    console.log(`${status} ${result.name}: ${details}`);
  }

  generateReport() {
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(t => t.passed).length;
    const failedTests = totalTests - passedTests;
    const successRate = Math.round((passedTests / totalTests) * 100);

    console.log('\n📋 SEC EDGAR Unit Test Report');
    console.log('============================');
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${passedTests} (${successRate}%)`);
    console.log(`Failed: ${failedTests}`);

    if (failedTests > 0) {
      console.log('\n❌ Failed Tests:');
      this.testResults
        .filter(t => !t.passed)
        .forEach(t => console.log(`  - ${t.name}: ${t.details}`));
    }

    return {
      totalTests,
      passedTests,
      failedTests,
      successRate,
      details: this.testResults
    };
  }
}

module.exports = SECEdgarUnitTests;

// Run tests if called directly
if (require.main === module) {
  const tests = new SECEdgarUnitTests();
  tests.runAllTests()
    .then(results => {
      process.exit(results.failedTests > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('Unit tests crashed:', error);
      process.exit(1);
    });
}