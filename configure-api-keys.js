#!/usr/bin/env node

/**
 * ProspectPro API Key Configuration Script
 * 
 * Sets up the Supabase app_secrets table with optimized API keys
 * Ensures all production API keys are centrally managed and secured
 */

require('dotenv').config();
const { getSupabaseClient } = require('./config/supabase');

const API_KEYS = {
  // Core API Keys (Required for production)
  APOLLO_API_KEY: process.env.APOLLO_API_KEY || 'GQOnv7RMsT8uV6yy_IMhyQ', // Upgraded Basic Paid
  HUNTER_IO_API_KEY: process.env.HUNTER_IO_API_KEY || 'a8a4b8fe0c1b7b9b7e6f4f0ad61f5b8e8c4a80c1',
  GOOGLE_PLACES_API_KEY: process.env.GOOGLE_PLACES_API_KEY,
  NEVERBOUNCE_API_KEY: process.env.NEVERBOUNCE_API_KEY,
  
  // Supporting API Keys (Optional but recommended)
  FOURSQUARE_SERVICE_API_KEY: process.env.FOURSQUARE_SERVICE_API_KEY,
  SCRAPINGDOG_API_KEY: process.env.SCRAPINGDOG_API_KEY,
  ZEROBOUNCE_API_KEY: process.env.ZEROBOUNCE_API_KEY,
  
  // Government API Keys (Free but rate limited)
  SOCRATA_API_KEY: process.env.SOCRATA_API_KEY,
  CALIFORNIA_SOS_API_KEY: process.env.CALIFORNIA_SOS_API_KEY,
  USPTO_TSDR_API_KEY: process.env.USPTO_TSDR_API_KEY,
};

const SYSTEM_CONFIG = {
  // API Budget Management
  HUNTER_DAILY_BUDGET: '15.00',
  APOLLO_DAILY_BUDGET: '10.00',
  PER_LEAD_COST_LIMIT: '2.00',
  
  // Quality Thresholds
  MIN_EMAIL_CONFIDENCE: '75',
  MIN_BUSINESS_CONFIDENCE: '70',
  
  // Rate Limiting
  MAX_CONCURRENT_REQUESTS: '3',
  REQUEST_DELAY_MS: '1000',
};

async function configureAPIKeys() {
  console.log('🔧 ProspectPro API Key Configuration');
  console.log('=====================================\n');
  
  const supabase = getSupabaseClient();
  if (!supabase) {
    console.error('❌ Supabase client not available');
    console.error('   Please check SUPABASE_URL and SUPABASE_SECRET_KEY');
    process.exit(1);
  }
  
  let successCount = 0;
  let errorCount = 0;
  
  // Configure API Keys
  console.log('📊 API Keys Configuration:');
  console.log('-'.repeat(40));
  
  for (const [key, value] of Object.entries(API_KEYS)) {
    if (value && value !== 'your_api_key_here') {
      try {
        const { error } = await supabase
          .from('app_secrets')
          .upsert({ key, value }, { onConflict: 'key' });
        
        if (error) throw error;
        
        console.log(`✅ ${key}: ${value.substring(0, 8)}...`);
        successCount++;
      } catch (error) {
        console.error(`❌ ${key}: ${error.message}`);
        errorCount++;
      }
    } else {
      console.log(`⚠️  ${key}: Not configured`);
    }
  }
  
  // Configure System Settings
  console.log('\n⚙️  System Configuration:');
  console.log('-'.repeat(40));
  
  for (const [key, value] of Object.entries(SYSTEM_CONFIG)) {
    try {
      const { error } = await supabase
        .from('app_secrets')
        .upsert({ key, value }, { onConflict: 'key' });
      
      if (error) throw error;
      
      console.log(`✅ ${key}: ${value}`);
      successCount++;
    } catch (error) {
      console.error(`❌ ${key}: ${error.message}`);
      errorCount++;
    }
  }
  
  // Configuration Summary
  console.log('\n📋 Configuration Summary:');
  console.log('='.repeat(40));
  console.log(`✅ Successfully configured: ${successCount}`);
  console.log(`❌ Configuration errors: ${errorCount}`);
  
  if (errorCount === 0) {
    console.log('\n🎉 All API keys and settings configured successfully!');
    console.log('🚀 ProspectPro is ready for production deployment.');
  } else {
    console.log('\n⚠️  Some configurations failed. Please review and fix errors.');
  }
  
  // Validation
  await validateConfiguration();
}

async function validateConfiguration() {
  console.log('\n🔍 Configuration Validation:');
  console.log('-'.repeat(40));
  
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('app_secrets')
    .select('key, value')
    .in('key', Object.keys(API_KEYS));
  
  if (error) {
    console.error('❌ Validation failed:', error.message);
    return;
  }
  
  // Check critical API keys
  const criticalKeys = ['APOLLO_API_KEY', 'HUNTER_IO_API_KEY', 'GOOGLE_PLACES_API_KEY'];
  const configuredKeys = data.map(row => row.key);
  
  for (const key of criticalKeys) {
    if (configuredKeys.includes(key)) {
      console.log(`✅ ${key}: Configured`);
    } else {
      console.log(`❌ ${key}: Missing (Critical)`);
    }
  }
  
  console.log(`\n📊 Total configured keys: ${configuredKeys.length}/${Object.keys(API_KEYS).length}`);
}

// Run configuration if called directly
if (require.main === module) {
  configureAPIKeys()
    .then(() => {
      console.log('\n✨ Configuration complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n🔥 Configuration failed:', error);
      process.exit(1);
    });
}

module.exports = { configureAPIKeys, API_KEYS, SYSTEM_CONFIG };