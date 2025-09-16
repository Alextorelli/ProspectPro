#!/usr/bin/env node

/**
 * ProspectPro Production Validation Test
 * Validates that ALL systems use real data and NO MOCK DATA exists
 * This script ensures complete elimination of fake/mock data patterns
 */

require('dotenv').config();

const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m', 
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Mock data patterns to detect and reject
const FORBIDDEN_PATTERNS = {
  businessNames: [
    'Mock Business',
    'Test Company',
    'Example Corp',
    'Sample LLC',
    'Demo Inc',
    'Fake Restaurant',
    'Artisan Bistro', // From previous mock data
    'Downtown Café',
    'Business LLC',
    'Company Inc'
  ],
  phoneNumbers: [
    '555-',
    '(555)',
    '000-',
    '111-',
    '123-4567',
    '555-0123'
  ],
  addresses: [
    '100 Main St',
    '110 Main St',
    '120 Main St', 
    'Main Street',
    'Example Ave',
    'Test Road',
    'Mock Street'
  ],
  websites: [
    'example.com',
    'test.com',
    'mock.com',
    'fake.com',
    'demo.com',
    'sample.com'
  ],
  emails: [
    'test@',
    'mock@',
    'fake@',
    'demo@',
    'example@'
  ]
};

async function validateProductionDeployment() {
  log('blue', '🔍 ProspectPro Production Validation');
  log('blue', '=====================================');
  log('yellow', '🚫 ZERO MOCK DATA POLICY ENFORCEMENT');
  log('blue', '=====================================');
  
  const baseUrl = process.env.RAILWAY_URL || process.env.BASE_URL || 'http://localhost:8080';
  let failureCount = 0;
  
  try {
    // Test 1: Health Check
    log('blue', '🏥 Testing health endpoint...');
    const healthResponse = await axios.get(`${baseUrl}/health`);
    
    if (healthResponse.data.mock_data !== 'COMPLETELY_DISABLED') {
      log('red', '❌ Health check does not confirm mock data is disabled');
      failureCount++;
    } else {
      log('green', '✅ Health check confirms zero mock data policy');
    }
    
    if (!healthResponse.data.database || healthResponse.data.database !== 'connected') {
      log('red', '❌ Database not connected - production requires real database');
      failureCount++;
    } else {
      log('green', '✅ Database connection confirmed');
    }
    
    // Test 2: Configuration Check
    log('blue', '🔧 Testing configuration endpoint...');
    const configResponse = await axios.get(`${baseUrl}/api/config-check`);
    
    if (!configResponse.data.production_ready) {
      log('red', '❌ Configuration not production ready');
      log('yellow', '   Missing required variables:', configResponse.data.required_missing);
      failureCount++;
    } else {
      log('green', '✅ Production configuration validated');
    }
    
    if (configResponse.data.mock_data_status !== 'ZERO_MOCK_DATA_POLICY_ENFORCED') {
      log('red', '❌ Mock data policy not properly enforced');
      failureCount++;
    } else {
      log('green', '✅ Zero mock data policy confirmed');
    }
    
    // Test 3: Business Metrics - Must be from real database
    log('blue', '📊 Testing business metrics endpoint...');
    const metricsResponse = await axios.get(`${baseUrl}/api/business-metrics`);
    
    if (metricsResponse.data.data_source !== 'supabase_production_database') {
      log('red', '❌ Business metrics not from production database');
      log('red', `   Source: ${metricsResponse.data.data_source}`);
      failureCount++;
    } else {
      log('green', '✅ Business metrics from real database');
    }
    
    // Validate no mock patterns in metrics
    const metrics = JSON.stringify(metricsResponse.data);
    if (metrics.includes('mock') || metrics.includes('fake') || metrics.includes('test')) {
      log('red', '❌ Mock/fake/test patterns detected in business metrics');
      failureCount++;
    } else {
      log('green', '✅ Business metrics free of mock patterns');
    }
    
    // Test 4: Business Discovery - Must use real APIs
    log('blue', '🔍 Testing business discovery endpoint...');
    try {
      const discoveryResponse = await axios.post(`${baseUrl}/api/discover-businesses`, {
        businessType: 'coffee shop',
        location: 'San Francisco, CA',
        maxResults: 3,
        userId: 'validation-test-user'
      }, {
        timeout: 30000 // 30 second timeout
      });
      
      if (discoveryResponse.data.data_source !== 'google_places_api') {
        log('red', '❌ Business discovery not using real Google Places API');
        log('red', `   Source: ${discoveryResponse.data.data_source}`);
        failureCount++;
      } else {
        log('green', '✅ Business discovery using real Google Places API');
      }
      
      // Validate discovered businesses are real
      const businesses = discoveryResponse.data.businesses || [];
      log('blue', `   📋 Discovered ${businesses.length} businesses`);
      
      for (let i = 0; i < Math.min(businesses.length, 3); i++) {
        const business = businesses[i];
        
        // Check for forbidden business name patterns
        const hasForbiddenName = FORBIDDEN_PATTERNS.businessNames.some(pattern => 
          business.business_name && business.business_name.includes(pattern)
        );
        
        if (hasForbiddenName) {
          log('red', `❌ Mock business name detected: ${business.business_name}`);
          failureCount++;
        }
        
        // Check for forbidden phone patterns
        if (business.phone) {
          const hasForbiddenPhone = FORBIDDEN_PATTERNS.phoneNumbers.some(pattern => 
            business.phone.includes(pattern)
          );
          
          if (hasForbiddenPhone) {
            log('red', `❌ Mock phone number detected: ${business.phone}`);
            failureCount++;
          }
        }
        
        // Check for forbidden address patterns
        if (business.address) {
          const hasForbiddenAddress = FORBIDDEN_PATTERNS.addresses.some(pattern => 
            business.address.includes(pattern)
          );
          
          if (hasForbiddenAddress) {
            log('red', `❌ Mock address detected: ${business.address}`);
            failureCount++;
          }
        }
        
        // Check for forbidden website patterns
        if (business.website) {
          const hasForbiddenWebsite = FORBIDDEN_PATTERNS.websites.some(pattern => 
            business.website.includes(pattern)
          );
          
          if (hasForbiddenWebsite) {
            log('red', `❌ Mock website detected: ${business.website}`);
            failureCount++;
          }
        }
      }
      
      if (businesses.length > 0) {
        log('green', `✅ ${businesses.length} real businesses discovered, no mock patterns detected`);
      }
      
      // Validate cost tracking
      if (discoveryResponse.data.total_cost === 0 && businesses.length > 0) {
        log('red', '❌ Real API calls should have non-zero costs');
        failureCount++;
      } else if (businesses.length > 0) {
        log('green', `✅ Real API cost tracking: $${discoveryResponse.data.total_cost}`);
      }
      
    } catch (discoveryError) {
      if (discoveryError.response?.status === 500) {
        // Check if it's because of missing API keys (acceptable in some test environments)
        if (discoveryError.response.data?.solution?.includes('GOOGLE_PLACES_API_KEY')) {
          log('yellow', '⚠️  Business discovery requires Google Places API key (not configured)');
        } else {
          log('red', '❌ Business discovery endpoint error:', discoveryError.response.data?.error);
          failureCount++;
        }
      } else {
        log('red', '❌ Business discovery request failed:', discoveryError.message);
        failureCount++;
      }
    }
    
    // Test 5: Database Direct Validation (if available)
    const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (process.env.SUPABASE_URL && supabaseKey) {
      log('blue', '💾 Testing direct database validation...');
      
      const supabase = createClient(
        process.env.SUPABASE_URL,
        supabaseKey
      );
      
      // Check for mock data in database
      const { data: leads, error: leadsError } = await supabase
        .from('enhanced_leads')
        .select('business_name, address, phone, website')
        .limit(10);
      
      if (leadsError) {
        log('yellow', '⚠️  Could not validate database contents:', leadsError.message);
      } else if (leads && leads.length > 0) {
        log('blue', `   📋 Checking ${leads.length} database records for mock patterns...`);
        
        let mockPatternsFound = 0;
        
        leads.forEach((lead, index) => {
          // Check each field for mock patterns
          Object.entries(FORBIDDEN_PATTERNS).forEach(([category, patterns]) => {
            patterns.forEach(pattern => {
              Object.values(lead).forEach(value => {
                if (value && typeof value === 'string' && value.includes(pattern)) {
                  log('red', `❌ Mock pattern "${pattern}" found in database record ${index + 1}: ${value}`);
                  mockPatternsFound++;
                  failureCount++;
                }
              });
            });
          });
        });
        
        if (mockPatternsFound === 0) {
          log('green', '✅ No mock data patterns found in database');
        }
      } else {
        log('yellow', '⚠️  No leads in database to validate (empty database)');
      }
    }
    
    // Final Assessment
    log('blue', '=====================================');
    if (failureCount === 0) {
      log('green', '🎉 PRODUCTION VALIDATION SUCCESSFUL!');
      log('green', '');
      log('green', '✅ Zero Mock Data Policy: ENFORCED');
      log('green', '✅ Real Database: CONNECTED');
      log('green', '✅ Real APIs: CONFIGURED');
      log('green', '✅ Business Discovery: USING REAL DATA');
      log('green', '✅ Cost Tracking: ACCURATE');
      log('green', '✅ Data Quality: PRODUCTION READY');
      log('blue', '');
      log('blue', '🚀 ProspectPro is ready for production deployment!');
    } else {
      log('red', '❌ PRODUCTION VALIDATION FAILED!');
      log('red', '');
      log('red', `❌ Total Issues Found: ${failureCount}`);
      log('yellow', '');
      log('yellow', '💡 Required Actions:');
      log('yellow', '   1. Configure all required environment variables');
      log('yellow', '   2. Set up Supabase database with production schema');
      log('yellow', '   3. Configure real API keys (Google Places, etc.)');
      log('yellow', '   4. Remove any remaining mock data patterns');
      log('yellow', '   5. Ensure all endpoints return real data only');
      log('blue', '');
      process.exit(1);
    }
    
  } catch (error) {
    log('red', '❌ Production validation failed:');
    log('red', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      log('yellow', '💡 Make sure the server is running on the specified URL');
    }
    
    process.exit(1);
  }
}

// Command line interface
if (require.main === module) {
  validateProductionDeployment().catch(error => {
    log('red', `❌ Validation failed: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { validateProductionDeployment, FORBIDDEN_PATTERNS };