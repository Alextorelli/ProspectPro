#!/usr/bin/env node

/**
 * Environment Validation Script
 * Validates all required environment variables and API connections
 * before Railway deployment to prevent runtime failures
 */

require('dotenv').config();

const https = require('https');
const http = require('http');

// Colors for logging
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

// Security: Check for exposed secrets
function validateSecretSecurity() {
  log('blue', '🔒 Validating secret security...');
  
  const securityIssues = [];
  
  // Check for exposed secrets in environment
  const sensitiveKeys = [
    'SUPABASE_SECRET_KEY',
    'SUPABASE_SERVICE_ROLE_KEY', 
    'GOOGLE_PLACES_API_KEY', 
    'HUNTER_IO_API_KEY',
    'NEVERBOUNCE_API_KEY'
  ];
  
  sensitiveKeys.forEach(key => {
    const value = process.env[key];
    if (value) {
      // Check if key is properly formatted (not truncated or malformed)
      if (key.includes('SUPABASE') && !value.startsWith('sb_')) {
        securityIssues.push(`${key} should use new sb_secret_ format, not JWT`);
      }
      
      // Check if key looks like a placeholder
      if (value.includes('your_') || value.includes('example') || value === 'xxx') {
        securityIssues.push(`${key} appears to be a placeholder, not real key`);
      }
      
      log('green', `✅ ${key}: Configured (${value.substring(0, 8)}...)`);
    }
  });
  
  if (securityIssues.length > 0) {
    log('red', '❌ Security issues found:');
    securityIssues.forEach(issue => log('red', `   - ${issue}`));
    return false;
  }
  
  log('green', '✅ All secrets properly formatted and secured');
  return true;
}

// Validate required environment variables
function validateEnvironment() {
  log('blue', '📋 Validating environment variables...');
  
  const required = {
    'NODE_ENV': 'production',
    'PORT': '8080',
    'SUPABASE_URL': null,
    'SUPABASE_SERVICE_ROLE_KEY': null,
    'GOOGLE_PLACES_API_KEY': null
  };
  
  const optional = [
    'HUNTER_IO_API_KEY',
    'SCRAPINGDOG_API_KEY', 
    'NEVERBOUNCE_API_KEY',
    'RAILWAY_STATIC_URL',
    'RAILWAY_PUBLIC_DOMAIN'
  ];
  
  const missing = [];
  
  // Check required variables
  Object.entries(required).forEach(([key, expectedValue]) => {
    const value = process.env[key];
    if (!value) {
      missing.push(key);
    } else if (expectedValue && value !== expectedValue) {
      log('yellow', `⚠️  ${key}: Expected '${expectedValue}', got '${value}'`);
    } else {
      log('green', `✅ ${key}: ${value}`);
    }
  });
  
  // Check optional variables
  optional.forEach(key => {
    const value = process.env[key];
    if (value) {
      log('green', `✅ ${key}: Configured`);
    } else {
      log('yellow', `⚠️  ${key}: Not configured (optional)`);
    }
  });
  
  if (missing.length > 0) {
    log('red', '❌ Missing required environment variables:');
    missing.forEach(key => log('red', `   - ${key}`));
    return false;
  }
  
  return true;
}

// Test Supabase connection with proper error handling
async function testSupabaseConnection() {
  log('blue', '🔌 Testing Supabase connection...');
  
  try {
    const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!process.env.SUPABASE_URL || !supabaseKey) {
      throw new Error('Supabase credentials not configured');
    }
    
    // Import Supabase client
    const { createClient } = require('@supabase/supabase-js');
    
    const supabase = createClient(
      process.env.SUPABASE_URL,
      supabaseKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
    
    // Test database connection
    const { data, error } = await supabase
      .from('campaigns')
      .select('count')
      .limit(1);
    
    if (error) throw error;
    
    log('green', '✅ Supabase connection successful');
    return true;
    
  } catch (error) {
    log('red', `❌ Supabase connection failed: ${error.message}`);
    return false;
  }
}

// Test Google Places API connection
async function testGooglePlacesAPI() {
  log('blue', '🌍 Testing Google Places API...');
  
  try {
    if (!process.env.GOOGLE_PLACES_API_KEY) {
      log('yellow', '⚠️  Google Places API key not configured');
      return false;
    }
    
    const { Client } = require('@googlemaps/google-maps-services-js');
    const client = new Client({});
    
    // Simple test query
    const response = await client.textSearch({
      params: {
        query: 'restaurant in New York',
        key: process.env.GOOGLE_PLACES_API_KEY,
        type: 'establishment'
      },
      timeout: 10000
    });
    
    if (response.data.status !== 'OK' && response.data.status !== 'ZERO_RESULTS') {
      throw new Error(`Google Places API error: ${response.data.status}`);
    }
    
    log('green', `✅ Google Places API connection successful (status: ${response.data.status})`);
    return true;
    
  } catch (error) {
    log('red', `❌ Google Places API test failed: ${error.message}`);
    return false;
  }
}

// Test network connectivity for Railway deployment
async function testNetworkConnectivity() {
  log('blue', '🌐 Testing network connectivity...');
  
  const testUrls = [
    'https://api.supabase.com',
    'https://maps.googleapis.com',
    'https://api.hunter.io'
  ];
  
  const results = [];
  
  for (const url of testUrls) {
    try {
      const response = await fetch(url, { 
        method: 'HEAD',
        timeout: 5000
      });
      
      log('green', `✅ ${url}: Accessible (${response.status})`);
      results.push(true);
      
    } catch (error) {
      log('red', `❌ ${url}: ${error.message}`);
      results.push(false);
    }
  }
  
  const successRate = (results.filter(r => r).length / results.length) * 100;
  log('blue', `🌐 Network connectivity: ${successRate}% success rate`);
  
  return successRate >= 66; // Require at least 2/3 services accessible
}

// Main validation function
async function validateEnvironment() {
  console.log('🚀 ProspectPro Environment Validation');
  console.log('===================================');
  
  const checks = [
    { name: 'Secret Security', test: validateSecretSecurity },
    { name: 'Environment Variables', test: validateEnvironment },
    { name: 'Supabase Connection', test: testSupabaseConnection },
    { name: 'Google Places API', test: testGooglePlacesAPI },
    { name: 'Network Connectivity', test: testNetworkConnectivity }
  ];
  
  let passedChecks = 0;
  let totalChecks = checks.length;
  
  for (const check of checks) {
    try {
      const result = await check.test();
      if (result) {
        passedChecks++;
      }
    } catch (error) {
      log('red', `❌ ${check.name} failed: ${error.message}`);
    }
  }
  
  console.log('===================================');
  
  if (passedChecks === totalChecks) {
    log('green', `🎉 All ${totalChecks} validation checks passed!`);
    log('green', '✅ Environment ready for Railway deployment');
    process.exit(0);
  } else {
    log('red', `❌ ${totalChecks - passedChecks} of ${totalChecks} checks failed`);
    log('red', '🚫 Environment not ready for deployment');
    
    log('yellow', '\n💡 Common fixes:');
    log('yellow', '   1. Update Supabase keys to new sb_secret_ format');
    log('yellow', '   2. Run database schema setup in Supabase dashboard');
    log('yellow', '   3. Enable Google Places API in Google Cloud Console');
    log('yellow', '   4. Verify all API keys are valid and not expired');
    
    process.exit(1);
  }
}

// Execute validation if run directly
if (require.main === module) {
  validateEnvironment().catch(error => {
    log('red', `❌ Validation failed: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { validateEnvironment };