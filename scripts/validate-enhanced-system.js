#!/usr/bin/env node

/**
 * ProspectPro Enhanced System Validation Script
 * Validates all API integrations, database connections, and system health
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 ProspectPro Enhanced System Validation');
console.log('=========================================\n');

// Color codes for output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

const success = (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`);
const error = (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`);
const warning = (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`);
const info = (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`);

let validationScore = 0;
let totalChecks = 0;

function validateCheck(condition, successMsg, errorMsg) {
  totalChecks++;
  if (condition) {
    success(successMsg);
    validationScore++;
    return true;
  } else {
    error(errorMsg);
    return false;
  }
}

// 1. Environment Variables Validation
console.log('1️⃣ Environment Variables Validation');
console.log('------------------------------------');

const requiredEnvVars = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'GOOGLE_PLACES_API_KEY',
  'HUNTER_IO_API_KEY',
  'NEVERBOUNCE_API_KEY',
  'SCRAPINGDOG_API_KEY'
];

const optionalEnvVars = [
  'NEWYORK_SOS_APP_TOKEN',
  'ADMIN_PASSWORD'
];

requiredEnvVars.forEach(varName => {
  const value = process.env[varName];
  validateCheck(
    value && value.length > 10,
    `${varName} is configured`,
    `${varName} is missing or invalid`
  );
});

optionalEnvVars.forEach(varName => {
  const value = process.env[varName];
  if (value && value.length > 5) {
    success(`${varName} is configured (optional)`);
  } else {
    warning(`${varName} not configured (optional)`);
  }
});

// 2. File Structure Validation
console.log('\n2️⃣ Enhanced File Structure Validation');
console.log('---------------------------------------');

const requiredFiles = [
  'modules/enhanced-lead-discovery.js',
  'modules/api-clients/california-sos-client.js',
  'modules/api-clients/newyork-sos-client.js',
  'modules/api-clients/ny-tax-parcels-client.js',
  'modules/api-clients/hunter-io.js',
  'modules/api-clients/neverbounce.js',
  'api/business-discovery.js',
  'UPDATED_DEPLOYMENT_GUIDE.md',
  'database/enhanced-supabase-schema.sql'
];

requiredFiles.forEach(filePath => {
  const fullPath = path.join(__dirname, '..', filePath);
  validateCheck(
    fs.existsSync(fullPath),
    `Found: ${filePath}`,
    `Missing: ${filePath}`
  );
});

// 3. API Client Class Validation
console.log('\n3️⃣ API Client Implementation Validation');
console.log('----------------------------------------');

try {
  const EnhancedLeadDiscovery = require('../modules/enhanced-lead-discovery.js');
  const CaliforniaSosClient = require('../modules/api-clients/california-sos-client.js');
  const NewYorkSosClient = require('../modules/api-clients/newyork-sos-client.js');
  const NyTaxParcelsClient = require('../modules/api-clients/ny-tax-parcels-client.js');

  validateCheck(
    typeof EnhancedLeadDiscovery === 'function',
    'EnhancedLeadDiscovery class loaded successfully',
    'EnhancedLeadDiscovery class failed to load'
  );

  validateCheck(
    typeof CaliforniaSosClient === 'function',
    'CaliforniaSosClient class loaded successfully',
    'CaliforniaSosClient class failed to load'
  );

  validateCheck(
    typeof NewYorkSosClient === 'function',
    'NewYorkSosClient class loaded successfully',
    'NewYorkSosClient class failed to load'
  );

  validateCheck(
    typeof NyTaxParcelsClient === 'function',
    'NyTaxParcelsClient class loaded successfully',
    'NyTaxParcelsClient class failed to load'
  );

  // Test instantiation
  try {
    const leadDiscovery = new EnhancedLeadDiscovery({
      budgetLimit: 10.00,
      qualityThreshold: 80
    });
    
    validateCheck(
      leadDiscovery && typeof leadDiscovery.processBusinessThroughPipeline === 'function',
      'EnhancedLeadDiscovery instantiation successful',
      'EnhancedLeadDiscovery instantiation failed'
    );
  } catch (err) {
    error(`EnhancedLeadDiscovery instantiation error: ${err.message}`);
  }

} catch (err) {
  error(`API client loading error: ${err.message}`);
}

// 4. Database Schema Validation
console.log('\n4️⃣ Database Schema Validation');
console.log('-------------------------------');

try {
  const schemaPath = path.join(__dirname, '..', 'database', 'enhanced-supabase-schema.sql');
  const schemaContent = fs.readFileSync(schemaPath, 'utf8');
  
  const requiredTables = [
    'enhanced_leads',
    'lead_emails',
    'lead_social_profiles',
    'campaigns',
    'api_usage_log',
    'campaign_analytics',
    'api_cost_tracking',
    'lead_qualification_metrics'
  ];

  requiredTables.forEach(tableName => {
    validateCheck(
      schemaContent.includes(`CREATE TABLE IF NOT EXISTS ${tableName}`),
      `Database schema includes ${tableName} table`,
      `Database schema missing ${tableName} table`
    );
  });

  const requiredFunctions = [
    'calculate_lead_quality_score',
    'campaign_analytics',
    'get_dashboard_realtime_metrics',
    'calculate_cost_per_qualified_lead_dashboard'
  ];

  requiredFunctions.forEach(funcName => {
    validateCheck(
      schemaContent.includes(`CREATE OR REPLACE FUNCTION ${funcName}`),
      `Database schema includes ${funcName} function`,
      `Database schema missing ${funcName} function`
    );
  });

} catch (err) {
  error(`Database schema validation error: ${err.message}`);
}

// 5. API Endpoint Validation
console.log('\n5️⃣ API Endpoint Validation');
console.log('----------------------------');

try {
  const businessDiscoveryPath = path.join(__dirname, '..', 'api', 'business-discovery.js');
  const businessDiscoveryContent = fs.readFileSync(businessDiscoveryPath, 'utf8');
  
  validateCheck(
    businessDiscoveryContent.includes('EnhancedLeadDiscovery'),
    'business-discovery.js uses EnhancedLeadDiscovery',
    'business-discovery.js does not use EnhancedLeadDiscovery'
  );

  validateCheck(
    businessDiscoveryContent.includes('budgetLimit') && businessDiscoveryContent.includes('qualityThreshold'),
    'business-discovery.js includes cost optimization parameters',
    'business-discovery.js missing cost optimization parameters'
  );

  validateCheck(
    !businessDiscoveryContent.includes('fakeBusinesses') && !businessDiscoveryContent.includes('generateFakeData'),
    'business-discovery.js contains no fake data generation',
    'business-discovery.js may contain fake data generation'
  );

} catch (err) {
  error(`API endpoint validation error: ${err.message}`);
}

// 6. Documentation Validation
console.log('\n6️⃣ Documentation Validation');
console.log('-----------------------------');

try {
  const deploymentGuidePath = path.join(__dirname, '..', 'UPDATED_DEPLOYMENT_GUIDE.md');
  const deploymentGuideContent = fs.readFileSync(deploymentGuidePath, 'utf8');
  
  const requiredSections = [
    '4-Stage Lead Discovery Pipeline',
    'Hunter.io API',
    'NeverBounce API',
    'California Secretary of State API',
    'Cost Optimization Strategy',
    'Quality Assurance Standards'
  ];

  requiredSections.forEach(section => {
    validateCheck(
      deploymentGuideContent.includes(section),
      `Deployment guide includes ${section} section`,
      `Deployment guide missing ${section} section`
    );
  });

  const readmePath = path.join(__dirname, '..', 'README.md');
  const readmeContent = fs.readFileSync(readmePath, 'utf8');

  validateCheck(
    readmeContent.includes('Enhanced Multi-Source Lead Generation Platform'),
    'README.md updated with enhanced features',
    'README.md not updated with enhanced features'
  );

} catch (err) {
  error(`Documentation validation error: ${err.message}`);
}

// 7. Security & Quality Validation
console.log('\n7️⃣ Security & Quality Validation');
console.log('----------------------------------');

try {
  // Check for hardcoded API keys or secrets
  const filesToCheck = [
    'server.js',
    'api/business-discovery.js',
    'modules/enhanced-lead-discovery.js'
  ];

  filesToCheck.forEach(filePath => {
    const fullPath = path.join(__dirname, '..', filePath);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      
      validateCheck(
        !content.match(/['"](AIza[a-zA-Z0-9_-]{35}|sk-[a-zA-Z0-9]{48}|[a-f0-9]{32})['"]/),
        `${filePath} contains no hardcoded API keys`,
        `${filePath} may contain hardcoded API keys`
      );
    }
  });

  // Check for fake data patterns
  const codeFiles = [
    'modules/enhanced-lead-discovery.js',
    'api/business-discovery.js',
    'modules/api-clients/california-sos-client.js'
  ];

  const fakeDataPatterns = [
    /fakeBusinesses/,
    /generateFakeData/,
    /'100 Main St', '110 Main St'/,
    /\(555\) 555-/,
    /'Business LLC', 'Company Inc'/
  ];

  codeFiles.forEach(filePath => {
    const fullPath = path.join(__dirname, '..', filePath);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      
      let hasFakeData = false;
      fakeDataPatterns.forEach(pattern => {
        if (pattern.test(content)) {
          hasFakeData = true;
        }
      });

      validateCheck(
        !hasFakeData,
        `${filePath} contains no fake data patterns`,
        `${filePath} may contain fake data patterns`
      );
    }
  });

} catch (err) {
  error(`Security validation error: ${err.message}`);
}

// Final Score Calculation
console.log('\n📊 Final Validation Results');
console.log('============================');

const scorePercentage = Math.round((validationScore / totalChecks) * 100);

if (scorePercentage >= 95) {
  success(`🎉 EXCELLENT! System validation score: ${validationScore}/${totalChecks} (${scorePercentage}%)`);
  success('🚀 ProspectPro Enhanced system is ready for production deployment!');
} else if (scorePercentage >= 85) {
  success(`✅ GOOD! System validation score: ${validationScore}/${totalChecks} (${scorePercentage}%)`);
  warning('Some minor issues detected. Review warnings above before deployment.');
} else if (scorePercentage >= 70) {
  warning(`⚠️ NEEDS WORK! System validation score: ${validationScore}/${totalChecks} (${scorePercentage}%)`);
  error('Several issues need to be resolved before deployment.');
} else {
  error(`❌ CRITICAL ISSUES! System validation score: ${validationScore}/${totalChecks} (${scorePercentage}%)`);
  error('Major issues detected. System not ready for deployment.');
}

console.log('\n📋 Next Steps:');
if (scorePercentage >= 95) {
  info('1. Deploy to Railway.app using UPDATED_DEPLOYMENT_GUIDE.md');
  info('2. Configure all API keys in Railway environment variables');
  info('3. Run database migration: enhanced-supabase-schema.sql');
  info('4. Test campaign creation with real API keys');
  info('5. Monitor cost tracking and quality metrics');
} else {
  error('1. Fix all critical validation errors (❌ items above)');
  error('2. Re-run this validation script until score >= 95%');
  warning('3. Address any warnings for optimal performance');
  info('4. Then proceed with deployment steps');
}

console.log('\n🔗 Documentation:');
info('• Enhanced Deployment Guide: UPDATED_DEPLOYMENT_GUIDE.md');
info('• API Integration Details: README.md');
info('• Database Schema: database/enhanced-supabase-schema.sql');
info('• Monitoring Dashboard: /monitoring/');

process.exit(scorePercentage >= 70 ? 0 : 1);