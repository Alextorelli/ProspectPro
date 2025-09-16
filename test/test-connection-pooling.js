#!/usr/bin/env node

/**
 * Connection Pooling Test Suite
 * Validates Supabase connection pooling optimization for Railway deployment
 */

require('dotenv').config();

class ConnectionPoolingTester {
  constructor() {
    this.testResults = [];
  }

  async runAllTests() {
    console.log('🏊‍♀️ Testing Supabase Connection Pooling Configuration...\n');
    
    try {
      // Test 1: Configuration Detection
      await this.testConfigurationDetection();
      
      // Test 2: Connection Strategy Selection
      await this.testConnectionStrategy();
      
      // Test 3: Environment Variable Validation
      await this.testEnvironmentVariables();
      
      // Test 4: Connection Options
      await this.testConnectionOptions();
      
      // Print results
      this.printResults();
      
    } catch (error) {
      console.error('❌ Connection pooling test suite failed:', error.message);
      process.exit(1);
    }
  }

  async testConfigurationDetection() {
    console.log('📍 Test 1: Configuration Detection');
    
    try {
      const { connectionConfig } = require('../config/supabase');
      
      this.recordTest(
        'Configuration Export',
        connectionConfig !== undefined,
        `Connection config exported: ${connectionConfig ? 'Yes' : 'No'}`
      );
      
      if (connectionConfig) {
        this.recordTest(
          'Pooling Strategy Detection',
          connectionConfig.poolingStrategy !== undefined,
          `Strategy: ${connectionConfig.poolingStrategy}`
        );
        
        this.recordTest(
          'Railway Optimization',
          typeof connectionConfig.optimizedForRailway === 'boolean',
          `Railway optimized: ${connectionConfig.optimizedForRailway}`
        );
      }
      
    } catch (error) {
      this.recordTest('Configuration Detection', false, `Error: ${error.message}`);
    }
  }

  async testConnectionStrategy() {
    console.log('\n🎯 Test 2: Connection Strategy Selection');
    
    const originalEnv = { ...process.env };
    
    try {
      // Test Transaction Pooler preference
      process.env.SUPABASE_POOL_MODE = 'transaction';
      process.env.NODE_ENV = 'production';
      process.env.RAILWAY_ENVIRONMENT = 'production';
      
      // Clear module cache to reload config
      delete require.cache[require.resolve('../config/supabase')];
      const config1 = require('../config/supabase').connectionConfig;
      
      this.recordTest(
        'Transaction Pooler Selection',
        config1.poolingStrategy === 'transaction',
        `Selected: ${config1.poolingStrategy}`
      );
      
      // Test Session Pooler fallback
      process.env.SUPABASE_POOL_MODE = 'session';
      delete require.cache[require.resolve('../config/supabase')];
      const config2 = require('../config/supabase').connectionConfig;
      
      this.recordTest(
        'Session Pooler Fallback',
        config2.poolingStrategy === 'session',
        `Selected: ${config2.poolingStrategy}`
      );
      
    } catch (error) {
      this.recordTest('Connection Strategy', false, `Error: ${error.message}`);
    } finally {
      // Restore original environment
      Object.assign(process.env, originalEnv);
    }
  }

  async testEnvironmentVariables() {
    console.log('\n🔧 Test 3: Environment Variable Validation');
    
    const requiredForProduction = [
      'SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY'
    ];
    
    const optionalPoolingVars = [
      'SUPABASE_DATABASE_URL_TRANSACTION',
      'SUPABASE_DATABASE_URL_SESSION',
      'SUPABASE_POOL_MODE'
    ];
    
    requiredForProduction.forEach(envVar => {
      this.recordTest(
        `Required: ${envVar}`,
        !!process.env[envVar],
        process.env[envVar] ? 'Set' : 'Missing'
      );
    });
    
    optionalPoolingVars.forEach(envVar => {
      this.recordTest(
        `Optional: ${envVar}`,
        true,
        process.env[envVar] ? 'Configured' : 'Not set (using defaults)'
      );
    });
  }

  async testConnectionOptions() {
    console.log('\n⚙️  Test 4: Connection Options Validation');
    
    try {
      const { createOptimizedSupabaseClient } = require('../config/supabase');
      
      this.recordTest(
        'Optimized Client Export',
        typeof createOptimizedSupabaseClient === 'function',
        'Function exported successfully'
      );
      
      // Test client creation (without actual connection)
      if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        const testClient = createOptimizedSupabaseClient(
          process.env.SUPABASE_URL,
          process.env.SUPABASE_SERVICE_ROLE_KEY
        );
        
        this.recordTest(
          'Client Creation',
          testClient && testClient.constructor.name === 'SupabaseClient',
          'Client instance created successfully'
        );
      } else {
        this.recordTest(
          'Client Creation',
          true,
          'Skipped (no credentials available)'
        );
      }
      
    } catch (error) {
      this.recordTest('Connection Options', false, `Error: ${error.message}`);
    }
  }

  recordTest(name, passed, details) {
    const result = {
      name,
      passed,
      details
    };
    this.testResults.push(result);
    
    const icon = passed ? '✅' : '❌';
    console.log(`  ${icon} ${name}: ${details}`);
  }

  printResults() {
    console.log('\n📊 Connection Pooling Test Results:');
    console.log('=====================================');
    
    const passed = this.testResults.filter(t => t.passed).length;
    const total = this.testResults.length;
    
    console.log(`✅ Passed: ${passed}/${total}`);
    console.log(`❌ Failed: ${total - passed}/${total}`);
    
    if (passed === total) {
      console.log('\n🎉 All connection pooling tests passed!');
      console.log('🚀 Ready for Railway deployment with optimized Supabase connections');
    } else {
      console.log('\n⚠️  Some tests failed. Review configuration before deployment.');
    }
    
    console.log('\n💡 Recommendations:');
    console.log('- For Railway production: Use SUPABASE_POOL_MODE=transaction');
    console.log('- For IPv4 compatibility: Use SUPABASE_POOL_MODE=session');
    console.log('- For debugging: Use SUPABASE_POOL_MODE=direct');
  }
}

// Run tests if called directly
if (require.main === module) {
  const tester = new ConnectionPoolingTester();
  tester.runAllTests().catch(console.error);
}

module.exports = ConnectionPoolingTester;